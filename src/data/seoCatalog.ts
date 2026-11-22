/**
 * Single Source of Truth (SSOT) for SEO, Canonical URLs, Metadata & 301 Redirects
 * Synced with Gordiyeh Content & Tone Guide v3.0
 *
 * Rules:
 * 1. Only lowercase english, numbers, and hyphens. No trailing slashes.
 * 2. 25 Canonical URLs in sitemap (1 Home, 4 Categories, 11 Products, 1 Blog index, 3 Articles, 5 Static Pages).
 * 3. Real updatedAt timestamps for lastmod.
 */

export interface SeoProduct {
  id: string; // Internal database ID: prod_ported_*
  slug: string; // Canonical public slug
  title: string; // Full H1 on product page
  seoTitle?: string; // <= 60 chars SERP title
  description: string; // 120-155 chars Meta Description
  categorySlug: 'digital' | 'smart-home' | 'travel-camping' | 'beauty-health';
  categoryTitleFa: string;
  sku: string;
  brand: string;
  brandFa: string;
  image: string;
  retailPriceToman: number; // Toman for UI display
  retailPriceRial: number; // Rial for schema.org (Toman * 10)
  updatedAt: string; // ISO 8601
}

export interface SeoCategory {
  slug: 'digital' | 'smart-home' | 'travel-camping' | 'beauty-health';
  title: string;
  description: string;
  h1: string;
  updatedAt: string;
}

export interface SeoArticle {
  slug: string;
  oldSlugs: string[];
  title: string;
  seoTitle: string;
  description: string;
  author: string;
  coverImage: string;
  updatedAt: string;
  connectedProductId: string;
}

export interface SeoStaticPage {
  slug: 'about-us' | 'terms' | 'faq' | 'contact' | 'privacy';
  title: string;
  description: string;
  h1: string;
  updatedAt: string;
}

