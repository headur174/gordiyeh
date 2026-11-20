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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="explainability-modal" 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  شفافیت تصمیم الگوریتم (Explainability)
                </span>
                <span className="text-xs text-slate-400">SKU: {product.sku}</span>
              </div>
              <h2 className="text-lg font-bold mt-1 text-white line-clamp-1">{product.title}</h2>
            </div>
          </div>
          <button 
            id="btn-close-explainability"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Winner & Confidence Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Award className="w-4 h-4 text-amber-400" />
                <span>امتیاز کالای برنده (Winner Score)</span>
              </div>
              <div className="text-2xl font-black text-amber-400">
                {product.winnerScore} <span className="text-sm font-normal text-slate-400">/ ۱۰۰</span>
              </div>
              <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {product.winnerScore > 85 ? 'واجد شرایط تبلیغ خودکار' : 'نیاز به بهینه‌سازی'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>ضریب اطمینان داده‌ها (Confidence)</span>
              </div>
              <div className="text-2xl font-black text-indigo-400">
                {product.confidenceScore}٪
              </div>
              <div className="text-xs text-slate-400 mt-1">
                مبتنی بر ۴ منبع سیگنال بازار
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>حاشیه سود ناخالص</span>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {formatPercent(product.dna.currentMarginPercent)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                سود: {formatCurrency(product.retailPrice - product.baseCost)}
              </div>
            </div>
          </div>

          {/* Core Evidence List */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              مدارک و شواهد سیستمی (System Evidence & Signals)
            </h3>
            <div className="space-y-2">
              {product.evidence.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-sm text-slate-300"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-xs flex items-center justify-center border border-indigo-500/30">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product DNA Factors */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              شناسنامه ژنتیکی کالا (Product DNA Breakdown)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">تقاضای فعال</span>
                <span className="text-base font-bold text-cyan-400">{product.dna.demandScore} / ۱۰۰</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">کشش قیمتی</span>
                <span className="text-base font-bold font-mono text-slate-200">{product.dna.priceElasticity}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">اعتبار تأمین‌کننده</span>
                <span className="text-base font-bold text-emerald-400">{product.dna.supplierReliability}٪</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">ریسک مرجوعی</span>
                <span className={`text-base font-bold ${product.dna.returnRiskScore > 50 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {product.dna.returnRiskScore}٪
                </span>
              </div>
            </div>
          </div>

          {/* Event Affinity */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-3">
              همبستگی و کشش مناسبتی (Event Affinity Scores)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-300">🍉 شب یلدا</span>
                <span className="text-sm font-bold text-rose-400">{product.dna.eventAffinity.yalda}٪</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-300">🌱 عید نوروز</span>
                <span className="text-sm font-bold text-emerald-400">{product.dna.eventAffinity.nowruz}٪</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-300">🏷️ جمعه سیاه</span>
                <span className="text-sm font-bold text-amber-400">{product.dna.eventAffinity.blackFriday}٪</span>
              </div>
              <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-300">❤️ ولنتاین</span>
                <span className="text-sm font-bold text-pink-400">{product.dna.eventAffinity.valentine}٪</span>
              </div>
            </div>
          </div>

          {/* Business Rule Guardrails applied */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-slate-300">
              <p className="font-bold text-indigo-300">قوانین محافظتی فعال برای این کالا:</p>
              <p>• حداقل حاشیه سود مجاز: {product.minMargin}٪ (فروش زیر این سود ممنوع است)</p>
              <p>• اگر موجودی آفر فعال به صفر برسد، سوئیچ خودکار به تامین‌کننده جایگزین اعمال خواهد شد.</p>
              <p>• تغییر قیمت پیشنهادی در محدوده مجاز ۱۵٪ ارزیابی شده است.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition-colors"
          >
            متوجه شدم (بستن)
          </button>
        </div>
      </div>
    </div>
  );
};
