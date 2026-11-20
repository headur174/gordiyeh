import React, { useState } from 'react';
import {
  Edit3,
  Sparkles,
  Save,
  Check,
  Image,
  Type,
  Layout,
  Sliders,
  X,
  Palette,
  Eye,
  RefreshCw,
  Phone,
  Layers
} from 'lucide-react';
import { SiteConfig } from '../../utils/cmsStore';
import { CanonicalProduct } from '../../types';

interface SiteVisualEditorProps {
  isOpen: boolean;
  onClose: () => void;
  config: SiteConfig;
  onSaveConfig: (newConfig: SiteConfig) => void;
  products?: CanonicalProduct[];
}

export const SiteVisualEditor: React.FC<SiteVisualEditorProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  products = [],
}) => {
  const [formData, setFormData] = useState<SiteConfig>(config);
  const [activeSection, setActiveSection] = useState<'hero' | 'sliders' | 'banners' | 'announcement' | 'contact'>('sliders');
  const [isRewriting, setIsRewriting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleAIRewrite = async (fieldKey: 'heroHeadline' | 'heroSubheadline' | 'announcementText') => {
    setIsRewriting(true);
    try {
      const res = await fetch('/api/ask-commerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `لطفا این متن فروشگاهی را بازنویسی جذاب، ترغیب‌کننده و کوتاه کن (فقط یک جمله فارسی پیشنهاد بده): "${formData[fieldKey]}"`
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          const cleanText = data.reply.replace(/["*]/g, '').trim();
          setFormData(prev => ({ ...prev, [fieldKey]: cleanText }));
        }
      }
    } catch {
      // Fallback rewrite
      if (fieldKey === 'heroHeadline') {
        setFormData(prev => ({ ...prev, heroHeadline: 'تجربه خریدی شفاف، هوشمند و لذت‌بخش با اصالت قطعی' }));
      }
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col font-sans text-right animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1.5">
              ویرایشگر زنده سایت بدون کدنویسی
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-400">
                No-Code CMS
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">تغییر زنده متون، بنرها، تصاویر و رنگ‌ها</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Section Switcher Tabs */}
      <div className="grid grid-cols-5 gap-1 p-3 bg-slate-950/50 border-b border-slate-800 text-[11px]">
        <button
          onClick={() => setActiveSection('sliders')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeSection === 'sliders' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          اسلایدرها
        </button>
        <button
          onClick={() => setActiveSection('hero')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeSection === 'hero' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          هیرو
        </button>
        <button
          onClick={() => setActiveSection('announcement')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeSection === 'announcement' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          نوار بالا
        </button>
        <button
          onClick={() => setActiveSection('banners')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeSection === 'banners' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          بنرها
        </button>
        <button
          onClick={() => setActiveSection('contact')}
          className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            activeSection === 'contact' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          فوتر
        </button>
      </div>

      {/* Editor Controls Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5">
        {activeSection === 'hero' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">سرتیتر اصلی هیرو (H1 Headline):</label>
                <button
                  onClick={() => handleAIRewrite('heroHeadline')}
                  disabled={isRewriting}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  بازنویسی هوشمند
                </button>
              </div>
              <textarea
                rows={2}
                value={formData.heroHeadline}
                onChange={e => setFormData({ ...formData, heroHeadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">زیرعنوان توضیحی (Subheadline):</label>
                <button
                  onClick={() => handleAIRewrite('heroSubheadline')}
                  disabled={isRewriting}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  بازنویسی هوشمند
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.heroSubheadline}
                onChange={e => setFormData({ ...formData, heroSubheadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-indigo-400" />
                آدرس تصویر پس‌زمینه اسلایدر هیرو (Image URL):
              </label>
              <input
                type="url"
                value={formData.heroBannerUrl}
                onChange={e => setFormData({ ...formData, heroBannerUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 h-28 bg-slate-950">
                <img src={formData.heroBannerUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'announcement' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-200">نمایش نوار اعلان بالای صفحه</span>
              <button
                onClick={() => setFormData({ ...formData, announcementEnabled: !formData.announcementEnabled })}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  formData.announcementEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    formData.announcementEnabled ? 'right-1' : 'right-5'
                  }`}
                />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">متن نوار اعلان:</label>
                <button
                  onClick={() => handleAIRewrite('announcementText')}
                  disabled={isRewriting}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  ایده هوشمند
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.announcementText}
                onChange={e => setFormData({ ...formData, announcementText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeSection === 'sliders' && (() => {
          const sliders = {
            showDiscounts: true,
            showNewest: true,
            showBestsellers: false,
            deduplicateMode: 'auto' as const,
            discountProductIds: [] as string[],
            newestProductIds: [] as string[],
            bestsellerProductIds: [] as string[],
            ...(formData.homepageSliders || {}),
          };

          const toggleProductInSlider = (
            listKey: 'discountProductIds' | 'newestProductIds' | 'bestsellerProductIds',
            productId: string
          ) => {
            const current = sliders[listKey] || [];
            const next = current.includes(productId)
              ? current.filter((id) => id !== productId)
              : [...current, productId];
            setFormData({
              ...formData,
              homepageSliders: {
                ...sliders,
                [listKey]: next,
              },
            });
          };

          return (
            <div className="space-y-4">
              {/* Show/Hide Controls */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-emerald-400 block">
                  نمایش یا مخفی‌سازی اسلایدرهای صفحه اصلی:
                </span>
                {[
                  { key: 'showDiscounts' as const, label: 'اسلایدر کالاهای دارای تخفیف' },
                  { key: 'showNewest' as const, label: 'اسلایدر تازه‌ترین‌ها' },
                  { key: 'showBestsellers' as const, label: 'اسلایدر پرفروش‌ترین‌ها' },
                ].map((item) => {
                  const enabled = Boolean(sliders[item.key]);
                  return (
                    <div key={item.key} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-[11px] text-slate-200">{item.label}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            homepageSliders: {
                              ...sliders,
                              [item.key]: !enabled,
                            },
                          })
                        }
                        className={`w-10 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                          enabled ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            enabled ? 'right-0.5' : 'right-5'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Deduplication Mode Switcher */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-indigo-400 block">
                  روش کنترل تکرار کالا بین اسلایدرها:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        homepageSliders: { ...sliders, deduplicateMode: 'auto' },
                      })
                    }
                    className={`p-2.5 rounded-xl border text-[11px] text-right transition-all cursor-pointer ${
                      sliders.deduplicateMode !== 'manual'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>خودکار (بدون تکرار)</div>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                      حذف خودکار کالاهای مشترک در ردیف بعدی
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        homepageSliders: { ...sliders, deduplicateMode: 'manual' },
                      })
                    }
                    className={`p-2.5 rounded-xl border text-[11px] text-right transition-all cursor-pointer ${
                      sliders.deduplicateMode === 'manual'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div>دستی (انتخاب دلخواه)</div>
                    <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                      بدون حذف خودکار؛ انتخاب دقیق هر اسلایدر
                    </div>
                  </button>
                </div>
              </div>

              {/* Manual Per-Slider Product Selection */}
              {sliders.deduplicateMode === 'manual' && products.length > 0 && (
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      انتخاب دستی محصولات هر اسلایدر:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          homepageSliders: {
                            ...sliders,
                            discountProductIds: [],
                            newestProductIds: [],
                            bestsellerProductIds: [],
                          },
                        })
                      }
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      بازنشانی پیش‌فرض
                    </button>
                  </div>

                  {[
                    { key: 'discountProductIds' as const, title: 'کالاهای دارای تخفیف' },
                    { key: 'newestProductIds' as const, title: 'تازه‌ترین‌ها' },
                    { key: 'bestsellerProductIds' as const, title: 'پرفروش‌ترین‌ها' },
                  ].map((group) => {
                    const selectedIds = sliders[group.key] || [];
                    return (
                      <div key={group.key} className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
                          <span>{group.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {selectedIds.length > 0 ? `${selectedIds.length} انتخاب‌شده` : 'پیش‌فرض خودکار'}
                          </span>
                        </div>
                        <div className="max-h-28 overflow-y-auto space-y-1 pl-1">
                          {products.map((prod) => {
                            const checked = selectedIds.includes(prod.id);
                            return (
                              <label
                                key={`${group.key}-${prod.id}`}
                                className="flex items-center gap-2 text-[11px] text-slate-300 hover:text-white cursor-pointer py-0.5"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleProductInSlider(group.key, prod.id)}
                                  className="rounded border-slate-600 text-indigo-600"
                                />
                                <span className="truncate">{prod.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {activeSection === 'banners' && (
          <div className="space-y-5">
            {/* Promo Banner 1 */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 block">بنر تبلیغاتی اول (سمت راست):</span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">عنوان بنر:</label>
                <input
                  type="text"
                  value={formData.promoBanner1.title}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      promoBanner1: { ...formData.promoBanner1, title: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">زیرعنوان / تخفیف:</label>
                <input
                  type="text"
                  value={formData.promoBanner1.subtitle}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      promoBanner1: { ...formData.promoBanner1, subtitle: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">لینک تصویر بنر:</label>
                <input
                  type="url"
                  value={formData.promoBanner1.imageUrl}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      promoBanner1: { ...formData.promoBanner1, imageUrl: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                />
              </div>
            </div>

            {/* Promo Banner 2 */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-sky-400 block">بنر تبلیغاتی دوم (سمت چپ):</span>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">عنوان بنر:</label>
                <input
                  type="text"
                  value={formData.promoBanner2.title}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      promoBanner2: { ...formData.promoBanner2, title: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">زیرعنوان / تخفیف:</label>
                <input
                  type="text"
                  value={formData.promoBanner2.subtitle}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      promoBanner2: { ...formData.promoBanner2, subtitle: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">لینک تصویر بنر:</label>
                <input
                  type="url"
                  value={formData.promoBanner2.imageUrl}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      promoBanner2: { ...formData.promoBanner2, imageUrl: e.target.value }
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'contact' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">شماره تماس پشتیبانی تلفنی:</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">نشانی دفتر مرکزی / انبار:</label>
              <input
                type="text"
                value={formData.contactAddress}
                onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">متن درباره فروشگاه در فوتر:</label>
              <textarea
                rows={3}
                value={formData.footerAbout}
                onChange={e => setFormData({ ...formData, footerAbout: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="text-[11px] text-slate-400">
          {savedSuccess ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              تغییرات ذخیره و اعمال شد!
            </span>
          ) : (
            'بدون نیاز به نوشتن حتی ۱ خط کد'
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <Save className="w-4 h-4" />
            ذخیره و انتشار زنده
          </button>
        </div>
      </div>
    </div>
  );
};
