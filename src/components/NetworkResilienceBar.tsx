import React, { useState, useEffect } from 'react';
import { NetworkResilienceMode } from '../types';
import { 
  Wifi, 
  WifiOff, 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Server, 
  RefreshCw,
  Zap,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface NetworkResilienceBarProps {
  networkMode: NetworkResilienceMode;
  onNetworkModeChange: (mode: NetworkResilienceMode) => void;
  pendingManualTasksCount: number;
  onOpenManualTasks: () => void;
}

export const NetworkResilienceBar: React.FC<NetworkResilienceBarProps> = ({
  networkMode,
  onNetworkModeChange,
  pendingManualTasksCount,
  onOpenManualTasks,
}) => {
  const [latency, setLatency] = useState<number>(24); // ms
  const [packetLoss, setPacketLoss] = useState<number>(0); // %
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isSimulatingLatency, setIsSimulatingLatency] = useState<boolean>(false);

  // Periodic ping simulation to local backend
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
            // Global Mode: realistic jitter of Iran's connection
            setLatency(Math.min(180, Math.max(45, roundtrip + 35)));
            setPacketLoss(Math.random() > 0.85 ? 12 : 0);
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

  const getModeInfo = () => {
    switch (networkMode) {
      case 'GLOBAL':
        return {
          title: 'حالت جهانی (Global)',
          desc: 'اتصال کامل به اینترنت بین‌الملل، مدل‌های ابری هوش مصنوعی و نرخ ارز جهانی',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          dotColor: 'bg-emerald-400',
          icon: Globe,
        };
      case 'INTRANET':
        return {
          title: 'حالت شبکه ملی (Sovereign Intranet)',
          desc: 'قطع ۱۰۰٪ وابستگی به سرورهای خارجی، بدون پکت‌لاس، فونت‌ها و منابع کاملاً محلی',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dotColor: 'bg-amber-400',
          icon: ShieldCheck,
        };
      case 'AIRGAP_OFFLINE':
        return {
          title: 'حالت آفلاین اضطراری (Airgap Offline)',
          desc: 'قطعی سراسری شبکه، کش محلی کاتالوگ، هدایت کلیه تراکنش‌ها به صف کارهای دستی',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dotColor: 'bg-rose-500',
          icon: WifiOff,
        };
    }
  };

  const modeInfo = getModeInfo();
  const ModeIcon = modeInfo.icon;

  return (
    <>
      {/* Network Alert Notification for Packet Loss / Intranet recommendation */}
      {networkMode === 'GLOBAL' && packetLoss > 0 && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>هشدار کندی شبکه بین‌الملل:</strong> پکت‌لاس {packetLoss}٪ یا اختلال در پاسخگویی سرورهای خارجی شناسایی شد.
            </span>
          </div>
          <button
            onClick={() => onNetworkModeChange('INTRANET')}
            className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all shrink-0 shadow-sm"
          >
            سوییچ فوری به «شبکه ملی مستقل» 🇮🇷
          </button>
        </div>
      )}

      {/* Sovereign Intranet Active Notice */}
      {networkMode === 'INTRANET' && (
        <div className="bg-gradient-to-r from-amber-950/70 via-indigo-950/60 to-amber-950/70 border-b border-amber-500/30 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>حالت شبکه ملی مستقل فعال است:</strong> کلیه سرویس‌ها به صورت محلی در داخل کشور بدون هرگونه اتکای خارجی اجرا می‌شوند.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenManualTasks}
              className="text-indigo-300 hover:text-white underline text-[11px]"
            >
              صف کارهای دستی ({pendingManualTasksCount} مورد معلق)
            </button>
            <button
              onClick={() => onNetworkModeChange('GLOBAL')}
              className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px]"
            >
              بازگشت به حالت جهانی
            </button>
          </div>
        </div>
      )}

      {/* Emergency Offline Banner */}
      {networkMode === 'AIRGAP_OFFLINE' && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-4 py-2 text-xs text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-400 shrink-0 animate-ping" />
            <span>
              <strong>حالت آفلاین اضطراری (Airgap Mode):</strong> اینترنت قطع است. کاتالوگ از حافظه محلی لود شده و سفارشات جدید به صف کارهای دستی منتقل می‌شوند.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenManualTasks}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500 transition-all shrink-0 shadow-md"
            >
              مدیریت صف کارهای دستی ({pendingManualTasksCount})
            </button>
            <button
              onClick={() => onNetworkModeChange('INTRANET')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 text-[11px]"
            >
              وصل به شبکه ملی
            </button>
          </div>
        </div>
      )}

      {/* Network Switcher Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">مرکز مدیریت تاب‌آوری شبکه و اینترنت ایران</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با توجه به نوسانات روتینگ، پکت‌لاس بین‌الملل و سیاست‌های شبکه ملی، می‌توانید رفتار سیستم را در یک کلیک به حالت بهینه تغییر دهید تا هیچ سفارشی متوقف نشود:
            </p>

            {/* Mode Selection Cards */}
            <div className="space-y-2.5">
              {/* Option 1: Global */}
              <div
                onClick={() => {
                  onNetworkModeChange('GLOBAL');
                  setShowDetails(false);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  networkMode === 'GLOBAL'
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
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
                        هوش مصنوعی ابری، رصد زنده نرخ دلار آزاد و کراولر رقبا فعال هستند.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: Sovereign Intranet */}
              <div
                onClick={() => {
                  onNetworkModeChange('INTRANET');
                  setShowDetails(false);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  networkMode === 'INTRANET'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
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
                        قطع کامل درخواست‌های خارجی، فونت‌ها و منابع ۱۰۰٪ محلی، سرعت بارگذاری لحظه‌ای.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 3: Airgap Offline */}
              <div
                onClick={() => {
                  onNetworkModeChange('AIRGAP_OFFLINE');
                  setShowDetails(false);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  networkMode === 'AIRGAP_OFFLINE'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
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
                        کش محلی، ثبت سفارشات در صف آفلاین و هدایت امور به «صف کارهای دستی».
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Stats */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block">پینگ سرور:</span>
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
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
