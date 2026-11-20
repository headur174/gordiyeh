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
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" />
            🟢 Autopilot
          </span>
        );
      case 'COPILOT':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            🟡 Copilot
          </span>
        );
      case 'MANUAL':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <Hand className="w-3.5 h-3.5" />
            🔴 Manual
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white">موتور قوانین و سیاست‌های تجاری (Rule Engine)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            قوانین حاکم بر کلیه تصمیمات هوش مصنوعی و اتوپایلوت. هیچ تصمیمی نمی‌تواند این سقف‌ها و شروط را دور بزند.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          افزودن قانون کسب‌وکار جدید
        </button>
      </div>

      {/* Tri-Modal Automation Matrix Control (Autopilot / Copilot / Manual) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              ماتریس ۳ حالته سطح اختیارات (Tri-Modal Automation Matrix)
            </h2>
          </div>
          <span className="text-xs text-slate-400">تنظیم تفکیکی برای هر زیرسیستم</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
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
              <div key={mod.key} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                    {renderAutomationBadge(currentLevel)}
                  </div>
                  <p className="text-xs text-slate-400">{mod.desc}</p>
                </div>

                {/* Level selector buttons */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => onUpdateAutomationMatrix(mod.key as keyof AutomationMatrix, 'AUTOPILOT')}
                    className={`py-1 rounded font-semibold transition-colors ${
                      currentLevel === 'AUTOPILOT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => onUpdateAutomationMatrix(mod.key as keyof AutomationMatrix, 'COPILOT')}
                    className={`py-1 rounded font-semibold transition-colors ${
                      currentLevel === 'COPILOT' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Copilot
                  </button>
                  <button
                    onClick={() => onUpdateAutomationMatrix(mod.key as keyof AutomationMatrix, 'MANUAL')}
                    className={`py-1 rounded font-semibold transition-colors ${
                      currentLevel === 'MANUAL' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            فهرست قوانین و مقادیر آستانه قابل تنظیم (Configurable Rules)
          </h2>
          <span className="text-xs text-slate-400">{rules.length} قانون تعریف شده</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const isEditing = editingRuleId === rule.id;

            return (
              <div
                key={rule.id}
                className={`p-5 rounded-2xl border transition-all ${
                  rule.isEnabled
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/40 border-slate-850 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold">
                        {rule.category}
                      </span>
                      <h3 className="text-sm font-bold text-white">{rule.nameFa}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {rule.conditionDescription}
                    </p>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => onToggleRule(rule.id)}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                      rule.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    title={rule.isEnabled ? 'قانون فعال است' : 'قانون غیرفعال است'}
                  >
                    {rule.isEnabled ? 'فعال' : 'غیرفعال'}
                  </button>
                </div>

                {/* Threshold Configuration row */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">مقدار آستانه:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={tempThreshold}
                          onChange={(e) => setTempThreshold(Number(e.target.value))}
                          className="w-24 bg-slate-950 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
                          autoFocus
                        />
                        <span className="text-xs text-slate-400 font-bold">{rule.thresholdUnit}</span>
                        <button
                          onClick={() => saveEdit(rule.id)}
                          className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(rule)}
                        className="group flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-indigo-300 transition-colors"
                        title="جهت ویرایش آستانه کلیک کنید"
                      >
                        <span>{rule.thresholdValue}</span>
                        <span>{rule.thresholdUnit}</span>
                        <Sliders className="w-3 h-3 text-slate-400 group-hover:text-white mr-1" />
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <span>اقدام:</span>
                    <span className="font-semibold text-slate-200">{rule.actionFa}</span>
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
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-100"
          >
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              تعریف قانون جدید کسب‌وکار
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">عنوان قانون:</label>
                <input
                  type="text"
                  required
                  value={newRuleNameFa}
                  onChange={(e) => setNewRuleNameFa(e.target.value)}
                  placeholder="مثال: سقف تخفیف عیدانه"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">دسته‌بندی:</label>
                  <select
                    value={newRuleCategory}
                    onChange={(e) => setNewRuleCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">نوع اقدام:</label>
                  <select
                    value={newRuleAction}
                    onChange={(e) => setNewRuleAction(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="APPROVAL_QUEUE">انتقال به صف تأیید ناظر</option>
                    <option value="AUTO_APPLY">اعمال خودکار اتوپایلوت</option>
                    <option value="AUTO_UNPUBLISH">توقف انتشار کالا</option>
                    <option value="AUTO_FEATURE">برجسته‌سازی در ویترین</option>
                    <option value="LIMIT_SUPPLIER">محدودسازی تأمین‌کننده</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">مقدار آستانه:</label>
                  <input
                    type="number"
                    required
                    value={newRuleVal}
                    onChange={(e) => setNewRuleVal(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">واحد:</label>
                  <input
                    type="text"
                    value={newRuleUnit}
                    onChange={(e) => setNewRuleUnit(e.target.value)}
                    placeholder="%, تومان, عدد"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">شرح شرط و منطق اجرا:</label>
                <textarea
                  value={newRuleDesc}
                  onChange={(e) => setNewRuleDesc(e.target.value)}
                  rows={2}
                  placeholder="اگر این شرط برقرار بود، چه تصمیمی اتخاذ گردد..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
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
