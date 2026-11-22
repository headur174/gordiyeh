import { DatabaseSync } from "node:sqlite";
import { CryptoVault } from "./cryptoVault";
import { getDatabaseConfig } from "./dbConfig";
import { OutboxProcessor } from "./core/outboxWorker";
import { PaymentStateMachine } from "./core/paymentService";
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_RULES,
  INITIAL_AUTOMATION_MATRIX,
  INITIAL_APPROVALS,
  INITIAL_DECISION_LOGS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_FINANCIAL_SUMMARY,
  INITIAL_MANUAL_TASKS
} from "../src/mockData";
import {
  INITIAL_SITE_CONFIG,
  INITIAL_BLOG_POSTS,
  INITIAL_STATIC_PAGES,
  INITIAL_CATEGORIES,
  SiteConfig,
  BlogPost,
  StaticPage,
  CategoryDetail
} from "../src/utils/cmsStore";
import {
  CanonicalProduct,
  Supplier,
  BusinessRule,
  AutomationMatrix,
  ApprovalItem,
  DecisionLog,
  CalendarEvent,
  StoreFinancialSummary,
  ManualTask
} from "../src/types";

// Initialize Database using configuration and safety guard
const dbConfig = getDatabaseConfig();
const db = new DatabaseSync(dbConfig.dbPath);