export const SEO_PRODUCTS: SeoProduct[] = [
  {
    id: 'prod_ported_projector',
    slug: 'portable-smart-projector',
    title: 'ویدئو پروژکتور پرتابل هوشمند مگ‌کیوبیک؛ وای‌فای، اندروید ۱۱ و اسپیکر داخلی',
    seoTitle: 'ویدئو پروژکتور پرتابل مگ‌کیوبیک با اندروید ۱۱ | گُردیه',
    description: 'پروژکتور پرتابل مگ‌کیوبیک با وای‌فای، بلوتوث و اسپیکر استریو؛ تصویر ۴۰ تا ۱۳۰ اینچ بدون رایانه. ببینید برای چه کسی مناسبه.',
    categorySlug: 'digital',
    categoryTitleFa: 'کالای دیجیتال',
    sku: 'PRJ-PORT-MINI-02',
    brand: 'Magcubic',
    brandFa: 'مگ‌کیوبیک',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 4250000,
    retailPriceRial: 42500000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_g_lamp',
    slug: 'g-lamp-smart-speaker',
    title: 'اسپیکر بلوتوث و چراغ چندکاره G-Lamp با شارژر بی‌سیم و رقص نور',
    seoTitle: 'اسپیکر بلوتوث و چراغ G-Lamp با شارژر بی‌سیم | گُردیه',
    description: 'G-Lamp اسپیکر بلوتوث، شارژر بی‌سیم ۱۵ وات، رقص نور ۲۵۶ رنگ، رادیو FM و ساعت زنگ‌دار رو توی یه دستگاه برای میز و اتاق خواب جمع کرده.',
    categorySlug: 'digital',
    categoryTitleFa: 'کالای دیجیتال',
    sku: 'LMP-GLAMP-RGB-05',
    brand: 'Gordiyeh Audio',
    brandFa: 'گُردیه',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 890000,
    retailPriceRial: 8900000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_shaker',
    slug: 'mini-shaker-blender',
    title: 'مینی شیکر و مخلوط‌کن شارژی پرتابل ۶ تیغه فولادی ضدزنگ',
    seoTitle: 'مینی شیکر شارژی ۶ تیغه فولادی ضدزنگ | گُردیه',
    description: 'مینی شیکر شارژی با ۶ تیغه فولادی SUS304، باتری لیتیومی و شارژ Type-C برای پروتئین و اسموتی در باشگاه، محل کار و سفر. ببینید برای چه کسی مناسبه.',
    categorySlug: 'smart-home',
    categoryTitleFa: 'لوازم خانگی هوشمند',
    sku: 'SHK-USB-PORT-01',
    brand: 'FreshJuice',
    brandFa: 'فرش جوس',
    image: 'https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 580000,
    retailPriceRial: 5800000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_massage',
    slug: 'massage-gun',
    title: 'ماساژور تفنگی ضربه‌ای بوستر با سرهای تعویض‌پذیر و موتور براشلس',
    seoTitle: 'ماساژور تفنگی بوستر با سرهای تعویض‌پذیر | گُردیه',
    description: 'ماساژور تفنگی بوستر با موتور براشلس، چند سرعت و سرهای قابل تعویض برای کم کردن سفتی عضله بعد از ورزش یا کار طولانی؛ ابزار درمانی نیست.',
    categorySlug: 'beauty-health',
    categoryTitleFa: 'زیبایی و سلامت',
    sku: 'MSG-GUN-PRO-01',
    brand: 'Booster',
    brandFa: 'بوستر',
    image: '/assets/products/massage-gun.webp',
    retailPriceToman: 1250000,
    retailPriceRial: 12500000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_action_cam',
    slug: '4k-action-camera',
    title: 'دوربین ورزشی اکشن اکن 4K با کیس ضدآب و نمایشگر دوطرفه',
    seoTitle: 'دوربین ورزشی اکن 4K با کیس ضدآب و نمایشگر دوطرفه | گُردیه',
    description: 'دوربین اکشن اکن 4K با زاویه ۱۷۰ درجه، وای‌فای، نمایشگر دوطرفه و کیس ضدآب تا ۳۰ متر برای ضبط سفر، رانندگی و ورزش‌های آبی.',
    categorySlug: 'digital',
    categoryTitleFa: 'کالای دیجیتال',
    sku: 'CAM-ACT-4K-03',
    brand: 'Eken',
    brandFa: 'اکن',
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 2450000,
    retailPriceRial: 24500000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_robot_vacuum',
    slug: 'robot-vacuum',
    title: 'جارو رباتیک هوشمند کلین‌بات با تی‌کشی و حسگر تشخیص مانع',
    seoTitle: 'جارو رباتیک هوشمند کلین‌بات با تی‌کشی | گُردیه',
    description: 'جارو رباتیک کلین‌بات با تی‌کشی، حسگر مانع و حسگر ضدسقوط برای نظافت روزانه‌ی کف خونه و دفتر. ببینید برای چه کسی مناسبه و برای چه کسی نیست.',
    categorySlug: 'smart-home',
    categoryTitleFa: 'لوازم خانگی هوشمند',
    sku: 'VAC-ROBOT-XIA-04',
    brand: 'CleanBot',
    brandFa: 'کلین‌بات',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 14850000,
    retailPriceRial: 148500000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_astronaut_lamp',
    slug: 'astronaut-galaxy-lamp',
    title: 'پروژکتور و چراغ خواب کهکشانی طرح فضانورد با کنترل از راه دور',
    seoTitle: 'چراغ خواب کهکشانی فضانورد با ریموت | گُردیه',
    description: 'پروژکتور و چراغ خواب کهکشانی طرح فضانورد با ریموت، سر مغناطیسی ۳۶۰ درجه و تایمر خاموشی برای اتاق خواب. محدودیت‌هاش رو هم نوشتیم.',
    categorySlug: 'smart-home',
    categoryTitleFa: 'لوازم خانگی هوشمند',
    sku: 'LMP-ASTRO-GALAXY-06',
    brand: 'Starry Sky',
    brandFa: 'استاری اسکای',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 940000,
    retailPriceRial: 9400000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_minipresso',
    slug: 'minipresso-portable-espresso',
    title: 'اسپرسوساز همراه و پرتابل پیستونی واکاکو بدون نیاز به برق و باتری',
    seoTitle: 'اسپرسوساز همراه واکاکو مینی‌پرسو بدون برق | گُردیه',
    description: 'مینی‌پرسو واکاکو، اسپرسوساز دستی و پیستونی بدون نیاز به برق یا باتری، مناسب سفر، کمپ و ماشین. ببینید برای چه کسی مناسبه و برای چه کسی نیست.',
    categorySlug: 'travel-camping',
    categoryTitleFa: 'سفر و کمپینگ',
    sku: 'CMP-MINIPRESSO-08',
    brand: 'Wacaco',
    brandFa: 'واکاکو',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 2850000,
    retailPriceRial: 28500000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_microderm',
    slug: 'microderm-blackhead-remover',
    title: 'دستگاه میکرودرم این‌فیس با ۳ سطح مکش برای پاکسازی منافذ پوست صورت',
    seoTitle: 'دستگاه میکرودرم این‌فیس با ۳ سطح مکش | گُردیه',
    description: 'میکرودرم این‌فیس با ۳ سطح مکش و ۴ سر مجزا برای پاکسازی سطحی منافذ و جوش‌های سرسیاه. ابزار درمانی نیست؛ موارد احتیاط رو پیش از خرید بخونید.',
    categorySlug: 'beauty-health',
    categoryTitleFa: 'زیبایی و سلامت',
    sku: 'BEA-MICRODERM-07',
    brand: 'InFace',
    brandFa: 'این‌فیس',
    image: '/assets/products/microderm.webp',
    retailPriceToman: 490000,
    retailPriceRial: 4900000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_air_mattress',
    slug: 'car-air-mattress',
    title: 'تشک بادی سفری صندلی عقب خودرو با ۲ بالش بادی و پمپ فندکی',
    seoTitle: 'تشک بادی صندلی عقب خودرو با پمپ فندکی | گُردیه',
    description: 'تشک بادی تراول‌رست برای صندلی عقب خودرو با ۲ بالش بادی و پمپ فندکی؛ برای استراحت در سفرهای طولانی جاده‌ای. ببینید محدودیت‌هاش چیه.',
    categorySlug: 'travel-camping',
    categoryTitleFa: 'سفر و کمپینگ',
    sku: 'CMP-MATTRESS-1001-09',
    brand: 'TravelRest',
    brandFa: 'تراول‌رست',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 1180000,
    retailPriceRial: 11800000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    id: 'prod_ported_tsco_gamepad',
    slug: 'tsco-wireless-gamepad',
    title: 'دسته بازی بی‌سیم شوک‌دار تسکو سازگار با کامپیوتر و گوشی',
    seoTitle: 'دسته بازی بی‌سیم تسکو برای کامپیوتر و گوشی | گُردیه',
    description: 'دسته بازی بی‌سیم تسکو با دو موتور لرزش، باتری شارژی و اتصال به کامپیوتر و گوشی. پیش از خرید سازگاری بازی‌تون رو چک کنید.',
    categorySlug: 'digital',
    categoryTitleFa: 'کالای دیجیتال',
    sku: 'GAM-TSCO-TG140W-10',
    brand: 'TSCO',
    brandFa: 'تسکو',
    image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=600&auto=format&fit=crop&q=75&fm=webp',
    retailPriceToman: 780000,
    retailPriceRial: 7800000,
    updatedAt: '2026-11-13T12:00:00Z',
  },
];

