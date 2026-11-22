import { CommerceDB } from "../db";
import { validateWebhookUrl } from "../utils/ssrfGuard";

export type SmsProviderType = "smsir" | "kavenegar" | "melipayamak" | "ippanel" | "custom";

export interface SmsGatewayInternalConfig {
  provider: SmsProviderType;
  apiKey: string;
  templateId: string;
  lineNumber: string;
  paramName: string;
  customUrl: string;
  enabled: boolean;
  source: "env" | "database" | "unconfigured";
}

export interface SmsGatewayPublicStatus {
  provider: SmsProviderType;
  enabled: boolean;
  configured: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
  templateId: string;
  lineNumber: string;
  paramName: string;
  customUrl: string;
  source: "env" | "database" | "unconfigured";
}

export interface SmsSendResult {
  ok: boolean;
  provider: SmsProviderType;
  messageId?: string;
  error?: string;
  code?: "SMS_PROVIDER_NOT_CONFIGURED" | "SMS_SEND_FAILED";
}

function maskKey(key: string): string {
  const clean = String(key || "").trim();
  if (!clean) return "";
  if (clean.length <= 6) return "******";
  return `${clean.slice(0, 3)}••••••${clean.slice(-4)}`;
}

export function resolveSmsGatewayConfig(): SmsGatewayInternalConfig {
  const saved = (CommerceDB.getIntegration("sms_gateway")?.config || {}) as Record<string, any>;

  const envApiKey = String(process.env.SMSIR_API_KEY || process.env.SMS_API_KEY || "").trim();
  const dbApiKey = String(saved.apiKey || "").trim();
  const activeApiKey = envApiKey || dbApiKey;

  const envProvider = String(process.env.SMS_PROVIDER || "").trim().toLowerCase();
  const providerRaw = (envProvider || String(saved.provider || "smsir").trim().toLowerCase()) as SmsProviderType;
  const provider: SmsProviderType = ["smsir", "kavenegar", "melipayamak", "ippanel", "custom"].includes(providerRaw)
    ? providerRaw
    : "smsir";

  const templateId = String(process.env.SMSIR_TEMPLATE_ID || saved.templateId || "").trim();
  const lineNumber = String(process.env.SMS_LINE_NUMBER || saved.lineNumber || "").trim();
  const paramName = String(saved.paramName || "Code").trim() || "Code";
  const customUrl = String(saved.customUrl || "").trim();
  const enabled = typeof saved.enabled === "boolean" ? saved.enabled : Boolean(activeApiKey);

  return {
    provider,
    apiKey: activeApiKey,
    templateId,
    lineNumber,
    paramName,
    customUrl,
    enabled,
    source: envApiKey ? "env" : dbApiKey ? "database" : "unconfigured",
  };
}

export function getSmsGatewayPublicStatus(): SmsGatewayPublicStatus {
  const cfg = resolveSmsGatewayConfig();
  const configured =
    cfg.enabled &&
    Boolean(cfg.apiKey) &&
    (cfg.provider === "custom" ? Boolean(cfg.customUrl) : Boolean(cfg.templateId || cfg.lineNumber || cfg.provider === "kavenegar" || cfg.provider === "melipayamak"));

  return {
    provider: cfg.provider,
    enabled: cfg.enabled,
    configured,
    hasApiKey: Boolean(cfg.apiKey),
    maskedApiKey: maskKey(cfg.apiKey),
    templateId: cfg.templateId,
    lineNumber: cfg.lineNumber,
    paramName: cfg.paramName,
    customUrl: cfg.customUrl,
    source: cfg.source,
  };
}

