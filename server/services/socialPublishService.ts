import { CommerceDB } from "../db";
import { validateWebhookUrl } from "../utils/ssrfGuard";
import { UnifiedDocument } from "../../src/types/cms";

export type SocialChannelKey = "telegram" | "bale" | "eitaa" | "instagram" | "webhook";

export interface SocialChannelsConfig {
  autoPublishBlogToSocial: boolean;
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  bale: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  eitaa: {
    enabled: boolean;
    apiToken: string;
    chatId: string;
  };
  instagram: {
    enabled: boolean;
    accessToken: string;
    igUserId: string;
  };
  webhook: {
    enabled: boolean;
  };
}

export interface SocialChannelsPublicStatus {
  autoPublishBlogToSocial: boolean;
  telegram: {
    enabled: boolean;
    hasToken: boolean;
    maskedToken: string;
    chatId: string;
    source: "env" | "database" | "unconfigured";
  };
  bale: {
    enabled: boolean;
    hasToken: boolean;
    maskedToken: string;
    chatId: string;
    source: "env" | "database" | "unconfigured";
  };
  eitaa: {
    enabled: boolean;
    hasToken: boolean;
    maskedToken: string;
    chatId: string;
    source: "env" | "database" | "unconfigured";
  };
  instagram: {
    enabled: boolean;
    hasToken: boolean;
    maskedToken: string;
    igUserId: string;
    source: "env" | "database" | "unconfigured";
  };
  webhook: {
    enabled: boolean;
    activeHooksCount: number;
  };
}

export interface SocialPublishPayload {
  title?: string;
  caption: string;
  targetUrl?: string;
  imageUrl?: string;
  kind?: "PRODUCT" | "ARTICLE" | "CAMPAIGN" | "CUSTOM";
  productId?: string;
  documentId?: string;
}

export interface SocialChannelResult {
  channel: SocialChannelKey;
  ok: boolean;
  messageId?: string;
  queued?: boolean;
  error?: string;
}

function maskSecret(secret?: string): string {
  const s = (secret || "").trim();
  if (!s) return "";
  if (s.length <= 8) return "••••••••";
  return `${s.slice(0, 4)}••••••${s.slice(-4)}`;
}

function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getEffectiveConfig(): SocialChannelsConfig {
  const saved = (CommerceDB.getIntegration("social_channels")?.config || {}) as Partial<SocialChannelsConfig>;

  const envTgToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const envTgChat = (process.env.TELEGRAM_CHAT_ID || "").trim();
  const envBaleToken = (process.env.BALE_BOT_TOKEN || "").trim();
  const envBaleChat = (process.env.BALE_CHAT_ID || "").trim();
  const envEitaaToken = (process.env.EITAA_API_TOKEN || "").trim();
  const envEitaaChat = (process.env.EITAA_CHAT_ID || "").trim();
  const envIgToken = (process.env.INSTAGRAM_ACCESS_TOKEN || "").trim();
  const envIgUser = (process.env.INSTAGRAM_IG_USER_ID || "").trim();

  return {
    autoPublishBlogToSocial: Boolean(saved.autoPublishBlogToSocial),
    telegram: {
      enabled: typeof saved.telegram?.enabled === "boolean" ? saved.telegram.enabled : Boolean(envTgToken && envTgChat),
      botToken: (saved.telegram?.botToken || envTgToken || "").trim(),
      chatId: (saved.telegram?.chatId || envTgChat || "").trim(),
    },
    bale: {
      enabled: typeof saved.bale?.enabled === "boolean" ? saved.bale.enabled : Boolean(envBaleToken && envBaleChat),
      botToken: (saved.bale?.botToken || envBaleToken || "").trim(),
      chatId: (saved.bale?.chatId || envBaleChat || "").trim(),
    },
    eitaa: {
      enabled: typeof saved.eitaa?.enabled === "boolean" ? saved.eitaa.enabled : Boolean(envEitaaToken && envEitaaChat),
      apiToken: (saved.eitaa?.apiToken || envEitaaToken || "").trim(),
      chatId: (saved.eitaa?.chatId || envEitaaChat || "").trim(),
    },
    instagram: {
      enabled: typeof saved.instagram?.enabled === "boolean" ? saved.instagram.enabled : Boolean(envIgToken && envIgUser),
      accessToken: (saved.instagram?.accessToken || envIgToken || "").trim(),
      igUserId: (saved.instagram?.igUserId || envIgUser || "").trim(),
    },
    webhook: {
      enabled: typeof saved.webhook?.enabled === "boolean" ? saved.webhook.enabled : true,
    },
  };
}