// Enable WAL for performance, concurrent reads, and durability
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Database Schema with Portable SQL Patterns
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT,
      title TEXT,
      category TEXT,
      brand TEXT,
      retailPrice INTEGER,
      stock INTEGER,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      code TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT,
      isEnabled INTEGER,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      status TEXT,
      priority TEXT,
      createdAt TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS decision_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      eventTrigger TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      date TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
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

    CREATE TABLE IF NOT EXISTS customer_memory (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      blind_hash TEXT,
      data TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS static_pages (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT,
      name TEXT,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      provider TEXT,
      config TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      name TEXT,
      url TEXT,
      enabled INTEGER,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS manual_tasks (
      id TEXT PRIMARY KEY,
      category TEXT,
      priority TEXT,
      status TEXT,
      createdAt TEXT,
      data TEXT
    );

    /* Phase 5: Transactional Outbox for Durable Background Jobs */
    CREATE TABLE IF NOT EXISTS outbox_events (
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
    CREATE INDEX IF NOT EXISTS idx_outbox_queue ON outbox_events(status, next_retry_at);

    /* Phase 4: Idempotent Payment Transactions */
    CREATE TABLE IF NOT EXISTS payment_transactions (
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

    /* Customer Accounts (Phone-Keyed Username & Profile, Zero-Plaintext Encrypted at Rest) */
    CREATE TABLE IF NOT EXISTS customer_accounts (
      phone_blind_index TEXT PRIMARY KEY,
      phone_encrypted TEXT NOT NULL,
      preferred_name_encrypted TEXT NOT NULL DEFAULT '',
      full_name_encrypted TEXT NOT NULL DEFAULT '',
      email_encrypted TEXT NOT NULL DEFAULT '',
      national_id_encrypted TEXT NOT NULL DEFAULT '',
      addresses_encrypted TEXT NOT NULL DEFAULT '',
      account_type TEXT NOT NULL DEFAULT 'GUEST_1Y',
      is_verified INTEGER NOT NULL DEFAULT 0,
      verified_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    /* SMS OTP Verification Challenges (Hashed OTP Only, Zero-Plaintext) */
    CREATE TABLE IF NOT EXISTS otp_verifications (
      phone_blind_index TEXT PRIMARY KEY,
      otp_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      last_sent_at TEXT NOT NULL
    );

    /* Persistent Support Chat Sessions (Zero-Plaintext Encrypted at Rest) */
    CREATE TABLE IF NOT EXISTS support_sessions (
      id TEXT PRIMARY KEY,
      phone_blind_index TEXT NOT NULL,
      phone_encrypted TEXT NOT NULL,
      customer_name TEXT,
      title TEXT NOT NULL,
      active_flow TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      data_encrypted TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_support_sessions_phone ON support_sessions(phone_blind_index, updated_at);
  `);

  // Migration guard: ensure lease_token column exists in existing outbox_events tables
  try {
    db.exec("ALTER TABLE outbox_events ADD COLUMN lease_token TEXT;");
  } catch {
    // Column already exists
  }

  // Migration guards for pre-existing customer_accounts tables
  const customerAlterStatements = [
    "ALTER TABLE customer_accounts ADD COLUMN email_encrypted TEXT NOT NULL DEFAULT '';",
    "ALTER TABLE customer_accounts ADD COLUMN national_id_encrypted TEXT NOT NULL DEFAULT '';",
    "ALTER TABLE customer_accounts ADD COLUMN addresses_encrypted TEXT NOT NULL DEFAULT '';",
    "ALTER TABLE customer_accounts ADD COLUMN account_type TEXT NOT NULL DEFAULT 'GUEST_1Y';",
    "ALTER TABLE customer_accounts ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;",
    "ALTER TABLE customer_accounts ADD COLUMN verified_at TEXT;",
    "ALTER TABLE customer_accounts ADD COLUMN expires_at TEXT;"
  ];
  for (const sql of customerAlterStatements) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists
    }
  }
}

initSchema();

// Seed Database on startup if empty
function seedDatabaseIfNeeded() {
  // Repair legacy image URLs and migrate raster JPG/PNG product paths to optimized WebP in pre-existing rows
  try {
    const legacyImageFixes: Array<[string, string]> = [
      ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80', '/assets/products/massage-gun.webp'],
      ['https://images.unsplash.com/photo-1512290900672-1f55b991b585?w=600&auto=format&fit=crop&q=80', '/assets/products/microderm.webp'],
      ['/assets/products/massage-gun.jpg', '/assets/products/massage-gun.webp'],
      ['/assets/products/microderm.jpg', '/assets/products/microderm.webp'],
      ['&auto=format&fit=crop&q=80', '&auto=format&fit=crop&q=75&fm=webp'],
      ['?auto=format&fit=crop&w=800&q=80', '?auto=format&fit=crop&w=800&q=75&fm=webp'],
    ];
    const updateProdData = db.prepare("UPDATE products SET data = ? WHERE id = ?");
    const rows = db.prepare("SELECT id, data FROM products").all() as { id: string; data: string }[];
    for (const row of rows) {
      let updated = row.data;
      for (const [oldUrl, newUrl] of legacyImageFixes) {
        if (updated.includes(oldUrl)) {
          updated = updated.split(oldUrl).join(newUrl);
        }
      }
      if (updated !== row.data) {
        updateProdData.run(updated, row.id);
      }
    }
  } catch (e) {
    console.warn("Product image migration skipped:", e);
  }

  const prodCheck = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (prodCheck && prodCheck.count > 0) {
    return;
  }

  console.log("Seeding initial store data into SQLite database...");

  // Products
  const insertProd = db.prepare(`
    INSERT INTO products (id, sku, title, category, brand, retailPrice, stock, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sku = excluded.sku,
      title = excluded.title,
      retailPrice = excluded.retailPrice,
      stock = excluded.stock,
      data = excluded.data
  `);
  for (const p of INITIAL_PRODUCTS) {
    const totalStock = p.supplierOffers?.reduce((s, o) => s + (o.stock || 0), 0) || 0;
    insertProd.run(
      p.id,
      p.sku,
      p.title,
      p.category,
      p.brand || p.brandFa || "",
      p.retailPrice,
      totalStock,
      JSON.stringify(p)
    );
  }

  // Suppliers
  const insertSup = db.prepare(`
    INSERT INTO suppliers (id, name, code, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data
  `);
  for (const s of INITIAL_SUPPLIERS) {
    insertSup.run(s.id, s.name, s.code, JSON.stringify(s));
  }

  // Rules
  const insertRule = db.prepare(`
    INSERT INTO rules (id, name, category, isEnabled, data)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data
  `);
  for (const r of INITIAL_RULES) {
    insertRule.run(r.id, r.name, r.category, r.isEnabled ? 1 : 0, JSON.stringify(r));
  }

  // KV Items
  const setKV = (k: string, v: any) => {
    db.prepare(`
      INSERT INTO kv_store (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(k, JSON.stringify(v));
  };
  setKV("automation_matrix", INITIAL_AUTOMATION_MATRIX);
  setKV("financial_summary", INITIAL_FINANCIAL_SUMMARY);
  setKV("site_config", INITIAL_SITE_CONFIG);

  // Approvals
  const insertAppr = db.prepare(`
    INSERT INTO approvals (id, status, priority, createdAt, data)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET status = excluded.status, data = excluded.data
  `);
  for (const a of INITIAL_APPROVALS) {
    insertAppr.run(a.id, a.status, a.priority, a.createdAt, JSON.stringify(a));
  }

  // Decision Logs
  const insertLog = db.prepare(`
    INSERT INTO decision_logs (id, timestamp, eventTrigger, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data
  `);
  for (const log of INITIAL_DECISION_LOGS) {
    insertLog.run(log.id, log.timestamp, log.eventTrigger, JSON.stringify(log));
  }

  // Calendar Events
  const insertEvent = db.prepare(`
    INSERT INTO calendar_events (id, date, data)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data
  `);
  for (const ev of INITIAL_CALENDAR_EVENTS) {
    insertEvent.run(ev.id, ev.dateStr || "", JSON.stringify(ev));
  }

  // Blog Posts
  const insertBlog = db.prepare(`
    INSERT INTO blog_posts (id, slug, title, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, data = excluded.data
  `);
  for (const b of INITIAL_BLOG_POSTS) {
    insertBlog.run(b.id, b.slug, b.title, JSON.stringify(b));
  }

  // Static Pages
  const insertPage = db.prepare(`
    INSERT INTO static_pages (id, slug, title, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, data = excluded.data
  `);
  for (const p of INITIAL_STATIC_PAGES) {
    insertPage.run(p.id, p.slug, p.title, JSON.stringify(p));
  }

  // Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, slug, name, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, data = excluded.data
  `);
  for (const c of INITIAL_CATEGORIES) {
    insertCategory.run(c.id, c.slug, c.name, JSON.stringify(c));
  }

  // Manual Tasks
  const insertTask = db.prepare(`
    INSERT INTO manual_tasks (id, category, priority, status, createdAt, data)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);
  for (const t of INITIAL_MANUAL_TASKS) {
    insertTask.run(t.id, t.category, t.priority, t.status, t.createdAt, JSON.stringify(t));
  }

  console.log("SQLite database seeded successfully.");
}

seedDatabaseIfNeeded();

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

// Database Access Object (Clean Engine)
export const CommerceDB = {
  getRawDb(): DatabaseSync {
    return db;
  },

  getBootstrap() {
    const prodRows = db.prepare("SELECT data FROM products").all() as { data: string }[];
    const products: CanonicalProduct[] = prodRows.map(r => JSON.parse(r.data));

    const supRows = db.prepare("SELECT data FROM suppliers").all() as { data: string }[];
    const suppliers: Supplier[] = supRows.map(r => JSON.parse(r.data));

    const ruleRows = db.prepare("SELECT data FROM rules").all() as { data: string }[];
    const rules: BusinessRule[] = ruleRows.map(r => JSON.parse(r.data));

    const getKV = (k: string) => {
      const row = db.prepare("SELECT value FROM kv_store WHERE key = ?").get(k) as { value: string } | undefined;
      return row ? JSON.parse(row.value) : null;
    };

    const automationMatrix: AutomationMatrix = getKV("automation_matrix") || INITIAL_AUTOMATION_MATRIX;
    const summary: StoreFinancialSummary = getKV("financial_summary") || INITIAL_FINANCIAL_SUMMARY;
    const siteConfig: SiteConfig = getKV("site_config") || INITIAL_SITE_CONFIG;

    const apprRows = db.prepare("SELECT data FROM approvals ORDER BY createdAt DESC").all() as { data: string }[];
    const approvals: ApprovalItem[] = apprRows.map(r => JSON.parse(r.data));

    const logRows = db.prepare("SELECT data FROM decision_logs ORDER BY timestamp DESC LIMIT 50").all() as { data: string }[];
    const decisionLogs: DecisionLog[] = logRows.map(r => JSON.parse(r.data));

    const evRows = db.prepare("SELECT data FROM calendar_events").all() as { data: string }[];
    const events: CalendarEvent[] = evRows.map(r => JSON.parse(r.data));

    const blogRows = db.prepare("SELECT data FROM blog_posts").all() as { data: string }[];
    const blogPosts: BlogPost[] = blogRows.map(r => JSON.parse(r.data));

    const pageRows = db.prepare("SELECT data FROM static_pages").all() as { data: string }[];
    const staticPages: StaticPage[] = pageRows.map(r => JSON.parse(r.data));

    const catRows = db.prepare("SELECT data FROM categories").all() as { data: string }[];
    const categories: CategoryDetail[] = catRows.map(r => JSON.parse(r.data));

    const orderRows = db.prepare("SELECT data FROM orders ORDER BY createdAt DESC LIMIT 100").all() as { data: string }[];
    const orders = orderRows
      .map(r => {
        try {
          return CryptoVault.decryptJson(r.data);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const integRows = db.prepare("SELECT id, provider, config, updatedAt FROM integrations").all() as any[];
    const integrations = integRows.map(r => ({
      id: r.id,
      provider: r.provider,
      config: CryptoVault.decryptJson(r.config, {}),
      updatedAt: r.updatedAt
    }));

    const webhookRows = db.prepare("SELECT id, name, url, enabled, createdAt FROM webhooks").all() as any[];

    let manualTasks: ManualTask[] = [];
    try {
      const taskRows = db.prepare("SELECT data FROM manual_tasks ORDER BY createdAt DESC").all() as { data: string }[];
      manualTasks = taskRows.map(r => JSON.parse(r.data));
    } catch {
      manualTasks = INITIAL_MANUAL_TASKS;
    }

    return {
      products,
      suppliers,
      rules,
      automationMatrix,
      approvals,
      decisionLogs,
      events,
      summary,
      siteConfig,
      blogPosts,
      staticPages,
      categories,
      orders,
      integrations,
      webhooks: webhookRows,
      manualTasks
    };
  },

  // Manual Tasks
  getManualTasks(): ManualTask[] {
    try {
      const rows = db.prepare("SELECT data FROM manual_tasks ORDER BY createdAt DESC").all() as { data: string }[];
      return rows.map(r => JSON.parse(r.data));
    } catch {
      return INITIAL_MANUAL_TASKS;
    }
  },

  saveManualTask(task: ManualTask) {
    const stmt = db.prepare(`
      INSERT INTO manual_tasks (id, category, priority, status, createdAt, data)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category = excluded.category,
        priority = excluded.priority,
        status = excluded.status,
        data = excluded.data
    `);
    stmt.run(task.id, task.category, task.priority, task.status, task.createdAt, JSON.stringify(task));
  },

  updateManualTaskStatus(id: string, status: string, note?: string) {
    const row = db.prepare("SELECT data FROM manual_tasks WHERE id = ?").get(id) as { data: string } | undefined;
    if (row) {
      const task = JSON.parse(row.data);
      task.status = status;
      if (note) task.completionNote = note;
      if (status === 'COMPLETED') {
        task.completedAt = 'هم‌اکنون';
      }
      this.saveManualTask(task);
    }
  },

  // Products & Stock
  getProducts(): CanonicalProduct[] {
    const rows = db.prepare("SELECT data FROM products").all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  },

  getProductById(id: string): CanonicalProduct | null {
    const row = db.prepare("SELECT data FROM products WHERE id = ?").get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  },

  saveProduct(prod: CanonicalProduct) {
    const totalStock = prod.supplierOffers?.reduce((s, o) => s + (o.stock || 0), 0) || 0;
    const stmt = db.prepare(`
      INSERT INTO products (id, sku, title, category, brand, retailPrice, stock, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sku = excluded.sku,
        title = excluded.title,
        category = excluded.category,
        brand = excluded.brand,
        retailPrice = excluded.retailPrice,
        stock = excluded.stock,
        data = excluded.data
    `);
    stmt.run(
      prod.id,
      prod.sku,
      prod.title,
      prod.category,
      prod.brand || prod.brandFa || "",
      prod.retailPrice,
      totalStock,
      JSON.stringify(prod)
    );
  },

  searchProducts(query: string): CanonicalProduct[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return this.getProducts().slice(0, 5);
    const rows = db.prepare(`
      SELECT data FROM products
      WHERE LOWER(title) LIKE ? OR LOWER(category) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(sku) LIKE ?
      LIMIT 10
    `).all(`%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`, `%${trimmed}%`) as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  },

  // Orders
  getOrders(): any[] {
    const rows = db.prepare("SELECT data FROM orders ORDER BY createdAt DESC").all() as { data: string }[];
    return rows
      .map(r => {
        try {
          return CryptoVault.decryptJson(r.data);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  },

  lookupOrder(query: string): any | null {
    const clean = query.trim();
    const phoneBlind = CryptoVault.blindIndex(clean);

    const row = db.prepare(`
      SELECT data FROM orders
      WHERE orderNumber = ? OR id = ? OR phone_blind_index = ?
      LIMIT 1
    `).get(clean, clean, phoneBlind) as { data: string } | undefined;
    if (row) {
      try {
        return CryptoVault.decryptJson(row.data);
      } catch {
        return null;
      }
    }

    const allRows = db.prepare("SELECT data FROM orders ORDER BY createdAt DESC LIMIT 100").all() as { data: string }[];
    for (const r of allRows) {
      try {
        const o = CryptoVault.decryptJson(r.data);
        if (
          o &&
          (o.orderNumber?.includes(clean) ||
            o.phone?.includes(clean) ||
            o.customerName?.includes(clean) ||
            o.trackingCode?.includes(clean))
        ) {
          return o;
        }
      } catch {
        // Skip unauthenticated legacy entries
      }
    }
    return null;
  },

  /**
   * ATOMIC TRANSACTIONAL ORDER CREATION (Phase 3 & Phase 5)
   * Guaranteed:
   * - Order insert
   * - Conditional inventory decrement (checks for race-condition overselling)
   * - Financial summary update in kv_store
   * - Approvals and decision logs
   * - Outbox event record insertion
   * ALL COMMIT ATOMICALLY TOGETHER.
   * On ANY failure, full ROLLBACK is executed.
   */
  createOrder(order: any): any {
    db.exec("BEGIN IMMEDIATE;");
    try {
      // 1. Verify and decrement stock atomically with concurrency protection
      if (Array.isArray(order.items)) {
        for (const item of order.items) {
          const prodRow = db.prepare("SELECT stock, data FROM products WHERE id = ?").get(item.id || item.productId) as { stock: number; data: string } | undefined;
          if (!prodRow) {
            throw new Error(`Product '${item.id || item.title}' not found in catalog.`);
          }

          const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
          if (prodRow.stock < qty) {
            throw new InsufficientStockError(`موجودی کالای «${item.title || item.sku}» کافی نیست (موجودی فعلی: ${prodRow.stock}، تعداد درخواستی: ${qty}).`);
          }

          const prodObj: CanonicalProduct = JSON.parse(prodRow.data);
          let offerUpdated = false;

          prodObj.supplierOffers = prodObj.supplierOffers.map(off => {
            if (off.id === prodObj.selectedOfferId && off.stock >= qty) {
              offerUpdated = true;
              return { ...off, stock: off.stock - qty };
            }
            return off;
          });

          const newTotalStock = Math.max(0, prodRow.stock - qty);

          // Conditional update requiring stock >= qty at execution instant
          const updateStmt = db.prepare(`
            UPDATE products
            SET stock = ?, data = ?
            WHERE id = ? AND stock >= ?
          `);
          const res = updateStmt.run(newTotalStock, JSON.stringify(prodObj), prodObj.id, qty);
          if (res.changes === 0) {
            throw new InsufficientStockError(`موجودی کالا هم‌زمان هنگام ثبت سفارش تغییر کرد. لطفاً دوباره تلاش کنید.`);
          }
        }
      }

      // 2. Encrypt order fields (Zero-Plaintext at rest)
      const encryptedData = CryptoVault.encryptJson(order);
      const encryptedName = CryptoVault.encryptString(order.customerName || "");
      const encryptedPhone = CryptoVault.encryptString(order.phone || "");
      const phoneBlindIndex = CryptoVault.blindIndex(order.phone || "");

      const insertOrderStmt = db.prepare(`
        INSERT INTO orders (
          id, orderNumber, customerName, phone, phone_blind_index, totalAmount, status, riskScore, createdAt, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertOrderStmt.run(
        order.id,
        order.orderNumber,
        encryptedName,
        encryptedPhone,
        phoneBlindIndex,
        order.totalAmount,
        order.status,
        order.riskScore || 0,
        order.createdAt,
        encryptedData
      );

      // 3. Update Financial Summary inside the same transaction
      const sumRow = db.prepare("SELECT value FROM kv_store WHERE key = 'financial_summary'").get() as { value: string } | undefined;
      const currentSummary: StoreFinancialSummary = sumRow ? JSON.parse(sumRow.value) : INITIAL_FINANCIAL_SUMMARY;
      currentSummary.todayRevenue += order.totalAmount;
      currentSummary.todayContributionProfit += (order.contributionProfit || Math.round(order.totalAmount * 0.28));
      currentSummary.todayOrdersCount += 1;
      db.prepare(`
        INSERT INTO kv_store (key, value)
        VALUES ('financial_summary', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(JSON.stringify(currentSummary));

      // 4. Record required approvals and decision logs
      if (order.requireApproval || order.status === "HIGH_RISK_HOLD") {
        const approvalItem: ApprovalItem = {
          id: `appr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          priority: "HIGH",
          productTitle: `سفارش جدید مشتری: ${order.orderNumber} (مبلغ: ${order.totalAmount.toLocaleString()} تومان)`,
          category: "ORDERS",
          actionType: "تأیید سفارش مبلغ بالا و اعتبارسنجی ارسال",
          reason: order.approvalReason || `ارزش سفارش (${order.totalAmount.toLocaleString()} تومان) بالاتر از سقف مجاز خودکار ۵M تومان است.`,
          evidence: [
            `مبلغ کل: ${order.totalAmount.toLocaleString()} تومان`,
            `خریدار: ${order.customerName} (${order.city || "تهران"})`,
            `تعداد اقلام: ${order.items?.length || 1} عدد`,
          ],
          expectedImpact: `در صورت تأیید: ارسال فوری و سود خالص +${((order.contributionProfit || Math.round(order.totalAmount * 0.28))).toLocaleString()} تومان`,
          riskScore: order.riskScore || 72,
          currentValue: "وضعیت: در صف تایید ناظر (Hold)",
          proposedValue: "اقدام: تایید نهایی و صدور حواله انبار تأمین‌کننده",
          status: "PENDING",
          createdAt: "هم‌اکنون",
          ruleRefId: "rule_high_val_order",
        };

        db.prepare(`
          INSERT INTO approvals (id, status, priority, createdAt, data)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET status = excluded.status, data = excluded.data
        `).run(approvalItem.id, approvalItem.status, approvalItem.priority, approvalItem.createdAt, JSON.stringify(approvalItem));

        db.prepare(`
          INSERT INTO decision_logs (id, timestamp, eventTrigger, data)
          VALUES (?, ?, ?, ?)
        `).run(
          `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          "هم‌اکنون",
          `ثبت سفارش مبلغ بالا: ${order.orderNumber}`,
          JSON.stringify({
            id: `log_${Date.now()}`,
            timestamp: "هم‌اکنون",
            eventTrigger: `ثبت سفارش مبلغ بالا: ${order.orderNumber}`,
            decisionTaken: "توقف در صف تأیید ناظر طبق Rule Engine",
            reason: "سفارشات بالاتر از ۵ میلیون تومان نیازمند تایید دستی ناظر هستند.",
            status: "APPROVED_BY_OPERATOR"
          })
        );
      }

      // 5. ATOMIC TRANSACTIONAL OUTBOX WRITE (Phase 5)
      const nowIso = new Date().toISOString();
      const insertOutboxStmt = db.prepare(`
        INSERT INTO outbox_events (
          id, topic, schema_version, payload, status, next_retry_at, created_at
        ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
      `);

      insertOutboxStmt.run(
        `evt_ord_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        "order:created",
        1,
        JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          phone: order.phone,
          status: order.status,
          requireApproval: order.requireApproval,
          createdAt: order.createdAt
        }),
        nowIso,
        nowIso
      );

      if (order.requireApproval || order.status === "HIGH_RISK_HOLD") {
        insertOutboxStmt.run(
          `evt_risk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          "order:high_risk",
          1,
          JSON.stringify({
            orderId: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            riskScore: order.riskScore,
            reason: order.approvalReason
          }),
          nowIso,
          nowIso
        );
      }

      // Commit entire atomic unit of work
      db.exec("COMMIT;");
      return order;
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  },

  // Rules & Matrix
  saveRules(rules: BusinessRule[]) {
    const stmt = db.prepare(`
      INSERT INTO rules (id, name, category, isEnabled, data)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        isEnabled = excluded.isEnabled,
        data = excluded.data
    `);
    for (const r of rules) {
      stmt.run(r.id, r.name, r.category, r.isEnabled ? 1 : 0, JSON.stringify(r));
    }
  },

  updateRule(id: string, patch: Partial<BusinessRule>): BusinessRule | null {
    const row = db.prepare("SELECT data FROM rules WHERE id = ?").get(id) as { data: string } | undefined;
    if (!row) return null;
    const rule = { ...JSON.parse(row.data), ...patch };
    db.prepare(`
      UPDATE rules SET name = ?, category = ?, isEnabled = ?, data = ? WHERE id = ?
    `).run(rule.name, rule.category, rule.isEnabled ? 1 : 0, JSON.stringify(rule), id);
    return rule;
  },

  saveAutomationMatrix(matrix: AutomationMatrix) {
    db.prepare(`
      INSERT INTO kv_store (key, value)
      VALUES ('automation_matrix', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(JSON.stringify(matrix));
  },

  updateApprovalStatus(id: string, status: "APPROVED" | "REJECTED", outcomeReason?: string) {
    const row = db.prepare("SELECT data FROM approvals WHERE id = ?").get(id) as { data: string } | undefined;
    if (row) {
      const item: ApprovalItem = JSON.parse(row.data);
      item.status = status;
      db.prepare(`UPDATE approvals SET status = ?, data = ? WHERE id = ?`).run(status, JSON.stringify(item), id);

      db.prepare(`
        INSERT INTO decision_logs (id, timestamp, eventTrigger, data)
        VALUES (?, ?, ?, ?)
      `).run(
        `log_${Date.now()}`,
        "هم‌اکنون",
        `تعیین تکلیف ناظر بر آیتم: ${item.actionType}`,
        JSON.stringify({
          id: `log_${Date.now()}`,
          timestamp: "هم‌اکنون",
          eventTrigger: `تعیین تکلیف ناظر بر آیتم: ${item.actionType}`,
          decisionTaken: status === "APPROVED" ? "تأیید اقدام توسط ناظر (Approved)" : "رد اقدام توسط ناظر (Rejected)",
          reason: outcomeReason || item.reason,
          status: status === "APPROVED" ? "APPROVED_BY_OPERATOR" : "REJECTED_BY_OPERATOR"
        })
      );
    }
  },

  // Site Config & CMS
  getSiteConfig(): SiteConfig {
    const row = db.prepare("SELECT value FROM kv_store WHERE key = 'site_config'").get() as { value: string } | undefined;
    return row ? JSON.parse(row.value) : INITIAL_SITE_CONFIG;
  },

  saveSiteConfig(config: SiteConfig) {
    db.prepare(`
      INSERT INTO kv_store (key, value)
      VALUES ('site_config', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(JSON.stringify(config));
  },

  saveBlogPost(post: BlogPost) {
    db.prepare(`
      INSERT INTO blog_posts (id, slug, title, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, title = excluded.title, data = excluded.data
    `).run(post.id, post.slug, post.title, JSON.stringify(post));
  },

  deleteBlogPost(id: string) {
    db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
  },

  saveStaticPage(page: StaticPage) {
    db.prepare(`
      INSERT INTO static_pages (id, slug, title, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, title = excluded.title, data = excluded.data
    `).run(page.id, page.slug, page.title, JSON.stringify(page));
  },

  saveCategory(cat: CategoryDetail) {
    db.prepare(`
      INSERT INTO categories (id, slug, name, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, name = excluded.name, data = excluded.data
    `).run(cat.id, cat.slug, cat.name, JSON.stringify(cat));
  },

  // Customer Memory & Privacy Hub (Zero-Plaintext at Rest)
  getCustomerMemory(customerId: string) {
    const blind = CryptoVault.blindIndex(customerId);
    const row = db.prepare(`
      SELECT data FROM customer_memory
      WHERE blind_hash = ? OR id = ?
      LIMIT 1
    `).get(blind, customerId) as { data: string } | undefined;

    if (!row) return null;
    return CryptoVault.decryptJson(row.data, null);
  },

  saveCustomerMemory(customerId: string, memory: any) {
    const blind = CryptoVault.blindIndex(customerId);
    const encryptedData = CryptoVault.encryptJson(memory);
    const updatedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO customer_memory (id, customer_id, blind_hash, data, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(customerId, CryptoVault.encryptString(customerId), blind, encryptedData, updatedAt);
    return memory;
  },

  resetCustomerMemory(customerId: string) {
    const blind = CryptoVault.blindIndex(customerId);
    db.prepare(`
      DELETE FROM customer_memory WHERE blind_hash = ? OR id = ?
    `).run(blind, customerId);
    return { success: true, customerId };
  },

  // Webhooks
  getWebhooks() {
    return db.prepare("SELECT * FROM webhooks").all() as any[];
  },

  addWebhook(name: string, url: string) {
    const id = `wh_${Date.now()}`;
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO webhooks (id, name, url, enabled, createdAt)
      VALUES (?, ?, ?, 1, ?)
    `).run(id, name, url, createdAt);
    return { id, name, url, enabled: 1, createdAt };
  },

  deleteWebhook(id: string) {
    db.prepare("DELETE FROM webhooks WHERE id = ?").run(id);
  },

  // Integrations
  getIntegration(provider: string) {
    const row = db.prepare("SELECT * FROM integrations WHERE provider = ?").get(provider) as any;
    if (row) {
      return {
        id: row.id,
        provider: row.provider,
        config: CryptoVault.decryptJson(row.config, {}),
        updatedAt: row.updatedAt
      };
    }
    return null;
  },

  saveIntegration(provider: string, config: any) {
    const updatedAt = new Date().toISOString();
    const encryptedConfig = CryptoVault.encryptJson(config);
    db.prepare(`
      INSERT INTO integrations (id, provider, config, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET config = excluded.config, updatedAt = excluded.updatedAt
    `).run(provider, provider, encryptedConfig, updatedAt);
    return { provider, config, updatedAt };
  },

  // Support Chat Sessions (Zero-Plaintext Encrypted per Phone)
  getSupportSessionsByPhone(phone: string): any[] {
    const blind = CryptoVault.blindIndex(phone.trim());
    const rows = db.prepare(`
      SELECT data_encrypted, updated_at FROM support_sessions
      WHERE phone_blind_index = ?
      ORDER BY updated_at DESC
      LIMIT 50
    `).all(blind) as Array<{ data_encrypted: string; updated_at: string }>;

    return rows
      .map(row => {
        try {
          return CryptoVault.decryptJson(row.data_encrypted, null);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  },

  getSupportSessionById(id: string): any | null {
    const row = db.prepare(`
      SELECT data_encrypted FROM support_sessions WHERE id = ? LIMIT 1
    `).get(id) as { data_encrypted: string } | undefined;
    if (!row) return null;
    return CryptoVault.decryptJson(row.data_encrypted, null);
  },

  saveSupportSession(session: any): any {
    const nowIso = new Date().toISOString();
    const normalizedPhone = String(session.phone || "").trim();
    const blind = CryptoVault.blindIndex(normalizedPhone);
    const phoneEncrypted = CryptoVault.encryptString(normalizedPhone);
    const createdAt = session.createdAt || nowIso;
    const updatedAt = session.updatedAt || nowIso;
    const payload = {
      ...session,
      phone: normalizedPhone,
      createdAt,
      updatedAt
    };
    const encryptedData = CryptoVault.encryptJson(payload);

    db.prepare(`
      INSERT INTO support_sessions (
        id, phone_blind_index, phone_encrypted, customer_name, title, active_flow, status, data_encrypted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        phone_blind_index = excluded.phone_blind_index,
        phone_encrypted = excluded.phone_encrypted,
        customer_name = excluded.customer_name,
        title = excluded.title,
        active_flow = excluded.active_flow,
        status = excluded.status,
        data_encrypted = excluded.data_encrypted,
        updated_at = excluded.updated_at
    `).run(
      payload.id,
      blind,
      phoneEncrypted,
      payload.customerName || "",
      payload.title || "گفتگوی پشتیبانی",
      payload.flowState?.flow || null,
      payload.status || "ACTIVE",
      encryptedData,
      createdAt,
      updatedAt
    );

    return payload;
  },

  deleteSupportSessionsByPhone(phone: string): number {
    const blind = CryptoVault.blindIndex(phone.trim());
    const result = db.prepare(`
      DELETE FROM support_sessions WHERE phone_blind_index = ?
    `).run(blind);
    return Number(result?.changes || 0);
  },

  // Admin Configurable Storefront / Profile Field Toggles
  getStoreFeatureSettings(): {
    enableNationalId: boolean;
    requireNationalId: boolean;
    enableEmail: boolean;
    enablePostalCode: boolean;
    requirePostalCode: boolean;
  } {
    const defaults = {
      enableNationalId: true,
      requireNationalId: false,
      enableEmail: true,
      enablePostalCode: true,
      requirePostalCode: true,
    };
    const row = db.prepare("SELECT value FROM kv_store WHERE key = 'store_feature_settings'").get() as { value: string } | undefined;
    if (!row) return defaults;
    try {
      const parsed = JSON.parse(row.value);
      return {
        enableNationalId: typeof parsed.enableNationalId === "boolean" ? parsed.enableNationalId : defaults.enableNationalId,
        requireNationalId: typeof parsed.requireNationalId === "boolean" ? parsed.requireNationalId : defaults.requireNationalId,
        enableEmail: typeof parsed.enableEmail === "boolean" ? parsed.enableEmail : defaults.enableEmail,
        enablePostalCode: typeof parsed.enablePostalCode === "boolean" ? parsed.enablePostalCode : defaults.enablePostalCode,
        requirePostalCode: typeof parsed.requirePostalCode === "boolean" ? parsed.requirePostalCode : defaults.requirePostalCode,
      };
    } catch {
      return defaults;
    }
  },

  saveStoreFeatureSettings(patch: Partial<{
    enableNationalId: boolean;
    requireNationalId: boolean;
    enableEmail: boolean;
    enablePostalCode: boolean;
    requirePostalCode: boolean;
  }>) {
    const next = {
      ...this.getStoreFeatureSettings(),
      ...(typeof patch.enableNationalId === "boolean" ? { enableNationalId: patch.enableNationalId } : {}),
      ...(typeof patch.requireNationalId === "boolean" ? { requireNationalId: patch.requireNationalId } : {}),
      ...(typeof patch.enableEmail === "boolean" ? { enableEmail: patch.enableEmail } : {}),
      ...(typeof patch.enablePostalCode === "boolean" ? { enablePostalCode: patch.enablePostalCode } : {}),
      ...(typeof patch.requirePostalCode === "boolean" ? { requirePostalCode: patch.requirePostalCode } : {}),
    };
    db.prepare(`
      INSERT INTO kv_store (key, value)
      VALUES ('store_feature_settings', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(JSON.stringify(next));
    return next;
  },

  // Customer Accounts (Phone-Keyed Username & Encrypted Profile, Zero-Plaintext at Rest)
  getCustomerAccountByPhone(phone: string): {
    username: string;
    phone: string;
    preferredName: string;
    fullName: string;
    email: string;
    nationalId: string;
    addresses: any[];
    accountType: "GUEST_1Y" | "VERIFIED";
    isVerified: boolean;
    verifiedAt?: string;
    expiresAt?: string;
    createdAt: string;
    updatedAt: string;
  } | null {
    const normalizedPhone = phone.trim();
    const blind = CryptoVault.blindIndex(normalizedPhone);
    const row = db.prepare(`
      SELECT phone_encrypted, preferred_name_encrypted, full_name_encrypted,
             email_encrypted, national_id_encrypted, addresses_encrypted,
             account_type, is_verified, verified_at, expires_at,
             created_at, updated_at
      FROM customer_accounts
      WHERE phone_blind_index = ?
      LIMIT 1
    `).get(blind) as any;

    if (!row) return null;

    // Enforce 1-year retention expiry on unverified guest accounts
    if (!row.is_verified && row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      db.prepare("DELETE FROM customer_accounts WHERE phone_blind_index = ?").run(blind);
      return null;
    }

    const decryptedAddresses = row.addresses_encrypted
      ? CryptoVault.decryptJson(row.addresses_encrypted, [])
      : [];

    const accountPhone = CryptoVault.decryptString(row.phone_encrypted) || normalizedPhone;

    return {
      username: accountPhone,
      phone: accountPhone,
      preferredName: row.preferred_name_encrypted ? CryptoVault.decryptString(row.preferred_name_encrypted) : "",
      fullName: row.full_name_encrypted ? CryptoVault.decryptString(row.full_name_encrypted) : "",
      email: row.email_encrypted ? CryptoVault.decryptString(row.email_encrypted) : "",
      nationalId: row.national_id_encrypted ? CryptoVault.decryptString(row.national_id_encrypted) : "",
      addresses: Array.isArray(decryptedAddresses) ? decryptedAddresses : [],
      accountType: row.is_verified ? "VERIFIED" : "GUEST_1Y",
      isVerified: Boolean(row.is_verified),
      verifiedAt: row.verified_at || undefined,
      expiresAt: row.is_verified ? undefined : (row.expires_at || undefined),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  identifyOrCreateCustomerAccount(phone: string) {
    const normalizedPhone = phone.trim();
    const existing = this.getCustomerAccountByPhone(normalizedPhone);
    if (existing) {
      return { isNew: false, account: existing };
    }

    // Check if phone has any previous order to hydrate fullName while keeping preferredName explicit
    let orderName = "";
    try {
      const priorOrder = this.lookupOrder(normalizedPhone);
      if (priorOrder?.customerName) {
        orderName = String(priorOrder.customerName).trim().slice(0, 80);
      }
    } catch {}

    const now = new Date();
    const nowIso = now.toISOString();
    const oneYearLaterIso = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const blind = CryptoVault.blindIndex(normalizedPhone);
    const phoneEnc = CryptoVault.encryptString(normalizedPhone);
    const fullNameEnc = orderName ? CryptoVault.encryptString(orderName) : "";

    db.prepare(`
      INSERT INTO customer_accounts (
        phone_blind_index, phone_encrypted, preferred_name_encrypted, full_name_encrypted,
        email_encrypted, national_id_encrypted, addresses_encrypted,
        account_type, is_verified, verified_at, expires_at, created_at, updated_at
      ) VALUES (?, ?, '', ?, '', '', '', 'GUEST_1Y', 0, NULL, ?, ?, ?)
      ON CONFLICT(phone_blind_index) DO NOTHING
    `).run(blind, phoneEnc, fullNameEnc, oneYearLaterIso, nowIso, nowIso);

    return {
      isNew: true,
      account: {
        username: normalizedPhone,
        phone: normalizedPhone,
        preferredName: "",
        fullName: orderName,
        email: "",
        nationalId: "",
        addresses: [] as any[],
        accountType: "GUEST_1Y" as const,
        isVerified: false,
        expiresAt: oneYearLaterIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    };
  },

  updateCustomerAccountProfile(
    phone: string,
    updates: {
      preferredName?: string;
      fullName?: string;
      email?: string;
      nationalId?: string;
      addresses?: any[];
      keepOneYearGuest?: boolean;
    }
  ) {
    const normalizedPhone = phone.trim();
    const current = this.identifyOrCreateCustomerAccount(normalizedPhone).account;

    const nextPreferred = typeof updates.preferredName === "string"
      ? updates.preferredName.trim().slice(0, 60)
      : current.preferredName;
    const nextFull = typeof updates.fullName === "string"
      ? updates.fullName.trim().slice(0, 80)
      : (current.fullName || nextPreferred);
    const nextEmail = typeof updates.email === "string"
      ? updates.email.trim().toLowerCase().slice(0, 120)
      : current.email;
    const nextNationalId = typeof updates.nationalId === "string"
      ? updates.nationalId.trim().slice(0, 15)
      : current.nationalId;
    const nextAddresses = Array.isArray(updates.addresses)
      ? updates.addresses.slice(0, 15)
      : current.addresses;

    const now = new Date();
    const nowIso = now.toISOString();
    const nextExpiresAt = current.isVerified
      ? null
      : (updates.keepOneYearGuest || !current.expiresAt
        ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : current.expiresAt);

    const blind = CryptoVault.blindIndex(normalizedPhone);
    db.prepare(`
      UPDATE customer_accounts
      SET preferred_name_encrypted = ?,
          full_name_encrypted = ?,
          email_encrypted = ?,
          national_id_encrypted = ?,
          addresses_encrypted = ?,
          expires_at = ?,
          updated_at = ?
      WHERE phone_blind_index = ?
    `).run(
      nextPreferred ? CryptoVault.encryptString(nextPreferred) : "",
      nextFull ? CryptoVault.encryptString(nextFull) : "",
      nextEmail ? CryptoVault.encryptString(nextEmail) : "",
      nextNationalId ? CryptoVault.encryptString(nextNationalId) : "",
      nextAddresses.length > 0 ? CryptoVault.encryptJson(nextAddresses) : "",
      nextExpiresAt,
      nowIso,
      blind
    );

    return this.getCustomerAccountByPhone(normalizedPhone)!;
  },

  updateCustomerAccountName(phone: string, preferredName: string, fullName?: string) {
    return this.updateCustomerAccountProfile(phone, { preferredName, fullName });
  },

  // OTP Challenge Management (Hashed OTP + Rate Cooldown + Attempt Cap)
  getOtpCooldownSeconds(phone: string): number {
    const blind = CryptoVault.blindIndex(phone.trim());
    const row = db.prepare(`
      SELECT last_sent_at FROM otp_verifications WHERE phone_blind_index = ? LIMIT 1
    `).get(blind) as { last_sent_at: string } | undefined;
    if (!row?.last_sent_at) return 0;
    const elapsedSec = Math.floor((Date.now() - new Date(row.last_sent_at).getTime()) / 1000);
    return elapsedSec < 60 ? 60 - elapsedSec : 0;
  },

  createOtpChallenge(phone: string, code: string) {
    const normalizedPhone = phone.trim();
    const blind = CryptoVault.blindIndex(normalizedPhone);
    const otpHash = CryptoVault.blindIndex(`otp:${normalizedPhone}:${code}`);
    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + 180 * 1000).toISOString(); // 3 minutes validity

    db.prepare(`
      INSERT INTO otp_verifications (phone_blind_index, otp_hash, expires_at, attempts, last_sent_at)
      VALUES (?, ?, ?, 0, ?)
      ON CONFLICT(phone_blind_index) DO UPDATE SET
        otp_hash = excluded.otp_hash,
        expires_at = excluded.expires_at,
        attempts = 0,
        last_sent_at = excluded.last_sent_at
    `).run(blind, otpHash, expiresAt, nowIso);

    return { expiresAt };
  },

  verifyOtpChallenge(phone: string, code: string): {
    ok: boolean;
    error?: string;
    account?: ReturnType<typeof CommerceDB.getCustomerAccountByPhone>;
  } {
    const normalizedPhone = phone.trim();
    const blind = CryptoVault.blindIndex(normalizedPhone);
    const row = db.prepare(`
      SELECT otp_hash, expires_at, attempts FROM otp_verifications WHERE phone_blind_index = ? LIMIT 1
    `).get(blind) as { otp_hash: string; expires_at: string; attempts: number } | undefined;

    if (!row) {
      return { ok: false, error: "کد تاییدی برای این شماره ارسال نشده یا منقضی شده است." };
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      db.prepare("DELETE FROM otp_verifications WHERE phone_blind_index = ?").run(blind);
      return { ok: false, error: "اعتبار کد تایید به پایان رسیده است. لطفاً دوباره کد بگیرید." };
    }
    if (row.attempts >= 5) {
      return { ok: false, error: "تعداد تلاش‌های اشتباه بیش از حد مجاز بوده است. لطفاً کمی بعد کد جدید بگیرید." };
    }

    const candidateHash = CryptoVault.blindIndex(`otp:${normalizedPhone}:${code.trim()}`);
    if (candidateHash !== row.otp_hash) {
      db.prepare("UPDATE otp_verifications SET attempts = attempts + 1 WHERE phone_blind_index = ?").run(blind);
      return { ok: false, error: "کد تایید واردشده صحیح نیست." };
    }

    // Valid OTP: delete challenge & upgrade customer_accounts to VERIFIED permanent account
    db.prepare("DELETE FROM otp_verifications WHERE phone_blind_index = ?").run(blind);
    this.identifyOrCreateCustomerAccount(normalizedPhone);
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE customer_accounts
      SET account_type = 'VERIFIED',
          is_verified = 1,
          verified_at = ?,
          expires_at = NULL,
          updated_at = ?
      WHERE phone_blind_index = ?
    `).run(nowIso, nowIso, blind);

    return {
      ok: true,
      account: this.getCustomerAccountByPhone(normalizedPhone),
    };
  }
};

// Export durable background processors and services
export const outboxProcessor = new OutboxProcessor(() => db);
export const paymentStateMachine = new PaymentStateMachine(() => db);

// Automatically start outbox worker if not in test runner
if (process.env.NODE_ENV !== "test") {
  outboxProcessor.start(1500);
}
