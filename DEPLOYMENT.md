# گُردیه (Commerce OS) — راهنمای استقرار و امنیت روی لیارا (Liara PaaS)

این سند راهنمای گام‌به‌گام استقرار نسخه‌ی سخت‌سازی‌شده‌ی فروشگاه گُردیه در **لیارا** (یا سرورهای داکر/لینوکس) است.

---

## ۱. پیش‌نیازهای سخت‌سازی‌شده (Production Checklist)

سرور در حالت `NODE_ENV=production` به‌صورت **Fail-Closed** راه‌اندازی می‌شود؛ یعنی اگر کلیدهای امنیتی زیر تنظیم نشده باشند یا برابر مقادیر پیش‌فرض لو‌رفته باشند، سرور عمداً استارت نمی‌خورد:

- `ADMIN_SECRET_KEY`: حداقل ۲۴ کاراکتر تصادفی (`openssl rand -hex 24`)
- `ADMIN_PASSWORD`: حداقل ۱۲ کاراکتر (`openssl rand -base64 16`) — رمز ورود به پنل `/admin` و `/tasks` با نام کاربری `admin`
- `DB_ENCRYPTION_KEY`: کلید ۶۴ کاراکتری هگز (`openssl rand -hex 32`) برای رمزنگاری AES-256-GCM اطلاعات حساس در SQLite
- `PAYMENT_GATEWAY_SECRET`: کلید ۶۴ کاراکتری هگز (`openssl rand -hex 32`) برای امضای HMAC کال‌بک‌های درگاه پرداخت

---

## ۲. تنظیم دیسک پایدار و دیتابیس در لیارا

1. **ساخت دیسک پایدار (`commerce-data`)**:
   - در پنل لیارا به بخش **دیسک‌ها** بروید و دیسکی با نام `commerce-data` (پیشنهادی حداقل ۲ گیگابایت) بسازید.
   - این دیسک طبق فایل `liara.json` روی مسیر `/data` مونت می‌شود.
   - فایل دیتابیس SQLite در مسیر `/data/commerce.db` و فایل‌های آپلودشده در مسیر `/data/uploads` نگه‌داری می‌شوند (مسیر `/uploads/*` به‌صورت خودکار توسط سرور سرو می‌شود).
   - **توجه**: به دلیل استفاده از SQLite در حالت WAL، تعداد نمونه (Replicas) برنامه باید روی **۱** باقی بماند.

2. **دیتابیس PostgreSQL برای CMS**:
   - از بخش دیتابیس‌های لیارا یک **PostgreSQL** بسازید و رشته اتصال آن را در متغیر `DATABASE_URL` یا `LIARA_POSTGRES_URL` قرار دهید تا اسناد، مقالات و تاریخچه تغییرات CMS پس از ری‌استارت حفظ شوند.

---

## ۳. متغیرهای محیطی پیشنهادی در کنسول لیارا

```env
NODE_ENV=production
PORT=3000
APP_URL=https://gordiyeh.ir
COMMERCE_DB_PATH=/data/commerce.db
UPLOADS_DIR=/data/uploads
DB_ENCRYPTION_KEY=<خروجی openssl rand -hex 32>
DB_ENCRYPTION_KEY_ID=k1
ADMIN_SECRET_KEY=<خروجی openssl rand -hex 24>
ADMIN_PASSWORD=<رمز قوی حداقل ۱۲ کاراکتر>
PAYMENT_GATEWAY_SECRET=<خروجی openssl rand -hex 32>
DATABASE_URL=<آدرس اتصال PostgreSQL لیارا>
WEBHOOK_ALLOW_LOOPBACK=false
GEMINI_API_KEY=<کلید Gemini در صورت استفاده از چت هوشمند>
```

---

## ۴. درگاه پرداخت بانکی و تایید تراکنش (Zarinpal / Zibal / IDPay)

- پس از بازگشت کاربر از صفحه بانک با پارامتر `?payment_callback=1&...`، فرانت‌اند به‌صورت خودکار درخواست استعلام سرور-به-سرور را به `POST /api/v1/payment/verify` می‌فرستد.
- در صورت ناموفق بودن یا لغو پرداخت، موجودی کالاهای رزروشده با رمزگشایی امن سفارش بلافاصله به انبار برگردانده می‌شود.
- مرچنت‌کد درگاه را می‌توانید در `/admin` بخش تنظیمات (ذخیره با رمزنگاری AES-256-GCM) یا از طریق متغیرهای محیطی تنظیم کنید.

---

## ۵. استقرار با Liara CLI

```bash
npm i -g @liara/cli
liara login
liara deploy
```

فایل `liara.json` به‌صورت خودکار پلتفرم `node` (نسخه‌ی `>=22.13.0` تعریف‌شده در `package.json`)، پورت `3000`، دستور بیلد `npm run build` و مونت دیسک `commerce-data -> /data` را تنظیم می‌کند.
