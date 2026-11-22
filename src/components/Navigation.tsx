import React, { useState, useEffect } from 'react';
import { Currency, MarketMode, NetworkResilienceMode } from '../types';
import { GORDIYEH_BRAND } from '../gordiyehKit';
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
  FileText,
  Sliders,
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
      highlight: pendingManualTasksCount > 0,
    },
    {
      id: 'approvals',
      label: 'صف تأیید ناظر',
      icon: AlertCircle,
      badge: pendingApprovalsCount,
      highlight: pendingApprovalsCount > 0,
    },
    { id: 'rules', label: 'موتور قوانین', icon: SlidersHorizontal },
    { id: 'catalog', label: 'کاتالوگ محصولات', icon: Layers },
    { id: 'cms', label: 'مدیریت محتوا و وبلاگ', icon: FileText },
    { id: 'settings', label: 'تنظیمات کاربری و پیامک', icon: Sliders },
    { id: 'suppliers', label: 'تأمین‌کنندگان', icon: Truck },
    { id: 'campaigns', label: 'شبیه‌ساز کمپین', icon: Calendar },
    { id: 'decisions', label: 'حافظه تصمیمات', icon: History },
    {
      id: 'ask',
      label: isOnlineDependentPruned ? 'مغز قوانین محلی' : 'مغز هوش مصنوعی',
      icon: Sparkles,
      badge: isOnlineDependentPruned ? 'مستقل' : undefined,
    },
    { id: 'security', label: 'امنیت & COCA', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-main)] font-sans shadow-sm">
      {/* Alert Banner for Packet Loss in Global Mode */}
      {networkMode === 'GLOBAL' && packetLoss > 0 && (
        <div className="bg-amber-500/15 dark:bg-amber-950/90 border-b border-amber-500/40 px-3 sm:px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>هشدار اختلال شبکه بین‌الملل:</strong> پکت‌لاس {packetLoss}٪ یا کندی خارجی تشخیص داده شد.
            </span>
          </div>
          <button
            onClick={() => onNetworkModeChange('INTRANET')}
            className="px-2.5 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all text-[11px] shrink-0 cursor-pointer"
          >
            سوییچ به شبکه ملی مستقل
          </button>
        </div>
      )}

      {/* Alert Banner for Airgap Offline Mode */}
      {networkMode === 'AIRGAP_OFFLINE' && (
        <div className="bg-rose-500/15 dark:bg-rose-950/90 border-b border-rose-500/40 px-3 sm:px-4 py-1.5 text-xs text-rose-900 dark:text-rose-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 animate-ping" />
            <span>
              <strong>حالت آفلاین اضطراری (Airgap):</strong> اتصالات شبکه قطع است. سفارشات و اقدامات به صف کارهای دستی منتقل می‌شوند.
            </span>
          </div>
          <button
            onClick={() => onTabChange('manual_tasks')}
            className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all text-[11px] shrink-0 cursor-pointer"
          >
            مدیریت کارهای دستی ({pendingManualTasksCount})
          </button>
        </div>
      )}

      {/* Main Single Supervisor Control Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2.5">
        {/* Right side: Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <div className="h-8 sm:h-9 px-2 py-0.5 rounded-t-xl rounded-b-none bg-[var(--bg-surface)] border-t border-x border-[var(--border-active)] flex items-center justify-center shadow-xs">
              <img
                src={GORDIYEH_BRAND.logoAsset}
                alt={GORDIYEH_BRAND.nameFa}
                className="h-7 sm:h-8 w-auto object-contain gordiyeh-adaptive-logo"
              />
            </div>
            <div className="w-[calc(100%+4px)] -mx-[2px] h-[2px] bg-[var(--bg-card)] border-x border-b border-[var(--border-active)]" />
            <div className="w-[calc(100%+8px)] -mx-[4px] h-[1.5px] bg-[var(--border-color)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-[var(--text-main)] tracking-wide">گُردیه (GORDIYEH)</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)]">
                Supervisor Core
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] hidden md:block">
              پنل مدیریت سفارش‌ها، کاتالوگ محصولات و محتوای گُردیه
            </p>
          </div>
        </div>

        {/* Center: Integrated Iran Network Resilience & Sovereign Mode Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNetworkModal(true)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shadow-xs cursor-pointer ${
              networkMode === 'GLOBAL'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25'
                : networkMode === 'INTRANET'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 ring-1 ring-amber-500/20'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-800 dark:text-rose-300 hover:bg-rose-500/25 ring-1 ring-rose-500/20'
            }`}
            title="پایش زنده شبکه ایران: کلیک برای تنظیمات و سوییچ حالت تاب‌آوری"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                networkMode === 'GLOBAL'
                  ? 'bg-emerald-500 animate-pulse'
                  : networkMode === 'INTRANET'
                  ? 'bg-amber-500'
                  : 'bg-rose-500 animate-ping'
              }`}
            />

            {networkMode === 'GLOBAL' && (
              <>
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">اینترنت بین‌الملل</span>
                <span className="sm:hidden">جهانی</span>
                <span className="font-mono text-[10px] opacity-80 mr-0.5">({latency}ms)</span>
              </>
            )}

            {networkMode === 'INTRANET' && (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">شبکه ملی مستقل</span>
                <span className="sm:hidden">شبکه ملی</span>
                <span className="font-mono text-[10px] opacity-80 mr-0.5">({latency}ms)</span>
              </>
            )}

            {networkMode === 'AIRGAP_OFFLINE' && (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>آفلاین (Airgap)</span>
                {pendingManualTasksCount > 0 && (
                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full mr-1">
                    {pendingManualTasksCount}
                  </span>
                )}
              </>
            )}

            <Activity className="w-3 h-3 opacity-70 mr-0.5" />
          </button>
        </div>

        {/* Left side: Autopilot Toggle, Theme, and Storefront Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Autopilot Button */}
          <button
            onClick={onToggleAutopilot}
            className={`px-2 py-1.5 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              autopilotActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
            }`}
            title="کلیک برای تغییر وضعیت کلی اتوپایلوت سیستم"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${autopilotActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden md:inline">اتوپایلوت:</span>
            <span>{autopilotActive ? 'فعال' : 'متوقف'}</span>
          </button>

          {/* Quick Theme Toggle (Forest Day / Night) */}
          <button
            onClick={handleCycleTheme}
            className="p-1.5 px-2.5 rounded-xl text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title={`تغییر پوسته (فعلی: ${getThemeMeta(activeTheme).label})`}
          >
            {isDarkTheme(activeTheme) ? (
              <Moon className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="text-[10px] hidden sm:inline">
              {getThemeMeta(activeTheme).shortLabel}
            </span>
          </button>

          {/* Visual Storefront Editor Button */}
          {onOpenSiteEditor && (
            <button
              onClick={onOpenSiteEditor}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] border border-[var(--border-active)] text-[#F7F3EA] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
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
              className="p-1.5 rounded-xl text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all shadow-xs cursor-pointer"
              title="شخصی‌سازی طراحی بصری و تم رنگی"
            >
              <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Clean Prominent Button to View Storefront */}
          <button
            onClick={() => onViewChange('STOREFRONT')}
            className="px-2.5 py-1.5 sm:px-3.5 rounded-xl text-[11px] sm:text-xs font-black bg-[var(--text-main)] hover:opacity-90 text-[var(--bg-main)] border border-[var(--border-color)] shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="مشاهده ویترین فروشگاه از نگاه خریدار واقعی"
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>ویترین فروشگاه</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 py-1.5 min-w-max border-t border-[var(--border-color)]">
          {supervisorTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-[#F7F3EA] border border-[var(--border-active)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#F7F3EA]' : 'text-[var(--text-muted)]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (typeof tab.badge === 'number' ? tab.badge > 0 : Boolean(tab.badge)) && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive ? 'bg-[#F7F3EA] text-[#182B22]' : 'bg-amber-500 text-[#182B22]'
                    }`}
                  >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 text-[var(--text-main)] my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="w-5 h-5 text-[var(--accent-text)] shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-[var(--text-main)] truncate">
                  مرکز مدیریت تاب‌آوری شبکه و اینترنت ایران
                </h3>
              </div>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg font-mono cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
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
                    ? 'bg-[var(--accent-soft)] border-[var(--border-active)] shadow-sm ring-1 ring-[var(--accent-primary)]/40'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                      <span>۱. حالت بین‌المللی (Global / Hybrid)</span>
                      {networkMode === 'GLOBAL' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-primary)] text-[#F7F3EA] font-mono">فعال</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      اتصال کامل اینترنت، هوش مصنوعی ابری و رصد زنده نرخ ارز جهانی.
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
                    ? 'bg-amber-500/15 border-amber-500 shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                      <span>۲. حالت اینترانت / شبکه ملی مستقل (Sovereign)</span>
                      {networkMode === 'INTRANET' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-[#182B22] font-bold font-mono">فعال</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
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
                    ? 'bg-rose-500/15 border-rose-500 shadow-sm ring-1 ring-rose-500/40'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <WifiOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                      <span>۳. حالت آفلاین اضطراری (Airgap Offline)</span>
                      {networkMode === 'AIRGAP_OFFLINE' && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white font-mono">فعال</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">
                      ثبت لوکال سفارشات، کش محلی کاتالوگ و هدایت فوری همه تراکنش‌ها به «صف کارهای دستی».
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Ping and Stats */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[var(--text-muted)] block">پینگ داخلی:</span>
                <span className="font-mono font-bold text-[var(--text-main)]">
                  {networkMode === 'AIRGAP_OFFLINE' ? 'آفلاین' : `${latency} ms`}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">پکت‌لاس:</span>
                <span className={`font-mono font-bold ${packetLoss > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {packetLoss}%
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">صف کارهای دستی:</span>
                <span className="font-mono font-bold text-[var(--accent-text)]">{pendingManualTasksCount} مورد</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowNetworkModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-color)] cursor-pointer"
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
