import React, { useState } from 'react';
import { BusinessRule, AutomationMatrix, AutomationLevel } from '../types';
import { 
  ShieldCheck, 
  Sliders, 
  Plus, 
  Check, 
  AlertOctagon, 
  SlidersHorizontal,
  Bot,
  UserCheck,
  Hand,
  Settings2,
  Trash2
} from 'lucide-react';

interface RuleEngineViewProps {
  rules: BusinessRule[];
  automationMatrix: AutomationMatrix;
  onUpdateRuleThreshold: (ruleId: string, newThreshold: number) => void;
  onToggleRule: (ruleId: string) => void;
  onUpdateAutomationMatrix: (module: keyof AutomationMatrix, level: AutomationLevel) => void;
  onAddNewRule: (newRule: Omit<BusinessRule, 'id'>) => void;
  onDeleteRule?: (ruleId: string) => void;
}

export const RuleEngineView: React.FC<RuleEngineViewProps> = ({
  rules,
  automationMatrix,
  onUpdateRuleThreshold,
  onToggleRule,
  onUpdateAutomationMatrix,
  onAddNewRule,
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);

  // Add rule modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRuleNameFa, setNewRuleNameFa] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<BusinessRule['category']>('PRICING');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRuleVal, setNewRuleVal] = useState<number>(20);
  const [newRuleUnit, setNewRuleUnit] = useState('%');
  const [newRuleAction, setNewRuleAction] = useState<BusinessRule['action']>('APPROVAL_QUEUE');

  const startEdit = (rule: BusinessRule) => {
    setEditingRuleId(rule.id);
    setTempThreshold(Number(rule.thresholdValue));
  };

  const saveEdit = (ruleId: string) => {
    onUpdateRuleThreshold(ruleId, tempThreshold);
    setEditingRuleId(null);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleNameFa.trim()) return;

    onAddNewRule({
      name: newRuleNameFa,
      nameFa: newRuleNameFa,
      category: newRuleCategory,
      conditionDescription: newRuleDesc || 'قانون سفارشی تعریف شده توسط ناظر سیستم',
      thresholdValue: newRuleVal,
      thresholdUnit: newRuleUnit,
      action: newRuleAction,
      actionFa: newRuleAction === 'AUTO_APPLY' ? 'اعمال خودکار' : 'انتقال به صف تأیید',
      isEnabled: true,
      isSystemCore: false,
    });

    setIsAddOpen(false);
    setNewRuleNameFa('');
    setNewRuleDesc('');
  };

  const renderAutomationBadge = (level: AutomationLevel) => {
    switch (level) {
      case 'AUTOPILOT':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 flex items-center gap-1 shrink-0">
            <Bot className="w-3.5 h-3.5" />
            🟢 Autopilot
          </span>
        );
      case 'COPILOT':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 flex items-center gap-1 shrink-0">
            <UserCheck className="w-3.5 h-3.5" />
            🟡 Copilot
          </span>
        );
      case 'MANUAL':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/35 flex items-center gap-1 shrink-0">
            <Hand className="w-3.5 h-3.5" />
            🔴 Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[var(--accent-text)] shrink-0" />
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)]">موتور قوانین و سیاست‌های تجاری (Rule Engine)</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            قوانین حاکم بر کلیه تصمیمات هوش مصنوعی و اتوپایلوت. هیچ تصمیمی نمی‌تواند این سقف‌ها و شروط را دور بزند.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          افزودن قانون کسب‌وکار جدید
        </button>
      </div>

      {/* Tri-Modal Automation Matrix Control (Autopilot / Copilot / Manual) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[var(--accent-text)] shrink-0" />
            <h2 className="text-base font-bold text-[var(--text-main)]">
              ماتریس ۳ حالته سطح اختیارات (Tri-Modal Automation Matrix)
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">تنظیم تفکیکی برای هر زیرسیستم</span>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          برای هر ماژول می‌توانید مشخص کنید آیا سیستم مستقلاً عمل کند (Autopilot 🟢)، پس از تأیید شما اجرا شود (Copilot 🟡)، یا فقط با دستور دستی فعال شود (Manual 🔴).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {[
            { key: 'pricing', title: 'قیمت‌گذاری و تخفیف‌ها', desc: 'تغییر قیمت بر اساس میانه رقبا و حاشیه سود' },
            { key: 'inventorySync', title: 'همگام‌سازی موجودی انبار', desc: 'بروزرسانی لحظه‌ای استوک تامین‌کنندگان' },
            { key: 'orderRouting', title: 'مسیریابی سفارشات عادی', desc: 'ارسال سفارشات کم‌ریسک به انبار تامین‌کننده' },
            { key: 'supplierSwitching', title: 'سوئیچ خودکار تأمین‌کننده', desc: 'تغییر به تامین‌کننده ثانویه هنگام ناموجودی' },
            { key: 'campaigns', title: 'کمپین‌ها و پروموشن‌ها', desc: 'طراحی تخفیف و بسته‌های مناسبتی' },
            { key: 'highValueRefunds', title: 'مرجوعی و استرداد وجه بزرگ', desc: 'تایید عودت وجه با مبالغ قابل توجه' },
          ].map((mod) => {
            const currentLevel = automationMatrix[mod.key as keyof AutomationMatrix];

            return (
              <div key={mod.key} className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">{mod.title}</h3>
                    {renderAutomationBadge(currentLevel)}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{mod.desc}</p>
                </div>

                {/* Level selector buttons */}
                <div className="grid grid-cols-3 gap-1 bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)] text-[11px]">
                  <button
                    onClick={() => onUpdateAutomationMatrix(mod.key as keyof AutomationMatrix, 'AUTOPILOT')}
                    className={`py-1 rounded font-semibold transition-colors cursor-pointer ${
                      currentLevel === 'AUTOPILOT' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => onUpdateAutomationMatrix(mod.key as keyof AutomationMatrix, 'COPILOT')}
                    className={`py-1 rounded font-semibold transition-colors cursor-pointer ${
                      currentLevel === 'COPILOT' ? 'bg-amber-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Copilot
                  </button>
                  <button
                    onClick={() => onUpdateAutomationMatrix(mod.key as keyof AutomationMatrix, 'MANUAL')}
                    className={`py-1 rounded font-semibold transition-colors cursor-pointer ${
                      currentLevel === 'MANUAL' ? 'bg-rose-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules Table / Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[var(--accent-text)] shrink-0" />
            فهرست قوانین و مقادیر آستانه قابل تنظیم (Configurable Rules)
          </h2>
          <span className="text-xs text-[var(--text-muted)]">{rules.length} قانون تعریف شده</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const isEditing = editingRuleId === rule.id;

            return (
              <div
                key={rule.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  rule.isEnabled
                    ? 'bg-[var(--bg-surface)] border-[var(--border-color)] shadow-xs'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-text)] font-bold">
                        {rule.category}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">{rule.nameFa}</h3>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                      {rule.conditionDescription}
                    </p>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                      rule.isEnabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
                    }`}
                    title={rule.isEnabled ? 'قانون فعال است' : 'قانون غیرفعال است'}
                  >
                    {rule.isEnabled ? 'فعال' : 'غیرفعال'}
                  </button>
                </div>

                {/* Threshold Configuration row */}
                <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">مقدار آستانه:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={tempThreshold}
                          onChange={(e) => setTempThreshold(Number(e.target.value))}
                          className="w-24 bg-[var(--bg-main)] border border-[var(--border-active)] rounded-lg px-2 py-1 text-xs text-[var(--text-main)] font-mono focus:outline-none"
                          autoFocus
                        />
                        <span className="text-xs text-[var(--text-muted)] font-bold">{rule.thresholdUnit}</span>
                        <button
                          onClick={() => saveEdit(rule.id)}
                          className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(rule)}
                        className="group flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-mono font-bold text-[var(--accent-text)] transition-colors cursor-pointer"
                        title="جهت ویرایش آستانه کلیک کنید"
                      >
                        <span>{rule.thresholdValue}</span>
                        <span>{rule.thresholdUnit}</span>
                        <Sliders className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-main)] mr-1" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                    <span>اقدام:</span>
                    <span className="font-semibold text-[var(--text-main)]">{rule.actionFa}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form 
            onSubmit={handleCreateRule}
            className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 text-[var(--text-main)]"
          >
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--accent-text)]" />
              تعریف قانون جدید کسب‌وکار
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">عنوان قانون:</label>
                <input
                  type="text"
                  required
                  value={newRuleNameFa}
                  onChange={(e) => setNewRuleNameFa(e.target.value)}
                  placeholder="مثال: سقف تخفیف عیدانه"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">دسته‌بندی:</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as any)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                  >
                    <option value="PRICING">قیمت‌گذاری (Pricing)</option>
                    <option value="INVENTORY">موجودی (Inventory)</option>
                    <option value="SUPPLIER">تأمین‌کننده (Supplier)</option>
                    <option value="ORDERS">سفارشات (Orders)</option>
                    <option value="RISK">ریسک (Risk)</option>
                    <option value="CAMPAIGN">کمپین (Campaign)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">نوع اقدام:</label>
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as any)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                  >
                    <option value="APPROVAL_QUEUE">انتقال به صف تأیید ناظر</option>
                    <option value="AUTO_APPLY">اعمال خودکار اتوپایلوت</option>
                    <option value="AUTO_UNPUBLISH">توقف انتشار کالا</option>
                    <option value="AUTO_FEATURE">برجسته‌سازی در ویترین</option>
                    <option value="LIMIT_SUPPLIER">محدودسازی تأمین‌کننده</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">مقدار آستانه:</label>
                  <input
                    type="number"
                    required
                    value={newRuleVal}
                    onChange={(e) => setNewRuleVal(Number(e.target.value))}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--border-active)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">واحد:</label>
                  <input
                    type="text"
                    value={newRuleUnit}
                    onChange={(e) => setNewRuleUnit(e.target.value)}
                    placeholder="%, تومان, عدد"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">شرح شرط و منطق اجرا:</label>
                <textarea
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  rows={2}
                  placeholder="اگر این شرط برقرار بود، چه تصمیمی اتخاذ گردد..."
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold cursor-pointer"
              >
                ثبت و فعال‌سازی قانون
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
