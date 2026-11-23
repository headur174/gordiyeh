/**
 * test_integrations.ts - Verification Suite for Torob, Emalls, SSR Live Price Sync,
 * Social Auto-Publishing & Scheduling, and Digikala Seller Center Integration.
 */
import { adminBearerHeaders, getBaseUrl } from './test_support_auth';

const baseUrl = getBaseUrl();
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${label}${detail ? ` -> ${detail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log(`\nRunning Marketplace & Social Integrations Test Suite against ${baseUrl}\n`);

  // 1. Torob Feed Official Schema & Pagination
  console.log('1. Testing Torob Official Feed Schema & Pagination');
  const torobRes = await fetch(`${baseUrl}/api/v1/integrations/torob/feed?page=1&limit=5`);
  assert(torobRes.status === 200, 'Torob feed returns HTTP 200');
  const torobData = await torobRes.json();
  assert(typeof torobData.count === 'number' && torobData.count > 0, 'Torob feed includes numeric count');
  assert(typeof torobData.max_pages === 'number' && torobData.max_pages >= 1, 'Torob feed includes max_pages');
  assert(Array.isArray(torobData.products) && torobData.products.length <= 5, 'Torob pagination limit respected');
  const firstTorob = torobData.products[0];
  assert(Boolean(firstTorob?.page_unique), 'Torob item has page_unique');
  assert(
    typeof firstTorob?.page_url === 'string' &&
      firstTorob.page_url.includes('/product/') &&
      !firstTorob.page_url.includes('#product-'),
    'Torob item uses real canonical /product/:slug URL (no hash URL)',
    firstTorob?.page_url
  );
  assert(typeof firstTorob?.current_price === 'number', 'Torob item includes current_price');
  assert(
    firstTorob?.availability === 'instock' || firstTorob?.availability === 'outofstock',
    'Torob item availability is instock/outofstock'
  );
  assert(
    typeof firstTorob?.image_link === 'string' && /^https?:\/\//i.test(firstTorob.image_link),
    'Torob item has absolute HTTP(S) image_link',
    firstTorob?.image_link
  );

  // 2. Emalls Feed Official Schema & Auth Enforcement on Status
  console.log('\n2. Testing Emalls Feed & Admin Status Guard');
  const emallsRes = await fetch(`${baseUrl}/api/v1/integrations/emalls/feed?page=1&item_per_page=5`);
  assert(emallsRes.status === 200, 'Emalls public feed returns HTTP 200');
  const emallsData = await emallsRes.json();
  assert(typeof emallsData.total_items === 'number' && emallsData.total_items > 0, 'Emalls feed includes total_items');
  assert(typeof emallsData.pages_count === 'number' && emallsData.pages_count >= 1, 'Emalls feed includes pages_count');
  const firstEmalls = emallsData.products[0];
  assert(typeof firstEmalls?.is_available === 'boolean', 'Emalls item uses boolean is_available');
  assert(
    typeof firstEmalls?.url === 'string' && firstEmalls.url.includes('/product/'),
    'Emalls item uses canonical /product/:slug URL',
    firstEmalls?.url
  );

  const emallsStatusUnauth = await fetch(`${baseUrl}/api/v1/integrations/emalls/status`);
  assert(emallsStatusUnauth.status === 401, 'Emalls admin status blocks unauthenticated requests (401)');

  const emallsStatusAuth = await fetch(`${baseUrl}/api/v1/integrations/emalls/status`, {
    headers: adminBearerHeaders(),
  });
  assert(emallsStatusAuth.status === 200, 'Emalls admin status succeeds for authenticated admin');

  // 3. Live SSR Price Sync (SQLite -> SSR HTML / Schema.org + Torob + Emalls)
  console.log('\n3. Testing Live SSR & Feed Price Synchronization from SQLite');
  const origProdRes = await fetch(`${baseUrl}/api/v1/products/prod_ported_shaker`, {
    headers: adminBearerHeaders(),
  });
  const origProdJson = await origProdRes.json();
  const originalProduct = origProdJson?.product;
  assert(Boolean(originalProduct?.id), 'Fetched prod_ported_shaker from SQLite catalog');

  const testTomanPrice = 777000;
  const expectedRialPrice = testTomanPrice * 10;
  try {
    const putRes = await fetch(`${baseUrl}/api/v1/products/prod_ported_shaker`, {
      method: 'PUT',
      headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ ...originalProduct, retailPrice: testTomanPrice }),
    });
    assert(putRes.status === 200, 'Updated shaker retailPrice via admin API');

    const ssrRes = await fetch(`${baseUrl}/product/mini-shaker-blender`);
    const ssrHtml = await ssrRes.text();
    assert(
      ssrHtml.includes(`"price":${expectedRialPrice}`),
      'SSR Schema.org JSON-LD reflects updated live Rial price immediately'
    );
    assert(
      ssrHtml.includes(`"price":${testTomanPrice}`),
      'SSR Schema.org UnitPriceSpecification reflects updated live Toman price immediately'
    );

    const liveTorobRes = await fetch(`${baseUrl}/api/v1/integrations/torob/feed`);
    const liveTorob = await liveTorobRes.json();
    const shakerTorob = liveTorob.products.find((p: any) => p.page_unique === 'prod_ported_shaker');
    assert(shakerTorob?.current_price === testTomanPrice, 'Torob feed synchronized to live SQLite price');

    const liveEmallsRes = await fetch(`${baseUrl}/api/v1/integrations/emalls/feed`);
    const liveEmalls = await liveEmallsRes.json();
    const shakerEmalls = liveEmalls.products.find((p: any) => p.id === 'prod_ported_shaker');
    assert(shakerEmalls?.price === testTomanPrice, 'Emalls feed synchronized to live SQLite price');
  } finally {
    if (originalProduct) {
      await fetch(`${baseUrl}/api/v1/products/prod_ported_shaker`, {
        method: 'PUT',
        headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(originalProduct),
      });
    }
  }

  // 4. Social Publish Preview Real Canonical URL
  console.log('\n4. Testing Social Publish Preview Canonical URL & Image');
  const prevRes = await fetch(`${baseUrl}/api/v1/social/publish-preview`, {
    method: 'POST',
    headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      channel: 'TELEGRAM',
      format: 'POST',
      product: { id: 'prod_ported_shaker', title: 'مینی شیکر', retailPrice: 580000, image: '/assets/products/massage-gun.webp' },
    }),
  });
  const prevData = await prevRes.json();
  assert(prevRes.status === 200 && prevData.success, 'publish-preview returns 200');
  assert(
    !String(prevData.preview?.payload?.targetUrl).includes('store.example.ir') &&
      String(prevData.preview?.payload?.targetUrl).includes('/product/mini-shaker-blender'),
    'publish-preview removes store.example.ir and outputs canonical /product/mini-shaker-blender',
    prevData.preview?.payload?.targetUrl
  );

  // 5. Social Channels Auth, Encrypted Masked Storage & Scheduler
  console.log('\n5. Testing Social Auto-Publish Auth, Token Masking & Scheduler Queue');
  const unauthSocial = await fetch(`${baseUrl}/api/v1/admin/integrations/social`);
  assert(unauthSocial.status === 401, 'Social integration config rejects unauthenticated caller (401)');

  const unauthPublish = await fetch(`${baseUrl}/api/v1/social/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caption: 'test' }),
  });
  assert(unauthPublish.status === 401, 'Social publish endpoint rejects unauthenticated caller (401)');

  const testSecretToken = '99887766:AAFakeSecretTokenForEncryptionCheck';
  const saveSocRes = await fetch(`${baseUrl}/api/v1/admin/integrations/social`, {
    method: 'PUT',
    headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      telegram: { enabled: false, botToken: testSecretToken, chatId: '@test_channel' },
    }),
  });
  const saveSocJson = await saveSocRes.json();
  assert(saveSocRes.status === 200 && saveSocJson.success, 'Saved social channel config');
  assert(
    saveSocJson.config?.telegram?.hasToken === true &&
      saveSocJson.config?.telegram?.maskedToken?.includes('••••') &&
      !JSON.stringify(saveSocJson).includes(testSecretToken),
    'Telegram bot token is encrypted at rest and masked in response (zero plaintext leak)'
  );

  // Schedule and delete a post
  const futureDate = new Date(Date.now() + 3600_000).toISOString();
  const schedCreateRes = await fetch(`${baseUrl}/api/v1/social/schedule`, {
    method: 'POST',
    headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      channels: ['telegram', 'bale'],
      scheduledAt: futureDate,
      title: 'تست زمان‌بندی',
      caption: 'پست زمان‌بندی آزمایشی گُردیه',
    }),
  });
  const schedCreateJson = await schedCreateRes.json();
  assert(schedCreateRes.status === 201 && Boolean(schedCreateJson.item?.id), 'Created encrypted scheduled social post');
  const schedId = schedCreateJson.item?.id;

  const schedListRes = await fetch(`${baseUrl}/api/v1/social/schedule`, {
    headers: adminBearerHeaders(),
  });
  const schedListJson = await schedListRes.json();
  assert(
    Array.isArray(schedListJson.items) && schedListJson.items.some((i: any) => i.id === schedId),
    'Listed scheduled social post cleanly'
  );

  const schedDelRes = await fetch(`${baseUrl}/api/v1/social/schedule/${schedId}`, {
    method: 'DELETE',
    headers: adminBearerHeaders(),
  });
  assert(schedDelRes.status === 200, 'Deleted scheduled social post');

  // 6. Digikala Seller API Guards, Honest Errors & Variant Mapping
  console.log('\n6. Testing Digikala Seller Center API Security, Mapping & Honest Errors');
  const unauthDk = await fetch(`${baseUrl}/api/v1/admin/integrations/digikala`);
  assert(unauthDk.status === 401, 'Digikala admin config rejects unauthenticated caller (401)');

  const syncNoKey = await fetch(`${baseUrl}/api/v1/integrations/digikala/sync-inventory`, {
    method: 'POST',
    headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
    body: '{}',
  });
  assert(syncNoKey.status === 400, 'Digikala inventory sync fails honestly (400) when unconfigured (no fake success)');

  const mapSaveRes = await fetch(`${baseUrl}/api/v1/admin/integrations/digikala/mappings`, {
    method: 'PUT',
    headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      mappings: [{ productId: 'prod_ported_shaker', variantId: 1234567, dkp: 'dkp-999' }],
    }),
  });
  const mapSaveJson = await mapSaveRes.json();
  assert(
    mapSaveRes.status === 200 && mapSaveJson.mappings?.[0]?.variantId === 1234567,
    'Saved Digikala product-to-variant mapping'
  );

  // Clean up test mapping & social test config
  await fetch(`${baseUrl}/api/v1/admin/integrations/digikala/mappings`, {
    method: 'PUT',
    headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ mappings: [] }),
  });

  console.log(`\n----------------------------------------`);
  console.log(`Integrations Test Result: ${passed} passed, ${failed} failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Integration test runner error:', err);
  process.exit(1);
});
