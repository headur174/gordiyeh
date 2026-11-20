import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { CryptoVault } from "./cryptoVault";
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

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "commerce.db");
const db = new DatabaseSync(dbPath);

// Enable WAL for performance and durability
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Database Tables
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
  `);
}

initSchema();

// Safe migration check
try {
  db.exec("ALTER TABLE orders ADD COLUMN phone_blind_index TEXT;");
} catch {
  // Column already exists
}

// Auto-seed and sync initial master data
function seedDatabaseIfNeeded() {
  // Sync Products (ensuring ported products from procurement catalog are always present)
  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (id, sku, title, category, brand, retailPrice, stock, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const prod of INITIAL_PRODUCTS) {
    const totalStock = prod.supplierOffers?.reduce((s, o) => s + (o.stock || 0), 0) || 10;
    insertProduct.run(
      prod.id,
      prod.sku,
      prod.title,
      prod.category,
      prod.brand || prod.brandFa || "",
      prod.retailPrice,
      totalStock,
      JSON.stringify(prod)
    );
  }

  // Suppliers
  const insertSupplier = db.prepare(`
    INSERT OR REPLACE INTO suppliers (id, name, code, data)
    VALUES (?, ?, ?, ?)
  `);
  for (const sup of INITIAL_SUPPLIERS) {
    insertSupplier.run(sup.id, sup.name, sup.code, JSON.stringify(sup));
  }

  // Rules
  const insertRule = db.prepare(`
    INSERT OR REPLACE INTO rules (id, name, category, isEnabled, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const rule of INITIAL_RULES) {
    insertRule.run(rule.id, rule.name, rule.category, rule.isEnabled ? 1 : 0, JSON.stringify(rule));
  }

  // KV Stores
  const insertKV = db.prepare(`INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)`);
  insertKV.run("automation_matrix", JSON.stringify(INITIAL_AUTOMATION_MATRIX));
  insertKV.run("financial_summary", JSON.stringify(INITIAL_FINANCIAL_SUMMARY));
  insertKV.run("site_config", JSON.stringify(INITIAL_SITE_CONFIG));

  // Approvals
  const insertApproval = db.prepare(`
    INSERT OR IGNORE INTO approvals (id, status, priority, createdAt, data)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const app of INITIAL_APPROVALS) {
    insertApproval.run(app.id, app.status, app.priority, app.createdAt, JSON.stringify(app));
  }

  // Decision Logs
  const insertLog = db.prepare(`
    INSERT OR IGNORE INTO decision_logs (id, timestamp, eventTrigger, data)
    VALUES (?, ?, ?, ?)
  `);
  for (const log of INITIAL_DECISION_LOGS) {
    insertLog.run(log.id, log.timestamp, log.eventTrigger, JSON.stringify(log));
  }

  // Calendar Events
  const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO calendar_events (id, date, data)
    VALUES (?, ?, ?)
  `);
  for (const ev of INITIAL_CALENDAR_EVENTS) {
    insertEvent.run(ev.id, ev.dateStr || "", JSON.stringify(ev));
  }

  // Blog Posts
  const insertBlog = db.prepare(`
    INSERT OR REPLACE INTO blog_posts (id, slug, title, data)
    VALUES (?, ?, ?, ?)
  `);
  for (const b of INITIAL_BLOG_POSTS) {
    insertBlog.run(b.id, b.slug, b.title, JSON.stringify(b));
  }

  // Static Pages
  const insertPage = db.prepare(`
    INSERT OR REPLACE INTO static_pages (id, slug, title, data)
    VALUES (?, ?, ?, ?)
  `);
  for (const p of INITIAL_STATIC_PAGES) {
    insertPage.run(p.id, p.slug, p.title, JSON.stringify(p));
  }

  // Categories
  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (id, slug, name, data)
    VALUES (?, ?, ?, ?)
  `);
  for (const c of INITIAL_CATEGORIES) {
    insertCategory.run(c.id, c.slug, c.name, JSON.stringify(c));
  }

  // Default WooCommerce Integration Record
  const insertIntegration = db.prepare(`
    INSERT OR IGNORE INTO integrations (id, provider, config, updatedAt)
    VALUES (?, ?, ?, ?)
  `);
  insertIntegration.run(
    "woocommerce",
    "woocommerce",
    JSON.stringify({
      storeUrl: "",
      consumerKey: "",
      consumerSecret: "",
      lastSyncTime: null,
      syncStatus: "IDLE",
      importedProductsCount: 0,
      notes: "برای وارد کردن محصولات تأمینتو، کلیدهای افزونه ووکامرس را وارد نمایید."
    }),
    new Date().toISOString()
  );

  // Initial Manual Tasks for Iran Network Resilience
  const insertTask = db.prepare(`
    INSERT OR IGNORE INTO manual_tasks (id, category, priority, status, createdAt, data)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const t of INITIAL_MANUAL_TASKS) {
    insertTask.run(t.id, t.category, t.priority, t.status, t.createdAt, JSON.stringify(t));
  }

  // Prune any legacy test orders encrypted with an obsolete/lost key from previous ephemeral test runs
  try {
    const existingOrders = db.prepare("SELECT id, data FROM orders").all() as { id: string; data: string }[];
    for (const ord of existingOrders) {
      if (!CryptoVault.decryptJson(ord.data)) {
        db.prepare("DELETE FROM orders WHERE id = ?").run(ord.id);
      }
    }
  } catch (err) {
    // Ignore migration cleanup
  }

  console.log("SQLite database seeded successfully.");
}

