// =============================================================================
// دستورالعمل محتوایی گُردیه (نسخه ۱٫۰) — الگوی تولیدی متن‌های سایت و ابزار پایش
// =============================================================================

import { ContentBlock } from '../types/cms';

export interface ProductInfoCard {
  nameAndModel: string;
  brand: string;
  categorySlug: 'digital' | 'smart-home' | 'travel-camping' | 'beauty-health';
  priceToman?: string;
  warranty?: string;
  testWindow?: string;
  testCovered?: string;
  testNotCovered?: string;
  confirmedSpecs: string;
  usageSituations: string;
  limitationsAndNotSuitableFor: string;
  safetyWarnings?: string;
  ourTestNotes?: string;
}

export interface BannedWordRule {
  word: string;
  category: 'تبلیغاتی و اغراق' | 'کتابی و اداری' | 'خیابانی' | 'ادعای بی‌سند یا پزشکی';
  suggestion: string;
}

export interface ContentTypeTemplate {
  kind: 'product' | 'category' | 'article' | 'about' | 'terms' | 'microcopy' | 'support';
  title: string;
  description: string;
  structureSteps: string[];
  starterBlocks?: ContentBlock[];
}

export interface BuyerQuestionGroup {
  categorySlug: 'digital' | 'smart-home' | 'travel-camping' | 'beauty-health';
  categoryNameFa: string;
  questions: string[];
}

