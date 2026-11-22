import React, { useState, useEffect } from 'react';
import {
  Sliders,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Key,
  BookOpen,
  UserCheck,
  CreditCard,
  Mail,
  MapPin,
  Save,
  Wallet,
  Eye,
  Lock,
} from 'lucide-react';
import {
  DEFAULT_STORE_FEATURE_SETTINGS,
  StoreFeatureSettings,
  isValidIranianPhoneStrict,
  normalizeIranianPhoneStrict,
} from '../utils/iranianValidators';
import { toPersianDigits } from '../utils/supportChatStore';

type PaymentProviderType = 'zarinpal' | 'zibal' | 'idpay' | 'sandbox';

interface PaymentPublicConfig {
  provider: PaymentProviderType;
  sandbox: boolean;
  enabled: boolean;
  configured: boolean;
  hasMerchantId: boolean;
  maskedMerchantId: string;
  callbackUrl: string;
  source: 'env' | 'database' | 'unconfigured';
}

interface AdminSettingsViewProps {
  onPreviewLoader?: () => void;
}

type SmsProviderType = 'smsir' | 'kavenegar' | 'melipayamak' | 'ippanel' | 'custom';

interface SmsPublicConfig {
  provider: SmsProviderType;
  enabled: boolean;
  configured: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
  templateId: string;
  lineNumber: string;
  paramName: string;
  customUrl: string;
  source: 'env' | 'database' | 'unconfigured';
}

const PROVIDER_OPTIONS: Array<{
  id: SmsProviderType;
  title: string;
  badge?: string;
  desc: string;
}> = [
  {
    id: 'smsir',
    title: 'SMS.ir (ایده‌آل‌پیام)',
    badge: 'پیشنهادی',
    desc: 'ارسال سریع کد تایید (UltraFast Verify) با سرعت زیر ۳ ثانیه بدون نیاز به خط اختصاصی در الگوهای خدماتی',
  },
  {
    id: 'kavenegar',
    title: 'کاوه‌نگار (Kavenegar)',
    desc: 'ارسال الگو با متد verify/lookup یا ارسال عادی از طریق سرشماره',
  },
  {
    id: 'melipayamak',
    title: 'ملی‌پیامک (MeliPayamak)',
    desc: 'ارسال پترن اشتراکی خدماتی ویژه تایید شماره موبایل مشتریان',
  },
  {
    id: 'ippanel',
    title: 'IPPanel / فراز اس‌ام‌اس',
    desc: 'وب‌سرویس ارسال بر پایه پترن (Pattern Normal Send)',
  },
  {
    id: 'custom',
    title: 'وب‌سرویس اختصاصی (Webhook)',
    desc: 'ارسال POST امن با بدنه JSON به درگاه اختصاصی شما',
  },
];

