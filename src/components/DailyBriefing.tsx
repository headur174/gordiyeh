import React from 'react';
import { StoreFinancialSummary, ApprovalItem } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { 
  TrendingUp, 
  Wallet, 
  ShoppingBag, 
  Sparkles, 
  AlertTriangle, 
  Package, 
  Tag, 
  Calendar, 
  ArrowLeft,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface DailyBriefingProps {
  summary: StoreFinancialSummary;
  pendingApprovals: ApprovalItem[];
  onNavigateToTab: (tab: string) => void;
  onQuickApproveFirst: () => void;
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({
  summary,
  pendingApprovals,
  onNavigateToTab,
  onQuickApproveFirst,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              گزارش صبحگاهی ناظر سیستم (Daily Briefing)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            خلاصه وضعیت امروز بازرگانی، سود خالص سهم‌آور (Contribution Profit) و کارهای معوق که منتظر تأیید شما هستند.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right pl-3 border-l border-slate-800">
            <span className="text-xs text-slate-400 block">وضعیت اتوپایلوت هسته</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              🟢 AUTOPILOT: ON
            </span>
          </div>
          <button
            id="btn-nav-approval"
            onClick={() => onNavigateToTab('approvals')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-colors"
          >
            مشاهده صف تأیید ({pendingApprovals.length})
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards with Contribution Profit as the hero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">فروش ناخالص امروز (Revenue)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(summary.todayRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <span className="text-emerald-400 font-bold font-mono">+۱۴.۲٪</span> نسبت به دیروز
          </div>
        </div>

        {/* Contribution Profit HERO Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400">سود خالص سهم‌آور (Contribution Profit)</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {formatCurrency(summary.todayContributionProfit)}
          </div>
          <div className="text-xs text-slate-300 mt-1.5">
            حاشیه سود خالص واقعی: <span className="font-bold text-emerald-400">{formatPercent(summary.profitMarginPercent)}</span>
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">سفارشات قطعی امروز</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {formatNumber(summary.todayOrdersCount)} <span className="text-xs font-normal text-slate-400">سفارش</span>
          </div>
          <div className="text-xs text-slate-400 mt-1.5">
            میانگین سبد (AOV): {formatCurrency(summary.averageOrderValue)}
          </div>
        </div>

        {/* Safety & Rule Engine Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">پایش گاردریل قوانین</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            ۱۰۰٪ فعال
          </div>
          <div className="text-xs text-slate-400 mt-1.5">
            ۸ قانون فعال بدون نقض سیاست تجاری
          </div>
        </div>
      </div>

      {/* The 5 Pillars Overview (Winners, Problems, Stock Issues, Price Opps, Campaign Opps) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigateToTab('catalog')}
          className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-500 hover:bg-slate-800/80 transition-all text-right group"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            🔥 {summary.winnersCount} برنده (Winners)
          </div>
          <p className="text-xs text-slate-400">کالاهای با تقاضای صعودی و سود بالا</p>
        </button>

        <button
          onClick={() => onNavigateToTab('suppliers')}
          className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30 hover:border-rose-500 hover:bg-slate-800/80 transition-all text-right group"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            ⚠️ {summary.problemsCount} چالش عملیاتی
          </div>
          <p className="text-xs text-slate-400">مرجوعی بالا یا تأخیر ترخیص</p>
        </button>

        <button
          onClick={() => onNavigateToTab('catalog')}
          className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-500 hover:bg-slate-800/80 transition-all text-right group"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-1">
            <Package className="w-3.5 h-3.5" />
            📦 {summary.stockIssuesCount} اخطار موجودی
          </div>
          <p className="text-xs text-slate-400">در آستانه اتمام یا نیازمند سوئیچ</p>
        </button>

        <button
          onClick={() => onNavigateToTab('rule-engine')}
          className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500 hover:bg-slate-800/80 transition-all text-right group"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
            <Tag className="w-3.5 h-3.5" />
            💰 {summary.priceOpportunitiesCount} فرصت بازقیمت‌گذاری
          </div>
          <p className="text-xs text-slate-400">تعدیل هوشمند طبق میانه بازار</p>
        </button>

        <button
          onClick={() => onNavigateToTab('campaigns')}
          className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-500 hover:bg-slate-800/80 transition-all text-right group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            🎯 {summary.campaignOpportunitiesCount} فرصت کمپین
          </div>
          <p className="text-xs text-slate-400">یلدا، جمعه سیاه و نوروز</p>
        </button>
      </div>

      {/* "NEEDS YOU" Action Card */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                نیازمند اقدام مستقیم شما (NEEDS YOU)
              </h2>
              <p className="text-xs text-slate-400">
                این {pendingApprovals.length} مورد خارج از محدوده خودمختار اتوپایلوت بوده و به دستور شما نیاز دارند:
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('approvals')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
          >
            مدیریت کامل صف
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pendingApprovals.map((item, idx) => (
            <div 
              key={item.id}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`px-2 py-0.5 rounded font-black ${
                    item.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {idx + 1}. {item.priority === 'HIGH' ? 'فوری' : 'بررسی'}
                  </span>
                  <span className="text-slate-400">{item.createdAt}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-2">{item.productTitle}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.reason}</p>
              </div>

              <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-medium font-mono">{item.proposedValue.slice(0, 30)}...</span>
                <button
                  onClick={() => onNavigateToTab('approvals')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 text-xs font-bold transition-colors"
                >
                  اقدام
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Profit Formula Transparency */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
        <h4 className="font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          فرمول شفاف محاسبه سود سهم‌آور واقعی (Contribution Profit Formula):
        </h4>
        <div className="p-3 bg-slate-950 rounded-xl font-mono text-slate-300 text-xs sm:text-sm overflow-x-auto border border-slate-800">
          Contribution Profit = Revenue - Supplier Cost - Shipping - Payment Gateway Fee - Discount - Return/Refund - Marketing Allocation
        </div>
        <p className="text-slate-400 leading-relaxed">
          سیستم بر خلاف پلتفرم‌های سنتی، تمرکز اصلی را بر حجم فروش خام قرار نداده، بلکه بازدهی خالص هر ریال یا دلار ورودی پس از کسر تمامی هزینه‌های پنهان را ملاک تصمیم‌گیری‌های اتوپایلوت و رتبه‌بندی کالاها قرار می‌دهد.
        </p>
      </div>
    </div>
  );
};