export function getSocialChannelsPublicStatus(): SocialChannelsPublicStatus {
  const saved = (CommerceDB.getIntegration("social_channels")?.config || {}) as Partial<SocialChannelsConfig>;
  const eff = getEffectiveConfig();
  const hooks = CommerceDB.getWebhooks().filter((w: any) => w.enabled);

  return {
    autoPublishBlogToSocial: eff.autoPublishBlogToSocial,
    telegram: {
      enabled: eff.telegram.enabled,
      hasToken: Boolean(eff.telegram.botToken),
      maskedToken: maskSecret(eff.telegram.botToken),
      chatId: eff.telegram.chatId,
      source: saved.telegram?.botToken ? "database" : process.env.TELEGRAM_BOT_TOKEN ? "env" : "unconfigured",
    },
    bale: {
      enabled: eff.bale.enabled,
      hasToken: Boolean(eff.bale.botToken),
      maskedToken: maskSecret(eff.bale.botToken),
      chatId: eff.bale.chatId,
      source: saved.bale?.botToken ? "database" : process.env.BALE_BOT_TOKEN ? "env" : "unconfigured",
    },
    eitaa: {
      enabled: eff.eitaa.enabled,
      hasToken: Boolean(eff.eitaa.apiToken),
      maskedToken: maskSecret(eff.eitaa.apiToken),
      chatId: eff.eitaa.chatId,
      source: saved.eitaa?.apiToken ? "database" : process.env.EITAA_API_TOKEN ? "env" : "unconfigured",
    },
    instagram: {
      enabled: eff.instagram.enabled,
      hasToken: Boolean(eff.instagram.accessToken),
      maskedToken: maskSecret(eff.instagram.accessToken),
      igUserId: eff.instagram.igUserId,
      source: saved.instagram?.accessToken ? "database" : process.env.INSTAGRAM_ACCESS_TOKEN ? "env" : "unconfigured",
    },
    webhook: {
      enabled: eff.webhook.enabled,
      activeHooksCount: hooks.length,
    },
  };
}

