import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import { CryptoVault } from "../cryptoVault";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "HIGH_RISK_HOLD"
  | "FULFILLMENT_IN_PROGRESS"
  | "DISPATCHED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "INITIATED" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface PaymentTransactionRecord {
  id: string;
  order_id: string;
  idempotency_key: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider_ref: string | null;
  error_message: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000;
const LIVE_BANK_PROVIDERS = new Set(["zarinpal", "zibal", "idpay"]);
const schemaVerifiedDbs = new WeakSet<DatabaseSync>();

function buildInitialSummaryDefaults() {
  return {
    todayRevenue: 0,
    todayContributionProfit: 0,
    todayOrdersCount: 0,
    averageOrderValue: 0,
    profitMarginPercent: 0,
    winnersCount: 10,
    problemsCount: 0,
    stockIssuesCount: 0,
    priceOpportunitiesCount: 0,
    campaignOpportunitiesCount: 0,
    grossSales: 0,
    collectedPayments: 0,
    refunds: 0,
    netRevenue: 0,
    supplierCost: 0,
    shippingCost: 0,
    paymentFee: 0,
    contributionProfit: 0,
    pendingOrdersCount: 0,
    paidOrdersCount: 0,
    refundedOrdersCount: 0,
  };
}

export function ensurePaymentSchema(db: DatabaseSync): void {
  if (schemaVerifiedDbs.has(db)) return;

  const orderCols = (db.prepare("PRAGMA table_info(orders)").all() as Array<{ name: string }>).map((c) => c.name);
  if (!orderCols.includes("created_at_iso")) {
    db.exec("ALTER TABLE orders ADD COLUMN created_at_iso TEXT;");
  }
  if (!orderCols.includes("stock_released")) {
    db.exec("ALTER TABLE orders ADD COLUMN stock_released INTEGER NOT NULL DEFAULT 0;");
  }
  if (!orderCols.includes("financial_settled")) {
    db.exec("ALTER TABLE orders ADD COLUMN financial_settled INTEGER NOT NULL DEFAULT 0;");
  }

  const txCols = (db.prepare("PRAGMA table_info(payment_transactions)").all() as Array<{ name: string }>).map(
    (c) => c.name
  );
  if (!txCols.includes("expires_at")) {
    db.exec("ALTER TABLE payment_transactions ADD COLUMN expires_at TEXT;");
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payment_tx_order ON payment_transactions(order_id, status);
    CREATE INDEX IF NOT EXISTS idx_payment_tx_ref ON payment_transactions(provider_ref);
    CREATE TABLE IF NOT EXISTS stock_recovery_errors (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      error_message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  schemaVerifiedDbs.add(db);
}

function recordStockRecoveryError(db: DatabaseSync, orderId: string, stage: string, message: string): void {
  try {
    db.prepare(`
      INSERT INTO stock_recovery_errors (id, order_id, stage, error_message, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(`sre_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`, orderId, stage, message, new Date().toISOString());
  } catch {
    // Best-effort audit insert before caller rethrows
  }
}

export class PaymentStateMachine {
  constructor(private readonly getDb: () => DatabaseSync) {}

  /**
   * Constant-time signature verification for payment gateway callbacks (Gate 3).
   */
  public verifyCallbackSignature(payloadString: string, secret: string, providedSignatureHex: string): boolean {
    if (!payloadString || !secret || !providedSignatureHex) return false;
    try {
      const computed = crypto.createHmac("sha256", secret).update(payloadString).digest();
      const provided = Buffer.from(providedSignatureHex, "hex");
      if (computed.length !== provided.length) return false;
      return crypto.timingSafeEqual(computed, provided);
    } catch {
      return false;
    }
  }

  /**
   * Atomically restores stock for an order back into the exact supplierOffer & aggregate product stock.
   * Never swallows decryption/corrupt payload errors when encrypted order data is present.
   */
  public restockOrderItems(
    db: DatabaseSync,
    orderId: string,
    encryptedOrJsonOrderData: string | null | undefined
  ): void {
    if (!encryptedOrJsonOrderData) return;

    let rawOrder: any = null;
    try {
      rawOrder = CryptoVault.decryptJson<any>(encryptedOrJsonOrderData);
    } catch (err: any) {
      const msg = `Failed to decrypt order '${orderId}' during restock: ${err?.message || err}`;
      console.error("[InventoryRecovery]", msg);
      recordStockRecoveryError(db, orderId, "DECRYPT", msg);
      throw new Error(msg);
    }

    if (!rawOrder || !Array.isArray(rawOrder.items)) {
      const msg = `Invalid order payload structure for '${orderId}' during restock`;
      console.error("[InventoryRecovery]", msg);
      recordStockRecoveryError(db, orderId, "PARSE", msg);
      throw new Error(msg);
    }

    for (const it of rawOrder.items) {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const prodRow = db
        .prepare(`SELECT id, stock, data FROM products WHERE id = ?`)
        .get(it.id || it.productId) as { id: string; stock: number; data: string } | undefined;
      if (!prodRow) continue;

      let nextData = prodRow.data;
      let nextStock = Math.max(0, Number(prodRow.stock || 0)) + qty;

      const prodObj = JSON.parse(prodRow.data);
      if (Array.isArray(prodObj?.supplierOffers) && prodObj.supplierOffers.length > 0) {
        const targetOfferId = it.offerId || prodObj.selectedOfferId || prodObj.supplierOffers[0].id;
        let matched = false;
        prodObj.supplierOffers = prodObj.supplierOffers.map((off: any) => {
          if (off.id === targetOfferId) {
            matched = true;
            return { ...off, stock: Math.max(0, Number(off.stock || 0)) + qty };
          }
          return off;
        });
        if (!matched) {
          prodObj.supplierOffers[0] = {
            ...prodObj.supplierOffers[0],
            stock: Math.max(0, Number(prodObj.supplierOffers[0].stock || 0)) + qty,
          };
        }
        nextStock = prodObj.supplierOffers.reduce((sum: number, off: any) => sum + Math.max(0, Number(off.stock || 0)), 0);
        nextData = JSON.stringify(prodObj);
      }

      db.prepare(`UPDATE products SET stock = ?, data = ? WHERE id = ?`).run(nextStock, nextData, prodRow.id);
    }
  }

  /**
   * Updates kv_store['financial_summary'] strictly on settled payments and refunds using real order figures.
   */
  public settleOrderFinancialSummary(
    db: DatabaseSync,
    orderRow: { totalAmount: number; data?: string | null },
    mode: "PAID" | "REFUNDED",
    refundAmount: number = 0
  ): void {
    let parsedOrder: any = null;
    if (orderRow.data) {
      try {
        parsedOrder = CryptoVault.decryptJson<any>(orderRow.data, null);
      } catch {
        parsedOrder = null;
      }
    }

    const totalAmount = Number(orderRow.totalAmount ?? parsedOrder?.totalAmount ?? 0);
    const shippingCost = Number(parsedOrder?.shippingCost || 0);
    const paymentFee = Number(parsedOrder?.paymentFee || 0);
    const supplierCost = Number(parsedOrder?.supplierCost ?? 0);
    const contributionProfit = Number(
      parsedOrder?.contributionProfit ?? totalAmount - supplierCost - shippingCost - paymentFee
    );

    const sumRow = db.prepare("SELECT value FROM kv_store WHERE key = 'financial_summary'").get() as
      | { value: string }
      | undefined;
    const current = {
      ...buildInitialSummaryDefaults(),
      ...(sumRow ? JSON.parse(sumRow.value) : {}),
    };

    if (mode === "PAID") {
      current.grossSales += totalAmount;
      current.collectedPayments += totalAmount;
      current.netRevenue = Math.max(0, current.collectedPayments - current.refunds);
      current.supplierCost += supplierCost;
      current.shippingCost += shippingCost;
      current.paymentFee += paymentFee;
      current.contributionProfit += contributionProfit;
      current.paidOrdersCount += 1;
      current.pendingOrdersCount = Math.max(0, Number(current.pendingOrdersCount || 0) - 1);
    } else {
      const ratio = totalAmount > 0 ? Math.min(1, Math.max(0, refundAmount) / totalAmount) : 1;
      current.refunds += Math.max(0, refundAmount);
      current.netRevenue = Math.max(0, current.collectedPayments - current.refunds);
      current.supplierCost = Math.max(0, current.supplierCost - Math.round(supplierCost * ratio));
      current.shippingCost = Math.max(0, current.shippingCost - Math.round(shippingCost * ratio));
      current.paymentFee = Math.max(0, current.paymentFee - Math.round(paymentFee * ratio));
      current.contributionProfit -= Math.round(contributionProfit * ratio);
      current.refundedOrdersCount += 1;
      current.paidOrdersCount = Math.max(0, Number(current.paidOrdersCount || 0) - 1);
    }

    current.todayRevenue = current.netRevenue;
    current.todayContributionProfit = current.contributionProfit;
    current.todayOrdersCount = current.paidOrdersCount;
    current.averageOrderValue =
      current.paidOrdersCount > 0 ? Math.round(current.netRevenue / current.paidOrdersCount) : 0;
    current.profitMarginPercent =
      current.netRevenue > 0 ? Math.round((current.contributionProfit / current.netRevenue) * 1000) / 10 : 0;

    db.prepare(`
      INSERT INTO kv_store (key, value)
      VALUES ('financial_summary', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(JSON.stringify(current));
  }

  /**
   * Cancels a single expired PENDING_PAYMENT order and restores its stock cleanly once.
   */
  public cancelExpiredOrderInTx(
    db: DatabaseSync,
    orderRow: { id: string; status: string; stock_released?: number; data?: string | null },
    reason: string = "Unpaid order reservation expired"
  ): boolean {
    if (orderRow.status !== "PENDING_PAYMENT") return false;
    const now = new Date().toISOString();
    const res = db
      .prepare(`UPDATE orders SET status = 'CANCELLED' WHERE id = ? AND status = 'PENDING_PAYMENT'`)
      .run(orderRow.id);
    if (Number(res.changes) === 0) return false;

    db.prepare(`
      UPDATE payment_transactions
      SET status = 'FAILED', error_message = COALESCE(error_message, ?), updated_at = ?
      WHERE order_id = ? AND status = 'INITIATED'
    `).run(reason, now, orderRow.id);

    if (Number(orderRow.stock_released || 0) === 0) {
      this.restockOrderItems(db, orderRow.id, orderRow.data);
      db.prepare(`UPDATE orders SET stock_released = 1 WHERE id = ?`).run(orderRow.id);
    }

    const sumRow = db.prepare("SELECT value FROM kv_store WHERE key = 'financial_summary'").get() as
      | { value: string }
      | undefined;
    if (sumRow) {
      const current = { ...buildInitialSummaryDefaults(), ...JSON.parse(sumRow.value) };
      current.pendingOrdersCount = Math.max(0, Number(current.pendingOrdersCount || 0) - 1);
      db.prepare(`UPDATE kv_store SET value = ? WHERE key = 'financial_summary'`).run(JSON.stringify(current));
    }

    return true;
  }

  /**
   * Initiates or idempotently reuses an active payment session for PENDING_PAYMENT / HIGH_RISK_HOLD orders.
   */
  public initiatePayment(params: {
    orderId: string;
    provider?: string;
    ttlMs?: number;
  }): {
    transactionId: string;
    idempotencyKey: string;
    orderId: string;
    amount: number;
    currency: string;
    gatewayUrl: string;
    expiresAt: string;
    reused: boolean;
  } {
    const db = this.getDb();
    ensurePaymentSchema(db);
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const ttlMs = params.ttlMs ?? DEFAULT_SESSION_TTL_MS;
    const requestedProvider = params.provider || "SHAPARAK_SANDBOX";

    db.exec("BEGIN IMMEDIATE;");
    try {
      const orderRow = db
        .prepare(
          `SELECT id, orderNumber, totalAmount, status, created_at_iso, stock_released, data
           FROM orders WHERE id = ? OR orderNumber = ? LIMIT 1`
        )
        .get(params.orderId, params.orderId) as any;

      if (!orderRow) {
        const err = new Error(`Order '${params.orderId}' not found for payment initiation`);
        (err as any).statusCode = 404;
        throw err;
      }

      if (orderRow.status !== "PENDING_PAYMENT" && orderRow.status !== "HIGH_RISK_HOLD") {
        const err = new Error(`Order '${params.orderId}' cannot initiate payment from status '${orderRow.status}'`);
        (err as any).statusCode = 409;
        throw err;
      }

      // Check order reservation TTL if created_at_iso is tracked
      if (orderRow.status === "PENDING_PAYMENT" && orderRow.created_at_iso) {
        const createdMs = new Date(orderRow.created_at_iso).getTime();
        if (Number.isFinite(createdMs) && nowMs - createdMs > DEFAULT_SESSION_TTL_MS) {
          this.cancelExpiredOrderInTx(db, orderRow, "Order payment reservation expired before initiation");
          db.exec("COMMIT;");
          const err = new Error("مهلت پرداخت این سفارش به پایان رسیده و رزرو موجودی آزاد شده است.");
          (err as any).statusCode = 409;
          throw err;
        }
      }

      // Reuse existing valid non-expired INITIATED transaction for the same order/amount/provider
      const existingOpen = db
        .prepare(
          `SELECT * FROM payment_transactions
           WHERE order_id = ? AND status = 'INITIATED'
           ORDER BY created_at DESC LIMIT 1`
        )
        .get(orderRow.id) as unknown as PaymentTransactionRecord | undefined;

      if (existingOpen) {
        const expMs = existingOpen.expires_at ? new Date(existingOpen.expires_at).getTime() : nowMs + ttlMs;
        const notExpired = Number.isFinite(expMs) && expMs > nowMs;
        if (
          notExpired &&
          existingOpen.amount === orderRow.totalAmount &&
          (!params.provider || existingOpen.provider === requestedProvider)
        ) {
          db.exec("COMMIT;");
          return {
            transactionId: existingOpen.id,
            idempotencyKey: existingOpen.idempotency_key,
            orderId: orderRow.id,
            amount: existingOpen.amount,
            currency: existingOpen.currency || "IRT",
            gatewayUrl: `https://gateway.shaparak.ir/pay/${existingOpen.id}`,
            expiresAt: existingOpen.expires_at || new Date(expMs).toISOString(),
            reused: true,
          };
        }

        // Mark stale / superseded INITIATED rows FAILED before opening a replacement
        db.prepare(`
          UPDATE payment_transactions
          SET status = 'FAILED', error_message = 'Superseded or expired payment session', updated_at = ?
          WHERE order_id = ? AND status = 'INITIATED'
        `).run(nowIso, orderRow.id);
      }

      const txId = `tx_${nowMs}_${crypto.randomUUID().slice(0, 8)}`;
      const idempotencyKey = `idemp_init_${orderRow.id}_${nowMs}`;
      const expiresAt = new Date(nowMs + ttlMs).toISOString();

      db.prepare(`
        INSERT INTO payment_transactions (
          id, order_id, idempotency_key, provider, amount, currency, status, provider_ref, expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'IRT', 'INITIATED', NULL, ?, ?, ?)
      `).run(txId, orderRow.id, idempotencyKey, requestedProvider, orderRow.totalAmount, expiresAt, nowIso, nowIso);

      db.exec("COMMIT;");

      return {
        transactionId: txId,
        idempotencyKey,
        orderId: orderRow.id,
        amount: orderRow.totalAmount,
        currency: "IRT",
        gatewayUrl: `https://gateway.shaparak.ir/pay/${txId}`,
        expiresAt,
        reused: false,
      };
    } catch (err) {
      try {
        db.exec("ROLLBACK;");
      } catch {
        // Transaction may already be closed
      }
      throw err;
    }
  }

  /**
   * Persists the bank gateway authority / trackId on the initiated payment transaction.
   */
  public attachProviderRef(transactionId: string, providerRef: string, provider?: string): void {
    const db = this.getDb();
    ensurePaymentSchema(db);
    const now = new Date().toISOString();
    if (provider) {
      db.prepare(`
        UPDATE payment_transactions
        SET provider_ref = ?, provider = ?, updated_at = ?
        WHERE id = ?
      `).run(providerRef, provider, now, transactionId);
    } else {
      db.prepare(`
        UPDATE payment_transactions
        SET provider_ref = ?, updated_at = ?
        WHERE id = ?
      `).run(providerRef, now, transactionId);
    }
  }

  /**
   * Looks up a payment transaction & authoritative order total using orderId, txId, or provider authority.
   * Rejects mismatched cross-order identifiers (e.g. txId/orderId paired with another order's authority).
   */
  public lookupPendingTransaction(params: {
    orderId?: string;
    txId?: string;
    authority?: string;
  }): {
    transaction: PaymentTransactionRecord | null;
    orderId: string;
    orderNumber: string;
    amount: number;
    orderStatus: OrderStatus;
    provider: string;
    authority: string;
  } | null {
    const db = this.getDb();
    ensurePaymentSchema(db);

    const txById = params.txId
      ? (db.prepare(`SELECT * FROM payment_transactions WHERE id = ? LIMIT 1`).get(params.txId) as unknown as
          | PaymentTransactionRecord
          | undefined)
      : undefined;
    const txByAuth = params.authority
      ? (db
          .prepare(`SELECT * FROM payment_transactions WHERE provider_ref = ? ORDER BY created_at DESC LIMIT 1`)
          .get(params.authority) as unknown as PaymentTransactionRecord | undefined)
      : undefined;

    if (txById && txByAuth && txById.order_id !== txByAuth.order_id) {
      return null;
    }

    let txRow: PaymentTransactionRecord | undefined = txById || txByAuth;
    if (!txRow && params.orderId) {
      txRow = db
        .prepare(`
          SELECT pt.* FROM payment_transactions pt
          JOIN orders o ON pt.order_id = o.id
          WHERE o.id = ? OR o.orderNumber = ?
          ORDER BY pt.created_at DESC LIMIT 1
        `)
        .get(params.orderId, params.orderId) as unknown as PaymentTransactionRecord | undefined;
    }

    const lookupOrderKey = txRow?.order_id || params.orderId;
    if (!lookupOrderKey) return null;

    const orderRow = db
      .prepare(`SELECT id, orderNumber, totalAmount, status FROM orders WHERE id = ? OR orderNumber = ? LIMIT 1`)
      .get(lookupOrderKey, lookupOrderKey) as
      | { id: string; orderNumber: string; totalAmount: number; status: OrderStatus }
      | undefined;

    if (!orderRow) return null;

    if (params.orderId && orderRow.id !== params.orderId && orderRow.orderNumber !== params.orderId) {
      return null;
    }

    return {
      transaction: txRow || null,
      orderId: orderRow.id,
      orderNumber: orderRow.orderNumber,
      amount: orderRow.totalAmount,
      orderStatus: orderRow.status,
      provider: txRow?.provider || "zarinpal",
      authority: params.authority || txRow?.provider_ref || "",
    };
  }

  /**
   * Idempotent & atomic payment callback processor inside BEGIN IMMEDIATE.
   */
  public processCallback(params: {
    orderId: string;
    idempotencyKey: string;
    status: "SUCCESS" | "FAILED";
    providerRef: string;
    amount: number;
    provider?: string;
  }): {
    success: boolean;
    alreadyProcessed: boolean;
    transaction: PaymentTransactionRecord;
    orderStatus: OrderStatus;
  } {
    const db = this.getDb();
    ensurePaymentSchema(db);
    const now = new Date().toISOString();
    const nowMs = Date.now();
    const effectiveProvider = params.provider || "SHAPARAK_GATEWAY";
    const providerRef = String(params.providerRef || "").trim();

    db.exec("BEGIN IMMEDIATE;");
    try {
      // 1. Check idempotencyKey inside the lock
      const existing = db
        .prepare(`SELECT * FROM payment_transactions WHERE idempotency_key = ?`)
        .get(params.idempotencyKey) as unknown as PaymentTransactionRecord | undefined;

      if (existing) {
        const orderRow = db
          .prepare(`SELECT status FROM orders WHERE id = ? OR orderNumber = ?`)
          .get(params.orderId, params.orderId) as { status: OrderStatus } | undefined;
        db.exec("COMMIT;");
        return {
          success: existing.status === "SUCCESS",
          alreadyProcessed: true,
          transaction: existing,
          orderStatus: orderRow ? orderRow.status : existing.status === "SUCCESS" ? "PAID" : "PENDING_PAYMENT",
        };
      }

      // 2. Lookup target order inside lock
      const orderRow = db
        .prepare(
          `SELECT id, orderNumber, totalAmount, status, financial_settled, stock_released, created_at_iso, data
           FROM orders WHERE id = ? OR orderNumber = ? LIMIT 1`
        )
        .get(params.orderId, params.orderId) as any;

      if (!orderRow) {
        const err = new Error(`Order '${params.orderId}' not found for payment callback`);
        (err as any).statusCode = 404;
        throw err;
      }

      // 3. Check duplicate settled providerRef replay across or within orders
      if (params.status === "SUCCESS" && providerRef && providerRef !== "cancelled") {
        const refTx = db
          .prepare(`SELECT * FROM payment_transactions WHERE provider_ref = ? AND status = 'SUCCESS' LIMIT 1`)
          .get(providerRef) as unknown as PaymentTransactionRecord | undefined;
        if (refTx) {
          if (refTx.order_id !== orderRow.id) {
            const err = new Error(`Duplicate providerRef '${providerRef}' already used on another order`);
            (err as any).statusCode = 409;
            throw err;
          }
          db.exec("COMMIT;");
          return {
            success: true,
            alreadyProcessed: true,
            transaction: refTx,
            orderStatus: orderRow.status,
          };
        }
      }

      // 4. Out-of-order protection: Already PAID or REFUNDED order must NEVER revert to FAILED
      if ((orderRow.status === "PAID" || orderRow.status === "REFUNDED") && params.status === "FAILED") {
        const noopTx: PaymentTransactionRecord = {
          id: `tx_noop_${nowMs}`,
          order_id: orderRow.id,
          idempotency_key: params.idempotencyKey,
          provider: effectiveProvider,
          amount: params.amount,
          currency: "IRT",
          status: "FAILED",
          provider_ref: providerRef || null,
          error_message: "Late failed callback rejected for already settled order",
          created_at: now,
          updated_at: now,
        };
        db.exec("COMMIT;");
        return {
          success: true,
          alreadyProcessed: true,
          transaction: noopTx,
          orderStatus: orderRow.status,
        };
      }

      if (params.status === "SUCCESS") {
        if (orderRow.status === "CANCELLED" || orderRow.status === "REFUNDED") {
          const err = new Error(`Cannot confirm SUCCESS callback for ${orderRow.status} order '${orderRow.id}'`);
          (err as any).statusCode = 409;
          throw err;
        }

        if (!Number.isFinite(params.amount) || params.amount <= 0 || params.amount !== orderRow.totalAmount) {
          const err = new Error(
            `Payment amount mismatch: Received ${params.amount}, expected ${orderRow.totalAmount}`
          );
          (err as any).statusCode = 400;
          throw err;
        }

        // Check expiration if order carries created_at_iso and is still PENDING_PAYMENT
        if (orderRow.status === "PENDING_PAYMENT" && orderRow.created_at_iso) {
          const createdMs = new Date(orderRow.created_at_iso).getTime();
          if (Number.isFinite(createdMs) && nowMs - createdMs > DEFAULT_SESSION_TTL_MS) {
            this.cancelExpiredOrderInTx(db, orderRow, "Late SUCCESS callback rejected: order reservation expired");
            db.exec("COMMIT;");
            const err = new Error("مهلت پرداخت سفارش منقضی شده و امکان تایید پرداخت وجود ندارد.");
            (err as any).statusCode = 409;
            throw err;
          }
        }
      }

      const txId = `tx_${nowMs}_${crypto.randomUUID().slice(0, 8)}`;
      const txStatus: PaymentStatus = params.status === "SUCCESS" ? "SUCCESS" : "FAILED";

      // Close open INITIATED sessions on final settlement
      db.prepare(`
        UPDATE payment_transactions
        SET status = 'FAILED', error_message = COALESCE(error_message, 'Superseded by callback'), updated_at = ?
        WHERE order_id = ? AND status = 'INITIATED'
      `).run(now, orderRow.id);

      db.prepare(`
        INSERT INTO payment_transactions (
          id, order_id, idempotency_key, provider, amount, currency, status, provider_ref, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'IRT', ?, ?, ?, ?)
      `).run(
        txId,
        orderRow.id,
        params.idempotencyKey,
        effectiveProvider,
        params.amount,
        txStatus,
        providerRef || null,
        now,
        now
      );

      let targetOrderStatus: OrderStatus = orderRow.status;

      if (params.status === "SUCCESS") {
        targetOrderStatus = orderRow.status === "HIGH_RISK_HOLD" ? "HIGH_RISK_HOLD" : "PAID";
        db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(targetOrderStatus, orderRow.id);

        if (Number(orderRow.financial_settled || 0) === 0) {
          this.settleOrderFinancialSummary(db, orderRow, "PAID");
          db.prepare(`UPDATE orders SET financial_settled = 1 WHERE id = ?`).run(orderRow.id);
        }

        db.prepare(`
          INSERT INTO outbox_events (
            id, topic, schema_version, payload, status, next_retry_at, created_at
          ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
        `).run(
          `evt_pay_${nowMs}_${crypto.randomUUID().slice(0, 6)}`,
          "payment:success",
          1,
          JSON.stringify({
            orderId: orderRow.id,
            orderNumber: orderRow.orderNumber,
            amount: params.amount,
            providerRef,
            status: targetOrderStatus,
          }),
          now,
          now
        );
      } else {
        if (orderRow.status === "PENDING_PAYMENT") {
          targetOrderStatus = "CANCELLED";
          this.cancelExpiredOrderInTx(db, orderRow, "Payment failed or cancelled by customer");
        }
      }

      db.exec("COMMIT;");

      const savedTx: PaymentTransactionRecord = {
        id: txId,
        order_id: orderRow.id,
        idempotency_key: params.idempotencyKey,
        provider: effectiveProvider,
        amount: params.amount,
        currency: "IRT",
        status: txStatus,
        provider_ref: providerRef || null,
        error_message: null,
        created_at: now,
        updated_at: now,
      };

      return {
        success: params.status === "SUCCESS",
        alreadyProcessed: false,
        transaction: savedTx,
        orderStatus: targetOrderStatus,
      };
    } catch (err) {
      try {
        db.exec("ROLLBACK;");
      } catch {
        // Ignore rollback if transaction closed
      }
      throw err;
    }
  }

  /**
   * Atomically processes a refund: validates amount, rejects duplicate/unsupported bank refunds,
   * restores stock once, reverses financial ledger, and emits outbox event.
   */
  public processRefund(params: {
    orderId: string;
    idempotencyKey: string;
    amount: number;
    reason?: string;
    manualRefundConfirmed?: boolean;
  }): {
    success: boolean;
    alreadyProcessed?: boolean;
    orderStatus: OrderStatus;
    refundTransactionId: string;
    settlementMode: string;
  } {
    const db = this.getDb();
    ensurePaymentSchema(db);
    const now = new Date().toISOString();

    db.exec("BEGIN IMMEDIATE;");
    try {
      const existingRefund = db
        .prepare(`SELECT * FROM payment_transactions WHERE idempotency_key = ? AND status = 'REFUNDED' LIMIT 1`)
        .get(params.idempotencyKey) as unknown as PaymentTransactionRecord | undefined;

      if (existingRefund) {
        const orderRow = db
          .prepare(`SELECT status FROM orders WHERE id = ?`)
          .get(existingRefund.order_id) as { status: OrderStatus } | undefined;
        db.exec("COMMIT;");
        return {
          success: true,
          alreadyProcessed: true,
          orderStatus: orderRow?.status || "REFUNDED",
          refundTransactionId: existingRefund.id,
          settlementMode: existingRefund.provider,
        };
      }

      const orderRow = db
        .prepare(
          `SELECT id, orderNumber, totalAmount, status, stock_released, financial_settled, data
           FROM orders WHERE id = ? OR orderNumber = ? LIMIT 1`
        )
        .get(params.orderId, params.orderId) as any;

      if (!orderRow) {
        const err = new Error(`Order '${params.orderId}' not found for refund`);
        (err as any).statusCode = 404;
        throw err;
      }

      if (orderRow.status !== "PAID") {
        const err = new Error(`Only PAID orders can be refunded (current status: ${orderRow.status})`);
        (err as any).statusCode = 409;
        throw err;
      }

      if (!Number.isFinite(params.amount) || params.amount <= 0 || params.amount > Number(orderRow.totalAmount || 0)) {
        const err = new Error(
          `Invalid refund amount ${params.amount}; must be > 0 and <= order total ${orderRow.totalAmount}`
        );
        (err as any).statusCode = 400;
        throw err;
      }

      const refundedAgg = db
        .prepare(
          `SELECT COALESCE(SUM(amount), 0) as totalRefunded FROM payment_transactions WHERE order_id = ? AND status = 'REFUNDED'`
        )
        .get(orderRow.id) as { totalRefunded: number };

      if (Number(refundedAgg?.totalRefunded || 0) + params.amount > Number(orderRow.totalAmount || 0)) {
        const err = new Error("Refund amount exceeds remaining refundable balance for this order.");
        (err as any).statusCode = 409;
        throw err;
      }

      const paidTx = db
        .prepare(
          `SELECT provider FROM payment_transactions WHERE order_id = ? AND status = 'SUCCESS' ORDER BY created_at DESC LIMIT 1`
        )
        .get(orderRow.id) as { provider: string } | undefined;

      const paidProvider = String(paidTx?.provider || "").toLowerCase();
      const isLiveBankPaid = LIVE_BANK_PROVIDERS.has(paidProvider);
      if (isLiveBankPaid && !params.manualRefundConfirmed) {
        const err = new Error(
          `GATEWAY_REFUND_UNSUPPORTED: درگاه «${paidProvider}» استرداد خودکار بانکی ندارد. برای ثبت استرداد دستی پس از عودت بانکی، گزینه تایید استرداد دستی (manualRefundConfirmed) را ارسال کنید.`
        );
        (err as any).statusCode = 400;
        throw err;
      }

      const refundSettlementMode = isLiveBankPaid || params.manualRefundConfirmed ? "MANUAL_SETTLEMENT" : "SANDBOX_REFUND";
      const txId = `tx_ref_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;

      db.prepare(`
        INSERT INTO payment_transactions (
          id, order_id, idempotency_key, provider, amount, currency, status, provider_ref, error_message, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'IRT', 'REFUNDED', ?, ?, ?, ?)
      `).run(
        txId,
        orderRow.id,
        params.idempotencyKey,
        refundSettlementMode,
        params.amount,
        `ref_${txId}`,
        params.reason || "Customer refund",
        now,
        now
      );

      db.prepare(`UPDATE orders SET status = 'REFUNDED' WHERE id = ?`).run(orderRow.id);

      if (Number(orderRow.stock_released || 0) === 0) {
        this.restockOrderItems(db, orderRow.id, orderRow.data);
        db.prepare(`UPDATE orders SET stock_released = 1 WHERE id = ?`).run(orderRow.id);
      }

      if (Number(orderRow.financial_settled || 0) === 1) {
        this.settleOrderFinancialSummary(db, orderRow, "REFUNDED", params.amount);
        db.prepare(`UPDATE orders SET financial_settled = 0 WHERE id = ?`).run(orderRow.id);
      }

      db.prepare(`
        INSERT INTO outbox_events (
          id, topic, schema_version, payload, status, next_retry_at, created_at
        ) VALUES (?, 'order:refunded', 1, ?, 'PENDING', ?, ?)
      `).run(
        `evt_ref_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
        JSON.stringify({
          orderId: orderRow.id,
          orderNumber: orderRow.orderNumber,
          refundAmount: params.amount,
          settlementMode: refundSettlementMode,
          reason: params.reason || "Customer refund",
        }),
        now,
        now
      );

      db.exec("COMMIT;");

      return {
        success: true,
        orderStatus: "REFUNDED",
        refundTransactionId: txId,
        settlementMode: refundSettlementMode,
      };
    } catch (err) {
      try {
        db.exec("ROLLBACK;");
      } catch {
        // Transaction may already be closed
      }
      throw err;
    }
  }
}
