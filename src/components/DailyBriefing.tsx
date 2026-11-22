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
      <div className="bg-gradient-to-l from-[var(--bg-card)] via-[var(--bg-surface)] to-[var(--bg-card)] p-4 sm:p-6 rounded-2xl border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <h1 className="text-lg sm:text-2xl font-black text-[var(--text-main)] leading-snug">
              گزارش صبحگاهی ناظر سیستم (Daily Briefing)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            خلاصه وضعیت امروز بازرگانی، سود خالص سهم‌آور (Contribution Profit) و کارهای معوق که منتظر تأیید شما هستند.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right pl-3 border-l border-[var(--border-color)]">
            <span className="text-xs text-[var(--text-muted)] block">وضعیت اتوپایلوت هسته</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              🟢 AUTOPILOT: ON
            </span>
          </div>
          <button
            id="btn-nav-approval"
            onClick={() => onNavigateToTab('approvals')}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-colors cursor-pointer whitespace-nowrap"
          >
            مشاهده صف تأیید ({pendingApprovals.length})
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards with Contribution Profit as the hero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">فروش ناخالص امروز (Revenue)</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
            {formatCurrency(summary.todayRevenue)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">+۱۴.۲٪</span> نسبت به دیروز
          </div>
        </div>

        {/* Contribution Profit HERO Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[var(--bg-surface)] to-[var(--bg-card)] border border-emerald-600/35 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">سود خالص سهم‌آور (Contribution Profit)</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {formatCurrency(summary.todayContributionProfit)}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1.5">
            حاشیه سود خالص واقعی: <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatPercent(summary.profitMarginPercent)}</span>
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">سفارشات قطعی امروز</span>
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
            {formatNumber(summary.todayOrdersCount)} <span className="text-xs font-normal text-[var(--text-muted)]">سفارش</span>
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1.5">
            میانگین سبد (AOV): {formatCurrency(summary.averageOrderValue)}
          </div>
        </div>

        {/* Safety & Rule Engine Card */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">پایش گاردریل قوانین</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
            ۱۰۰٪ فعال
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1.5">
            ۸ قانون فعال بدون نقض سیاست تجاری
          </div>
        </div>
      </div>

      {/* The 5 Pillars Overview (Winners, Problems, Stock Issues, Price Opps, Campaign Opps) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigateToTab('catalog')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-amber-600/35 hover:border-amber-500 hover:bg-[var(--bg-card)] transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            🔥 {summary.winnersCount} برنده (Winners)
          </div>
          <p className="text-xs text-[var(--text-muted)]">کالاهای با تقاضای صعودی و سود بالا</p>
        </button>

        <button
          onClick={() => onNavigateToTab('suppliers')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-rose-600/35 hover:border-rose-500 hover:bg-[var(--bg-card)] transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            ⚠️ {summary.problemsCount} چالش عملیاتی
          </div>
          <p className="text-xs text-[var(--text-muted)]">مرجوعی بالا یا تأخیر ترخیص</p>
        </button>

        <button
          onClick={() => onNavigateToTab('catalog')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-active)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card)] transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-text)] mb-1">
            <Package className="w-3.5 h-3.5 shrink-0" />
            📦 {summary.stockIssuesCount} اخطار موجودی
          </div>
          <p className="text-xs text-[var(--text-muted)]">در آستانه اتمام یا نیازمند سوئیچ</p>
        </button>

        <button
          onClick={() => onNavigateToTab('rule-engine')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-emerald-600/35 hover:border-emerald-500 hover:bg-[var(--bg-card)] transition-all text-right group cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
            <Tag className="w-3.5 h-3.5 shrink-0" />
            💰 {summary.priceOpportunitiesCount} فرصت بازقیمت‌گذاری
          </div>
          <p className="text-xs text-[var(--text-muted)]">تعدیل هوشمند طبق میانه بازار</p>
        </button>

        <button
          onClick={() => onNavigateToTab('campaigns')}
          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-teal-600/35 hover:border-teal-500 hover:bg-[var(--bg-card)] transition-all text-right group sm:col-span-1 cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 mb-1">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            🎯 {summary.campaignOpportunitiesCount} فرصت کمپین
          </div>
          <p className="text-xs text-[var(--text-muted)]">یلدا، جمعه سیاه و نوروز</p>
        </button>
      </div>

      {/* "NEEDS YOU" Action Card */}
      <div className="bg-[var(--bg-surface)] border border-amber-600/40 rounded-2xl p-4 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
                نیازمند اقدام مستقیم شما (NEEDS YOU)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                این {pendingApprovals.length} مورد خارج از محدوده خودمختار اتوپایلوت بوده و به دستور شما نیاز دارند:
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('approvals')}
            className="text-xs text-[var(--accent-text)] hover:underline font-bold flex items-center gap-1 self-end sm:self-auto cursor-pointer"
          >
            مدیریت کامل صف
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {pendingApprovals.map((item, idx) => (
            <div 
              key={item.id}
              className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                  <span className={`px-2 py-0.5 rounded font-black ${
                    item.priority === 'HIGH' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                  }`}>
                    {idx + 1}. {item.priority === 'HIGH' ? 'فوری' : 'بررسی'}
                  </span>
                  <span className="text-[var(--text-muted)] font-mono">{item.createdAt}</span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-main)] line-clamp-2">{item.productTitle}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{item.reason}</p>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--accent-text)] font-medium font-mono truncate">{item.proposedValue.slice(0, 30)}...</span>
                <button
                  onClick={() => onNavigateToTab('approvals')}
                  className="px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-primary)] text-[var(--accent-text)] hover:text-[#F7F3EA] text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  اقدام
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contribution Profit Formula Transparency */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] space-y-2">
        <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          فرمول شفاف محاسبه سود سهم‌آور واقعی (Contribution Profit Formula):
        </h4>
        <div className="p-3 bg-[var(--bg-main)] rounded-xl font-mono text-[var(--text-main)] text-xs sm:text-sm overflow-x-auto border border-[var(--border-color)] dir-ltr text-left">
          Contribution Profit = Revenue - Supplier Cost - Shipping - Payment Gateway Fee - Discount - Return/Refund - Marketing Allocation
        </div>
        <p className="text-[var(--text-muted)] leading-relaxed">
          سیستم بر خلاف پلتفرم‌های سنتی، تمرکز اصلی را بر حجم فروش خام قرار نداده، بلکه بازدهی خالص هر ریال یا دلار ورودی پس از کسر تمامی هزینه‌های پنهان را ملاک تصمیم‌گیری‌های اتوپایلوت و رتبه‌بندی کالاها قرار می‌دهد.
        </p>
      </div>
    </div>
  );
};
