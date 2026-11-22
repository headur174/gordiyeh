export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  plaque?: string;
  unit?: string;
  isDefault?: boolean;
}

export interface StoreFeatureSettings {
  enableNationalId: boolean;
  requireNationalId: boolean;
  enableEmail: boolean;
  enablePostalCode: boolean;
  requirePostalCode: boolean;
  smsConfigured?: boolean;
  smsProvider?: string;
  paymentConfigured?: boolean;
  paymentProvider?: string;
}

export const DEFAULT_STORE_FEATURE_SETTINGS: StoreFeatureSettings = {
  enableNationalId: true,
  requireNationalId: false,
  enableEmail: true,
  enablePostalCode: true,
  requirePostalCode: true,
  smsConfigured: false,
  smsProvider: 'smsir',
  paymentConfigured: false,
  paymentProvider: 'zarinpal',
};

export const IRANIAN_PROVINCES = [
  'تهران',
  'البرز',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'آذربایجان شرقی',
  'مازندران',
  'گیلان',
  'خوزستان',
  'قم',
  'یزد',
  'کرمان',
  'قزوین',
  'همدان',
  'کرمانشاه',
  'گلستان',
  'سمنان',
  'زنجان',
  'مرکزی',
  'اردبیل',
  'آذربایجان غربی',
  'بوشهر',
  'هرمزگان',
  'لرستان',
  'چهارمحال و بختیاری',
  'کردستان',
  'سیستان و بلوچستان',
  'خراسان شمالی',
  'خراسان جنوبی',
  'کهگیلویه و بویراحمد',
  'ایلام',
];

