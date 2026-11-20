// Comprehensive automated test suite for GORDIYEH CMS & SEO Engine
// Tests all 10 acceptance criteria from the approved plan

import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { sanitizeInlineHtml, normalizePersianText, ContentBlock } from './src/types/cms';

const PORT = process.env.PORT || '8080';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ADMIN_TOKEN = 'gordiyeh_supervisor_secret_token_2025';

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  let json: any = null;
  let text = '';
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    json = await res.json().catch(() => null);
  } else {
    text = await res.text().catch(() => '');
  }
  return { status: res.status, headers: res.headers, json, text };
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🚀 RUNNING GORDIYEH CMS & SEO AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function check(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message || err);
      failed++;
    }
  }

  // 1. Health & Database check
  await check('1. DB Connection & Health Check', async () => {
    const res = await request('/api/cms/health');
    assert.strictEqual(res.status, 200, 'Health endpoint should return 200');
    assert.strictEqual(res.json?.success, true);
    assert.ok(typeof res.json?.latencyMs === 'number', 'Latency should be a number');
    console.log(`   Database driver: ${res.json.driver}, latency: ${res.json.latencyMs}ms`);
  });

  // 2. Auth Guard
  await check('2. Admin Auth Guard (401 on missing auth)', async () => {
    const res = await request('/api/admin/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Non-auth test' })
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated POST to /api/admin/documents must return 401');
  });

  // 3. Document Creation with all 6 blocks
  let createdDocId = '';
  const initialSlug = `test-article-${Date.now()}`;
  await check('3. Unified Document Creation with 6 Content Blocks', async () => {
    const sampleBlocks: ContentBlock[] = [
      { id: 'b1', schemaVersion: 1, type: 'heading', level: 2, text: 'بررسی مشخصات فنی و ساختار آلیاژی' },
      { id: 'b2', schemaVersion: 1, type: 'paragraph', html: 'متن پاراگراف با <strong class="text-white">تاکید قوی</strong> و لینک به <a href="/category/digital">کالای دیجیتال</a>.', colorToken: 'default' },
      { id: 'b3', schemaVersion: 1, type: 'list', ordered: false, items: ['آلیاژ آلومینیوم سری ۶۰۰۰', 'دقت ماشین‌کاری ۰.۰۱ میلی‌متر', 'سیستم خنک‌کننده مس دوبل'] },
      { id: 'b4', schemaVersion: 1, type: 'image', url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c', alt: 'پروژکتور هوشمند گُردیه در محیط آزمایشگاه', width: 800, height: 600, caption: 'تصویر تست قطعه' },
      { id: 'b5', schemaVersion: 1, type: 'product_card', productId: 'prod_ported_projector' },
      { id: 'b6', schemaVersion: 1, type: 'callout', intent: 'tip', title: 'نکته کلیدی', text: 'پیش از روشن‌کردن، از برقراری تهویه مناسب مطمئن شوید.' }
    ];

    const res = await request('/api/admin/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        kind: 'article',
        slug: initialSlug,
        title: 'مقاله تست یکپارچگی استودیو محتوای گُردیه',
        status: 'PUBLISHED',
        blocks: sampleBlocks,
        seoTitle: 'تست سئو مقاله آزمایشی',
        seoDescription: 'توضیحات متای تست برای ارزیابی خروجی تگ‌های سئو و سرور',
        author: 'تیم مهندسی گُردیه',
        noindex: false
      })
    });

    assert.strictEqual(res.status, 201, `Document creation failed with status ${res.status}`);
    assert.strictEqual(res.json?.success, true);
    assert.strictEqual(res.json?.data?.slug, initialSlug);
    assert.strictEqual(res.json?.data?.version, 1);
    assert.strictEqual(res.json?.data?.blocks?.length, 6);
    createdDocId = res.json?.data?.id;
    assert.ok(createdDocId, 'Created document must have an ID');
  });

  // 4. Draft Leak Guard (Public 404, excluded from list and sitemap)
  let draftDocId = '';
  const draftSlug = `draft-secret-${Date.now()}`;
  await check('4. Draft Leak Guard (404 on public route & excluded from list/sitemap)', async () => {
    // Create draft document
    const createRes = await request('/api/admin/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        kind: 'article',
        slug: draftSlug,
        title: 'پیش‌نویس محرمانه مقاله‌ای که هنوز منتشر نشده',
        status: 'DRAFT',
        blocks: [
          { id: 'd1', schemaVersion: 1, type: 'heading', level: 2, text: 'تیتر پیش‌نویس' },
          { id: 'd2', schemaVersion: 1, type: 'paragraph', html: 'این محتوا نباید عمومی شود.' }
        ],
        author: 'ناظر سیستم',
        noindex: true
      })
    });

    assert.strictEqual(createRes.status, 201);
    draftDocId = createRes.json?.data?.id;

    // A: Public direct fetch without token must be 404
    const pubRes = await request(`/api/documents/${draftSlug}`);
    assert.strictEqual(pubRes.status, 404, 'Draft must return 404 on public route');

    // B: Public document list must NOT contain the draft slug
    const listRes = await request('/api/documents?kind=article');
    assert.strictEqual(listRes.status, 200);
    const inList = listRes.json?.data?.some((d: any) => d.slug === draftSlug);
    assert.strictEqual(inList, false, 'Draft must not appear in public documents list');

    // C: Sitemap XML must NOT contain draft slug
    const sitemapRes = await request('/sitemap.xml');
    assert.strictEqual(sitemapRes.status, 200);
    assert.ok(!sitemapRes.text.includes(draftSlug), 'Sitemap must not contain draft slug');
  });

  // 5. Signed Draft Preview Token
  await check('5. Signed Draft Preview Token Access', async () => {
    // Generate preview token
    const tokenRes = await request(`/api/admin/documents/${draftDocId}/preview-token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    assert.strictEqual(tokenRes.status, 200);
    const previewToken = tokenRes.json?.data?.previewToken;
    assert.ok(previewToken, 'Should return a preview token');

    // Fetch with preview token
    const previewRes = await request(`/api/documents/${draftSlug}?token=${previewToken}`);
    assert.strictEqual(previewRes.status, 200, 'Fetching draft with valid token must succeed');
    assert.strictEqual(previewRes.json?.data?.slug, draftSlug);
    const cacheControl = previewRes.headers.get('cache-control');
    assert.ok(cacheControl?.includes('no-store'), 'Draft preview must specify Cache-Control: no-store');
  });

  // 6. Optimistic Concurrency Control (OCC) - 409 Conflict & Version Rollback
  await check('6. Optimistic Concurrency Control (409 Conflict)', async () => {
    // Attempt update with mismatched version 999
    const staleUpdate = await request(`/api/admin/documents/${createdDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        title: 'تلاش آپدیت با نسخه کهنه',
        version: 999, // stale expected version
      })
    });
    assert.strictEqual(staleUpdate.status, 409, 'Stale version must return 409 Conflict');
    assert.strictEqual(staleUpdate.json?.code, 'OCC_CONFLICT');

    // Valid update with current version 1 -> advances to version 2
    const validUpdate = await request(`/api/admin/documents/${createdDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        title: 'عنوان بروزرسانی‌شده نسخه دوم',
        version: 1,
      })
    });
    assert.strictEqual(validUpdate.status, 200);
    assert.strictEqual(validUpdate.json?.data?.version, 2);

    // Verify revisions history endpoint
    const revsRes = await request(`/api/admin/documents/${createdDocId}/revisions`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    assert.strictEqual(revsRes.status, 200);
    assert.ok(Array.isArray(revsRes.json?.data), 'Revisions must be an array');
    assert.ok(revsRes.json?.data?.length >= 2, 'Should have at least 2 revisions saved');
  });

  // 7. Slug History & Direct 301 Redirection (No redirect chains)
  await check('7. Slug History & Direct 301 Redirection without chains', async () => {
    const slugV2 = `${initialSlug}-v2`;
    const slugV3 = `${initialSlug}-v3`;

    // Step A: Update slug to V2
    const updateV2 = await request(`/api/admin/documents/${createdDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        slug: slugV2,
        version: 2
      })
    });
    assert.strictEqual(updateV2.status, 200);

    // Step B: Update slug to V3
    const updateV3 = await request(`/api/admin/documents/${createdDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: JSON.stringify({
        slug: slugV3,
        version: 3
      })
    });
    assert.strictEqual(updateV3.status, 200);

    // Step C: Request old initialSlug -> must redirect directly to slugV3 (301)
    const redirectRes1 = await fetch(`${BASE_URL}/blog/${initialSlug}`, { redirect: 'manual' });
    assert.strictEqual(redirectRes1.status, 301, 'Old slug must issue 301 permanent redirect');
    const loc1 = redirectRes1.headers.get('location') || '';
    assert.ok(loc1.endsWith(`/blog/${slugV3}`), `Direct redirect expected to /blog/${slugV3}, got ${loc1}`);

    // Step D: Request slugV2 -> must also redirect directly to slugV3 (301)
    const redirectRes2 = await fetch(`${BASE_URL}/blog/${slugV2}`, { redirect: 'manual' });
    assert.strictEqual(redirectRes2.status, 301);
    const loc2 = redirectRes2.headers.get('location') || '';
    assert.ok(loc2.endsWith(`/blog/${slugV3}`), `Direct redirect expected to /blog/${slugV3}, got ${loc2}`);
  });

  // 8. Safe Persian Normalization & XSS Sanitization
  await check('8. Safe Persian Normalization & XSS Sanitizer', async () => {
    // A: Persian normalization
    const messyArabic = 'اين يک پيام آزمايشي با اعداد ۱۲۳۴۵ و كاف عربي است';
    const cleanPersian = normalizePersianText(messyArabic);
    assert.ok(!cleanPersian.includes('ي'), 'Arabic yeh must be converted');
    assert.ok(!cleanPersian.includes('ك'), 'Arabic kaf must be converted');
    assert.ok(cleanPersian.includes('ک'), 'Persian kaf must be present');
    assert.ok(cleanPersian.includes('ی'), 'Persian yeh must be present');

    // B: XSS sanitization
    const maliciousHtml = '<script>alert("hack")</script><img src=x onerror=alert(1)>سلام <strong class="foo">جهان</strong> <a href="javascript:steal()">لینک خطرناک</a> و <a href="https://gordiyeh.ir">لینک امن</a>';
    const sanitized = sanitizeInlineHtml(maliciousHtml);
    assert.ok(!sanitized.includes('<script>'), 'Script tag must be stripped');
    assert.ok(!sanitized.includes('onerror='), 'Event handler must be stripped');
    assert.ok(!sanitized.includes('javascript:'), 'javascript: uri must be stripped');
    assert.ok(sanitized.includes('<strong>جهان</strong>'), 'Safe strong tag preserved');
    assert.ok(sanitized.includes('href="https://gordiyeh.ir"'), 'Safe https link preserved');
    assert.ok(sanitized.includes('rel="noopener noreferrer"'), 'Safe external link has rel attributes');
  });

  // 9. Media Upload Pipeline (Sharp WebP conversion & dimension extraction)
  await check('9. Media Upload Pipeline with Sharp WebP Conversion', async () => {
    // Generate a minimal valid 1x1 PNG buffer to test the upload pipeline
    // PNG 1x1 header
    const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const formData = new FormData();
    const blob = new Blob([png1x1], { type: 'image/png' });
    formData.append('file', blob, 'pixel.png');

    const uploadRes = await fetch(`${BASE_URL}/api/admin/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      },
      body: formData
    });

    assert.strictEqual(uploadRes.status, 201, `Upload should succeed with 201, got ${uploadRes.status}`);
    const upJson = await uploadRes.json();
    assert.strictEqual(upJson.success, true);
    assert.strictEqual(upJson.data?.format, 'webp', 'Sharp must convert upload to webp');
    assert.strictEqual(upJson.data?.width, 1, 'Width must be auto-extracted');
    assert.strictEqual(upJson.data?.height, 1, 'Height must be auto-extracted');
    assert.ok(upJson.data?.url?.endsWith('.webp'), 'Uploaded URL must end in .webp');
  });

  // 10. SSR HTML & JSON-LD Verification
  await check('10. SSR HTML & Article JSON-LD Schema Validation', async () => {
    const res = await request('/blog/how-to-choose-a-real-mini-projector');
    assert.strictEqual(res.status, 200);
    const html = res.text;

    // Single H1 check
    const h1Matches = html.match(/<h1\b[^>]*>/gi);
    assert.strictEqual(h1Matches?.length, 1, `Page must contain exactly one <h1>, found ${h1Matches?.length}`);

    // Check Article JSON-LD schema presence
    assert.ok(html.includes('"@type":"Article"'), 'SSR must include Article JSON-LD schema');
    assert.ok(html.includes('"publisher"'), 'Schema must define publisher');

    // Check pre-fetched window.__INITIAL_DATA__ hydration injection with escaped \u003c
    assert.ok(html.includes('window.__INITIAL_DATA__'), 'SSR must inject window.__INITIAL_DATA__');
    assert.ok(!html.includes('</script>') || html.includes('\\u003c'), 'Initial data must escape closing script tags safely');

    // Check Sitemap XML SWR caching and Max-Age
    const smRes = await request('/sitemap.xml');
    assert.strictEqual(smRes.status, 200);
    const cc = smRes.headers.get('cache-control') || '';
    assert.ok(cc.includes('s-maxage=3600'), 'Sitemap must have s-maxage=3600');
    assert.ok(smRes.text.includes('<urlset'), 'Sitemap must be valid XML urlset');
    assert.ok(smRes.text.includes('/blog/how-to-choose-a-real-mini-projector'), 'Sitemap must list published articles');
  });

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
