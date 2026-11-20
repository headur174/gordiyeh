import React from 'react';
import { Palette, X, Check, Monitor, Sparkles, Layout, Eye, Moon, Shield } from 'lucide-react';

export type AccentTheme = 'indigo' | 'emerald' | 'amber' | 'rose';
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
      id: 'indigo',
      name: 'نیلی مدرن (Modern Indigo)',
      color: 'bg-indigo-500',
      desc: 'تم پیش‌فرض و استاندارد سازمان‌های تجارت مدرن'
    },
    {
      id: 'emerald',
      name: 'زمرد بازرگانی (Emerald Finance)',
      color: 'bg-emerald-500',
      desc: 'الهام‌گرفته از بازارهای مالی، تمرکز بر رشد سودآوری'
    },
    {
      id: 'amber',
      name: 'کهربای پرانرژی (Cyber Amber)',
      color: 'bg-amber-500',
      desc: 'مناسب فستیوال‌های فروش، بلک‌فرایدی و حراج‌های گرم'
    },
    {
      id: 'rose',
      name: 'یاقوت سرخ (Crimson Rose)',
      color: 'bg-rose-500',
      desc: 'پروموشن‌های آتشین، شب یلدا و کالاهای لوکس'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">شخصی‌سازی طراحی بصری و محیط کاربری</h2>
              <p className="text-xs text-slate-400 mt-0.5">تنظیم رنگ هایلایت، تراکم نمایشگر و تم بصری Commerce OS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Accent Color Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 block">
            ۱. انتخاب پالت رنگی هایلایت سیستم (Accent Color):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {accentOptions.map((opt) => {
              const isSelected = config.accent === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChangeConfig({ ...config, accent: opt.id })}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-slate-850 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${opt.color} shadow-sm ring-2 ring-white/20`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{opt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Density Mode */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-200 block">
            ۲. تراکم داده‌های مانیتورینگ (Data Density):
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onChangeConfig({ ...config, density: 'compact' })}
              className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                config.density === 'compact'
                  ? 'bg-slate-850 border-indigo-500 ring-1 ring-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">فشرده و حرفه‌ای (Compact)</span>
                <span className="text-[10px] text-slate-400">مشاهده همزمان اطلاعات بیشتر</span>
              </div>
              <Layout className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onChangeConfig({ ...config, density: 'spacious' })}
              className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                config.density === 'spacious'
                  ? 'bg-slate-850 border-indigo-500 ring-1 ring-indigo-500 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div>
                <span className="text-xs font-bold block">جادار و استاندارد (Spacious)</span>
                <span className="text-[10px] text-slate-400">فاصله‌های باز و راحتی دیداری</span>
              </div>
              <Monitor className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 3. Toggles: Cyber Grid & War Room */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-slate-200 block">
            ۳. افکت‌های بصری و حالت نمایش:
          </label>

          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-bold text-white block">افکت شبکه نوری زمینه (Cyber Grid Overlay)</span>
                  <span className="text-[10px] text-slate-400">خطوط ماتریسی و نورپردازی نئونی ملایم</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.cyberGrid}
                onChange={(e) => onChangeConfig({ ...config, cyberGrid: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">حالت اتاق جنگ بازرگانی (War Room Presentation)</span>
                  <span className="text-[10px] text-slate-400">تأکید حداکثری بر هشدارهای ریسک و سود خالص لحظه‌ای</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.warRoomMode}
                onChange={(e) => onChangeConfig({ ...config, warRoomMode: e.target.checked })}
                className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save & Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-950/60 transition-all"
        >
          ذخیره و اعمال تنظیمات شخصی‌سازی
        </button>
      </div>
    </div>
  );
};
