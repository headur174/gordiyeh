/**
 * GORDIYEH DESIGN & ROUTING CONSTITUTION (کیت نظام‌نامه طراحی و آدرس‌دهی گُردیه)
 * 
 * این فایل مرجع تغییرناپذیر هویت بصری، قوانین لینک‌دهی تخت (Flat URLs)،
 * و رفتار دوگانه (اینترنت عادی در برابر قطع سراسری و شرایط بحران) است.
 * هر کامپوننت، صفحه، یا سرویس جدیدی که به پروژه اضافه می‌شود الزماً باید از این کیت پیروی کند.
 */

export const GORDIYEH_BRAND = {
  nameFa: "گُردیه",
  nameEn: "GORDIYEH",
  sloganFa: "گجت‌های روزمره؛ بررسی صادقانه، انتخاب مطمئن",
  sloganEn: "Everyday Gadgets with Honest Specs & Reliable Choice",
  logoAsset: "/assets/gordiyeh-logo-emblem.webp?v=7",
  supportAvatarAsset: "/assets/gordiyeh-support-emblem-v3.webp?v=2",
} as const;

/**
 * پالت یکپارچه فراست گُردیه (Organic Botanical Forest Design System)
 * شامل دو حالت روشن فراست (Warm Alabaster & Forest Green) و تیره فراست (Deep Charcoal Forest & Emerald)
 */
export const GORDIYEH_FOREST_PALETTE = {
  light: {
    bgMain: '#F3EDE0',
    bgCard: '#E8E0CD',
    bgSurface: '#FFFFFF',
    bgSubtle: '#EFE9DA',
    bgCardHover: '#DFD5BE',
    bgGlass: 'rgba(243, 237, 224, 0.88)',
    textMain: '#182B22',
    textSecondary: '#34473E',
    textMuted: '#58685F',
    accentPrimary: '#1E4635',
    accentSecondary: '#2D6A4F',
    accentText: '#1E4635',
    accentGlow: '#2D6A4F',
    borderColor: 'rgba(24, 43, 34, 0.22)',
    borderActive: 'rgba(30, 70, 53, 0.56)',
    shadowGlow: '0 10px 28px rgba(24, 43, 34, 0.12)',
    badgeBg: '#D7E2CE',
  },
  dark: {
    bgMain: '#09120E',
    bgCard: '#111E18',
    bgSurface: '#182A22',
    bgSubtle: '#14241D',
    bgCardHover: '#21392E',
    bgGlass: 'rgba(9, 18, 14, 0.86)',
    textMain: '#F2EFE7',
    textSecondary: '#CFDCD4',
    textMuted: '#9EB6A9',
    accentPrimary: '#1F7A54',
    accentSecondary: '#2A9D6F',
    accentText: '#6EE7B7',
    accentGlow: '#34D399',
    borderColor: 'rgba(110, 231, 183, 0.22)',
    borderActive: 'rgba(52, 211, 153, 0.62)',
    shadowGlow: '0 12px 34px rgba(16, 185, 129, 0.22)',
    badgeBg: 'rgba(16, 185, 129, 0.18)',
  },
} as const;

/**
 * مقیاس تایپوگرافی استاندارد گُردیه (برگرفته و شخصی‌سازی‌شده برای خوانایی فارسی تجارت الکترونیک)
 * مبتنی بر سه وزن اصیل ۴۰۰ (عادی)، ۵۰۰ (مدیوم) و ۷۰۰ (بولد) با نسبت ارتفاع خط ۱.۳۵ تا ۱.۸
 */
export const GORDIYEH_TYPOGRAPHY = {
  fontFamily: "'Vazirmatn', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  scale: {
    display: { size: 'clamp(1.375rem, 2.2vw, 2rem)', lineHeight: '1.4', weight: 700 },
    h1: { size: '1.25rem', lineHeight: '1.5', weight: 700 },       // 20px / 30px
    h2: { size: '1.125rem', lineHeight: '1.5', weight: 700 },      // 18px / 27px
    h3: { size: '1rem', lineHeight: '1.65', weight: 700 },         // 16px / 26.4px
    body: { size: '0.875rem', lineHeight: '1.8', weight: 400 },    // 14px / 25.2px
    bodyStrong: { size: '0.875rem', lineHeight: '1.8', weight: 700 },
    caption: { size: '0.75rem', lineHeight: '1.8', weight: 400 },  // 12px / 21.6px
    label: { size: '0.75rem', lineHeight: '1.4', weight: 500 },    // 12px / 16.8px
    micro: { size: '0.6875rem', lineHeight: '1.45', weight: 500 }, // 11px / 16px
  },
} as const;

/**
 * پالت متغیرهای رنگی فعال فراست (Forest Core Tokens)
 */
export const GORDIYEH_PALETTE = {
  // پس‌زمینه اصلی (Deep Charcoal Forest / Warm Alabaster via CSS var)
  bgPrimary: "#09120E",

  // سطوح کارت‌ها، فرم‌ها و سایدبار (Forest Card)
  surface: "#111E18",

  // خطوط جداکننده و حاشیه‌های فراست
  archBorder: "#1F7A54",

  // متن‌های ثانویه و برچسب‌های اطلاعاتی
  textMuted: "#A8BFB3",

  // تیترها، ارقام قیمت و متن اصلی
  textPrimary: "#F2EFE7",

  // وضعیت‌های سیستمی
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#1F7A54",
  }
} as const;

