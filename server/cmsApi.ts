import { Router, Request, Response, NextFunction } from 'express';
import {
  listAllDocuments,
  getDocumentBySlug,
  saveUnifiedDocument,
  rollbackUnifiedDocument,
  resolveDirectSlugRedirect,
  checkDbConnection,
  getDocumentRevisions,
} from './db/cmsDb';
import { DocumentInputSchema, DocumentKind } from '../src/types/cms';
import { getDraftPreviewToken, requireAdmin } from './security/adminAuth';
import { getSiteUrl } from './seoEngine';
import { maybeAutoPublishCmsDocument } from './services/socialPublishService';

export const cmsRouter = Router();

// Admin authentication and draft-preview token live in ./security/adminAuth
export { getDraftPreviewToken };
export const requireAdminAuth = requireAdmin;

// ==========================================
// 1. PUBLIC STOREFRONT & HEALTH ENDPOINTS
// ==========================================

/**
 * GET /api/cms/health
 * Public health check returning DB status and latency
 */
cmsRouter.get('/cms/health', async (_req: Request, res: Response) => {
  const health = await checkDbConnection();
  const isProdDown = process.env.NODE_ENV === 'production' && !health.connected;
  return res.status(isProdDown ? 503 : 200).json({
    success: !isProdDown,
    persistent: health.connected,
    ...health,
  });
});

/**
 * GET /api/documents
 * Returns only published, non-noindexed documents for public consumer views
 */
cmsRouter.get('/documents', async (req: Request, res: Response) => {
  try {
    const kind = (req.query.kind as DocumentKind) || 'all';
    const documents = await listAllDocuments(kind, false);
    return res.json({ success: true, data: documents, documents });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error listing documents' });
  }
});

/**
 * GET /api/documents/:slug
 * Resolves document by slug; enforces 404 for DRAFTs unless valid preview_token is supplied
 */
cmsRouter.get('/documents/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const kind = req.query.kind as DocumentKind | undefined;
    const previewToken = (req.query.token || req.query.preview_token) as string | undefined;

    const isPreview = Boolean(previewToken) && previewToken === getDraftPreviewToken();
    const document = await getDocumentBySlug(slug, kind, isPreview);

    if (!document) {
      // Check if this slug is an old_slug that needs a 301 redirect
      const redirectUrl = await resolveDirectSlugRedirect(slug);
      if (redirectUrl) {
        return res.status(301).json({ redirect: redirectUrl });
      }
      return res.status(404).json({ error: 'Document not found' });
    }

    // If viewing draft via signed preview token, enforce non-caching headers
    if (document.status === 'DRAFT') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Referrer-Policy', 'no-referrer');
    }

    return res.json({ success: true, data: document, document });
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error retrieving document' });
  }
});

// ==========================================
// 2. ADMIN CMS ENDPOINTS (SECURED)
// ==========================================

/**
 * GET /api/admin/documents
 * Lists all documents (both published and drafts)
 */
cmsRouter.get('/admin/documents', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const kind = (req.query.kind as DocumentKind) || 'all';
    const documents = await listAllDocuments(kind, true);
    return res.json({ success: true, data: documents, documents });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message, code: err.code || 'CMS_PG_UNAVAILABLE' });
    }
    return res.status(500).json({ error: 'Internal server error listing admin documents' });
  }
});

/**
 * POST /api/admin/documents
 * Creates a document with Zod schema validation & OCC (409 Conflict)
 */
cmsRouter.post('/admin/documents', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const parseResult = DocumentInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'ValidationError',
        details: parseResult.error.format(),
      });
    }

    const docInput = parseResult.data;
    const userIdentifier = (req.headers['x-admin-user'] as string) || 'admin';

    const savedDoc = await saveUnifiedDocument(docInput as any, 'ADMIN', userIdentifier);
    if (savedDoc.status === 'PUBLISHED' && !savedDoc.noindex) {
      void maybeAutoPublishCmsDocument(savedDoc, getSiteUrl(req)).catch((err) => {
        console.warn('[CMS:SocialAutoPublish]', err?.message || err);
      });
    }
    return res.status(201).json({ success: true, data: savedDoc, document: savedDoc });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message, code: err.code || 'CMS_PG_UNAVAILABLE' });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message, code: 'OCC_CONFLICT' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('[CMS:API] Error saving document:', err);
    return res.status(500).json({ error: 'Internal server error saving document' });
  }
});

/**
 * PUT /api/admin/documents/:id
 * Updates an existing document with OCC version validation
 */
cmsRouter.put('/admin/documents/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const docInput = { ...req.body, id: req.params.id };
    const userIdentifier = (req.headers['x-admin-user'] as string) || 'admin';

    const savedDoc = await saveUnifiedDocument(docInput as any, 'ADMIN', userIdentifier);
    if (savedDoc.status === 'PUBLISHED' && !savedDoc.noindex) {
      void maybeAutoPublishCmsDocument(savedDoc, getSiteUrl(req)).catch((err) => {
        console.warn('[CMS:SocialAutoPublish]', err?.message || err);
      });
    }
    return res.status(200).json({ success: true, data: savedDoc, document: savedDoc });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message, code: err.code || 'CMS_PG_UNAVAILABLE' });
    }
    if (err.statusCode === 409) {
      return res.status(409).json({ error: err.message, code: 'OCC_CONFLICT' });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('[CMS:API] Error updating document:', err);
    return res.status(500).json({ error: 'Internal server error updating document' });
  }
});

/**
 * POST /api/admin/documents/:id/preview-token
 * Generates signed draft preview token for secure previewing
 */
cmsRouter.post('/admin/documents/:id/preview-token', requireAdminAuth, async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      previewToken: getDraftPreviewToken(),
      expiresIn: 3600
    }
  });
});

/**
 * GET /api/admin/documents/:id/revisions
 * Returns up to 10 stored historical snapshots for a document
 */
cmsRouter.get('/admin/documents/:id/revisions', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const revisions = await getDocumentRevisions(req.params.id);
    return res.json({ success: true, data: revisions });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message, code: err.code || 'CMS_PG_UNAVAILABLE' });
    }
    return res.status(500).json({ error: 'Failed to retrieve document revisions' });
  }
});

/**
 * POST /api/admin/documents/:id/rollback
 * Rolls back a document to a specific previous version
 */
cmsRouter.post('/admin/documents/:id/rollback', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    const targetVersion = parseInt(req.body.version, 10);

    if (isNaN(targetVersion) || targetVersion <= 0) {
      return res.status(400).json({ error: 'Invalid version number for rollback' });
    }

    const restoredDoc = await rollbackUnifiedDocument(documentId, targetVersion, 'ADMIN');
    return res.json({ success: true, data: restoredDoc, document: restoredDoc });
  } catch (err: any) {
    if (err.statusCode === 503) {
      return res.status(503).json({ error: err.message, code: err.code || 'CMS_PG_UNAVAILABLE' });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to rollback document' });
  }
});

/**
 * GET /api/admin/db-health
 * Diagnostic check for PostgreSQL / Liara connectivity
 */
cmsRouter.get('/admin/db-health', requireAdminAuth, async (_req: Request, res: Response) => {
  const health = await checkDbConnection();
  const isProdDown = process.env.NODE_ENV === 'production' && !health.connected;
  return res.status(isProdDown ? 503 : 200).json({
    success: !isProdDown,
    persistent: health.connected,
    ...health,
  });
});