export function saveSocialChannelsConfig(patch: any): SocialChannelsPublicStatus {
  const current = (CommerceDB.getIntegration("social_channels")?.config || {}) as Partial<SocialChannelsConfig>;

  const nextToken = (incoming: any, existing?: string): string => {
    if (typeof incoming !== "string") return existing || "";
    const trimmed = incoming.trim();
    if (!trimmed || trimmed.includes("••••")) return existing || "";
    return trimmed;
  };

  const nextConfig: SocialChannelsConfig = {
    autoPublishBlogToSocial:
      typeof patch?.autoPublishBlogToSocial === "boolean"
        ? patch.autoPublishBlogToSocial
        : Boolean(current.autoPublishBlogToSocial),
    telegram: {
      enabled:
        typeof patch?.telegram?.enabled === "boolean"
          ? patch.telegram.enabled
          : Boolean(current.telegram?.enabled),
      botToken: nextToken(patch?.telegram?.botToken, current.telegram?.botToken),
      chatId:
        typeof patch?.telegram?.chatId === "string"
          ? patch.telegram.chatId.trim()
          : current.telegram?.chatId || "",
    },
    bale: {
      enabled:
        typeof patch?.bale?.enabled === "boolean"
          ? patch.bale.enabled
          : Boolean(current.bale?.enabled),
      botToken: nextToken(patch?.bale?.botToken, current.bale?.botToken),
      chatId:
        typeof patch?.bale?.chatId === "string"
          ? patch.bale.chatId.trim()
          : current.bale?.chatId || "",
    },
    eitaa: {
      enabled:
        typeof patch?.eitaa?.enabled === "boolean"
          ? patch.eitaa.enabled
          : Boolean(current.eitaa?.enabled),
      apiToken: nextToken(patch?.eitaa?.apiToken, current.eitaa?.apiToken),
      chatId:
        typeof patch?.eitaa?.chatId === "string"
          ? patch.eitaa.chatId.trim()
          : current.eitaa?.chatId || "",
    },
    instagram: {
      enabled:
        typeof patch?.instagram?.enabled === "boolean"
          ? patch.instagram.enabled
          : Boolean(current.instagram?.enabled),
      accessToken: nextToken(patch?.instagram?.accessToken, current.instagram?.accessToken),
      igUserId:
        typeof patch?.instagram?.igUserId === "string"
          ? patch.instagram.igUserId.trim()
          : current.instagram?.igUserId || "",
    },
    webhook: {
      enabled:
        typeof patch?.webhook?.enabled === "boolean"
          ? patch.webhook.enabled
          : typeof current.webhook?.enabled === "boolean"
          ? current.webhook.enabled
          : true,
    },
  };

  CommerceDB.saveIntegration("social_channels", nextConfig);
  return getSocialChannelsPublicStatus();
}

function isPublicHttpsUrl(raw?: string): boolean {
  if (!raw || typeof raw !== "string") return false;
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "https:") return false;
    return validateWebhookUrl(raw.trim()).isSafe;
  } catch {
    return false;
  }
}

async function fetchJsonWithTimeout(url: string, init: RequestInit, timeoutMs = 12000): Promise<{ status: number; data: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, redirect: "error" });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 300) };
    }
    return { status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function buildMessengerHtmlCaption(payload: SocialPublishPayload): string {
  const lines: string[] = [];
  if (payload.title) {
    lines.push(`<b>${escapeHtml(payload.title)}</b>`);
    lines.push("");
  }
  lines.push(escapeHtml(payload.caption));
  if (payload.targetUrl && validateWebhookUrl(payload.targetUrl).isSafe) {
    lines.push("");
    lines.push(`<a href="${escapeHtml(payload.targetUrl)}">مشاهده و خرید آنلاین در گُردیه</a>`);
  }
  return lines.join("\n").slice(0, 4000);
}

async function publishTelegram(cfg: SocialChannelsConfig["telegram"], payload: SocialPublishPayload): Promise<SocialChannelResult> {
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
    return { channel: "telegram", ok: false, error: "کانال تلگرام فعال یا پیکربندی نشده است (توکن ربات یا شناسه کانال وارد نشده)." };
  }

  const base = `https://api.telegram.org/bot${cfg.botToken}`;
  const htmlCaption = buildMessengerHtmlCaption(payload);
  const inlineKeyboard =
    payload.targetUrl && isPublicHttpsUrl(payload.targetUrl)
      ? { inline_keyboard: [[{ text: "🛍 مشاهده و خرید آنلاین", url: payload.targetUrl }]] }
      : undefined;

  try {
    if (isPublicHttpsUrl(payload.imageUrl) && htmlCaption.length <= 1024) {
      const { status, data } = await fetchJsonWithTimeout(`${base}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          photo: payload.imageUrl,
          caption: htmlCaption,
          parse_mode: "HTML",
          ...(inlineKeyboard ? { reply_markup: inlineKeyboard } : {}),
        }),
      });
      if (status >= 200 && status < 300 && data?.ok) {
        return { channel: "telegram", ok: true, messageId: String(data.result?.message_id || "") };
      }
      return { channel: "telegram", ok: false, error: data?.description || `خطای تلگرام (HTTP ${status})` };
    }

    const { status, data } = await fetchJsonWithTimeout(`${base}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: htmlCaption,
        parse_mode: "HTML",
        disable_web_page_preview: false,
        ...(inlineKeyboard ? { reply_markup: inlineKeyboard } : {}),
      }),
    });
    if (status >= 200 && status < 300 && data?.ok) {
      return { channel: "telegram", ok: true, messageId: String(data.result?.message_id || "") };
    }
    return { channel: "telegram", ok: false, error: data?.description || `خطای تلگرام (HTTP ${status})` };
  } catch (err: any) {
    return { channel: "telegram", ok: false, error: "خطا در برقراری ارتباط با API تلگرام" };
  }
}

