import { CommerceDB } from "../db";

export type PaymentProviderType = "zarinpal" | "zibal" | "idpay" | "sandbox";

export interface PaymentGatewayInternalConfig {
  provider: PaymentProviderType;
  merchantId: string;
  sandbox: boolean;
  callbackUrl: string;
  enabled: boolean;
  source: "env" | "database" | "unconfigured";
}

export interface PaymentGatewayPublicStatus {
  provider: PaymentProviderType;
  sandbox: boolean;
  enabled: boolean;
  configured: boolean;
  hasMerchantId: boolean;
  maskedMerchantId: string;
  callbackUrl: string;
  source: "env" | "database" | "unconfigured";
}

function maskMerchantId(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "";
  if (clean.length <= 8) return "••••••••";
  return `${clean.slice(0, 4)}••••••••${clean.slice(-4)}`;
}

export function resolvePaymentGatewayConfig(): PaymentGatewayInternalConfig {
  const saved = (CommerceDB.getIntegration("payment_gateway")?.config || {}) as Record<string, any>;

  const envMerchantId = String(
    process.env.ZARINPAL_MERCHANT_ID || process.env.PAYMENT_MERCHANT_ID || ""
  ).trim();
  const dbMerchantId = String(saved.merchantId || "").trim();
  const merchantId = envMerchantId || dbMerchantId;

  const envProvider = String(process.env.PAYMENT_PROVIDER || "").trim().toLowerCase();
  const providerRaw = (envProvider || String(saved.provider || "zarinpal").trim().toLowerCase()) as PaymentProviderType;
  const provider: PaymentProviderType = ["zarinpal", "zibal", "idpay", "sandbox"].includes(providerRaw)
    ? providerRaw
    : "zarinpal";

  const envSandbox = process.env.ZARINPAL_SANDBOX;
  const sandbox =
    typeof envSandbox === "string"
      ? envSandbox === "true" || envSandbox === "1"
      : typeof saved.sandbox === "boolean"
      ? saved.sandbox
      : true;

  const callbackUrl = String(saved.callbackUrl || "").trim();
  const enabled = typeof saved.enabled === "boolean" ? saved.enabled : Boolean(merchantId);

  return {
    provider,
    merchantId,
    sandbox,
    callbackUrl,
    enabled,
    source: envMerchantId ? "env" : dbMerchantId ? "database" : "unconfigured",
  };
}

export function getPaymentGatewayPublicStatus(): PaymentGatewayPublicStatus {
  const cfg = resolvePaymentGatewayConfig();
  const configured = cfg.enabled && (cfg.provider === "sandbox" || Boolean(cfg.merchantId));

  return {
    provider: cfg.provider,
    sandbox: cfg.sandbox,
    enabled: cfg.enabled,
    configured,
    hasMerchantId: Boolean(cfg.merchantId),
    maskedMerchantId: maskMerchantId(cfg.merchantId),
    callbackUrl: cfg.callbackUrl,
    source: cfg.source,
  };
}

/**
 * Initiates a live gateway authority URL with Zarinpal / Zibal / IDPay when configured,
 * otherwise returns null so the caller can cleanly use PaymentStateMachine sandbox mode.
 */
