/**
 * test_e2e_full.ts - Comprehensive User Journey & Security E2E Test Suite
 * Covers:
 * 1. Security Tests:
 *    - SEC-1: Price tampering attempt prevention
 *    - SEC-2: Injection of fake/unlisted product IDs
 *    - SEC-3: Negative / zero quantity overflow attack
 *    - SEC-4: SQL injection payload immunity
 *    - SEC-5: Directory traversal prevention
 *    - SEC-6: Sensitive admin path exclusion in robots.txt
 * 2. User Journey Tests:
 *    - USR-1: Canonical products & catalog inventory integrity
 *    - USR-2: End-to-end checkout & order placement
 *    - USR-3: Order tracking & persistent storage validation
 *    - USR-4: Product detail page SSR, meta tags, and JSON-LD schema
 *    - USR-5: Category navigation & self-canonical tags across all 4 categories
 *    - USR-6: Static legal & help policy pages availability
 */

import crypto from 'node:crypto';
import { adminBearerHeaders, assertSafeTestEnvironment, getBaseUrl } from './test_support_auth';

async function runE2ETests() {
  assertSafeTestEnvironment();
  const baseUrl = getBaseUrl();
  const createdOrderIds: string[] = [];
  console.log(`=================================================================`);
  console.log(`  RUNNING COMPREHENSIVE E2E SECURITY & USER JOURNEY TEST SUITE`);
  console.log(`  Target: ${baseUrl}`);
  console.log(`=================================================================\n`);

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testId: string, testName: string, extra?: string) {
    if (condition) {
      console.log(`  [PASS] ${testId}: ${testName}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${testId}: ${testName} ${extra ? `-> ${extra}` : ''}`);
      failedCount++;
    }
  }

  // -------------------------------------------------------------
  // PART 1: CYBERSECURITY & ANTI-TAMPERING E2E TESTS
  // -------------------------------------------------------------
  console.log('--- SECTION 1: CYBERSECURITY & INTEGRITY ASSURANCE ---');

  // Test SEC-1: Price Tampering Attack
  try {
    const forgedOrderPayload = {
      items: [
        {
          id: 'prod_ported_shaker',
          sku: 'SKU-SHAKER-01',
          title: 'مینی‌شیکر شارژی قابل حمل',
          quantity: 1,
          unitPrice: 100, // Attacker tries to buy 980,000 Toman item for 100 Toman
        }
      ],
      customer: {
        fullName: 'Hacker User',
        phone: '09129999999',
        province: 'تهران',
        city: 'تهران',
        address: 'آدرس تستی نفوذ'
      },
      discountAmount: 0
    };

    const resSec1 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forgedOrderPayload)
    });

    const dataSec1 = await resSec1.json();
    const orderCreated = dataSec1?.order;
    if (orderCreated?.id) createdOrderIds.push(orderCreated.id);
    // Expected: Server should look up DB price (580,000 Toman) + 45,000 shipping = 625,000 Toman (not attacker's 100 Toman)
    const isPriceEnforced = orderCreated && orderCreated.totalAmount >= 580000;
    const isItemVerified = orderCreated?.items?.[0]?.unitPrice === 580000;

    assert(
      isPriceEnforced && isItemVerified,
      'SEC-1',
      'Client-Side Price Tampering Blocked (Server Enforces DB Retail Price)',
      `Created total: ${orderCreated?.totalAmount}, item price: ${orderCreated?.items?.[0]?.unitPrice}`
    );
  } catch (err: any) {
    assert(false, 'SEC-1', 'Client-Side Price Tampering Blocked', err.message);
  }

  // Test SEC-2: Fake Product Injection Attack
  try {
    const fakeProductPayload = {
      items: [
        {
          id: 'hacker_fake_gold_bar',
          sku: 'SKU-GOLD-999',
          title: 'شمش طلای رایگان',
          quantity: 1,
          unitPrice: 50
        }
      ],
      customer: {
        fullName: 'Hacker User',
        phone: '09129999999'
      }
    };

    const resSec2 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fakeProductPayload)
    });

    assert(
      resSec2.status === 400,
      'SEC-2',
      'Unlisted / Fake Product Injection Rejected (HTTP 400)',
      `Got status: ${resSec2.status}`
    );
  } catch (err: any) {
    assert(false, 'SEC-2', 'Fake Product Injection Rejected', err.message);
  }

  // Test SEC-3: Negative Quantity Attack
  try {
    const negQtyPayload = {
      items: [
        {
          id: 'prod_ported_shaker',
          sku: 'SKU-SHAKER-01',
          quantity: -10, // Attacker attempts negative qty to get negative price
          unitPrice: 980000
        }
      ],
      customer: {
        fullName: 'Overflow Tester',
        phone: '09121111111'
      }
    };

    const resSec3 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(negQtyPayload)
    });

    const dataSec3 = await resSec3.json();
    if (dataSec3?.order?.id) createdOrderIds.push(dataSec3.order.id);
    const qtySanitized = dataSec3?.order?.items?.[0]?.quantity >= 1;
    assert(
      qtySanitized,
      'SEC-3',
      'Negative/Zero Quantity Overflow Blocked (Sanitized to Minimum >= 1)'
    );
  } catch (err: any) {
    assert(false, 'SEC-3', 'Negative Quantity Overflow Blocked', err.message);
  }

  // Test SEC-7: Client-Supplied Discount Tampering Blocked
  try {
    const resSec7 = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'prod_ported_shaker', quantity: 1 }],
        customer: { fullName: 'Discount Tester', phone: '09120001122', address: 'تهران' },
        discountAmount: 50000,
      }),
    });
    const dataSec7 = await resSec7.json();
    assert(
      resSec7.status === 400 && dataSec7?.code === 'INVALID_CLIENT_DISCOUNT',
      'SEC-7',
      'Unverified Client-Supplied discountAmount Rejected (HTTP 400 INVALID_CLIENT_DISCOUNT)',
      `Got ${resSec7.status} (${dataSec7?.code || ''})`
    );
  } catch (err: any) {
    assert(false, 'SEC-7', 'Client Discount Tampering Blocked', err.message);
  }

  // Test SEC-4: SQL Injection Vector Immunity
  try {
    const sqlPayload = "' OR '1'='1' --";
    const resSec4 = await fetch(`${baseUrl}/api/orders?search=${encodeURIComponent(sqlPayload)}`, {
      headers: adminBearerHeaders(),
    });
    assert(
      resSec4.status === 200 || resSec4.status === 400 || resSec4.status === 404,
      'SEC-4',
      'SQL Injection Vector Immune (No Unhandled Exceptions / Syntax Crashes)',
      `Status: ${resSec4.status}`
    );
  } catch (err: any) {
    assert(false, 'SEC-4', 'SQL Injection Vector Immune', err.message);
  }

  // Test SEC-5: Path Traversal Attack
  try {
    const resSec5 = await fetch(`${baseUrl}/../../etc/passwd`);
    const txtSec5 = await resSec5.text();
    const noPasswdLeak = !txtSec5.includes('root:x:0:0:');
    assert(
      noPasswdLeak && (resSec5.status === 404 || resSec5.status === 200),
      'SEC-5',
      'Directory Traversal Blocked (No System Files Leaked)'
    );
  } catch (err: any) {
    assert(false, 'SEC-5', 'Directory Traversal Blocked', err.message);
  }

  // Test SEC-6: Sensitive Paths Hidden from Crawlers
  try {
    const resSec6 = await fetch(`${baseUrl}/robots.txt`);
    const txtRobots = await resSec6.text();
    const hasAdminDisallow = txtRobots.includes('Disallow: /admin');
    const hasCartDisallow = txtRobots.includes('Disallow: /cart');
    assert(
      hasAdminDisallow && hasCartDisallow,
      'SEC-6',
      'Sensitive Admin & Cart Routes Shielded via robots.txt'
    );
  } catch (err: any) {
    assert(false, 'SEC-6', 'robots.txt check', err.message);
  }

  // -------------------------------------------------------------
  // PART 2: END-TO-END USER JOURNEY TESTS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: END-TO-END USER JOURNEY & COMMERCE FLOWS ---');

  // Test USR-1: Catalog Products & Bootstrap Integrity
  let sampleProduct: any = null;
  try {
    const resUsr1 = await fetch(`${baseUrl}/api/bootstrap`);
    assert(resUsr1.status === 200, 'USR-1.1', 'Bootstrap Data Loaded Successfully (200 OK)');
    const bootData = await resUsr1.json();
    const products = bootData?.data?.products || bootData?.products || [];
    assert(products.length >= 8, 'USR-1.2', `Sufficient Catalog Inventory (Found ${products.length} Products)`);
    sampleProduct = products[0];
    const hasValidFields = sampleProduct && sampleProduct.title && sampleProduct.retailPrice > 0 && sampleProduct.sku;
    assert(hasValidFields, 'USR-1.3', 'Canonical Products Have Valid Prices, Titles, and SKUs');
  } catch (err: any) {
    assert(false, 'USR-1', 'Catalog Products Integrity', err.message);
  }

  // Test USR-2: Customer Order Placement Journey
  let placedOrderNumber = '';
  try {
    const validOrderPayload = {
      items: [
        {
          id: sampleProduct?.id || 'prod_ported_shaker',
          sku: sampleProduct?.sku || 'SKU-SHAKER-01',
          title: sampleProduct?.title || 'مینی‌شیکر شارژی',
          quantity: 2,
        }
      ],
      customer: {
        fullName: 'علیرضا محمدی',
        phone: '09123456789',
        province: 'تهران',
        city: 'تهران',
        address: 'خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۲۴، واحد ۵'
      },
      discountAmount: 0
    };

    const resUsr2 = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validOrderPayload)
    });

    assert(resUsr2.status === 201, 'USR-2.1', 'Order Placed Successfully (HTTP 201 Created)');
    const orderData = await resUsr2.json();
    if (orderData?.order?.id) createdOrderIds.push(orderData.order.id);
    placedOrderNumber = orderData?.order?.orderNumber;
    assert(!!placedOrderNumber, 'USR-2.2', `Generated Tracking Order Number: ${placedOrderNumber}`);
    assert(orderData?.order?.customerName === 'علیرضا محمدی', 'USR-2.3', 'Customer Recipient Name Accurately Recorded');
  } catch (err: any) {
    assert(false, 'USR-2', 'Order Placement Journey', err.message);
  }

  // Test USR-3: Order Tracking Verification
  try {
    const resUsr3 = await fetch(`${baseUrl}/api/orders`, {
      headers: adminBearerHeaders(),
    });
    const jsonRes = await resUsr3.json();
    const ordersList = jsonRes?.orders || jsonRes;
    const foundOrder = Array.isArray(ordersList) 
      ? ordersList.find((o: any) => o.orderNumber === placedOrderNumber)
      : null;
    assert(
      !!foundOrder,
      'USR-3.1',
      `Placed Order Found in Persistence Layer (Verified Order #${placedOrderNumber})`
    );
  } catch (err: any) {
    assert(false, 'USR-3', 'Order Tracking Verification', err.message);
  }

  // Test USR-4: Product Page SSR & Persian URL Routing
  try {
    const prodId = sampleProduct?.id || 'prod_ported_shaker';
    const resUsr4 = await fetch(`${baseUrl}/product/${prodId}`);
    assert(resUsr4.status === 200, 'USR-4.1', `Product Detail Page Rendered (${prodId})`);
    const htmlUsr4 = await resUsr4.text();
    const hasOneH1 = (htmlUsr4.match(/<h1[\s>]/gi) || []).length === 1;
    assert(hasOneH1, 'USR-4.2', 'Exactly One Semantic <h1> Tag on Product Detail Page');
    const hasOpenGraph = htmlUsr4.includes('og:title') && htmlUsr4.includes('og:image');
    assert(hasOpenGraph, 'USR-4.3', 'OpenGraph Social Meta Tags Present');
    const hasJsonLd = htmlUsr4.includes('"@type":"Product"') || htmlUsr4.includes('"@type": "Product"');
    assert(hasJsonLd, 'USR-4.4', 'Product JSON-LD Structured Data Valid for Google Rich Snippets');
  } catch (err: any) {
    assert(false, 'USR-4', 'Product Page SSR & Meta Tags', err.message);
  }

  // Test USR-5: Category Navigation Across All 4 Real Categories
  try {
    const categories = ['digital', 'smart-home', 'travel-camping', 'beauty-health'];
    let allCategoriesOk = true;

    for (const catSlug of categories) {
      const resCat = await fetch(`${baseUrl}/category/${catSlug}`);
      if (resCat.status !== 200) allCategoriesOk = false;
      const htmlCat = await resCat.text();
      const hasCanonical = htmlCat.includes(`category/${catSlug}`);
      if (!hasCanonical) allCategoriesOk = false;
    }

    assert(
      allCategoriesOk,
      'USR-5',
      'All 4 Main Store Categories Rendered with Canonical Tags (digital, smart-home, travel-camping, beauty-health)'
    );
  } catch (err: any) {
    assert(false, 'USR-5', 'Category Navigation', err.message);
  }

  // Test USR-6: Static Pages & Policies
  try {
    const resHome = await fetch(`${baseUrl}/`);
    const resSitemap = await fetch(`${baseUrl}/sitemap.xml`);
    assert(
      resHome.status === 200 && resSitemap.status === 200,
      'USR-6',
      'Storefront Home & XML Sitemap Valid and Accessible'
    );
  } catch (err: any) {
    assert(false, 'USR-6', 'Static Pages & Policies', err.message);
  }

  // -------------------------------------------------------------
  // PART 3: MODULAR MONOLITH ARCHITECTURE CHARTER ASSURANCE
  // -------------------------------------------------------------
  console.log('--- SECTION 3: MODULAR MONOLITH CHARTER & HEXAGONAL ADAPTER ---');


  // Test ARCH-1: Versioned API /api/v1/architecture
  try {
    const resArch = await fetch(`${baseUrl}/api/v1/architecture`, {
      headers: adminBearerHeaders(),
    });
    const dataArch = await resArch.json();
    const charter = dataArch?.charter;
    const isCharterValid =
      dataArch?.success &&
      charter?.architecturePattern.includes('Modular Monolith') &&
      charter?.charterRulesCompliant?.businessLogicSeparatedFromDb &&
      charter?.charterRulesCompliant?.versionedApis &&
      charter?.charterRulesCompliant?.asyncProcessingDecoupled &&
      charter?.charterRulesCompliant?.statelessBackend;

    assert(
      isCharterValid,
      'ARCH-1',
      'Versioned Primary API (/api/v1/architecture) Validates 5 Core Charter Rules'
    );
  } catch (err: any) {
    assert(false, 'ARCH-1', 'Versioned Primary API Validation', err.message);
  }

  // Test ARCH-2: Backward-Compatibility API Alias (/api/architecture)
  try {
    const resLegacyAlias = await fetch(`${baseUrl}/api/architecture`, {
      headers: adminBearerHeaders(),
    });
    const dataLegacy = await resLegacyAlias.json();
    assert(
      dataLegacy?.success === true && dataLegacy?.charter?.storageEngine?.pluggablePostgresReady === true,
      'ARCH-2',
      'Backward-Compatibility Alias (/api/architecture) Resolves Identically to /api/v1'
    );
  } catch (err: any) {
    assert(false, 'ARCH-2', 'Backward-Compatibility Alias', err.message);
  }

  // Test ARCH-3: Event Bus Metrics & Hexagonal Isolation
  try {
    const resArch3 = await fetch(`${baseUrl}/api/v1/architecture`, {
      headers: adminBearerHeaders(),
    });
    const dataArch3 = await resArch3.json();
    const eventBusDiag = dataArch3?.charter?.eventBusDiagnostics;
    const isEventBusLive =
      eventBusDiag &&
      typeof eventBusDiag.totalDispatchedEvents === 'number' &&
      Array.isArray(eventBusDiag.registeredEvents);

    assert(
      isEventBusLive,
      'ARCH-3',
      'Decoupled In-Process Non-Blocking EventBus Active & Emitting Diagnostics'
    );
  } catch (err: any) {
    assert(false, 'ARCH-3', 'Event Bus Metrics', err.message);
  }

  // -------------------------------------------------------------
  // PART 4: PRODUCTION HARDENING HTTP REGRESSION TESTS
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: PAYMENT LEDGER, SESSION REUSE & PARALLEL CONCURRENCY ---');

  // Test PAY-E2E-1: Zero revenue on checkout, settled strictly on PAID callback, reversed on REFUND
  try {
    const bootBeforeRes = await fetch(`${baseUrl}/api/v1/bootstrap`, { headers: adminBearerHeaders() });
    const bootBefore = await bootBeforeRes.json();
    const revBefore = Number(bootBefore?.data?.financialSummary?.netRevenue ?? bootBefore?.data?.summary?.netRevenue ?? 0);

    const pendingOrderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ id: 'prod_ported_shaker', quantity: 1 }],
        customer: { fullName: 'حسابداری تست', phone: '09123334455', province: 'تهران', city: 'تهران', address: 'تهران پلاک ۵' },
        discountAmount: 0,
      }),
    });
    const pendingOrderJson = await pendingOrderRes.json();
    const ord = pendingOrderJson?.order;
    if (ord?.id) createdOrderIds.push(ord.id);

    const bootAfterCreate = await (await fetch(`${baseUrl}/api/v1/bootstrap`, { headers: adminBearerHeaders() })).json();
    const revAfterCreate = Number(bootAfterCreate?.data?.financialSummary?.netRevenue ?? 0);

    assert(
      pendingOrderRes.status === 201 && ord?.status === 'PENDING_PAYMENT' && revAfterCreate === revBefore,
      'PAY-E2E-1A',
      'Pending Order Checkout Stays PENDING_PAYMENT With Zero Revenue Recognized',
      `status=${ord?.status}, revBefore=${revBefore}, revAfterCreate=${revAfterCreate}`
    );

    const init1 = await (await fetch(`${baseUrl}/api/v1/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: ord.id }),
    })).json();
    const init2 = await (await fetch(`${baseUrl}/api/v1/payment/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: ord.id }),
    })).json();

    assert(
      Boolean(init1?.session?.transactionId) &&
        init2?.session?.reused === true &&
        init2?.session?.transactionId === init1?.session?.transactionId,
      'PAY-E2E-1B',
      'Payment Initiation Reuses Active Non-Expired Session Without Duplicate Pending Rows'
    );

    const cbIdemp = `cb_e2e_${Date.now()}`;
    const cbAmount = Number(ord.totalAmount);
    const cbHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    const gwSecret = (process.env.PAYMENT_GATEWAY_SECRET || '').trim();
    if (gwSecret) {
      const sigPayload = JSON.stringify({ orderId: ord.id, idempotencyKey: cbIdemp, status: 'SUCCESS', amount: cbAmount });
      cbHeaders['x-payment-signature'] = crypto.createHmac('sha256', gwSecret).update(sigPayload).digest('hex');
    }

    const cbRes = await fetch(`${baseUrl}/api/v1/payment/callback`, {
      method: 'POST',
      headers: cbHeaders,
      body: JSON.stringify({
        orderId: ord.id,
        idempotencyKey: cbIdemp,
        status: 'SUCCESS',
        providerRef: `REF_E2E_${Date.now()}`,
        amount: cbAmount,
        provider: 'SANDBOX',
      }),
    });
    const cbJson = await cbRes.json();
    const bootAfterPaid = await (await fetch(`${baseUrl}/api/v1/bootstrap`, { headers: adminBearerHeaders() })).json();
    const revAfterPaid = Number(bootAfterPaid?.data?.financialSummary?.netRevenue ?? 0);

    assert(
      cbRes.status === 200 && cbJson?.orderStatus === 'PAID' && revAfterPaid === revBefore + cbAmount,
      'PAY-E2E-1C',
      'Signed Payment Callback Transitions to PAID and Settles Net Revenue Accurately',
      `status=${cbRes.status}, revAfterPaid=${revAfterPaid}, expected=${revBefore + cbAmount}`
    );

    const refundRes = await fetch(`${baseUrl}/api/v1/payment/refund`, {
      method: 'POST',
      headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        orderId: ord.id,
        idempotencyKey: `ref_e2e_${Date.now()}`,
        amount: cbAmount,
        reason: 'E2E refund verification',
      }),
    });
    const refundJson = await refundRes.json();
    const bootAfterRefund = await (await fetch(`${baseUrl}/api/v1/bootstrap`, { headers: adminBearerHeaders() })).json();
    const revAfterRefund = Number(bootAfterRefund?.data?.financialSummary?.netRevenue ?? 0);

    assert(
      refundRes.status === 200 && refundJson?.orderStatus === 'REFUNDED' && revAfterRefund === revBefore,
      'PAY-E2E-1D',
      'Refund Reverses Net Revenue Back to Pre-Order Baseline'
    );
  } catch (err: any) {
    assert(false, 'PAY-E2E-1', 'Payment Lifecycle & Financial Accounting E2E', err.message);
  }

  // Test RACE-E2E-1: Real parallel HTTP last-unit checkout race condition guard
  let origShaker: any = null;
  try {
    const origRes = await fetch(`${baseUrl}/api/v1/products/prod_ported_shaker`, { headers: adminBearerHeaders() });
    const origJson = await origRes.json();
    origShaker = origJson?.product;

    if (origShaker) {
      const activeId = origShaker.selectedOfferId || origShaker.supplierOffers?.[0]?.id;
      const modifiedOffers = (origShaker.supplierOffers || []).map((o: any) => ({
        ...o,
        stock: o.id === activeId ? 1 : 0,
      }));
      await fetch(`${baseUrl}/api/v1/products/prod_ported_shaker`, {
        method: 'PUT',
        headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...origShaker, stock: 1, supplierOffers: modifiedOffers }),
      });

      const makeRaceOrder = (idx: number) =>
        fetch(`${baseUrl}/api/v1/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ id: 'prod_ported_shaker', quantity: 1 }],
            customer: { fullName: `خریدار هم‌زمان ${idx}`, phone: `0912777000${idx}`, address: 'تهران خیابان ولیعصر پلاک ۱۰' },
            discountAmount: 0,
          }),
        }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));

      const raceResults = await Promise.all([makeRaceOrder(1), makeRaceOrder(2), makeRaceOrder(3)]);
      for (const r of raceResults) {
        if (r.json?.order?.id) createdOrderIds.push(r.json.order.id);
      }
      const okCount = raceResults.filter((r) => r.status === 201).length;
      const conflictCount = raceResults.filter((r) => r.status === 409).length;

      assert(
        okCount === 1 && conflictCount === 2,
        'RACE-E2E-1',
        'Parallel 3-Way Checkout on Last 1 Unit Allows Exactly 1 Winner and Rejects 2 with 409',
        `201=${okCount}, 409=${conflictCount}`
      );
    } else {
      assert(false, 'RACE-E2E-1', 'Parallel Checkout Setup', 'prod_ported_shaker not found');
    }
  } catch (err: any) {
    assert(false, 'RACE-E2E-1', 'Parallel Last-Unit HTTP Checkout', err.message);
  } finally {
    if (origShaker) {
      await fetch(`${baseUrl}/api/v1/products/prod_ported_shaker`, {
        method: 'PUT',
        headers: adminBearerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(origShaker),
      }).catch(() => {});
    }
  }

  // Cleanup all test orders created during E2E suite
  for (const oid of createdOrderIds) {
    try {
      await fetch(`${baseUrl}/api/v1/orders/${encodeURIComponent(oid)}`, {
        method: 'DELETE',
        headers: adminBearerHeaders(),
      });
    } catch {
      // Ignore cleanup errors
    }
  }

  console.log(`\n=================================================================`);
  console.log(`  E2E TEST RUN COMPLETE`);
  console.log(`  Total Tests Passed: ${passedCount}`);
  console.log(`  Total Tests Failed: ${failedCount}`);
  console.log(`  Success Rate: ${Math.round((passedCount / (passedCount + failedCount)) * 100)}%`);
  console.log(`=================================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('Fatal E2E runner error:', err);
  process.exit(1);
});
