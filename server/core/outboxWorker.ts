import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import { safeFetchWebhook } from "../utils/ssrfGuard";
import { eventBus } from "./eventBus";

export interface OutboxRecord {
  id: string;
  topic: string;
  schema_version: number;
  payload: string;
  status: "PENDING" | "PROCESSING" | "DELIVERED" | "DEAD_LETTER";
  attempt_count: number;
  max_attempts: number;
  next_retry_at: string;
  last_error: string | null;
  locked_at: string | null;
  locked_until: string | null;
  lease_token: string | null;
  created_at: string;
  delivered_at: string | null;
}

export class OutboxProcessor {
  private isProcessing = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly defaultLeaseSeconds = 30;

  constructor(private readonly getDb: () => DatabaseSync) {}

  public start(pollIntervalMs: number = 2000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.processBatch().catch(err => {
        console.error("[OutboxWorker] Error during batch processing:", err?.message || err);
      });
    }, pollIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Extends the lease of an actively processing event (Gate 4: Lease Renewal).
   */
  public renewLease(id: string, leaseToken: string, extensionSeconds: number = 30): boolean {
    const db = this.getDb();
    const newExpiry = new Date(Date.now() + extensionSeconds * 1000).toISOString();
    const stmt = db.prepare(`
      UPDATE outbox_events
      SET locked_until = ?
      WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'
    `);
    const result = stmt.run(newExpiry, id, leaseToken);
    return Number(result.changes) > 0;
  }

  /**
   * Processes a single batch of pending or expired-lease outbox events.
   * Can be invoked directly during tests or on-demand.
   * Guarantees atomic event claiming, unique ownership per lease token, and idempotent dispatch.
   */
  public async processBatch(limit: number = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isProcessing) return { processed: 0, succeeded: 0, failed: 0 };
    this.isProcessing = true;

    let processedCount = 0;
    let succeededCount = 0;
    let failedCount = 0;

    try {
      const db = this.getDb();
      // Defensive schema guarantee: ensure outbox_events exists before query
      db.exec(`
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
      `);

      const now = new Date();
      const nowIso = now.toISOString();
      const leaseExpiry = new Date(now.getTime() + this.defaultLeaseSeconds * 1000).toISOString();

      // 1. Fetch eligible records: PENDING or expired-lease PROCESSING records
      const selectStmt = db.prepare(`
        SELECT * FROM outbox_events
        WHERE (status = 'PENDING' OR (status = 'PROCESSING' AND locked_until < ?))
          AND next_retry_at <= ?
        ORDER BY created_at ASC
        LIMIT ?
      `);

      const rows = selectStmt.all(nowIso, nowIso, limit) as unknown as OutboxRecord[];
      if (!rows.length) {
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      for (const row of rows) {
        // 2. Acquire lease lock with a unique cryptographically random lease token
        const leaseToken = `lease_${Date.now()}_${crypto.randomUUID()}`;
        const lockStmt = db.prepare(`
          UPDATE outbox_events
          SET status = 'PROCESSING',
              locked_at = ?,
              locked_until = ?,
              lease_token = ?
          WHERE id = ? AND (status = 'PENDING' OR (status = 'PROCESSING' AND locked_until < ?))
        `);
        const lockResult = lockStmt.run(nowIso, leaseExpiry, leaseToken, row.id, nowIso);

        // If another worker claimed this record concurrently, skip it safely
        if (Number(lockResult.changes) === 0) {
          continue;
        }

        processedCount++;

        try {
          // Execute event delivery
          await this.executeEventDelivery(row);

          // Mark DELIVERED conditionally verifying lease ownership
          const successStmt = db.prepare(`
            UPDATE outbox_events
            SET status = 'DELIVERED',
                delivered_at = ?,
                locked_until = NULL,
                lease_token = NULL,
                last_error = NULL
            WHERE id = ? AND lease_token = ?
          `);
          const successResult = successStmt.run(new Date().toISOString(), row.id, leaseToken);

          if (Number(successResult.changes) > 0) {
            succeededCount++;
          } else {
            // Lease expired and was stolen by another worker during execution
            failedCount++;
          }
        } catch (err: any) {
          failedCount++;
          const attempts = (row.attempt_count || 0) + 1;
          const isDead = attempts >= (row.max_attempts || 5);

          // Bounded exponential backoff: 2s, 4s, 8s, 16s, up to 60s
          const backoffSec = Math.min(60, Math.pow(2, attempts));
          const nextRetry = new Date(Date.now() + backoffSec * 1000).toISOString();

          const failStmt = db.prepare(`
            UPDATE outbox_events
            SET status = ?,
                attempt_count = ?,
                next_retry_at = ?,
                last_error = ?,
                locked_until = NULL,
                lease_token = NULL
            WHERE id = ? AND lease_token = ?
          `);
          failStmt.run(
            isDead ? "DEAD_LETTER" : "PENDING",
            attempts,
            nextRetry,
            (err?.message || String(err)).slice(0, 500),
            row.id,
            leaseToken
          );
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processed: processedCount, succeeded: succeededCount, failed: failedCount };
  }

  private async executeEventDelivery(row: OutboxRecord): Promise<void> {
    const payload = JSON.parse(row.payload);

    switch (row.topic) {
      case "order:created": {
        eventBus.publish("order:created", payload);
        break;
      }

      case "order:high_risk": {
        eventBus.publish("order:high_risk", payload);
        break;
      }

      case "order:paid":
      case "payment:success": {
        eventBus.publish("order:paid" as any, payload);
        break;
      }

      case "customer:memory_updated": {
        eventBus.publish("customer:memory_updated", payload);
        break;
      }

      case "webhook:dispatch": {
        const { url, event, body } = payload;
        if (!url) throw new Error("Webhook URL is missing in outbox payload");

        // Complete SSRF Defense & DNS Rebinding Protection (Gate 2)
        const response = await safeFetchWebhook(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Commerce-Event": event || "outbox.event",
            "X-Outbox-Event-Id": row.id,
            "X-Delivery-Attempt": String((row.attempt_count || 0) + 1),
          },
          body: JSON.stringify({
            eventId: row.id,
            event: event || "outbox.event",
            timestamp: new Date().toISOString(),
            data: body || payload,
          }),
          timeoutMs: 10000,
        });

        if (!response.ok) {
          throw new Error(`Webhook endpoint returned HTTP error status ${response.status}`);
        }
        break;
      }

      default: {
        eventBus.publish(row.topic as any, payload);
        break;
      }
    }
  }

  /**
   * Returns aggregated queue counts without leaking any sensitive payloads or customer data.
   */
  public getOutboxStats(): {
    pending: number;
    processing: number;
    delivered: number;
    deadLetter: number;
  } {
    const db = this.getDb();
    const rows = db.prepare(`
      SELECT status, COUNT(*) as cnt
      FROM outbox_events
      GROUP BY status
    `).all() as { status: string; cnt: number }[];

    const stats = { pending: 0, processing: 0, delivered: 0, deadLetter: 0 };
    for (const r of rows) {
      if (r.status === "PENDING") stats.pending = r.cnt;
      if (r.status === "PROCESSING") stats.processing = r.cnt;
      if (r.status === "DELIVERED") stats.delivered = r.cnt;
      if (r.status === "DEAD_LETTER") stats.deadLetter = r.cnt;
    }
    return stats;
  }
}
