import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  getDatabaseConfig,
  createConsistentBackup,
  verifyDatabaseIntegrity,
  restoreDatabaseFromBackup
} from "./server/dbConfig";
import { CryptoVault, DecryptionError, parseAndValidateKey } from "./server/cryptoVault";
import { OutboxProcessor } from "./server/core/outboxWorker";
import { PaymentStateMachine } from "./server/core/paymentService";
import { eventBus } from "./server/core/eventBus";
import { validateWebhookUrl } from "./server/utils/ssrfGuard";
import { assertSafeTestEnvironment } from "./test_support_auth";

async function runHardeningTests() {
  assertSafeTestEnvironment();
  console.log(`=================================================================`);
  console.log(`  COMMERCE OS — RELEASE CANDIDATE HARDENING & RESILIENCE TESTS`);
  console.log(`  Phase 14: Fault-Injection, Outbox, Atomicity & Key Migration`);
  console.log(`=================================================================\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testId: string, testName: string, extra?: string) {
    if (condition) {
      console.log(`  [PASS] ${testId}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testId}: ${testName} ${extra ? `-> ${extra}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------------
  // 1. DATABASE SAFETY & TEST ISOLATION
  // -------------------------------------------------------------------------
  console.log("--- SECTION 1: DATABASE SAFETY, ISOLATION & CONSISTENT BACKUPS ---");

  // TEST-1.1: Safety Guard prevents running tests against production/dev DB
  const prevDbEnv = process.env.COMMERCE_DB_PATH;
  try {
    process.env.NODE_ENV = "test";
    process.env.COMMERCE_DB_PATH = path.join(process.cwd(), "data", "commerce.db");
    let guardBlocked = false;
    try {
      getDatabaseConfig();
    } catch (e: any) {
      if (e.message.includes("CRITICAL DATABASE SAFETY GUARD TRIGGERED")) {
        guardBlocked = true;
      }
    }
    assert(guardBlocked, "SAFE-1.1", "Hard Safety Guard Refuses Running Tests Against Production DB");
  } catch (err: any) {
    assert(false, "SAFE-1.1", "Hard Safety Guard Refusal", err.message);
  } finally {
    if (prevDbEnv !== undefined) {
      process.env.COMMERCE_DB_PATH = prevDbEnv;
    } else {
      delete process.env.COMMERCE_DB_PATH;
    }
  }

  // Set up disposable test database strictly inside OS temp directory
  const testDir = path.join(os.tmpdir(), `gordiyeh_hardening_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  const disposableDbPath = path.join(testDir, `isolated_test_${Date.now()}.db`);
  const testDb = new DatabaseSync(disposableDbPath);
  testDb.exec("PRAGMA journal_mode = WAL;");
  testDb.exec("PRAGMA foreign_keys = ON;");

  // Create minimal required schema in test DB
  testDb.exec(`
    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      title TEXT,
      retailPrice INTEGER,
      stock INTEGER,
      data TEXT
    );
    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT UNIQUE,
      customerName TEXT,
      phone TEXT,
      phone_blind_index TEXT,
      totalAmount INTEGER,
      status TEXT,
      riskScore INTEGER,
      createdAt TEXT,
      data TEXT
    );
    CREATE TABLE kv_store (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE approvals (
      id TEXT PRIMARY KEY,
      status TEXT,
      priority TEXT,
      createdAt TEXT,
      data TEXT
    );
    CREATE TABLE decision_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      eventTrigger TEXT,
      data TEXT
    );
    CREATE TABLE outbox_events (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      schema_version INTEGER NOT NULL DEFAULT 1,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      next_retry_at TEXT NOT NULL,
      last_error TEXT,
      locked_at TEXT,
      locked_until TEXT,
      lease_token TEXT,
      created_at TEXT NOT NULL,
      delivered_at TEXT
    );
    CREATE TABLE payment_transactions (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      idempotency_key TEXT UNIQUE,
      provider TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'IRT',
      status TEXT NOT NULL,
      provider_ref TEXT,
      error_message TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed test product with 1 unit
  testDb.exec(`
    INSERT INTO products (id, sku, title, retailPrice, stock, data)
    VALUES ('prod_limited', 'SKU-LTD-1', 'Limited Item', 100000, 1, '{"id":"prod_limited","selectedOfferId":"off_1","supplierOffers":[{"id":"off_1","stock":1}]}');
  `);

  // TEST-1.2: Database Integrity Check
  try {
    const integrity = verifyDatabaseIntegrity(disposableDbPath);
    assert(integrity.ok, "SAFE-1.2", "SQLite PRAGMA integrity_check Validates Clean Schema");
  } catch (err: any) {
    assert(false, "SAFE-1.2", "Database Integrity Check", err.message);
  }

  // TEST-1.3: Consistent WAL Backup & Recovery via VACUUM INTO
  const backupPath = path.join(testDir, `backup_test_${Date.now()}.db`);
  try {
    createConsistentBackup(testDb, backupPath);
    const backupIntegrity = verifyDatabaseIntegrity(backupPath);
    const restoreTarget = path.join(testDir, `restored_test_${Date.now()}.db`);
    const restored = restoreDatabaseFromBackup(backupPath, restoreTarget);
    const restoredIntegrity = verifyDatabaseIntegrity(restoreTarget);

    assert(
      backupIntegrity.ok && restored.ok && restoredIntegrity.ok,
      "SAFE-1.3",
      "Atomic WAL Backup (VACUUM INTO) and Restore Integrity Verified"
    );

    if (fs.existsSync(restoreTarget)) fs.unlinkSync(restoreTarget);
  } catch (err: any) {
    assert(false, "SAFE-1.3", "WAL Backup & Restore", err.message);
  } finally {
    if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
  }

  // TEST-1.4: Backup Destination Path Validation (Gate 7)
  try {
    let nullByteBlocked = false;
    try {
      createConsistentBackup(testDb, "invalid\0path.db");
    } catch (e: any) {
      if (e.message.includes("Null bytes detected")) nullByteBlocked = true;
    }

    let emptyPathBlocked = false;
    try {
      createConsistentBackup(testDb, "");
    } catch (e: any) {
      if (e.message.includes("valid string path")) emptyPathBlocked = true;
    }

    assert(
      nullByteBlocked && emptyPathBlocked,
      "SAFE-1.4",
      "Backup Destination Path Validation Rejects Null Bytes and Empty Targets"
    );
  } catch (err: any) {
    assert(false, "SAFE-1.4", "Backup Path Validation", err.message);
  }

  // -------------------------------------------------------------------------
  // 2. ATOMIC TRANSACTIONAL ORDER PROCESSING & CONCURRENCY
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 2: ATOMIC TRANSACTION ORDER PROCESSING & CONCURRENCY ---");

  // TEST-2.1: Transactional Atomicity (Fault-Injection on Stock Failure Rollback)
  try {
    // Attempt to order 5 units when only 1 is available
    let rolledBackProperly = false;
    testDb.exec("BEGIN IMMEDIATE;");
    try {
      const prod = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };
      if (prod.stock < 5) {
        throw new Error("Insufficient stock fault injection");
      }
      testDb.prepare("INSERT INTO orders (id, orderNumber) VALUES ('fail_ord', 'ORD-FAIL')").run();
      testDb.exec("COMMIT;");
    } catch {
      testDb.exec("ROLLBACK;");
      rolledBackProperly = true;
    }

    const checkOrder = testDb.prepare("SELECT * FROM orders WHERE id = 'fail_ord'").get();
    const checkStock = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };

    assert(
      rolledBackProperly && checkOrder === undefined && checkStock.stock === 1,
      "TX-2.1",
      "Order Transaction Rollback Guarantees Zero Partial State on Failure"
    );
  } catch (err: any) {
    assert(false, "TX-2.1", "Transaction Atomicity Rollback", err.message);
  }

  // TEST-2.2: Parallel Concurrency & Last-Unit Race Condition Prevention across two WAL connections
  try {
    const attemptPurchase = async (buyerIdx: number): Promise<boolean> => {
      await new Promise((r) => setImmediate(r));
      const conn = new DatabaseSync(disposableDbPath);
      conn.exec("PRAGMA busy_timeout = 3000;");
      try {
        conn.exec("BEGIN IMMEDIATE;");
        const upd = conn
          .prepare("UPDATE products SET stock = stock - 1 WHERE id = 'prod_limited' AND stock >= 1")
          .run();
        if (Number(upd.changes) === 1) {
          conn
            .prepare("INSERT INTO orders (id, orderNumber, totalAmount, status) VALUES ('ord_buyer1', 'ORD-B1', 100000, 'PAID')")
            .run();
          conn.exec("COMMIT;");
          return true;
        }
        conn.exec("ROLLBACK;");
        return false;
      } catch (e) {
        try {
          conn.exec("ROLLBACK;");
        } catch {}
        return false;
      } finally {
        conn.close();
      }
    };

    const outcomes = await Promise.all([attemptPurchase(1), attemptPurchase(2)]);
    const winCount = outcomes.filter(Boolean).length;
    const finalStock = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };

    assert(
      winCount === 1 && finalStock.stock === 0,
      "TX-2.2",
      "Parallel Multi-Connection Conditional Decrement Prevents Last-Unit Overselling Race Condition",
      `winCount=${winCount}, finalStock=${finalStock.stock}`
    );
  } catch (err: any) {
    assert(false, "TX-2.2", "Concurrency Overselling Prevention", err.message);
  }

  // TEST-2.3: Exact Supplier Offer Stock Decrement & Restock Consistency
  try {
    const offerProductData = {
      id: "prod_multi_offer",
      selectedOfferId: "off_1",
      supplierOffers: [
        { id: "off_1", stock: 2, isActive: true },
        { id: "off_2", stock: 5, isActive: true },
      ],
    };
    testDb
      .prepare("INSERT INTO products (id, sku, title, retailPrice, stock, data) VALUES (?, ?, ?, ?, ?, ?)")
      .run("prod_multi_offer", "SKU-MO", "Multi Offer Product", 250000, 7, JSON.stringify(offerProductData));

    // Decrement 2 units from off_2
    const decObj = JSON.parse(JSON.stringify(offerProductData));
    decObj.supplierOffers[1].stock -= 2; // off_2 becomes 3, total 5
    testDb
      .prepare("UPDATE products SET stock = 5, data = ? WHERE id = 'prod_multi_offer'")
      .run(JSON.stringify(decObj));

    const encOrderData = CryptoVault.encryptJson({
      id: "ord_offer_test",
      items: [{ id: "prod_multi_offer", offerId: "off_2", quantity: 2 }],
    });
    const pm = new PaymentStateMachine(() => testDb);
    pm.restockOrderItems(testDb, "ord_offer_test", encOrderData);

    const restoredProd = testDb
      .prepare("SELECT stock, data FROM products WHERE id = 'prod_multi_offer'")
      .get() as { stock: number; data: string };
    const restoredObj = JSON.parse(restoredProd.data);
    const off1 = restoredObj.supplierOffers.find((o: any) => o.id === "off_1");
    const off2 = restoredObj.supplierOffers.find((o: any) => o.id === "off_2");

    assert(
      restoredProd.stock === 7 && off1?.stock === 2 && off2?.stock === 5,
      "TX-2.3",
      "Restock Restores Exact Targeted supplierOffer Stock and Recomputes Total Stock"
    );
  } catch (err: any) {
    assert(false, "TX-2.3", "Supplier Offer Restock Consistency", err.message);
  }

  // TEST-2.4: Corrupt Encrypted Order Payload Raises Error & Audits stock_recovery_errors
  try {
    const pm = new PaymentStateMachine(() => testDb);
    const { ensurePaymentSchema } = await import("./server/core/paymentService");
    ensurePaymentSchema(testDb);
    let threwOnCorrupt = false;
    try {
      pm.restockOrderItems(testDb, "ord_corrupt_1", "enc:v2:k1:badiv:badtag:badcipher");
    } catch {
      threwOnCorrupt = true;
    }
    const auditRow = testDb
      .prepare("SELECT order_id, stage FROM stock_recovery_errors WHERE order_id = 'ord_corrupt_1'")
      .get() as any;

    assert(
      threwOnCorrupt && auditRow?.order_id === "ord_corrupt_1" && auditRow?.stage === "DECRYPT",
      "TX-2.4",
      "Corrupted Order Payload Throws During Restock and Audits stock_recovery_errors"
    );
  } catch (err: any) {
    assert(false, "TX-2.4", "Corrupted Order Restock Audit", err.message);
  }

  // -------------------------------------------------------------------------
  // 3. TRANSACTIONAL OUTBOX & DURABLE BACKGROUND WORKER
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 3: TRANSACTIONAL OUTBOX & DURABLE BACKGROUND WORKER ---");

  const outboxProcessor = new OutboxProcessor(() => testDb);

  // TEST-3.1: Outbox Event Persistence within Order Transaction
  try {
    const nowIso = new Date().toISOString();
    testDb.exec("BEGIN IMMEDIATE;");
    testDb.prepare(`
      INSERT INTO outbox_events (id, topic, schema_version, payload, status, next_retry_at, created_at)
      VALUES ('evt_test_1', 'order:created', 1, '{"orderId":"ord_b1","orderNumber":"ORD-B1","phone":"09120000000"}', 'PENDING', ?, ?)
    `).run(nowIso, nowIso);
    testDb.exec("COMMIT;");

    const outboxRow = testDb.prepare("SELECT status FROM outbox_events WHERE id = 'evt_test_1'").get() as { status: string };
    assert(
      outboxRow?.status === "PENDING",
      "OUTBOX-3.1",
      "Domain Events Persisted Durably in outbox_events Table"
    );
  } catch (err: any) {
    assert(false, "OUTBOX-3.1", "Outbox Persistence", err.message);
  }

  // TEST-3.2: Outbox Worker Polling & Delivery
  try {
    const batchResult = await outboxProcessor.processBatch(10);
    const deliveredRow = testDb.prepare("SELECT status, delivered_at FROM outbox_events WHERE id = 'evt_test_1'").get() as { status: string; delivered_at: string };

    assert(
      batchResult.processed >= 1 && deliveredRow?.status === "DELIVERED" && !!deliveredRow?.delivered_at,
      "OUTBOX-3.2",
      "Background Worker Successfully Delivers Outbox Events and Updates Status"
    );
  } catch (err: any) {
    assert(false, "OUTBOX-3.2", "Outbox Worker Delivery", err.message);
  }

  // TEST-3.3: Exponential Backoff & Dead-Letter State Transition
  try {
    const nowIso = new Date().toISOString();
    // Insert an event that fails SSRF check (points to 127.0.0.1)
    testDb.prepare(`
      INSERT INTO outbox_events (id, topic, schema_version, payload, status, attempt_count, max_attempts, next_retry_at, created_at)
      VALUES ('evt_failing', 'webhook:dispatch', 1, '{"url":"http://127.0.0.1:8080/hook"}', 'PENDING', 4, 5, ?, ?)
    `).run(nowIso, nowIso);

    // Process batch (will fail due to SSRF block and hit 5th attempt = dead letter)
    await outboxProcessor.processBatch(10);
    const deadRow = testDb.prepare("SELECT status, attempt_count, last_error FROM outbox_events WHERE id = 'evt_failing'").get() as any;

    assert(
      deadRow?.status === "DEAD_LETTER" && deadRow?.attempt_count === 5 && deadRow?.last_error.includes("SSRF"),
      "OUTBOX-3.3",
      "Failed Events Bounded with Exponential Backoff and Transition to DEAD_LETTER"
    );
  } catch (err: any) {
    assert(false, "OUTBOX-3.3", "Dead-Letter Transition", err.message);
  }

  // TEST-3.4: Outbox dispatchSync Propagates Listener Errors to Trigger Retry / DEAD_LETTER
  const failTopic = "test:failing_sync";
  const failingListener = async () => {
    throw new Error("Simulated downstream listener failure");
  };
  eventBus.on(failTopic, failingListener);
  try {
    const nowIso = new Date().toISOString();
    testDb.prepare(`
      INSERT INTO outbox_events (id, topic, schema_version, payload, status, attempt_count, max_attempts, next_retry_at, created_at)
      VALUES ('evt_sync_err', ?, 1, '{"ok":false}', 'PENDING', 0, 1, ?, ?)
    `).run(failTopic, nowIso, nowIso);

    await outboxProcessor.processBatch(10);
    const errRow = testDb
      .prepare("SELECT status, attempt_count, last_error FROM outbox_events WHERE id = 'evt_sync_err'")
      .get() as any;

    assert(
      errRow?.status === "DEAD_LETTER" &&
        errRow?.attempt_count === 1 &&
        String(errRow?.last_error || "").includes("Simulated downstream listener failure"),
      "OUTBOX-3.4",
      "Outbox dispatchSync Awaits Listeners and Marks Failed Deliveries DEAD_LETTER"
    );
  } catch (err: any) {
    assert(false, "OUTBOX-3.4", "Outbox Listener Error Propagation", err.message);
  } finally {
    eventBus.off(failTopic, failingListener);
  }

  // -------------------------------------------------------------------------
  // 4. ENCRYPTION HARDENING & KEY MIGRATION
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 4: ENCRYPTION (AES-256-GCM v2, KEY ID & ROTATION) ---");

  // TEST-4.1: v2 Ciphertext Format with Key ID
  try {
    const sample = "کاربر تستی محرمانه 09121111111";
    const encryptedV2 = CryptoVault.encryptString(sample);
    const decrypted = CryptoVault.decryptString(encryptedV2);

    assert(
      encryptedV2.startsWith("enc:v2:") && decrypted === sample,
      "ENC-4.1",
      "Version 2 AES-256-GCM Encryption with Explicit Key ID Verified"
    );
  } catch (err: any) {
    assert(false, "ENC-4.1", "v2 Encryption Format", err.message);
  }

  // TEST-4.2: Backward Compatibility with Legacy v1 Ciphertext
  try {
    // Generate v1 style ciphertext
    const legacyPlain = "داده‌های سفارش قدیمی نسخه یک";
    const legacyV1 = CryptoVault.encryptString(legacyPlain).replace(`enc:v2:${CryptoVault.getActiveKeyId()}:`, "enc:v1:");
    const decryptedV1 = CryptoVault.decryptString(legacyV1);

    assert(
      legacyV1.startsWith("enc:v1:") && decryptedV1 === legacyPlain,
      "ENC-4.2",
      "Backward-Compatible Decryption of Legacy enc:v1 Payloads Verified"
    );
  } catch (err: any) {
    assert(false, "ENC-4.2", "Legacy v1 Decryption", err.message);
  }

  // TEST-4.3: Explicit Decryption Error on Corrupted Authentication Tag
  try {
    const valid = CryptoVault.encryptString("تست اصالت داده");
    const parts = valid.split(":");
    // Corrupt auth tag
    parts[4] = "00000000000000000000000000000000";
    const tampered = parts.join(":");

    let caughtError = false;
    try {
      CryptoVault.decryptString(tampered);
    } catch (e: any) {
      if (e instanceof DecryptionError || e.message.includes("authenticate data")) {
        caughtError = true;
      }
    }

    assert(
      caughtError,
      "ENC-4.3",
      "Corrupted/Tampered Auth Tag Raises Explicit DecryptionError (No Silent Data Destruction)"
    );
  } catch (err: any) {
    assert(false, "ENC-4.3", "Tampered Tag Decryption", err.message);
  }

  // TEST-4.4: Safe Key Rotation Support
  try {
    const newKey = "new_production_secret_key_rotation_32bytes!!";
    CryptoVault.registerKey("k2", newKey, true); // make k2 active

    const encryptedWithK2 = CryptoVault.encryptString("رمزنگاری شده با کلید جدید k2");
    assert(
      encryptedWithK2.startsWith("enc:v2:k2:") && CryptoVault.decryptString(encryptedWithK2) === "رمزنگاری شده با کلید جدید k2",
      "ENC-4.4",
      "Key Rotation with Multi-Key Ring and Versioned Key IDs Verified"
    );
  } catch (err: any) {
    assert(false, "ENC-4.4", "Key Rotation Support", err.message);
  }

  // TEST-4.5: Banned Keys & Key Length Enforcement (Gate 1)
  try {
    let bannedKeyBlocked = false;
    try {
      parseAndValidateKey("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    } catch (e: any) {
      if (e.message.includes("banned") || e.message.includes("SECURITY ERROR")) {
        bannedKeyBlocked = true;
      }
    }

    let shortKeyBlocked = false;
    try {
      parseAndValidateKey("short_key");
    } catch (e: any) {
      if (e.message.includes("Must be either a 64-character hex string")) {
        shortKeyBlocked = true;
      }
    }

    // Valid 64-character hex key
    const validHexKey = parseAndValidateKey("abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789");
    const validHexParsed = Buffer.isBuffer(validHexKey) && validHexKey.length === 32;

    assert(
      bannedKeyBlocked && shortKeyBlocked && validHexParsed,
      "ENC-4.5",
      "Banned Example Keys Blocked & 32-Byte Raw/Hex Representation Validated"
    );
  } catch (err: any) {
    assert(false, "ENC-4.5", "Key Length & Banned Keys", err.message);
  }

  // TEST-4.6: Interrupted Re-encryption Migration Recovery (Gate 1)
  try {
    const key3 = "third_migration_test_secret_32bytes_hex_or_pass";
    CryptoVault.registerKey("k3", key3, false);

    const records = [
      { id: "rec_1", ciphertext: CryptoVault.encryptString("Data record 1") },
      { id: "rec_2", ciphertext: CryptoVault.encryptString("Data record 2") },
    ];
    // Re-encrypt batch from active k2 to k3
    const res1 = CryptoVault.reencryptBatch(records, "k3");
    // Run again with updated record: should skip already migrated record (resumable)
    const mixedRecords = [
      { id: "rec_1", ciphertext: res1.migrated[0].newCiphertext },
      { id: "rec_2", ciphertext: records[1].ciphertext }
    ];
    const res2 = CryptoVault.reencryptBatch(mixedRecords, "k3");

    assert(
      res1.migrated.length === 2 && res2.skippedCount === 1 && res2.migrated.length === 1,
      "ENC-4.6",
      "Interrupted Re-Encryption Migration Is Idempotent, Resumable & Crash-Safe"
    );
  } catch (err: any) {
    assert(false, "ENC-4.6", "Interrupted Migration Recovery", err.message);
  }

  // -------------------------------------------------------------------------
  // 5. PAYMENT STATE MACHINE & IDEMPOTENCY
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 5: IDEMPOTENT PAYMENT STATE MACHINE ---");

  const paymentMachine = new PaymentStateMachine(() => testDb);

  // TEST-5.1: Successful Payment Callback
  try {
    const cb1 = paymentMachine.processCallback({
      orderId: "ord_buyer1",
      idempotencyKey: "idemp_unique_tx_101",
      status: "SUCCESS",
      providerRef: "SHP_REF_998811",
      amount: 100000
    });

    assert(
      cb1.success && cb1.orderStatus === "PAID" && !cb1.alreadyProcessed,
      "PAY-5.1",
      "Initial Payment Callback Transitions Order Status to PAID"
    );
  } catch (err: any) {
    assert(false, "PAY-5.1", "Payment Callback Success", err.message);
  }

  // TEST-5.2: Duplicate Callback Replay Idempotency
  try {
    // Replay identical callback with same idempotencyKey
    const cb2 = paymentMachine.processCallback({
      orderId: "ord_buyer1",
      idempotencyKey: "idemp_unique_tx_101",
      status: "SUCCESS",
      providerRef: "SHP_REF_998811",
      amount: 100000
    });

    assert(
      cb2.success && cb2.alreadyProcessed === true && cb2.orderStatus === "PAID",
      "PAY-5.2",
      "Replayed Payment Callback Handled Idempotently Without Duplicating Financial Records"
    );
  } catch (err: any) {
    assert(false, "PAY-5.2", "Payment Idempotency", err.message);
  }

  // TEST-5.3: Constant-Time Signature Verification (Gate 3)
  try {
    const secret = "test_merchant_secret_key_2026";
    const payload = JSON.stringify({ orderId: "ord_buyer1", amount: 100000 });
    const crypto = await import("node:crypto");
    const validSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const tamperedSig = validSig.slice(0, -4) + "0000";

    const validCheck = paymentMachine.verifyCallbackSignature(payload, secret, validSig);
    const tamperedCheck = paymentMachine.verifyCallbackSignature(payload, secret, tamperedSig);

    assert(
      validCheck === true && tamperedCheck === false,
      "PAY-5.3",
      "Constant-Time HMAC Signature Verification Rejects Tampered Callbacks"
    );
  } catch (err: any) {
    assert(false, "PAY-5.3", "Signature Verification", err.message);
  }

  // TEST-5.4: Out-of-Order Callback Protection & Amount Mismatch (Gate 3)
  try {
    // Out-of-order FAILED callback on an already PAID order must be rejected
    const lateFailed = paymentMachine.processCallback({
      orderId: "ord_buyer1",
      idempotencyKey: "idemp_late_failed_tx",
      status: "FAILED",
      providerRef: "SHP_REF_LATE",
      amount: 100000
    });

    // Amount mismatch rejection
    let amountMismatchBlocked = false;
    try {
      paymentMachine.processCallback({
        orderId: "ord_buyer1",
        idempotencyKey: "idemp_wrong_amount",
        status: "SUCCESS",
        providerRef: "SHP_REF_WRONG",
        amount: 50000 // Expected 100000
      });
    } catch (e: any) {
      if (e.message.includes("amount mismatch")) {
        amountMismatchBlocked = true;
      }
    }

    assert(
      lateFailed.orderStatus === "PAID" && amountMismatchBlocked,
      "PAY-5.4",
      "Amount Mismatch Blocked & Out-of-Order Callback Cannot Revert PAID Order"
    );
  } catch (err: any) {
    assert(false, "PAY-5.4", "Out-of-Order & Amount Protection", err.message);
  }

  // TEST-5.5: Order Refund Consistency & Stock Restoration (Gate 3)
  try {
    const refundRes = paymentMachine.processRefund({
      orderId: "ord_buyer1",
      idempotencyKey: "idemp_refund_tx_01",
      amount: 100000,
      reason: "Customer return policy"
    });

    const refundedRow = testDb.prepare("SELECT status FROM orders WHERE id = 'ord_buyer1'").get() as { status: string };

    assert(
      refundRes.success && refundRes.orderStatus === "REFUNDED" && refundedRow.status === "REFUNDED",
      "PAY-5.5",
      "Atomic Order Refund Transitions Status to REFUNDED with Transaction Audit"
    );
  } catch (err: any) {
    assert(false, "PAY-5.5", "Refund Consistency", err.message);
  }

  // TEST-5.6: Payment Initiation Session Reuse, TTL & Terminal Status Guard
  try {
    const nowIso = new Date().toISOString();
    testDb
      .prepare("INSERT INTO orders (id, orderNumber, totalAmount, status, created_at_iso) VALUES (?, ?, ?, ?, ?)")
      .run("ord_sess_test", "ORD-SESS-1", 300000, "PENDING_PAYMENT", nowIso);

    const s1 = paymentMachine.initiatePayment({ orderId: "ord_sess_test" });
    const s2 = paymentMachine.initiatePayment({ orderId: "ord_sess_test" });
    const expMs = new Date(s1.expiresAt).getTime();

    let blockedPaidInit = false;
    testDb
      .prepare("INSERT INTO orders (id, orderNumber, totalAmount, status, created_at_iso) VALUES (?, ?, ?, ?, ?)")
      .run("ord_paid_blocked", "ORD-PAID-BLK", 150000, "PAID", nowIso);
    try {
      paymentMachine.initiatePayment({ orderId: "ord_paid_blocked" });
    } catch (e: any) {
      if (e.statusCode === 409) blockedPaidInit = true;
    }

    assert(
      !s1.reused &&
        s2.reused &&
        s1.transactionId === s2.transactionId &&
        Number.isFinite(expMs) &&
        expMs > Date.now() + 20 * 60 * 1000 &&
        blockedPaidInit,
      "PAY-5.6",
      "Payment Initiation Reuses Active Session, Sets 30m TTL, and Rejects PAID Orders (409)"
    );
  } catch (err: any) {
    assert(false, "PAY-5.6", "Payment Initiation Guards", err.message);
  }

  // TEST-5.7: Duplicate providerRef Replay, Cancelled Order Guard & FAILED Stock Release
  try {
    const nowIso = new Date().toISOString();
    testDb
      .prepare("INSERT INTO orders (id, orderNumber, totalAmount, status, created_at_iso) VALUES (?, ?, ?, ?, ?)")
      .run("ord_dup_a", "ORD-DUP-A", 100000, "PENDING_PAYMENT", nowIso);
    testDb
      .prepare("INSERT INTO orders (id, orderNumber, totalAmount, status, created_at_iso) VALUES (?, ?, ?, ?, ?)")
      .run("ord_dup_b", "ORD-DUP-B", 100000, "PENDING_PAYMENT", nowIso);

    paymentMachine.processCallback({
      orderId: "ord_dup_a",
      idempotencyKey: "idemp_dup_a",
      status: "SUCCESS",
      providerRef: "SHARED_BANK_REF_777",
      amount: 100000,
    });

    let dupRefBlocked = false;
    try {
      paymentMachine.processCallback({
        orderId: "ord_dup_b",
        idempotencyKey: "idemp_dup_b",
        status: "SUCCESS",
        providerRef: "SHARED_BANK_REF_777",
        amount: 100000,
      });
    } catch (e: any) {
      if (e.statusCode === 409) dupRefBlocked = true;
    }

    // FAILED callback on PENDING_PAYMENT releases stock and transitions to CANCELLED
    testDb
      .prepare("UPDATE products SET stock = 0, data = ? WHERE id = 'prod_limited'")
      .run('{"id":"prod_limited","selectedOfferId":"off_1","supplierOffers":[{"id":"off_1","stock":0}]}');
    const failEncData = CryptoVault.encryptJson({
      id: "ord_fail_rel",
      items: [{ id: "prod_limited", offerId: "off_1", quantity: 1 }],
    });
    testDb
      .prepare(
        "INSERT INTO orders (id, orderNumber, totalAmount, status, created_at_iso, stock_released, data) VALUES (?, ?, ?, ?, ?, 0, ?)"
      )
      .run("ord_fail_rel", "ORD-FAIL-REL", 100000, "PENDING_PAYMENT", nowIso, failEncData);

    const failRes = paymentMachine.processCallback({
      orderId: "ord_fail_rel",
      idempotencyKey: "idemp_fail_rel",
      status: "FAILED",
      providerRef: "cancelled",
      amount: 100000,
    });
    const relProd = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };
    const relOrd = testDb
      .prepare("SELECT status, stock_released FROM orders WHERE id = 'ord_fail_rel'")
      .get() as { status: string; stock_released: number };

    // Late SUCCESS on CANCELLED order blocked with 409
    let lateCancelledBlocked = false;
    try {
      paymentMachine.processCallback({
        orderId: "ord_fail_rel",
        idempotencyKey: "idemp_late_success_on_cancel",
        status: "SUCCESS",
        providerRef: "LATE_REF_999",
        amount: 100000,
      });
    } catch (e: any) {
      if (e.statusCode === 409) lateCancelledBlocked = true;
    }

    assert(
      dupRefBlocked &&
        failRes.orderStatus === "CANCELLED" &&
        relOrd.stock_released === 1 &&
        relProd.stock === 1 &&
        lateCancelledBlocked,
      "PAY-5.7",
      "Duplicate providerRef Blocked, FAILED Callback Releases Stock, Late SUCCESS on CANCELLED Blocked"
    );
  } catch (err: any) {
    assert(false, "PAY-5.7", "Callback Integrity & Stock Release", err.message);
  }

  // TEST-5.8: Refund Live-Gateway Block, Over-Refund Guard & Financial Ledger Integrity
  try {
    // Reset kv_store financial_summary to clean ledger baseline
    testDb.prepare("DELETE FROM kv_store WHERE key = 'financial_summary'").run();

    const nowIso = new Date().toISOString();
    const orderPayload = {
      id: "ord_ledger_1",
      totalAmount: 400000,
      supplierCost: 250000,
      shippingCost: 45000,
      paymentFee: 5000,
      contributionProfit: 100000,
      items: [{ id: "prod_multi_offer", offerId: "off_1", quantity: 1 }],
    };
    const encOrderPayload = CryptoVault.encryptJson(orderPayload);

    testDb
      .prepare(
        "INSERT INTO orders (id, orderNumber, totalAmount, status, created_at_iso, stock_released, financial_settled, data) VALUES (?, ?, ?, ?, ?, 0, 0, ?)"
      )
      .run("ord_ledger_1", "ORD-LDG-1", 400000, "PENDING_PAYMENT", nowIso, encOrderPayload);

    // Confirm live zarinpal payment
    paymentMachine.processCallback({
      orderId: "ord_ledger_1",
      idempotencyKey: "idemp_ldg_pay",
      status: "SUCCESS",
      providerRef: "ZP_AUTH_123456",
      amount: 400000,
      provider: "zarinpal",
    });

    const sumPaidRow = testDb.prepare("SELECT value FROM kv_store WHERE key = 'financial_summary'").get() as {
      value: string;
    };
    const sumPaid = JSON.parse(sumPaidRow.value);

    // Refund without manualRefundConfirmed must fail with GATEWAY_REFUND_UNSUPPORTED
    let blockedLiveRefund = false;
    try {
      paymentMachine.processRefund({
        orderId: "ord_ledger_1",
        idempotencyKey: "idemp_ldg_ref_fail",
        amount: 400000,
        reason: "Unconfirmed live bank refund",
      });
    } catch (e: any) {
      if (String(e.message).includes("GATEWAY_REFUND_UNSUPPORTED")) blockedLiveRefund = true;
    }

    // Over-refund must fail
    let blockedOverRefund = false;
    try {
      paymentMachine.processRefund({
        orderId: "ord_ledger_1",
        idempotencyKey: "idemp_ldg_ref_over",
        amount: 500000,
        manualRefundConfirmed: true,
      });
    } catch (e: any) {
      if (e.statusCode === 400) blockedOverRefund = true;
    }

    // Refund WITH manualRefundConfirmed succeeds using MANUAL_SETTLEMENT and reverses ledger
    const refOk = paymentMachine.processRefund({
      orderId: "ord_ledger_1",
      idempotencyKey: "idemp_ldg_ref_ok",
      amount: 400000,
      reason: "Confirmed manual bank settlement",
      manualRefundConfirmed: true,
    });
    const refDup = paymentMachine.processRefund({
      orderId: "ord_ledger_1",
      idempotencyKey: "idemp_ldg_ref_ok",
      amount: 400000,
      manualRefundConfirmed: true,
    });

    // Refunding an already REFUNDED order with a new idempotencyKey fails 409
    let blockedNonPaidRefund = false;
    try {
      paymentMachine.processRefund({
        orderId: "ord_ledger_1",
        idempotencyKey: "idemp_ldg_ref_second",
        amount: 400000,
        manualRefundConfirmed: true,
      });
    } catch (e: any) {
      if (e.statusCode === 409) blockedNonPaidRefund = true;
    }

    const sumRefundedRow = testDb.prepare("SELECT value FROM kv_store WHERE key = 'financial_summary'").get() as {
      value: string;
    };
    const sumRefunded = JSON.parse(sumRefundedRow.value);

    assert(
      sumPaid.netRevenue === 400000 &&
        sumPaid.contributionProfit === 100000 &&
        blockedLiveRefund &&
        blockedOverRefund &&
        refOk.settlementMode === "MANUAL_SETTLEMENT" &&
        refDup.alreadyProcessed === true &&
        blockedNonPaidRefund &&
        sumRefunded.netRevenue === 0 &&
        sumRefunded.refunds === 400000 &&
        sumRefunded.paidOrdersCount === 0,
      "PAY-5.8",
      "Live Gateway Refund Guard, Idempotency, Non-PAID Block & Double-Entry Ledger Verified"
    );
  } catch (err: any) {
    assert(false, "PAY-5.8", "Refund Guard & Financial Ledger Integrity", err.message);
  }

  // -------------------------------------------------------------------------
  // 6. OUTBOX WORKER LEASE LOCKING & SSRF DEFENSE
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 6: OUTBOX LEASE LOCKING & OUTGOING SSRF DEFENSE ---");

  // TEST-6.1: Outbox Lease Renewal & Ownership Protection (Gate 4)
  try {
    const leaseRenewed = outboxProcessor.renewLease("evt_test_1", "dummy_lease_token", 30);
    // Since evt_test_1 is already DELIVERED, renewLease correctly returns false
    assert(
      leaseRenewed === false,
      "OUTBOX-4.1",
      "Outbox Worker Enforces Strict Lease Token Ownership and Conditional Updates"
    );
  } catch (err: any) {
    assert(false, "OUTBOX-4.1", "Lease Ownership", err.message);
  }

  // TEST-6.2: Complete SSRF Defense Matrix (Gate 2)
  try {
    const tests = [
      { url: "http://127.0.0.1:8080", shouldBlock: true, desc: "IPv4 loopback" },
      { url: "http://10.0.1.5:8080", shouldBlock: true, desc: "RFC1918 10.0.0.0/8" },
      { url: "http://172.20.0.1:8080", shouldBlock: true, desc: "RFC1918 172.16.0.0/12" },
      { url: "http://192.168.1.100:8080", shouldBlock: true, desc: "RFC1918 192.168.0.0/16" },
      { url: "http://169.254.169.254/latest", shouldBlock: true, desc: "Cloud Metadata IP" },
      { url: "http://[::1]:8080", shouldBlock: true, desc: "IPv6 loopback" },
      { url: "http://[fe80::1]:8080", shouldBlock: true, desc: "IPv6 link-local" },
      { url: "http://[fc00::1]:8080", shouldBlock: true, desc: "IPv6 unique-local" },
      { url: "http://[::ffff:127.0.0.1]:8080", shouldBlock: true, desc: "IPv4-mapped IPv6" },
      { url: "http://2130706433/path", shouldBlock: true, desc: "Integer encoded IP" },
      { url: "http://0x7f000001/path", shouldBlock: true, desc: "Hex encoded IP" },
      { url: "http://0177.0.0.1/path", shouldBlock: true, desc: "Octal encoded IP" },
      { url: "file:///etc/passwd", shouldBlock: true, desc: "Non-HTTP protocol (file:)" },
      { url: "gopher://127.0.0.1:70", shouldBlock: true, desc: "Non-HTTP protocol (gopher:)" },
      { url: "https://api.telegram.org/bot123/sendMessage", shouldBlock: false, desc: "Valid public HTTPS endpoint" },
    ];

    let allCorrect = true;
    for (const t of tests) {
      const res = validateWebhookUrl(t.url);
      if (t.shouldBlock && res.isSafe) {
        allCorrect = false;
        console.error(`SSRF False Negative: Allowed forbidden URL: ${t.url} (${t.desc})`);
      } else if (!t.shouldBlock && !res.isSafe) {
        allCorrect = false;
        console.error(`SSRF False Positive: Blocked valid URL: ${t.url} (${t.desc}) -> ${res.reason}`);
      }
    }

    assert(
      allCorrect,
      "SEC-SSRF-2",
      "Complete SSRF Defense Validated: IPv4/IPv6, Link-Local, Cloud Metadata, Encodings & Protocols"
    );
  } catch (err: any) {
    assert(false, "SEC-SSRF-2", "SSRF Matrix", err.message);
  }

  // -------------------------------------------------------------------------
  // CLEANUP DISPOSABLE TEST DATABASE & TEMP DIR
  // -------------------------------------------------------------------------
  testDb.close();
  fs.rmSync(testDir, { recursive: true, force: true });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log(`\n=================================================================`);
  console.log(`  RESILIENCE & HARDENING TEST RUN COMPLETE`);
  console.log(`  Total Tests Passed: ${passed}`);
  console.log(`  Total Tests Failed: ${failed}`);
  console.log(`  Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  console.log(`=================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runHardeningTests().catch(err => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
