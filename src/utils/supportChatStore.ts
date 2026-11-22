import { CanonicalProduct } from '../types';
import {
  CustomerAddress,
  DEFAULT_STORE_FEATURE_SETTINGS,
  StoreFeatureSettings,
  containsProfanityOrAbuse,
  normalizeDigits,
  validateSafePreferredName,
} from './iranianValidators';

export type SupportFlowType =
  | 'ONBOARD_NAME'
  | 'OFFER_OTP_ACCOUNT'
  | 'OTP_VERIFY'
  | 'GIFT'
  | 'TRACKING'
  | 'QUESTION'
  | 'OPERATOR'
  | 'PRIVACY'
  | null;

export interface SupportFlowState {
  flow: SupportFlowType;
  step: number;
  data: Record<string, string>;
}

export interface CustomerAccount {
  phone: string;
  username?: string;
  preferredName?: string;
  fullName?: string;
  email?: string;
  nationalId?: string;
  addresses?: CustomerAddress[];
  accountType?: 'GUEST_1Y' | 'VERIFIED';
  isVerified?: boolean;
  verifiedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportRecommendedCard {
  productId: string;
  title: string;
  price: number;
  image?: string;
  matchReason?: string;
  watchOut?: string;
}

export interface SupportOrderCard {
  orderNumber: string;
  trackingCode?: string;
  status: string;
  customerName?: string;
  totalAmount?: number;
  createdAt?: string;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  createdAt: string;
  recommendedProducts?: SupportRecommendedCard[];
  orderCard?: SupportOrderCard;
  flowTag?: string;
}

export interface SupportChatSession {
  id: string;
  phone: string;
  customerName?: string;
  title: string;
  status: 'ACTIVE' | 'OPERATOR_REQUESTED' | 'RESOLVED';
  flowState: SupportFlowState;
  messages: SupportChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SlashCommandDef {
  command: string;
  aliases: string[];
  label: string;
  description: string;
  actionType: SupportFlowType | 'NEW';
}

export const SLASH_COMMANDS: SlashCommandDef[] = [
  {
    command: '/هدیه',
    aliases: ['/هدیه', '/کادو', '/gift'],
    label: 'مشاوره انتخاب هدیه و گجت',
    description: 'پیشنهاد صمیمی و دقیق محصول متناسب با نیاز و بودجه شما از موجودی واقعی فروشگاه',
    actionType: 'GIFT',
  },
  {
    command: '/پیگیری',
    aliases: ['/پیگیری', '/سفارش', '/track'],
    label: 'پیگیری سفارش و کد رهگیری',
    description: 'استعلام وضعیت فعلی سفارش و کد رهگیری پستی ثبت‌شده با شماره یا کد سفارش',
    actionType: 'TRACKING',
  },
  {
    command: '/سوال',
    aliases: ['/سوال', '/پرسش', '/faq'],
    label: 'پرسش درباره کالا، تست، تعویض و ارسال',
    description: 'پاسخ روشن درباره جزئیات فنی محصولات، شرایط تست و تعویض، پرداخت و ارسال',
    actionType: 'QUESTION',
  },
  {
    command: '/اپراتور',
    aliases: ['/اپراتور', '/تماس', '/پشتیبان'],
    label: 'هماهنگی تماس با پشتیبان انسانی',
    description: 'ثبت درخواست تماس کارشناس پشتیبانی با شماره حساب کاربری شما',
    actionType: 'OPERATOR',
  },
  {
    command: '/جدید',
    aliases: ['/جدید', '/تازه', '/new'],
    label: 'شروع گفتگوی جدید',
    description: 'ساخت یک گفتگوی تازه با حفظ تمام تاریخچه گفتگوهای قبلی در حساب کاربری',
    actionType: 'NEW',
  },
  {
    command: '/حریم',
    aliases: ['/حریم', '/حذف', '/حافظه'],
    label: 'مدیریت تاریخچه و حریم خصوصی چت‌ها',
    description: 'بررسی یا پاکسازی سوابق گفتگوی ثبت‌شده برای شماره شما',
    actionType: 'PRIVACY',
  },
];

const SUPPORT_PHONE_STORAGE_KEY = 'commerce_os_support_phone';
const SUPPORT_SESSIONS_STORAGE_KEY = 'commerce_os_support_sessions_v1';
const CUSTOMER_ACCOUNTS_STORAGE_KEY = 'commerce_os_customer_accounts_v1';
export const SUPPORT_UPDATED_EVENT = 'gordiyeh-support-updated';

// Keep verified session token strictly in memory (never localStorage/sessionStorage)
let activeSessionToken: string | null = null;
export function getActiveCustomerSessionToken(): string | null {
  return activeSessionToken;
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

export function formatPersianDate(iso?: string | null): string {
  if (!iso) {
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    return oneYearLater.toLocaleDateString('fa-IR');
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    return oneYearLater.toLocaleDateString('fa-IR');
  }
  return parsed.toLocaleDateString('fa-IR');
}

export function stripChatMarkdown(text: string): string {
  return String(text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`{1,3}/g, '')
    .trim();
}

export function normalizeIranianPhone(raw: string): string {
  let digits = String(raw || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\s\-().]/g, '');

  if (digits.startsWith('0098')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('+98')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('98') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  } else if (/^9\d{9}$/.test(digits)) {
    digits = '0' + digits;
  }

  return digits;
}

export function isValidIranianPhone(raw: string): boolean {
  const normalized = normalizeIranianPhone(raw);
  return /^09\d{9}$/.test(normalized);
}

export function getKnownCustomerInfo(): { name?: string; phone?: string } | null {
  try {
    const raw = localStorage.getItem('commerce_os_last_customer');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalized = parsed?.phone ? normalizeIranianPhone(parsed.phone) : '';
    const cachedAccount = isValidIranianPhone(normalized)
      ? getCachedCustomerAccount(normalized)
      : null;
    return {
      name:
        cachedAccount?.preferredName ||
        parsed?.preferredName ||
        parsed?.fullName ||
        parsed?.name ||
        undefined,
      phone: isValidIranianPhone(normalized) ? normalized : undefined,
    };
  } catch {
    return null;
  }
}

function readAccountsMap(): Record<string, CustomerAccount> {
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getCachedCustomerAccount(rawPhone: string): CustomerAccount | null {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) return null;
  const map = readAccountsMap();
  return map[phone] || null;
}

export function saveCachedCustomerAccount(account: CustomerAccount): CustomerAccount | null {
  const phone = normalizeIranianPhone(account.phone);
  if (!isValidIranianPhone(phone)) return null;
  const isVerified = Boolean(account.isVerified || account.accountType === 'VERIFIED');
  const defaultOneYearIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const cleanAccount: CustomerAccount = {
    phone,
    username: account.username || phone,
    preferredName: account.preferredName?.trim() || undefined,
    fullName: account.fullName?.trim() || undefined,
    email: account.email?.trim() || undefined,
    nationalId: account.nationalId?.trim() || undefined,
    addresses: Array.isArray(account.addresses) ? account.addresses : [],
    accountType: isVerified ? 'VERIFIED' : 'GUEST_1Y',
    isVerified,
    verifiedAt: account.verifiedAt,
    expiresAt: isVerified ? undefined : account.expiresAt || defaultOneYearIso,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
  try {
    const map = readAccountsMap();
    map[phone] = cleanAccount;
    localStorage.setItem(CUSTOMER_ACCOUNTS_STORAGE_KEY, JSON.stringify(map));

    // Keep commerce_os_last_customer synchronized safely without wiping address fields
    const existingRaw = localStorage.getItem('commerce_os_last_customer');
    const existingParsed = existingRaw ? JSON.parse(existingRaw) : {};
    const nextName =
      cleanAccount.preferredName || cleanAccount.fullName || existingParsed?.name || undefined;
    const defaultAddr =
      cleanAccount.addresses?.find((a) => a.isDefault) || cleanAccount.addresses?.[0];
    localStorage.setItem(
      'commerce_os_last_customer',
      JSON.stringify({
        ...(existingParsed && typeof existingParsed === 'object' ? existingParsed : {}),
        phone,
        preferredName: cleanAccount.preferredName || existingParsed?.preferredName || undefined,
        name: nextName,
        email: cleanAccount.email || existingParsed?.email || undefined,
        nationalId: cleanAccount.nationalId || existingParsed?.nationalId || undefined,
        ...(defaultAddr
          ? {
              province: defaultAddr.province,
              city: defaultAddr.city,
              address: defaultAddr.addressLine,
              postalCode: defaultAddr.postalCode,
            }
          : {}),
      })
    );
  } catch {}
  return cleanAccount;
}

export async function fetchStoreFeatureSettings(): Promise<StoreFeatureSettings> {
  try {
    const res = await fetch('/api/v1/settings/store-features');
    if (res.ok) {
      const data = await res.json();
      if (data?.settings) {
        return {
          ...DEFAULT_STORE_FEATURE_SETTINGS,
          ...data.settings,
        };
      }
    }
  } catch {}
  return DEFAULT_STORE_FEATURE_SETTINGS;
}

export async function identifyCustomerAccount(
  rawPhone: string
): Promise<{ isNew: boolean; account: CustomerAccount | null }> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) {
    return { isNew: false, account: null };
  }

  const cached = getCachedCustomerAccount(phone);
  try {
    const res = await fetch('/api/v1/customer/account/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.account) {
        const synced = saveCachedCustomerAccount(data.account);
        emitSupportUpdated(phone);
        return { isNew: Boolean(data.isNew), account: synced };
      }
    }
  } catch {}

  const fallbackAccount: CustomerAccount = cached || {
    phone,
    username: phone,
    accountType: 'GUEST_1Y',
    isVerified: false,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };
  saveCachedCustomerAccount(fallbackAccount);
  emitSupportUpdated(phone);
  return { isNew: !cached, account: fallbackAccount };
}

export interface ProfileUpdatePayload {
  preferredName?: string;
  fullName?: string;
  email?: string;
  nationalId?: string;
  addresses?: CustomerAddress[];
  keepOneYearGuest?: boolean;
}

export async function updateCustomerProfile(
  rawPhone: string,
  updates: ProfileUpdatePayload
): Promise<{ ok: boolean; account: CustomerAccount | null; error?: string }> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) {
    return { ok: false, account: null, error: 'شماره موبایل نامعتبر است.' };
  }

  const payload: Record<string, unknown> = { phone };
  if (typeof updates.preferredName === 'string') {
    const strippedPref = stripChatMarkdown(updates.preferredName).trim();
    if (strippedPref.length > 0) {
      const prefCheck = validateSafePreferredName(strippedPref);
      if (!prefCheck.ok) {
        return {
          ok: false,
          account: null,
          error: prefCheck.reason || 'نام انتخابی معتبر نیست.',
        };
      }
      payload.preferredName = prefCheck.cleaned;
    } else {
      payload.preferredName = '';
    }
  }
  if (typeof updates.fullName === 'string') {
    const trimmedFull = updates.fullName.trim();
    if (trimmedFull.length > 0 && containsProfanityOrAbuse(trimmedFull)) {
      return {
        ok: false,
        account: null,
        error: 'نام و نام خانوادگی واردشده حاوی عبارات نامناسب یا غیرمجاز است.',
      };
    }
    payload.fullName = trimmedFull;
  }
  if (typeof updates.email === 'string') {
    payload.email = updates.email.trim();
  }
  if (typeof updates.nationalId === 'string') {
    payload.nationalId = normalizeDigits(updates.nationalId);
  }
  if (Array.isArray(updates.addresses)) {
    payload.addresses = updates.addresses;
  }
  if (typeof updates.keepOneYearGuest === 'boolean') {
    payload.keepOneYearGuest = updates.keepOneYearGuest;
  }

  try {
    const res = await fetch('/api/v1/customer/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        account: null,
        error: data?.error || 'خطا در ذخیره اطلاعات حساب کاربری.',
      };
    }

    const saved = data?.account ? saveCachedCustomerAccount(data.account) : null;
    if (saved?.preferredName) {
      const sessions = getLocalSessionsForPhone(phone);
      if (sessions.length > 0) {
        writeLocalSessionsForPhone(
          phone,
          sessions.map((s) => ({ ...s, customerName: saved.preferredName }))
        );
      } else {
        emitSupportUpdated(phone);
      }
    } else {
      emitSupportUpdated(phone);
    }

    return { ok: true, account: saved };
  } catch {
    return {
      ok: false,
      account: null,
      error: 'خطا در برقراری ارتباط با سرور برای ذخیره اطلاعات.',
    };
  }
}

export async function updateCustomerPreferredName(
  rawPhone: string,
  preferredName: string,
  fullName?: string
): Promise<CustomerAccount | null> {
  const cleanName = stripChatMarkdown(preferredName).trim();
  if (cleanName.length < 2) return null;
  const result = await updateCustomerProfile(rawPhone, {
    preferredName: cleanName,
    ...(typeof fullName === 'string' ? { fullName } : {}),
  });
  return result.account;
}

export async function optOutToOneYearGuest(rawPhone: string): Promise<CustomerAccount | null> {
  const res = await updateCustomerProfile(rawPhone, { keepOneYearGuest: true });
  return res.account;
}

export async function requestOtpCode(rawPhone: string): Promise<{
  ok: boolean;
  provider?: string;
  expiresInSeconds?: number;
  retryAfterSeconds?: number;
  code?: string;
  error?: string;
}> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) {
    return { ok: false, error: 'شماره موبایل معتبر ۱۱ رقمی الزامی است.' };
  }
  try {
    const res = await fetch('/api/v1/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        code: data?.code,
        retryAfterSeconds: data?.retryAfterSeconds,
        error: data?.error || 'ارسال پیامک تایید انجام نشد.',
      };
    }
    return {
      ok: true,
      provider: data?.provider,
      expiresInSeconds: data?.expiresInSeconds,
    };
  } catch {
    return { ok: false, error: 'خطا در اتصال به سرویس پیامک سرور.' };
  }
}

export async function verifyOtpCode(
  rawPhone: string,
  rawCode: string
): Promise<{
  ok: boolean;
  account?: CustomerAccount | null;
  error?: string;
}> {
  const phone = normalizeIranianPhone(rawPhone);
  const code = normalizeDigits(rawCode).replace(/\D/g, '');
  if (!isValidIranianPhone(phone) || code.length < 4) {
    return { ok: false, error: 'کد تایید پیامکی واردشده معتبر نیست.' };
  }
  try {
    const res = await fetch('/api/v1/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || 'کد تایید نادرست یا منقضی شده است.',
      };
    }
    if (typeof data?.sessionToken === 'string') {
      activeSessionToken = data.sessionToken;
    }
    const synced = data?.account ? saveCachedCustomerAccount(data.account) : null;
    emitSupportUpdated(phone);
    return { ok: true, account: synced };
  } catch {
    return { ok: false, error: 'خطا در تایید کد پیامکی.' };
  }
}

export function getSavedSupportPhone(): string {
  try {
    const direct = localStorage.getItem(SUPPORT_PHONE_STORAGE_KEY);
    if (direct && isValidIranianPhone(direct)) {
      return normalizeIranianPhone(direct);
    }
    const known = getKnownCustomerInfo();
    if (known?.phone && isValidIranianPhone(known.phone)) {
      return known.phone;
    }
  } catch {}
  return '';
}

export function emitSupportUpdated(phone?: string) {
  try {
    window.dispatchEvent(new CustomEvent(SUPPORT_UPDATED_EVENT, { detail: { phone } }));
  } catch {}
}

export function setSavedSupportPhone(rawPhone: string): string | null {
  const normalized = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(normalized)) return null;
  try {
    localStorage.setItem(SUPPORT_PHONE_STORAGE_KEY, normalized);
    emitSupportUpdated(normalized);
  } catch {}
  return normalized;
}

export function clearSavedSupportPhone(): void {
  activeSessionToken = null;
  try {
    localStorage.removeItem(SUPPORT_PHONE_STORAGE_KEY);
    emitSupportUpdated('');
  } catch {}
}

function readAllLocalSessionsMap(): Record<string, SupportChatSession[]> {
  try {
    const raw = localStorage.getItem(SUPPORT_SESSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalSessionsForPhone(phone: string, sessions: SupportChatSession[]) {
  try {
    const map = readAllLocalSessionsMap();
    map[phone] = sessions
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 50);
    localStorage.setItem(SUPPORT_SESSIONS_STORAGE_KEY, JSON.stringify(map));
    emitSupportUpdated(phone);
  } catch {}
}

export function getLocalSessionsForPhone(rawPhone: string): SupportChatSession[] {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) return [];
  const map = readAllLocalSessionsMap();
  const list = Array.isArray(map[phone]) ? map[phone] : [];
  return list.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function createFreshSession(
  phone: string,
  accountOrName?: CustomerAccount | string | null
): SupportChatSession {
  const now = new Date();
  const nowIso = now.toISOString();
  const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const normalized = normalizeIranianPhone(phone);

  const cachedAccount = getCachedCustomerAccount(normalized);
  const preferredName = (
    typeof accountOrName === 'string'
      ? accountOrName
      : accountOrName?.preferredName || cachedAccount?.preferredName || ''
  ).trim();

  const needsPreferredName = !preferredName;

  const welcomeText = needsPreferredName
    ? `سلام! خیلی خوش اومدید به گُردیه.\nنام کاربری شما شماره موبایل ${toPersianDigits(
        normalized
      )} هست و تمام گفتگوها و پیگیری‌هاتون همینجا با امنیت کامل ذخیره می‌شه.\nدوست دارید چی صداتون کنم؟`
    : `سلام ${preferredName} عزیز! خوش برگشتید.\nهر سؤالی درباره محصولات، انتخاب هدیه یا وضعیت سفارشتون دارید بپرسید، یا با تایپ «/» لیست درخواست‌ها رو باز کنید.`;

  return {
    id: `sup_sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    phone: normalized,
    customerName: preferredName,
    title: 'گفتگوی جدید پشتیبانی',
    status: 'ACTIVE',
    flowState: needsPreferredName
      ? { flow: 'ONBOARD_NAME', step: 1, data: {} }
      : { flow: null, step: 0, data: {} },
    createdAt: nowIso,
    updatedAt: nowIso,
    messages: [
      {
        id: `bot_welcome_${Date.now()}`,
        sender: 'bot',
        text: welcomeText,
        timestamp: timeStr,
        createdAt: nowIso,
      },
    ],
  };
}

export function upsertLocalSession(session: SupportChatSession): SupportChatSession[] {
  const phone = normalizeIranianPhone(session.phone);
  if (!isValidIranianPhone(phone)) return [];
  const existing = getLocalSessionsForPhone(phone);
  const idx = existing.findIndex((s) => s.id === session.id);
  const next =
    idx >= 0
      ? existing.map((s, i) => (i === idx ? session : s))
      : [session, ...existing];
  writeLocalSessionsForPhone(phone, next);
  return next;
}

export async function syncSessionToServer(session: SupportChatSession): Promise<void> {
  if (!isValidIranianPhone(session.phone)) return;
  try {
    await fetch('/api/v1/support/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
  } catch {
    // Offline fallback stays safely in localStorage
  }
}

export async function saveSessionLocallyAndRemote(
  session: SupportChatSession
): Promise<SupportChatSession[]> {
  const updatedList = upsertLocalSession(session);
  void syncSessionToServer(session);
  return updatedList;
}

export async function fetchAndMergeSessions(rawPhone: string): Promise<SupportChatSession[]> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) return [];
  const local = getLocalSessionsForPhone(phone);

  try {
    const res = await fetch(`/api/v1/support/sessions?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) return local;
    const data = await res.json();
    const remote: SupportChatSession[] = Array.isArray(data?.sessions) ? data.sessions : [];

    const byId = new Map<string, SupportChatSession>();
    for (const s of local) {
      byId.set(s.id, s);
    }
    for (const r of remote) {
      const existing = byId.get(r.id);
      if (!existing) {
        byId.set(r.id, r);
      } else {
        const remoteMsgs = r.messages?.length || 0;
        const localMsgs = existing.messages?.length || 0;
        const remoteTime = new Date(r.updatedAt || 0).getTime();
        const localTime = new Date(existing.updatedAt || 0).getTime();
        if (remoteMsgs > localMsgs || (remoteMsgs === localMsgs && remoteTime >= localTime)) {
          byId.set(r.id, r);
        }
      }
    }

    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    writeLocalSessionsForPhone(phone, merged);

    for (const l of local) {
      if (!remote.some((r) => r.id === l.id) && (l.messages?.length || 0) > 1) {
        void syncSessionToServer(l);
      }
    }

    return merged;
  } catch {
    return local;
  }
}

export async function clearSessionsForPhone(rawPhone: string): Promise<void> {
  const phone = normalizeIranianPhone(rawPhone);
  if (!isValidIranianPhone(phone)) return;
  try {
    const map = readAllLocalSessionsMap();
    delete map[phone];
    localStorage.setItem(SUPPORT_SESSIONS_STORAGE_KEY, JSON.stringify(map));
    emitSupportUpdated(phone);
  } catch {}
  try {
    await fetch(`/api/v1/support/sessions?phone=${encodeURIComponent(phone)}`, {
      method: 'DELETE',
    });
  } catch {}
}

function nowMeta() {
  const now = new Date();
  return {
    nowIso: now.toISOString(),
    timeStr: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function matchSlashCommand(text: string): SlashCommandDef | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('/')) return null;
  const firstToken = trimmed.split(/\s+/)[0].toLowerCase();
  return (
    SLASH_COMMANDS.find((cmd) =>
      cmd.aliases.some((alias) => alias.toLowerCase() === firstToken)
    ) || null
  );
}

function extractCleanPreferredName(raw: string): {
  ok: boolean;
  name: string;
  reason?: string;
} {
  let cleaned = stripChatMarkdown(raw)
    .replace(/^(سلام|درود|عرض ادب)[،,.\s!]+/i, '')
    .replace(/^(منو|من را|اسم من|اسمم|نام من|نامم|به من|لطفاً منو|لطفا منو)\s+/i, '')
    .replace(/\s+(صدا کن|صدام کن|صدا بزن|صدام بزن|صدا کنید|هستم|هست|بگو|بگید)[.!،,\s]*$/i, '')
    .replace(/["«»'()!?.،؛:]/g, '')
    .trim();

  if (!cleaned || cleaned.startsWith('/')) {
    return {
      ok: false,
      name: '',
      reason: 'متوجه اسمتون نشدم؛ لطفاً یک اسم کوتاه که دوست دارید باهاش صداتون کنم بنویسید.',
    };
  }

  const check = validateSafePreferredName(cleaned);
  if (!check.ok) {
    return {
      ok: false,
      name: '',
      reason: check.reason,
    };
  }

  return { ok: true, name: check.cleaned };
}

export interface BotTurnResult {
  updatedSession: SupportChatSession;
  triggeredNewSession?: boolean;
  clearedHistory?: boolean;
  errorMessage?: string;
}

export async function processConversationalTurn(
  session: SupportChatSession,
  rawInput: string,
  products: CanonicalProduct[] = []
): Promise<BotTurnResult> {
  const text = rawInput.trim();
  if (!text) {
    return { updatedSession: session };
  }

  const { nowIso, timeStr } = nowMeta();
  const phone = normalizeIranianPhone(session.phone);
  const cachedAccount = getCachedCustomerAccount(phone);
  const effectivePreferredName = (
    session.customerName ||
    cachedAccount?.preferredName ||
    ''
  ).trim();

  // 1. Handle /جدید (Create fresh session using known preferredName)
  const matchedCmd = matchSlashCommand(text);
  if (matchedCmd?.actionType === 'NEW') {
    const fresh = createFreshSession(phone, cachedAccount || effectivePreferredName);
    return { updatedSession: fresh, triggeredNewSession: true };
  }

  const userMessage: SupportChatMessage = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    sender: 'user',
    text,
    timestamp: timeStr,
    createdAt: nowIso,
  };

  // 2. Onboarding Preferred Name Step -> Offer SMS OTP Permanent Account or 1-Year Guest Retention
  if (!matchedCmd && session.flowState?.flow === 'ONBOARD_NAME') {
    const nameResult = extractCleanPreferredName(text);
    if (!nameResult.ok || !nameResult.name) {
      const retryBotMessage: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text:
          nameResult.reason ||
          'متوجه اسمتون نشدم؛ لطفاً یک اسم کوتاه که دوست دارید باهاش صداتون کنم بنویسید.',
        timestamp: timeStr,
        createdAt: nowIso,
        flowTag: 'moderation-guard',
      };
      return {
        updatedSession: {
          ...session,
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, retryBotMessage],
        },
      };
    }

    const cleanName = nameResult.name;
    const updatedAccount = await updateCustomerPreferredName(phone, cleanName);
    const alreadyVerified = Boolean(updatedAccount?.isVerified || cachedAccount?.isVerified);

    if (alreadyVerified) {
      const onboardedBotMessage: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `خوشبختم ${cleanName} عزیز! اسمتون توی حساب کاربری تاییدشده‌ی شما (نام کاربری: ${toPersianDigits(
          phone
        )}) ثبت شد.\nچطور می‌تونم کمکتون کنم؟ هر سؤالی دارید بپرسید یا با تایپ «/» لیست درخواست‌ها رو باز کنید.`,
        timestamp: timeStr,
        createdAt: nowIso,
      };

      return {
        updatedSession: {
          ...session,
          customerName: cleanName,
          flowState: { flow: null, step: 0, data: {} },
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, onboardedBotMessage],
        },
      };
    }

    const expiryDateFa = formatPersianDate(updatedAccount?.expiresAt || cachedAccount?.expiresAt);
    const offerOtpMessage: SupportChatMessage = {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `خوشبختم ${cleanName} عزیز! نام کاربری شما همین شماره موبایلتون (${toPersianDigits(
        phone
      )}) در نظر گرفته شده.\nاگر مایلید همین الان یک کد تایید پیامکی براتون ارسال بشه تا حساب کاربری دائمی براتون ساخته بشه، کافیه بنویسید «بله / کد بفرست».\nاگر هم الان نمی‌خواهید، هیچ مشکلی نیست؛ اطلاعات شماره و اسم شما تا یک سال (تا ${expiryDateFa}) با امنیت کامل محفوظ می‌مونه.`,
      timestamp: timeStr,
      createdAt: nowIso,
    };

    return {
      updatedSession: {
        ...session,
        customerName: cleanName,
        flowState: { flow: 'OFFER_OTP_ACCOUNT', step: 1, data: {} },
        updatedAt: nowIso,
        messages: [...session.messages, userMessage, offerOtpMessage],
      },
    };
  }

  // 2.5 Optional SMS OTP Account Creation Offer
  if (!matchedCmd && session.flowState?.flow === 'OFFER_OTP_ACCOUNT') {
    const lower = stripChatMarkdown(text).trim().toLowerCase();
    const wantsOtp =
      /^(بله|آره|اره|اوکی|باشه|حتما|حتماً|ok|yes)$/i.test(lower) ||
      /(بفرست|ارسال|کد تایید|کد رو|کدو|تایید پیامکی|بساز|حساب بساز|می‌خوام|میخوام)/.test(lower);
    const declinesOtp =
      /^(نه|خیر|no)$/i.test(lower) ||
      /(نمی‌خوام|نمیخوام|لازم نیست|بی‌خیال|بیخیال|بعدا|بعداً|فعلا نه|فعلاً نه|مهمان|نگهدار)/.test(
        lower
      );

    if (wantsOtp && !declinesOtp) {
      const otpRes = await requestOtpCode(phone);
      if (otpRes.ok) {
        const askCodeMsg: SupportChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `کد تایید پیامکی به شماره ${toPersianDigits(
            phone
          )} ارسال شد. لطفاً کد ۶ رقمی دریافتی رو بنویسید تا حسابتون تایید و دائمی بشه (برای انصراف کافیه بنویسید «انصراف»).`,
          timestamp: timeStr,
          createdAt: nowIso,
        };
        return {
          updatedSession: {
            ...session,
            flowState: { flow: 'OTP_VERIFY', step: 1, data: {} },
            updatedAt: nowIso,
            messages: [...session.messages, userMessage, askCodeMsg],
          },
        };
      }

      const retained = await optOutToOneYearGuest(phone);
      const expiryDateFa = formatPersianDate(retained?.expiresAt || cachedAccount?.expiresAt);
      const unavailableMsg: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text:
          otpRes.code === 'SMS_PROVIDER_NOT_CONFIGURED'
            ? `در حال حاضر درگاه ارسال پیامک سایت از پنل مدیریت متصل نشده؛ اما نگران نباشید! نام کاربری (${toPersianDigits(
                phone
              )}) و اسم شما تا یک سال (تا ${expiryDateFa}) با امنیت کامل محفوظ می‌مونه.\nچطور می‌تونم کمکتون کنم؟`
            : `${otpRes.error || 'ارسال پیامک در این لحظه انجام نشد.'}\nاطلاعات شماره و اسم شما تا یک سال (تا ${expiryDateFa}) محفوظ می‌مونه و هر زمان خواستید می‌تونید از پنل کاربری تاییدش کنید. چطور می‌تونم کمکتون کنم؟`,
        timestamp: timeStr,
        createdAt: nowIso,
      };
      return {
        updatedSession: {
          ...session,
          flowState: { flow: null, step: 0, data: {} },
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, unavailableMsg],
        },
      };
    }

    if (declinesOtp) {
      const retained = await optOutToOneYearGuest(phone);
      const expiryDateFa = formatPersianDate(retained?.expiresAt || cachedAccount?.expiresAt);
      const guestConfirmedMsg: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `باشه ${
          effectivePreferredName || 'دوست'
        } عزیز، هیچ مشکلی نیست! اطلاعات شماره موبایل (${toPersianDigits(
          phone
        )}) و اسمتون تا یک سال (تا ${expiryDateFa}) محفوظ می‌مونه و هر زمان مایل بودید می‌تونید از بخش مشخصات پنل کاربری با پیامک دائمی‌اش کنید.\nالان چطور می‌تونم کمکتون کنم؟`,
        timestamp: timeStr,
        createdAt: nowIso,
      };
      return {
        updatedSession: {
          ...session,
          flowState: { flow: null, step: 0, data: {} },
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, guestConfirmedMsg],
        },
      };
    }

    // If user immediately asks another question instead of answering OTP prompt, keep 1-year retention non-blockingly and continue to Gemini!
    void optOutToOneYearGuest(phone);
  }

  // 2.6 SMS OTP Verification Step
  if (!matchedCmd && session.flowState?.flow === 'OTP_VERIFY') {
    const cleanLower = stripChatMarkdown(text).trim().toLowerCase();
    if (/^(انصراف|لغو|نه|خیر|بیخیال|بی‌خیال|بعدا|بعداً)/.test(cleanLower)) {
      const retained = await optOutToOneYearGuest(phone);
      const expiryDateFa = formatPersianDate(retained?.expiresAt || cachedAccount?.expiresAt);
      const cancelMsg: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `تایید پیامکی متوقف شد؛ اطلاعات شماره و اسمتون تا یک سال (تا ${expiryDateFa}) محفوظ می‌مونه. چطور می‌تونم کمکتون کنم؟`,
        timestamp: timeStr,
        createdAt: nowIso,
      };
      return {
        updatedSession: {
          ...session,
          flowState: { flow: null, step: 0, data: {} },
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, cancelMsg],
        },
      };
    }

    if (/(ارسال مجدد|دوباره بفرست|کد نیومد)/.test(cleanLower)) {
      const resend = await requestOtpCode(phone);
      const resendMsg: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: resend.ok
          ? `کد تایید جدید به شماره ${toPersianDigits(phone)} ارسال شد. لطفاً کد را بنویسید:`
          : resend.error || 'ارسال مجدد کد انجام نشد. کمی بعد دوباره امتحان کنید.',
        timestamp: timeStr,
        createdAt: nowIso,
      };
      return {
        updatedSession: {
          ...session,
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, resendMsg],
        },
      };
    }

    const codeDigits = normalizeDigits(text).replace(/\D/g, '');
    if (/^\d{4,8}$/.test(codeDigits)) {
      const verifyRes = await verifyOtpCode(phone, codeDigits);
      if (verifyRes.ok) {
        const verifiedMsg: SupportChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `عالیه ${
            effectivePreferredName || 'دوست'
          } عزیز! حساب کاربری شما با نام کاربری ${toPersianDigits(
            phone
          )} با موفقیت تایید و دائمی شد.\nحالا چطور می‌تونم کمکتون کنم؟ می‌تونید سؤالتون رو بپرسید یا با «/» لیست درخواست‌ها رو باز کنید.`,
          timestamp: timeStr,
          createdAt: nowIso,
        };
        return {
          updatedSession: {
            ...session,
            flowState: { flow: null, step: 0, data: {} },
            updatedAt: nowIso,
            messages: [...session.messages, userMessage, verifiedMsg],
          },
        };
      }

      const wrongCodeMsg: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `${verifyRes.error || 'کد واردشده نادرست یا منقضی است.'} لطفاً دوباره کد رو بنویسید یا برای انصراف عبارت «انصراف» رو بفرستید.`,
        timestamp: timeStr,
        createdAt: nowIso,
      };
      return {
        updatedSession: {
          ...session,
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, wrongCodeMsg],
        },
      };
    }

    // If user typed something unrelated while in OTP_VERIFY, remind or let slash commands escape
    if (text.length > 15 && !/\d{4,8}/.test(normalizeDigits(text))) {
      void optOutToOneYearGuest(phone);
    } else {
      const askDigitsMsg: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: 'لطفاً کد ۶ رقمی پیامک‌شده را به عدد وارد کنید (یا برای ادامه بدون تایید پیامکی بنویسید «انصراف»).',
        timestamp: timeStr,
        createdAt: nowIso,
      };
      return {
        updatedSession: {
          ...session,
          updatedAt: nowIso,
          messages: [...session.messages, userMessage, askDigitsMsg],
        },
      };
    }
  }

  // 3. Privacy Command & Confirmation Flow (/حریم)
  if (matchedCmd?.actionType === 'PRIVACY') {
    const privacyMsg: SupportChatMessage = {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `گفتگوهای حساب کاربری شما با شماره ${toPersianDigits(
        phone
      )} با استانداردهای امنیتی محافظت و ذخیره می‌شن و توی «پنل کاربری > چت‌ها و تاریخچه پشتیبانی» هم در دسترس هستن.\nاگر می‌خواهید تمام تاریخچه گفتگوهای قبلی این شماره پاک بشه، عبارت «تاریخچه را پاک کن» رو بنویسید.`,
      timestamp: timeStr,
      createdAt: nowIso,
      flowTag: '/حریم',
    };
    return {
      updatedSession: {
        ...session,
        title:
          session.title === 'گفتگوی جدید پشتیبانی' ? 'مدیریت حریم خصوصی گفتگو' : session.title,
        flowState: { flow: 'PRIVACY', step: 1, data: {} },
        updatedAt: nowIso,
        messages: [...session.messages, userMessage, privacyMsg],
      },
    };
  }

  if (!matchedCmd && session.flowState?.flow === 'PRIVACY') {
    if (text.includes('پاک') || text.includes('حذف') || text.trim() === 'بله') {
      await clearSessionsForPhone(phone);
      const fresh = createFreshSession(phone, cachedAccount || effectivePreferredName);
      fresh.messages.push({
        id: `bot_cleared_${Date.now()}`,
        sender: 'bot',
        text: 'تاریخچه گفتگوهای قبلی این شماره به‌صورت کامل از سرور و حافظه محلی پاکسازی شد.',
        timestamp: timeStr,
        createdAt: nowIso,
      });
      return { updatedSession: fresh, clearedHistory: true };
    }
  }

  // 3.5 Client-side profanity/abuse guard for normal chat turns (also enforced on server)
  if (containsProfanityOrAbuse(text)) {
    const boundaryBotMessage: SupportChatMessage = {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: 'لطفاً در گفتگو از الفاظ محترمانه و مناسب استفاده کنید تا بتونم با کمال میل راهنماییتون کنم.',
      timestamp: timeStr,
      createdAt: nowIso,
      flowTag: 'moderation-guard',
    };
    return {
      updatedSession: {
        ...session,
        updatedAt: nowIso,
        messages: [...session.messages, userMessage, boundaryBotMessage],
      },
    };
  }

  // 4. All Conversational Requests & Slash Commands -> Real Gemini 4 Hydrogen Backend Grounded in SQLite
  const resolvedIntent = matchedCmd
    ? matchedCmd.command
    : session.flowState?.data?.activeIntent ||
      (session.flowState?.flow &&
      session.flowState.flow !== 'PRIVACY' &&
      session.flowState.flow !== 'OFFER_OTP_ACCOUNT' &&
      session.flowState.flow !== 'OTP_VERIFY'
        ? session.flowState.flow
        : null);

  let nextTitle = session.title;
  if (!nextTitle || nextTitle === 'گفتگوی جدید پشتیبانی' || nextTitle === 'گفتگوی پشتیبانی') {
    nextTitle = matchedCmd ? matchedCmd.label : text.slice(0, 42);
  }

  const chatHistoryPayload = session.messages.slice(-14).map((m) => ({
    sender: m.sender,
    text: stripChatMarkdown(m.text),
  }));

  try {
    const res = await fetch('/api/v1/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        phone,
        preferredName: effectivePreferredName,
        chatHistory: chatHistoryPayload,
        activeIntent: resolvedIntent,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        updatedSession: session,
        errorMessage:
          data?.error ||
          'پاسخ‌گویی هوشمند موقتاً در دسترس نیست. لطفاً تنظیمات کلید سرویس را بررسی کرده و دوباره تلاش کنید.',
      };
    }

    const cleanReply = stripChatMarkdown(data.reply || 'بفرمایید، در خدمتم.');

    let matchedOrder: SupportOrderCard | undefined;
    if (data.order) {
      matchedOrder = {
        orderNumber: data.order.orderNumber || data.order.id,
        trackingCode: data.order.trackingCode || data.order.trackingNumber || 'در انتظار ثبت',
        status: data.order.status,
        customerName: data.order.customerName,
        totalAmount: data.order.totalAmount,
        createdAt: data.order.createdAt,
      };
    }

    let recommendedProducts: SupportRecommendedCard[] | undefined;
    if (Array.isArray(data.recommendedProducts) && data.recommendedProducts.length > 0) {
      recommendedProducts = data.recommendedProducts.map((p: any) => {
        const localMatch = products.find((lp) => lp.id === p.id);
        return {
          productId: p.id,
          title: p.title || localMatch?.title || 'محصول فروشگاه گُردیه',
          price: Number(p.retailPrice || localMatch?.retailPrice || 0),
          image: p.image || p.images?.[0] || localMatch?.image,
          matchReason:
            typeof p.category === 'string' ? `دسته ${p.category} • موجود و آماده ارسال` : 'موجود و آماده ارسال',
        };
      });
    } else if (data.matchedProduct) {
      recommendedProducts = [
        {
          productId: data.matchedProduct.id,
          title: data.matchedProduct.title,
          price: Number(data.matchedProduct.retailPrice || 0),
          image: data.matchedProduct.image || data.matchedProduct.images?.[0],
          matchReason: 'موجود و آماده ارسال',
        },
      ];
    }

    const nextFlowType: SupportFlowType = matchedCmd ? matchedCmd.actionType : null;

    if (
      data.suggestedSessionTitle &&
      (session.title === 'گفتگوی جدید پشتیبانی' || session.title === 'گفتگوی پشتیبانی')
    ) {
      nextTitle = stripChatMarkdown(data.suggestedSessionTitle).slice(0, 48);
    }

    const botMessage: SupportChatMessage = {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: cleanReply,
      timestamp: timeStr,
      createdAt: nowIso,
      flowTag: matchedCmd ? matchedCmd.command : undefined,
      orderCard: matchedOrder,
      recommendedProducts,
    };

    const nextStatus = data.operatorRequested ? 'OPERATOR_REQUESTED' : session.status;

    return {
      updatedSession: {
        ...session,
        customerName: effectivePreferredName || session.customerName,
        title: nextTitle,
        status: nextStatus,
        flowState: {
          flow: nextFlowType,
          step: 0,
          data: resolvedIntent ? { activeIntent: String(resolvedIntent) } : {},
        },
        updatedAt: nowIso,
        messages: [...session.messages, userMessage, botMessage],
      },
    };
  } catch {
    return {
      updatedSession: session,
      errorMessage: 'خطا در برقراری ارتباط با سرور پشتیبانی. لطفاً اتصال اینترنت را بررسی کنید.',
    };
  }
}
