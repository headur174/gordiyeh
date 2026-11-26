import { EventEmitter } from "node:events";

export interface SystemEventPayloads {
  "order:created": {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    phone: string;
    itemsCount: number;
    status: string;
    requireApproval: boolean;
    timestamp: string;
  };
  "order:high_risk": {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    riskScore: number;
    reason: string;
  };
  "inventory:depleted": {
    productId: string;
    sku: string;
    remainingStock: number;
  };
  "customer:memory_updated": {
    customerId: string;
    action: "save" | "reset";
  };
  "webhook:dispatch": {
    service: string;
    event: string;
    payload: any;
  };
  "competitor:price_fluctuation": {
    productId: string;
    sku: string;
    productTitle: string;
    previousMarketMedian: number;
    newMarketMedian: number;
    retailPrice: number;
    deltaPercent: number;
    timestamp: string;
  };
  "supervisor:alert": {
    id: string;
    dedupeKey: string;
    category: "BESTSELLER_OUT_OF_STOCK" | "COMPETITOR_PRICE_SPIKE" | "HIGH_RISK_ORDER" | "SUPPLIER_RISK" | "SYSTEM";
    severity: "CRITICAL" | "HIGH" | "WARNING";
    title: string;
    message: string;
    productId?: string;
    productTitle?: string;
    sku?: string;
    metrics?: Record<string, any>;
    recommendedActionLabel?: string;
    targetTab?: string;
    timestamp: string;
  };
}

export interface EventBusMetric {
  eventType: string;
  timestamp: string;
  status: "dispatched" | "failed";
  details?: any;
}

class CommerceEventBus extends EventEmitter {
  private recentEvents: EventBusMetric[] = [];
  private totalDispatched = 0;
  private readonly MAX_HISTORY = 100;

  constructor() {
    super();
    // Allow up to 50 concurrent module listeners without warning
    this.setMaxListeners(50);
    this.registerCoreSubscribers();
  }

  public publish<E extends keyof SystemEventPayloads>(event: E, payload: SystemEventPayloads[E]): void {
    // Non-blocking asynchronous dispatch
    setImmediate(() => {
      try {
        this.totalDispatched++;
        this.recordMetric(event as string, "dispatched", { id: (payload as any).orderId || (payload as any).productId });
        this.emit(event, payload);
      } catch (err: any) {
        console.error(`[EventBus] Unhandled error during event '${event}':`, err?.message);
        this.recordMetric(event as string, "failed", { error: err?.message });
      }
    });
  }

  public async dispatchSync(event: string, payload: any): Promise<void> {
    const listeners = this.listeners(event) as Array<(arg: any) => any>;
    this.totalDispatched++;
    try {
      for (const listener of listeners) {
        await Promise.resolve(listener.call(this, payload));
      }
      this.recordMetric(event, "dispatched", { id: payload?.orderId || payload?.productId });
    } catch (err: any) {
      this.recordMetric(event, "failed", { error: err?.message || String(err) });
      throw err;
    }
  }

  private recordMetric(eventType: string, status: "dispatched" | "failed", details?: any) {
    this.recentEvents.unshift({
      eventType,
      timestamp: new Date().toISOString(),
      status,
      details,
    });
    if (this.recentEvents.length > this.MAX_HISTORY) {
      this.recentEvents.pop();
    }
  }

  public getDiagnostics() {
    return {
      activeListenersCount: this.eventNames().reduce((sum, evt) => sum + this.listenerCount(evt), 0),
      totalDispatchedEvents: this.totalDispatched,
      registeredEvents: this.eventNames() as string[],
      recentEvents: this.recentEvents.slice(0, 10),
    };
  }

  private registerCoreSubscribers() {
    // 1. Asynchronous SMS / Customer Notification Dispatcher
    this.on("order:created", (payload) => {
      // Simulate non-blocking carrier SMS queue
      console.log(`[EventBus:SMS] Async dispatching SMS to ${payload.phone} for ${payload.orderNumber} (Status: ${payload.status})`);
    });

    // 2. High-Risk Alert Queue -> forward to unified supervisor:alert stream
    this.on("order:high_risk", (payload) => {
      console.warn(`[EventBus:SupervisorAlert] High-Risk Order Detected! Order: ${payload.orderNumber}, Risk: ${payload.riskScore}, Reason: ${payload.reason}`);
      this.publish("supervisor:alert", {
        id: `srv_risk_${payload.orderNumber}`,
        dedupeKey: `high_risk_order:${payload.orderNumber}`,
        category: "HIGH_RISK_ORDER",
        severity: payload.riskScore >= 75 ? "CRITICAL" : "HIGH",
        title: `سفارش پرریسک نیازمند بررسی ناظر (#${payload.orderNumber})`,
        message: `${payload.reason} (مبلغ: ${payload.totalAmount.toLocaleString("fa-IR")} تومان)`,
        metrics: {
          orderNumber: payload.orderNumber,
          riskScore: payload.riskScore,
        },
        recommendedActionLabel: "بررسی در صف تأیید",
        targetTab: "approvals",
        timestamp: new Date().toISOString(),
      });
    });

    // 3. Webhook Integration Dispatcher
    this.on("webhook:dispatch", (payload) => {
      console.log(`[EventBus:Webhook] Async dispatching to ${payload.service} [${payload.event}]`);
    });
  }
}

export const eventBus = new CommerceEventBus();
