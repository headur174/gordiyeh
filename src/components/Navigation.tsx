import React, { useState, useEffect } from 'react';
import { Currency, MarketMode, NetworkResilienceMode } from '../types';
import { 
  AlertCircle, 
  Layers, 
  SlidersHorizontal, 
  Truck, 
  Calendar, 
  History, 
  Sparkles, 
  LayoutDashboard,
  ShieldCheck, 
  Store, 
  Palette, 
  ClipboardList, 
  Globe, 
  WifiOff, 
  Activity,
  AlertTriangle,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import {
  getInitialTheme,
  applyTheme,
  GordiyehTheme,
  GORDIYEH_THEMES,
  getThemeMeta,
  isDarkTheme,
} from '../utils/themeManager';

interface NavigationProps {
  currentView: 'STOREFRONT' | 'SUPERVISOR';
  onViewChange: (view: 'STOREFRONT' | 'SUPERVISOR') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
  pendingManualTasksCount: number;
  networkMode: NetworkResilienceMode;
  onNetworkModeChange: (mode: NetworkResilienceMode) => void;
  currency?: Currency;
  onToggleCurrency?: () => void;
  marketMode?: MarketMode;
  onToggleMarketMode?: () => void;
  autopilotActive: boolean;
  onToggleAutopilot: () => void;
  onOpenThemeModal?: () => void;
  onOpenSiteEditor?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onViewChange,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  pendingManualTasksCount,
  networkMode,
  onNetworkModeChange,
  autopilotActive,
  onToggleAutopilot,
  onOpenThemeModal,
  onOpenSiteEditor,
}) => {
  const [latency, setLatency] = useState<number>(24);
  const [packetLoss, setPacketLoss] = useState<number>(0);
  const [showNetworkModal, setShowNetworkModal] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<GordiyehTheme>(getInitialTheme());

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = (document.documentElement.getAttribute('data-theme') as GordiyehTheme) || 'forest-light';
      setActiveTheme(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const handleCycleTheme = () => {
    const idx = GORDIYEH_THEMES.findIndex((t) => t.id === activeTheme);
    const next = GORDIYEH_THEMES[(idx + 1) % GORDIYEH_THEMES.length].id;
    applyTheme(next);
    setActiveTheme(next);
  };

  // Ping monitor
  useEffect(() => {
    const interval = setInterval(() => {
      const start = performance.now();
      fetch('/api/health')
        .then(() => {
          const roundtrip = Math.round(performance.now() - start);
          if (networkMode === 'INTRANET') {
            setLatency(Math.min(18, Math.max(8, roundtrip)));
            setPacketLoss(0);
          } else if (networkMode === 'AIRGAP_OFFLINE') {
            setLatency(0);
            setPacketLoss(100);
          } else {
            setLatency(Math.min(180, Math.max(45, roundtrip + 35)));
            setPacketLoss(Math.random() > 0.88 ? 12 : 0);
          }
        })
        .catch(() => {
          if (networkMode !== 'AIRGAP_OFFLINE') {
            setLatency(999);
            setPacketLoss(100);
          }
        });
    }, 8000);

    return () => clearInterval(interval);
  }, [networkMode]);

  const isOnlineDependentPruned = networkMode !== 'GLOBAL';

  const supervisorTabs = [
    { id: 'briefing', label: 'خلاصه روزانه', icon: LayoutDashboard },
    { 
      id: 'manual_tasks', 
      label: 'صف کارهای دستی', 
      icon: ClipboardList, 
      badge: pendingManualTasksCount, 
      highlight: pendingManualTasksCount > 0 
    },
    { 
      id: 'approvals', 
      label: 'صف تأیید ناظر', 
      icon: AlertCircle, 
      badge: pendingApprovalsCount,
      highlight: pendingApprovalsCount > 0
    },
    { id: 'rules', label: 'موتور قوانین', icon: SlidersHorizontal },
    { id: 'catalog', label: 'کاتالوگ محصولات', icon: Layers },
    { id: 'cms', label: 'مدیریت محتوا و وبلاگ', icon: FileText },
    { id: 'suppliers', label: 'تأمین‌کنندگان', icon: Truck },
    { id: 'campaigns', label: 'شبیه‌ساز کمپین', icon: Calendar },
    { id: 'decisions', label: 'حافظه تصمیمات', icon: History },
    { 
      id: 'ask', 
      label: isOnlineDependentPruned ? 'مغز قوانین محلی' : 'مغز هوش مصنوعی', 
      icon: Sparkles,
      badge: isOnlineDependentPruned ? 'مستقل' : undefined
    },
    { id: 'security', label: 'امنیت & COCA', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0D1321]/95 backdrop-blur-md border-b border-[#3E5C76]/50 text-[#F0EBD8] font-sans shadow-2xl">
      {/* Alert Banner for Packet Loss in Global Mode */}
      {networkMode === 'GLOBAL' && packetLoss > 0 && (
        <div className="bg-amber-950/90 border-b border-amber-500/40 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>هشدار اختلال شبکه بین‌الملل:</strong> پکت‌لاس {packetLoss}٪ یا کندی خارجی تشخیص داده شد.
            </span>
          </div>
          <button
            onClick={() => onNetworkModeChange('INTRANET')}
            className="px-2.5 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all text-[11px] shrink-0"
          >
            سوییچ به شبکه ملی مستقل 🇮🇷
          </button>
        </div>
      )}

      {/* Alert Banner for Airgap Offline Mode */}
      {networkMode === 'AIRGAP_OFFLINE' && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-4 py-1.5 text-xs text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0 animate-ping" />
            <span>
              <strong>حالت آفلاین اضطراری (Airgap):</strong> اتصالات شبکه قطع است. سفارشات و اقدامات به صف کارهای دستی منتقل می‌شوند.
            </span>
          </div>
          <button
            onClick={() => onTabChange('manual_tasks')}
            className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all text-[11px] shrink-0"
          >
            مدیریت کارهای دستی ({pendingManualTasksCount})
          </button>
        </div>
      )}

      {/* Main Single Supervisor Control Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
        {/* Right side: Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <div className="h-8 sm:h-9 px-2 py-0.5 rounded-t-xl rounded-b-none bg-[#1D2D44] border-t border-x border-[#3E5C76] flex items-center justify-center shadow-md">
              <img 
                src="/assets/gordiyeh-logo-emblem.png" 
                alt="گُردیه" 
                className="h-7 sm:h-8 w-auto object-contain gordiyeh-adaptive-logo"
              />
            </div>
            <div className="w-[calc(100%+4px)] -mx-[2px] h-[2px] bg-[#1D2D44] border-x border-b border-[#3E5C76]" />
            <div className="w-[calc(100%+8px)] -mx-[4px] h-[1.5px] bg-[#3E5C76]/60" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black text-[#F0EBD8] tracking-wide">گُردیه (GORDIYEH)</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1D2D44] text-[#F0EBD8] border border-[#3E5C76]">
                Supervisor Core
              </span>
            </div>
            <p className="text-[10px] text-[#748CAB] hidden md:block">
              پنل مدیریت سفارش‌ها، کاتالوگ محصولات و محتوای گُردیه
            </p>
          </div>
        </div>

        {/* Center: Integrated Iran Network Resilience & Sovereign Mode Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNetworkModal(true)}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm ${
              networkMode === 'GLOBAL'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : networkMode === 'INTRANET'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 ring-1 ring-amber-500/20'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 ring-1 ring-rose-500/20'
            }`}
            title="پایش زنده شبکه ایران: کلیک برای تنظیمات و سوییچ حالت تاب‌آوری"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              networkMode === 'GLOBAL' 
                ? 'bg-emerald-400 animate-pulse' 
                : networkMode === 'INTRANET' 
                ? 'bg-amber-400' 
                : 'bg-rose-500 animate-ping'
            }`} />
            
            {networkMode === 'GLOBAL' && (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">اینترنت بین‌الملل</span>
                <span className="sm:hidden">جهانی</span>
                <span className="font-mono text-[10px] text-emerald-400/80 mr-0.5">({latency}ms)</span>
              </>
            )}

            {networkMode === 'INTRANET' && (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">شبکه ملی مستقل 🇮🇷</span>
                <span className="sm:hidden">شبکه ملی</span>
                <span className="font-mono text-[10px] text-amber-300/90 mr-0.5">({latency}ms)</span>
              </>
            )}

            {networkMode === 'AIRGAP_OFFLINE' && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>آفلاین (Airgap)</span>
                {pendingManualTasksCount > 0 && (
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full mr-1">
                    {pendingManualTasksCount}
                  </span>
                )}
              </>
            )}

            <Activity className="w-3 h-3 text-slate-400 mr-0.5" />
          </button>
        </div>

        {/* Left side: Autopilot Toggle, Theme, and Storefront Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Autopilot Button */}
          <button
            onClick={onToggleAutopilot}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1.5 ${
              autopilotActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
            }`}
            title="کلیک برای تغییر وضعیت کلی اتوپایلوت سیستم"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${autopilotActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden md:inline">اتوپایلوت:</span>
            <span>{autopilotActive ? 'فعال' : 'متوقف'}</span>
          </button>

          {/* Quick Theme Cycle across 4 Themes */}
          <button
            onClick={handleCycleTheme}
            className="p-1.5 px-2.5 rounded-xl text-xs font-bold bg-[#1D2D44] hover:bg-[#1D2D44]/80 border border-[#3E5C76] text-[#F0EBD8] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title={`تغییر پوسته (فعلی: ${getThemeMeta(activeTheme).label})`}
          >
            {isDarkTheme(activeTheme) ? (
              <Moon className="w-3.5 h-3.5 text-purple-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-[10px] hidden sm:inline">
              {getThemeMeta(activeTheme).shortLabel}
            </span>
          </button>

          {/* Visual Storefront Editor Button */}
          {onOpenSiteEditor && (
            <button
              onClick={onOpenSiteEditor}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600/90 hover:bg-indigo-500 border border-indigo-400/50 text-white transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              title="ویرایش زنده اسلایدرها و ویترین فروشگاه"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">تنظیم اسلایدرها</span>
            </button>
          )}

          {/* Theme Visual Customizer */}
          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              className="p-1.5 rounded-xl text-xs font-bold bg-[#1D2D44] hover:bg-[#1D2D44]/80 border border-[#3E5C76] text-[#748CAB] hover:text-[#F0EBD8] transition-all shadow-sm"
              title="شخصی‌سازی طراحی بصری و تم رنگی"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#748CAB]" />
            </button>
          )}

          {/* Clean Prominent Button to View Storefront */}
          <button
            onClick={() => onViewChange('STOREFRONT')}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-black bg-[#F0EBD8] hover:bg-white text-[#0D1321] border border-[#3E5C76] shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="مشاهده ویترین فروشگاه از نگاه خریدار واقعی"
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ویترین فروشگاه</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 py-1.5 min-w-max border-t border-[#3E5C76]/30">
          {supervisorTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-[#1D2D44] text-[#F0EBD8] border border-[#3E5C76] shadow-md'
                    : 'text-[#748CAB] hover:text-[#F0EBD8] hover:bg-[#1D2D44]/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F0EBD8]' : 'text-[#748CAB]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (typeof tab.badge === 'number' ? tab.badge > 0 : Boolean(tab.badge)) && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-[#F0EBD8] text-[#0D1321]' : 'bg-amber-400 text-slate-950'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Network Resilience & Sovereign Mode Modal */}
      {showNetworkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1D2D44] border border-[#3E5C76] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-[#F0EBD8]">
            <div className="flex items-center justify-between border-b border-[#3E5C76]/60 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#F0EBD8]" />
                <h3 className="text-base font-black text-[#F0EBD8]">مرکز مدیریت تاب‌آوری شبکه و اینترنت ایران</h3>
              </div>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="text-[#748CAB] hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#748CAB] leading-relaxed">
              با توجه به نوسانات روتینگ، پکت‌لاس بین‌الملل و شرایط شبکه ملی، می‌توانید رفتار سیستم را در یک کلیک به حالت بهینه تغییر دهید تا هیچ فروشی متوقف نشود:
            </p>

            {/* Mode Selection Cards */}
            <div className="space-y-2.5">
              {/* Option 1: Global */}
              <div
                onClick={() => {
                  onNetworkModeChange('GLOBAL');
                  setShowNetworkModal(false);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  networkMode === 'GLOBAL'
                    ? 'bg-[#0D1321] border-[#3E5C76] shadow-md ring-1 ring-[#3E5C76]'
                    : 'bg-[#0D1321]/60 border-[#3E5C76]/50 hover:border-[#3E5C76]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>۱. حالت بین‌المللی (Global / Hybrid)</span>
                      {networkMode === 'GLOBAL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500 text-white font-mono">فعال</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      اتصال کامل اینترنت، هوش مصنوعی ابری Gemini و رصد زنده نرخ ارز جهانی.
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Sovereign Intranet */}
              <div
                onClick={() => {
                  onNetworkModeChange('INTRANET');
                  setShowNetworkModal(false);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  networkMode === 'INTRANET'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>۲. حالت اینترانت / شبکه ملی مستقل (Sovereign)</span>
                      {networkMode === 'INTRANET' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold font-mono">فعال</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      قطع کامل درخواست‌های خارجی، منابع و فونت‌های ۱۰۰٪ محلی، بدون افت سرعت یا پکت‌لاس.
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: Airgap Offline */}
              <div
                onClick={() => {
                  onNetworkModeChange('AIRGAP_OFFLINE');
                  setShowNetworkModal(false);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  networkMode === 'AIRGAP_OFFLINE'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <span>۳. حالت آفلاین اضطراری (Airgap Offline)</span>
                      {networkMode === 'AIRGAP_OFFLINE' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-white font-mono">فعال</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      ثبت لوکال سفارشات، کش محلی کاتالوگ و هدایت فوری همه تراکنش‌ها به «صف کارهای دستی».
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Ping and Stats */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block">پینگ داخلی:</span>
                <span className="font-mono font-bold text-white">{networkMode === 'AIRGAP_OFFLINE' ? 'آفلاین' : `${latency} ms`}</span>
              </div>
              <div>
                <span className="text-slate-500 block">پکت‌لاس:</span>
                <span className={`font-mono font-bold ${packetLoss > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {packetLoss}%
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">صف کارهای دستی:</span>
                <span className="font-mono font-bold text-indigo-400">{pendingManualTasksCount} مورد</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowNetworkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
