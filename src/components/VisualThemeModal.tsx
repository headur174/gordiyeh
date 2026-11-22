import React from 'react';
import { Palette, X, Check, Monitor, Sparkles, Layout, Shield } from 'lucide-react';

export type AccentTheme = 'forest' | 'emerald' | 'amber' | 'rose';
export type DensityMode = 'compact' | 'spacious';

export interface ThemeConfig {
  accent: AccentTheme;
  density: DensityMode;
  cyberGrid: boolean;
  warRoomMode: boolean;
}

interface VisualThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThemeConfig;
  onChangeConfig: (newConfig: ThemeConfig) => void;
}

export const VisualThemeModal: React.FC<VisualThemeModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  const accentOptions: { id: AccentTheme; name: string; color: string; desc: string }[] = [
    {
      id: 'forest',
      name: 'فراست جنگلی (Forest Classic)',
      color: 'bg-[#1E4635]',
      desc: 'هویت رسمی و یکپارچه گُردیه (سبز جنگلی و آلاباستر)',
    },
    {
      id: 'emerald',
      name: 'زمرد بازرگانی (Emerald Finance)',
      color: 'bg-emerald-600',
      desc: 'الهام‌گرفته از بازارهای مالی، تمرکز بر رشد سودآوری',
    },
    {
      id: 'amber',
      name: 'کهربای پرانرژی (Warm Amber)',
      color: 'bg-amber-600',
      desc: 'مناسب فستیوال‌های فروش، بلک‌فرایدی و حراج‌های گرم',
    },
    {
      id: 'rose',
      name: 'یاقوت سرخ (Crimson Rose)',
      color: 'bg-rose-600',
      desc: 'پروموشن‌های ویژه، شب یلدا و کالاهای شاخص',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 space-y-5 sm:space-y-6 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-active)] text-[var(--accent-text)] shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-[var(--text-main)] truncate">
                شخصی‌سازی طراحی بصری و محیط کاربری
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-0.5">
                تنظیم رنگ هایلایت، تراکم نمایشگر و تم بصری سیستم فراست
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors shrink-0 cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Accent Color Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[var(--text-main)] block">
            ۱. انتخاب پالت رنگی هایلایت سیستم (Accent Color):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {accentOptions.map((opt) => {
              const isSelected = config.accent === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChangeConfig({ ...config, accent: opt.id })}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-soft)] border-[var(--border-active)] ring-2 ring-[var(--accent-primary)]/25 shadow-md text-[var(--text-main)]'
                      : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${opt.color} shadow-sm ring-2 ring-white/40`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[var(--text-main)] truncate">{opt.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-0.5 leading-snug">{opt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Density Mode */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[var(--text-main)] block">
            ۲. تراکم داده‌های مانیتورینگ (Data Density):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onChangeConfig({ ...config, density: 'compact' })}
              className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                config.density === 'compact'
                  ? 'bg-[var(--accent-soft)] border-[var(--border-active)] ring-1 ring-[var(--accent-primary)] text-[var(--text-main)]'
                  : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-[var(--text-main)]">فشرده و حرفه‌ای (Compact)</span>
                <span className="text-[10px] text-[var(--text-muted)]">مشاهده همزمان اطلاعات بیشتر</span>
              </div>
              <Layout className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
            </button>

            <button
              onClick={() => onChangeConfig({ ...config, density: 'spacious' })}
              className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                config.density === 'spacious'
                  ? 'bg-[var(--accent-soft)] border-[var(--border-active)] ring-1 ring-[var(--accent-primary)] text-[var(--text-main)]'
                  : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <div>
                <span className="text-xs font-bold block text-[var(--text-main)]">جادار و استاندارد (Spacious)</span>
                <span className="text-[10px] text-[var(--text-muted)]">فاصله‌های باز و راحتی دیداری</span>
              </div>
              <Monitor className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
            </button>
          </div>
        </div>

        {/* 3. Toggles: Ambient Grid & War Room */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
          <label className="text-xs font-bold text-[var(--text-main)] block">
            ۳. افکت‌های بصری و حالت نمایش:
          </label>

          <div className="space-y-2">
            <label className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">افکت عمق محیطی فراست (Ambient Backdrop)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">نورپردازی ملایم و یکپارچه جنگلی در پس‌زمینه</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.cyberGrid}
                onChange={(e) => onChangeConfig({ ...config, cyberGrid: e.target.checked })}
                className="w-4 h-4 accent-[#1E4635] dark:accent-[#1F7A54] rounded cursor-pointer shrink-0"
              />
            </label>

            <label className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between gap-3 cursor-pointer">
              <div className="flex items-center gap-2.5 min-w-0">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">حالت اتاق جنگ بازرگانی (War Room Presentation)</span>
                  <span className="text-[10px] text-[var(--text-muted)]">تأکید حداکثری بر هشدارهای ریسک و سود خالص لحظه‌ای</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.warRoomMode}
                onChange={(e) => onChangeConfig({ ...config, warRoomMode: e.target.checked })}
                className="w-4 h-4 accent-[#1E4635] dark:accent-[#1F7A54] rounded cursor-pointer shrink-0"
              />
            </label>
          </div>
        </div>

        {/* Save & Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
        >
          ذخیره و اعمال تنظیمات شخصی‌سازی
        </button>
      </div>
    </div>
  );
};
