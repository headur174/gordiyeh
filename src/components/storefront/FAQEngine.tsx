import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, HelpCircle, Plus, RotateCcw, Trash2, CheckCircle2, EyeOff } from 'lucide-react';
import { CanonicalProduct } from '../../types';
import {
  CategoryBuyerFAQRule,
  DEFAULT_CATEGORY_FAQ_RULES,
  FAQ_BANK_STORAGE_KEY,
  GordiyehCategorySlug,
  mapPersianCategoryToSlug,
  ProductCardEvidenceField,
  resolveProductDocumentedFAQ,
  ResolvedProductFAQ,
} from '../../data/contentGuidelines';

const CATEGORY_LABELS: Record<GordiyehCategorySlug, string> = {
  digital: 'کالای دیجیتال',
  'smart-home': 'لوازم خانگی هوشمند',
  'travel-camping': 'سفر و کمپینگ',
  'beauty-health': 'زیبایی و سلامت',
};

const EVIDENCE_FIELD_OPTIONS: Array<{ value: ProductCardEvidenceField; label: string }> = [
  { value: 'description', label: 'توضیح محصول' },
  { value: 'specs', label: 'جدول مشخصات' },
  { value: 'keyFeatures', label: 'ویژگی‌ها' },
  { value: 'usageContexts', label: 'کجا به کار می‌آد' },
  { value: 'suitableFor', label: 'برای چه کسی مناسبه' },
  { value: 'notSuitableFor', label: 'برای چه کسی نیست' },
  { value: 'testExchangeBox', label: 'جعبه‌ی تست و تعویض' },
  { value: 'expertReview', label: 'بررسی و محدودیت‌ها' },
];

const FAQ_SYNC_EVENT = 'gordiyeh:faq-bank-updated';

