// CMS and Visual Customizer Store for Commerce OS
// Synced with Gordiyeh Content & Tone Guide v3.0

export interface SiteConfig {
  announcementText: string;
  announcementEnabled: boolean;
  announcementBg: string;
  siteName: string;
  siteSlogan: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroBadge?: string;
  heroBannerUrl: string;
  promoBanner1: {
    title: string;
    subtitle: string;
    badge: string;
    tag?: string;
    imageUrl: string;
    linkUrl: string;
  };
  promoBanner2: {
    title: string;
    subtitle: string;
    badge: string;
    tag?: string;
    imageUrl: string;
    linkUrl: string;
  };
  contactPhone: string;
  contactAddress: string;
  contactEmail: string;
  instagramHandle: string;
  telegramHandle: string;
  eitaaHandle: string;
  footerAbout: string;
  storeName?: string;
  supportPhone?: string;
  supportHours?: string;
  supportEmail?: string;
  trustPillars?: Array<{ title: string; text: string; enabled: boolean }>;
  homepageSliders?: {
    showDiscounts: boolean;
    showNewest: boolean;
    showBestsellers: boolean;
    deduplicateMode?: 'auto' | 'manual';
    discountProductIds?: string[];
    newestProductIds?: string[];
    bestsellerProductIds?: string[];
  };
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  coverImage: string;
  publishedAt: string;
  date?: string;
  readingTimeMinutes: number;
  tags: string[];
  connectedProductId?: string;
  isAIGenerated: boolean;
  delegationMode: 'FULL_AI' | 'HYBRID_CUSTOM' | 'MANUAL';
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentHtml: string;
  content?: string;
  lastUpdated: string;
}

export interface CategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  introText?: string;
  selectionCriteria?: Array<{ title: string; question: string }>;
  icon: string;
  bannerUrl: string;
  itemCount: number;
  subcategories: string[];
  seoTitle: string;
  seoDescription: string;
}

export const INITIAL_SITE_CONFIG: SiteConfig = {
  announcementText: 'شرایط تست و تعویض هر محصول توی صفحه‌ی خودش نوشته شده؛ قبل از خرید می‌بینیدش.',
  announcementEnabled: true,
  announcementBg: 'from-[#0D1321] to-[#1D2D44]',
  siteName: 'گُردیه (GORDIYEH)',
  storeName: 'گُردیه',
  siteSlogan: 'فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه',
  heroHeadline: 'گجت‌هایی که یه کار روزمره رو راحت‌تر می‌کنن',
  heroSubheadline: 'برای هر محصول می‌گیم چه مشکلی رو حل می‌کنه، چه کاری از دستش برنمی‌آد و شرایط تست و تعویضش چیه.',
  heroBannerUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1600&q=80',
  promoBanner1: {
    title: 'سینمای خونگی روی دیوار و سقف',
    subtitle: 'پروژکتور مگ‌کیوبیک با وای‌فای و اندروید ۱۱ برای اتاق کم‌نور',
    badge: 'برای اتاق خواب و سفر',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    linkUrl: '/product/portable-smart-projector'
  },
  promoBanner2: {
    title: 'یه دستگاه به‌جای چند کابل روی میز',
    subtitle: 'G-Lamp با اسپیکر بلوتوث، شارژر بی‌سیم ۱۵ وات و ساعت دیجیتال',
    badge: 'برای میز کار و اتاق خواب',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    linkUrl: '/product/g-lamp-smart-speaker'
  },
  contactPhone: '۰۲۱-۸۸۲۹۹۰۴۰',
  contactAddress: '',
  contactEmail: 'support@gordiyeh.ir',
  supportHours: 'شنبه تا چهارشنبه ۹ تا ۱۹، پنج‌شنبه ۹ تا ۱۴',
  instagramHandle: '@gordiyeh_gadgets',
  telegramHandle: '@gordiyeh_gadgets',
  eitaaHandle: '@gordiyeh',
  footerAbout: 'گُردیه فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاهه. برای هر محصول می‌نویسیم چه مشکلی رو حل می‌کنه و چه کاری از دستش برنمی‌آد.',
  homepageSliders: {
    showDiscounts: true,
    showNewest: true,
    showBestsellers: false,
    deduplicateMode: 'auto',
    discountProductIds: [],
    newestProductIds: [],
    bestsellerProductIds: [],
  },
  trustPillars: [
    { title: 'ارسال با رهگیری', text: 'سفارش‌های تهران با پیک و بقیه‌ی شهرها با پست پیشتاز و کد رهگیری ارسال می‌شن.', enabled: true },
    { title: 'تست و تعویض شفاف', text: 'مهلت و شرایطش برای هر محصول جدا و توی صفحه‌ی خودش نوشته شده.', enabled: true },
    { title: 'توضیح صادقانه', text: 'برای هر محصول می‌نویسیم برای چه کسی مناسبه و برای چه کسی نیست.', enabled: true },
    { title: 'پرداخت و پشتیبانی', text: 'پرداخت از درگاه شاپرکی انجام می‌شه و برای راهنمایی می‌تونید با پشتیبانی تماس بگیرید.', enabled: true },
  ]
};

