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
  Eye,
  Smartphone,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  MessageCircle
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
  product
}) => {
  if (!isOpen) return null;

  const [activeChannel, setActiveChannel] = useState<'INSTAGRAM' | 'TELEGRAM' | 'EITAA' | 'RUBIKA' | 'X'>('INSTAGRAM');
  const [activeFormat, setActiveFormat] = useState<'POST' | 'STORY' | 'CAROUSEL'>('POST');
  const [customOffer, setCustomOffer] = useState('🎁 ارسال رایگان + مهلت تست ۷ روزه');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedStatus, setPublishedStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const title = product?.title || 'محصول ویژه فروشگاه';
  const rawPrice = product?.retailPrice || (product as any)?.sellPrice;
  const price = rawPrice ? rawPrice.toLocaleString() + ' تومان' : 'تماس بگیرید';
  const category = product?.category || 'کالای دیجیتال';
  const image = product?.image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80';

  // Formatted templates per channel
  const getPostContent = () => {
    if (activeChannel === 'INSTAGRAM') {
      if (activeFormat === 'STORY') {
        return `⚡ پیشنهاد ویژه فروشگاه!\n\n🛍 ${title}\n💰 قیمت امروز: ${price}\n🚚 ارسال سریع سراسری\n\n👆 لینک را لمس کنید و سفارش دهید!`;
      }
      return `🔥 جدیدترین پرچمدار بازار رسید: ${title}\n\nتضمین کمترین قیمت بازار به همراه گارانتی اصالت فیزیکی و فاکتور رسمی.\n\n💵 قیمت امروز: ${price}\n${customOffer}\n\n📌 برای خرید و مشاهده عکس‌های بیشتر:\n۱. به لینک بیو مراجعه کنید\n۲. یا کلمه "خرید" رو در دایرکت بفرستید تا لینک اختصاصی براتون ارسال بشه.\n\n#خرید_آنلاین #${category.replace(/\s+/g, '_')} #تخفیف #ارسال_فوری #کالای_اصل #فروشگاه`;
    }

    if (activeChannel === 'TELEGRAM') {
      return `🔥 <b>${title}</b>\n\n🔹 قیمت ویژه اعضای کانال: <b>${price}</b>\n🔹 وضعیت انبار: موجود و آماده ارسال\n🔹 گارانتی: ۱۸ ماهه معتبر شرکتی\n🔹 ارسال: رایگان با پست پیشتاز و تیپاکس\n\n🛒 <i>خرید مستقیم با یک کلیک از وب‌سایت:</i>\n👇👇👇\nhttps://store.example.ir/p/${product?.id || '101'}`;
    }

    if (activeChannel === 'EITAA' || activeChannel === 'RUBIKA') {
      return `✨ پیشنهاد ویژه در فروشگاه ایرانی:\n\n📦 ${title}\n💎 قیمت با تخفیف ویژه: ${price}\n🚚 ارسال سریع با ناوگان پستی مطمئن\n\nجهت سفارش روی نشانی اینترنتی زیر بزنید:\nhttps://store.example.ir/p/${product?.id || '101'}\n\nکانال رسمی پشتیبانی: @commerce_os`;
    }

    // X/Twitter
    return `🚀 موجود شد: ${title}\n\nقیمت با تخفیف ویژه: ${price}\nبه همراه ارسال اکسپرس و مهلت تست ۷ روزه.\n\nلینک خرید آنلاین:\nhttps://store.example.ir/p/${product?.id || '101'}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                استودیوی انتشار خودکار در شبکه‌های اجتماعی
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  Multi-Channel Publisher
                </span>
              </h2>
              <p className="text-xs text-slate-400">تولید محتوا، سایزبندی عکس، کپشن‌نویسی و انتشار مستقیم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 text-right">
          {/* Settings & Channel Selector (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Channel Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">انتخاب شبکه اجتماعی مقصد:</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                <button
                  onClick={() => setActiveChannel('INSTAGRAM')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    activeChannel === 'INSTAGRAM'
                      ? 'border-pink-500 bg-pink-950/40 text-pink-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Instagram className="w-4 h-4" />
                  <span className="text-[11px]">اینستاگرام</span>
                </button>

                <button
                  onClick={() => setActiveChannel('TELEGRAM')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    activeChannel === 'TELEGRAM'
                      ? 'border-sky-500 bg-sky-950/40 text-sky-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="text-[11px]">تلگرام</span>
                </button>

                <button
                  onClick={() => setActiveChannel('EITAA')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    activeChannel === 'EITAA'
                      ? 'border-amber-500 bg-amber-950/40 text-amber-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[11px]">ایتا</span>
                </button>

                <button
                  onClick={() => setActiveChannel('RUBIKA')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    activeChannel === 'RUBIKA'
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span className="text-[11px]">روبیکا</span>
                </button>

                <button
                  onClick={() => setActiveChannel('X')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    activeChannel === 'X'
                      ? 'border-slate-400 bg-slate-800 text-white font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">X</span>
                  <span className="text-[11px]">توییتر</span>
                </button>
              </div>
            </div>

            {/* Format Selector for Instagram */}
            {activeChannel === 'INSTAGRAM' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">فرمت انتشار:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveFormat('POST')}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                      activeFormat === 'POST'
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    پست مربع (1:1 Feed Post)
                  </button>
                  <button
                    onClick={() => setActiveFormat('STORY')}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                      activeFormat === 'STORY'
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    استوری عمودی (9:16 Story)
                  </button>
                </div>
              </div>
            )}

            {/* Custom Offer Injection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">پیشنهاد ترغیب‌کننده روی پست (Incentive Offer):</label>
              <input
                type="text"
                value={customOffer}
                onChange={e => setCustomOffer(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Generated Caption Area */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  متن و هشتگ‌های تولیدشده برای {activeChannel}:
                </span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'کپی شد' : 'کپی متن'}
                </button>
              </div>
              <textarea
                readOnly
                rows={7}
                value={getPostContent()}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 leading-relaxed font-sans focus:outline-none resize-none"
              />
            </div>

            {publishedStatus && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{publishedStatus}</span>
              </div>
            )}
          </div>

          {/* Live Mobile Frame Mockup (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              پیش‌نمایش زنده در گوشی مشتری ({activeChannel})
            </div>

            {/* Mobile Device Frame */}
            <div className="w-[280px] bg-slate-950 rounded-[32px] p-3 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Camera notch */}
              <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

              {/* In-App Mockup */}
              <div className="bg-slate-900 rounded-[20px] overflow-hidden border border-slate-800 text-right">
                {/* App Header */}
                <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-slate-200">{activeChannel === 'INSTAGRAM' ? 'Instagram' : activeChannel}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {/* Media preview */}
                <div className="relative overflow-hidden bg-slate-950">
                  <img
                    src={image}
                    alt={title}
                    className={`w-full object-cover ${activeFormat === 'STORY' ? 'h-48' : 'h-36'}`}
                  />
                  <div className="absolute top-2 right-2 bg-pink-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {price}
                  </div>
                  {activeFormat === 'STORY' && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 text-slate-900 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                      <span>🔗 مشاهده و خرید آنلاین</span>
                    </div>
                  )}
                </div>

                {/* Caption Snippet */}
                <div className="p-2.5 text-[10px] text-slate-300 space-y-1">
                  <p className="font-bold text-slate-100 line-clamp-1">{title}</p>
                  <p className="text-slate-400 text-[9px] line-clamp-3 leading-relaxed">
                    {getPostContent()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-pink-400" />
            <span>اتصال مستقیم به کانال‌ها از طریق وب‌هوک و بات‌های اختصاصی</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              بستن
            </button>

            <button
              onClick={handlePublishNow}
              disabled={isPublishing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all disabled:opacity-50"
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
