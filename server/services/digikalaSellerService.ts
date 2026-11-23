import { CommerceDB } from "../db";
import { validateWebhookUrlAsync } from "../utils/ssrfGuard";
import { CanonicalProduct } from "../../src/types";

const DEFAULT_DIGIKALA_BASE_URL = "https://seller.digikala.com/api/v1";
const MAPPING_KV_KEY = "digikala_variant_mappings";

export interface DigikalaSellerConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  autoSyncStock: boolean;
  autoSyncOrders: boolean;
}

export interface DigikalaSellerPublicStatus {
  enabled: boolean;
  configured: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
  baseUrl: string;
  autoSyncStock: boolean;
  autoSyncOrders: boolean;
  mappedProductsCount: number;
  source: "env" | "database" | "unconfigured";
}

export interface DigikalaVariantMapping {
  productId: string;
  variantId: number;
  dkp?: string;
  extraMarginPercent?: number;
}

function maskApiKey(key?: string): string {
  const trimmed = (key || "").trim();
  if (!trimmed) return "";
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••••${trimmed.slice(-4)}`;
}

function getEffectiveConfig(): DigikalaSellerConfig {
  const saved = (CommerceDB.getIntegration("digikala_seller")?.config || {}) as Partial<DigikalaSellerConfig>;
  const envKey = (process.env.DIGIKALA_SELLER_API_KEY || "").trim();
  const envBase = (process.env.DIGIKALA_SELLER_BASE_URL || "").trim();

  return {
    enabled: typeof saved.enabled === "boolean" ? saved.enabled : Boolean(envKey),
    apiKey: (saved.apiKey || envKey || "").trim(),
    baseUrl: (saved.baseUrl || envBase || DEFAULT_DIGIKALA_BASE_URL).trim().replace(/\/+$/, ""),
    autoSyncStock: Boolean(saved.autoSyncStock),
    autoSyncOrders: Boolean(saved.autoSyncOrders),
  };
}

export function getDigikalaVariantMappings(): DigikalaVariantMapping[] {
  const raw = CommerceDB.getKvJson(MAPPING_KV_KEY, []) as DigikalaVariantMapping[];
  return Array.isArray(raw) ? raw : [];
}

export function saveDigikalaVariantMappings(items: DigikalaVariantMapping[]): DigikalaVariantMapping[] {
  const cleaned = items
    .filter((i) => i && typeof i.productId === "string" && i.productId.trim() && Number(i.variantId) > 0)
    .map((i) => ({
      productId: i.productId.trim(),
      variantId: Math.floor(Number(i.variantId)),
      ...(i.dkp ? { dkp: String(i.dkp).trim() } : {}),
      ...(typeof i.extraMarginPercent === "number" && !isNaN(i.extraMarginPercent)
        ? { extraMarginPercent: Number(i.extraMarginPercent) }
        : {}),
    }));
  return CommerceDB.setKvJson(MAPPING_KV_KEY, cleaned);
}

export function getDigikalaSellerPublicStatus(): DigikalaSellerPublicStatus {
  const saved = (CommerceDB.getIntegration("digikala_seller")?.config || {}) as Partial<DigikalaSellerConfig>;
  const eff = getEffectiveConfig();
  const mappings = getDigikalaVariantMappings();

  return {
    enabled: eff.enabled,
    configured: eff.enabled && Boolean(eff.apiKey),
    hasApiKey: Boolean(eff.apiKey),
    maskedApiKey: maskApiKey(eff.apiKey),
    baseUrl: eff.baseUrl,
    autoSyncStock: eff.autoSyncStock,
    autoSyncOrders: eff.autoSyncOrders,
    mappedProductsCount: mappings.length,
    source: saved.apiKey ? "database" : process.env.DIGIKALA_SELLER_API_KEY ? "env" : "unconfigured",
  };
}

export function saveDigikalaSellerConfig(patch: any): DigikalaSellerPublicStatus {
  const current = (CommerceDB.getIntegration("digikala_seller")?.config || {}) as Partial<DigikalaSellerConfig>;
  let apiKey = current.apiKey || "";
  if (typeof patch?.apiKey === "string") {
    const t = patch.apiKey.trim();
    if (t && !t.includes("••••")) {
      apiKey = t;
    }
  }

  const baseUrl =
    typeof patch?.baseUrl === "string" && patch.baseUrl.trim()
      ? patch.baseUrl.trim().replace(/\/+$/, "")
      : current.baseUrl || DEFAULT_DIGIKALA_BASE_URL;

  const next: DigikalaSellerConfig = {
    enabled: typeof patch?.enabled === "boolean" ? patch.enabled : Boolean(current.enabled),
    apiKey,
    baseUrl,
    autoSyncStock:
      typeof patch?.autoSyncStock === "boolean" ? patch.autoSyncStock : Boolean(current.autoSyncStock),
    autoSyncOrders:
      typeof patch?.autoSyncOrders === "boolean" ? patch.autoSyncOrders : Boolean(current.autoSyncOrders),
  };

  CommerceDB.saveIntegration("digikala_seller", next);
  return getDigikalaSellerPublicStatus();
}

async function digikalaRequest(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
  const cfg = getEffectiveConfig();
  if (!cfg.enabled || !cfg.apiKey) {
    return {
      ok: false,
      status: 400,
      error: "اتصال دیجی‌کالا فعال نیست یا کلید API پنل فروشندگان (Seller Token) وارد نشده است.",
    };
  }

  const fullUrl = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const ssrf = await validateWebhookUrlAsync(fullUrl);
  if (!ssrf.isSafe) {
    return {
      ok: false,
      status: 400,
      error: `آدرس پایه دیجی‌کالا نامعتبر است: ${ssrf.reason}`,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(fullUrl, {
      method: options.method || "GET",
      headers: {
        Authorization: cfg.apiKey,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      redirect: "error",
      signal: controller.signal,
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 300) };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.message || data?.error || `پاسخ خطا از سرور دیجی‌کالا (HTTP ${res.status})`,
      };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 502,
      error: err?.name === "AbortError" ? "پاسخ از سرور دیجی‌کالا با وقفه زمانی (Timeout) مواجه شد." : "خطا در برقراری ارتباط با API دیجی‌کالا",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchDigikalaVariants(page: number = 1) {
  return digikalaRequest(`/variants/?page=${Math.max(1, page)}`);
}

export async function fetchDigikalaOrders(page: number = 1) {
  return digikalaRequest(`/orders/?page=${Math.max(1, page)}`);
}

export async function syncDigikalaInventory(filterProductIds?: string[]): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  syncedCount: number;
  failedCount: number;
  results: Array<{
    productId: string;
    variantId: number;
    stock: number;
    priceToman: number;
    priceRial: number;
    ok: boolean;
    error?: string;
  }>;
}> {
  const cfg = getEffectiveConfig();
  if (!cfg.enabled || !cfg.apiKey) {
    return {
      ok: false,
      status: 400,
      error: "اتصال دیجی‌کالا فعال نیست یا Seller Token وارد نشده است. ابتدا کلید واقعی پنل فروشندگان دیجی‌کالا را ثبت کنید.",
      syncedCount: 0,
      failedCount: 0,
      results: [],
    };
  }

  const mappings = getDigikalaVariantMappings();
  const targetMappings =
    Array.isArray(filterProductIds) && filterProductIds.length > 0
      ? mappings.filter((m) => filterProductIds.includes(m.productId))
      : mappings;

  if (targetMappings.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "هیچ نگاشت Variant ID بین محصولات فروشگاه و دیجی‌کالا ثبت نشده است.",
      syncedCount: 0,
      failedCount: 0,
      results: [],
    };
  }

  const products = CommerceDB.getProducts();
  const productById = new Map<string, CanonicalProduct>(products.map((p) => [p.id, p]));
  const results: Array<{
    productId: string;
    variantId: number;
    stock: number;
    priceToman: number;
    priceRial: number;
    ok: boolean;
    error?: string;
  }> = [];

  for (const mapItem of targetMappings) {
    const product = productById.get(mapItem.productId);
    if (!product) {
      results.push({
        productId: mapItem.productId,
        variantId: mapItem.variantId,
        stock: 0,
        priceToman: 0,
        priceRial: 0,
        ok: false,
        error: "محصول در کاتالوگ پیدا نشد",
      });
      continue;
    }

    const activeOffer =
      product.supplierOffers?.find((o) => o.id === product.selectedOfferId) ||
      product.supplierOffers?.[0];
    const isSellable = product.status === "PUBLISHED";
    const stock = isSellable && activeOffer ? Math.max(0, Number(activeOffer.stock || 0)) : 0;
    const extraMultiplier = 1 + (Number(mapItem.extraMarginPercent || 0) / 100);
    const priceToman = Math.round(product.retailPrice * extraMultiplier);
    const priceRial = priceToman * 10;

    const apiRes = await digikalaRequest(`/variants/${mapItem.variantId}/`, {
      method: "PUT",
      body: {
        is_active: stock > 0,
        seller_stock: stock,
        price: priceRial,
      },
    });

    results.push({
      productId: product.id,
      variantId: mapItem.variantId,
      stock,
      priceToman,
      priceRial,
      ok: apiRes.ok,
      ...(apiRes.error ? { error: apiRes.error } : {}),
    });
  }

  const syncedCount = results.filter((r) => r.ok).length;
  const failedCount = results.length - syncedCount;

  return {
    ok: failedCount === 0,
    status: failedCount === results.length ? 502 : 200,
    syncedCount,
    failedCount,
    results,
  };
}