export interface LintCheckItem {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

export interface GordiyehLintReport {
  score: number;
  passedCount: number;
  totalCount: number;
  bannedHits: Array<{ word: string; category: string; suggestion: string }>;
  arabicCharsFound: string[];
  exclamationCount: number;
  emojiCount: number;
  longSentences: string[];
  checks: LintCheckItem[];
}

// -----------------------------------------------------------------------------
// ۰ تا ۸: متن کامل دستورالعمل محتوایی گُردیه (System Instruction آماده برای هر هوش مصنوعی)
// -----------------------------------------------------------------------------
export const GORDIYEH_SYSTEM_INSTRUCTION_V1 = `دستورالعمل محتوایی گُردیه
نسخه ۱٫۰ — برای استفاده به‌عنوان System Instruction در هر هوش مصنوعی

۰. نقش و هدف
تو نویسنده‌ی محتوای فروشگاه گجت «گُردیه» هستی. هدفت رفع نیاز خریدار است، نه فشار برای فروش. صدای تو شبیه کارشناسی است که گرم و دقیق کنار خریدار می‌ایستد: موقعیت او را می‌فهمد، راه‌حل را ساده می‌گوید و محدودیت‌ها را صادقانه اعلام می‌کند. اگر دستور کاربر با این سند تضاد داشت، سند مقدم است؛ فقط وقتی کاربر صریحاً استثنا خواست، استثنا را اعلام کن و اجرا کن.

۱. پنج قانون ثابت
۱. اول موقعیت، بعد محصول. لید هر متن یک موقعیت واقعی خریدار است (باشگاه، محل کار، سفر، شب‌های بی‌خوابی...). مشکل را بزرگ‌نمایی نکن و ترس نساز.
۲. هر ادعا سند دارد. هر ادعا یکی از این‌ها را دارد: عدد تأییدشده، سازوکار قابل‌توضیح یا منبع. ادعای بی‌سند را حذف کن، نه نرم.
۳. محدودیت را صادقانه بگو. برای هر محصول بخش «برای چه کسی مناسب نیست» اجباری است.
۴. یک صدا در کل صفحه. لحن وسط متن عوض نمی‌شود.
۵. اسم محصول طبیعی در عنوان و لید بیاید. تکرار تحمیلی کلیدواژه ممنوع است (حداکثر ۱ بار در ۱۰۰ کلمه).

۲. لحن و سبک
• سطح زبان: محاوره‌ی مؤدب. مخاطب «شما» با فعل «ـید» (می‌خورید، بریزید، می‌برید)؛ سوم‌شخص مخفف (می‌ده، می‌کنه، می‌شه). نه کتابی (می‌خواهید، می‌دهد، گردد) و نه صمیمی‌ـخیابانی (می‌خوای، خفن، باحال).
• اندازه‌ی جمله: میانگین ۱۲ تا ۱۸ کلمه، حداکثر ۲۵. پاراگراف ۳ تا ۵ جمله.
• ضمیر: برای برند «ما»، برای خواننده «شما». سوم‌شخص خنثی فقط در مقاله‌های تاریخی.
• تشبیه و تصور: تشبیه از زندگی روزمره و یک دعوت به تصور موقعیت مجاز است (هرکدام حداکثر یک بار در هر صفحه).
• علامت تعجب: حداکثر یکی در کل متن. ایموجی در متن سایت ممنوع.
• پایان: حداکثر یک جمله‌ی جمع‌بندی. شعار پرشور ممنوع.
• واژه‌های ممنوع: بی‌نظیر، بی‌رقیب، فوق‌العاده، شاهکار، معجزه، انقلابی، باحال، خفن، تضمینی، بهترین قیمت، ارزان‌ترین، پرفروش‌ترین (مگر با داده‌ی واقعی فروش)، ترند، بدون هیچ‌گونه قید و شرط (چون ضمانت و مرجوعی همیشه استثنا دارند — استثنا را همان جا بنویس)، فرمایید، ادوات، گردد، می‌باشد، اصالت (بدون سند و مدرک مشخص).

۳. ورودی اجباری برای نوشتن صفحه‌ی محصول
پیش از نوشتن، کارت اطلاعات محصول را از کاربر بگیر یا پر کن:
اسم و مدل دقیق • قیمت و شرایط ضمانت • مشخصات فنی و عددهای تأییدشده • موقعیت مصرف • چیزهایی که داخل کارت نیستند یا ضعف دارند (محدودیت‌ها) • شرایط تست و تعویض همان محصول (مهلت، شامل چه چیزهایی، شامل چه چیزهایی نمی‌شه).
قانون «نداریم = نمی‌نویسیم»: اگر عددی، میلی‌آمپر باتری، عدد لومن، نتیجه آزمایشگاهی یا مدرکی در کارت نبود، حدس نزن و نساز؛ فقط چیزی را بنویس که سندش موجود است.

۴. اسکلت ثابت هر صفحه
۱. تیتر و لید (موقعیت خریدار ← راه‌حل)
۲. بدنه با تیترهای فرعی روشن (کجا به کار می‌آد، ویژگی‌ها به شکل «برچسب: فایده»، نکات استفاده)
۳. محدودیت و بخش «برای چه کسی مناسب نیست؟»
۴. جمع‌بندی یک‌جمله‌ای (بدون شعار) + باکس ثابت «جعبه‌ی تست و تعویض» (برای محصول‌ها)

۵. الگوی آماده بر اساس نوع صفحه
• صفحه‌ی محصول: عنوان (H1)، لید موقعیت←راه‌حل، «کجا به کارتون می‌آد» (۳ بولت)، ویژگی‌ها (برچسب: فایده)، «برای چه کسی مناسبه؟ / برای چه کسی نیست؟»، جعبه‌ی تست و تعویض (مهلت تست • شامل چه چیزهایی • شامل چه چیزهایی نمی‌شه). قیمت و ضمانت داخل متن توضیحات تکرار نشود.
• صفحه‌ی دسته: تیتر (H1)، زیرشاخه‌ها، راهنمای خرید (موقعیت + ۳ معیار انتخاب)، سه معیار شماره‌دار.
• مقاله‌ی وبلاگ: جواب کوتاه در دو جمله‌ی اول، تیترهای H2 به زبان سؤال خریدار، یک باکس نکته (Callout)، بخش «چه کسی لازم نداره / نخره»، کارت محصول مرتبط، و فهرست منابع برای هر ادعای عددی.
• درباره ما: مسأله بازار + قول ما + ۳ تعهد شفاف + روایت نام برند (با منبع) + دعوت کوتاه به تماس.
• قوانین و حریم خصوصی: بندهای شماره‌دار کوتاه، روشن و بدون اصطلاحات کلیشه‌ای.
• میکروکپی و دکمه‌ها: فعل عملی روشن (مثلاً «افزودن به سبد»، «دیدن پروژکتور»، «استعلام سفارش»). بدون پیام سیستم یا اصطلاحات فنی داخلی.

۶. قوانین خاص دسته‌های حساس
• زیبایی و سلامت (ماساژور، میکرودرم): ادعای درمان، تشخیص پزشکی یا مناسب برای پوست حساس بدون مدرک ممنوع است. صریح بنویس «برای مراقبت روزمره‌ست، نه درمان؛ در صورت بیماری پوستی یا آسیب عضلانی با پزشک مشورت کنید.»
• کودک و نورپردازی دکوری: بدون ادعای ایمنی سنی مگر وجود گواهی و درج سن مجاز.
• باتری، برق و حرارت: هشدار استفاده از آداپتور استاندارد و عدم رها کردن زیر آفتاب یا داخل پتو بر اساس دفترچه.
• سئو: عنوان سئو حداکثر ۶۰ کاراکتر، توضیحات متا بین ۱۲۰ تا ۱۵۵ کاراکتر، نام محصول طبیعی و بدون کلیدواژه‌چینی.

۷. بانک سؤال خریدار (مبنای H2 مقاله‌ها)
هر مقاله باید به سؤال‌های واقعی خریدار جواب بدهد (مثل تفاوت لومن ANSI، انتخاب نور میز کار، عمر واقعی باتری لیتیومی).

۸. چک‌لیست ۱۱موردی پیش از تحویل متن
۱. با موقعیت واقعی شروع شده؟
۲. همه‌ی عددها و ادعاها سند دارن؟
۳. بخش «برای چه کسی مناسب نیست» هست؟
۴. لحن از اول تا آخر محاوره‌ی مؤدبه و یک‌دسته؟
۵. کلمه‌ی کتابی، اداری، خیابانی یا تبلیغی ممنوع داخلش نیست؟
۶. جمله‌ها زیر ۲۵ کلمه و کوتاه و خوانان؟
۷. حداکثر یک تعجب و صفر ایموجی رعایت شده؟
۸. هیچ خط تیره با جای خالی [...] یا ادعای حدسی باقی نمونده؟
۹. حروف عربی (ي، ك) به فارسی (ی، ک) اصلاح شده؟
۱۰. طول عنوان سئو (≤۶۰) و متا (۱۲۰-۱۵۵) کنترل شده؟
۱۱. قیمت/ضمانت تکراری و مهلت تست بی‌سند («۷۲ ساعت» کلی) حذف شده؟`;

// -----------------------------------------------------------------------------
// فهرست واژه‌های ممنوع و پیشنهاد جایگزین
// -----------------------------------------------------------------------------
export const BANNED_WORDS_DICTIONARY: BannedWordRule[] = [
  { word: 'بی‌نظیر', category: 'تبلیغاتی و اغراق', suggestion: 'حذف یا جایگزینی با مشخصه‌ی دقیق و مستند' },
  { word: 'بی‌رقیب', category: 'تبلیغاتی و اغراق', suggestion: 'حذف یا بیان مزیت واقعی با سند' },
  { word: 'فوق‌العاده', category: 'تبلیغاتی و اغراق', suggestion: 'جایگزینی با عدد یا عملکرد قابل‌سنجش' },
  { word: 'شاهکار', category: 'تبلیغاتی و اغراق', suggestion: 'حذف صفت تبلیغی' },
  { word: 'معجزه', category: 'تبلیغاتی و اغراق', suggestion: 'حذف صفت اغراق‌آمیز' },
  { word: 'انقلابی', category: 'تبلیغاتی و اغراق', suggestion: 'توضیح سازوکار واقعی دستگاه' },
  { word: 'تضمینی', category: 'تبلیغاتی و اغراق', suggestion: 'ذکر دقیق شرایط ضمانت یا حذف' },
  { word: 'بهترین قیمت', category: 'تبلیغاتی و اغراق', suggestion: 'اعلام قیمت شفاف بدون ادعای بهترین' },
  { word: 'ارزان‌ترین', category: 'تبلیغاتی و اغراق', suggestion: 'حذف ادعای مقایسه‌ای بی‌سند' },
  { word: 'پرفروش‌ترین', category: 'تبلیغاتی و اغراق', suggestion: '«منتخب گُردیه» (تا زمان داشتن داده‌ی واقعی فروش)' },
  { word: 'ترند', category: 'تبلیغاتی و اغراق', suggestion: 'ذکر کاربرد واقعی کالا به‌جای ترند' },
  { word: 'بی‌قیدوشرط', category: 'تبلیغاتی و اغراق', suggestion: 'نوشتن استثناهای واقعی ضمانت و تعویض' },
  { word: 'بدون قید و شرط', category: 'تبلیغاتی و اغراق', suggestion: 'نوشتن استثناهای واقعی ضمانت و تعویض' },
  { word: 'فرمایید', category: 'کتابی و اداری', suggestion: 'بکنید / بدید / بزنید (محاوره‌ی مؤدب)' },
  { word: 'فرمایند', category: 'کتابی و اداری', suggestion: 'بدن / انجام بدن (محاوره‌ی مؤدب)' },
  { word: 'گردد', category: 'کتابی و اداری', suggestion: 'بشه / می‌شه' },
  { word: 'می‌باشد', category: 'کتابی و اداری', suggestion: 'هست / ـه' },
  { word: 'ادوات', category: 'کتابی و اداری', suggestion: 'گجت / دستگاه / وسیله' },
  { word: 'خفن', category: 'خیابانی', suggestion: 'توضیح مزیت واقعی با لحن محترمانه' },
  { word: 'باحال', category: 'خیابانی', suggestion: 'کاربردی / ساده / راحت' },
  { word: 'کارگاه', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'فروشگاه / تیم پشتیبانی (در صورت نبود کارگاه واقعی)' },
  { word: 'آزمایشگاه', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'حذف ادعای آزمایشگاهی بدون مدرک' },
  { word: 'انستیتو', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'فروشگاه گُردیه' },
  { word: 'کنترل کیفیت', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'بازبینی پیش از ارسال (فقط اگر واقعاً انجام می‌شه)' },
  { word: 'T6-7075', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'حذف مشخصه‌ی فلزی ساختگی' },
  { word: 'متالورژی', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'مشخصات فنی / جنس بدنه' },
  { word: '۷۲ ساعت', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'ارجاع به جعبه‌ی تست و تعویض اختصاصی هر محصول' },
  { word: 'اسید لاکتیک', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'کم کردن سفتی عضله بعد از ورزش' },
  { word: 'درمان', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'مراقبت روزمره، نه درمان' },
  { word: 'جوانسازی', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'پاکسازی سطحی منافذ' },
  { word: 'تأمین مستقیم', category: 'ادعای بی‌سند یا پزشکی', suggestion: 'حذف ادعای زنجیره‌ی تأمین بدون سند' },
];

// -----------------------------------------------------------------------------
// الگوهای آماده برای تولید انواع صفحات (بخش ۵ دستورالعمل)
// -----------------------------------------------------------------------------
export const CONTENT_TYPE_TEMPLATES: ContentTypeTemplate[] = [
  {
    kind: 'article',
    title: 'الگوی مقاله‌ی وبلاگ (Blog Article)',
    description: 'پاسخ کوتاه در دو جمله‌ی اول، تیترهای H2 به زبان سؤال خریدار، کادر نکته (Callout)، بخش «چه کسی لازم نداره» و کارت محصول مرتبط.',
    structureSteps: [
      'پاراگراف اول (پاسخ کوتاه در ۲ تا ۳ جمله‌ی روشن)',
      'H2: سؤال واقعی خریدار درباره معیار انتخاب یا ابهام اصلی',
      'کادر نکته (Callout): قاعده‌ی عملی برای تصمیم درست',
      'H2: این دستگاه/روش برای چه کسی لازم نیست؟',
      'کارت محصول مرتبط + فهرست منابع در صورت وجود عدد یا ادعای علمی',
    ],
    starterBlocks: [
      {
        id: 'tpl_art_p1',
        schemaVersion: 1,
        type: 'paragraph',
        html: 'پاسخ کوتاه رو توی دو جمله‌ی اول بنویسید: این دستگاه چه کاری انجام می‌ده و چه عددی واقعاً مهمه.',
        colorToken: 'default',
      },
      {
        id: 'tpl_art_h1',
        schemaVersion: 1,
        type: 'heading',
        level: 2,
        text: 'چرا عددهای روی جعبه‌ی محصول‌ها با هم یکی نیست؟',
      },
      {
        id: 'tpl_art_p2',
        schemaVersion: 1,
        type: 'paragraph',
        html: 'سازوکار رو ساده توضیح بدید و برای هر عدد منبع یا جدول مرجع بیارید.',
        colorToken: 'default',
      },
      {
        id: 'tpl_art_callout',
        schemaVersion: 1,
        type: 'callout',
        intent: 'tip',
        title: 'قاعده‌ی عملی',
        text: 'یک نکته‌ی کاربردی و واقعی که قبل از خرید باید در نظر گرفته بشه.',
      },
      {
        id: 'tpl_art_h2',
        schemaVersion: 1,
        type: 'heading',
        level: 2,
        text: 'چه کسی این محصول رو نخره؟',
      },
      {
        id: 'tpl_art_p3',
        schemaVersion: 1,
        type: 'paragraph',
        html: 'صادقانه بنویسید توی چه شرایطی این محصول مناسب نیست و چی براش بهتره.',
        colorToken: 'default',
      },
    ],
  },
  {
    kind: 'product',
    title: 'الگوی صفحه‌ی محصول (Product Page)',
    description: 'لید موقعیت←راه‌حل، کجا به کار می‌آد (۳ بولت)، ویژگی‌ها (برچسب: فایده)، بخش اجباری «برای چه کسی نیست» و جعبه‌ی تست و تعویض.',
    structureSteps: [
      'عنوان H1 طبیعی با نام محصول و کاربرد اصلی',
      'لید: موقعیت واقعی خریدار ← راه‌حل ساده',
      'کجا به کارتون می‌آد (۳ موقعیت روزمره)',
      'ویژگی‌ها به شکل «برچسب: فایده»',
      'برای چه کسی مناسبه؟ / برای چه کسی نیست؟ (اجباری)',
      'جعبه‌ی تست و تعویض: مهلت • شامل چه چیزهایی • شامل چه چیزهایی نمی‌شه',
    ],
  },
  {
    kind: 'category',
    title: 'الگوی صفحه‌ی دسته (Category Guide)',
    description: 'معرفی موقعیت‌های خریدار در این دسته + ۳ معیار کلیدی انتخاب + زیرشاخه‌های واقعی.',
    structureSteps: [
      'تیتر H1 دسته',
      'لید ۲ تا ۳ جمله‌ای: چه کارهایی رو سبک‌تر می‌کنه',
      'سه معیار شماره‌دار برای انتخاب درست قبل از خرید',
      'فهرست زیرشاخه‌ها بدون ادعای اضافه',
    ],
  },
  {
    kind: 'terms',
    title: 'الگوی صفحه‌ی ثابت / قوانین (Static & Policy)',
    description: 'بندهای شماره‌دار کوتاه، محاوره‌ی مؤدب، بدون کلیشه یا وعده‌ی بی‌سند، با اعلام استثناها در همان بند.',
    structureSteps: [
      'تیتر اصلی (H1) و خلاصه‌ی ۱ تا ۲ جمله‌ای',
      'بندهای شماره‌دار با تیتر H2',
      'ذکر دقیق استثناها کنار هر تعهد',
    ],
    starterBlocks: [
      {
        id: 'tpl_page_h1',
        schemaVersion: 1,
        type: 'heading',
        level: 2,
        text: '۱. اصل شفافیت و مسئولیت',
      },
      {
        id: 'tpl_page_p1',
        schemaVersion: 1,
        type: 'paragraph',
        html: 'تعهد دقیق رو روشن بنویسید و استثناها رو همون جا اضافه کنید تا ابهامی نمونه.',
        colorToken: 'default',
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// بانک سؤال خریدار برای چهار دسته‌ی اصلی فروشگاه (بخش ۷ دستورالعمل)
// -----------------------------------------------------------------------------
export const BUYER_QUESTION_BANK: BuyerQuestionGroup[] = [
  {
    categorySlug: 'digital',
    categoryNameFa: 'کالای دیجیتال',
    questions: [
      'پروژکتور توی اتاق روشن هم تصویر واضحی می‌ده یا حتماً باید تاریک باشه؟',
      'گوشی آیفون و اندروید چطور بی‌سیم به دستگاه وصل می‌شن؟ نیاز به کابل اضافه هست؟',
      'دسته بازی توی چه پلتفرم‌هایی کار می‌کنه و همه‌ی بازی‌های موبایل ازش پشتیبانی می‌کنن؟',
      'کیس ضدآب دوربین اکشن تا چه شرایطی مقاومه و بدون کیس می‌شه توی آب برد؟',
    ],
  },
  {
    categorySlug: 'smart-home',
    categoryNameFa: 'لوازم خانگی هوشمند',
    questions: [
      'مینی شیکر یخ یا میوه‌ی منجمد رو هم خرد می‌کنه یا فقط برای پودر و میوه‌ی نرمه؟',
      'پد شارژ بی‌سیم G-Lamp برای چه گوشی‌هایی کار می‌کنه و بدون گوشی شارژدار به درد می‌خوره؟',
      'جارو رباتیک گوشه‌های مبل و روی فرش ضخیم رو چطور تمیز می‌کنه؟',
      'چراغ کهکشانی فضانورد نور کافی برای مطالعه داره یا فقط نور دکوری شبانه‌ست؟',
    ],
  },
  {
    categorySlug: 'travel-camping',
    categoryNameFa: 'سفر و کمپینگ',
    questions: [
      'مینی‌پرسو خودش آب رو داغ می‌کنه یا باید آب جوش آماده داشته باشیم؟',
      'هر شات قهوه با مینی‌پرسو با پودر آسیاب‌شده کار می‌کنه یا کپسول اختصاصی می‌خواد؟',
      'تشک بادی صندلی عقب خودرو توی چه ماشین‌هایی جا می‌شه و با چی باد می‌شه؟',
    ],
  },
  {
    categorySlug: 'beauty-health',
    categoryNameFa: 'زیبایی و سلامت',
    questions: [
      'آیا ماساژور تفنگی یا میکرودرم دستگاه درمانی محسوب می‌شن؟',
      'توی چه شرایطی (مثل التهاب، زخم یا آسیب عضلانی) نباید از دستگاه استفاده کرد؟',
      'تنظیم شدت و سری‌های قابل تعویض چطور تمیز می‌شن؟',
    ],
  },
];

// -----------------------------------------------------------------------------
// سازنده‌ی پرامپت از روی کارت اطلاعات محصول
// -----------------------------------------------------------------------------
export function buildProductPromptFromCard(card: ProductInfoCard): {
  prompt: string;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  if (!card.nameAndModel.trim()) missingFields.push('اسم و مدل دقیق محصول');
  if (!card.confirmedSpecs.trim()) missingFields.push('مشخصات فنی و عددهای تأییدشده');
  if (!card.usageSituations.trim()) missingFields.push('موقعیت مصرف واقعی');
  if (!card.limitationsAndNotSuitableFor.trim()) missingFields.push('محدودیت‌ها و بخش «برای چه کسی مناسب نیست»');
  if (!card.testWindow?.trim()) missingFields.push('مهلت و شرایط دقیق تست و تعویض (در صورت نداشتن، صریحاً «ندارد» قید شود)');

  const prompt = `${GORDIYEH_SYSTEM_INSTRUCTION_V1}

---
درخواست نگارش صفحه‌ی محصول با مشخصات زیر (لطفاً دقیقاً بر اساس داده‌های همین کارت بنویس و هیچ عدد یا ادعایی اضافه نکن):

• اسم و مدل دقیق: ${card.nameAndModel || '[تکمیل‌نشده — فرض‌سازی نشود]'}
• برند: ${card.brand || '[تکمیل‌نشده]'}
• دسته‌بندی: ${card.categorySlug}
• قیمت و ضمانت: ${card.priceToman || 'ذکر نشود'} | ${card.warranty || 'در کارت ذکر نشده'}
• مشخصات تأییدشده: ${card.confirmedSpecs || '[تکمیل‌نشده]'}
• موقعیت مصرف: ${card.usageSituations || '[تکمیل‌نشده]'}
• محدودیت‌ها و «برای چه کسی مناسب نیست»: ${card.limitationsAndNotSuitableFor || '[اجباری — تکمیل شود]'}
• جعبه‌ی تست و تعویض:
  - مهلت تست: ${card.testWindow || '[در کارت ثبت نشده — ننویس ۷۲ ساعت]'}
  - شامل چه چیزهایی می‌شه: ${card.testCovered || '[ثبت نشده]'}
  - شامل چه چیزهایی نمی‌شه: ${card.testNotCovered || '[ثبت نشده]'}
${card.safetyWarnings ? `• هشدار ایمنی دفترچه: ${card.safetyWarnings}` : ''}
${card.ourTestNotes ? `• نتیجه‌ی تست واقعی ما: ${card.ourTestNotes}` : ''}

لطفاً خروجی را شامل این بخش‌ها تحویل بده:
۱. عنوان کامل (H1) و عنوان سئو (حداکثر ۶۰ کاراکتر) + توضیحات متا (۱۲۰ تا ۱۵۵ کاراکتر)
۲. لید (موقعیت ← راه‌حل) بدون تکرار قیمت یا ضمانت
۳. کجا به کارتون می‌آد (حداکثر ۳ مورد)
۴. ویژگی‌ها (برچسب: فایده)
۵. برای چه کسی مناسبه؟ / برای چه کسی نیست؟
۶. جعبه‌ی تست و تعویض`;

  return { prompt, missingFields };
}

// -----------------------------------------------------------------------------
// پایش خودکار متن بر اساس چک‌لیست ۱۱موردی گُردیه
// -----------------------------------------------------------------------------
export function lintGordiyehCopy(input: {
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  plainText: string;
  kind?: 'article' | 'page' | 'product';
}): GordiyehLintReport {
  const fullText = `${input.title}\n${input.seoTitle || ''}\n${input.seoDescription || ''}\n${input.plainText}`;

  // 1. Banned words
  const bannedHits: Array<{ word: string; category: string; suggestion: string }> = [];
  for (const rule of BANNED_WORDS_DICTIONARY) {
    if (fullText.includes(rule.word)) {
      bannedHits.push({
        word: rule.word,
        category: rule.category,
        suggestion: rule.suggestion,
      });
    }
  }

  // 2. Arabic chars
  const arabicCharsFound: string[] = [];
  if (fullText.includes('ي')) arabicCharsFound.push('ي (به جای ی فارسی)');
  if (fullText.includes('ك')) arabicCharsFound.push('ك (به جای ک فارسی)');

  // 3. Exclamation count & emojis
  const exclamationCount = (fullText.match(/!/g) || []).length;
  const emojiMatches = fullText.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || [];
  const emojiCount = emojiMatches.length;

  // 4. Placeholder brackets check
  const hasPlaceholders = /\[\s*\]|\[نام[^\]]*\]|FIXME|TODO/i.test(fullText);

  // 5. Long sentences (> 25 words)
  const sentences = input.plainText
    .split(/[.!؟?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 25);

  // 6. SEO lengths
  const effectiveSeoTitle = (input.seoTitle || input.title || '').trim();
  const seoDescLen = (input.seoDescription || '').trim().length;

  // 7. Honest limitation section presence (recommended for articles/products)
  const hasLimitationSection =
    /برای چه کسی (?:مناسب )?نیست|چه کسی .* نخره|لازم نیست|مناسب نیست|نخره/.test(fullText);

  const checks: LintCheckItem[] = [
    {
      id: 'banned_words',
      label: 'نبودن واژه‌های ممنوع (تبلیغی، اداری، خیابانی، بی‌سند)',
      status: bannedHits.length === 0 ? 'PASS' : 'FAIL',
      details: bannedHits.length === 0
        ? 'هیچ واژه‌ی ممنوعی پیدا نشد.'
        : `${bannedHits.length} مورد یافت شد: ${bannedHits.map(h => h.word).join('، ')}`,
    },
    {
      id: 'arabic_chars',
      label: 'یکدستی حروف فارسی (نبودن ي و ك عربی)',
      status: arabicCharsFound.length === 0 ? 'PASS' : 'FAIL',
      details: arabicCharsFound.length === 0
        ? 'همه‌ی نویسه‌ها فارسی استاندارد هستن.'
        : `نیازمند اصلاح: ${arabicCharsFound.join(' و ')}`,
    },
    {
      id: 'exclamation_emoji',
      label: 'حداکثر ۱ علامت تعجب و صفر ایموجی در متن',
      status: emojiCount === 0 && exclamationCount <= 1 ? 'PASS' : 'FAIL',
      details: `تعداد علامت تعجب: ${exclamationCount} | تعداد ایموجی: ${emojiCount}`,
    },
    {
      id: 'placeholders',
      label: 'نبودن جای‌خالی یا نشانگر ناتمام ([ ] یا TODO)',
      status: !hasPlaceholders ? 'PASS' : 'FAIL',
      details: !hasPlaceholders ? 'جای‌خالی پیدا نشد.' : 'عبارت داخل کروشه یا نشانگر ناتمام توی متن هست.',
    },
    {
      id: 'sentence_length',
      label: 'کوتاه بودن جمله‌ها (حداکثر ۲۵ کلمه)',
      status: longSentences.length === 0 ? 'PASS' : 'WARN',
      details: longSentences.length === 0
        ? `همه‌ی ${sentences.length} جمله زیر ۲۵ کلمه‌ان.`
        : `${longSentences.length} جمله بیشتر از ۲۵ کلمه دارن؛ می‌تونید بشکنیدشون.`,
    },
    {
      id: 'seo_title',
      label: 'طول عنوان سئو (حداکثر ۶۰ کاراکتر)',
      status: effectiveSeoTitle.length > 0 && effectiveSeoTitle.length <= 60 ? 'PASS' : 'WARN',
      details: `طول فعلی: ${effectiveSeoTitle.length} کاراکتر (حداکثر مجاز: ۶۰)`,
    },
    {
      id: 'seo_desc',
      label: 'طول توضیحات متا (۱۲۰ تا ۱۵۵ کاراکتر)',
      status: seoDescLen >= 120 && seoDescLen <= 155 ? 'PASS' : 'WARN',
      details: `طول فعلی: ${seoDescLen} کاراکتر (بازه ایده‌آل: ۱۲۰ تا ۱۵۵)`,
    },
    {
      id: 'honest_limit',
      label: 'وجود بخش صادقانه «برای چه کسی مناسب نیست / نخره»',
      status:
        input.kind === 'page'
          ? 'PASS'
          : hasLimitationSection
          ? 'PASS'
          : 'WARN',
      details:
        input.kind === 'page'
          ? 'برای صفحات حقوقی/ثابت الزامی نیست، ولی استثناها باید روشن باشن.'
          : hasLimitationSection
          ? 'بخش محدودیت خریدار در متن شناسایی شد.'
          : 'پیشنهاد می‌شه بخش «چه کسی نخره / برای چه کسی نیست» رو اضافه کنید.',
    },
  ];

  const passedCount = checks.filter(c => c.status === 'PASS').length;
  const totalCount = checks.length;
  const score = Math.round((passedCount / totalCount) * 100);

  return {
    score,
    passedCount,
    totalCount,
    bannedHits,
    arabicCharsFound,
    exclamationCount,
    emojiCount,
    longSentences,
    checks,
  };
}

// =============================================================================
// بانک سؤالات دسته‌بندی با انطباق اجباری بر کارت اطلاعات محصول (بند ۹ دستورالعمل)
// =============================================================================

import type { CanonicalProduct } from '../types';

export type GordiyehCategorySlug = 'digital' | 'smart-home' | 'travel-camping' | 'beauty-health';

export type ProductCardEvidenceField =
  | 'description'
  | 'specs'
  | 'keyFeatures'
  | 'usageContexts'
  | 'suitableFor'
  | 'notSuitableFor'
  | 'testExchangeBox'
  | 'warranty'
  | 'expertReview';

export interface CategoryBuyerFAQRule {
  id: string;
  categorySlug: GordiyehCategorySlug;
  question: string;
  /** کلمات کلیدی یا نشانههایی که حتماً باید در کارت کالا دیده شوند تا سؤال نمایش داده شود */
  requiredSignals: string[];
  /** فیلدهای مرجع که پاسخ فقط از آن‌ها استخراج می‌شود */
  sourceFields: ProductCardEvidenceField[];
  isCustom?: boolean;
}

export interface ResolvedProductFAQ {
  id: string;
  question: string;
  answer: string;
  evidenceSources: string[];
}

export const FAQ_BANK_STORAGE_KEY = 'gordiyeh_faq_bank_v1';

export function mapPersianCategoryToSlug(category?: string): GordiyehCategorySlug {
  const c = (category || '').trim();
  if (c.includes('خانگی') || c.includes('smart-home')) return 'smart-home';
  if (c.includes('سفر') || c.includes('کمپ') || c.includes('travel')) return 'travel-camping';
  if (c.includes('زیبایی') || c.includes('سلامت') || c.includes('beauty')) return 'beauty-health';
  return 'digital';
}

const SOURCE_FIELD_LABELS: Record<ProductCardEvidenceField, string> = {
  description: 'توضیح محصول',
  specs: 'جدول مشخصات',
  keyFeatures: 'ویژگی‌های کلیدی',
  usageContexts: 'موقعیت‌های استفاده',
  suitableFor: 'بخش «برای چه کسی مناسبه»',
  notSuitableFor: 'بخش «برای چه کسی مناسب نیست»',
  testExchangeBox: 'جعبه‌ی تست و تعویض',
  warranty: 'شرایط ضمانت',
  expertReview: 'بررسی و محدودیت‌ها',
};

export const DEFAULT_CATEGORY_FAQ_RULES: CategoryBuyerFAQRule[] = [
  // 1. کالای دیجیتال (digital)
  {
    id: 'faq_dig_bright_room',
    categorySlug: 'digital',
    question: 'این دستگاه توی اتاق روشن یا زیر نور آفتاب هم تصویر واضحی می‌ده؟',
    requiredSignals: ['اتاق روشن', 'کم‌نور', 'آفتاب', 'کمرنگ'],
    sourceFields: ['notSuitableFor', 'suitableFor', 'expertReview'],
  },
  {
    id: 'faq_dig_wireless_connect',
    categorySlug: 'digital',
    question: 'چطور به گوشی یا کامپیوتر وصل می‌شه و نیاز به کابل داره؟',
    requiredSignals: ['وای‌فای', 'بلوتوث', 'بی‌سیم', 'گوشی', 'کامپیوتر'],
    sourceFields: ['specs', 'keyFeatures', 'description'],
  },
  {
    id: 'faq_dig_waterproof_case',
    categorySlug: 'digital',
    question: 'آیا دوربین بدون کیس هم ضدآبه یا حتماً باید توی کیس باشه؟',
    requiredSignals: ['کیس ضدآب', 'ضدآب', 'بدون کیس'],
    sourceFields: ['notSuitableFor', 'specs', 'keyFeatures'],
  },
  {
    id: 'faq_dig_gamepad_compat',
    categorySlug: 'digital',
    question: 'همه‌ی بازی‌های موبایل و کامپیوتر از این دسته پشتیبانی می‌کنن؟',
    requiredSignals: ['بازی‌ها', 'گیم‌پد', 'دسته پشتیبانی'],
    sourceFields: ['notSuitableFor', 'specs', 'expertReview'],
  },
  {
    id: 'faq_dig_wireless_pad',
    categorySlug: 'digital',
    question: 'اگه گوشیم قابلیت شارژ بی‌سیم نداشته باشه، پد شارژ دستگاه کار می‌کنه؟',
    requiredSignals: ['شارژ بی‌سیم', 'پد شارژ'],
    sourceFields: ['notSuitableFor', 'specs', 'keyFeatures'],
  },
  {
    id: 'faq_dig_speaker_space',
    categorySlug: 'digital',
    question: 'اسپیکر این دستگاه برای مهمونی و فضای بزرگ کافیه یا مخصوص اتاقه؟',
    requiredSignals: ['اسپیکر', 'مهمونی', 'اتاق'],
    sourceFields: ['notSuitableFor', 'keyFeatures', 'expertReview'],
  },
  {
    id: 'faq_dig_usage_limits',
    categorySlug: 'digital',
    question: 'بیشترین کاربردش کجاست و برای چه کسی مناسب نیست؟',
    requiredSignals: ['suitableFor', 'notSuitableFor'],
    sourceFields: ['usageContexts', 'suitableFor', 'notSuitableFor'],
  },
  {
    id: 'faq_dig_test_box',
    categorySlug: 'digital',
    question: 'شرایط تست و تعویض این کالا چیه و چه چیزهایی شاملش نمی‌شه؟',
    requiredSignals: ['testExchangeBox'],
    sourceFields: ['testExchangeBox'],
  },

  // 2. لوازم خانگی هوشمند (smart-home)
  {
    id: 'faq_home_shaker_volume',
    categorySlug: 'smart-home',
    question: 'برای چند نفر یا درست کردن حجم زیاد هم مناسبه؟',
    requiredSignals: ['چند نفر', 'حجم زیاد', 'بلندر رومیزی'],
    sourceFields: ['notSuitableFor', 'expertReview'],
  },
  {
    id: 'faq_home_shaker_battery',
    categorySlug: 'smart-home',
    question: 'برای کار کردن به پریز برق نیاز داره و با چه کابلی شارژ می‌شه؟',
    requiredSignals: ['باتری لیتیومی', 'Type-C', 'پریز'],
    sourceFields: ['specs', 'keyFeatures', 'description'],
  },
  {
    id: 'faq_home_vacuum_corners',
    categorySlug: 'smart-home',
    question: 'جارو رباتیک گوشه‌ها و لبه‌ی مبل رو هم کامل تمیز می‌کنه؟',
    requiredSignals: ['گوشه‌ها', 'لبه‌ی مبل', 'تی‌کشی'],
    sourceFields: ['notSuitableFor', 'keyFeatures', 'specs'],
  },
  {
    id: 'faq_home_astro_study',
    categorySlug: 'smart-home',
    question: 'نور این چراغ برای مطالعه یا روشن کردن اتاق کافیه؟',
    requiredSignals: ['مطالعه', 'روشن کردن اتاق', 'دکوری'],
    sourceFields: ['notSuitableFor', 'expertReview'],
  },
  {
    id: 'faq_home_astro_remote',
    categorySlug: 'smart-home',
    question: 'کنترل از راه دور و تایمر خاموشی خودکار داره؟',
    requiredSignals: ['تایمر', 'ریموت', 'کنترل از راه دور'],
    sourceFields: ['specs', 'keyFeatures'],
  },
  {
    id: 'faq_home_usage_limits',
    categorySlug: 'smart-home',
    question: 'توی چه موقعیت‌هایی به کار می‌آد و محدودیت اصلیش چیه؟',
    requiredSignals: ['suitableFor', 'notSuitableFor'],
    sourceFields: ['usageContexts', 'suitableFor', 'notSuitableFor'],
  },
  {
    id: 'faq_home_test_box',
    categorySlug: 'smart-home',
    question: 'شرایط تست و تعویض این محصول چه مواردی رو پوشش می‌ده؟',
    requiredSignals: ['testExchangeBox'],
    sourceFields: ['testExchangeBox'],
  },

  // 3. سفر و کمپینگ (travel-camping)
  {
    id: 'faq_trv_minipresso_water',
    categorySlug: 'travel-camping',
    question: 'دستگاه خودش آب رو داغ می‌کنه یا به برق و باتری نیاز داره؟',
    requiredSignals: ['آب داغ', 'پیستونی', 'برق و باتری'],
    sourceFields: ['notSuitableFor', 'specs', 'expertReview'],
  },
  {
    id: 'faq_trv_mattress_ground',
    categorySlug: 'travel-camping',
    question: 'این تشک فقط برای صندلی عقب ماشینه یا می‌شه روی زمین کمپ هم پهنش کرد؟',
    requiredSignals: ['صندلی عقب', 'زمین', 'کمپ'],
    sourceFields: ['notSuitableFor', 'specs', 'expertReview'],
  },
  {
    id: 'faq_trv_mattress_pump',
    categorySlug: 'travel-camping',
    question: 'پمپ باد و بالش هم همراه تشک توی بسته هست؟',
    requiredSignals: ['پمپ باد فندکی', 'بالش بادی'],
    sourceFields: ['specs', 'keyFeatures', 'description'],
  },
  {
    id: 'faq_trv_usage_limits',
    categorySlug: 'travel-camping',
    question: 'توی سفر چه کاری رو راحت می‌کنه و برای چه کسی مناسب نیست؟',
    requiredSignals: ['suitableFor', 'notSuitableFor'],
    sourceFields: ['usageContexts', 'suitableFor', 'notSuitableFor'],
  },
  {
    id: 'faq_trv_test_box',
    categorySlug: 'travel-camping',
    question: 'جعبه‌ی تست و تعویض این کالا شامل چه چیزهایی می‌شه و چه چیزهایی نه؟',
    requiredSignals: ['testExchangeBox'],
    sourceFields: ['testExchangeBox'],
  },

  // 4. زیبایی و سلامت (beauty-health)
  {
    id: 'faq_bty_medical_claim',
    categorySlug: 'beauty-health',
    question: 'آیا این دستگاه ابزار پزشکی یا درمانی محسوب می‌شه؟',
    requiredSignals: ['درمانی نیست', 'مراقبت روزمره', 'غیردرمانی'],
    sourceFields: ['description', 'specs', 'expertReview'],
  },
  {
    id: 'faq_bty_contraindications',
    categorySlug: 'beauty-health',
    question: 'توی چه شرایطی نباید ازش استفاده کرد؟',
    requiredSignals: ['پزشک مشورت', 'ملتهب', 'آسیب‌دیدگی', 'زخمی', 'درد شدید'],
    sourceFields: ['notSuitableFor', 'expertReview'],
  },
  {
    id: 'faq_bty_levels_heads',
    categorySlug: 'beauty-health',
    question: 'قابلیت تنظیم شدت و سری‌های قابل تعویض داره؟',
    requiredSignals: ['سطح مکش', 'چند سرعت', 'سرهای', 'سر مجزا'],
    sourceFields: ['specs', 'keyFeatures'],
  },
  {
    id: 'faq_bty_test_box',
    categorySlug: 'beauty-health',
    question: 'شرایط تست و تعویض برای این محصول بهداشتی چطوره؟',
    requiredSignals: ['testExchangeBox'],
    sourceFields: ['testExchangeBox'],
  },
];

function collectFieldSnippets(product: CanonicalProduct, fields: ProductCardEvidenceField[]): Array<{ field: ProductCardEvidenceField; label: string; text: string }> {
  const results: Array<{ field: ProductCardEvidenceField; label: string; text: string }> = [];

  for (const f of fields) {
    if (f === 'description' && product.description?.trim()) {
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: product.description.trim() });
    } else if (f === 'specs' && product.specs && product.specs.length > 0) {
      const itemsText = product.specs
        .flatMap(g => g.items.map(it => `${it.title || it.key}: ${it.value}`))
        .filter(Boolean)
        .join(' • ');
      if (itemsText) results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: itemsText });
    } else if (f === 'keyFeatures' && product.keyFeatures && product.keyFeatures.length > 0) {
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: product.keyFeatures.join(' ') });
    } else if (f === 'usageContexts' && product.usageContexts && product.usageContexts.length > 0) {
      const ctxText = product.usageContexts.map(u => `${u.title} (${u.description})`).join('، ');
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: ctxText });
    } else if (f === 'suitableFor' && product.suitableFor?.trim()) {
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: product.suitableFor.trim() });
    } else if (f === 'notSuitableFor' && product.notSuitableFor?.trim()) {
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: product.notSuitableFor.trim() });
    } else if (f === 'warranty' && product.warranty?.trim()) {
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: product.warranty.trim() });
    } else if (f === 'expertReview' && product.expertReview?.summary?.trim()) {
      results.push({ field: f, label: SOURCE_FIELD_LABELS[f], text: product.expertReview.summary.trim() });
    } else if (f === 'testExchangeBox' && product.testExchangeBox?.covered?.trim() && product.testExchangeBox?.notCovered?.trim()) {
      const win = product.testExchangeBox.testWindow?.trim() || 'طبق کارت محصول';
      results.push({
        field: f,
        label: SOURCE_FIELD_LABELS[f],
        text: `مهلت تست: ${win} موارد تحت پوشش: ${product.testExchangeBox.covered.trim()} موارد خارج از پوشش: ${product.testExchangeBox.notCovered.trim()}`,
      });
    }
  }

  return results;
}