async function publishBale(cfg: SocialChannelsConfig["bale"], payload: SocialPublishPayload): Promise<SocialChannelResult> {
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
    return { channel: "bale", ok: false, error: "کانال بله فعال یا پیکربندی نشده است (توکن بازوی بله یا شناسه کانال وارد نشده)." };
  }

  const base = `https://tapi.bale.ai/bot${cfg.botToken}`;
  const textParts = [payload.title ? `${payload.title}\n` : "", payload.caption, payload.targetUrl ? `\n\nمشاهده در سایت:\n${payload.targetUrl}` : ""]
    .filter(Boolean)
    .join("");

  try {
    if (isPublicHttpsUrl(payload.imageUrl) && textParts.length <= 1024) {
      const { status, data } = await fetchJsonWithTimeout(`${base}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cfg.chatId,
          photo: payload.imageUrl,
          caption: textParts,
        }),
      });
      if (status >= 200 && status < 300 && data?.ok) {
        return { channel: "bale", ok: true, messageId: String(data.result?.message_id || "") };
      }
      return { channel: "bale", ok: false, error: data?.description || `خطای بله (HTTP ${status})` };
    }

    const { status, data } = await fetchJsonWithTimeout(`${base}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: textParts.slice(0, 4000),
      }),
    });
    if (status >= 200 && status < 300 && data?.ok) {
      return { channel: "bale", ok: true, messageId: String(data.result?.message_id || "") };
    }
    return { channel: "bale", ok: false, error: data?.description || `خطای بله (HTTP ${status})` };
  } catch {
    return { channel: "bale", ok: false, error: "خطا در برقراری ارتباط با API بله" };
  }
}