export const SEO_CATEGORIES: SeoCategory[] = [
  {
    slug: 'digital',
    title: 'کالای دیجیتال: پروژکتور، دوربین ورزشی و گیم‌پد | گُردیه',
    description: 'پروژکتور پرتابل، دوربین اکشن و دسته بازی بی‌سیم با توضیح صادقانه برای هر محصول. شرایط تست هر کدوم توی صفحه‌ی خودش نوشته شده.',
    h1: 'کالای دیجیتال',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'smart-home',
    title: 'لوازم خانگی هوشمند: شیکر، جارو رباتیک و چراغ خواب | گُردیه',
    description: 'مینی شیکر شارژی، جارو رباتیک و چراغ خواب کهکشانی برای کارهای روزمره‌ی خونه. برای هر محصول می‌نویسیم به چه کاری نمی‌خوره.',
    h1: 'لوازم خانگی هوشمند',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'travel-camping',
    title: 'تجهیزات سفر و کمپینگ: مینی‌پرسو و تشک بادی خودرو | گُردیه',
    description: 'اسپرسوساز همراه بدون برق و تشک بادی صندلی عقب خودرو برای سفر و کمپ، با توضیح روشن درباره‌ی کاربرد و محدودیت هر کدوم از دستگاه‌ها.',
    h1: 'سفر و کمپینگ',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'beauty-health',
    title: 'زیبایی و سلامت: میکرودرم و ماساژور تفنگی | گُردیه',
    description: 'میکرودرم برای پاکسازی سطحی منافذ و ماساژور تفنگی برای سفتی عضله بعد از ورزش. ابزار مراقبت روزمره‌ن، نه درمان؛ موارد احتیاط رو بخونید.',
    h1: 'زیبایی و سلامت',
    updatedAt: '2026-11-13T12:00:00Z',
  },
];