/**
 * فقط در صورتی پاسخ برمی‌گرداند که شواهد واقعی آن در کارت اطلاعات محصول وجود داشته باشد.
 * در غیر این صورت null برمی‌گرداند تا هیچ پاسخ حدسی یا بی‌سندی به خریدار نمایش داده نشود.
 */
export function resolveProductDocumentedFAQ(
  product: CanonicalProduct,
  rule: CategoryBuyerFAQRule
): ResolvedProductFAQ | null {
  const productCategorySlug = mapPersianCategoryToSlug(product.category);
  if (rule.categorySlug !== productCategorySlug) return null;

  const fullCardCorpus = [
    product.description || '',
    product.suitableFor || '',
    product.notSuitableFor || '',
    product.warranty || '',
    product.expertReview?.summary || '',
    product.expertReview?.intro || '',
    ...(product.keyFeatures || []),
    ...(product.usageContexts || []).map(u => `${u.title} ${u.description}`),
    ...(product.specs || []).flatMap(g => g.items.map(i => `${i.title || i.key} ${i.value}`)),
  ].join(' ');

  // Verify every structural or keyword signal requirement
  let signalMatched = false;
  for (const sig of rule.requiredSignals) {
    if (sig === 'testExchangeBox') {
      if (product.testExchangeBox?.covered?.trim() && product.testExchangeBox?.notCovered?.trim()) {
        signalMatched = true;
      }
    } else if (sig === 'suitableFor') {
      if (product.suitableFor?.trim()) signalMatched = true;
    } else if (sig === 'notSuitableFor') {
      if (product.notSuitableFor?.trim()) signalMatched = true;
    } else if (sig === 'specs') {
      if (product.specs && product.specs.some(g => g.items.length > 0)) signalMatched = true;
    } else if (sig === 'usageContexts') {
      if (product.usageContexts && product.usageContexts.length > 0) signalMatched = true;
    } else if (fullCardCorpus.includes(sig)) {
      signalMatched = true;
    }
  }

  if (!signalMatched) return null;

  const snippets = collectFieldSnippets(product, rule.sourceFields);
  if (snippets.length === 0) return null;

  // Special clean formatting for specific grounded patterns
  let answer = '';
  const evidenceSources = Array.from(new Set(snippets.map(s => s.label)));

  if (rule.sourceFields.length === 1 && rule.sourceFields[0] === 'testExchangeBox' && product.testExchangeBox) {
    answer = `وضعیت مهلت تست: ${product.testExchangeBox.testWindow} شامل این موارد می‌شه: ${product.testExchangeBox.covered} شامل این موارد نمی‌شه: ${product.testExchangeBox.notCovered}`;
  } else if (rule.id.endsWith('_usage_limits')) {
    const parts: string[] = [];
    if (product.usageContexts && product.usageContexts.length > 0) {
      parts.push(`بیشترین کاربردش توی این موقعیت‌هاست: ${product.usageContexts.map(u => `${u.title} (${u.description})`).join('، ')}`);
    }
    if (product.suitableFor) parts.push(`مناسب برای: ${product.suitableFor}`);
    if (product.notSuitableFor) parts.push(`محدودیت: ${product.notSuitableFor}`);
    answer = parts.join(' ');
  } else {
    // Filter snippets strictly to fields that actually speak to the rule's signals when multiple exist
    const keywordSignals = rule.requiredSignals.filter(
      s => !['testExchangeBox', 'suitableFor', 'notSuitableFor', 'specs', 'usageContexts'].includes(s)
    );

    const focusedParts: string[] = [];
    for (const snip of snippets) {
      if (snip.field === 'specs' && product.specs) {
        const relevantSpecItems = product.specs
          .flatMap(g => g.items)
          .filter(it =>
            keywordSignals.length === 0 ||
            keywordSignals.some(k => `${it.title || it.key} ${it.value}`.includes(k))
          )
          .map(it => `${it.title || it.key}: ${it.value}`);
        if (relevantSpecItems.length > 0) {
          focusedParts.push(relevantSpecItems.join(' • '));
        }
      } else if (snip.field === 'keyFeatures' && product.keyFeatures) {
        const relevantFeats = product.keyFeatures.filter(
          kf => keywordSignals.length === 0 || keywordSignals.some(k => kf.includes(k))
        );
        if (relevantFeats.length > 0) {
          focusedParts.push(relevantFeats.join(' '));
        }
      } else {
        if (keywordSignals.length === 0 || keywordSignals.some(k => snip.text.includes(k))) {
          focusedParts.push(snip.text);
        }
      }
    }

    // Deduplicate identical strings cleanly
    const uniqueParts = Array.from(new Set(focusedParts.map(p => p.trim()).filter(Boolean)));
    if (uniqueParts.length === 0) return null;
    answer = uniqueParts.slice(0, 2).join(' ');
  }

  if (!answer.trim()) return null;

  return {
    id: rule.id,
    question: rule.question,
    answer: answer.trim(),
    evidenceSources,
  };
}