seedDatabaseIfNeeded();

// Export Database Access Methods
export const CommerceDB = {
  // Bootstrap entire state for fast client loading
  getBootstrap() {
    // Products
    const prodRows = db.prepare("SELECT data FROM products").all() as { data: string }[];
    const products: CanonicalProduct[] = prodRows.map(r => JSON.parse(r.data));

    // Suppliers
    const supRows = db.prepare("SELECT data FROM suppliers").all() as { data: string }[];
    const suppliers: Supplier[] = supRows.map(r => JSON.parse(r.data));

    // Rules
    const ruleRows = db.prepare("SELECT data FROM rules").all() as { data: string }[];
    const rules: BusinessRule[] = ruleRows.map(r => JSON.parse(r.data));

    // KV store items
    const getKV = (k: string) => {
      const row = db.prepare("SELECT value FROM kv_store WHERE key = ?").get(k) as { value: string } | undefined;
      return row ? JSON.parse(row.value) : null;
    };

    const automationMatrix: AutomationMatrix = getKV("automation_matrix") || INITIAL_AUTOMATION_MATRIX;
    const summary: StoreFinancialSummary = getKV("financial_summary") || INITIAL_FINANCIAL_SUMMARY;
    const siteConfig: SiteConfig = getKV("site_config") || INITIAL_SITE_CONFIG;

    // Approvals
    const apprRows = db.prepare("SELECT data FROM approvals ORDER BY ROWID DESC").all() as { data: string }[];
    const approvals: ApprovalItem[] = apprRows.map(r => JSON.parse(r.data));

    // Decision Logs
    const logRows = db.prepare("SELECT data FROM decision_logs ORDER BY ROWID DESC LIMIT 50").all() as { data: string }[];
    const decisionLogs: DecisionLog[] = logRows.map(r => JSON.parse(r.data));

    // Calendar Events
    const evRows = db.prepare("SELECT data FROM calendar_events").all() as { data: string }[];
    const events: CalendarEvent[] = evRows.map(r => JSON.parse(r.data));

    // Blog Posts
    const blogRows = db.prepare("SELECT data FROM blog_posts").all() as { data: string }[];
    const blogPosts: BlogPost[] = blogRows.map(r => JSON.parse(r.data));

    // Static Pages
    const pageRows = db.prepare("SELECT data FROM static_pages").all() as { data: string }[];
    const staticPages: StaticPage[] = pageRows.map(r => JSON.parse(r.data));

    // Categories
    const catRows = db.prepare("SELECT data FROM categories").all() as { data: string }[];
    const categories: CategoryDetail[] = catRows.map(r => JSON.parse(r.data));

    // Orders (Field-Level Decrypted from Zero-Plaintext at Rest)
    const orderRows = db.prepare("SELECT data FROM orders ORDER BY ROWID DESC LIMIT 100").all() as { data: string }[];
    const orders = orderRows.map(r => CryptoVault.decryptJson(r.data)).filter(Boolean);

    // Integrations (Encrypted credentials decrypted safely in memory)
    const integRows = db.prepare("SELECT id, provider, config, updatedAt FROM integrations").all() as any[];
    const integrations = integRows.map(r => ({
      id: r.id,
      provider: r.provider,
      config: CryptoVault.decryptJson(r.config),
      updatedAt: r.updatedAt
    }));

    // Webhooks
    const webhookRows = db.prepare("SELECT id, name, url, enabled, createdAt FROM webhooks").all() as any[];

    // Manual Fallback Tasks (Iran Network Resilience)
    let manualTasks: ManualTask[] = [];
    try {
      const taskRows = db.prepare("SELECT data FROM manual_tasks ORDER BY ROWID DESC").all() as { data: string }[];
      manualTasks = taskRows.map(r => JSON.parse(r.data));
    } catch {
      manualTasks = INITIAL_MANUAL_TASKS;
    }

    if (manualTasks.length === 0) {
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

  // Manual Tasks Queue (Iran Sovereign & Resilience Operations)
  getManualTasks(): ManualTask[] {
    try {
      const rows = db.prepare("SELECT data FROM manual_tasks ORDER BY ROWID DESC").all() as { data: string }[];
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

  // Products
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

  // Orders (Military-Grade AES-256-GCM Encryption at Rest)
  getOrders(): any[] {
    const rows = db.prepare("SELECT data FROM orders ORDER BY ROWID DESC").all() as { data: string }[];
    return rows.map(r => CryptoVault.decryptJson(r.data)).filter(Boolean);
  },

  lookupOrder(query: string): any | null {
    const clean = query.trim();
    const phoneBlind = CryptoVault.blindIndex(clean);

    // Direct blind index query (Zero plaintext exposed to SQL)
    const row = db.prepare(`
      SELECT data FROM orders
      WHERE orderNumber = ? OR id = ? OR phone_blind_index = ?
      LIMIT 1
    `).get(clean, clean, phoneBlind) as { data: string } | undefined;
    if (row) return CryptoVault.decryptJson(row.data);

    // Decrypted in-memory fallback search for partial names/tracking codes
    const allRows = db.prepare("SELECT data FROM orders ORDER BY ROWID DESC LIMIT 100").all() as { data: string }[];
    for (const r of allRows) {
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
    }
    return null;
  },

  createOrder(order: any) {
    // 1. Zero-Plaintext field encryption
    const encryptedData = CryptoVault.encryptJson(order);
    const encryptedName = CryptoVault.encryptString(order.customerName || "");
    const encryptedPhone = CryptoVault.encryptString(order.phone || "");
    const phoneBlindIndex = CryptoVault.blindIndex(order.phone || "");

    const stmt = db.prepare(`
      INSERT INTO orders (id, orderNumber, customerName, phone, phone_blind_index, totalAmount, status, riskScore, createdAt, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
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

    // 2. Decrement stock on matching products
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const prod = this.getProductById(item.id || item.productId);
        if (prod) {
          prod.supplierOffers = prod.supplierOffers.map(off => {
            if (off.id === prod.selectedOfferId) {
              return { ...off, stock: Math.max(0, off.stock - (item.quantity || 1)) };
            }
            return off;
          });
          this.saveProduct(prod);
        }
      }
    }

    // 3. Update Financial Summary in kv_store
    const currentSummary: StoreFinancialSummary = this.getFinancialSummary();
    currentSummary.todayRevenue += order.totalAmount;
    currentSummary.todayContributionProfit += (order.contributionProfit || Math.round(order.totalAmount * 0.28));
    currentSummary.todayOrdersCount += 1;
    this.saveFinancialSummary(currentSummary);

    // 4. If high risk, create approval item
    if (order.requireApproval || order.status === "HIGH_RISK_HOLD") {
      const approvalItem: ApprovalItem = {
        id: `appr_${Date.now()}`,
        priority: "HIGH",
        productTitle: `سفارش جدید مشتری: ${order.orderNumber} (مبلغ: ${order.totalAmount.toLocaleString()} تومان)`,
        category: "ORDERS",
        actionType: "تأیید سفارش مبلغ بالا و اعتبارسنجی ارسال",
        reason: order.approvalReason || `ارزش سفارش (${order.totalAmount.toLocaleString()} تومان) بالاتر از سقف مجاز خودکار ۵M تومان است.`,
        evidence: [
          `مبلغ کل: ${order.totalAmount.toLocaleString()} تومان`,
          `خریدار: ${order.customerName} (${order.city || "تهران"})`,
          `تعداد اقلام: ${order.items?.length || 1} عدد`,
          `درگاه پرداخت: شاپرک / اینترنتی`,
          `کد رهگیری شتاب: ${order.trackingCode}`,
        ],
        expectedImpact: `در صورت تأیید: ارسال فوری و سود خالص +${((order.contributionProfit || Math.round(order.totalAmount * 0.28))).toLocaleString()} تومان`,
        riskScore: order.riskScore || 72,
        currentValue: "وضعیت: در صف تایید ناظر (Hold)",
        proposedValue: "اقدام: تایید نهایی و صدور حواله انبار تأمین‌کننده",
        status: "PENDING",
        createdAt: "هم‌اکنون",
        ruleRefId: "rule_high_val_order",
      };
      this.addApproval(approvalItem);

      this.addDecisionLog({
        id: `log_${Date.now()}`,
        timestamp: "هم‌اکنون",
        eventTrigger: `ثبت سفارش مبلغ بالا: ${order.orderNumber}`,
        decisionTaken: "توقف در صف تأیید ناظر طبق Rule Engine",
        reason: "سفارشات بالاتر از ۵ میلیون تومان نیازمند تایید دستی ناظر سیستم هستند.",
        evidence: approvalItem.evidence,
        ruleMatched: "Rule: High Value Order > 5,000,000 Toman",
        status: "APPROVED_BY_OPERATOR",
        outcome: "سفارش در صف تایید قرار گرفت و تا صدور مجوز ارسال نمی‌گردد.",
      });
    } else {
      this.addDecisionLog({
        id: `log_${Date.now()}`,
        timestamp: "هم‌اکنون",
        eventTrigger: `ثبت سفارش عادی مشتری: ${order.orderNumber}`,
        decisionTaken: "مسیریابی و ارسال خودکار به انبار تأمین‌کننده (Autopilot)",
        reason: "مبلغ و پارامترهای ریسک سفارش در محدوده مجاز قوانین کسب‌وکار بود.",
        evidence: [
          `مبلغ سفارش: ${order.totalAmount.toLocaleString()} تومان`,
          `کد رهگیری: ${order.trackingCode}`,
          `تأمین‌کننده منتخب: ${order.routingSupplier || "انبار مرکزی تهران"}`,
        ],
        ruleMatched: "Rule: Standard Low-Risk Order Routing",
        status: "AUTO_APPLIED",
        outcome: "سفارش پرداخت و حواله تحویل به انبار صادر شد.",
      });
    }

    // 5. Fire Outgoing Webhooks asynchronously
    this.dispatchWebhooks("order.created", order);

    return order;
  },

  // Approvals
  addApproval(item: ApprovalItem) {
    const stmt = db.prepare(`
      INSERT INTO approvals (id, status, priority, createdAt, data)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        data = excluded.data
    `);
    stmt.run(item.id, item.status, item.priority, item.createdAt, JSON.stringify(item));
  },

  updateApprovalStatus(id: string, status: 'APPROVED' | 'REJECTED', outcomeReason?: string) {
    const row = db.prepare("SELECT data FROM approvals WHERE id = ?").get(id) as { data: string } | undefined;
    if (row) {
      const item: ApprovalItem = JSON.parse(row.data);
      item.status = status;
      const stmt = db.prepare(`
        UPDATE approvals SET status = ?, data = ? WHERE id = ?
      `);
      stmt.run(status, JSON.stringify(item), id);

      // Log decision
      this.addDecisionLog({
        id: `log_${Date.now()}`,
        timestamp: "هم‌اکنون",
        eventTrigger: `تعیین تکلیف ناظر بر آیتم: ${item.actionType}`,
        decisionTaken: status === "APPROVED" ? "تأیید اقدام توسط ناظر (Approved)" : "رد اقدام توسط ناظر (Rejected)",
        reason: outcomeReason || item.reason,
        evidence: item.evidence,
        status: status === "APPROVED" ? "APPROVED_BY_OPERATOR" : "REJECTED_BY_OPERATOR",
        outcome: status === "APPROVED" ? "مجوز اجرا با موفقیت به اتوپایلوت صادر شد." : "عملیات متوقف گردید."
      });
    }
  },

  // Decision Logs
  addDecisionLog(log: DecisionLog) {
    const stmt = db.prepare(`
      INSERT INTO decision_logs (id, timestamp, eventTrigger, data)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(log.id, log.timestamp, log.eventTrigger, JSON.stringify(log));
  },

  // Rules
  saveRules(rules: BusinessRule[]) {
    const stmt = db.prepare(`
      INSERT INTO rules (id, name, category, isEnabled, data)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        isEnabled = excluded.isEnabled,
        data = excluded.data
    `);
    for (const r of rules) {
      stmt.run(r.id, r.name, r.category, r.isEnabled ? 1 : 0, JSON.stringify(r));
    }
  },

  updateRule(id: string, updates: Partial<BusinessRule>) {
    const row = db.prepare("SELECT data FROM rules WHERE id = ?").get(id) as { data: string } | undefined;
    if (row) {
      const rule = { ...JSON.parse(row.data), ...updates };
      const stmt = db.prepare(`
        UPDATE rules SET isEnabled = ?, data = ? WHERE id = ?
      `);
      stmt.run(rule.isEnabled ? 1 : 0, JSON.stringify(rule), id);
      return rule;
    }
    return null;
  },

  // Automation Matrix
  saveAutomationMatrix(matrix: AutomationMatrix) {
    db.prepare("INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)").run(
      "automation_matrix",
      JSON.stringify(matrix)
    );
  },

  // Financial Summary
  getFinancialSummary(): StoreFinancialSummary {
    const row = db.prepare("SELECT value FROM kv_store WHERE key = ?").get("financial_summary") as { value: string } | undefined;
    return row ? JSON.parse(row.value) : INITIAL_FINANCIAL_SUMMARY;
  },

  saveFinancialSummary(summary: StoreFinancialSummary) {
    db.prepare("INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)").run(
      "financial_summary",
      JSON.stringify(summary)
    );
  },

  // Site Config (No-Code CMS)
  getSiteConfig(): SiteConfig {
    const row = db.prepare("SELECT value FROM kv_store WHERE key = ?").get("site_config") as { value: string } | undefined;
    return row ? JSON.parse(row.value) : INITIAL_SITE_CONFIG;
  },

  saveSiteConfig(config: SiteConfig) {
    db.prepare("INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)").run(
      "site_config",
      JSON.stringify(config)
    );
  },

  // Blog Posts
  saveBlogPost(post: BlogPost) {
    const stmt = db.prepare(`
      INSERT INTO blog_posts (id, slug, title, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        data = excluded.data
    `);
    stmt.run(post.id, post.slug, post.title, JSON.stringify(post));
    this.dispatchWebhooks("blog.published", post);
  },

  deleteBlogPost(id: string) {
    db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
  },

  // Static Pages
  saveStaticPage(page: StaticPage) {
    const stmt = db.prepare(`
      INSERT INTO static_pages (id, slug, title, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        title = excluded.title,
        data = excluded.data
    `);
    stmt.run(page.id, page.slug, page.title, JSON.stringify(page));
  },

  // Categories
  saveCategory(cat: CategoryDetail) {
    const stmt = db.prepare(`
      INSERT INTO categories (id, slug, name, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        data = excluded.data
    `);
    stmt.run(cat.id, cat.slug, cat.name, JSON.stringify(cat));
  },

  // Integrations (WooCommerce / Tamineto / Providers)
  getIntegration(provider: string) {
    const row = db.prepare("SELECT * FROM integrations WHERE provider = ?").get(provider) as any;
    if (row) {
      return {
        id: row.id,
        provider: row.provider,
        config: CryptoVault.decryptJson(row.config),
        updatedAt: row.updatedAt
      };
    }
    return null;
  },

  saveIntegration(provider: string, config: any) {
    const stmt = db.prepare(`
      INSERT INTO integrations (id, provider, config, updatedAt)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        config = excluded.config,
        updatedAt = excluded.updatedAt
    `);
    const updatedAt = new Date().toISOString();
    const encryptedConfig = CryptoVault.encryptJson(config);
    stmt.run(provider, provider, encryptedConfig, updatedAt);
    return { provider, config, updatedAt };
  },

  // Customer Memory & Privacy Hub (COCA Phase 7 - Zero-Plaintext at Rest)
  getCustomerMemory(customerId: string) {
    const blind = CryptoVault.blindIndex(customerId);
    const row = db.prepare(`
      SELECT data FROM customer_memory
      WHERE blind_hash = ? OR id = ?
      LIMIT 1
    `).get(blind, customerId) as { data: string } | undefined;

    if (!row) return null;
    return CryptoVault.decryptJson(row.data);
  },

  saveCustomerMemory(customerId: string, memory: any) {
    const blind = CryptoVault.blindIndex(customerId);
    const encryptedData = CryptoVault.encryptJson(memory);
    const updatedAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO customer_memory (id, customer_id, blind_hash, data, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    stmt.run(customerId, CryptoVault.encryptString(customerId), blind, encryptedData, updatedAt);
    return memory;
  },

  resetCustomerMemory(customerId: string) {
    const blind = CryptoVault.blindIndex(customerId);
    db.prepare(`
      DELETE FROM customer_memory
      WHERE blind_hash = ? OR id = ?
    `).run(blind, customerId);
    return { success: true, customerId };
  },

  // Outgoing Webhooks (n8n / Telegram / Zapier)
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

  async dispatchWebhooks(event: string, payload: any) {
    try {
      const hooks = this.getWebhooks().filter(h => h.enabled);
      if (!hooks.length) return;

      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      });

      for (const hook of hooks) {
        if (!hook.url) continue;
        fetch(hook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        }).catch(err => {
          console.warn(`Webhook dispatch to ${hook.url} failed:`, err.message);
        });
      }
    } catch (e) {
      console.warn("Failed to dispatch webhooks:", e);
    }
  }
};
