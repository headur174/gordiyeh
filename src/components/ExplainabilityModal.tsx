import React from 'react';
import { CanonicalProduct } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { X, Brain, CheckCircle2, ShieldCheck, AlertTriangle, TrendingUp, Award, Layers } from 'lucide-react';

interface ExplainabilityModalProps {
  product: CanonicalProduct | null;
  onClose: () => void;
}

export const ExplainabilityModal: React.FC<ExplainabilityModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="explainability-modal" 
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-[var(--text-main)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)] shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)]">
                  شفافیت تصمیم الگوریتم (Explainability)
                </span>
                <span className="text-xs text-[var(--text-muted)] font-mono">SKU: {product.sku}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold mt-1 text-[var(--text-main)] line-clamp-1">{product.title}</h2>
            </div>
          </div>
          <button 
            id="btn-close-explainability"
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Winner & Confidence Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>امتیاز کالای برنده (Winner Score)</span>
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
                {product.winnerScore} <span className="text-sm font-normal text-[var(--text-muted)]">/ ۱۰۰</span>
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {product.winnerScore > 85 ? 'واجد شرایط تبلیغ خودکار' : 'نیاز به بهینه‌سازی'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-[var(--accent-text)]" />
                <span>ضریب اطمینان داده‌ها (Confidence)</span>
              </div>
              <div className="text-2xl font-black text-[var(--accent-text)]">
                {product.confidenceScore}٪
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                مبتنی بر ۴ منبع سیگنال بازار
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>حاشیه سود ناخالص</span>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                {formatPercent(product.dna.currentMarginPercent)}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                سود: {formatCurrency(product.retailPrice - product.baseCost)}
              </div>
            </div>
          </div>

          {/* Core Evidence List */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent-text)]" />
              مدارک و شواهد سیستمی (System Evidence & Signals)
            </h3>
            <div className="space-y-2">
              {product.evidence.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-main)]"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] font-mono text-xs flex items-center justify-center border border-[var(--border-active)]">
                    {idx + 1}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product DNA Factors */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              شناسنامه ژنتیکی کالا (Product DNA Breakdown)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-xs text-[var(--text-muted)] block mb-1">تقاضای فعال</span>
                <span className="text-base font-bold text-teal-700 dark:text-teal-400">{product.dna.demandScore} / ۱۰۰</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-xs text-[var(--text-muted)] block mb-1">کشش قیمتی</span>
                <span className="text-base font-bold font-mono text-[var(--text-main)]">{product.dna.priceElasticity}</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-xs text-[var(--text-muted)] block mb-1">اعتبار تأمین‌کننده</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{product.dna.supplierReliability}٪</span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                <span className="text-xs text-[var(--text-muted)] block mb-1">ریسک مرجوعی</span>
                <span className={`text-base font-bold ${product.dna.returnRiskScore > 50 ? 'text-rose-700 dark:text-rose-400' : 'text-[var(--text-main)]'}`}>
                  {product.dna.returnRiskScore}٪
                </span>
              </div>
            </div>
          </div>

          {/* Event Affinity */}
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] mb-3">
              همبستگی و کشش مناسبتی (Event Affinity Scores)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                <span className="text-xs text-[var(--text-main)]">🍉 شب یلدا</span>
                <span className="text-sm font-bold text-rose-700 dark:text-rose-400">{product.dna.eventAffinity.yalda}٪</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-xs text-[var(--text-main)]">🌱 عید نوروز</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{product.dna.eventAffinity.nowruz}٪</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <span className="text-xs text-[var(--text-main)]">🏷️ جمعه سیاه</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{product.dna.eventAffinity.blackFriday}٪</span>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                <span className="text-xs text-[var(--text-main)]">❤️ مناسبتی</span>
                <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{product.dna.eventAffinity.valentine}٪</span>
              </div>
            </div>
          </div>

          {/* Business Rule Guardrails applied */}
          <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--accent-text)] flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-[var(--text-main)]">
              <p className="font-bold text-[var(--accent-text)]">قوانین محافظتی فعال برای این کالا:</p>
              <p>• حداقل حاشیه سود مجاز: {product.minMargin}٪ (فروش زیر این سود ممنوع است)</p>
              <p>• اگر موجودی آفر فعال به صفر برسد، سوئیچ خودکار به تامین‌کننده جایگزین اعمال خواهد شد.</p>
              <p>• تغییر قیمت پیشنهادی در محدوده مجاز ۱۵٪ ارزیابی شده است.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-sm font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
          >
            متوجه شدم (بستن)
          </button>
        </div>
      </div>
    </div>
  );
};