export async function requestLiveGatewayRedirect(params: {
  amountToman: number;
  orderNumber: string;
  description: string;
  phone?: string;
  email?: string;
  fallbackCallbackUrl: string;
}): Promise<{ ok: boolean; provider: PaymentProviderType; gatewayUrl?: string; authority?: string; error?: string }> {
  const cfg = resolvePaymentGatewayConfig();
  if (!cfg.enabled || !cfg.merchantId || cfg.provider === "sandbox") {
    return { ok: false, provider: cfg.provider, error: "GATEWAY_SANDBOX_OR_UNCONFIGURED" };
  }

  const callbackUrl = cfg.callbackUrl || params.fallbackCallbackUrl;
  const amountRials = Math.max(10000, Math.round(params.amountToman * 10));

  try {
    if (cfg.provider === "zarinpal") {
      const endpoint = cfg.sandbox
        ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
        : "https://api.zarinpal.com/pg/v4/payment/request.json";
      const startPayBase = cfg.sandbox
        ? "https://sandbox.zarinpal.com/pg/StartPay/"
        : "https://www.zarinpal.com/pg/StartPay/";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          merchant_id: cfg.merchantId,
          amount: amountRials,
          callback_url: callbackUrl,
          description: params.description.slice(0, 200),
          metadata: {
            mobile: params.phone || undefined,
            email: params.email || undefined,
            order_id: params.orderNumber,
          },
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      const authority = json?.data?.authority;
      if (res.ok && json?.data?.code === 100 && authority) {
        return {
          ok: true,
          provider: "zarinpal",
          authority,
          gatewayUrl: `${startPayBase}${authority}`,
        };
      }
      return {
        ok: false,
        provider: "zarinpal",
        error: json?.errors?.message || "خطا در اتصال به درگاه زرین‌پال",
      };
    }

    if (cfg.provider === "zibal") {
      const res = await fetch("https://gateway.zibal.ir/v1/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: cfg.sandbox ? "zibal" : cfg.merchantId,
          amount: amountRials,
          callbackUrl,
          orderId: params.orderNumber,
          mobile: params.phone || undefined,
          description: params.description.slice(0, 200),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (res.ok && json?.result === 100 && json?.trackId) {
        return {
          ok: true,
          provider: "zibal",
          authority: String(json.trackId),
          gatewayUrl: `https://gateway.zibal.ir/start/${json.trackId}`,
        };
      }
      return {
        ok: false,
        provider: "zibal",
        error: json?.message || "خطا در اتصال به درگاه زیبال",
      };
    }

    if (cfg.provider === "idpay") {
      const res = await fetch("https://api.idpay.ir/v1.1/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": cfg.merchantId,
          ...(cfg.sandbox ? { "X-SANDBOX": "1" } : {}),
        },
        body: JSON.stringify({
          order_id: params.orderNumber,
          amount: amountRials,
          phone: params.phone || undefined,
          mail: params.email || undefined,
          desc: params.description.slice(0, 200),
          callback: callbackUrl,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      if (res.ok && json?.link) {
        return {
          ok: true,
          provider: "idpay",
          authority: String(json.id || ""),
          gatewayUrl: json.link,
        };
      }
      return {
        ok: false,
        provider: "idpay",
        error: json?.error_message || "خطا در اتصال به درگاه آیدی‌پی",
      };
    }

    return { ok: false, provider: cfg.provider, error: "GATEWAY_UNSUPPORTED" };
  } catch (err: any) {
    return {
      ok: false,
      provider: cfg.provider,
      error: err?.message || "خطای شبکه هنگام اتصال به درگاه پرداخت",
    };
  }
}

/**
 * Verifies a completed gateway redirect server-to-server using the authoritative server order amount.
 */
export async function verifyLiveGatewayPayment(params: {
  provider?: PaymentProviderType | string;
  authority: string;
  amountToman: number;
  orderNumber: string;
}): Promise<{
  verified: boolean;
  provider: PaymentProviderType;
  refId?: string;
  cardPan?: string;
  code?: number;
  error?: string;
}> {
  const cfg = resolvePaymentGatewayConfig();
  const providerRaw = String(params.provider || cfg.provider).toLowerCase();
  const provider: PaymentProviderType = ["zarinpal", "zibal", "idpay", "sandbox"].includes(providerRaw)
    ? (providerRaw as PaymentProviderType)
    : cfg.provider;

  if (!cfg.enabled || !cfg.merchantId || provider === "sandbox") {
    return { verified: false, provider, error: "GATEWAY_SANDBOX_OR_UNCONFIGURED" };
  }

  const authority = String(params.authority || "").trim();
  if (!authority) {
    return { verified: false, provider, error: "کد مرجع تراکنش (Authority) از درگاه ارسال نشده است." };
  }

  const amountRials = Math.max(10000, Math.round(params.amountToman * 10));

  try {
    if (provider === "zarinpal") {
      const endpoint = cfg.sandbox
        ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
        : "https://api.zarinpal.com/pg/v4/payment/verify.json";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          merchant_id: cfg.merchantId,
          amount: amountRials,
          authority,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      const code = Number(json?.data?.code || 0);
      if (res.ok && (code === 100 || code === 101)) {
        return {
          verified: true,
          provider: "zarinpal",
          refId: String(json?.data?.ref_id || authority),
          cardPan: json?.data?.card_pan,
          code,
        };
      }
      return {
        verified: false,
        provider: "zarinpal",
        code,
        error: json?.errors?.message || "تراکنش توسط زرین‌پال تایید نشد.",
      };
    }

    if (provider === "zibal") {
      const trackIdNum = Number(authority);
      const res = await fetch("https://gateway.zibal.ir/v1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: cfg.sandbox ? "zibal" : cfg.merchantId,
          trackId: Number.isFinite(trackIdNum) ? trackIdNum : authority,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      const result = Number(json?.result || 0);
      const returnedAmount = Number(json?.amount || 0);
      if (res.ok && (result === 100 || result === 201) && (returnedAmount === 0 || returnedAmount === amountRials)) {
        return {
          verified: true,
          provider: "zibal",
          refId: String(json?.refNumber || authority),
          cardPan: json?.cardNumber,
          code: result,
        };
      }
      return {
        verified: false,
        provider: "zibal",
        code: result,
        error: json?.message || "تراکنش توسط زیبال تایید نشد.",
      };
    }

    if (provider === "idpay") {
      const res = await fetch("https://api.idpay.ir/v1.1/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": cfg.merchantId,
          ...(cfg.sandbox ? { "X-SANDBOX": "1" } : {}),
        },
        body: JSON.stringify({
          id: authority,
          order_id: params.orderNumber,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as any;
      const status = Number(json?.status || 0);
      if (res.ok && (status === 100 || status === 101 || status === 200)) {
        return {
          verified: true,
          provider: "idpay",
          refId: String(json?.track_id || json?.payment?.track_id || authority),
          cardPan: json?.payment?.card_no,
          code: status,
        };
      }
      return {
        verified: false,
        provider: "idpay",
        code: status,
        error: json?.error_message || "تراکنش توسط آیدی‌پی تایید نشد.",
      };
    }

    return { verified: false, provider, error: "GATEWAY_UNSUPPORTED" };
  } catch (err: any) {
    return {
      verified: false,
      provider,
      error: err?.message || "خطای شبکه هنگام تایید تراکنش با درگاه بانکی",
    };
  }
}