export const SEO_ARTICLES: SeoArticle[] = [
  {
    slug: 'how-to-choose-a-real-mini-projector',
    oldSlugs: ['mechanical-keyboard-buying-guide'],
    title: 'راهنمای خرید مینی پروژکتور: لومن واقعی (ANSI) چیه و چقدر لازمه؟',
    seoTitle: 'لومن واقعی (ANSI) پروژکتور چیه و چقدر لازمه؟ | گُردیه',
    description: 'چرا عددهای روی جعبه‌ی پروژکتورها با هم مقایسه نمی‌شن و برای اتاق تاریک یا نیمه‌روشن واقعاً چند ANSI لومن لازمه.',
    author: 'تیم گُردیه',
    coverImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=75&fm=webp',
    updatedAt: '2026-11-13T12:00:00Z',
    connectedProductId: 'prod_ported_projector',
  },
  {
    slug: 'smart-lighting-and-desk-setup',
    oldSlugs: ['anc-headphones-noise-cancelling-science'],
    title: 'میز کار مرتب‌تر: چطور کابل‌ها رو کم کنیم و نور و صدا رو جمع کنیم؟',
    seoTitle: 'میز کار مرتب‌تر: کابل کمتر، نور و صدا توی یه جا | گُردیه',
    description: 'چطور با یه پد شارژ بی‌سیم و انتخاب درست نور کار و نور شب، کابل‌های روی میز رو کم کنید و کی دستگاه چندکاره براتون لازم نیست.',
    author: 'تیم گُردیه',
    coverImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=75&fm=webp',
    updatedAt: '2026-11-13T12:00:00Z',
    connectedProductId: 'prod_ported_g_lamp',
  },
  {
    slug: 'fast-charging-battery-health-myths',
    oldSlugs: [],
    title: 'باورهای غلط درباره باتری گجت‌های شارژی: چی واقعاً عمرش رو کم می‌کنه؟',
    seoTitle: 'باورهای غلط درباره باتری گجت‌های شارژی | گُردیه',
    description: 'چرا باتری لیتیوم‌یون حافظه نداره، چرا نباید تا صفر خالیش کرد و گرما چه بلایی سر عمر باتری گجت‌های شارژی می‌آره.',
    author: 'تیم گُردیه',
    coverImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=75&fm=webp',
    updatedAt: '2026-11-13T12:00:00Z',
    connectedProductId: 'prod_ported_shaker',
  },
];

