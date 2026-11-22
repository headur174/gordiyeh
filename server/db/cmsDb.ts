import { Pool } from 'pg';
import {
  UnifiedDocument,
  DocumentKind,
  DocumentStatus,
  DocumentRevision,
  SlugHistoryEntry,
  derivePlainTextFromBlocks,
  normalizePersianText
} from '../../src/types/cms';

// Primary PostgreSQL connection pool
const databaseUrl = process.env.DATABASE_URL || process.env.LIARA_POSTGRES_URL || '';
let pool: Pool | null = null;
let isPgConnected = false;

if (databaseUrl && databaseUrl.trim()) {
  try {
    pool = new Pool({
      connectionString: databaseUrl.trim(),
      ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  } catch (err) {
    console.warn('[CMS:DB] Failed to initialize PostgreSQL pool:', err);
  }
}

// In-Memory mirror and isolated fallback store
const memoryDocuments = new Map<string, UnifiedDocument>();
const memorySlugHistory = new Map<string, SlugHistoryEntry>();
const memoryRevisions: DocumentRevision[] = [];
let latestMemoryTimestamp = new Date().toISOString();

/**
 * Health and connection check to PostgreSQL database
 */
export async function checkDbConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  if (!pool) {
    return { connected: false, latencyMs: 0, error: 'DATABASE_URL environment variable is not defined' };
  }

  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      isPgConnected = true;
      return { connected: true, latencyMs };
    } finally {
      client.release();
    }
  } catch (err: any) {
    isPgConnected = false;
    return { connected: false, latencyMs: Date.now() - start, error: err.message || String(err) };
  }
}

/**
 * Initializes database schemas and migrations
 */
