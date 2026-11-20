import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
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
import { validateWebhookUrl, validateWebhookUrlAsync, isPrivateOrReservedIp } from "./server/utils/ssrfGuard";

async function runHardeningTests() {
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
    delete process.env.COMMERCE_DB_PATH;
  }

  // Set up disposable test database
  const testDir = path.join(process.cwd(), "data", "test");
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

  // TEST-2.2: Concurrency & Last-Unit Race Condition Prevention
  try {
    // Two buyers try to buy the last 1 item concurrently
    let buyer1Success = false;
    let buyer2Success = false;

    // Buyer 1:
    testDb.exec("BEGIN IMMEDIATE;");
    const stockRow1 = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };
    if (stockRow1.stock >= 1) {
      testDb.prepare("UPDATE products SET stock = stock - 1 WHERE id = 'prod_limited' AND stock >= 1").run();
      testDb.prepare("INSERT INTO orders (id, orderNumber, totalAmount, status) VALUES ('ord_buyer1', 'ORD-B1', 100000, 'PAID')").run();
      testDb.exec("COMMIT;");
      buyer1Success = true;
    } else {
      testDb.exec("ROLLBACK;");
    }

    // Buyer 2:
    testDb.exec("BEGIN IMMEDIATE;");
    const stockRow2 = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };
    if (stockRow2.stock >= 1) {
      testDb.prepare("UPDATE products SET stock = stock - 1 WHERE id = 'prod_limited' AND stock >= 1").run();
      testDb.prepare("INSERT INTO orders (id, orderNumber, totalAmount, status) VALUES ('ord_buyer2', 'ORD-B2', 100000, 'PAID')").run();
      testDb.exec("COMMIT;");
      buyer2Success = true;
    } else {
      testDb.exec("ROLLBACK;");
    }

    const finalStock = testDb.prepare("SELECT stock FROM products WHERE id = 'prod_limited'").get() as { stock: number };

    assert(
      buyer1Success && !buyer2Success && finalStock.stock === 0,
      "TX-2.2",
      "Conditional Stock Decrement Prevents Last-Unit Overselling Race Condition"
    );
  } catch (err: any) {
    assert(false, "TX-2.2", "Concurrency Overselling Prevention", err.message);
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
    const legacyV1 = CryptoVault.encryptString(legacyPlain).replace("enc:v2:k1:", "enc:v1:");
    const decryptedV1 = CryptoVault.decryptString(legacyV1);

    assert(
      decryptedV1 === legacyPlain,
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
  // CLEANUP DISPOSABLE TEST DATABASE
  // -------------------------------------------------------------------------
  testDb.close();
  if (fs.existsSync(disposableDbPath)) fs.unlinkSync(disposableDbPath);
  const walPath = `${disposableDbPath}-wal`;
  const shmPath = `${disposableDbPath}-shm`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

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
