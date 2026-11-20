import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Sliders,
  Send,
  RefreshCw,
  Copy,
  Layers,
  Bot,
  UserCheck,
  Check,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  Share2
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
  onOpenSocialPublisher
}) => {
  if (!isOpen) return null;

  // Delegation Matrix State: Which parts does the site write vs custom content generator
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
  const [webhookUrl, setWebhookUrl] = useState('https://api.my-content-studio.com/v1/generate');
  const [brandVoice, setBrandVoice] = useState('فروشگاهی، متمرکز بر ارزش خرید و اعتمادساز');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'results' | 'webhook'>('matrix');

  // Generated Content State
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
    expertReview: product ? `بررسی تخصصی ما نشان می‌دهد که ${product.title} با تکیه بر متریال درجه‌یک و هماهنگی کم‌نظیر سخت‌افزاری، تجربه کاربری بی‌نقصی ارائه می‌دهد. پایداری حرارتی و دوام بالا از مزیت‌های شاخص این مدل به شمار می‌رود.` : '',
    pros: ['کیفیت ساخت ممتاز و ارگونومی بالا', 'ارزش خرید عالی در برابر رقبای هم‌رده', 'گارانتی معتبر شرکتی'],
    cons: ['تعداد محدود در انبار در فصول تخفیف', 'نیاز به خواندن راهنمای راه‌اندازی اولیه'],
    metaDescription: product ? `خرید ${product.title} با ضمانت ۷ روزه بازگشت وجه، ارسال اکسپرس و کمترین قیمت بازار در فروشگاه آنلاین کامرس او اس.` : '',
    retargetingSms: product ? `تخفیف ویژه سفارش ${product.title}! فقط تا ۱۲ ساعت آینده با ارسال رایگان. کد تخفیف: FASTBUY` : '',
    socialCaption: product ? `معرفی محصول جدید: ${product.title}\n\nتضمین کمترین قیمت و اصالت قطعی کالا.\nسفارش آنلاین با ضمانت بازگشت وجه ۷ روزه.` : '',
    tags: product ? [product.category, 'اصالت_کالا', 'ارسال_اکسپرس', 'تخفیف'] : []
  }));

  React.useEffect(() => {
    if (product) {
      setGeneratedResult({
        seoTitle: `بررسی، قیمت و مشخصات خرید ${product.title} | گارانتی اصالت`,
        shortPitch: `${product.title} با عملکرد کم‌نظیر و کیفیت ساخت مهندسی، یکی از هوشمندانه‌ترین انتخاب‌ها در رده قیمتی خود است.`,
        expertReview: `بررسی تخصصی ما نشان می‌دهد که ${product.title} با تکیه بر متریال درجه‌یک و هماهنگی کم‌نظیر سخت‌افزاری، تجربه کاربری بی‌نقصی ارائه می‌دهد. پایداری حرارتی و دوام بالا از مزیت‌های شاخص این مدل به شمار می‌رود.`,
        pros: ['کیفیت ساخت ممتاز و ارگونومی بالا', 'ارزش خرید عالی در برابر رقبای هم‌رده', 'گارانتی معتبر شرکتی'],
        cons: ['تعداد محدود در انبار در فصول تخفیف', 'نیاز به خواندن راهنمای راه‌اندازی اولیه'],
        metaDescription: `خرید ${product.title} با ضمانت ۷ روزه بازگشت وجه، ارسال اکسپرس و کمترین قیمت بازار در فروشگاه آنلاین کامرس او اس.`,
        retargetingSms: `تخفیف ویژه سفارش ${product.title}! فقط تا ۱۲ ساعت آینده با ارسال رایگان. کد تخفیف: FASTBUY`,
        socialCaption: `معرفی محصول جدید: ${product.title}\n\nتضمین کمترین قیمت و اصالت قطعی کالا.\nسفارش آنلاین با ضمانت بازگشت وجه ۷ روزه.`,
        tags: [product.category, 'اصالت_کالا', 'ارسال_اکسپرس', 'تخفیف']
      });
    }
  }, [product?.id]);

  const handleToggleDelegation = (key: keyof typeof delegation) => {
    setDelegation(prev => ({ ...prev, [key]: !prev[key] }));
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
          customVoice: brandVoice
        })
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
      if (onApplyContentToProduct) {
        onApplyContentToProduct(product.id, generatedResult);
      }
      if (onApplyGeneratedContent) {
        onApplyGeneratedContent(generatedResult);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                استودیوی هوشمند تولید و تفویض محتوا
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI & Custom Generator
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {product ? `متصل به محصول: ${product.title}` : 'تولید محتوای هوشمند برای مقالات و صفحات'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'matrix'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            ماتریس تفویض وظایف (چه بخشی را چه کسی بنویسد؟)
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'results'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            پیش‌نمایش و محتوای تولیدشده
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'webhook'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-4 h-4" />
            اتصال به موتور / ابزار تولید محتوای شما
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              {/* Generator Source Selector */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  موتور اصلی پردازش و تولید:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setGeneratorSource('SITE_AI')}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      generatorSource === 'SITE_AI'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">هوش مصنوعی خود سایت (Commerce OS)</span>
                      {generatorSource === 'SITE_AI' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400">تولید سریع با جمینای و قوانین بهینه‌سازی فروشگاهی</span>
                  </button>

                  <button
                    onClick={() => setGeneratorSource('MY_GENERATOR_WEBHOOK')}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      generatorSource === 'MY_GENERATOR_WEBHOOK'
                        ? 'border-purple-500 bg-purple-950/40 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">ابزار تولید محتوای اختصاصی من</span>
                      {generatorSource === 'MY_GENERATOR_WEBHOOK' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400">ارسال به API / وب‌هوک نرم‌افزار شما و بازگشت متن</span>
                  </button>

                  <button
                    onClick={() => setGeneratorSource('MANUAL_HYBRID')}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      generatorSource === 'MANUAL_HYBRID'
                        ? 'border-emerald-500 bg-emerald-950/40 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">حالت هیبریدی و ویرایش دستی</span>
                      {generatorSource === 'MANUAL_HYBRID' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="text-[11px] text-slate-400">ترکیب اسکلت هوش مصنوعی با بازبینی و نگارش تیم محتوا</span>
                  </button>
                </div>
              </div>

              {/* Granular Delegation Matrix */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      ماتریس تعیین سهم نگارش بخش‌های صفحه
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      مشخص کنید کدام المان‌ها توسط موتور هوشمند نوشته شوند و کدام المان‌ها توسط ابزار اختصاصی شما تکمیل گردند.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {/* SEO Title */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">عنوان سئو و H1 فروشگاهی</div>
                      <div className="text-[10px] text-slate-400">شامل کلمات کلیدی پرجستجو و برند معتبر</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('seoTitle')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.seoTitle
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.seoTitle ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>

                  {/* Expert Review */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">نقد و بررسی تخصصی (Review)</div>
                      <div className="text-[10px] text-slate-400">بررسی دقیق و تجربه‌ی استفاده‌ی واقعی</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('review')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.review
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.review ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>

                  {/* Pros & Cons */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">نقاط قوت و ضعف صریح</div>
                      <div className="text-[10px] text-slate-400">نکات کلیدی تصمیم‌گیری خریدار در یک نگاه</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('prosCons')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.prosCons
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.prosCons ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>

                  {/* Specs Overview */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">جدول خلاصه مشخصات فنی</div>
                      <div className="text-[10px] text-slate-400">استخراج خودکار از کاتالوگ سازنده کالا</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('specs')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.specs
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.specs ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>

                  {/* Meta Description */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">توضیحات متای گوگل (Meta Description)</div>
                      <div className="text-[10px] text-slate-400">حداکثر ۱۶۰ کاراکتر با نرخ کلیک بالا (CTR)</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('metaDescription')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.metaDescription
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.metaDescription ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>

                  {/* Retargeting SMS */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">پیامک فروش و ریتارگتینگ خریدار</div>
                      <div className="text-[10px] text-slate-400">متن کوتاه پیامکی به همراه کد تخفیف اختصاصی</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('retargetingSms')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.retargetingSms
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.retargetingSms ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>

                  {/* Social Post */}
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between md:col-span-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">کپشن شبکه‌های اجتماعی (اینستاگرام و تلگرام)</div>
                      <div className="text-[10px] text-slate-400">هشتگ‌گذاری هوشمند، قلاب جلب توجه و دعوت به اقدام (CTA)</div>
                    </div>
                    <button
                      onClick={() => handleToggleDelegation('socialPost')}
                      className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                        delegation.socialPost
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {delegation.socialPost ? 'هوش مصنوعی سامانه' : 'موتور اختصاصی کاربر'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Voice & Prompt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">لحن و صدای برند (Brand Voice):</label>
                  <input
                    type="text"
                    value={brandVoice}
                    onChange={e => setBrandVoice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="مثال: تخصصی، دوستانه و جوان‌پسند"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">دستور یا پرامپت اختصاصی اضافه:</label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="مثال: روی حذف نویز فعال و گارانتی ۱۸ ماهه تاکید ویژه‌ای شود"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'results' && generatedResult && (
            <div className="space-y-4">
              {/* SEO Title */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400">عنوان سئو و عنوان فروشگاهی:</span>
                  <button
                    onClick={() => copyToClipboard(generatedResult.seoTitle || '', 'seoTitle')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedField === 'seoTitle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'seoTitle' ? 'کپی شد' : 'کپی'}
                  </button>
                </div>
                <p className="text-xs text-slate-200 font-medium">{generatedResult.seoTitle}</p>
              </div>

              {/* Short Pitch */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400">خلاصه معرفی کالا (قلاب اولیه):</span>
                  <button
                    onClick={() => copyToClipboard(generatedResult.shortPitch || '', 'shortPitch')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedField === 'shortPitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    کپی
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{generatedResult.shortPitch}</p>
              </div>

              {/* Expert Review */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400">نقد و بررسی کارشناسی (In-Depth Review):</span>
                  <button
                    onClick={() => copyToClipboard(generatedResult.expertReview || '', 'expertReview')}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedField === 'expertReview' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    کپی
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{generatedResult.expertReview}</p>
              </div>

              {/* Pros and Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/40">
                  <span className="text-xs font-bold text-emerald-400 block mb-2">نقاط قوت (مزایا):</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {generatedResult.pros?.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
                  <span className="text-xs font-bold text-rose-400 block mb-2">نقاط ضعف و چالش‌ها:</span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {generatedResult.cons?.map((c, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Meta and SMS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-indigo-400 block mb-1">متاتگ گوگل (Meta Description):</span>
                  <p className="text-xs text-slate-300">{generatedResult.metaDescription}</p>
                </div>
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-indigo-400 block mb-1">متن پیامک ریتارگتینگ (SMS):</span>
                  <p className="text-xs text-slate-300">{generatedResult.retargetingSms}</p>
                </div>
              </div>

              {/* Social Caption & Quick Action */}
              <div className="bg-gradient-to-r from-purple-950/30 to-indigo-950/30 p-4 rounded-xl border border-purple-800/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-300 block mb-1">کپشن شبکه‌های اجتماعی آماده انتشار</span>
                  <p className="text-xs text-slate-300 line-clamp-2">{generatedResult.socialCaption}</p>
                </div>
                {product && onOpenSocialPublisher && (
                  <button
                    onClick={() => {
                      onOpenSocialPublisher(product);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 shadow-lg shadow-purple-600/20"
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
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <Bot className="w-4 h-4" />
                  اتصال به ابزار تولید محتوای شما از طریق Webhook / API
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  اگر نرم‌افزار، اسکریپت یا موتور تولید محتوای اختصاصی خود را روی سرور یا ابزارهایی مانند n8n، Make، یا پایتون اجرا می‌کنید، آدرس Endpoint آن را در زیر وارد کنید. سایت اطلاعات ورودی کالا را برای شما ارسال کرده و پاسخ را مستقیما در فیلدهای مربوطه می‌نشاند.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Webhook Endpoint URL:</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono focus:outline-none focus:border-purple-500"
                    placeholder="https://api.your-custom-ai.com/v1/content-craft"
                  />
                </div>
                <div className="p-3 bg-slate-900/80 rounded-lg text-[11px] text-slate-400 font-mono">
                  Payload ارسالی شامل: {'{'} productTitle, category, brand, features, delegationMatrix {'}'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>مدل فعال: Gemini 3.8 Flash + موتور قوانین محتوایی</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              انصراف
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
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
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
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