export function loadCategoryFaqBank(): CategoryBuyerFAQRule[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORY_FAQ_RULES;
  try {
    const raw = window.localStorage.getItem(FAQ_BANK_STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORY_FAQ_RULES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback to defaults when storage is unavailable or malformed
  }
  return DEFAULT_CATEGORY_FAQ_RULES;
}

function saveCategoryFaqBank(rules: CategoryBuyerFAQRule[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAQ_BANK_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new CustomEvent(FAQ_SYNC_EVENT));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

interface FAQEngineProductProps {
  mode?: 'product';
  product: CanonicalProduct;
  products?: never;
  onInsertToDocument?: never;
}

interface FAQEngineManagerProps {
  mode: 'manager';
  product?: never;
  products: CanonicalProduct[];
  onInsertToDocument?: (question: string, documentedAnswer?: string) => void;
}

export type FAQEngineProps = FAQEngineProductProps | FAQEngineManagerProps;

export const FAQEngine: React.FC<FAQEngineProps> = (props) => {
  const [rules, setRules] = useState<CategoryBuyerFAQRule[]>(() => loadCategoryFaqBank());
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Manager states
  const [activeCategory, setActiveCategory] = useState<GordiyehCategorySlug>('digital');
  const [previewProductId, setPreviewProductId] = useState<string>('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newSignalsText, setNewSignalsText] = useState('');
  const [newSourceFields, setNewSourceFields] = useState<ProductCardEvidenceField[]>([
    'specs',
    'notSuitableFor',
  ]);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  useEffect(() => {
    const syncRules = () => setRules(loadCategoryFaqBank());
    window.addEventListener(FAQ_SYNC_EVENT, syncRules);
    window.addEventListener('storage', syncRules);
    return () => {
      window.removeEventListener(FAQ_SYNC_EVENT, syncRules);
      window.removeEventListener('storage', syncRules);
    };
  }, []);

  // =========================================================================
  // MODE 1: STOREFRONT PRODUCT PAGE FAQ DISPLAY (ONLY DOCUMENTED ANSWERS)
  // =========================================================================
  const resolvedProductFaqs = useMemo<ResolvedProductFAQ[]>(() => {
    if (props.mode === 'manager' || !props.product) return [];
    const catSlug = mapPersianCategoryToSlug(props.product.category);
    const categoryRules = rules.filter(r => r.categorySlug === catSlug);
    const resolved: ResolvedProductFAQ[] = [];

    for (const rule of categoryRules) {
      const match = resolveProductDocumentedFAQ(props.product, rule);
      if (match) {
        resolved.push(match);
      }
    }
    return resolved;
  }, [props.mode, props.product, rules]);

  useEffect(() => {
    if (props.mode !== 'manager' && resolvedProductFaqs.length > 0) {
      setOpenFaqId(prev =>
        prev && resolvedProductFaqs.some(f => f.id === prev) ? prev : resolvedProductFaqs[0].id
      );
    }
  }, [props.mode, resolvedProductFaqs]);

  if (props.mode !== 'manager') {
    if (resolvedProductFaqs.length === 0) {
      return null;
    }

    const catLabel = props.product.category || CATEGORY_LABELS[mapPersianCategoryToSlug(props.product.category)];

    return (
      <section
        aria-labelledby="product-faq-engine-heading"
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 space-y-4 text-right"
        dir="rtl"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
            <h3 id="product-faq-engine-heading" className="text-sm sm:text-base font-bold text-[var(--text-main)]">
              پرسش‌های رایج درباره‌ی این محصول
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>دسته‌ی {catLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{resolvedProductFaqs.length} پاسخ مستند از کارت کالا</span>
          </div>
        </div>

        <div className="divide-y divide-[var(--border-color)]">
          {resolvedProductFaqs.map((item) => {
            const isExpanded = openFaqId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const buttonId = `faq-btn-${item.id}`;

            return (
              <div key={item.id} className="py-1 first:pt-0 last:pb-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => setOpenFaqId(isExpanded ? null : item.id)}
                  className="w-full min-h-[44px] py-3 px-1 flex items-center justify-between gap-4 text-right text-xs sm:text-sm font-semibold text-[var(--text-main)] hover:text-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] rounded-lg transition-colors cursor-pointer"
                >
                  <span className="leading-relaxed">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-[var(--accent-primary)]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isExpanded && (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="pb-4 pt-1 px-1 space-y-2 text-xs text-[var(--text-muted)] leading-relaxed"
                  >
                    <p className="text-[var(--text-main)] leading-relaxed">{item.answer}</p>
                    <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-1.5">
                      <span>منبع پاسخ در کارت کالا:</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.evidenceSources.join(' / ')}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // =========================================================================
  // MODE 2: CMS CATEGORY QUESTION BANK MANAGER
  // =========================================================================
  const categoryProducts = useMemo(
    () => props.products.filter(p => mapPersianCategoryToSlug(p.category) === activeCategory),
    [props.products, activeCategory]
  );

  const selectedPreviewProduct = useMemo(() => {
    if (categoryProducts.length === 0) return null;
    return categoryProducts.find(p => p.id === previewProductId) || categoryProducts[0];
  }, [categoryProducts, previewProductId]);

  const activeCategoryRules = useMemo(
    () => rules.filter(r => r.categorySlug === activeCategory),
    [rules, activeCategory]
  );

  const toggleSourceField = (field: ProductCardEvidenceField) => {
    setNewSourceFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const q = newQuestion.trim();
    const signals = newSignalsText
      .split(/[،,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (q.length < 6) {
      setFormNotice('متن سؤال باید دست‌کم ۶ کاراکتر و به زبان خریدار نوشته بشه.');
      return;
    }
    if (signals.length === 0) {
      setFormNotice('حداقل یک کلیدواژه یا نام فیلد کارت کالا برای بررسی مستند بودن پاسخ بنویسید.');
      return;
    }
    if (newSourceFields.length === 0) {
      setFormNotice('حداقل یک بخش مرجع از کارت محصول رو برای استخراج پاسخ انتخاب کنید.');
      return;
    }

    const created: CategoryBuyerFAQRule = {
      id: `faq_custom_${Date.now()}`,
      categorySlug: activeCategory,
      question: q,
      requiredSignals: signals,
      sourceFields: newSourceFields,
      isCustom: true,
    };

    const next = [...rules, created];
    setRules(next);
    saveCategoryFaqBank(next);
    setNewQuestion('');
    setNewSignalsText('');
    setFormNotice('سؤال جدید به بانک دسته‌ی انتخاب‌شده اضافه و ذخیره شد.');
  };

  const handleDeleteRule = (id: string) => {
    const next = rules.filter(r => r.id !== id);
    setRules(next);
    saveCategoryFaqBank(next);
    setFormNotice('سؤال از بانک دسته حذف شد.');
  };

  const handleResetDefaults = () => {
    setRules(DEFAULT_CATEGORY_FAQ_RULES);
    saveCategoryFaqBank(DEFAULT_CATEGORY_FAQ_RULES);
    setFormNotice('بانک سؤالات دسته‌ها به حالت استاندارد دستورالعمل ۱٫۰ برگشت.');
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[var(--accent-primary)] shrink-0" aria-hidden="true" />
            <span>موتور مدیریت بانک سؤالات خریدار (بند ۹ دستورالعمل)</span>
          </h4>
          <p className="text-xs text-[var(--text-muted)]">
            سؤال‌های هر دسته فقط وقتی در صفحه‌ی محصول نمایش داده می‌شن که جواب مستند توی کارت همون محصول پیدا بشه.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-3 py-1.5 min-h-[40px] rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>بازنشانی پیش‌فرض</span>
        </button>
      </div>

      {/* Category Segmented Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(CATEGORY_LABELS) as GordiyehCategorySlug[]).map((slug) => {
          const count = rules.filter(r => r.categorySlug === slug).length;
          const isActive = activeCategory === slug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => {
                setActiveCategory(slug);
                setPreviewProductId('');
              }}
              className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{CATEGORY_LABELS[slug]}</span>
              <span className="mr-1.5 opacity-80 font-mono tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Product Card Grounding Simulator */}
      <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-[var(--text-main)]">
          پیش‌نمایش فیلتر خودکار روی کارت محصول:
        </span>
        <select
          value={selectedPreviewProduct?.id || ''}
          onChange={(e) => setPreviewProductId(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden max-w-md"
        >
          {categoryProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Rules List with Grounded Preview */}
      <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl bg-[var(--bg-main)] px-4">
        {activeCategoryRules.map((rule) => {
          const resolved = selectedPreviewProduct
            ? resolveProductDocumentedFAQ(selectedPreviewProduct, rule)
            : null;

          return (
            <div key={rule.id} className="py-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="font-bold text-[var(--text-main)] leading-relaxed">{rule.question}</div>
                  <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap items-center gap-2">
                    <span>نشانه‌های الزامی: {rule.requiredSignals.join('، ')}</span>
                    <span aria-hidden="true">·</span>
                    <span>منابع: {rule.sourceFields.join('، ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {props.onInsertToDocument && (
                    <button
                      type="button"
                      onClick={() => props.onInsertToDocument?.(rule.question, resolved?.answer)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--accent-primary)] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      + درج در سند
                    </button>
                  )}
                  {rule.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      aria-label="حذف سؤال"
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {selectedPreviewProduct && (
                <div className="text-[11px] leading-relaxed pt-1">
                  {resolved ? (
                    <div className="flex items-start gap-2 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-0.5">
                        <span className="font-semibold">نمایش در صفحه‌ی این کالا: </span>
                        <span className="text-[var(--text-main)]">{resolved.answer}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                      <EyeOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>در صفحه‌ی این محصول مخفی می‌شه (شواهد مستندش توی کارت این کالا نیست).</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Category Question Rule Form */}
      <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3 text-xs">
        <div className="font-bold text-[var(--text-main)]">
          افزودن سؤال جدید به دسته‌ی {CATEGORY_LABELS[activeCategory]}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">متن سؤال خریدار *</label>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="مثلاً: با یک شارژ کامل چند بار کار می‌کنه؟"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">
              نشانه‌های مستند در کارت (با ویرگول جدا کنید، یا نام فیلد مثل testExchangeBox) *
            </label>
            <input
              type="text"
              value={newSignalsText}
              onChange={(e) => setNewSignalsText(e.target.value)}
              placeholder="مثلاً: شارژ، میلی‌آمپر، باتری"
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-[11px] text-[var(--text-muted)]">فیلدهای مرجع برای استخراج جواب:</span>
          <div className="flex flex-wrap gap-2">
            {EVIDENCE_FIELD_OPTIONS.map((opt) => {
              const checked = newSourceFields.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleSourceField(opt.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    checked
                      ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {formNotice && (
          <div className="text-[11px] text-[var(--accent-primary)] font-semibold">{formNotice}</div>
        )}

        <button
          type="submit"
          className="px-4 py-2 min-h-[40px] rounded-xl bg-[var(--accent-primary)] text-white font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>افزودن به بانک سؤالات دسته</span>
        </button>
      </form>
    </div>
  );
};