export async function initCmsDatabase(): Promise<void> {
  const health = await checkDbConnection();
  if (health.connected && pool) {
    console.log(`[CMS:DB] Connected to PostgreSQL successfully (Latency: ${health.latencyMs}ms)`);
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id VARCHAR(100) PRIMARY KEY,
          kind VARCHAR(20) NOT NULL,
          slug VARCHAR(150) NOT NULL UNIQUE,
          title VARCHAR(300) NOT NULL,
          status VARCHAR(20) NOT NULL,
          version INT NOT NULL DEFAULT 1,
          blocks_json TEXT NOT NULL,
          derived_plain_text TEXT,
          seo_title VARCHAR(150),
          seo_description VARCHAR(400),
          author VARCHAR(100) NOT NULL,
          cover_image VARCHAR(1000),
          canonical_url VARCHAR(1000),
          noindex BOOLEAN NOT NULL DEFAULT FALSE,
          published_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          content_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS document_slug_history (
          old_slug VARCHAR(150) PRIMARY KEY,
          document_id VARCHAR(100) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS document_revisions (
          id VARCHAR(100) PRIMARY KEY,
          document_id VARCHAR(100) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
          version INT NOT NULL,
          snapshot_json TEXT NOT NULL,
          saved_by VARCHAR(100) NOT NULL,
          saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_documents_kind_status ON documents(kind, status);
        CREATE INDEX IF NOT EXISTS idx_revisions_doc ON document_revisions(document_id, version DESC);
      `);
      console.log('[CMS:DB] PostgreSQL tables verified and indexed');
    } catch (err) {
      console.error('[CMS:DB] Schema creation error:', err);
    }
  } else {
    console.log('[CMS:DB] Operating with in-memory resilient mirror (Zero-cold-start ready)');
  }

  // Seed baseline documents if empty
  await seedInitialDocuments();
}

/**
 * Seeds initial 3 articles and 5 static pages into unified document schema (v3.0 content)
 */
async function seedInitialDocuments(): Promise<void> {
  const existingDocs = await listAllDocuments('all', true);
  const v3CutoffIso = '2026-11-13T00:00:00.000Z';
  const now = '2026-11-13T12:00:00.000Z';

  const initialDocs: UnifiedDocument[] = [
    // 1. Article: Mini Projector
    {
      id: 'doc_art_projector',
      kind: 'article',
      slug: 'how-to-choose-a-real-mini-projector',
      title: 'راهنمای خرید مینی پروژکتور: لومن واقعی (ANSI) چیه و چقدر لازمه؟',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'راهنمای خرید مینی پروژکتور: لومن واقعی ANSI چیه؟',
      seoDescription: 'چرا عددهای روی جعبه‌ی پروژکتورها با هم مقایسه نمی‌شن، تفاوت ANSI و LED لومن چیه و چه کسی پروژکتور پرتابل نخره.',
      coverImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=75&fm=webp',
      noindex: false,
      publishedAt: '2026-11-13T10:00:00.000Z',
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_p1',
          schemaVersion: 1,
          type: 'paragraph',
          html: '<strong>پاسخ کوتاه:</strong> عدد لومن روی جعبه‌ی پروژکتورها همیشه یه چیز رو نمی‌سنجه. فقط ANSI لومن یه روش اندازه‌گیری استاندارد داره و مقایسه‌ی درست با همون انجام می‌شه. توی اتاق تاریک یا کم‌نور معمولاً از ۱۰۰ تا چند صد ANSI لومن کافیه؛ برای اتاق روشن‌تر باید سراغ مدل‌های خیلی پرنورتر رفت.',
          colorToken: 'default'
        },
        {
          id: 'blk_h1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'چرا لومن‌های روی جعبه‌ها با هم مقایسه نمی‌شن؟'
        },
        {
          id: 'blk_p2',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'سه عدد با اسم «لومن» روی بازار هست و هر کدوم چیز دیگه‌ای می‌سنجه. ANSI لومن میانگین روشنایی چند نقطه از تصویر روی پرده‌ست. «لومن LED» روشنایی‌ای رو می‌گه که چشم حس می‌کنه، و «لومن منبع نور» روشنایی خود لامپ پیش از رسیدن به لنزه. طبق جدول تبدیل BenQ (که خودش سازنده‌ی پروژکتوره)، هزار «لومن LED» تقریباً برابر ۴۱۷ ANSI لومنه و هزار «لومن منبع نور» حدود ۶۰ ANSI لومن. برای همین پروژکتوری که ۲٬۴۰۰ «لومن LED» ادعا می‌کنه می‌تونه از نظر روشنایی واقعی با پروژکتوری که ۱٬۰۰۰ ANSI لومن داره برابر باشه.',
          colorToken: 'default'
        },
        {
          id: 'blk_h2',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'برای اتاق من چقدر نور لازمه؟'
        },
        {
          id: 'blk_p2b',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'منبع‌ها یکسان نمی‌گن. یه سازنده برای اتاق تاریک ۱۰۰ تا ۲۰۰ ANSI لومن رو کافی می‌دونه و سازنده‌ی دیگه ۳۰۰ تا ۶۰۰. هرچه اتاق روشن‌تر باشه، نور بیشتری لازمه. نقد تخصصی Expert Reviews می‌گه برای تصویر قابل‌قبول بین طلوع تا غروب حدود ۱۵۰۰ لومن یا بیشتر لازمه، در حالی که بیشتر پروژکتورهای ارزان و پرتابل با منبع LED بین ۱۰۰ تا ۵۰۰ لومن دارن.',
          colorToken: 'default'
        },
        {
          id: 'blk_callout1',
          schemaVersion: 1,
          type: 'callout',
          intent: 'info',
          title: 'قاعده‌ی عملی',
          text: 'پروژکتور پرتابل کوچیک رو برای شب یا اتاقی که می‌تونید پرده‌هاش رو بکشید بخرید، نه برای تماشا زیر نور روز.'
        },
        {
          id: 'blk_h3',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'پروژکتور پرتابل رو چطور نگه داریم؟'
        },
        {
          id: 'blk_p2c',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'قاعده‌ی عمومی اینه که دریچه‌های هوا آزاد بمونن و دستگاه روشن لای پتو، کوسن یا جای بسته نباشه. فاصله‌ی دقیق از دیوار و شرایط دیگه رو دفترچه‌ی همون مدل می‌گه.',
          colorToken: 'default'
        },
        {
          id: 'blk_h4',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'چه کسی پروژکتور پرتابل نخره؟'
        },
        {
          id: 'blk_p2d',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'کسی که می‌خواد توی اتاق روشن، بدون پرده و در طول روز فیلم ببینه. برای اون موقعیت، تلویزیون یا پروژکتور خیلی پرنورتر مناسب‌تره.',
          colorToken: 'default'
        },
        {
          id: 'blk_prod1',
          schemaVersion: 1,
          type: 'product_card',
          productId: 'prod_ported_projector'
        },
        {
          id: 'blk_list1',
          schemaVersion: 1,
          type: 'list',
          ordered: false,
          items: [
            'منبع: BenQ — ANSI Lumens vs LED Lumens vs Light Source Lumens (benq.com)',
            'منبع: Expert Reviews — How many lumens does a projector need (expertreviews.co.uk)',
            'منبع: Aurzen و Formovie — Projector & ANSI Lumens Guides'
          ]
        }
      ]
    },

    // 2. Article: G-Lamp & Desk Setup
    {
      id: 'doc_art_glamp',
      kind: 'article',
      slug: 'smart-lighting-and-desk-setup',
      title: 'میز کار مرتب‌تر: چطور کابل‌ها رو کم کنیم و نور و صدا رو جمع کنیم؟',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'میز کار مرتب‌تر: کاهش کابل و انتخاب نور و صدا',
      seoDescription: 'کی دستگاه چندکاره روی میز به کار می‌آد، شارژ بی‌سیم چه چیزی رو ساده می‌کنه و نور میز برای کار و استراحت چطور باشه.',
      coverImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=75&fm=webp',
      noindex: false,
      publishedAt: '2026-11-13T09:00:00.000Z',
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_p3',
          schemaVersion: 1,
          type: 'paragraph',
          html: '<strong>پاسخ کوتاه:</strong> میز شلوغ معمولاً از چند دستگاه جدا می‌آد: شارژر، اسپیکر و چراغ. اگه گوشی‌تون شارژ بی‌سیم داره، یه پد روی میز وصل و جدا کردن مداوم کابل رو حذف می‌کنه. نور رو هم با کار متناسب کنید: روشن و خنثی برای کار، ملایم برای شب.',
          colorToken: 'default'
        },
        {
          id: 'blk_glamp_h1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'شارژ بی‌سیم چه چیزی رو ساده می‌کنه؟'
        },
        {
          id: 'blk_glamp_p2',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'با پد شارژ بی‌سیم، گوشی رو فقط روی میز می‌ذارید و کابلی وصل و جدا نمی‌کنید. پد خودش به منبع برق وصله و فقط گوشی‌های مجهز به شارژ بی‌سیم روش شارژ می‌شن. اگه گوشی‌تون این قابلیت رو نداره، پد به کارتون نمی‌آد.',
          colorToken: 'default'
        },
        {
          id: 'blk_glamp_h2',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'نور میز رو چطور انتخاب کنیم؟'
        },
        {
          id: 'blk_glamp_p3',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'برای کار دقیق مثل نوشتن یا کدنویسی، نور روشن و یکنواخت بهتره. نور رنگی و رقص نور برای حال‌وهوای شبانه‌ست و جای نور کار رو نمی‌گیره. اگه یه دستگاه هم نور رنگی و هم اسپیکر داره، بهتره از اون برای ساعت‌های استراحت استفاده کنید.',
          colorToken: 'default'
        },
        {
          id: 'blk_glamp_h3',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'این کیت برای چه کسی لازم نیست؟'
        },
        {
          id: 'blk_glamp_p4',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'اگه میزتون خلوته، اسپیکر قوی جدا دارید یا گوشی‌تون شارژ بی‌سیم نداره، لازم نیست دستگاه چندکاره بخرید. دستگاه‌های چندکاره وقتی به کارتون می‌آن که فضای میز کمه و می‌خواید چند کار رو توی یه جا جمع کنید.',
          colorToken: 'default'
        },
        {
          id: 'blk_prod2',
          schemaVersion: 1,
          type: 'product_card',
          productId: 'prod_ported_g_lamp'
        }
      ]
    },

    // 3. Article: Fast Charging & Battery Health
    {
      id: 'doc_art_battery',
      kind: 'article',
      slug: 'fast-charging-battery-health-myths',
      title: 'باورهای غلط درباره باتری گجت‌های شارژی: چی واقعاً عمرش رو کم می‌کنه؟',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'باورهای غلط درباره باتری گجت‌های شارژی',
      seoDescription: 'آیا باید اولین بار ۸ ساعت شارژ کرد، تا صفر خالی کرد یا تا ۱۰۰٪ نگه داشت؟ نکته‌های عملی برای نگهداری از باتری لیتیوم‌یون.',
      coverImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=75&fm=webp',
      noindex: false,
      publishedAt: '2026-11-13T08:00:00.000Z',
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_p4',
          schemaVersion: 1,
          type: 'paragraph',
          html: '<strong>پاسخ کوتاه:</strong> باتری لیتیوم‌یون «حافظه» نداره و لازم نیست مرتب تا صفر خالی بشه. چیزی که عمرش رو بیشتر کم می‌کنه گرما و نگه‌داشتن توی شارژ کامله. این راهنما برای لیتیوم‌یون‌های رایجه؛ عمر واقعی هر دستگاه به ظرفیت و کیفیت سلول‌هاش بستگی داره و دفترچه‌ی همون دستگاه مقدمه.',
          colorToken: 'default'
        },
        {
          id: 'blk_bat_h1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'باید اولین بار باتری رو ۸ ساعت شارژ کرد؟'
        },
        {
          id: 'blk_bat_p2',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'این باور معمولاً از باتری‌های نیکلی قدیمی اومده. طبق Battery University، لیتیوم‌یون حافظه نداره و برای طولانی شدن عمرش لازم نیست دوره‌ای تا آخر تخلیه بشه. پس شارژ طولانی اولیه ظرفیت رو بیشتر نمی‌کنه.',
          colorToken: 'default'
        },
        {
          id: 'blk_bat_h2',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'بهتره تا صفر خالی کنم؟'
        },
        {
          id: 'blk_bat_p3',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'نه. توصیه‌ی Battery University اینه که تخلیه‌ی کامل رو تا جای ممکن دور بزنید و بیشتر شارژ کنید؛ تخلیه‌ی جزئی برای لیتیوم‌یون مشکلی نداره.',
          colorToken: 'default'
        },
        {
          id: 'blk_bat_h3',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'همیشه تا ۱۰۰٪ شارژ کنم؟'
        },
        {
          id: 'blk_bat_p4',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'شارژ کامل بیشترین ظرفیت رو می‌ده، ولی نگه‌داشتن باتری توی ولتاژ بالا فشار بیشتری بهش میاره. توی جدول Battery University، باتری‌ای که یک سال توی ۲۵ درجه با شارژ ۴۰٪ نگه‌داری شده حدود ۹۶٪ ظرفیتش رو حفظ می‌کنه و با شارژ ۱۰۰٪ حدود ۸۰٪. «قاعده‌ی ۲۰ تا ۸۰ درصد» یه راهنمای سرانگشتیه که از همین اصل می‌آد. فقط یادتون باشه شارژ جزئی ظرفیت قابل‌استفاده رو هم کم می‌کنه.',
          colorToken: 'default'
        },
        {
          id: 'blk_bat_h4',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'گرما چقدر مهمه؟'
        },
        {
          id: 'blk_bat_p5',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'Battery University دمای بالای ۳۰ درجه رو برای لیتیوم‌یون «دمای بالا» حساب می‌کنه. برای همین گجت رو توی تابستان پشت شیشه‌ی ماشین یا زیر آفتاب جا نذارید، مخصوصاً وقتی شارژش کامله.',
          colorToken: 'default'
        },
        {
          id: 'blk_bat_h5',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'شارژر سریع یا معمولی؟'
        },
        {
          id: 'blk_bat_p6',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'Battery University اشاره می‌کنه جریان زیاد هم روی عمر باتری اثر می‌ذاره. شارژر و کابلی رو استفاده کنید که دفترچه‌ی دستگاه پیشنهاد می‌کنه.',
          colorToken: 'default'
        },
        {
          id: 'blk_bat_callout',
          schemaVersion: 1,
          type: 'callout',
          intent: 'tip',
          title: 'خلاصه‌ی عملی',
          text: 'گجت رو خنک نگه دارید، توی گرما شارژ کامل رها نکنید و لازم نیست باتری رو تا صفر بیارید. این توصیه‌ها کلیه و عدد چرخه‌ی شارژ دستگاه‌های ما رو نمی‌گه.'
        },
        {
          id: 'blk_prod3',
          schemaVersion: 1,
          type: 'product_card',
          productId: 'prod_ported_shaker'
        },
        {
          id: 'blk_bat_src',
          schemaVersion: 1,
          type: 'list',
          ordered: false,
          items: [
            'منبع: Battery University — BU-808: How to Prolong Lithium-based Batteries (batteryuniversity.com)'
          ]
        }
      ]
    },

    // 4. Static Page: About Us
    {
      id: 'doc_page_about',
      kind: 'page',
      slug: 'about-us',
      title: 'درباره گُردیه',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'درباره گُردیه | فروشگاه گجت‌های کاربردی با توضیح صادقانه',
      seoDescription: 'فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه؛ با توضیح صادقانه برای هر محصول و شرایط تست روشن.',
      noindex: false,
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_ab1',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'توی بازار گجت، عدد و ادعای یه مدل از فروشگاهی به فروشگاه دیگه خیلی فرق می‌کنه و محدودیت‌ها کمتر گفته می‌شن. گُردیه رو با یه قول ساده شروع کردیم: چیزی ننویسیم که نتونیم پشتش بایستیم.',
          colorToken: 'default'
        },
        {
          id: 'blk_ab1b',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'برای هر محصول سه چیز می‌نویسیم: چه مشکلی رو حل می‌کنه، به چه کسی کمک می‌کنه و برای چه کسی مناسب نیست. اگه عددی رو نتونیم نشون بدیم، نمی‌نویسیمش.',
          colorToken: 'default'
        },
        {
          id: 'blk_ab_h1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'سه تعهد ما'
        },
        {
          id: 'blk_ab_list',
          schemaVersion: 1,
          type: 'list',
          ordered: true,
          items: [
            'توضیح صادقانه: هر محصول بخش «برای چه کسی نیست» داره.',
            'تست و تعویض شفاف: مهلت و شرایط هر محصول جدا نوشته می‌شه و قبل از خرید می‌بینیدش.',
            'حداقل اطلاعات: فقط چیزی رو نگه می‌داریم که برای ارسال لازمه و اطلاعات شما رو به شخص ثالث نمی‌دیم.'
          ]
        },
        {
          id: 'blk_ab2',
          schemaVersion: 1,
          type: 'callout',
          intent: 'info',
          title: 'ریشه‌ی نام گُردیه',
          text: 'نام «گُردیه» از روایت‌های کهن ایرانی گرفته شده و یاد بانویی دلاور رو زنده نگه می‌داره؛ نشونه‌ی استواری و راستگویی که می‌خوایم توی انتخاب و معرفی کالا هم داشته باشیم. سؤال یا پیشنهادی دارید؟ از صفحه‌ی تماس با ما پیام بدید.'
        }
      ]
    },

    // 5. Static Page: Terms
    {
      id: 'doc_page_terms',
      kind: 'page',
      slug: 'terms',
      title: 'قوانین و شرایط خرید',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'قوانین و شرایط خرید | تست و تعویض گُردیه',
      seoDescription: 'مهلت و شرایط تست هر محصول جدا نوشته شده. جزئیات ارسال، پرداخت شاپرکی و انصراف قبل از ارسال.',
      noindex: false,
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_t1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۱. تست و تعویض'
        },
        {
          id: 'blk_t2',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'مهلت و شرایط تست و تعویض هر محصول توی صفحه‌ی همون محصول نوشته شده. اگه توی اون مهلت نقص فنی پیدا شد، دستگاه با یه کالای نو و آکبند تعویض می‌شه. آسیب ناشی از ضربه‌ی شدید، سقوط در آب یا استفاده از آداپتور فست‌شارژ غیراستاندارد شامل تعویض نیست.',
          colorToken: 'default'
        },
        {
          id: 'blk_t3',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۲. ارسال'
        },
        {
          id: 'blk_t4',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'سفارش‌های تهران با هماهنگی قبلی و با پیک تحویل داده می‌شن. سفارش‌های شهرستان با پست پیشتاز و کد رهگیری الکترونیکی ارسال می‌شن. بسته‌بندی چندلایه و ضربه‌گیر داره.',
          colorToken: 'default'
        },
        {
          id: 'blk_t5',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۳. پرداخت'
        },
        {
          id: 'blk_t6',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'پرداخت از درگاه شاپرکی و با رمزنگاری TLS انجام می‌شه. اگه شبکه یا درگاه مشکل داشت، فیش کارت‌به‌کارت با نظارت اپراتور پشتیبانی ثبت می‌شه.',
          colorToken: 'default'
        },
        {
          id: 'blk_t7',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۴. انصراف قبل از ارسال'
        },
        {
          id: 'blk_t8',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'اگه قبل از خروج بسته از انبار منصرف بشید، کل مبلغ حداکثر ۲۴ ساعت کاری بعد به شماره‌ی شبای مبدأ برمی‌گرده.',
          colorToken: 'default'
        }
      ]
    },

    // 6. Static Page: FAQ
    {
      id: 'doc_page_faq',
      kind: 'page',
      slug: 'faq',
      title: 'پرسش‌های متداول',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'پرسش‌های متداول گُردیه | ارسال، تست و پرداخت',
      seoDescription: 'جواب کوتاه به رایج‌ترین سؤال‌ها درباره ارسال، تست و تعویض، پروژکتور و تماس با پشتیبانی.',
      noindex: false,
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_f1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'سفارشم کی می‌رسه؟'
        },
        {
          id: 'blk_f1b',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'سفارش‌های تهران اگه تا ساعت ۱۵ ثبت بشن، همون روز یا حداکثر روز کاری بعد تحویل داده می‌شن. بقیه‌ی شهرها ظرف ۲۴ ساعت کاری به پست پیشتاز تحویل می‌شن و معمولاً ۲ تا ۴ روز کاری بعد می‌رسن.',
          colorToken: 'default'
        },
        {
          id: 'blk_f2',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'تست و تعویض چطوره؟'
        },
        {
          id: 'blk_f2b',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'مهلت و شرایطش برای هر محصول فرق می‌کنه و توی صفحه‌ی همون محصول نوشته شده. تست، سلامت فنی دستگاه رو پوشش می‌ده: عملکرد موتور (شیکر و ماساژور)، شارژدهی باتری، وضوح تصویر پروژکتور، اتصال بلوتوث و وای‌فای و پد شارژ بی‌سیم. آسیب ناشی از ضربه‌ی شدید، سقوط در آب یا آداپتور فست‌شارژ غیراستاندارد شامل نمی‌شه.',
          colorToken: 'default'
        },
        {
          id: 'blk_f3',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'پروژکتور به رایانه نیاز داره؟'
        },
        {
          id: 'blk_f3b',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'نه. اندروید، وای‌فای و بلوتوث داخلشه. برنامه‌هایی مثل یوتیوب و فیلیمو رو مستقیم روی دستگاه اجرا می‌کنید یا صفحه‌ی گوشی رو بی‌سیم روی دیوار می‌اندازید.',
          colorToken: 'default'
        },
        {
          id: 'blk_f4',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'اگه مشکل داشتم با کی تماس بگیرم؟'
        },
        {
          id: 'blk_f4b',
          schemaVersion: 1,
          type: 'callout',
          intent: 'tip',
          title: 'تماس با پشتیبانی',
          text: 'با شماره‌ی ۰۲۱-۸۸۲۹۹۰۴۰ (شنبه تا چهارشنبه ۹ تا ۱۹، پنج‌شنبه ۹ تا ۱۴) تماس بگیرید یا به support@gordiyeh.ir پیام بدید.'
        }
      ]
    },

    // 7. Static Page: Contact
    {
      id: 'doc_page_contact',
      kind: 'page',
      slug: 'contact',
      title: 'تماس با ما',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'تماس با پشتیبانی گُردیه | تلفن، ایمیل و شبکه‌های اجتماعی',
      seoDescription: 'راه‌های ارتباط با پشتیبانی گُردیه برای سؤال قبل از خرید، پیگیری سفارش و مشکل بعد از تحویل.',
      noindex: false,
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_c1',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'سؤال قبل از خرید دارید، سفارشتون رو پیگیری می‌کنید یا بعد از تحویل مشکلی پیش اومده؟ از این راه‌ها پیام بدید:',
          colorToken: 'default'
        },
        {
          id: 'blk_c2',
          schemaVersion: 1,
          type: 'list',
          ordered: false,
          items: [
            'تلفن: ۰۲۱-۸۸۲۹۹۰۴۰ (شنبه تا چهارشنبه ۹ تا ۱۹، پنج‌شنبه ۹ تا ۱۴)',
            'ایمیل: support@gordiyeh.ir',
            'شبکه‌های اجتماعی: اینستاگرام و تلگرام @gordiyeh_gadgets | ایتا @gordiyeh'
          ]
        }
      ]
    },

    // 8. Static Page: Privacy
    {
      id: 'doc_page_privacy',
      kind: 'page',
      slug: 'privacy',
      title: 'حریم خصوصی و امنیت اطلاعات',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'حریم خصوصی و امنیت اطلاعات کاربران | گُردیه',
      seoDescription: 'فقط اطلاعات لازم برای ارسال رو نگه می‌داریم، ردیاب تبلیغاتی نداریم و اطلاعات شما رو به کسی نمی‌دیم.',
      noindex: false,
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_pr1',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۱. بدون ردیابی تبلیغاتی'
        },
        {
          id: 'blk_pr2',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'از اسکریپت یا پیکسل ردیاب شخص ثالث استفاده نمی‌کنیم و رفتار شما رو توی سایت‌های دیگه دنبال نمی‌کنیم.',
          colorToken: 'default'
        },
        {
          id: 'blk_pr3',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۲. نشست‌های ورود'
        },
        {
          id: 'blk_pr4',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'توکن‌های ورود تاریخ انقضا دارن و با خروج از حساب باطل می‌شن.',
          colorToken: 'default'
        },
        {
          id: 'blk_pr5',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۳. حداقل اطلاعات'
        },
        {
          id: 'blk_pr6',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'فقط نام گیرنده، شماره‌ی تماس برای هماهنگی ارسال و نشانی پستی رو نگه می‌داریم.',
          colorToken: 'default'
        },
        {
          id: 'blk_pr7',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۴. بدون اشتراک‌گذاری'
        },
        {
          id: 'blk_pr8',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'اطلاعات و شماره‌ی تماس شما به شرکت‌های بازاریابی، سامانه‌های پیامک تبلیغاتی یا هیچ شخص ثالثی داده نمی‌شه.',
          colorToken: 'default'
        },
        {
          id: 'blk_pr9',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۵. پرداخت'
        },
        {
          id: 'blk_pr10',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'پرداخت مستقیم توی درگاه شاپرکی انجام می‌شه. ما رمز دوم، CVV2 و شماره‌ی کارت شما رو دریافت یا ذخیره نمی‌کنیم.',
          colorToken: 'default'
        },
        {
          id: 'blk_pr11',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۶. حذف سوابق'
        },
        {
          id: 'blk_pr12',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'هر زمان بخواید می‌تونید از تنظیمات حساب یا با تماس با پشتیبانی، درخواست حذف آدرس و شماره‌های تماستون رو ثبت کنید.',
          colorToken: 'default'
        }
      ]
    },

    // 9. Static Page: Licenses & Trust Seals (noindex, nofollow)
    {
      id: 'doc_page_licenses',
      kind: 'page',
      slug: 'licenses',
      title: 'مجوزها و نمادهای اعتماد',
      status: 'PUBLISHED',
      version: 1,
      author: 'تیم گُردیه',
      seoTitle: 'مجوزها و نمادهای اعتماد | گُردیه',
      seoDescription: 'محل درج و استعلام رسمی نماد اعتماد الکترونیکی (اینماد)، گواهی پرداخت زرین‌پال، نشان ساماندهی و درگاه‌های شاپرکی فروشگاه گُردیه.',
      noindex: true,
      updatedAt: now,
      contentModifiedAt: now,
      derivedPlainText: '',
      blocks: [
        {
          id: 'blk_lic1',
          schemaVersion: 1,
          type: 'callout',
          intent: 'info',
          title: 'شفافیت اصالت و استعلام مجوزها',
          text: 'این برگه برای نمایش و استعلام مستقیم نماد اعتماد الکترونیکی (اینماد)، گواهی درگاه پرداخت زرین‌پال، نشان ساماندهی و مشخصات پرداخت رسمی فروشگاه گُردیه در نظر گرفته شده است.'
        },
        {
          id: 'blk_lic2',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۱. نماد اعتماد الکترونیکی (اینماد) و ساماندهی'
        },
        {
          id: 'blk_lic3',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'کد و لینک استعلام رسمی اینماد و نشان ملی ثبت رسانه‌های دیجیتال (ساماندهی) پس از ثبت و تایید نهایی در کادرهای اختصاصی همین صفحه قرار می‌گیرند تا با یک کلیک قابل بررسی باشند.',
          colorToken: 'default'
        },
        {
          id: 'blk_lic4',
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: '۲. درگاه‌های پرداخت شاپرک و زرین‌پال'
        },
        {
          id: 'blk_lic5',
          schemaVersion: 1,
          type: 'paragraph',
          html: 'پرداخت‌های آنلاین فروشگاه از طریق درگاه‌های دارای رمزنگاری TLS و تحت شبکه شاپرک و شتاب انجام می‌شود و اطلاعات کارت بانکی در سرورهای فروشگاه ذخیره نمی‌گردد.',
          colorToken: 'default'
        }
      ]
    }
  ];

  // If documents already exist, idempotently upgrade untouched v1.0 seed docs to v3.0
  if (existingDocs.length > 0) {
    const existingById = new Map(existingDocs.map((d) => [d.id, d]));
    let upgradedCount = 0;

    for (const doc of initialDocs) {
      doc.title = normalizePersianText(doc.title);
      doc.derivedPlainText = derivePlainTextFromBlocks(doc.blocks);
      const existing = existingById.get(doc.id);

      if (!existing) {
        memoryDocuments.set(doc.id, doc);
        upgradedCount++;
        if (pool && isPgConnected) {
          try {
            await pool.query(`
              INSERT INTO documents (
                id, kind, slug, title, status, version, blocks_json, derived_plain_text,
                seo_title, seo_description, author, cover_image, canonical_url, noindex,
                published_at, updated_at, content_modified_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
              ON CONFLICT (id) DO NOTHING;
            `, [
              doc.id, doc.kind, doc.slug, doc.title, doc.status, doc.version,
              JSON.stringify(doc.blocks), doc.derivedPlainText, doc.seoTitle,
              doc.seoDescription, doc.author, doc.coverImage, doc.canonicalUrl,
              doc.noindex, doc.publishedAt, doc.updatedAt, doc.contentModifiedAt
            ]);
          } catch (err) {
            console.warn(`[CMS:DB] Failed to insert missing seed doc ${doc.slug}:`, err);
          }
        }
      } else if (existing.version === 1 && existing.contentModifiedAt < v3CutoffIso) {
        memoryDocuments.set(doc.id, doc);
        upgradedCount++;
        if (pool && isPgConnected) {
          try {
            await pool.query(`
              UPDATE documents SET
                slug = $2,
                title = $3,
                blocks_json = $4,
                derived_plain_text = $5,
                seo_title = $6,
                seo_description = $7,
                author = $8,
                cover_image = $9,
                published_at = $10,
                updated_at = $11,
                content_modified_at = $12
              WHERE id = $1 AND version = 1;
            `, [
              doc.id, doc.slug, doc.title, JSON.stringify(doc.blocks),
              doc.derivedPlainText, doc.seoTitle, doc.seoDescription,
              doc.author, doc.coverImage || null, doc.publishedAt || null,
              doc.updatedAt, doc.contentModifiedAt
            ]);
          } catch (err) {
            console.warn(`[CMS:DB] Failed v3 seed upgrade for ${doc.slug}:`, err);
          }
        }
      }
    }

    if (upgradedCount > 0) {
      latestMemoryTimestamp = now;
      console.log(`[CMS:DB] Upgraded/seeded ${upgradedCount} seed document(s) to v3.0`);
    }
    return;
  }

  console.log('[CMS:DB] Seeding initial 3 articles and 6 static pages (v3.0)...');

  // Seed into memory and PG
  for (const doc of initialDocs) {
    doc.title = normalizePersianText(doc.title);
    doc.derivedPlainText = derivePlainTextFromBlocks(doc.blocks);
    memoryDocuments.set(doc.id, doc);

    if (pool && isPgConnected) {
      try {
        await pool.query(`
          INSERT INTO documents (
            id, kind, slug, title, status, version, blocks_json, derived_plain_text,
            seo_title, seo_description, author, cover_image, canonical_url, noindex,
            published_at, updated_at, content_modified_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO NOTHING;
        `, [
          doc.id, doc.kind, doc.slug, doc.title, doc.status, doc.version,
          JSON.stringify(doc.blocks), doc.derivedPlainText, doc.seoTitle,
          doc.seoDescription, doc.author, doc.coverImage, doc.canonicalUrl,
          doc.noindex, doc.publishedAt, doc.updatedAt, doc.contentModifiedAt
        ]);
      } catch (err) {
        console.warn(`[CMS:DB] Failed to seed doc ${doc.slug} to PG:`, err);
      }
    }
  }

  // Record initial slug history for known legacy redirects
  const initialHistory = [
    { oldSlug: 'mechanical-keyboard-buying-guide', documentId: 'doc_art_projector' },
    { oldSlug: 'anc-headphones-noise-cancelling-science', documentId: 'doc_art_glamp' },
  ];

  for (const h of initialHistory) {
    memorySlugHistory.set(h.oldSlug, { oldSlug: h.oldSlug, documentId: h.documentId, createdAt: now });
    if (pool && isPgConnected) {
      try {
        await pool.query(`
          INSERT INTO document_slug_history (old_slug, document_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (old_slug) DO NOTHING;
        `, [h.oldSlug, h.documentId, now]);
      } catch (err) {}
    }
  }

  latestMemoryTimestamp = now;
  console.log('[CMS:DB] Seeding completed successfully (8 v3.0 documents, 2 slug histories)');
}

/**
 * Lists documents with optional kind filter and status visibility guard
 */
export async function listAllDocuments(kind: 'all' | DocumentKind = 'all', includeDraft = false): Promise<UnifiedDocument[]> {
  if (pool && isPgConnected) {
    try {
      let query = 'SELECT * FROM documents WHERE 1=1';
      const params: any[] = [];
      if (kind !== 'all') {
        params.push(kind);
        query += ` AND kind = $${params.length}`;
      }
      if (!includeDraft) {
        query += " AND status = 'PUBLISHED' AND noindex = FALSE";
      }
      query += ' ORDER BY published_at DESC NULLS LAST, updated_at DESC';

      const res = await pool.query(query, params);
      return res.rows.map(mapRowToDocument);
    } catch (err) {
      console.warn('[CMS:DB] PG listAllDocuments error, falling back to memory:', err);
    }
  }

  const docs = Array.from(memoryDocuments.values());
  return docs
    .filter((d) => {
      if (kind !== 'all' && d.kind !== kind) return false;
      if (!includeDraft && (d.status !== 'PUBLISHED' || d.noindex)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Retrieves a single document by slug with draft and signed preview validation
 */
export async function getDocumentBySlug(
  slug: string,
  kind?: DocumentKind,
  includeDraft = false
): Promise<UnifiedDocument | null> {
  const cleanSlug = slug.toLowerCase().trim();

  if (pool && isPgConnected) {
    try {
      let query = 'SELECT * FROM documents WHERE slug = $1';
      const params: any[] = [cleanSlug];
      if (kind) {
        params.push(kind);
        query += ` AND kind = $${params.length}`;
      }
      if (!includeDraft) {
        query += " AND status = 'PUBLISHED'";
      }

      const res = await pool.query(query, params);
      if (res.rows.length > 0) {
        return mapRowToDocument(res.rows[0]);
      }
    } catch (err) {
      console.warn('[CMS:DB] PG getDocumentBySlug error, checking memory:', err);
    }
  }

  for (const doc of memoryDocuments.values()) {
    if (doc.slug.toLowerCase() === cleanSlug) {
      if (kind && doc.kind !== kind) continue;
      if (!includeDraft && doc.status !== 'PUBLISHED') continue;
      return doc;
    }
  }

  return null;
}

/**
 * Resolves a historical old_slug directly to its current document's canonical slug in 1 step
 * Eliminates redirect chains (A -> B -> C becomes A -> C immediately)
 */
export async function resolveDirectSlugRedirect(oldSlug: string): Promise<string | null> {
  const cleanOld = oldSlug.toLowerCase().trim();

  if (pool && isPgConnected) {
    try {
      const res = await pool.query(`
        SELECT d.slug, d.kind
        FROM document_slug_history h
        JOIN documents d ON h.document_id = d.id
        WHERE h.old_slug = $1
      `, [cleanOld]);

      if (res.rows.length > 0) {
        const { slug, kind } = res.rows[0];
        return kind === 'article' ? `/blog/${slug}` : `/page/${slug}`;
      }
    } catch (err) {
      console.warn('[CMS:DB] PG resolveDirectSlugRedirect error, checking memory:', err);
    }
  }

  const entry = memorySlugHistory.get(cleanOld);
  if (entry) {
    const doc = memoryDocuments.get(entry.documentId);
    if (doc) {
      return doc.kind === 'article' ? `/blog/${doc.slug}` : `/page/${doc.slug}`;
    }
  }

  return null;
}

/**
 * Saves or updates a unified document with Optimistic Concurrency Control (OCC) and Revision History
 */
export async function saveUnifiedDocument(
  doc: Partial<UnifiedDocument> & { id?: string; slug: string; title: string; kind: DocumentKind; status: DocumentStatus },
  userRole: string,
  userIdentifier = 'admin'
): Promise<UnifiedDocument> {
  // Authorization check (Enforce server-side guard)
  if (userRole !== 'ADMIN') {
    const err = new Error('Unauthorized: Admin authorization role is required to modify CMS documents');
    (err as any).statusCode = 403;
    throw err;
  }

  const now = new Date().toISOString();

  // Find existing document by ID or slug
  let existing: UnifiedDocument | null = null;
  if (doc.id) {
    existing = memoryDocuments.get(doc.id) || null;
    if (!existing && pool && isPgConnected) {
      try {
        const res = await pool.query('SELECT * FROM documents WHERE id = $1', [doc.id]);
        if (res.rows.length > 0) existing = mapRowToDocument(res.rows[0]);
      } catch (err) {}
    }
  } else if (doc.slug) {
    existing = await getDocumentBySlug(doc.slug.toLowerCase().trim(), doc.kind, true);
  }

  // Optimistic Concurrency Control (OCC): version mismatch check
  if (existing && typeof doc.version === 'number') {
    if (doc.version !== existing.version) {
      const conflictErr = new Error(`Conflict: Document version mismatch. Server has version ${existing.version}, but update provided version ${doc.version}`);
      (conflictErr as any).statusCode = 409;
      throw conflictErr;
    }
  }

  const rawSlug = doc.slug || existing?.slug;
  if (!rawSlug) {
    const err = new Error('Slug is required for saving document');
    (err as any).statusCode = 400;
    throw err;
  }
  const cleanSlug = rawSlug.toLowerCase().trim();
  const docKind = doc.kind || existing?.kind || 'article';
  const docStatus = doc.status || existing?.status || 'DRAFT';
  const docTitle = doc.title || existing?.title || 'بدون عنوان';

  // Slug collision check: New slug cannot match another document's current or historical slug
  const docId = existing?.id || doc.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Check if cleanSlug is registered as an old_slug for another document
  const historyOwner = memorySlugHistory.get(cleanSlug);
  if (historyOwner && historyOwner.documentId !== docId) {
    const collErr = new Error(`Collision: Slug '${cleanSlug}' is currently reserved in history for another document`);
    (collErr as any).statusCode = 400;
    throw collErr;
  }

  // If slug has changed for an existing published document, add old slug to history
  if (existing && existing.slug !== cleanSlug) {
    const oldSlugEntry: SlugHistoryEntry = {
      oldSlug: existing.slug,
      documentId: docId,
      createdAt: now,
    };
    memorySlugHistory.set(existing.slug, oldSlugEntry);

    if (pool && isPgConnected) {
      try {
        await pool.query(`
          INSERT INTO document_slug_history (old_slug, document_id, created_at)
          VALUES ($1, $2, $3)
          ON CONFLICT (old_slug) DO UPDATE SET document_id = $2;
        `, [existing.slug, docId, now]);
      } catch (err) {}
    }
  }

  // Derive plain text and normalize Persian
  const normalizedTitle = normalizePersianText(docTitle);
  const blocks = doc.blocks || existing?.blocks || [];
  const derivedText = derivePlainTextFromBlocks(blocks);
  const newVersion = (existing?.version || 0) + 1;

  const savedDoc: UnifiedDocument = {
    id: docId,
    kind: docKind,
    slug: cleanSlug,
    title: normalizedTitle,
    status: docStatus,
    version: newVersion,
    blocks,
    derivedPlainText: derivedText,
    seoTitle: doc.seoTitle || existing?.seoTitle || normalizedTitle,
    seoDescription: doc.seoDescription || existing?.seoDescription || derivedText.substring(0, 160),
    author: doc.author || existing?.author || 'گُردیه',
    coverImage: doc.coverImage || existing?.coverImage,
    canonicalUrl: doc.canonicalUrl || existing?.canonicalUrl,
    noindex: doc.noindex ?? existing?.noindex ?? false,
    publishedAt: docStatus === 'PUBLISHED' ? (existing?.publishedAt || now) : undefined,
    updatedAt: now,
    contentModifiedAt: now,
  };

  // Save to Memory
  memoryDocuments.set(savedDoc.id, savedDoc);
  latestMemoryTimestamp = now;

  // Save snapshot to revision history (retain max 10 revisions)
  const revisionId = `rev_${docId}_${newVersion}`;
  const rev: DocumentRevision = {
    id: revisionId,
    documentId: docId,
    version: newVersion,
    snapshotJson: JSON.stringify(savedDoc),
    savedBy: userIdentifier,
    savedAt: now,
  };
  memoryRevisions.unshift(rev);

  // Save to PostgreSQL
  if (pool && isPgConnected) {
    try {
      await pool.query(`
        INSERT INTO documents (
          id, kind, slug, title, status, version, blocks_json, derived_plain_text,
          seo_title, seo_description, author, cover_image, canonical_url, noindex,
          published_at, updated_at, content_modified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          slug = $3,
          title = $4,
          status = $5,
          version = $6,
          blocks_json = $7,
          derived_plain_text = $8,
          seo_title = $9,
          seo_description = $10,
          author = $11,
          cover_image = $12,
          canonical_url = $13,
          noindex = $14,
          published_at = $15,
          updated_at = $16,
          content_modified_at = $17;
      `, [
        savedDoc.id, savedDoc.kind, savedDoc.slug, savedDoc.title, savedDoc.status,
        savedDoc.version, JSON.stringify(savedDoc.blocks), savedDoc.derivedPlainText,
        savedDoc.seoTitle, savedDoc.seoDescription, savedDoc.author, savedDoc.coverImage,
        savedDoc.canonicalUrl, savedDoc.noindex, savedDoc.publishedAt, savedDoc.updatedAt,
        savedDoc.contentModifiedAt
      ]);

      await pool.query(`
        INSERT INTO document_revisions (id, document_id, version, snapshot_json, saved_by, saved_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING;
      `, [rev.id, rev.documentId, rev.version, rev.snapshotJson, rev.savedBy, rev.savedAt]);

      // Prune revisions exceeding 10
      await pool.query(`
        DELETE FROM document_revisions
        WHERE document_id = $1 AND id NOT IN (
          SELECT id FROM document_revisions WHERE document_id = $1 ORDER BY version DESC LIMIT 10
        );
      `, [docId]);
    } catch (err) {
      console.error('[CMS:DB] PG saveUnifiedDocument error:', err);
    }
  }

  return savedDoc;
}

/**
 * Rolls back a document to a specific historical version
 */
export async function rollbackUnifiedDocument(documentId: string, targetVersion: number, userRole: string): Promise<UnifiedDocument> {
  if (userRole !== 'ADMIN') {
    const err = new Error('Unauthorized');
    (err as any).statusCode = 403;
    throw err;
  }

  let snapshotJson: string | null = null;

  if (pool && isPgConnected) {
    try {
      const res = await pool.query('SELECT snapshot_json FROM document_revisions WHERE document_id = $1 AND version = $2', [documentId, targetVersion]);
      if (res.rows.length > 0) {
        snapshotJson = res.rows[0].snapshot_json;
      }
    } catch (err) {}
  }

  if (!snapshotJson) {
    const rev = memoryRevisions.find(r => r.documentId === documentId && r.version === targetVersion);
    if (rev) snapshotJson = rev.snapshotJson;
  }

  if (!snapshotJson) {
    const notFound = new Error(`Revision ${targetVersion} not found for document ${documentId}`);
    (notFound as any).statusCode = 404;
    throw notFound;
  }

  const restored = JSON.parse(snapshotJson) as UnifiedDocument;
  const current = memoryDocuments.get(documentId);
  const nextVersion = (current?.version || targetVersion) + 1;

  restored.version = nextVersion;
  restored.updatedAt = new Date().toISOString();
  restored.contentModifiedAt = new Date().toISOString();

  return saveUnifiedDocument(restored, 'ADMIN', 'admin_rollback');
}

/**
 * Returns all saved revisions for a document (up to 10 stored)
 */
export async function getDocumentRevisions(documentId: string): Promise<DocumentRevision[]> {
  if (pool && isPgConnected) {
    try {
      const res = await pool.query(
        'SELECT * FROM document_revisions WHERE document_id = $1 ORDER BY version DESC',
        [documentId]
      );
      return res.rows.map(r => ({
        id: r.id,
        documentId: r.document_id,
        version: r.version,
        snapshotJson: r.snapshot_json,
        savedBy: r.saved_by,
        savedAt: r.saved_at
      }));
    } catch (err) {}
  }

  return memoryRevisions
    .filter(r => r.documentId === documentId)
    .sort((a, b) => b.version - a.version);
}

/**
 * Returns latest content modification timestamp across all documents (used for Stale-While-Revalidate caching)
 */
export async function getLatestContentTimestamp(): Promise<string> {
  if (pool && isPgConnected) {
    try {
      const res = await pool.query('SELECT MAX(updated_at) as latest FROM documents');
      if (res.rows[0]?.latest) {
        return new Date(res.rows[0].latest).toISOString();
      }
    } catch (err) {}
  }
  return latestMemoryTimestamp;
}

function mapRowToDocument(row: any): UnifiedDocument {
  let blocks: any[] = [];
  try {
    blocks = typeof row.blocks_json === 'string' ? JSON.parse(row.blocks_json) : (row.blocks_json || []);
  } catch (err) {}

  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    status: row.status,
    version: row.version,
    blocks,
    derivedPlainText: row.derived_plain_text || '',
    seoTitle: row.seo_title || row.title,
    seoDescription: row.seo_description || '',
    author: row.author,
    coverImage: row.cover_image || undefined,
    canonicalUrl: row.canonical_url || undefined,
    noindex: !!row.noindex,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
    updatedAt: new Date(row.updated_at).toISOString(),
    contentModifiedAt: new Date(row.content_modified_at).toISOString(),
  };
}