const PAYMENT_PROVIDER_OPTIONS: Array<{
  id: PaymentProviderType;
  title: string;
  badge?: string;
  desc: string;
}> = [
  {
    id: 'zarinpal',
    title: 'زرین‌پال (Zarinpal v4)',
    badge: 'محبوب‌ترین',
    desc: 'اتصال مستقیم شاپرک با پشتیبانی از حالت سندباکس آزمایشی و مرچنت ۳۶ کاراکتری رسمی',
  },
  {
    id: 'zibal',
    title: 'زیبال (Zibal)',
    desc: 'درگاه پرداخت اینترنتی با تایید آنی تراکنش و تسویه شاپرک',
  },
  {
    id: 'idpay',
    title: 'آیدی‌پی (IDPay)',
    desc: 'پشتیبانی کامل از API پرداخت و سندباکس تستی برای بررسی فرآیند خرید',
  },
  {
    id: 'sandbox',
    title: 'حالت شبیه‌ساز داخلی (Sandbox)',
    desc: 'ثبت سفارش و تست کامل چرخه خرید بدون نیاز به کد مرچنت بانکی واقعی',
  },
];

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onPreviewLoader }) => {
  const [features, setFeatures] = useState<StoreFeatureSettings>(DEFAULT_STORE_FEATURE_SETTINGS);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [featureStatus, setFeatureStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const [smsStatus, setSmsStatus] = useState<SmsPublicConfig | null>(null);
  const [provider, setProvider] = useState<SmsProviderType>('smsir');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [paramName, setParamName] = useState('Code');
  const [customUrl, setCustomUrl] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [isSavingSms, setIsSavingSms] = useState(false);
  const [smsSaveFeedback, setSmsSaveFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Payment Gateway State
  const [paymentStatus, setPaymentStatus] = useState<PaymentPublicConfig | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProviderType>('zarinpal');
  const [merchantIdInput, setMerchantIdInput] = useState('');
  const [paymentSandbox, setPaymentSandbox] = useState(true);
  const [paymentCallbackUrl, setPaymentCallbackUrl] = useState('');
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentSaveFeedback, setPaymentSaveFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      const [featRes, smsRes, payRes] = await Promise.all([
        fetch('/api/v1/settings/store-features'),
        fetch('/api/v1/admin/integrations/sms'),
        fetch('/api/v1/admin/integrations/payment'),
      ]);
      if (featRes.ok) {
        const featData = await featRes.json();
        if (featData?.settings) {
          setFeatures({ ...DEFAULT_STORE_FEATURE_SETTINGS, ...featData.settings });
        }
      }
      if (smsRes.ok) {
        const smsData = await smsRes.json();
        const cfg: SmsPublicConfig | undefined = smsData?.config;
        if (cfg) {
          setSmsStatus(cfg);
          setProvider(cfg.provider || 'smsir');
          setTemplateId(cfg.templateId || '');
          setLineNumber(cfg.lineNumber || '');
          setParamName(cfg.paramName || 'Code');
          setCustomUrl(cfg.customUrl || '');
          setSmsEnabled(Boolean(cfg.enabled));
        }
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        const pCfg: PaymentPublicConfig | undefined = payData?.config;
        if (pCfg) {
          setPaymentStatus(pCfg);
          setPaymentProvider(pCfg.provider || 'zarinpal');
          setPaymentSandbox(Boolean(pCfg.sandbox));
          setPaymentCallbackUrl(pCfg.callbackUrl || '');
          setPaymentEnabled(Boolean(pCfg.enabled));
        }
      }
    } catch {}
  };

  const handleSaveFeatures = async (nextFeatures: StoreFeatureSettings) => {
    setFeatures(nextFeatures);
    setIsSavingFeatures(true);
    setFeatureStatus(null);
    try {
      const res = await fetch('/api/v1/admin/settings/store-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextFeatures),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeatureStatus({ ok: false, text: data?.error || 'خطا در ذخیره تنظیمات فیلدها.' });
        return;
      }
      if (data?.settings) {
        setFeatures({ ...DEFAULT_STORE_FEATURE_SETTINGS, ...data.settings });
      }
      setFeatureStatus({
        ok: true,
        text: 'تنظیمات فیلدهای اطلاعات کاربری و تسویه حساب بلافاصله در ویترین اعمال شد.',
      });
    } catch {
      setFeatureStatus({ ok: false, text: 'خطا در برقراری ارتباط با سرور.' });
    } finally {
      setIsSavingFeatures(false);
    }
  };

  const handleSaveSmsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSms(true);
    setSmsSaveFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/integrations/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKeyInput.trim(),
          templateId: templateId.trim(),
          lineNumber: lineNumber.trim(),
          paramName: paramName.trim() || 'Code',
          customUrl: customUrl.trim(),
          enabled: smsEnabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSmsSaveFeedback({ ok: false, text: data?.error || 'خطا در ذخیره تنظیمات درگاه پیامک.' });
        return;
      }
      if (data?.config) {
        setSmsStatus(data.config);
      }
      setApiKeyInput('');
      setSmsSaveFeedback({
        ok: true,
        text: data?.message || 'تنظیمات درگاه پیامک با امنیت کامل در سرور ذخیره شد.',
      });
    } catch {
      setSmsSaveFeedback({ ok: false, text: 'خطا در ذخیره تنظیمات درگاه پیامک.' });
    } finally {
      setIsSavingSms(false);
    }
  };

  const handleSendTestSms = async () => {
    const cleanPhone = normalizeIranianPhoneStrict(testPhone);
    if (!isValidIranianPhoneStrict(cleanPhone)) {
      setTestFeedback({
        ok: false,
        text: 'لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند 09123456789) وارد کنید.',
      });
      return;
    }
    setIsSendingTest(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/integrations/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestFeedback({ ok: false, text: data?.error || 'ارسال پیامک آزمایشی ناموفق بود.' });
        return;
      }
      setTestFeedback({
        ok: true,
        text: data?.message || `پیامک آزمایشی با موفقیت به ${toPersianDigits(cleanPhone)} ارسال شد.`,
      });
    } catch {
      setTestFeedback({ ok: false, text: 'خطا در ارتباط با سرور برای تست پیامک.' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    setPaymentSaveFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/integrations/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: paymentProvider,
          merchantId: merchantIdInput.trim(),
          sandbox: paymentSandbox,
          callbackUrl: paymentCallbackUrl.trim(),
          enabled: paymentEnabled,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPaymentSaveFeedback({ ok: false, text: data?.error || 'خطا در ذخیره تنظیمات درگاه پرداخت.' });
        return;
      }
      if (data?.config) {
        setPaymentStatus(data.config);
      }
      setMerchantIdInput('');
      setPaymentSaveFeedback({
        ok: true,
        text: data?.message || 'تنظیمات درگاه پرداخت با امنیت کامل در سرور ذخیره شد.',
      });
    } catch {
      setPaymentSaveFeedback({ ok: false, text: 'خطا در ذخیره تنظیمات درگاه پرداخت.' });
    } finally {
      setIsSavingPayment(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans text-[var(--text-main)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[var(--badge-bg)] border border-[var(--border-active)] flex items-center justify-center text-[var(--accent-primary)]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--text-main)]">
              مدیریت اطلاعات کاربری و اتصال درگاه پیامک (SMS.ir)
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              کنترل روشن/خاموش فیلد کد ملی، صحت‌سنجی ایمیل و کد پستی، و تنظیم امن درگاه پیامکی احراز هویت
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            smsStatus?.configured
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
          }`}
        >
          {smsStatus?.configured
            ? `درگاه پیامک فعال (${smsStatus.provider})`
            : 'درگاه پیامک هنوز متصل نشده'}
        </span>
      </div>

      {/* SECTION 1: CUSTOMER PROFILE FIELD CONTROLS */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
          <UserCheck className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">
            ۱. کنترل فیلدهای اطلاعات کاربری و تسویه حساب
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* National ID Toggle */}
          <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[var(--text-main)]">نمایش فیلد کد ملی در پروفایل و تسویه حساب</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    با روشن بودن این گزینه، فیلد کد ملی ۱۰ رقمی همراه با الگوریتم صحت‌سنجی رسمی برای مشتریان نمایش داده می‌شود.
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingFeatures}
                onClick={() =>
                  void handleSaveFeatures({
                    ...features,
                    enableNationalId: !features.enableNationalId,
                  })
                }
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer transition-colors ${
                  features.enableNationalId
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                }`}
              >
                {features.enableNationalId ? 'روشن' : 'خاموش'}
              </button>
            </div>

            {features.enableNationalId && (
              <div className="pt-2.5 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[var(--text-secondary)]">الزامی بودن کد ملی برای ثبت نهایی:</span>
                <button
                  type="button"
                  disabled={isSavingFeatures}
                  onClick={() =>
                    void handleSaveFeatures({
                      ...features,
                      requireNationalId: !features.requireNationalId,
                    })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                    features.requireNationalId
                      ? 'bg-[var(--accent-primary)] text-[#F7F3EA]'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                  }`}
                >
                  {features.requireNationalId ? 'الزامی' : 'اختیاری'}
                </button>
              </div>
            )}
          </div>

          {/* Email & Postal Code Controls */}
          <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-[var(--text-main)]">فیلد ایمیل با صحت‌سنجی زنده</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                    بررسی خودکار ساختار معتبر ایمیل در پنل کاربری و مرحله ثبت آدرس خریدار.
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingFeatures}
                onClick={() =>
                  void handleSaveFeatures({
                    ...features,
                    enableEmail: !features.enableEmail,
                  })
                }
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 cursor-pointer transition-colors ${
                  features.enableEmail
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                }`}
              >
                {features.enableEmail ? 'روشن' : 'خاموش'}
              </button>
            </div>

            <div className="pt-2.5 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>الزامی بودن کد پستی ۱۰ رقمی در دفترچه آدرس و خرید:</span>
              </div>
              <button
                type="button"
                disabled={isSavingFeatures}
                onClick={() =>
                  void handleSaveFeatures({
                    ...features,
                    requirePostalCode: !features.requirePostalCode,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  features.requirePostalCode
                    ? 'bg-[var(--accent-primary)] text-[#F7F3EA]'
                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                }`}
              >
                {features.requirePostalCode ? 'الزامی' : 'اختیاری'}
              </button>
            </div>
          </div>
        </div>

        {featureStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              featureStatus.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
          >
            {featureStatus.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{featureStatus.text}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: SMS GATEWAY INTEGRATION + STEP-BY-STEP SMS.IR GUIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 cols) */}
        <form
          onSubmit={handleSaveSmsConfig}
          className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm text-xs"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                ۲. تنظیمات اتصال درگاه پیامک (SMS.ir / کاوه‌نگار / ملی‌پیامک)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSmsEnabled((prev) => !prev)}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer ${
                smsEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
              }`}
            >
              {smsEnabled ? 'ارسال پیامک فعال' : 'ارسال پیامک غیرفعال'}
            </button>
          </div>

          {/* Provider selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-[var(--text-main)] block">سرویس‌دهنده پیامک</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PROVIDER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProvider(opt.id)}
                  className={`text-right p-3 rounded-xl border transition-colors cursor-pointer ${
                    provider === opt.id
                      ? 'bg-[var(--badge-bg)] border-[var(--accent-primary)]'
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 font-bold text-[var(--text-main)]">
                    <span>{opt.title}</span>
                    {opt.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] text-[10px]">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <label className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>کلید API سرویس پیامک (x-api-key)</span>
                </label>
                {smsStatus?.hasApiKey && (
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    کلید فعلی ({smsStatus.source === 'env' ? 'Env سرور' : 'ذخیره رمزنگاری‌شده'}):{' '}
                    {smsStatus.maskedApiKey}
                  </span>
                )}
              </div>
              <input
                type="password"
                dir="ltr"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={
                  smsStatus?.hasApiKey
                    ? 'برای تغییر کلید مقدار جدید را وارد کنید (در غیر این صورت خالی بگذارید)'
                    : 'کلید API دریافتی از پنل sms.ir یا سرویس‌دهنده'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
              />
            </div>

            {provider !== 'custom' && (
              <>
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-main)] block">
                    {provider === 'smsir'
                      ? 'شناسه الگو (Template ID) برای ارسال سریع'
                      : 'نام یا شناسه پترن / الگو'}
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder={provider === 'smsir' ? 'مثلاً 100000' : 'verify-code'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-main)] block">
                    نام پارامتر کد داخل الگو
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={paramName}
                    onChange={(e) => setParamName(e.target.value)}
                    placeholder="Code"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-[var(--text-main)] block">
                    شماره خط اختصاصی (اختیاری — برای ارسال بدون الگو)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={lineNumber}
                    onChange={(e) => setLineNumber(e.target.value)}
                    placeholder="30007732000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
                  />
                </div>
              </>
            )}

            {provider === 'custom' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[var(--text-main)] block">آدرس وب‌سرویس اختصاصی (HTTPS)</label>
                <input
                  type="url"
                  dir="ltr"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://sms-gateway.example.ir/send"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
                />
              </div>
            )}
          </div>

          {smsSaveFeedback && (
            <div
              className={`p-3 rounded-xl font-bold flex items-center gap-2 border ${
                smsSaveFeedback.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
            >
              {smsSaveFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{smsSaveFeedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>کلیدها با استاندارد AES-256 روی سرور ذخیره می‌شوند و هرگز به مرورگر ارسال نمی‌گردند.</span>
            </span>

            <button
              type="submit"
              disabled={isSavingSms}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 text-[#F7F3EA] font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSms ? 'در حال ذخیره...' : 'ذخیره تنظیمات درگاه پیامک'}</span>
            </button>
          </div>

          {/* Live Test Box */}
          <div className="pt-4 mt-4 border-t border-[var(--border-color)] space-y-2.5">
            <label className="font-bold text-[var(--text-main)] block">
              تست زنده ارسال کد تایید پیامکی:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="tel"
                dir="ltr"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="09123456789"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none tabular-nums"
              />
              <button
                type="button"
                disabled={isSendingTest}
                onClick={() => void handleSendTestSms()}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-active)] text-[var(--accent-primary)] font-bold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTest ? 'در حال ارسال...' : 'ارسال پیامک آزمایشی'}</span>
              </button>
            </div>
            {testFeedback && (
              <div
                className={`text-xs font-bold ${
                  testFeedback.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {testFeedback.text}
              </div>
            )}
          </div>
        </form>

        {/* Step-by-step Persian Guide Card (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
            <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              راهنمای گام‌به‌گام اتصال SMS.ir به فروشگاه
            </h3>
          </div>

          <ol className="space-y-3 text-[var(--text-secondary)] leading-[1.8] list-decimal pr-4">
            <li>
              <strong className="text-[var(--text-main)]">دریافت کلید API از پنل sms.ir:</strong> پس از ورود به
              حساب کاربری خود در سایت <span className="font-mono" dir="ltr">sms.ir</span>، وارد بخش{' '}
              <strong className="text-[var(--text-main)]">توسعه‌دهندگان / کلیدهای دسترسی (API Key)</strong> شوید و
              یک کلید جدید بسازید. (در بخش محدودیت IP یا بدون محدودیت بر اساس IP سرور تنظیم کنید).
            </li>
            <li>
              <strong className="text-[var(--text-main)]">ساخت الگوی ارسال سریع (UltraFast Verify):</strong> در منوی{' '}
              <strong className="text-[var(--text-main)]">ارسال سریع / وریفای</strong> پنل sms.ir یک الگو ثبت کنید؛
              برای مثال:
              <div className="mt-1.5 p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-main)]" dir="rtl">
                کد تایید حساب شما در فروشگاه گُردیه: <span dir="ltr">#Code#</span>
              </div>
            </li>
            <li>
              <strong className="text-[var(--text-main)]">وارد کردن شناسه الگو و کلید در همین صفحه:</strong> پس از تایید الگو توسط
              پشتیبانی sms.ir، عدد{' '}
              <strong className="text-[var(--text-main)]">Template ID</strong> را در فیلد «شناسه الگو» و{' '}
              <strong className="text-[var(--text-main)]">API Key</strong> را در فرم سمت راست وارد و ذخیره کنید.
            </li>
            <li>
              <strong className="text-[var(--text-main)]">روش جایگزین با متغیر محیطی سرور (.env):</strong> برای محیط‌های
              تولید می‌توانید مقادیر <span className="font-mono" dir="ltr">SMS_PROVIDER=smsir</span>،{' '}
              <span className="font-mono" dir="ltr">SMSIR_API_KEY</span> و{' '}
              <span className="font-mono" dir="ltr">SMSIR_TEMPLATE_ID</span> را مستقیم در متغیرهای محیطی سرور
              قرار دهید تا بدون ذخیره در دیتابیس نیز فعال شود.
            </li>
          </ol>

          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
            <div className="font-bold text-[var(--text-main)]">رفتار هوشمند چت‌بات بدون درگاه پیامک:</div>
            <p className="text-[11px] text-[var(--text-muted)] leading-[1.8]">
              تا زمانی که درگاه پیامک متصل نشده باشد، هیچ کد ساختگی تولید نمی‌شود؛ چت‌بات نام کاربری (شماره موبایل) و اسم دلخواه مشتری را به‌صورت مهمان تا{' '}
              <strong className="text-[var(--text-main)]">یک سال (۳۶۵ روز)</strong> محفوظ نگه می‌دارد.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: PAYMENT GATEWAY (ZARINPAL / ZIBAL / IDPAY / SANDBOX) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSavePaymentConfig}
          className="lg:col-span-7 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm text-xs"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                ۳. تنظیمات درگاه پرداخت آنلاین (زرین‌پال، زیبال، آیدی‌پی)
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setPaymentEnabled((prev) => !prev)}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer ${
                paymentEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
              }`}
            >
              {paymentEnabled ? 'درگاه فعال' : 'درگاه غیرفعال'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PAYMENT_PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaymentProvider(opt.id)}
                className={`text-right p-3 rounded-xl border transition-colors cursor-pointer ${
                  paymentProvider === opt.id
                    ? 'bg-[var(--badge-bg)] border-[var(--accent-primary)]'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-bold text-[var(--text-main)]">
                  <span>{opt.title}</span>
                  {opt.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] text-[10px]">
                      {opt.badge}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  {opt.desc}
                </div>
              </button>
            ))}
          </div>

          {paymentProvider !== 'sandbox' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>کد پذیرنده / Merchant ID درگاه</span>
                  </label>
                  {paymentStatus?.hasMerchantId && (
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      مقدار فعلی ({paymentStatus.source === 'env' ? 'Env سرور' : 'رمزنگاری‌شده'}):{' '}
                      {paymentStatus.maskedMerchantId}
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  dir="ltr"
                  value={merchantIdInput}
                  onChange={(e) => setMerchantIdInput(e.target.value)}
                  placeholder={
                    paymentStatus?.hasMerchantId
                      ? 'برای تغییر کد مرچنت مقدار جدید را وارد کنید (در غیر این صورت خالی بگذارید)'
                      : 'مثلاً کد ۳۶ کاراکتری Merchant ID از پنل زرین‌پال یا API Key آیدی‌پی'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[var(--text-main)] block">
                  آدرس بازگشت از بانک (Callback URL — اختیاری)
                </label>
                <input
                  type="url"
                  dir="ltr"
                  value={paymentCallbackUrl}
                  onChange={(e) => setPaymentCallbackUrl(e.target.value)}
                  placeholder="https://yourdomain.ir/?payment_callback=1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-[var(--text-main)] outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setPaymentSandbox((prev) => !prev)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold cursor-pointer transition-colors ${
                    paymentSandbox
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {paymentSandbox ? 'حالت تستی درگاه (Sandbox) روشن است' : 'حالت واقعی پرداخت (Production Live)'}
                </button>
              </div>
            </div>
          )}

          {paymentSaveFeedback && (
            <div
              className={`p-3 rounded-xl font-bold flex items-center gap-2 border ${
                paymentSaveFeedback.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
            >
              {paymentSaveFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{paymentSaveFeedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[var(--text-muted)]">
              وضعیت فعلی:{' '}
              <strong className="text-[var(--text-main)]">
                {paymentStatus?.configured
                  ? `متصل (${paymentStatus.provider}${paymentStatus.sandbox ? ' - Sandbox' : ' - Live'})`
                  : 'شبیه‌ساز داخلی تسویه حساب فعال است (بدون انتقال بانکی)'}
              </strong>
            </span>

            <button
              type="submit"
              disabled={isSavingPayment}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 text-[#F7F3EA] font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingPayment ? 'در حال ذخیره...' : 'ذخیره تنظیمات درگاه پرداخت'}</span>
            </button>
          </div>
        </form>

        {/* Step-by-step Payment & Loader Inspection Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 shadow-sm text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-color)]">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                معماری پرداخت و امنیت تایید تراکنش
              </h3>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-[1.85]">
              موتور تراکنش گُردیه (<span className="font-mono" dir="ltr">PaymentStateMachine</span>) از کلید یکتا
              (Idempotency Key)، بررسی امضای HMAC و تطبیق دقیق مبلغ سرور پشتیبانی می‌کند تا هیچ پرداختی تکراری یا با دستکاری مبلغ تایید نشود. تا قبل از وارد کردن Merchant ID رسمی، سیستم در حالت شبیه‌ساز امن کار می‌کند و با ثبت مرچنت زرین‌پال/زیبال/آیدی‌پی به درگاه واقعی متصل می‌شود.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 shadow-sm text-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">
                  ۴. تست و بررسی صفحه لودینگ گُردیه
                </h3>
              </div>
              {onPreviewLoader && (
                <button
                  type="button"
                  onClick={onPreviewLoader}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold cursor-pointer shadow-sm"
                >
                  مشاهده پیش‌نمایش تمام‌صفحه
                </button>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-[1.85]">
              به‌دلیل سبک بودن صفحه و پریلود لوگوی WebP، لودینگ اولیه در کمتر از نیم‌ثانیه محو می‌شود. برای دیدن دقیق انیمیشن طاق ایرانی و متن زیر آن، دکمه بالا را بزنید یا به انتهای آدرس سایت پارامتر{' '}
              <span className="font-mono font-bold text-[var(--text-main)]" dir="ltr">?preview_loader=1</span> اضافه کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