/**
 * مشخصات و هندسه موتیف طاق دکمه پشتیبانی گُردیه (Support Widget Motif)
 */
export const GORDIYEH_ARCH_MOTIF = {
  cardRadius: "rounded-t-[75px] rounded-b-none",
  innerRadius: "rounded-t-[70px] rounded-b-none",
  heroRadius: "rounded-2xl",
  buttonRadius: "rounded-full",
  borderStyle: "border border-[var(--border-color)] hover:border-[var(--border-active)] transition-colors",
  watermarkOpacity: "opacity-[0.06]",
} as const;

/**
 * قانون آدرس‌دهی تخت گوگل (Google Flat-URL Architecture)
 * قانون ۱: تمامی آدرس‌ها انگلیسی، حداکثر ۱ تا ۲ کلمه‌ای و مستقیماً روی ریشه هستند.
 * قانون ۲: هیچ پیشوند تکراری (category, product, page, blog, account, admin) مجاز نیست.
 */
/**
 * استانداردهای ساختار نهایی آدرس‌ها (Standard Canonical URL Architecture)
 * فقط حروف کوچک انگلیسی، عدد و خط تیره، بدون اسلش پایانی
 */
export const GORDIYEH_ROUTES = {
  // هسته فروشگاه
  home: "/",
  search: "/search",
  compare: "/compare",
  cart: "/cart",
  checkout: "/checkout",
  receipt: "/receipt",
  offline: "/offline", // پرتال شرایط قطعی سراسری اینترنت

  // ۴ دسته اصلی
  categories: {
    digital: "/category/digital",
    smartHome: "/category/smart-home",
    travelCamping: "/category/travel-camping",
    beautyHealth: "/category/beauty-health",
  },

  // محصولات شاخص با اسلاگ جدید
  products: {
    projector: "/product/portable-smart-projector",
    gLamp: "/product/g-lamp-smart-speaker",
    shaker: "/product/mini-shaker-blender",
    massageGun: "/product/massage-gun",
    actionCam: "/product/4k-action-camera",
    robotVacuum: "/product/robot-vacuum",
    astronautLamp: "/product/astronaut-galaxy-lamp",
    minipresso: "/product/minipresso-portable-espresso",
    microderm: "/product/microderm-blackhead-remover",
    airMattress: "/product/car-air-mattress",
    gamepad: "/product/tsco-wireless-gamepad",
  },

  // مجله تخصصی
  blog: {
    index: "/blog",
    projectorGuide: "/blog/how-to-choose-a-real-mini-projector",
    smartLighting: "/blog/smart-lighting-and-desk-setup",
    batteryHealth: "/blog/fast-charging-battery-health-myths",
  },

  // صفحات عمومی اعتماد و مانیفست
  pages: {
    aboutUs: "/page/about-us",
    terms: "/page/terms",
    faq: "/page/faq",
    contact: "/page/contact",
    privacy: "/page/privacy",
    licenses: "/page/licenses",
  },

  // پرتال مشتریان
  login: "/login",
  orders: "/orders",
  invoice: "/invoice",
  privacyHub: "/privacy-hub",

  // پنل عملیات و نظارت ادمین
  ops: {
    admin: "/admin",
    tasks: "/tasks",
    inventory: "/inventory",
    rules: "/rules",
  }
} as const;

/**
 * متد تبدیل شناسه کالا یا اسلاگ به آدرس استاندارد کنونیکال
 */
export function toCanonicalProductUrl(idOrSlug: string): string {
  const dictionary: Record<string, string> = {
    "prod_ported_projector": "portable-smart-projector",
    "pro-beam": "portable-smart-projector",
    "portable-smart-projector": "portable-smart-projector",

    "prod_ported_g_lamp": "g-lamp-smart-speaker",
    "g-lamp": "g-lamp-smart-speaker",
    "g-lamp-smart-speaker": "g-lamp-smart-speaker",

    "prod_ported_shaker": "mini-shaker-blender",
    "auto-shaker": "mini-shaker-blender",
    "mini-shaker-blender": "mini-shaker-blender",

    "prod_ported_massage": "massage-gun",
    "massage-gun": "massage-gun",

    "prod_ported_action_cam": "4k-action-camera",
    "4k-action-camera": "4k-action-camera",

    "prod_ported_robot_vacuum": "robot-vacuum",
    "robot-vacuum": "robot-vacuum",

    "prod_ported_astronaut_lamp": "astronaut-galaxy-lamp",
    "astronaut-galaxy-lamp": "astronaut-galaxy-lamp",

    "prod_ported_minipresso": "minipresso-portable-espresso",
    "minipresso-portable-espresso": "minipresso-portable-espresso",

    "prod_ported_microderm": "microderm-blackhead-remover",
    "microderm-blackhead-remover": "microderm-blackhead-remover",

    "prod_ported_air_mattress": "car-air-mattress",
    "car-air-mattress": "car-air-mattress",

    "prod_ported_tsco_gamepad": "tsco-wireless-gamepad",
    "tsco-wireless-gamepad": "tsco-wireless-gamepad",
  };

  const key = idOrSlug.toLowerCase().trim();
  if (dictionary[key]) {
    return `/product/${dictionary[key]}`;
  }

  return `/product/${key}`;
}