async function publishEitaa(cfg: SocialChannelsConfig["eitaa"], payload: SocialPublishPayload): Promise<SocialChannelResult> {
  if (!cfg.enabled || !cfg.apiToken || !cfg.chatId) {
    return { channel: "eitaa", ok: false, error: "کانال ایتا فعال یا پیکربندی نشده است (توکن ایتایار یا شناسه کانال وارد نشده)." };
  }

  const text = [payload.title ? `${payload.title}\n` : "", payload.caption, payload.targetUrl ? `\n\n${payload.targetUrl}` : ""]
    .filter(Boolean)
    .join("")
    .slice(0, 4000);

  try {
    const form = new URLSearchParams();
    form.set("chat_id", cfg.chatId);
    form.set("text", text);
    form.set("pin", "0");
    form.set("disable_notification", "0");

    const { status, data } = await fetchJsonWithTimeout(`https://eitaayar.ir/api/${cfg.apiToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (status >= 200 && status < 300 && data?.ok) {
      return { channel: "eitaa", ok: true, messageId: String(data.result?.message_id || "") };
    }
    return { channel: "eitaa", ok: false, error: data?.description || data?.message || `خطای ایتا (HTTP ${status})` };
  } catch {
    return { channel: "eitaa", ok: false, error: "خطا در برقراری ارتباط با سرویس ایتایار" };
  }
}

async function publishInstagram(cfg: SocialChannelsConfig["instagram"], payload: SocialPublishPayload): Promise<SocialChannelResult> {
  if (!cfg.enabled || !cfg.accessToken || !cfg.igUserId) {
    return { channel: "instagram", ok: false, error: "حساب اینستاگرام فعال یا پیکربندی نشده است (Access Token یا IG User ID وارد نشده)." };
  }
  if (!isPublicHttpsUrl(payload.imageUrl)) {
    return { channel: "instagram", ok: false, error: "اینستاگرام Graph API برای انتشار پست نیازمند آدرس تصویر عمومی با پروتکل HTTPS است." };
  }

  const fullCaption = [payload.title, payload.caption, payload.targetUrl ? `🔗 لینک محصول: ${payload.targetUrl}` : ""]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 2200);

  const graphBase = `https://graph.facebook.com/v21.0/${encodeURIComponent(cfg.igUserId)}`;

  try {
    // Step 1: Create media container
    const createBody = new URLSearchParams();
    createBody.set("image_url", String(payload.imageUrl));
    createBody.set("caption", fullCaption);
    createBody.set("access_token", cfg.accessToken);

    const containerRes = await fetchJsonWithTimeout(`${graphBase}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: createBody.toString(),
    });

    if (containerRes.status < 200 || containerRes.status >= 300 || !containerRes.data?.id) {
      return {
        channel: "instagram",
        ok: false,
        error: containerRes.data?.error?.message || `خطا در ساخت مدیا کانتینر اینستاگرام (HTTP ${containerRes.status})`,
      };
    }

    // Step 2: Publish container
    const pubBody = new URLSearchParams();
    pubBody.set("creation_id", String(containerRes.data.id));
    pubBody.set("access_token", cfg.accessToken);

    const publishRes = await fetchJsonWithTimeout(`${graphBase}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: pubBody.toString(),
    });

    if (publishRes.status >= 200 && publishRes.status < 300 && publishRes.data?.id) {
      return { channel: "instagram", ok: true, messageId: String(publishRes.data.id) };
    }

    return {
      channel: "instagram",
      ok: false,
      error: publishRes.data?.error?.message || `خطا در انتشار نهایی اینستاگرام (HTTP ${publishRes.status})`,
    };
  } catch {
    return { channel: "instagram", ok: false, error: "خطا در برقراری ارتباط با Meta Graph API" };
  }
}

function enqueueSocialWebhooks(payload: SocialPublishPayload): SocialChannelResult {
  const hooks = CommerceDB.getWebhooks().filter((h: any) => h.enabled);
  if (hooks.length === 0) {
    return { channel: "webhook", ok: false, error: "هیچ وب‌هوک فعالی (n8n / Make) ثبت نشده است." };
  }

  const db = CommerceDB.getRawDb();
  const nowIso = new Date().toISOString();
  let queuedCount = 0;

  for (const hook of hooks) {
    const ssrf = validateWebhookUrl(hook.url);
    if (!ssrf.isSafe) continue;
    db.prepare(`
      INSERT INTO outbox_events (
        id, topic, schema_version, payload, status, next_retry_at, created_at
      ) VALUES (?, 'webhook:dispatch', 1, ?, 'PENDING', ?, ?)
    `).run(
      `evt_socwh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      JSON.stringify({
        url: hook.url,
        event: "social.publish",
        body: {
          ...payload,
          publishedAt: nowIso,
        },
      }),
      nowIso,
      nowIso
    );
    queuedCount++;
  }

  if (queuedCount === 0) {
    return { channel: "webhook", ok: false, error: "وب‌هوک‌های ثبت‌شده به دلیل قوانین امنیتی مسدود یا نامعتبر هستند." };
  }

  return { channel: "webhook", ok: true, queued: true, messageId: `queued:${queuedCount}` };
}

export async function publishToSocialChannels(
  channels: SocialChannelKey[] | undefined,
  payload: SocialPublishPayload
): Promise<SocialChannelResult[]> {
  const cfg = getEffectiveConfig();
  let selected: SocialChannelKey[] = Array.isArray(channels) && channels.length > 0 ? channels : [];

  if (selected.length === 0) {
    if (cfg.telegram.enabled) selected.push("telegram");
    if (cfg.bale.enabled) selected.push("bale");
    if (cfg.eitaa.enabled) selected.push("eitaa");
    if (cfg.instagram.enabled) selected.push("instagram");
    if (cfg.webhook.enabled && CommerceDB.getWebhooks().some((w: any) => w.enabled)) selected.push("webhook");
  }

  if (selected.length === 0) {
    return [{ channel: "telegram", ok: false, error: "هیچ کانال فعالی برای انتشار انتخاب یا پیکربندی نشده است." }];
  }

  const results: SocialChannelResult[] = [];
  for (const ch of selected) {
    if (ch === "telegram") results.push(await publishTelegram(cfg.telegram, payload));
    else if (ch === "bale") results.push(await publishBale(cfg.bale, payload));
    else if (ch === "eitaa") results.push(await publishEitaa(cfg.eitaa, payload));
    else if (ch === "instagram") results.push(await publishInstagram(cfg.instagram, payload));
    else if (ch === "webhook") results.push(enqueueSocialWebhooks(payload));
  }
  return results;
}

export async function processDueScheduledSocialPosts(): Promise<{ processed: number; published: number; failed: number }> {
  const nowIso = new Date().toISOString();
  const due = CommerceDB.claimDueScheduledSocialPosts(nowIso, 5);
  let published = 0;
  let failed = 0;

  for (const job of due) {
    try {
      const results = await publishToSocialChannels(job.channels as SocialChannelKey[], job.payload);
      const anySuccess = results.some((r) => r.ok);
      if (anySuccess) {
        published++;
        CommerceDB.completeScheduledSocialPost(job.id, "PUBLISHED", results, null);
      } else {
        failed++;
        const firstErr = results.find((r) => r.error)?.error || "انتشار در کانال‌های انتخابی ناموفق بود.";
        CommerceDB.completeScheduledSocialPost(job.id, "FAILED", results, firstErr);
      }
    } catch (err: any) {
      failed++;
      CommerceDB.completeScheduledSocialPost(job.id, "FAILED", [], err?.message || "Unexpected scheduler error");
    }
  }

  return { processed: due.length, published, failed };
}

export async function maybeAutoPublishCmsDocument(doc: UnifiedDocument, siteUrl: string): Promise<void> {
  if (!doc || doc.status !== "PUBLISHED" || doc.noindex) return;
  const cfg = getEffectiveConfig();
  if (!cfg.autoPublishBlogToSocial) return;

  const dedupeKey = `cms_social_autopublished:${doc.id}`;
  const already = CommerceDB.getKvJson(dedupeKey, null) as { version: number; at: string } | null;
  if (already) return;

  const cleanBase = siteUrl.replace(/\/+$/, "");
  const pathPrefix = doc.kind === "article" ? "/blog/" : "/page/";
  const targetUrl = `${cleanBase}${pathPrefix}${doc.slug}`;
  const imageUrl = doc.coverImage
    ? doc.coverImage.startsWith("http")
      ? doc.coverImage
      : `${cleanBase}${doc.coverImage.startsWith("/") ? "" : "/"}${doc.coverImage}`
    : undefined;

  const caption = `${doc.seoDescription || doc.derivedPlainText.slice(0, 260)}\n\nمطالعه کامل در مجله گُردیه`;

  CommerceDB.setKvJson(dedupeKey, { version: doc.version, at: new Date().toISOString() });

  await publishToSocialChannels(undefined, {
    title: doc.title,
    caption,
    targetUrl,
    imageUrl,
    kind: "ARTICLE",
    documentId: doc.id,
  });
}
