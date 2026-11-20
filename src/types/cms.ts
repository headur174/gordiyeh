import { z } from 'zod';

export type DocumentKind = 'article' | 'page';
export type DocumentStatus = 'DRAFT' | 'PUBLISHED';
export type TextColorToken = 'default' | 'accent' | 'secondary' | 'muted' | 'warning';

export interface BaseBlock {
  id: string;
  schemaVersion: 1;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 2 | 3 | 4; // H1 is strictly the document title
  text: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  // Allowed inline HTML strictly restricted to: <a>, <strong>, <em>, <br>, <bdi>
  html: string;
  colorToken?: TextColorToken;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  ordered: boolean; // true = <ol>, false = <ul>
  items: string[];
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  alt: string; // Required for accessibility and SEO
  width: number; // Server-read via sharp to eliminate Cumulative Layout Shift (CLS)
  height: number;
  caption?: string;
}

export interface ProductCardBlock extends BaseBlock {
  type: 'product_card';
  productId: string; // Dynamic resolution; auto-hidden if missing
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  intent: 'info' | 'warning' | 'tip';
  title?: string;
  text: string;
}

export type ContentBlock = 
  | HeadingBlock 
  | ParagraphBlock 
  | ListBlock 
  | ImageBlock 
  | ProductCardBlock 
  | CalloutBlock;

export interface UnifiedDocument {
  id: string;
  kind: DocumentKind; // 'article' | 'page'
  slug: string;
  title: string;
  status: DocumentStatus;
  version: number; // Monotonically increasing integer for OCC (409 Conflict)
  blocks: ContentBlock[];
  derivedPlainText: string; // Derived automatically on save for search and fallbacks
  seoTitle?: string;
  seoDescription?: string;
  author: string;
  coverImage?: string;
  canonicalUrl?: string; // Validated absolute URL
  noindex: boolean;
  publishedAt?: string;
  updatedAt: string;
  contentModifiedAt: string; // Updated ONLY when blocks or text change
}

export interface DocumentRevision {
  id: string;
  documentId: string;
  version: number;
  snapshotJson: string;
  savedBy: string;
  savedAt: string;
}

export interface SlugHistoryEntry {
  oldSlug: string;
  documentId: string;
  createdAt: string;
}

// Zod Validation Schemas
export const HeadingBlockSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(1).max(300),
});

export const ParagraphBlockSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  type: z.literal('paragraph'),
  html: z.string().min(1).max(20000),
  colorToken: z.enum(['default', 'accent', 'secondary', 'muted', 'warning']).optional(),
});

export const ListBlockSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  type: z.literal('list'),
  ordered: z.boolean(),
  items: z.array(z.string().min(1).max(500)).min(1).max(50),
});

export const ImageBlockSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  type: z.literal('image'),
  url: z.string().min(1).max(2000),
  alt: z.string().min(1).max(300),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().max(500).optional(),
});

export const ProductCardBlockSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  type: z.literal('product_card'),
  productId: z.string().min(1).max(100),
});

export const CalloutBlockSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  type: z.literal('callout'),
  intent: z.enum(['info', 'warning', 'tip']),
  title: z.string().max(200).optional(),
  text: z.string().min(1).max(2000),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
  ImageBlockSchema,
  ProductCardBlockSchema,
  CalloutBlockSchema,
]);

export const DocumentInputSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(['article', 'page']),
  slug: z.string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist solely of lowercase English alphanumeric characters separated by single hyphens'),
  title: z.string().min(2).max(250),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  version: z.number().int().min(0).optional(),
  blocks: z.array(ContentBlockSchema),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  author: z.string().min(2).max(100).default('گُردیه'),
  coverImage: z.string().max(2000).optional(),
  canonicalUrl: z.string().url().max(1000).optional().or(z.literal('')),
  noindex: z.boolean().default(false),
});

/**
 * Safe Persian text normalizer:
 * - Converts Arabic ي to ی and ك to ک
 * - Converts Arabic numerals to Persian numerals in prose (preserves SKUs and models like 4K)
 * - Trims consecutive whitespaces and eliminates boundary ZWNJ artifacts
 * - Does NOT aggressively auto-inject ZWNJ to prevent unwanted character splits
 */
export function normalizePersianText(input: string): string {
  if (!input) return '';

  let normalized = input
    // Arabic yeh and kaf to Persian
    .replace(/\u064A/g, '\u06CC') // ي -> ی
    .replace(/\u0643/g, '\u06A9') // ك -> ک
    // Arabic numerals to Persian
    .replace(/\u0660/g, '۰')
    .replace(/\u0661/g, '۱')
    .replace(/\u0662/g, '۲')
    .replace(/\u0663/g, '۳')
    .replace(/\u0664/g, '۴')
    .replace(/\u0665/g, '۵')
    .replace(/\u0666/g, '۶')
    .replace(/\u0667/g, '۷')
    .replace(/\u0668/g, '۸')
    .replace(/\u0669/g, '۹')
    // Remove repeated spaces
    .replace(/[ \t]+/g, ' ')
    // Remove stray ZWNJ at word boundaries
    .replace(/\u200C+/g, '\u200C')
    .replace(/(^\u200C|\u200C$)/g, '');

  return normalized.trim();
}

/**
 * Strict server-side HTML sanitizer for inline paragraph and callout text
 * Allows ONLY: <a>, <strong>, <em>, <br>, <bdi>
 * Enforces secure attributes on <a> (https/internal only, rel="noopener noreferrer")
 */
export function sanitizeInlineHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  // Escape dangerous script, style, event handlers, and images/iframes
  let clean = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

  // Match and validate anchor tags: <a href="...">
  clean = clean.replace(/<a\b([^>]*)>(.*?)<\/a>/gi, (_match, attrs, content) => {
    const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = hrefMatch ? (hrefMatch[1] || hrefMatch[2] || hrefMatch[3] || '') : '';
    
    // Allow only internal paths (/...) or safe https:// URLs
    const isSafe = href.startsWith('/') || href.startsWith('https://');
    if (!isSafe) {
      return content; // Strip the tag but keep content
    }

    const isExternal = href.startsWith('https://');
    const relAttr = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
    return `<a href="${href}"${relAttr} class="text-[var(--accent-primary)] hover:underline">${content}</a>`;
  });

  // Preserve only safe tags: strong, em, br, bdi (strip arbitrary attributes for security)
  clean = clean
    .replace(/<strong\b[^>]*>/gi, '<strong>')
    .replace(/<em\b[^>]*>/gi, '<em>')
    .replace(/<bdi\b[^>]*>/gi, '<bdi>')
    .replace(/<br\b[^>]*\/?>/gi, '<br />')
    .replace(/<(?!\/?(strong|em|br|bdi|a)\b)[^>]+>/gi, '');

  return clean;
}

/**
 * Derives clean plain text from an array of blocks for search index and SEO descriptions
 */
export function derivePlainTextFromBlocks(blocks: ContentBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      parts.push(block.text);
    } else if (block.type === 'paragraph') {
      // Strip tags for plain text representation
      const plain = block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plain) parts.push(plain);
    } else if (block.type === 'list') {
      parts.push(block.items.join('. '));
    } else if (block.type === 'callout') {
      if (block.title) parts.push(block.title);
      parts.push(block.text);
    } else if (block.type === 'image' && block.alt) {
      parts.push(block.alt);
    }
  }

  return parts.join('\n\n').trim();
}
