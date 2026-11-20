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
  `);

  // Migration guard: ensure lease_token column exists in existing outbox_events tables
  try {
    db.exec("ALTER TABLE outbox_events ADD COLUMN lease_token TEXT;");
  } catch {
    // Column already exists
  }
}

initSchema();

// Seed Database on startup if empty
function seedDatabaseIfNeeded() {
  // Repair legacy broken external image URLs in pre-existing product rows
  try {
    const legacyImageFixes: Array<[string, string]> = [
      ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80', '/assets/products/massage-gun.jpg'],
      ['https://images.unsplash.com/photo-1512290900672-1f55b991b585?w=600&auto=format&fit=crop&q=80', '/assets/products/microderm.jpg'],
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
  }
};

// Export durable background processors and services
export const outboxProcessor = new OutboxProcessor(() => db);
export const paymentStateMachine = new PaymentStateMachine(() => db);

// Automatically start outbox worker if not in test runner
if (process.env.NODE_ENV !== "test") {
  outboxProcessor.start(1500);
}
