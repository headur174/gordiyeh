import React, { useState } from 'react';
import { DecisionLog } from '../types';
import { 
  History, 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Layers, 
  FileText, 
  Sparkles,
  ArrowDownRight
} from 'lucide-react';

interface DecisionLogViewProps {
  logs: DecisionLog[];
}

export const DecisionLogView: React.FC<DecisionLogViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AUTO_APPLIED' | 'APPROVED_BY_OPERATOR' | 'RULE_CREATED'>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.eventTrigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.decisionTaken.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.ruleMatched.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[var(--accent-text)] shrink-0" />
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)]">حافظه تصمیمات و رد پای حسابرسی (Decision Log & Memory)</h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            ثبت پایدار و شفاف کلیه تصمیمات: چه اتفاقی افتاد؟ چه تصمیمی گرفته شد؟ چرا؟ بر اساس چه شواهدی؟ چه قانونی؟ و چه نتیجه‌ای حاصل شد؟
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] text-xs shrink-0 max-w-full">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            همه ({logs.length})
          </button>
          <button
            onClick={() => setStatusFilter('AUTO_APPLIED')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'AUTO_APPLIED' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            خودکار اتوپایلوت
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED_BY_OPERATOR')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'APPROVED_BY_OPERATOR' ? 'bg-teal-700 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            تأیید شده توسط ناظر
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
        <input
          type="text"
          placeholder="جستجو در حافظه تصمیمات بر اساس رویداد، قانون یا تصمیم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl pr-10 pl-4 py-2.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
        />
      </div>

      {/* Decision Memory Timeline Cards */}
      <div className="space-y-4">
        {filteredLogs.map((log) => {
          const isAuto = log.status === 'AUTO_APPLIED';
          const isRuleCreated = log.status === 'RULE_CREATED';

          return (
            <div
              key={log.id}
              className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 hover:border-[var(--border-active)] transition-all shadow-sm"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isAuto
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35'
                      : isRuleCreated
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35'
                      : 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-active)]'
                  }`}>
                    {isAuto ? '🟢 اجرای خودکار (Auto Applied)' : isRuleCreated ? '✨ قانون جدید ثبت شد' : '👤 تأیید ناظر'}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {log.timestamp}
                  </span>
                </div>

                <div className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--accent-text)] border border-[var(--border-color)]">
                  {log.ruleMatched}
                </div>
              </div>

              {/* Event and Decision taken */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
                    ۱. چه اتفاقی افتاد؟ (Event Trigger):
                  </span>
                  <p className="text-xs text-[var(--text-main)] font-semibold leading-relaxed">{log.eventTrigger}</p>
                </div>

                <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)]">
                  <span className="text-[11px] font-bold text-[var(--accent-text)] block mb-1">
                    ۲. چه تصمیمی گرفته شد؟ (Decision Taken):
                  </span>
                  <p className="text-xs text-[var(--text-main)] font-bold leading-relaxed">{log.decisionTaken}</p>
                </div>
              </div>

              {/* Why & Reason */}
              <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1">
                  ۳. چرا؟ منطق و استدلال سیستم (Reason & Logic):
                </span>
                <p className="text-xs text-[var(--text-main)] leading-relaxed">{log.reason}</p>
              </div>

              {/* Evidence list */}
              <div>
                <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                  ۴. بر اساس چه شواهدی؟ (Evidence):
                </span>
                <div className="flex flex-wrap gap-2">
                  {log.evidence.map((ev, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0" />
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              {/* Outcome */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 ml-1">۵. نتیجه چه شد؟ (Realized Outcome):</span>
                  {log.outcome}
                </div>
              </div>

              {log.operatorNote && (
                <div className="text-[11px] text-[var(--text-muted)] italic">
                  یادداشت ناظر: {log.operatorNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
