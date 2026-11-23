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
  created_at: string;
  updated_at: string;
}

export class PaymentStateMachine {
  constructor(private readonly getDb: () => DatabaseSync) {}

  /**
   * Constant-time signature verification for payment gateway callbacks (Gate 3).
   * Prevents timing attacks when validating webhook signatures.
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
   * Initiates payment for an order and generates a provider-side idempotency key (Gate 3).
   */
  public initiatePayment(params: {
    orderId: string;
    provider?: string;
  }): {
    transactionId: string;
    idempotencyKey: string;
    orderId: string;
    amount: number;
    currency: string;
    gatewayUrl: string;
  } {
    const db = this.getDb();
    const orderRow = db.prepare(`SELECT id, orderNumber, totalAmount, status FROM orders WHERE id = ? OR orderNumber = ?`).get(params.orderId, params.orderId) as any;
    if (!orderRow) {
      throw new Error(`Order '${params.orderId}' not found for payment initiation`);
    }

    if (orderRow.status === "PAID") {
      throw new Error(`Order '${params.orderId}' is already PAID`);
    }

    const txId = `tx_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const idempotencyKey = `idemp_init_${orderRow.id}_${Date.now()}`;
    const now = new Date().toISOString();
    const provider = params.provider || "SHAPARAK_SANDBOX";

    db.exec("BEGIN IMMEDIATE;");
    try {
      db.prepare(`
        INSERT INTO payment_transactions (
          id, order_id, idempotency_key, provider, amount, currency, status, provider_ref, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'IRT', 'INITIATED', NULL, ?, ?)
      `).run(txId, orderRow.id, idempotencyKey, provider, orderRow.totalAmount, now, now);

      db.exec("COMMIT;");

      return {
        transactionId: txId,
        idempotencyKey,
        orderId: orderRow.id,
        amount: orderRow.totalAmount,
        currency: "IRT",
        gatewayUrl: `https://gateway.shaparak.ir/pay/${txId}`,
      };
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }

  /**
   * Persists the bank gateway authority / trackId on the initiated payment transaction.
   */
  public attachProviderRef(transactionId: string, providerRef: string, provider?: string): void {
    const db = this.getDb();
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
    let txRow: PaymentTransactionRecord | undefined;

    if (params.txId) {
      txRow = db.prepare(`SELECT * FROM payment_transactions WHERE id = ? LIMIT 1`).get(params.txId) as unknown as PaymentTransactionRecord | undefined;
    }
    if (!txRow && params.authority) {
      txRow = db.prepare(`SELECT * FROM payment_transactions WHERE provider_ref = ? ORDER BY created_at DESC LIMIT 1`).get(params.authority) as unknown as PaymentTransactionRecord | undefined;
    }
    if (!txRow && params.orderId) {
      txRow = db.prepare(`
        SELECT pt.* FROM payment_transactions pt
        JOIN orders o ON pt.order_id = o.id
        WHERE o.id = ? OR o.orderNumber = ?
        ORDER BY pt.created_at DESC LIMIT 1
      `).get(params.orderId, params.orderId) as unknown as PaymentTransactionRecord | undefined;
    }

    const lookupOrderKey = txRow?.order_id || params.orderId;
    if (!lookupOrderKey) return null;

    const orderRow = db.prepare(`
      SELECT id, orderNumber, totalAmount, status FROM orders WHERE id = ? OR orderNumber = ? LIMIT 1
    `).get(lookupOrderKey, lookupOrderKey) as { id: string; orderNumber: string; totalAmount: number; status: OrderStatus } | undefined;

    if (!orderRow) return null;

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
   * Restores both aggregate SQLite product stock and encrypted/serialized supplierOffer stock JSON.
   */
  private restockOrderItems(db: DatabaseSync, encryptedOrJsonOrderData: string | null | undefined): void {
    if (!encryptedOrJsonOrderData) return;
    const rawOrder = CryptoVault.decryptJson<any>(encryptedOrJsonOrderData, null);
    if (!rawOrder || !Array.isArray(rawOrder.items)) return;

    for (const it of rawOrder.items) {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const prodRow = db.prepare(`SELECT id, stock, data FROM products WHERE id = ?`).get(it.id || it.productId) as
        | { id: string; stock: number; data: string }
        | undefined;
      if (!prodRow) continue;

      const nextStock = Math.max(0, Number(prodRow.stock || 0)) + qty;
      let nextData = prodRow.data;
      try {
        const prodObj = JSON.parse(prodRow.data);
        if (Array.isArray(prodObj?.supplierOffers) && prodObj.supplierOffers.length > 0) {
          const targetOfferId = prodObj.selectedOfferId || prodObj.supplierOffers[0].id;
          prodObj.supplierOffers = prodObj.supplierOffers.map((off: any) =>
            off.id === targetOfferId ? { ...off, stock: Number(off.stock || 0) + qty } : off
          );
          nextData = JSON.stringify(prodObj);
        }
      } catch {
        // Keep existing product JSON if malformed
      }
      db.prepare(`UPDATE products SET stock = ?, data = ? WHERE id = ?`).run(nextStock, nextData, prodRow.id);
    }
  }

  /**
   * Idempotent payment callback processor (Gate 3).
   * Ensures duplicate callbacks from payment gateways (e.g. Shaparak/Zarinpal/SnappPay)
   * never duplicate stock operations or financial figures.
   *
   * Verifies:
   * - Order existence and amount matching
   * - Idempotency key uniqueness
   * - State transition constraints (e.g. PAID cannot be reversed by an out-of-order FAILED callback)
   * - Atomic outbox event queuing
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
    const now = new Date().toISOString();

    // 1. Check existing transaction with this idempotency key
    const existing = db.prepare(`
      SELECT * FROM payment_transactions WHERE idempotency_key = ?
    `).get(params.idempotencyKey) as unknown as PaymentTransactionRecord | undefined;

    if (existing) {
      // Already processed idempotently
      const orderRow = db.prepare(`SELECT status FROM orders WHERE id = ? OR orderNumber = ?`).get(params.orderId, params.orderId) as { status: OrderStatus } | undefined;
      return {
        success: existing.status === "SUCCESS",
        alreadyProcessed: true,
        transaction: existing,
        orderStatus: orderRow ? orderRow.status : (existing.status === "SUCCESS" ? "PAID" : "PENDING_PAYMENT")
      };
    }

    // 2. Lookup target order (include data for restocking on FAILED callback)
    const orderRow = db.prepare(`SELECT id, orderNumber, totalAmount, status, data FROM orders WHERE id = ? OR orderNumber = ?`).get(params.orderId, params.orderId) as any;
    if (!orderRow) {
      throw new Error(`Order '${params.orderId}' not found for payment callback`);
    }

    // Out-of-order protection: An already PAID order must NEVER transition to FAILED
    if (orderRow.status === "PAID" && params.status === "FAILED") {
      const noopTx: PaymentTransactionRecord = {
        id: `tx_noop_${Date.now()}`,
        order_id: orderRow.id,
        idempotency_key: params.idempotencyKey,
        provider: params.provider || "SHAPARAK_GATEWAY",
        amount: params.amount,
        currency: "IRT",
        status: "FAILED",
        provider_ref: params.providerRef,
        error_message: "Late failed callback rejected for already paid order",
        created_at: now,
        updated_at: now
      };
      return {
        success: true,
        alreadyProcessed: true,
        transaction: noopTx,
        orderStatus: "PAID"
      };
    }

    // Amount validation: must match exact order amount
    if (params.status === "SUCCESS" && params.amount !== orderRow.totalAmount) {
      throw new Error(`Payment amount mismatch: Received ${params.amount}, expected ${orderRow.totalAmount}`);
    }

    const txId = `tx_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const txStatus: PaymentStatus = params.status === "SUCCESS" ? "SUCCESS" : "FAILED";

    // 3. Begin atomic transaction for payment status transition
    db.exec("BEGIN IMMEDIATE;");
    try {
      // Record payment transaction
      const insertTx = db.prepare(`
        INSERT INTO payment_transactions (
          id, order_id, idempotency_key, provider, amount, currency, status, provider_ref, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertTx.run(
        txId,
        orderRow.id,
        params.idempotencyKey,
        params.provider || "SHAPARAK_GATEWAY",
        params.amount,
        "IRT",
        txStatus,
        params.providerRef || null,
        now,
        now
      );

      let targetOrderStatus: OrderStatus = orderRow.status;

      if (params.status === "SUCCESS") {
        targetOrderStatus = orderRow.status === "HIGH_RISK_HOLD" ? "HIGH_RISK_HOLD" : "PAID";
        db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(targetOrderStatus, orderRow.id);

        // Queue payment success outbox event atomically
        db.prepare(`
          INSERT INTO outbox_events (
            id, topic, schema_version, payload, status, next_retry_at, created_at
          ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?)
        `).run(
          `evt_pay_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
          "payment:success",
          1,
          JSON.stringify({
            orderId: orderRow.id,
            orderNumber: orderRow.orderNumber,
            amount: params.amount,
            providerRef: params.providerRef,
            status: targetOrderStatus
          }),
          now,
          now
        );
      } else {
        // Failed callback
        if (orderRow.status === "PENDING_PAYMENT") {
          targetOrderStatus = "CANCELLED";
          db.prepare(`UPDATE orders SET status = 'CANCELLED' WHERE id = ?`).run(orderRow.id);

          // Restore inventory for cancelled order (decrypts encrypted order JSON)
          try {
            this.restockOrderItems(db, orderRow.data);
          } catch {
            // Do not crash callback transaction if legacy order data is unreadable
          }
        }
      }

      db.exec("COMMIT;");

      const savedTx: PaymentTransactionRecord = {
        id: txId,
        order_id: orderRow.id,
        idempotency_key: params.idempotencyKey,
        provider: params.provider || "SHAPARAK_GATEWAY",
        amount: params.amount,
        currency: "IRT",
        status: txStatus,
        provider_ref: params.providerRef,
        error_message: null,
        created_at: now,
        updated_at: now
      };

      return {
        success: params.status === "SUCCESS",
        alreadyProcessed: false,
        transaction: savedTx,
        orderStatus: targetOrderStatus
      };
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }

  /**
   * Atomically processes an order refund and restores stock (Gate 3).
   */
  public processRefund(params: {
    orderId: string;
    idempotencyKey: string;
    amount: number;
    reason?: string;
  }): {
    success: boolean;
    orderStatus: OrderStatus;
    refundTransactionId: string;
  } {
    const db = this.getDb();
    const now = new Date().toISOString();

    const orderRow = db.prepare(`SELECT id, orderNumber, totalAmount, status, data FROM orders WHERE id = ? OR orderNumber = ?`).get(params.orderId, params.orderId) as any;
    if (!orderRow) {
      throw new Error(`Order '${params.orderId}' not found for refund`);
    }

    if (orderRow.status !== "PAID") {
      throw new Error(`Only PAID orders can be refunded (current status: ${orderRow.status})`);
    }

    const txId = `tx_ref_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;

    db.exec("BEGIN IMMEDIATE;");
    try {
      // 1. Record refund transaction
      db.prepare(`
        INSERT INTO payment_transactions (
          id, order_id, idempotency_key, provider, amount, currency, status, provider_ref, error_message, created_at, updated_at
        ) VALUES (?, ?, ?, 'SHAPARAK_GATEWAY', ?, 'IRT', 'REFUNDED', ?, ?, ?, ?)
      `).run(
        txId,
        orderRow.id,
        params.idempotencyKey,
        params.amount,
        `ref_${txId}`,
        params.reason || "Customer refund",
        now,
        now
      );

      // 2. Transition order status to REFUNDED
      db.prepare(`UPDATE orders SET status = 'REFUNDED' WHERE id = ?`).run(orderRow.id);

      // 3. Restock inventory (decrypts encrypted order JSON + updates supplierOffers stock)
      try {
        this.restockOrderItems(db, orderRow.data);
      } catch {
        // Fallback if legacy order data is unreadable
      }

      // 4. Queue outbox event
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
          reason: params.reason || "Customer refund"
        }),
        now,
        now
      );

      db.exec("COMMIT;");

      return {
        success: true,
        orderStatus: "REFUNDED",
        refundTransactionId: txId
      };
    } catch (err) {
      db.exec("ROLLBACK;");
      throw err;
    }
  }
}