export function normalizeDigits(raw: string | number): string {
  return String(raw ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

export function normalizeIranianPhoneStrict(raw: string): string {
  let digits = normalizeDigits(raw).replace(/[\s\-().]/g, '');
  if (digits.startsWith('0098')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('+98')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('98') && digits.length === 12) digits = '0' + digits.slice(2);
  else if (/^9\d{9}$/.test(digits)) digits = '0' + digits;
  return digits;
}

export function isValidIranianPhoneStrict(raw: string): boolean {
  return /^09\d{9}$/.test(normalizeIranianPhoneStrict(raw));
}

/**
 * Official Iranian National ID (کد ملی) 10-digit Modulo-11 checksum validator
 */
export function isValidIranianNationalId(raw: string): boolean {
  const code = normalizeDigits(raw).replace(/[\s\-]/g, '');
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;

  const check = Number(code[9]);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(code[i]) * (10 - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/**
 * Iranian 10-digit Postal Code (کد پستی ۱۰ رقمی) validator
 */
export function isValidIranianPostalCode(raw: string): boolean {
  const code = normalizeDigits(raw).replace(/[\s\-]/g, '');
  if (!/^\d{10}$/.test(code)) return false;
  if (/^(\d)\1{9}$/.test(code)) return false;
  if (code.startsWith('0') || code.startsWith('2')) return false;
  return true;
}

/**
 * Strict Email format & TLD validator
 */
export function isValidEmail(raw: string): boolean {
  const email = normalizeDigits(raw).trim().toLowerCase();
  if (!email || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  return (
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      email
    ) &&
    !email.includes('..') &&
    /\.[a-z]{2,}$/i.test(email)
  );
}

/**
 * Normalize Persian/Arabic characters, zero-width spaces, diacritics, and punctuation tricks
 */
export function normalizeModerationText(raw: string): string {
  return String(raw || '')
    .toLowerCase()
    .replace(/[\u200B-\u200F\u202A-\u202E\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[يئى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/[@$*_.~\-]/g, '');
}

// Persian & English profanity, insults, slurs & prompt-injection signatures
const PROFANITY_ROOTS = [
  'کیر',
  'کسکش',
  'کص',
  'جنده',
  'مادرجنده',
  'خارکسه',
  'خارکسده',
  'کونی',
  'گوه',
  'عنتر',
  'عوضی',
  'حرومزاده',
  'حرامزاده',
  'پدرسگ',
  'بیناموس',
  'بیشرف',
  'دیوث',
  'لاشی',
  'احمق',
  'کثافت',
  'آشغال',
  'اشغال',
  'سگصفت',
  'تخم سگ',
  'مادرسگ',
  'ننه جنده',
  'قرمساق',
  'پوفیوز',
  'الدنگ',
  'شاشیدم',
  'ریدم',
  'بگا',
  'بگای',
  'بگام',
  'سیکتیر',
  'سگتور',
  'کله خر',
  'گاو',
  'نفهم',
  'اسکل',
  'اسگل',
  'دلقک',
  'fuck',
  'fuk',
  'bitch',
  'shit',
  'asshole',
  'dick',
  'pussy',
  'whore',
  'slut',
  'bastard',
  'motherfucker',
  'cunt',
  'faggot',
];

// Standalone abusive words that shouldn't false-match substrings inside polite words
const EXACT_ABUSIVE_TOKENS = new Set([
  'خر',
  'سگ',
  'عن',
  'شاش',
  'ریدن',
  'کون',
  'جق',
  'بمولا',
  'wtf',
  'stfu',
  'fck',
  'kys',
]);

// Reserved impersonation / system / prompt-injection patterns
const RESERVED_NAME_PATTERNS = [
  'ادمین',
  'مدیر',
  'مدیریت',
  'پشتیبان',
  'پشتیبانی',
  'اپراتور',
  'سیستم',
  'گرداننده',
  'گردیه',
  'صاحب سایت',
  'پلیس',
  'فتا',
  'شاپرک',
  'زرین پال',
  'admin',
  'administrator',
  'moderator',
  'support',
  'operator',
  'system',
  'root',
  'gordiyeh',
];

const INJECTION_SIGNATURES = [
  '<script',
  '</script',
  'javascript:',
  'onerror=',
  'onload=',
  'ignore previous instructions',
  'ignore all instructions',
  'system prompt',
  'you are now',
  'jailbreak',
  'drop table',
  'union select',
];

export function containsProfanityOrAbuse(raw: string): boolean {
  const input = String(raw || '').trim();
  if (!input) return false;

  const compact = normalizeModerationText(input).replace(/\s+/g, '');
  const spaced = normalizeModerationText(input).replace(/[^a-z0-9\u0600-\u06FF\s]/g, ' ');
  const tokens = spaced.split(/\s+/).filter(Boolean);

  for (const sig of INJECTION_SIGNATURES) {
    if (input.toLowerCase().includes(sig)) return true;
  }

  for (const root of PROFANITY_ROOTS) {
    const normRoot = normalizeModerationText(root).replace(/\s+/g, '');
    if (compact.includes(normRoot)) return true;
  }

  for (const token of tokens) {
    if (EXACT_ABUSIVE_TOKENS.has(token)) return true;
  }

  return false;
}

export function validateSafePreferredName(raw: string): {
  ok: boolean;
  cleaned: string;
  reason?: string;
} {
  const rawStr = String(raw || '').trim();
  if (/[<>{}[\]]/.test(rawStr) || containsProfanityOrAbuse(rawStr)) {
    return {
      ok: false,
      cleaned: '',
      reason: 'این عبارت محترمانه یا مجاز نیست و به‌عنوان نام ثبت نمی‌شود. لطفاً یک اسم مناسب بنویسید.',
    };
  }

  const cleaned = rawStr
    .replace(/[\r\n\t]+/g, ' ')
    .trim();

  if (cleaned.length < 2 || cleaned.length > 40) {
    return {
      ok: false,
      cleaned: '',
      reason: 'نام انتخابی باید بین ۲ تا ۴۰ حرف باشد.',
    };
  }

  if (/https?:\/\/|www\./i.test(cleaned)) {
    return {
      ok: false,
      cleaned: '',
      reason: 'استفاده از لینک یا آدرس وب به‌عنوان نام مجاز نیست.',
    };
  }

  if (/\d{4,}/.test(normalizeDigits(cleaned))) {
    return {
      ok: false,
      cleaned: '',
      reason: 'لطفاً به‌جای عدد طولانی، یک اسم واقعی یا محترمانه بنویسید.',
    };
  }

  if (containsProfanityOrAbuse(cleaned)) {
    return {
      ok: false,
      cleaned: '',
      reason: 'این عبارت محترمانه نیست و به‌عنوان نام ثبت نمی‌شود. لطفاً یک اسم مناسب بنویسید.',
    };
  }

  const compact = normalizeModerationText(cleaned).replace(/\s+/g, '');
  for (const reserved of RESERVED_NAME_PATTERNS) {
    const normRes = normalizeModerationText(reserved).replace(/\s+/g, '');
    if (compact === normRes || compact.includes(normRes)) {
      return {
        ok: false,
        cleaned: '',
        reason: 'استفاده از عنوان‌های سیستمی یا نام فروشگاه به‌عنوان نام کاربری مجاز نیست.',
      };
    }
  }

  return { ok: true, cleaned };
}