export const SEO_STATIC_PAGES: SeoStaticPage[] = [
  {
    slug: 'about-us',
    title: 'درباره گُردیه | فروشگاه گجت‌های کاربردی با توضیح صادقانه',
    description: 'فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه؛ با توضیح صادقانه برای هر محصول و اعلام محدودیت‌ها قبل از خرید.',
    h1: 'درباره گُردیه',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'terms',
    title: 'قوانین و شرایط خرید | تست و تعویض گُردیه',
    description: 'مهلت و شرایط تست هر محصول جدا نوشته شده. جزئیات ارسال، پرداخت شاپرکی و انصراف پیش از ارسال رو اینجا بخونید.',
    h1: 'قوانین و شرایط خرید',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'faq',
    title: 'پرسش‌های متداول گُردیه | ارسال، تست و پرداخت',
    description: 'جواب کوتاه به رایج‌ترین سؤال‌ها درباره زمان تحویل سفارش، شرایط تست و تعویض، پروژکتور و تماس با پشتیبانی گُردیه.',
    h1: 'پرسش‌های متداول',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'contact',
    title: 'تماس با پشتیبانی گُردیه | تلفن، ایمیل و شبکه‌های اجتماعی',
    description: 'راه‌های ارتباط با پشتیبانی گُردیه برای سؤال قبل از خرید، پیگیری سفارش و مشکل بعد از تحویل با تلفن و ایمیل.',
    h1: 'تماس با ما',
    updatedAt: '2026-11-13T12:00:00Z',
  },
  {
    slug: 'privacy',
    title: 'حریم خصوصی و امنیت اطلاعات کاربران | گُردیه',
    description: 'فقط اطلاعات لازم برای ارسال رو نگه می‌داریم، ردیاب تبلیغاتی نداریم و اطلاعات تماس و نشانی شما رو به کسی نمی‌دیم.',
    h1: 'حریم خصوصی و امنیت اطلاعات',
    updatedAt: '2026-11-13T12:00:00Z',
  },
];

// Lookup Maps for high-performance resolution
export const PRODUCT_BY_SLUG = new Map<string, SeoProduct>(
  SEO_PRODUCTS.map((p) => [p.slug, p])
);

export const PRODUCT_BY_ID = new Map<string, SeoProduct>(
  SEO_PRODUCTS.map((p) => [p.id, p])
);

export const CATEGORY_BY_SLUG = new Map<string, SeoCategory>(
  SEO_CATEGORIES.map((c) => [c.slug, c])
);

export const ARTICLE_BY_SLUG = new Map<string, SeoArticle>(
  SEO_ARTICLES.map((a) => [a.slug, a])
);

export const STATIC_PAGE_BY_SLUG = new Map<string, SeoStaticPage>(
  SEO_STATIC_PAGES.map((p) => [p.slug, p])
);

/**
 * 301 Redirect Resolver
 * Resolves any legacy or non-canonical URL to its canonical destination.
 * Returns canonical path (e.g. "/product/mini-shaker-blender") or null if no redirect needed.
 */
export function resolve301Redirect(urlPath: string): string | null {
  let raw = urlPath.split('?')[0].split('#')[0];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {}

  let clean = decoded.trim();
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  const lower = clean.toLowerCase();

  const exactMap: Record<string, string> = {
    '/digital': '/category/digital',
    '/smart': '/category/smart-home',
    '/travel': '/category/travel-camping',
    '/health': '/category/beauty-health',
    '/about': '/page/about-us',
    '/terms': '/page/terms',
    '/help': '/page/faq',
    '/pro-beam': '/product/portable-smart-projector',
    '/g-lamp': '/product/g-lamp-smart-speaker',
    '/auto-shaker': '/product/mini-shaker-blender',
    '/massage-gun': '/product/massage-gun',
    '/blog/mechanical-keyboard-buying-guide': '/blog/how-to-choose-a-real-mini-projector',
    '/blog/anc-headphones-noise-cancelling-science': '/blog/smart-lighting-and-desk-setup',
  };

  if (exactMap[lower]) {
    return exactMap[lower];
  }

  for (const art of SEO_ARTICLES) {
    for (const old of art.oldSlugs) {
      if (lower === `/blog/${old}`) {
        return `/blog/${art.slug}`;
      }
    }
  }

  if (lower.startsWith('/product/')) {
    const segment = lower.replace('/product/', '');
    for (const prod of SEO_PRODUCTS) {
      if (segment === prod.id || segment.startsWith(`${prod.id}-`) || segment.startsWith(`${prod.id}_`)) {
        return `/product/${prod.slug}`;
      }
    }
  }

  if (raw !== lower) {
    return lower;
  }

  return null;
}
