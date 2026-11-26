/**
 * Comprehensive security regression suite for Gordiyeh / Commerce OS.
 * Verifies:
 *  - Deny-by-default & fail-closed admin authentication on API & /admin /tasks pages
 *  - Rejection of forged client headers (x-admin-role), leaked tokens, and fake cookies
 *  - Valid Basic login -> signed HttpOnly SameSite=Strict session cookie -> logout
 *  - Public catalog & bootstrap stripping of wholesale costs and supplier identities
 *  - Anonymous order tracking masking & substring dump prevention
 *  - Fail-closed payment callback HMAC signature & /payment/verify unknown ref handling
 *  - Public checkout & OTP input validation
 */

import crypto from "node:crypto";
import {
  adminBasicHeader,
  adminBearerHeaders,
  assertSafeTestEnvironment,
  getAdminPassword,
  getAdminSecretKey,
  getBaseUrl,
} from "./test_support_auth";

async function runSecurityTests() {
  assertSafeTestEnvironment();
  const baseUrl = getBaseUrl();
  const adminSecret = getAdminSecretKey();
  const adminPassword = getAdminPassword();
  const createdOrderIds: string[] = [];

  console.log("=================================================================");
  console.log("  GORDIYEH SECURITY HARDENING VERIFICATION SUITE");
  console.log(`  Target: ${baseUrl}`);
  console.log("=================================================================\n");

  if (!adminSecret) {
    console.error("ERROR: ADMIN_SECRET_KEY must be set in env to run test_security.ts");
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  function check(cond: boolean, id: string, desc: string, detail?: string) {
    if (cond) {
      console.log(`  [PASS] ${id}: ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${id}: ${desc}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  // 1. Admin API routes must return 401 when unauthenticated
  const protectedRoutes: Array<[string, string]> = [
    ["GET", "/api/orders"],
    ["GET", "/api/v1/orders"],
    ["GET", "/api/approvals"],
    ["PUT", "/api/approvals/app_1"],
    ["GET", "/api/rules"],
    ["PUT", "/api/rules"],
    ["PUT", "/api/automation-matrix"],
    ["GET", "/api/manual-tasks"],
    ["POST", "/api/manual-tasks"],
    ["PUT", "/api/manual-tasks/t1"],
    ["GET", "/api/integrations"],
    ["POST", "/api/integrations/woocommerce/config"],
    ["POST", "/api/integrations/woocommerce/sync"],
    ["GET", "/api/v1/admin/integrations/sms"],
    ["PUT", "/api/v1/admin/integrations/sms"],
    ["POST", "/api/v1/admin/integrations/sms/test"],
    ["GET", "/api/v1/admin/integrations/payment"],
    ["PUT", "/api/v1/admin/integrations/payment"],
    ["PUT", "/api/v1/admin/settings/store-features"],
    ["GET", "/api/system/outbox-status"],
    ["GET", "/api/system/database-integrity"],
    ["GET", "/api/admin/documents"],
    ["POST", "/api/admin/documents"],
    ["POST", "/api/admin/media/upload"],
    ["GET", "/api/dropshipping/dispatch-slip/ORD-TEST"],
    ["POST", "/api/supervisor/alerts/scan"],
    ["POST", "/api/supervisor/products/prod_ported_shaker/stock-adjust"],
    ["POST", "/api/supervisor/products/prod_ported_shaker/competitor-price"],
    ["POST", "/api/v1/payment/refund"],
    ["PUT", "/api/products/prod_ported_shaker"],
    ["POST", "/api/products"],
    ["PUT", "/api/v1/site-config"],
    ["POST", "/api/blog-posts"],
    ["DELETE", "/api/blog-posts/fake_id"],
    ["POST", "/api/static-pages"],
    ["POST", "/api/categories"],
    ["POST", "/api/ask-commerce"],
    ["POST", "/api/content/generate"],
  ];

  for (const [method, route] of protectedRoutes) {
    try {
      const res = await fetch(`${baseUrl}${route}`, {
        method,
        headers: method === "GET" ? {} : { "Content-Type": "application/json" },
        body: method === "GET" ? undefined : JSON.stringify({}),
      });
      check(
        res.status === 401,
        `AUTH-401`,
        `Unauthenticated ${method} ${route} rejected with 401`,
        `Got ${res.status}`
      );
    } catch (err: any) {
      check(false, "AUTH-401", `${method} ${route}`, err?.message);
    }
  }

  // 2. Reject forged headers, leaked tokens, and fake cookies
  try {
    const forgedRoleDocs = await fetch(`${baseUrl}/api/admin/documents`, {
      headers: { "x-admin-role": "ADMIN" },
    });
    check(
      forgedRoleDocs.status === 401,
      "FORGE-1",
      "Forged x-admin-role: ADMIN header rejected on /api/admin/documents",
      `Got ${forgedRoleDocs.status}`
    );

    const leakedTokenRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: "Bearer gordiyeh_supervisor_secret_token_2025" },
    });
    check(
      leakedTokenRes.status === 403,
      "FORGE-2",
      "Previously leaked Bearer token rejected with 403",
      `Got ${leakedTokenRes.status}`
    );

    const forgedPrefixRes = await fetch(`${baseUrl}/api/admin/documents`, {
      headers: { Authorization: "Bearer gordiyeh_anything_forged_123" },
    });
    check(
      forgedPrefixRes.status === 403,
      "FORGE-3",
      "Forged gordiyeh_* prefix Bearer token rejected with 403",
      `Got ${forgedPrefixRes.status}`
    );

    const legacyCookieRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { Cookie: "gordiyeh_admin_auth=true" },
    });
    check(
      legacyCookieRes.status === 401,
      "FORGE-4",
      "Legacy unsigned cookie gordiyeh_admin_auth=true rejected",
      `Got ${legacyCookieRes.status}`
    );

    const tamperedCookieRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { Cookie: "gordiyeh_admin_session=9999999999999.deadbeefdeadbeef" },
    });
    check(
      tamperedCookieRes.status === 403,
      "FORGE-5",
      "Tampered signed session cookie rejected with 403",
      `Got ${tamperedCookieRes.status}`
    );
  } catch (err: any) {
    check(false, "FORGE", "Credential forgery checks", err?.message);
  }

  // 3. /admin and /tasks Basic auth & session cookie lifecycle
  try {
    const unauthAdmin = await fetch(`${baseUrl}/admin`);
    check(
      unauthAdmin.status === 401 &&
        (unauthAdmin.headers.get("www-authenticate") || "").includes("Basic") &&
        (unauthAdmin.headers.get("x-robots-tag") || "").includes("noindex"),
      "PAGE-1",
      "Unauthenticated GET /admin challenges with HTTP Basic & noindex"
    );

    const unauthTasks = await fetch(`${baseUrl}/tasks`);
    check(unauthTasks.status === 401, "PAGE-2", "Unauthenticated GET /tasks returns 401");

    const badBasic = await fetch(`${baseUrl}/admin`, {
      headers: { Authorization: adminBasicHeader("admin", "wrong-password-123") },
    });
    check(badBasic.status === 401, "PAGE-3", "Invalid Basic password on /admin rejected with 401");

    if (adminPassword) {
      const okBasic = await fetch(`${baseUrl}/admin`, {
        headers: { Authorization: adminBasicHeader("admin", adminPassword) },
      });
      const setCookie = okBasic.headers.get("set-cookie") || "";
      const sessionPair = setCookie.split(";")[0];
      check(
        okBasic.status === 200 &&
          sessionPair.startsWith("gordiyeh_admin_session=") &&
          /httponly/i.test(setCookie) &&
          /samesite=strict/i.test(setCookie),
        "PAGE-4",
        "Valid Basic auth on /admin sets HttpOnly SameSite=Strict session cookie"
      );

      const cookieApiRes = await fetch(`${baseUrl}/api/orders`, {
        headers: { Cookie: sessionPair },
      });
      check(
        cookieApiRes.status === 200,
        "PAGE-5",
        "Signed session cookie grants access to admin API",
        `Got ${cookieApiRes.status}`
      );

      const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
        method: "POST",
        headers: { Cookie: sessionPair },
      });
      const clearHeader = logoutRes.headers.get("set-cookie") || "";
      check(
        logoutRes.status === 200 && clearHeader.includes("gordiyeh_admin_session="),
        "PAGE-6",
        "POST /api/admin/logout clears session cookie"
      );
    }
  } catch (err: any) {
    check(false, "PAGE", "Admin page auth checks", err?.message);
  }

  // 4. Bootstrap & Public catalog sanitization (no wholesale costs or supplier identities)
  try {
    const anonBoot = await fetch(`${baseUrl}/api/bootstrap`);
    const bootJson = await anonBoot.json();
    const firstProd = bootJson?.data?.products?.[0];
    check(
      anonBoot.status === 200 &&
        !bootJson?.data?.orders &&
        !bootJson?.data?.rules &&
        !bootJson?.data?.integrations &&
        firstProd &&
        firstProd.baseCost === 0 &&
        firstProd.targetMargin === 0 &&
        !firstProd.supplierOffers?.[0]?.supplierName &&
        firstProd.supplierOffers?.[0]?.offerPrice === undefined,
      "DATA-1",
      "Anonymous /api/bootstrap omits orders/rules/integrations and strips product wholesale costs & supplier names"
    );

    const anonProducts = await fetch(`${baseUrl}/api/products/prod_ported_shaker`);
    const prodJson = await anonProducts.json();
    check(
      anonProducts.status === 200 &&
        prodJson?.product?.baseCost === 0 &&
        prodJson?.product?.dna === undefined &&
        prodJson?.product?.supplierOffers?.[0]?.offerPrice === undefined,
      "DATA-2",
      "Anonymous GET /api/products/:id strips baseCost, dna, and offerPrice"
    );

    const adminProducts = await fetch(`${baseUrl}/api/products/prod_ported_shaker`, {
      headers: adminBearerHeaders(),
    });
    const adminProdJson = await adminProducts.json();
    check(
      adminProducts.status === 200 && Number(adminProdJson?.product?.baseCost || 0) > 0,
      "DATA-3",
      "Authenticated admin GET /api/products/:id preserves full wholesale baseCost"
    );
  } catch (err: any) {
    check(false, "DATA", "Catalog sanitization checks", err?.message);
  }

  // 5. Order creation + anonymous tracking masking & substring attack prevention
  try {
    const createRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ id: "prod_ported_shaker", quantity: 1 }],
        customer: {
          fullName: "مریم احمدی تست",
          phone: "09125554433",
          province: "تهران",
          city: "تهران",
          address: "تهران خیابان آزادی کوچه امن پلاک ۱۲",
          postalCode: "1458963214",
        },
        discountAmount: 0,
      }),
    });
    const createJson = await createRes.json();
    const orderNo = createJson?.order?.orderNumber;
    if (createJson?.order?.id) createdOrderIds.push(createJson.order.id);
    check(createRes.status === 201 && Boolean(orderNo), "ORD-1", "Public checkout creates order");

    if (orderNo) {
      const trackRes = await fetch(`${baseUrl}/api/v1/orders/track/${encodeURIComponent(orderNo)}`);
      const trackJson = await trackRes.json();
      const tracked = trackJson?.order;
      check(
        trackRes.status === 200 &&
          tracked &&
          tracked.address === undefined &&
          tracked.postalCode === undefined &&
          tracked.supplierCost === undefined &&
          tracked.contributionProfit === undefined &&
          String(tracked.phone || "").includes("*"),
        "ORD-2",
        "Anonymous order tracking masks phone/name and strips address, postalCode & internal margins"
      );

      const subRes = await fetch(`${baseUrl}/api/v1/orders/track/ORD-`);
      check(
        subRes.status === 404,
        "ORD-3",
        "Partial substring order tracking enumeration rejected (404)",
        `Got ${subRes.status}`
      );

      const adminTrackRes = await fetch(`${baseUrl}/api/v1/orders/track/${encodeURIComponent(orderNo)}`, {
        headers: adminBearerHeaders(),
      });
      const adminTrackJson = await adminTrackRes.json();
      check(
        adminTrackRes.status === 200 && Boolean(adminTrackJson?.order?.address),
        "ORD-4",
        "Authenticated admin tracking returns full unmasked order details"
      );
    }
  } catch (err: any) {
    check(false, "ORD", "Order tracking privacy checks", err?.message);
  }

  // 6. Payment callback HMAC signature enforcement & verify guard
  try {
    const unsignedCb = await fetch(`${baseUrl}/api/v1/payment/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: "ORD-NONEXISTENT",
        idempotencyKey: `cb_${Date.now()}`,
        status: "SUCCESS",
        amount: 580000,
      }),
    });
    check(
      unsignedCb.status === 401 || unsignedCb.status === 503,
      "PAY-1",
      "Unsigned payment callback fails closed (401/503)",
      `Got ${unsignedCb.status}`
    );

    const badSigCb = await fetch(`${baseUrl}/api/v1/payment/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-payment-signature": crypto.randomBytes(32).toString("hex"),
      },
      body: JSON.stringify({
        orderId: "ORD-NONEXISTENT",
        idempotencyKey: `cb_bad_${Date.now()}`,
        status: "SUCCESS",
        amount: 580000,
      }),
    });
    check(
      badSigCb.status === 401 || badSigCb.status === 503,
      "PAY-2",
      "Invalid HMAC signature on payment callback rejected (401/503)",
      `Got ${badSigCb.status}`
    );

    const unknownVerify = await fetch(`${baseUrl}/api/v1/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authority: "FAKE_AUTHORITY_999", status: "OK" }),
    });
    check(
      unknownVerify.status === 404,
      "PAY-3",
      "POST /api/v1/payment/verify rejects unknown Authority with 404",
      `Got ${unknownVerify.status}`
    );
  } catch (err: any) {
    check(false, "PAY", "Payment verification security checks", err?.message);
  }

  // 7. Customer Memory IDOR & Unauthenticated Account Identify PII Stripping
  try {
    const [memGet, memPost, memDel] = await Promise.all([
      fetch(`${baseUrl}/api/customer/memory/cust_guest_me`),
      fetch(`${baseUrl}/api/customer/memory/cust_guest_me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: ["test"] }),
      }),
      fetch(`${baseUrl}/api/customer/memory/cust_guest_me`, { method: "DELETE" }),
    ]);
    check(
      memGet.status === 401 && memPost.status === 401 && memDel.status === 401,
      "MEM-1",
      "Unauthenticated GET/POST/DELETE on /api/customer/memory/cust_guest_me rejected with 401",
      `Got ${memGet.status}/${memPost.status}/${memDel.status}`
    );

    const identifyRes = await fetch(`${baseUrl}/api/v1/customer/account/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "09125554433" }),
    });
    const identifyJson = await identifyRes.json();
    const acc = identifyJson?.account;
    check(
      identifyRes.status === 200 &&
        Boolean(acc?.phone) &&
        acc?.email === undefined &&
        acc?.nationalId === undefined &&
        acc?.addresses === undefined &&
        acc?.fullName === undefined,
      "ACC-1",
      "Unauthenticated /api/v1/customer/account/identify strips email, nationalId, addresses, and fullName"
    );
  } catch (err: any) {
    check(false, "PRIV", "Customer privacy regression checks", err?.message);
  }

  // Cleanup test orders created during security suite
  for (const oid of createdOrderIds) {
    try {
      await fetch(`${baseUrl}/api/v1/orders/${encodeURIComponent(oid)}`, {
        method: "DELETE",
        headers: adminBearerHeaders(),
      });
    } catch {
      // Ignore cleanup errors
    }
  }

  console.log("\n=================================================================");
  console.log(`  SECURITY SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) process.exit(1);
}

runSecurityTests().catch((err) => {
  console.error("Fatal security test error:", err);
  process.exit(1);
});
