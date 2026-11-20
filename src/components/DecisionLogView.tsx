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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white">حافظه تصمیمات و رد پای حسابرسی (Decision Log & Memory)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ثبت پایدار و شفاف کلیه تصمیمات: چه اتفاقی افتاد؟ چه تصمیمی گرفته شد؟ چرا؟ بر اساس چه شواهدی؟ چه قانونی؟ و چه نتیجه‌ای حاصل شد؟
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'ALL' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            همه ({logs.length})
          </button>
          <button
            onClick={() => setStatusFilter('AUTO_APPLIED')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'AUTO_APPLIED' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            خودکار اتوپایلوت
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED_BY_OPERATOR')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === 'APPROVED_BY_OPERATOR' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            تأیید شده توسط ناظر
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          placeholder="جستجو در حافظه تصمیمات بر اساس رویداد، قانون یا تصمیم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-all shadow-lg"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isAuto
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isRuleCreated
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {isAuto ? '🟢 اجرای خودکار (Auto Applied)' : isRuleCreated ? '✨ قانون جدید ثبت شد' : '👤 تأیید ناظر'}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {log.timestamp}
                  </span>
                </div>

                <div className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                  {log.ruleMatched}
                </div>
              </div>

              {/* Event and Decision taken */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-850">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    ۱. چه اتفاقی افتاد؟ (Event Trigger):
                  </span>
                  <p className="text-xs text-slate-200 font-semibold leading-relaxed">{log.eventTrigger}</p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50">
                  <span className="text-[11px] font-bold text-indigo-300 block mb-1">
                    ۲. چه تصمیمی گرفته شد؟ (Decision Taken):
                  </span>
                  <p className="text-xs text-white font-bold leading-relaxed">{log.decisionTaken}</p>
                </div>
              </div>

              {/* Why & Reason */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850">
                <span className="text-[11px] font-bold text-amber-400 block mb-1">
                  ۳. چرا؟ منطق و استدلال سیستم (Reason & Logic):
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{log.reason}</p>
              </div>

              {/* Evidence list */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                  ۴. بر اساس چه شواهدی؟ (Evidence):
                </span>
                <div className="flex flex-wrap gap-2">
                  {log.evidence.map((ev, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      {ev}
                    </span>
                  ))}
                </div>
              </div>

              {/* Outcome */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-200 ml-1">۵. نتیجه چه شد؟ (Realized Outcome):</span>
                  {log.outcome}
                </div>
              </div>

              {log.operatorNote && (
                <div className="text-[11px] text-slate-400 italic">
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
