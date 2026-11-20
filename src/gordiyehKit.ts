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
  logoAsset: "/assets/gordiyeh-logo-emblem.png",
} as const;

/**
 * پالت بنفش آینده‌نگر گُردیه (Futuristic Violet Design System)
 * شامل دو حالت Violet Dark و Violet Light
 */
export const GORDIYEH_VIOLET_PALETTE = {
  dark: {
    bgMain: '#0D0B18',
    bgCard: '#17132A',
    bgCardHover: '#231C3D',
    bgGlass: 'rgba(23, 19, 42, 0.75)',
    textMain: '#F5F3FF',
    textMuted: '#A78BFA',
    accentPrimary: '#8B5CF6',
    accentSecondary: '#EC4899',
    accentGlow: '#A855F7',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderActive: 'rgba(139, 92, 246, 0.5)',
    shadowGlow: '0 0 25px rgba(139, 92, 246, 0.25)',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
  },
  light: {
    bgMain: '#F5F3FF',
    bgCard: '#FFFFFF',
    bgCardHover: '#EDE9FE',
    bgGlass: 'rgba(255, 255, 255, 0.85)',
    textMain: '#1E1B4B',
    textMuted: '#6B21A8',
    accentPrimary: '#7C3AED',
    accentSecondary: '#DB2777',
    accentGlow: '#9333EA',
    borderColor: 'rgba(124, 58, 237, 0.15)',
    borderActive: 'rgba(124, 58, 237, 0.45)',
    shadowGlow: '0 10px 30px rgba(124, 58, 237, 0.12)',
    badgeBg: 'rgba(124, 58, 237, 0.08)',
  }
} as const;

/**
 * پالت رنگی کلاسیک شماره ۹ (Obsidian Navy)
 */
export const GORDIYEH_PALETTE = {
  // پس‌زمینه اصلی (Obsidian Slate 950)
  bgPrimary: "#0D1321",
  
  // سطوح کارت‌ها، فرم‌ها و سایدبار (Deep Navy / Petroleum)
  surface: "#1D2D44",
  
  // خطوط جداکننده، حاشیه‌ها و کانتور طاق معمارگونه (Steel Arch Blue)
  archBorder: "#3E5C76",
  
  // متن‌های ثانویه و برچسب‌های اطلاعاتی (Titanium Mist)
  textMuted: "#748CAB",
  
  // تیترها، ارقام قیمت و دکمه‌های کنشی شاخص (Warm Parchment / Ivory)
  textPrimary: "#F0EBD8",

  // وضعیت‌های سیستمی
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#38BDF8",
  }
} as const;

/**
 * مشخصات و هندسه موتیف طاق گُردیه (The Portal Arch Motif)
 */
export const GORDIYEH_ARCH_MOTIF = {
  // شعاع انحنای گوشه‌ی بالای کارت‌ها و استیج‌ها مطابق الگوی ۷۵ پیکسل
  cardRadius: "rounded-t-[75px] rounded-b-none",
  innerRadius: "rounded-t-[70px] rounded-b-none",
  heroRadius: "rounded-t-[75px] rounded-b-none",
  buttonRadius: "rounded-none",
  
  // ضخامت کانتور دوخطی متالیک
  borderStyle: "border-[1.5px] border-[var(--text-main)]/40 hover:border-[var(--text-main)]/80 transition-colors",
  
  // واترمارک محو پس‌زمینه
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