export async function sendVerificationSms(phone: string, code: string): Promise<SmsSendResult> {
  const cfg = resolveSmsGatewayConfig();
  if (!cfg.enabled || !cfg.apiKey) {
    return {
      ok: false,
      provider: cfg.provider,
      code: "SMS_PROVIDER_NOT_CONFIGURED",
      error: "سرویس ارسال پیامک (SMS.ir یا سرویس‌دهنده پیامکی) هنوز روی سرور تنظیم نشده است. لطفاً کلید API را از پنل مدیریت (بخش تنظیمات کاربری و پیامک) یا متغیرهای محیطی سرور وارد کنید.",
    };
  }

  try {
    if (cfg.provider === "smsir") {
      // Official SMS.ir v1 REST API: UltraFast / Verify Template preferred, or Bulk Send with lineNumber
      if (cfg.templateId && /^\d+$/.test(cfg.templateId)) {
        const resp = await fetch("https://api.sms.ir/v1/send/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-api-key": cfg.apiKey,
          },
          body: JSON.stringify({
            mobile: phone,
            templateId: Number(cfg.templateId),
            parameters: [{ name: cfg.paramName || "Code", value: code }],
          }),
          signal: AbortSignal.timeout(10000),
        });
        const data: any = await resp.json().catch(() => ({}));
        if (resp.ok && Number(data?.status) === 1) {
          return {
            ok: true,
            provider: "smsir",
            messageId: String(data?.data?.messageId || ""),
          };
        }
        return {
          ok: false,
          provider: "smsir",
          code: "SMS_SEND_FAILED",
          error: data?.message || `خطای سرویس SMS.ir (کد HTTP ${resp.status})`,
        };
      }

      if (cfg.lineNumber) {
        const resp = await fetch("https://api.sms.ir/v1/send/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "x-api-key": cfg.apiKey,
          },
          body: JSON.stringify({
            lineNumber: Number(cfg.lineNumber),
            messageText: `کد تایید حساب کاربری شما در گُردیه: ${code}`,
            mobiles: [phone],
          }),
          signal: AbortSignal.timeout(10000),
        });
        const data: any = await resp.json().catch(() => ({}));
        if (resp.ok && Number(data?.status) === 1) {
          return {
            ok: true,
            provider: "smsir",
            messageId: String(data?.data?.packId || ""),
          };
        }
        return {
          ok: false,
          provider: "smsir",
          code: "SMS_SEND_FAILED",
          error: data?.message || `خطای ارسال خط اختصاصی SMS.ir (کد HTTP ${resp.status})`,
        };
      }

      return {
        ok: false,
        provider: "smsir",
        code: "SMS_PROVIDER_NOT_CONFIGURED",
        error: "برای اتصال به SMS.ir لطفاً شناسه الگو (Template ID) یا شماره خط اختصاصی را در تنظیمات پیامک وارد کنید.",
      };
    }

    if (cfg.provider === "kavenegar") {
      const url = cfg.templateId
        ? `https://api.kavenegar.com/v1/${encodeURIComponent(cfg.apiKey)}/verify/lookup.json?receptor=${encodeURIComponent(phone)}&token=${encodeURIComponent(code)}&template=${encodeURIComponent(cfg.templateId)}`
        : `https://api.kavenegar.com/v1/${encodeURIComponent(cfg.apiKey)}/sms/send.json?receptor=${encodeURIComponent(phone)}&message=${encodeURIComponent(`کد تایید حساب کاربری شما در گُردیه: ${code}`)}${cfg.lineNumber ? `&sender=${encodeURIComponent(cfg.lineNumber)}` : ""}`;

      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data: any = await resp.json().catch(() => ({}));
      if (resp.ok && Number(data?.return?.status) === 200) {
        return {
          ok: true,
          provider: "kavenegar",
          messageId: String(data?.entries?.[0]?.messageid || ""),
        };
      }
      return {
        ok: false,
        provider: "kavenegar",
        code: "SMS_SEND_FAILED",
        error: data?.return?.message || `خطای سرویس کاوه‌نگار (کد ${resp.status})`,
      };
    }

    if (cfg.provider === "melipayamak") {
      const resp = await fetch(
        `https://console.melipayamak.com/api/send/shared/${encodeURIComponent(cfg.apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bodyId: Number(cfg.templateId || 0),
            to: phone,
            args: [code],
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      const data: any = await resp.json().catch(() => ({}));
      if (resp.ok && (data?.recId || String(data?.status || "").includes("ارسال"))) {
        return { ok: true, provider: "melipayamak", messageId: String(data?.recId || "") };
      }
      return {
        ok: false,
        provider: "melipayamak",
        code: "SMS_SEND_FAILED",
        error: data?.status || `خطای سرویس ملی‌پیامک (کد ${resp.status})`,
      };
    }

    if (cfg.provider === "ippanel") {
      const resp = await fetch("https://api2.ippanel.com/api/v1/sms/pattern/normal/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": cfg.apiKey,
        },
        body: JSON.stringify({
          code: cfg.templateId,
          sender: cfg.lineNumber,
          recipient: phone,
          variable: { [cfg.paramName || "verification-code"]: code },
        }),
        signal: AbortSignal.timeout(10000),
      });
      const data: any = await resp.json().catch(() => ({}));
      if (resp.ok) {
        return { ok: true, provider: "ippanel", messageId: String(data?.data?.message_id || "") };
      }
      return {
        ok: false,
        provider: "ippanel",
        code: "SMS_SEND_FAILED",
        error: data?.message || `خطای سرویس IPPanel (کد ${resp.status})`,
      };
    }

    if (cfg.provider === "custom") {
      const ssrf = validateWebhookUrl(cfg.customUrl);
      if (!ssrf.isSafe) {
        return {
          ok: false,
          provider: "custom",
          code: "SMS_SEND_FAILED",
          error: ssrf.reason || "آدرس سرویس پیامک سفارشی نامعتبر یا مسدود است.",
        };
      }
      const resp = await fetch(cfg.customUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cfg.apiKey}`,
          "x-api-key": cfg.apiKey,
        },
        body: JSON.stringify({
          phone,
          code,
          templateId: cfg.templateId,
          lineNumber: cfg.lineNumber,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        return { ok: true, provider: "custom" };
      }
      return {
        ok: false,
        provider: "custom",
        code: "SMS_SEND_FAILED",
        error: `پاسخ ناموفق از وب‌سرویس پیامک سفارشی (${resp.status})`,
      };
    }

    return {
      ok: false,
      provider: cfg.provider,
      code: "SMS_PROVIDER_NOT_CONFIGURED",
      error: "سرویس‌دهنده پیامک پشتیبانی نمی‌شود.",
    };
  } catch (err: any) {
    return {
      ok: false,
      provider: cfg.provider,
      code: "SMS_SEND_FAILED",
      error: err?.message || "خطا در برقراری ارتباط با سرویس‌دهنده پیامک",
    };
  }
}