export const SITE_CONFIG_STORAGE_KEY = 'commerce_os_site_config';
export const SITE_CONFIG_UPDATED_EVENT = 'commerce_os_site_config_updated';

export function loadSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return INITIAL_SITE_CONFIG;
  try {
    const saved = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
    if (!saved) return INITIAL_SITE_CONFIG;
    const parsed = JSON.parse(saved);
    return {
      ...INITIAL_SITE_CONFIG,
      ...parsed,
      homepageSliders: {
        ...INITIAL_SITE_CONFIG.homepageSliders,
        ...(parsed.homepageSliders || {}),
      },
    };
  } catch {
    return INITIAL_SITE_CONFIG;
  }
}

export function saveSiteConfig(config: SiteConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(SITE_CONFIG_UPDATED_EVENT, { detail: config }));
  } catch {}
}

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post_1',
    slug: 'how-to-choose-a-real-mini-projector',
    title: 'راهنمای خرید مینی پروژکتور: لومن واقعی (ANSI) چیه و چقدر لازمه؟',
    excerpt: 'چرا عددهای روی جعبه‌ی پروژکتورها با هم مقایسه نمی‌شن و برای اتاق تاریک یا نیمه‌روشن واقعاً چند ANSI لومن لازمه.',
    content: `عدد لومن روی جعبه‌ی پروژکتورها همیشه یه چیز رو نمی‌سنجه. فقط ANSI لومن یه روش اندازه‌گیری استاندارد داره و مقایسه‌ی درست با همون انجام می‌شه. توی اتاق تاریک یا کم‌نور معمولاً از ۱۰۰ تا چند صد ANSI لومن کافیه؛ برای اتاق روشن‌تر باید سراغ مدل‌های خیلی پرنورتر رفت.`,
    author: 'تیم گُردیه',
    category: 'راهنمای خرید',
    coverImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    publishedAt: '۱۴۰۵/۰۸/۲۳',
    readingTimeMinutes: 4,
    tags: ['پروژکتور', 'لومن_ANSI', 'راهنمای_خرید'],
    connectedProductId: 'prod_ported_projector',
    isAIGenerated: false,
    delegationMode: 'MANUAL'
  },
  {
    id: 'post_2',
    slug: 'smart-lighting-and-desk-setup',
    title: 'میز کار مرتب‌تر: چطور کابل‌ها رو کم کنیم و نور و صدا رو جمع کنیم؟',
    excerpt: 'چطور با یه پد شارژ بی‌سیم و انتخاب درست نور کار و نور شب، کابل‌های روی میز رو کم کنید و کی دستگاه چندکاره براتون لازم نیست.',
    content: `میز شلوغ معمولاً از چند دستگاه جدا می‌آد: شارژر، اسپیکر و چراغ. اگه گوشی‌تون شارژ بی‌سیم داره، یه پد روی میز وصل و جدا کردن مداوم کابل رو حذف می‌کنه. نور رو هم با کار متناسب کنید: روشن و خنثی برای کار، ملایم برای شب.`,
    author: 'تیم گُردیه',
    category: 'بررسی کاربرد',
    coverImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    publishedAt: '۱۴۰۵/۰۸/۲۳',
    readingTimeMinutes: 3,
    tags: ['میز_کار', 'شارژ_بی‌سیم', 'نور_میز'],
    connectedProductId: 'prod_ported_g_lamp',
    isAIGenerated: false,
    delegationMode: 'MANUAL'
  },
  {
    id: 'post_3',
    slug: 'fast-charging-battery-health-myths',
    title: 'باورهای غلط درباره باتری گجت‌های شارژی: چی واقعاً عمرش رو کم می‌کنه؟',
    excerpt: 'چرا باتری لیتیوم‌یون حافظه نداره، چرا نباید تا صفر خالیش کرد و گرما چه بلایی سر عمر باتری گجت‌های شارژی می‌آره.',
    content: `باتری لیتیوم‌یون «حافظه» نداره و لازم نیست مرتب تا صفر خالی بشه. چیزی که عمرش رو بیشتر کم می‌کنه گرما و نگه‌داشتن توی شارژ کامله. این راهنما برای لیتیوم‌یون‌های رایجه؛ عمر واقعی هر دستگاه به ظرفیت و کیفیت سلول‌هاش بستگی داره و دفترچه‌ی همون دستگاه مقدمه.`,
    author: 'تیم گُردیه',
    category: 'آموزش و نگهداری',
    coverImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
    publishedAt: '۱۴۰۵/۰۸/۲۳',
    readingTimeMinutes: 4,
    tags: ['باتری', 'گجت_شارژی', 'نگهداری'],
    connectedProductId: 'prod_ported_shaker',
    isAIGenerated: false,
    delegationMode: 'MANUAL'
  }
];

