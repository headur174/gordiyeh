/**
 * COCA Enterprise Zero-Trust Message Broker (RBAC EventBus)
 * Enforces manifest-level firewalling:
 * - A piece CANNOT emit an event unless declared in its manifest.security.allowedEmits.
 * - A piece CANNOT subscribe to an event unless declared in its manifest.security.allowedSubscribes.
 * - Maintains an in-memory replay ledger for idempotent state replay.
 */

type EventHandler<T = any> = (payload: T, envelope: COCA.EventEnvelope) => void;

interface SubscriptionRecord {
  pieceId: string;
  topic: string;
  handler: EventHandler;
}

class ZeroTrustBusEngine {
  private subscriptions: Map<string, SubscriptionRecord[]> = new Map();
  private manifests: Map<string, COCA.PieceManifest> = new Map();
  private eventLedger: COCA.EventEnvelope[] = [];
  private maxLedgerSize = 200;

  /**
   * Registers an autonomous piece manifest with the security supervisor
   */
  public registerPieceManifest(manifest: COCA.PieceManifest): void {
    this.manifests.set(manifest.id, manifest);
  }

  /**
   * Publishes an event with Zero-Trust security firewall validation
   */
  public emit<K extends keyof COCA.EventRegistry>(
    emitterPieceId: string,
    topic: K,
    payload: COCA.EventRegistry[K]
  ): boolean {
    const manifest = this.manifests.get(emitterPieceId);

    // Enforce Firewall Check (unless emitted by core kernel)
    if (emitterPieceId !== 'core_kernel') {
      if (!manifest) {
        console.warn(`[ZeroTrustBus Security Alert] Emitter '${emitterPieceId}' has no registered manifest! Event '${String(topic)}' blocked.`);
        return false;
      }

      const isAllowed = manifest.security.allowedEmits.includes(topic as string);
      if (!isAllowed) {
        console.error(
          `[ZeroTrustBus Security Violation] Piece '${emitterPieceId}' attempted unauthorized emit of '${String(topic)}'. Blocked by manifest policy.`
        );
        return false;
      }
    }

    const envelope: COCA.EventEnvelope<K> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      topic,
      emitterPieceId,
      timestamp: Date.now(),
      payload
    };

    // Append to audit ledger
    this.eventLedger.push(envelope);
    if (this.eventLedger.length > this.maxLedgerSize) {
      this.eventLedger.shift();
    }

    // Deliver to authorized subscribers
    const subscribers = this.subscriptions.get(topic as string) || [];
    subscribers.forEach(({ pieceId, handler }) => {
      try {
        handler(payload, envelope);
      } catch (handlerErr) {
        console.error(`[ZeroTrustBus Execution Error in Piece '${pieceId}' on topic '${String(topic)}']:`, handlerErr);
      }
    });

    return true;
  }

  /**
   * Subscribes to an event with manifest permission validation
   */
  public subscribe<K extends keyof COCA.EventRegistry>(
    subscriberPieceId: string,
    topic: K,
    handler: (payload: COCA.EventRegistry[K], envelope: COCA.EventEnvelope<K>) => void
  ): () => void {
    const manifest = this.manifests.get(subscriberPieceId);

    if (subscriberPieceId !== 'core_kernel') {
      if (!manifest) {
        console.warn(`[ZeroTrustBus Security Alert] Subscriber '${subscriberPieceId}' has no manifest. Subscription to '${String(topic)}' rejected.`);
        return () => {};
      }

      const isAllowed = manifest.security.allowedSubscribes.includes(topic as string);
      if (!isAllowed) {
        console.error(
          `[ZeroTrustBus Security Violation] Piece '${subscriberPieceId}' attempted unauthorized subscription to '${String(topic)}'. Rejected.`
        );
        return () => {};
      }
    }

    const current = this.subscriptions.get(topic as string) || [];
    const record: SubscriptionRecord = {
      pieceId: subscriberPieceId,
      topic: topic as string,
      handler: handler as EventHandler
    };

    this.subscriptions.set(topic as string, [...current, record]);

    // Unsubscribe callback
    return () => {
      const subs = this.subscriptions.get(topic as string) || [];
      this.subscriptions.set(topic as string, subs.filter(s => s !== record));
    };
  }

  /**
   * Returns recent historical events for late-joining tiles (Replay Bus)
   */
  public getReplayHistory(topic?: string): COCA.EventEnvelope[] {
    if (topic) {
      return this.eventLedger.filter(e => e.topic === topic);
    }
    return [...this.eventLedger];
  }

  /**
   * Returns metadata of registered contract events
   */
  public getRegisteredEvents(): { event: string; payloadType: string; description: string }[] {
    return [
      { event: 'v1.customer.memory_updated', payloadType: 'CustomerMemoryUpdatedPayload', description: 'تغییر ترجیحات، مناسبت‌ها یا بازنشانی حریم خصوصی مشتری' },
      { event: 'v1.orders.dispatched', payloadType: 'OrderDispatchedPayload', description: 'صدور حواله دراپ‌شیپینگ و تحویل به ناوگان حمل' },
      { event: 'v1.catalog.video_processed', payloadType: 'VideoProcessedPayload', description: 'استخراج شواهد بصری و تگ‌های هوشمند از ویدیو کالا' },
      { event: 'v1.security.vault_active', payloadType: 'SecurityVaultActivePayload', description: 'اعلام وضعیت پایدار رمزنگاری Zero-Plaintext دیتابیس' },
      { event: 'v1.kernel.ready', payloadType: 'KernelReadyPayload', description: 'اعلام آمادگی هسته مرکزی COCA و رجیستری ماژول‌ها' }
    ];
  }
}

export const ZeroTrustBus = new ZeroTrustBusEngine();
