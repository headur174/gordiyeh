import React, { useState } from 'react';
import { ApprovalItem, BusinessRule } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  BookmarkPlus, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ArrowRight,
  SlidersHorizontal,
  Info
} from 'lucide-react';

interface ApprovalQueueViewProps {
  approvals: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEditAndApprove: (id: string, newProposedValue: string) => void;
  onApproveAndRememberRule: (approval: ApprovalItem, newRuleName: string, newThreshold: number) => void;
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({
  approvals,
  onApprove,
  onReject,
  onEditAndApprove,
  onApproveAndRememberRule,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'RECOMMENDED'>('ALL');
  
  // Edit modal state
  const [editingItem, setEditingItem] = useState<ApprovalItem | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Remember Rule modal state
  const [rememberRuleItem, setRememberRuleItem] = useState<ApprovalItem | null>(null);
  const [newRuleName, setNewRuleName] = useState<string>('');
  const [newRuleThreshold, setNewRuleThreshold] = useState<number>(25);

  const filteredApprovals = approvals.filter(item => {
    if (filter === 'ALL') return true;
    return item.priority === filter;
  });

  const handleOpenEdit = (item: ApprovalItem) => {
    setEditingItem(item);
    setEditValue(item.proposedValue);
  };

  const handleOpenRememberRule = (item: ApprovalItem) => {
    setRememberRuleItem(item);
    if (item.category === 'CAMPAIGN' || item.category === 'PRICING') {
      setNewRuleName(`افزایش سقف تخفیف برای ${item.productTitle.slice(0, 25)}... تا ۲۵٪`);
      setNewRuleThreshold(25);
    } else if (item.category === 'ORDERS') {
      setNewRuleName(`افزایش سقف سفارش خودکار تا ۱۰,۰۰۰,۰۰۰ تومان`);
      setNewRuleThreshold(10000000);
    } else {
      setNewRuleName(`قانون سفارشی خودکار برای ${item.actionType}`);
      setNewRuleThreshold(30);
    }
  };

  const submitEdit = () => {
    if (editingItem) {
      onEditAndApprove(editingItem.id, editValue);
      setEditingItem(null);
    }
  };

  const submitRememberRule = () => {
    if (rememberRuleItem) {
      onApproveAndRememberRule(rememberRuleItem, newRuleName, newRuleThreshold);
      setRememberRuleItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] shadow-xs">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)]">صف تأیید ناظر (Approval Queue)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35">
              {approvals.filter(a => a.status === 'PENDING').length} مورد در انتظار
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            موارد با ریسک بالا یا خارج از سقف مجاز اتوپایلوت برای صدور فرمان در این بخش متوقف شده‌اند.
          </p>
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] text-xs w-full lg:w-auto">
          <button
            id="filter-all"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            همه موارد ({approvals.length})
          </button>
          <button
            id="filter-high"
            onClick={() => setFilter('HIGH')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'HIGH' ? 'bg-rose-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            🔴 فوری / پرریسک
          </button>
          <button
            id="filter-medium"
            onClick={() => setFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'MEDIUM' ? 'bg-amber-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            🟠 بررسی تصمیم
          </button>
          <button
            id="filter-recommended"
            onClick={() => setFilter('RECOMMENDED')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'RECOMMENDED' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            🟢 پیشنهادی
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-[var(--text-main)]">صف تأیید خالی است</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
            هیچ موردی خارج از محدوده قوانین تعیین شده رخ نداده است. تمامی فرآیندها تحت نظارت کامل موتور قوانین در حالت اتوپایلوت و کوپایلوت اجرا می‌شوند.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredApprovals.map((item) => {
            const isHigh = item.priority === 'HIGH';
            const isMedium = item.priority === 'MEDIUM';

            return (
              <div
                key={item.id}
                id={`approval-card-${item.id}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-[var(--bg-surface)] shadow-md ${
                  isHigh
                    ? 'border-rose-600/45'
                    : isMedium
                    ? 'border-amber-600/45'
                    : 'border-emerald-600/40'
                }`}
              >
                {/* Card Top Banner */}
                <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                  isHigh
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isMedium
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                      isHigh
                        ? 'bg-rose-600 text-white'
                        : isMedium
                        ? 'bg-amber-500 text-[#182B22]'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {isHigh ? '🔴 High Priority' : isMedium ? '🟠 Needs Review' : '🟢 Recommended'}
                    </span>
                    <span className="text-xs text-[var(--text-main)] font-semibold">{item.actionType}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.createdAt}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                      item.riskScore > 60
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)]'
                    }`}>
                      ریسک: {item.riskScore} / ۱۰۰
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Product & Action Details */}
                  <div>
                    <span className="text-xs text-[var(--text-muted)] block mb-1">موضوع / کالا / سفارش:</span>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--text-main)]">{item.productTitle}</h3>
                  </div>

                  {/* Reason */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      علت توقف در اتوپایلوت و انتقال به صف ناظر (Reason):
                    </span>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">{item.reason}</p>
                  </div>

                  {/* Current vs Proposed Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                      <span className="text-xs text-[var(--text-muted)] block mb-1">مقدار فعلی / وضعیت کنونی:</span>
                      <div className="text-sm font-semibold text-[var(--text-main)]">{item.currentValue}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)]">
                      <span className="text-xs text-[var(--accent-text)] font-bold block mb-1">مقدار پیشنهادی الگوریتم (Proposed):</span>
                      <div className="text-sm font-bold text-[var(--text-main)]">{item.proposedValue}</div>
                    </div>
                  </div>

                  {/* Evidence Breakdown */}
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block mb-2">
                      شواهد و دلایل ارزیابی (Evidence):
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--text-main)]">
                      {item.evidence.map((ev, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 flex-shrink-0" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Impact */}
                  <div className="flex items-start gap-2 text-xs text-[var(--text-main)] bg-teal-500/10 p-3 rounded-xl border border-teal-500/30">
                    <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-teal-800 dark:text-teal-300 ml-1">تأثیر قابل انتظار (Expected Impact):</span>
                      {item.expectedImpact}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Approve Button */}
                      <button
                        id={`btn-approve-${item.id}`}
                        onClick={() => onApprove(item.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تأیید و اعمال (Approve)
                      </button>

                      {/* Reject Button */}
                      <button
                        id={`btn-reject-${item.id}`}
                        onClick={() => onReject(item.id)}
                        className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 border border-rose-500/40 text-rose-700 dark:text-rose-300 hover:text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        رد کردن (Reject)
                      </button>

                      {/* Edit Button */}
                      <button
                        id={`btn-edit-${item.id}`}
                        onClick={() => handleOpenEdit(item)}
                        className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-medium text-xs sm:text-sm flex items-center gap-1.5 border border-[var(--border-color)] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ویرایش (Edit)
                      </button>
                    </div>

                    {/* Approve & Remember This Rule Button */}
                    <button
                      id={`btn-remember-rule-${item.id}`}
                      onClick={() => handleOpenRememberRule(item)}
                      className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all border border-[var(--border-active)] cursor-pointer"
                      title="این تصمیم به عنوان یک قانون دائمی ذخیره می‌شود تا در دفعات بعد به صورت خودکار انجام پذیرد"
                    >
                      <BookmarkPlus className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>تأیید و ذخیره به عنوان قانون جدید (Approve & Remember Rule)</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ویرایش پارامتر قبل از صدور تأیید
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              می‌توانید مقدار پیشنهادی را تعدیل کرده و با پارامتر اختصاصی خود اعمال کنید.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-main)] block">مقدار نهایی اجرایی:</label>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)] font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={submitEdit}
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold cursor-pointer"
              >
                تأیید و اجرای مقدار جدید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remember Rule Modal */}
      {rememberRuleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-active)] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-5 text-[var(--text-main)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)] shrink-0">
                <BookmarkPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  تأیید تصمیم و تبدیل به قانون خودکار دائم
                </h3>
                <p className="text-xs text-[var(--accent-text)]">Approve & Remember This Rule</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs space-y-1">
              <p className="font-bold text-[var(--text-main)]">مورد انتخابی: {rememberRuleItem.productTitle}</p>
              <p className="text-[var(--text-muted)]">با ذخیره این قانون، موارد مشابه از این پس نیازی به تأیید دستی شما نخواهند داشت و در حالت Autopilot اعمال می‌شوند.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">
                  نام قانون جدید:
                </label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">
                  آستانه مجاز خودکار جدید:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--border-active)]"
                  />
                  <span className="text-xs text-[var(--text-muted)] font-bold px-3 py-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shrink-0">
                    {rememberRuleItem.category === 'ORDERS' ? 'تومان' : 'درصد (%)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setRememberRuleItem(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold hover:bg-[var(--bg-card-hover)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={submitRememberRule}
                className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold shadow-md cursor-pointer"
              >
                ذخیره قانون و تأیید آنی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
