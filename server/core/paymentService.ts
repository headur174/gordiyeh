import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

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

    // 2. Lookup target order
    const orderRow = db.prepare(`SELECT id, orderNumber, totalAmount, status FROM orders WHERE id = ? OR orderNumber = ?`).get(params.orderId, params.orderId) as any;
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

          // Restore inventory for cancelled order
          try {
            const rawOrder = JSON.parse(orderRow.data || "{}");
            if (rawOrder.items && Array.isArray(rawOrder.items)) {
              for (const it of rawOrder.items) {
                db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`).run(it.quantity || 1, it.id);
              }
            }
          } catch {
            // Ignore parse error on legacy orders
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

      // 3. Restock inventory
      try {
        const orderData = JSON.parse(orderRow.data || "{}");
        if (orderData.items && Array.isArray(orderData.items)) {
          for (const item of orderData.items) {
            db.prepare(`UPDATE products SET stock = stock + ? WHERE id = ?`).run(item.quantity || 1, item.id);
          }
        }
      } catch {
        // Fallback
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