export const INITIAL_STATIC_PAGES: StaticPage[] = [
  {
    id: 'page_about',
    slug: 'about-us',
    title: 'درباره گُردیه',
    summary: 'فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه؛ با توضیح صادقانه برای هر محصول.',
    lastUpdated: '۱۴۰۵/۰۸/۲۳',
    contentHtml: `توی بازار گجت، عدد و ادعای یه مدل از فروشگاهی به فروشگاه دیگه خیلی فرق می‌کنه و محدودیت‌ها کمتر گفته می‌شن. گُردیه رو با یه قول ساده شروع کردیم: چیزی ننویسیم که نتونیم پشتش بایستیم.

برای هر محصول سه چیز می‌نویسیم: چه مشکلی رو حل می‌کنه، به چه کسی کمک می‌کنه و برای چه کسی مناسب نیست. اگه عددی رو نتونیم نشون بدیم، نمی‌نویسیمش.

سه تعهد ما:
۱. توضیح صادقانه: هر محصول بخش «برای چه کسی نیست» داره.
۲. تست و تعویض شفاف: مهلت و شرایط هر محصول جدا نوشته می‌شه و قبل از خرید می‌بینیدش.
۳. حداقل اطلاعات: فقط چیزی رو نگه می‌داریم که برای ارسال لازمه و اطلاعات شما رو به شخص ثالث نمی‌دیم.

نام «گُردیه» از روایت‌های کهن ایرانی گرفته شده و یاد بانویی دلاور رو زنده نگه می‌داره؛ نشونه‌ی استواری و راستگویی که می‌خوایم توی انتخاب و معرفی کالا هم داشته باشیم.`
  },
  {
    id: 'page_terms',
    slug: 'terms',
    title: 'قوانین و شرایط خرید',
    summary: 'مهلت و شرایط تست هر محصول جدا نوشته شده. جزئیات ارسال، پرداخت و انصراف پایین اومده.',
    lastUpdated: '۱۴۰۵/۰۸/۲۳',
    contentHtml: `۱. تست و تعویض
مهلت و شرایط تست و تعویض هر محصول توی صفحه‌ی همون محصول نوشته شده. اگه توی اون مهلت نقص فنی پیدا شد، دستگاه با یه کالای نو و آکبند تعویض می‌شه. آسیب ناشی از ضربه‌ی شدید، سقوط در آب یا استفاده از آداپتور فست‌شارژ غیراستاندارد شامل تعویض نیست.

۲. ارسال
سفارش‌های تهران با هماهنگی قبلی و با پیک تحویل داده می‌شن. سفارش‌های شهرستان با پست پیشتاز و کد رهگیری الکترونیکی ارسال می‌شن. بسته‌بندی چندلایه و ضربه‌گیر داره.

۳. پرداخت
پرداخت از درگاه شاپرکی و با رمزنگاری TLS انجام می‌شه. اگه شبکه یا درگاه مشکل داشت، فیش کارت‌به‌کارت با نظارت اپراتور پشتیبانی ثبت می‌شه.

۴. انصراف قبل از ارسال
اگه قبل از خروج بسته از انبار منصرف بشید، کل مبلغ حداکثر ۲۴ ساعت کاری بعد به شماره‌ی شبای مبدأ برمی‌گرده.`
  },
  {
    id: 'page_faq',
    slug: 'faq',
    title: 'پرسش‌های متداول',
    summary: 'جواب کوتاه به رایج‌ترین سؤال‌ها درباره ارسال، تست و تعویض، پروژکتور و تماس با پشتیبانی.',
    lastUpdated: '۱۴۰۵/۰۸/۲۳',
    contentHtml: `سفارشم کی می‌رسه؟
سفارش‌های تهران اگه تا ساعت ۱۵ ثبت بشن، همون روز یا حداکثر روز کاری بعد تحویل داده می‌شن. بقیه‌ی شهرها ظرف ۲۴ ساعت کاری به پست پیشتاز تحویل می‌شن و معمولاً ۲ تا ۴ روز کاری بعد می‌رسن.

تست و تعویض چطوره؟
مهلت و شرایطش برای هر محصول فرق می‌کنه و توی صفحه‌ی همون محصول نوشته شده. تست، سلامت فنی دستگاه رو پوشش می‌ده: عملکرد موتور، شارژدهی باتری، وضوح تصویر پروژکتور، اتصال بلوتوث و وای‌فای و پد شارژ بی‌سیم. آسیب ناشی از ضربه‌ی شدید، سقوط در آب یا آداپتور فست‌شارژ غیراستاندارد شامل نمی‌شه.

پروژکتور به رایانه نیاز داره؟
نه. اندروید، وای‌فای و بلوتوث داخلشه. برنامه‌هایی مثل یوتیوب و فیلیمو رو مستقیم روی دستگاه اجرا می‌کنید یا صفحه‌ی گوشی رو بی‌سیم روی دیوار می‌اندازید.

اگه مشکل داشتم با کی تماس بگیرم؟
با شماره‌ی ۰۲۱-۸۸۲۹۹۰۴۰ تماس بگیرید یا به support@gordiyeh.ir پیام بدید.`
  },
  {
    id: 'page_contact',
    slug: 'contact',
    title: 'تماس با ما',
    summary: 'راه‌های ارتباط با پشتیبانی گُردیه برای سؤال قبل از خرید، پیگیری سفارش و مشکل بعد از تحویل.',
    lastUpdated: '۱۴۰۵/۰۸/۲۳',
    contentHtml: `سؤال قبل از خرید دارید، سفارشتون رو پیگیری می‌کنید یا بعد از تحویل مشکلی پیش اومده؟ از این راه‌ها پیام بدید:

• تلفن: ۰۲۱-۸۸۲۹۹۰۴۰ (شنبه تا چهارشنبه ۹ تا ۱۹، پنج‌شنبه ۹ تا ۱۴)
• ایمیل: support@gordiyeh.ir
• شبکه‌های اجتماعی: اینستاگرام و تلگرام @gordiyeh_gadgets | ایتا @gordiyeh`
  },
  {
    id: 'page_privacy',
    slug: 'privacy',
    title: 'حریم خصوصی و امنیت اطلاعات',
    summary: 'فقط اطلاعات لازم برای ارسال رو نگه می‌داریم، ردیاب تبلیغاتی نداریم و اطلاعات شما رو به کسی نمی‌دیم.',
    lastUpdated: '۱۴۰۵/۰۸/۲۳',
    contentHtml: `۱. بدون ردیابی تبلیغاتی
از اسکریپت یا پیکسل ردیاب شخص ثالث استفاده نمی‌کنیم و رفتار شما رو توی سایت‌های دیگه دنبال نمی‌کنیم.

۲. نشست‌های ورود
توکن‌های ورود تاریخ انقضا دارن و با خروج از حساب باطل می‌شن.

۳. حداقل اطلاعات
فقط نام گیرنده، شماره‌ی تماس برای هماهنگی ارسال و نشانی پستی رو نگه می‌داریم.

۴. بدون اشتراک‌گذاری
اطلاعات و شماره‌ی تماس شما به شرکت‌های بازاریابی، سامانه‌های پیامک تبلیغاتی یا هیچ شخص ثالثی داده نمی‌شه.

۵. پرداخت
پرداخت مستقیم توی درگاه شاپرکی انجام می‌شه. ما رمز دوم، CVV2 و شماره‌ی کارت شما رو دریافت یا ذخیره نمی‌کنیم.

۶. حذف سوابق
هر زمان بخواید می‌تونید از تنظیمات حساب یا با تماس با پشتیبانی، درخواست حذف آدرس و شماره‌های تماستون رو ثبت کنید.`
  }
];

