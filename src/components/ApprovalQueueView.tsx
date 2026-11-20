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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-xl font-black text-white">صف تأیید ناظر (Approval Queue)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {approvals.filter(a => a.status === 'PENDING').length} مورد در انتظار
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            موارد با ریسک بالا یا خارج از سقف مجاز اتوپایلوت برای صدور فرمان در این بخش متوقف شده‌اند.
          </p>
        </div>

        {/* Priority Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            id="filter-all"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            همه موارد ({approvals.length})
          </button>
          <button
            id="filter-high"
            onClick={() => setFilter('HIGH')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'HIGH' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-300" />
            🔴 فوری / پرریسک
          </button>
          <button
            id="filter-medium"
            onClick={() => setFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'MEDIUM' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-300" />
            🟠 بررسی تصمیم
          </button>
          <button
            id="filter-recommended"
            onClick={() => setFilter('RECOMMENDED')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'RECOMMENDED' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300" />
            🟢 پیشنهادی
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/50 border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-slate-200">صف تأیید خالی است</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
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
                className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-slate-900/90 shadow-xl ${
                  isHigh
                    ? 'border-rose-700/60 shadow-rose-950/20'
                    : isMedium
                    ? 'border-amber-700/50 shadow-amber-950/20'
                    : 'border-emerald-700/40 shadow-emerald-950/20'
                }`}
              >
                {/* Card Top Banner */}
                <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
                  isHigh ? 'bg-rose-950/30 border-rose-900/40' : isMedium ? 'bg-amber-950/30 border-amber-900/40' : 'bg-emerald-950/30 border-emerald-900/40'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                      isHigh
                        ? 'bg-rose-500 text-white'
                        : isMedium
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {isHigh ? '🔴 High Priority' : isMedium ? '🟠 Needs Review' : '🟢 Recommended'}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{item.actionType}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.createdAt}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                      item.riskScore > 60 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      ریسک: {item.riskScore} / ۱۰۰
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Product & Action Details */}
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">موضوع / کالا / سفارش:</span>
                    <h3 className="text-base sm:text-lg font-bold text-white">{item.productTitle}</h3>
                  </div>

                  {/* Reason */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-bold text-amber-400 block mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      علت توقف در اتوپایلوت و انتقال به صف ناظر (Reason):
                    </span>
                    <p className="text-sm text-slate-200 leading-relaxed">{item.reason}</p>
                  </div>

                  {/* Current vs Proposed Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                      <span className="text-xs text-slate-400 block mb-1">مقدار فعلی / وضعیت کنونی:</span>
                      <div className="text-sm font-semibold text-slate-300">{item.currentValue}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/50">
                      <span className="text-xs text-indigo-300 block mb-1">مقدار پیشنهادی الگوریتم (Proposed):</span>
                      <div className="text-sm font-bold text-indigo-200">{item.proposedValue}</div>
                    </div>
                  </div>

                  {/* Evidence Breakdown */}
                  <div>
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      شواهد و دلایل ارزیابی (Evidence):
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                      {item.evidence.map((ev, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Impact */}
                  <div className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/20 p-3 rounded-xl border border-slate-800">
                    <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cyan-300 ml-1">تأثیر قابل انتظار (Expected Impact):</span>
                      {item.expectedImpact}
                    </div>
                  </div>

                  {/* Action Buttons as explicitly requested */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Approve Button */}
                      <button
                        id={`btn-approve-${item.id}`}
                        onClick={() => onApprove(item.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        تأیید و اعمال (Approve)
                      </button>

                      {/* Reject Button */}
                      <button
                        id={`btn-reject-${item.id}`}
                        onClick={() => onReject(item.id)}
                        className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        رد کردن (Reject)
                      </button>

                      {/* Edit Button */}
                      <button
                        id={`btn-edit-${item.id}`}
                        onClick={() => handleOpenEdit(item)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-amber-400" />
                        ویرایش (Edit)
                      </button>
                    </div>

                    {/* Approve & Remember This Rule Button */}
                    <button
                      id={`btn-remember-rule-${item.id}`}
                      onClick={() => handleOpenRememberRule(item)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-950/40 transition-all border border-indigo-400/30"
                      title="این تصمیم به عنوان یک قانون دائمی ذخیره می‌شود تا در دفعات بعد به صورت خودکار انجام پذیرد"
                    >
                      <BookmarkPlus className="w-4 h-4 text-yellow-300" />
                      تأیید و ذخیره به عنوان قانون جدید (Approve & Remember Rule)
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-400" />
              ویرایش پارامتر قبل از صدور تأیید
            </h3>
            <p className="text-xs text-slate-400">
              می‌توانید مقدار پیشنهادی را تعدیل کرده و با پارامتر اختصاصی خود اعمال کنید.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">مقدار نهایی اجرایی:</label>
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={submitEdit}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
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
          <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <BookmarkPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  تأیید تصمیم و تبدیل به قانون خودکار دائم
                </h3>
                <p className="text-xs text-indigo-300">Approve & Remember This Rule</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">مورد انتخابی: {rememberRuleItem.productTitle}</p>
              <p className="text-slate-400">با ذخیره این قانون، موارد مشابه از این پس نیازی به تأیید دستی شما نخواهند داشت و در حالت Autopilot اعمال می‌شوند.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  نام قانون جدید:
                </label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  آستانه مجاز خودکار جدید:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-400 font-bold px-3 py-2 bg-slate-800 rounded-xl border border-slate-700">
                    {rememberRuleItem.category === 'ORDERS' ? 'تومان' : 'درصد (%)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                onClick={() => setRememberRuleItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={submitRememberRule}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50"
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
