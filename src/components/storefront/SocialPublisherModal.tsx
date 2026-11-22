import React, { useState } from 'react';
import {
  Share2,
  Instagram,
  Send,
  Sparkles,
  X,
  Check,
  Copy,
  Clock,
  Smartphone,
  Layers,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { CanonicalProduct } from '../../types';

interface SocialPublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: CanonicalProduct | null;
}

export const SocialPublisherModal: React.FC<SocialPublisherModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen) return null;

  const [activeChannel, setActiveChannel] = useState<'INSTAGRAM' | 'TELEGRAM' | 'EITAA' | 'RUBIKA' | 'X'>('INSTAGRAM');
  const [activeFormat, setActiveFormat] = useState<'POST' | 'STORY' | 'CAROUSEL'>('POST');
  const [customOffer, setCustomOffer] = useState('ارسال رایگان + مهلت تست ۷ روزه');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedStatus, setPublishedStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const title = product?.title || 'محصول ویژه فروشگاه';
  const rawPrice = product?.retailPrice || (product as any)?.sellPrice;
  const price = rawPrice ? rawPrice.toLocaleString() + ' تومان' : 'تماس بگیرید';
  const category = product?.category || 'کالای دیجیتال';
  const image = product?.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=75&fm=webp';

  const getPostContent = () => {
    if (activeChannel === 'INSTAGRAM') {
      if (activeFormat === 'STORY') {
        return `پیشنهاد ویژه فروشگاه گُردیه\n\n${title}\nقیمت امروز: ${price}\nارسال سریع سراسری\n\nلینک را لمس کنید و سفارش دهید!`;
      }
      return `جدیدترین محصول منتخب گُردیه: ${title}\n\nتضمین اصالت کالا و فاکتور رسمی.\n\nقیمت امروز: ${price}\n${customOffer}\n\nبرای خرید و مشاهده مشخصات کامل به فروشگاه گُردیه سر بزنید.\n\n#خرید_آنلاین #${category.replace(/\s+/g, '_')} #تخفیف #ارسال_فوری #کالای_اصل #گُردیه`;
    }

    if (activeChannel === 'TELEGRAM') {
      return `${title}\n\nقیمت ویژه اعضای کانال: ${price}\nوضعیت انبار: موجود و آماده ارسال\nگارانتی: ۱۸ ماهه معتبر شرکتی\n\nخرید مستقیم از وب‌سایت گُردیه:\nhttps://gordiyeh.ir/p/${product?.id || '101'}`;
    }

    if (activeChannel === 'EITAA' || activeChannel === 'RUBIKA') {
      return `پیشنهاد ویژه در فروشگاه گُردیه:\n\n${title}\nقیمت با تخفیف ویژه: ${price}\nارسال سریع با کد رهگیری پستی\n\nلینک سفارش:\nhttps://gordiyeh.ir/p/${product?.id || '101'}`;
    }

    return `موجود شد: ${title}\n\nقیمت با تخفیف ویژه: ${price}\nبه همراه ارسال اکسپرس و مهلت تست ۷ روزه.\n\nلینک خرید آنلاین:\nhttps://gordiyeh.ir/p/${product?.id || '101'}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getPostContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishNow = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishedStatus(`با موفقیت در کانال ${activeChannel} منتشر و زمان‌بندی شد! (شناسه وب‌هوک: PUB-${Date.now().toString().slice(-5)})`);
      setTimeout(() => setPublishedStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center text-[#F7F3EA] shadow-sm shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                <span>استودیوی انتشار خودکار در شبکه‌های اجتماعی</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)]">
                  Multi-Channel Publisher
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">تولید محتوا، سایزبندی عکس، کپشن‌نویسی و انتشار مستقیم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 text-right">
          {/* Settings & Channel Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Channel Tabs */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] mb-2">انتخاب شبکه اجتماعی مقصد:</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => setActiveChannel('INSTAGRAM')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    activeChannel === 'INSTAGRAM'
                      ? 'border-[var(--border-active)] bg-[var(--accent-soft)] text-[var(--accent-text)] font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <Instagram className="w-4 h-4" />
                  <span className="text-[11px]">اینستاگرام</span>
                </button>

                <button
                  onClick={() => setActiveChannel('TELEGRAM')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    activeChannel === 'TELEGRAM'
                      ? 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="text-[11px]">تلگرام</span>
                </button>

                <button
                  onClick={() => setActiveChannel('EITAA')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    activeChannel === 'EITAA'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[11px]">ایتا</span>
                </button>

                <button
                  onClick={() => setActiveChannel('RUBIKA')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    activeChannel === 'RUBIKA'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[11px]">روبیکا</span>
                </button>

                <button
                  onClick={() => setActiveChannel('X')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    activeChannel === 'X'
                      ? 'border-[var(--border-active)] bg-[var(--bg-card)] text-[var(--text-main)] font-bold'
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">X</span>
                  <span className="text-[11px]">ایکس</span>
                </button>
              </div>
            </div>

            {/* Format Selector for Instagram */}
            {activeChannel === 'INSTAGRAM' && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-main)] mb-2">فرمت انتشار:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveFormat('POST')}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      activeFormat === 'POST'
                        ? 'border-[var(--border-active)] bg-[var(--accent-soft)] text-[var(--accent-text)] font-bold'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)]'
                    }`}
                  >
                    پست مربع (1:1 Feed Post)
                  </button>
                  <button
                    onClick={() => setActiveFormat('STORY')}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      activeFormat === 'STORY'
                        ? 'border-[var(--border-active)] bg-[var(--accent-soft)] text-[var(--accent-text)] font-bold'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)]'
                    }`}
                  >
                    استوری عمودی (9:16 Story)
                  </button>
                </div>
              </div>
            )}

            {/* Custom Offer Injection */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] mb-1">پیشنهاد ترغیب‌کننده روی پست (Incentive Offer):</label>
              <input
                type="text"
                value={customOffer}
                onChange={(e) => setCustomOffer(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
              />
            </div>

            {/* Generated Caption Area */}
            <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
                  متن و هشتگ‌های تولیدشده برای {activeChannel}:
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-color)] cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'کپی شد' : 'کپی متن'}
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={getPostContent()}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] leading-relaxed font-sans focus:outline-none resize-none"
              />
            </div>

            {publishedStatus && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{publishedStatus}</span>
              </div>
            )}
          </div>

          {/* Live Mobile Frame Mockup (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[var(--accent-text)]" />
              پیش‌نمایش زنده در گوشی مشتری ({activeChannel})
            </div>

            {/* Mobile Device Frame */}
            <div className="w-full max-w-[280px] bg-[var(--bg-card)] rounded-[32px] p-3 border-4 border-[var(--border-active)] shadow-xl relative overflow-hidden">
              {/* Camera notch */}
              <div className="w-24 h-4 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full mx-auto mb-2" />

              {/* In-App Mockup */}
              <div className="bg-[var(--bg-surface)] rounded-[20px] overflow-hidden border border-[var(--border-color)] text-right">
                {/* App Header */}
                <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--text-main)]">{activeChannel === 'INSTAGRAM' ? 'Instagram' : activeChannel}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Media preview */}
                <div className="relative overflow-hidden bg-[var(--bg-main)]">
                  <img
                    src={image}
                    alt={title}
                    className={`w-full object-cover ${activeFormat === 'STORY' ? 'h-48' : 'h-36'}`}
                  />
                  <div className="absolute top-2 right-2 bg-[var(--accent-primary)]/95 backdrop-blur-sm text-[#F7F3EA] text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {price}
                  </div>
                  {activeFormat === 'STORY' && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[var(--bg-surface)]/95 text-[var(--text-main)] border border-[var(--border-color)] px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 whitespace-nowrap">
                      <span>مشاهده و خرید آنلاین</span>
                    </div>
                  )}
                </div>

                {/* Caption Snippet */}
                <div className="p-2.5 text-[10px] text-[var(--text-muted)] space-y-1">
                  <p className="font-bold text-[var(--text-main)] line-clamp-1">{title}</p>
                  <p className="text-[var(--text-muted)] text-[9px] line-clamp-3 leading-relaxed">
                    {getPostContent()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Clock className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
            <span>اتصال مستقیم به کانال‌ها از طریق وب‌هوک و بات‌های اختصاصی</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
            >
              بستن
            </button>

            <button
              onClick={handlePublishNow}
              disabled={isPublishing}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPublishing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال ارسال و انتشار...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  انتشار آنی در {activeChannel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