export const INITIAL_CATEGORIES: CategoryDetail[] = [
  {
    id: 'cat_digital',
    name: 'کالای دیجیتال',
    slug: 'digital',
    description: 'فیلم رو روی دیوار ببینید، سفرتون رو ضبط کنید یا با دسته بازی کنید.',
    icon: 'Laptop',
    bannerUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
    itemCount: 4,
    subcategories: ['پروژکتور هوشمند', 'دوربین ورزشی', 'چراغ هوشمند چندکاره', 'دسته بازی بی‌سیم'],
    seoTitle: 'کالای دیجیتال: پروژکتور، دوربین ورزشی و گیم‌پد | گُردیه',
    seoDescription: 'پروژکتور پرتابل، دوربین اکشن و دسته بازی بی‌سیم با توضیح صادقانه برای هر محصول. شرایط تست هر کدوم توی صفحه‌ی خودش نوشته شده.',
    introText: 'می‌خواید فیلم رو روی دیوار ببینید، سفرتون رو ضبط کنید یا با گوشی و کامپیوتر بازی کنید؟ این دسته گجت‌هایی داره که هر کدوم یه کار مشخص رو راحت‌تر می‌کنه. زیر هر محصول نوشتیم برای چه کسی مناسبه و برای چه کسی نیست، پس لازم نیست از روی ظاهر انتخاب کنید.',
    selectionCriteria: [
      { title: 'اتصال', question: 'دستگاه با گوشی یا کامپیوتر شما سازگاره؟' },
      { title: 'محل استفاده', question: 'داخل خونه، بیرون یا توی آب؟' },
      { title: 'باتری و شارژ', question: 'با چه پورتی شارژ می‌شه و با یک شارژ چقدر کار می‌کنه؟' },
    ]
  },
  {
    id: 'cat_smart_home',
    name: 'لوازم خانگی هوشمند',
    slug: 'smart-home',
    description: 'نظافت، اسموتی و نور شبانه با دستگاه‌های کوچیک.',
    icon: 'Sparkles',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    itemCount: 3,
    subcategories: ['شیکر و بلندر شارژی', 'جارو رباتیک هوشمند', 'چراغ خواب کهکشانی'],
    seoTitle: 'لوازم خانگی هوشمند: شیکر، جارو رباتیک و چراغ خواب | گُردیه',
    seoDescription: 'مینی شیکر شارژی، جارو رباتیک و چراغ خواب کهکشانی برای کارهای روزمره‌ی خونه. برای هر محصول می‌نویسیم به چه کاری نمی‌خوره.',
    introText: 'نظافت کف، آماده کردن اسموتی یا ساختن فضای آروم برای خواب، کارهایی‌ان که هر روز تکرار می‌شن. این دسته دستگاه‌های کوچیکی داره که هر کدوم یکی از این کارها رو سبک‌تر می‌کنه. توضیح هر محصول می‌گه به چه کاری می‌آد و به چه کاری نمی‌خوره.',
    selectionCriteria: [
      { title: 'اندازه و جای نگه‌داری', question: 'توی خونه‌ی شما جا می‌گیره؟' },
      { title: 'منبع انرژی', question: 'برق مستقیم یا باتری؟' },
      { title: 'شستن و نگه‌داری', question: 'چه بخش‌هایی رو باید مرتب تمیز کنید؟' },
    ]
  },
  {
    id: 'cat_travel',
    name: 'سفر و کمپینگ',
    slug: 'travel-camping',
    description: 'قهوه‌ی بدون برق و تشک بادی صندلی عقب ماشین.',
    icon: 'Coffee',
    bannerUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    itemCount: 2,
    subcategories: ['اسپرسوساز همراه', 'تشک بادی خودرو'],
    seoTitle: 'تجهیزات سفر و کمپینگ: مینی‌پرسو و تشک بادی خودرو | گُردیه',
    seoDescription: 'اسپرسوساز همراه بدون برق و تشک بادی صندلی عقب خودرو برای سفر و کمپ، با توضیح روشن درباره‌ی کاربرد و محدودیت هر کدوم از دستگاه‌ها.',
    introText: 'توی سفر و جاده، پریز و تخت راحت همیشه دم دست نیست. اسپرسوساز همراه بدون برق کار می‌کنه و تشک بادی، صندلی عقب ماشین رو به جای استراحت تبدیل می‌کنه. هر دو رو با توضیح صادقانه معرفی کردیم.',
    selectionCriteria: [
      { title: 'منبع انرژی', question: 'بدون برق یا با فندکی خودرو؟' },
      { title: 'حجم و وزن', question: 'توی ساک یا صندوق عقب جا می‌شه؟' },
      { title: 'زمان آماده‌سازی', question: 'از لحظه‌ی بیرون آوردن تا استفاده چقدر طول می‌کشه؟' },
    ]
  },
  {
    id: 'cat_beauty',
    name: 'زیبایی و سلامت',
    slug: 'beauty-health',
    description: 'پاکسازی سطحی منافذ و ماساژ عضله؛ مراقبت روزمره، نه درمان.',
    icon: 'Heart',
    bannerUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    itemCount: 2,
    subcategories: ['دستگاه میکرودرم خانگی', 'ماساژورهای عضلانی'],
    seoTitle: 'زیبایی و سلامت: میکرودرم و ماساژور تفنگی | گُردیه',
    seoDescription: 'میکرودرم برای پاکسازی سطحی منافذ و ماساژور تفنگی برای سفتی عضله بعد از ورزش. ابزار مراقبت روزمره‌ن، نه درمان؛ موارد احتیاط رو بخونید.',
    introText: 'این دستگاه‌ها برای مراقبت روزمره‌ن، نه درمان. میکرودرم برای پاکسازی سطحی منافذ و ماساژور تفنگی برای کم کردن سفتی عضله بعد از ورزش یا کار طولانی. اگه بیماری پوستی یا عضلانی دارید، قبل از استفاده با پزشک مشورت کنید.',
    selectionCriteria: [
      { title: 'تنظیم شدت', question: 'می‌تونید قدرت رو خودتون کم و زیاد کنید؟' },
      { title: 'سرهای قابل تعویض', question: 'تمیز کردن و تعویضشون چقدر راحته؟' },
      { title: 'دفترچه‌ی ایمنی', question: 'موارد منع مصرف توش نوشته شده؟' },
    ]
  }
];
