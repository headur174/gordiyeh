import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Sliders,
  RefreshCw,
  Copy,
  Layers,
  Bot,
  Check,
  Share2,
} from 'lucide-react';
import { CanonicalProduct } from '../../types';

interface ContentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: CanonicalProduct | null;
  onApplyContentToProduct?: (productId: string, generatedData: any) => void;
  onApplyGeneratedContent?: (generatedData: any) => void;
  onOpenSocialPublisher?: (product: CanonicalProduct) => void;
}

export const ContentStudioModal: React.FC<ContentStudioModalProps> = ({
  isOpen,
  onClose,
  product,
  onApplyContentToProduct,
  onApplyGeneratedContent,
  onOpenSocialPublisher,
}) => {
  if (!isOpen) return null;

  const [delegation, setDelegation] = useState({
    seoTitle: true,
    review: true,
    prosCons: true,
    specs: true,
    metaDescription: true,
    retargetingSms: true,
    socialPost: true,
  });

  const [generatorSource, setGeneratorSource] = useState<'SITE_AI' | 'MY_GENERATOR_WEBHOOK' | 'MANUAL_HYBRID'>('SITE_AI');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [brandVoice, setBrandVoice] = useState('فروشگاهی، متمرکز بر ارزش خرید و اعتمادساز');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'results' | 'webhook'>('matrix');

  const [generatedResult, setGeneratedResult] = useState<{
    seoTitle?: string;
    shortPitch?: string;
    expertReview?: string;
    pros?: string[];
    cons?: string[];
    metaDescription?: string;
    retargetingSms?: string;
    socialCaption?: string;
    tags?: string[];
  } | null>(() => ({
    seoTitle: product ? `بررسی، قیمت و مشخصات خرید ${product.title} | گارانتی اصالت` : '',
    shortPitch: product ? `${product.title} با عملکرد کم‌نظیر و کیفیت ساخت مهندسی، یکی از هوشمندانه‌ترین انتخاب‌ها در رده قیمتی خود است.` : '',
    expertReview: product
      ? `بررسی تخصصی ما نشان می‌دهد که ${product.title} با تکیه بر متریال درجه‌یک و هماهنگی کم‌نظیر سخت‌افزاری، تجربه کاربری بی‌نقصی ارائه می‌دهد. پایداری حرارتی و دوام بالا از مزیت‌های شاخص این مدل به شمار می‌رود.`
      : '',
    pros: ['کیفیت ساخت ممتاز و ارگونومی بالا', 'ارزش خرید عالی در برابر رقبای هم‌رده', 'گارانتی معتبر شرکتی'],
    cons: ['تعداد محدود در انبار در فصول تخفیف', 'نیاز به خواندن راهنمای راه‌اندازی اولیه'],
    metaDescription: product ? `خرید ${product.title} با ضمانت ۷ روزه بازگشت وجه، ارسال اکسپرس و کمترین قیمت بازار در فروشگاه گُردیه.` : '',
    retargetingSms: product ? `تخفیف ویژه سفارش ${product.title}! فقط تا ۱۲ ساعت آینده با ارسال رایگان. کد تخفیف: FASTBUY` : '',
    socialCaption: product ? `معرفی محصول جدید: ${product.title}\n\nتضمین کمترین قیمت و اصالت قطعی کالا.\nسفارش آنلاین با ضمانت بازگشت وجه ۷ روزه.` : '',
    tags: product ? [product.category, 'اصالت_کالا', 'ارسال_اکسپرس', 'تخفیف'] : [],
  }));

  React.useEffect(() => {
    if (product) {
      setGeneratedResult({
        seoTitle: `بررسی، قیمت و مشخصات خرید ${product.title} | گارانتی اصالت`,
        shortPitch: `${product.title} با عملکرد کم‌نظیر و کیفیت ساخت مهندسی، یکی از هوشمندانه‌ترین انتخاب‌ها در رده قیمتی خود است.`,
        expertReview: `بررسی تخصصی ما نشان می‌دهد که ${product.title} با تکیه بر متریال درجه‌یک و هماهنگی کم‌نظیر سخت‌افزاری، تجربه کاربری بی‌نقصی ارائه می‌دهد. پایداری حرارتی و دوام بالا از مزیت‌های شاخص این مدل به شمار می‌رود.`,
        pros: ['کیفیت ساخت ممتاز و ارگونومی بالا', 'ارزش خرید عالی در برابر رقبای هم‌رده', 'گارانتی معتبر شرکتی'],
        cons: ['تعداد محدود در انبار در فصول تخفیف', 'نیاز به خواندن راهنمای راه‌اندازی اولیه'],
        metaDescription: `خرید ${product.title} با ضمانت ۷ روزه بازگشت وجه، ارسال اکسپرس و کمترین قیمت بازار در فروشگاه گُردیه.`,
        retargetingSms: `تخفیف ویژه سفارش ${product.title}! فقط تا ۱۲ ساعت آینده با ارسال رایگان. کد تخفیف: FASTBUY`,
        socialCaption: `معرفی محصول جدید: ${product.title}\n\nتضمین کمترین قیمت و اصالت قطعی کالا.\nسفارش آنلاین با ضمانت بازگشت وجه ۷ روزه.`,
        tags: [product.category, 'اصالت_کالا', 'ارسال_اکسپرس', 'تخفیف'],
      });
    }
  }, [product?.id]);

  const handleToggleDelegation = (key: keyof typeof delegation) => {
    setDelegation((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'PRODUCT',
          productTitle: product?.title || 'محصول منتخب',
          category: product?.category || 'کالای دیجیتال',
          brand: product?.brand || product?.brandFa || '',
          features: product?.keyFeatures || ['کیفیت درجه یک', 'گارانتی معتبر'],
          price: product?.retailPrice || (product as any)?.sellPrice || 0,
          delegation,
          customPrompt: customInstructions,
          customVoice: brandVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setGeneratedResult(data.data);
          setActiveTab('results');
        }
      }
    } catch (e) {
      console.error('Error generating content:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApply = () => {
    if (product && generatedResult) {
      onApplyContentToProduct?.(product.id, generatedResult);
      onApplyGeneratedContent?.(generatedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center text-[#F7F3EA] shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                <span>استودیوی هوشمند تولید و تفویض محتوا</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)]">
                  AI & Custom Generator
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {product ? `متصل به محصول: ${product.title}` : 'تولید محتوای هوشمند برای مقالات و صفحات'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-[var(--border-color)] bg-[var(--bg-main)] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-[var(--accent-primary)] text-[var(--accent-text)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            ماتریس تفویض وظایف
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'results'
                ? 'border-[var(--accent-primary)] text-[var(--accent-text)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            پیش‌نمایش و محتوای تولیدشده
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'webhook'
                ? 'border-[var(--accent-primary)] text-[var(--accent-text)] font-bold'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            اتصال به ابزار تولید محتوای شما
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right">
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* Generator Source Selector */}
              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] space-y-3">
                <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[var(--accent-text)]" />
                  موتور اصلی پردازش و تولید:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setGeneratorSource('SITE_AI')}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                      generatorSource === 'SITE_AI'
                        ? 'border-[var(--border-active)] bg-[var(--accent-soft)] text-[var(--text-main)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">هوش مصنوعی خود سایت</span>
                      {generatorSource === 'SITE_AI' && <CheckCircle2 className="w-4 h-4 text-[var(--accent-text)] shrink-0" />}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">تولید سریع با قوانین بهینه‌سازی فروشگاهی</span>
                  </button>

                  <button
                    onClick={() => setGeneratorSource('MY_GENERATOR_WEBHOOK')}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                      generatorSource === 'MY_GENERATOR_WEBHOOK'
                        ? 'border-amber-500 bg-amber-500/15 text-[var(--text-main)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">ابزار تولید محتوای اختصاصی من</span>
                      {generatorSource === 'MY_GENERATOR_WEBHOOK' && <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">ارسال به API / وب‌هوک نرم‌افزار شما و بازگشت متن</span>
                  </button>

                  <button
                    onClick={() => setGeneratorSource('MANUAL_HYBRID')}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                      generatorSource === 'MANUAL_HYBRID'
                        ? 'border-emerald-500 bg-emerald-500/15 text-[var(--text-main)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-main)]">حالت هیبریدی و ویرایش دستی</span>
                      {generatorSource === 'MANUAL_HYBRID' && <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">ترکیب اسکلت هوشمند با بازبینی و نگارش تیم محتوا</span>
                  </button>
                </div>
              </div>

              {/* Granular Delegation Matrix */}
              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent-text)]" />
                    ماتریس تعیین سهم نگارش بخش‌های صفحه
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    مشخص کنید کدام المان‌ها توسط موتور هوشمند نوشته شوند و کدام المان‌ها توسط ابزار اختصاصی شما تکمیل گردند.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {[
                    { key: 'seoTitle' as const, title: 'عنوان سئو و H1 فروشگاهی', desc: 'شامل کلمات کلیدی پرجستجو و برند معتبر' },
                    { key: 'review' as const, title: 'نقد و بررسی تخصصی (Review)', desc: 'بررسی دقیق و تجربه‌ی استفاده‌ی واقعی' },
                    { key: 'prosCons' as const, title: 'نقاط قوت و ضعف صریح', desc: 'نکات کلیدی تصمیم‌گیری خریدار در یک نگاه' },
                    { key: 'specs' as const, title: 'جدول خلاصه مشخصات فنی', desc: 'استخراج خودکار از کاتالوگ سازنده کالا' },
                    { key: 'metaDescription' as const, title: 'توضیحات متای گوگل (Meta Description)', desc: 'حداکثر ۱۶۰ کاراکتر با نرخ کلیک بالا' },
                    { key: 'retargetingSms' as const, title: 'پیامک فروش و ریتارگتینگ خریدار', desc: 'متن کوتاه پیامکی به همراه کد تخفیف اختصاصی' },
                    { key: 'socialPost' as const, title: 'کپشن شبکه‌های اجتماعی (اینستاگرام و تلگرام)', desc: 'هشتگ‌گذاری هوشمند و دعوت به اقدام', fullSpan: true },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`p-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-color)] flex items-center justify-between gap-2 ${
                        item.fullSpan ? 'md:col-span-2' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-main)]">{item.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => handleToggleDelegation(item.key)}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                          delegation[item.key]
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)]'
                            : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                        }`}
                      >
                        {delegation[item.key] ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Voice & Prompt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1">لحن و صدای برند (Brand Voice):</label>
                  <input
                    type="text"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                    placeholder="مثال: تخصصی، دوستانه و جوان‌پسند"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1">دستور یا پرامپت اختصاصی اضافه:</label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                    placeholder="مثال: روی حذف نویز فعال و گارانتی ۱۸ ماهه تاکید ویژه‌ای شود"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && generatedResult && (
            <div className="space-y-4">
              {/* SEO Title */}
              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--accent-text)]">عنوان سئو و عنوان فروشگاهی:</span>
                  <button
                    onClick={() => copyToClipboard(generatedResult.seoTitle || '', 'seoTitle')}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'seoTitle' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'seoTitle' ? 'کپی شد' : 'کپی'}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-main)] font-medium">{generatedResult.seoTitle}</p>
              </div>

              {/* Short Pitch */}
              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--accent-text)]">خلاصه معرفی کالا (قلاب اولیه):</span>
                  <button
                    onClick={() => copyToClipboard(generatedResult.shortPitch || '', 'shortPitch')}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'shortPitch' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    کپی
                  </button>
                </div>
                <p className="text-xs text-[var(--text-main)] leading-relaxed">{generatedResult.shortPitch}</p>
              </div>

              {/* Expert Review */}
              <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--accent-text)]">نقد و بررسی کارشناسی (In-Depth Review):</span>
                  <button
                    onClick={() => copyToClipboard(generatedResult.expertReview || '', 'expertReview')}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'expertReview' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    کپی
                  </button>
                </div>
                <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-line">{generatedResult.expertReview}</p>
              </div>

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-2">نقاط قوت (مزایا):</span>
                  <ul className="space-y-1.5 text-xs text-[var(--text-main)]">
                    {generatedResult.pros?.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-2">نقاط ضعف و چالش‌ها:</span>
                  <ul className="space-y-1.5 text-xs text-[var(--text-main)]">
                    {generatedResult.cons?.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Meta and SMS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[var(--bg-main)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[11px] font-bold text-[var(--accent-text)] block mb-1">متاتگ گوگل (Meta Description):</span>
                  <p className="text-xs text-[var(--text-main)]">{generatedResult.metaDescription}</p>
                </div>
                <div className="bg-[var(--bg-main)] p-3.5 rounded-xl border border-[var(--border-color)]">
                  <span className="text-[11px] font-bold text-[var(--accent-text)] block mb-1">متن پیامک ریتارگتینگ (SMS):</span>
                  <p className="text-xs text-[var(--text-main)]">{generatedResult.retargetingSms}</p>
                </div>
              </div>

              {/* Social Caption & Quick Action */}
              <div className="bg-[var(--accent-soft)] p-4 rounded-xl border border-[var(--border-active)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[var(--accent-text)] block mb-1">کپشن شبکه‌های اجتماعی آماده انتشار</span>
                  <p className="text-xs text-[var(--text-main)] line-clamp-2">{generatedResult.socialCaption}</p>
                </div>
                {product && onOpenSocialPublisher && (
                  <button
                    onClick={() => {
                      onOpenSocialPublisher(product);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-medium flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    انتشار در اینستاگرام و تلگرام
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-text)]">
                  <Bot className="w-4 h-4" />
                  اتصال به ابزار تولید محتوای شما از طریق Webhook / API
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  اگر نرم‌افزار، اسکریپت یا موتور تولید محتوای اختصاصی خود را روی سرور یا ابزارهایی مانند n8n، Make، یا پایتون اجرا می‌کنید، آدرس Endpoint آن را در زیر وارد کنید.
                </p>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1">Webhook Endpoint URL:</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--border-active)]"
                    placeholder="https://n8n.yourdomain.ir/webhook/content-studio"
                  />
                </div>
                <div className="p-3 bg-[var(--bg-card)] rounded-lg text-[11px] text-[var(--text-muted)] font-mono">
                  Payload ارسالی شامل: {'{'} productTitle, category, brand, features, delegationMatrix {'}'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Bot className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
            <span>موتور قوانین و تولید محتوای گُردیه</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال تولید هوشمند محتوا...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  اجرای تولید محتوا بر اساس ماتریس
                </>
              )}
            </button>

            {activeTab === 'results' && product && onApplyContentToProduct && (
              <button
                onClick={handleApply}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                ذخیره و درج در شناسنامه کالا
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
