import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  Brain, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Truck,
  Package,
  Crosshair,
  Copy,
  Check,
  ShieldAlert,
  Zap,
  BarChart3,
  Flame
} from 'lucide-react';
import { StoreFinancialSummary, NetworkResilienceMode } from '../types';

interface Message {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  source?: string;
  persona?: string;
  metrics?: {
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    financialUpside?: string;
    confidenceScore?: number;
    recommendedAction?: string;
  };
}

interface AskCommerceViewProps {
  summary: StoreFinancialSummary;
  networkMode?: NetworkResilienceMode;
  onSendActionToApproval?: (actionTitle: string, profitImpact: number) => void;
}

export type AIPersona = 
  | 'CRO_PRICING' 
  | 'SUPPLIER_AUDITOR' 
  | 'INVENTORY_PREDICTOR' 
  | 'COMPETITOR_RADAR';

export const AskCommerceView: React.FC<AskCommerceViewProps> = ({ 
  summary,
  networkMode = 'INTRANET',
  onSendActionToApproval 
}) => {
  const [selectedPersona, setSelectedPersona] = useState<AIPersona>('CRO_PRICING');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'AI',
      text: `سلام ناظر گرامی! من مغز تحلیلی چندوجهی Commerce OS هستم.
تمامی جریان‌های داده (فروش، مارجین، وضعیت تأمین‌کنندگان، سیگنال‌های ترب و سبد سفارشات) را به صورت لحظه‌ای رصد می‌کنم.
می‌توانید از مودهای تخصصی بالا استفاده کرده یا روی یکی از سناریوهای استرس‌تست کلیک کنید.`,
      timestamp: 'الان',
      source: 'Commerce Brain Engine',
      persona: 'CRO_PRICING',
      metrics: {
        riskLevel: 'LOW',
        confidenceScore: 98,
        recommendedAction: 'پایش کریدور حداقل مارجین ۱۸٪ و سفارشات بالای ۵ میلیون تومان'
      }
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ready-to-run stress-testing scenarios
  const stressTestScenarios = [
    {
      title: 'استرس‌تست جهش ۲۰٪ نرخ ارز',
      query: 'در صورت افزایش ۲۰ درصدی هزینه خرید از تامین‌کنندگان، کدام کالاها از خط قرمز ۱۸٪ مارجین عبور می‌کنند و راهکار چیست؟',
      icon: TrendingUp,
      persona: 'CRO_PRICING' as AIPersona,
    },
    {
      title: 'کالبدشکافی سبدهای رهاشده > ۵M',
      query: 'چرا سفارشات با ارزش بالای ۵ میلیون تومان در مرحله درگاه یا آدرس متوقف می‌شوند و چطور نرخ پرداخت را افزایش دهیم؟',
      icon: ShieldAlert,
      persona: 'CRO_PRICING' as AIPersona,
    },
    {
      title: 'حسابرسی تامین‌کنندگان و نرخ تاخیر',
      query: 'کدام تأمین‌کننده بیشترین نرخ مرجوعی و تاخیر دیسپچ را دارد و سوئیچ به کدام تامین‌کننده جایگزین بیشترین سود را حفظ می‌کند؟',
      icon: Truck,
      persona: 'SUPPLIER_AUDITOR' as AIPersona,
    },
    {
      title: 'پیش‌بینی اتمام موجودی کالاهای برنده',
      query: 'کالاهای برنده (Winner Products) با نرخ فروش فعلی چند روز تا اتمام موجودی انبار فاصله دارند و زمان ثبت سفارش مجدد (ROP) کی است؟',
      icon: Package,
      persona: 'INVENTORY_PREDICTOR' as AIPersona,
    },
    {
      title: 'رادار قیمت رقبا در ترب و دیجی‌کالا',
      query: 'رقبای اصلی ما در مارکت‌پلیس‌ها و ترب روی کدام کالاها دامپینگ قیمتی کرده‌اند و آیا همسان‌سازی قیمت صرفه دارد؟',
      icon: Crosshair,
      persona: 'COMPETITOR_RADAR' as AIPersona,
    },
    {
      title: 'برنامه پاکسازی انبار کالاهای راکد',
      query: 'کالاهای راکد با فروش زیر ۵ واحد در ماه را چطور بدون وارد شدن به زیان و با حفظ نقدینگی نقد کنیم؟',
      icon: Flame,
      persona: 'CRO_PRICING' as AIPersona,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText?: string, targetPersona?: AIPersona) => {
    const text = queryText || inputValue;
    if (!text.trim() || isLoading) return;

    const activePersonaKey = targetPersona || selectedPersona;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: 'هم‌اکنون',
      persona: activePersonaKey,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ask-commerce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          persona: activePersonaKey,
          networkMode,
          storeContext: {
            todayRevenue: `${summary.todayRevenue.toLocaleString()} تومان`,
            contributionProfit: `${summary.todayContributionProfit.toLocaleString()} تومان`,
            ordersCount: summary.todayOrdersCount,
            autopilotStatus: 'ACTIVE',
            pendingApprovalsCount: 3,
            winners: ['ساعت هوشمند الترا X9', 'پک چوبی VIP زعفران مشهد'],
          },
        }),
      });

      const data = await res.json();

      // Synthesize rich metrics based on query
      let metrics: Message['metrics'] = {
        riskLevel: 'LOW',
        financialUpside: '+۱۴.۲M تومان سود بالقوه',
        confidenceScore: 94,
        recommendedAction: 'اجرای بازقیمت‌گذاری خودکار کاتالوگ با اتوپایلوت'
      };

      if (text.includes('ارز') || text.includes('دلار')) {
        metrics = {
          riskLevel: 'HIGH',
          financialUpside: 'جلوگیری از زیان ۲۸.۵M تومانی',
          confidenceScore: 96,
          recommendedAction: 'افزایش ۱۰٪ قیمت ۲ محصول SKU-104 و SKU-108 و سوئیچ به تأمین‌کننده B'
        };
      } else if (text.includes('تامین‌کننده') || text.includes('تاخیر')) {
        metrics = {
          riskLevel: 'MEDIUM',
          financialUpside: 'کاهش ۶.۴M تومانی خسارت مرجوعی',
          confidenceScore: 92,
          recommendedAction: 'محدود کردن سفارشات به تأمین‌کننده تهران و اعمال جریمه تاخیر ۲۴ ساعته'
        };
      } else if (text.includes('موجودی') || text.includes('اتمام')) {
        metrics = {
          riskLevel: 'MEDIUM',
          financialUpside: 'حفظ تداوم فروش روزانه ۸M تومان',
          confidenceScore: 95,
          recommendedAction: 'ثبت سفارش پیش‌خرید ۸۰ عدد ساعت هوشمند اولترا ظرف ۴۸ ساعت آینده'
        };
      } else if (text.includes('رقبا') || text.includes('ترب')) {
        metrics = {
          riskLevel: 'LOW',
          financialUpside: '+۲۲٪ رشد نرخ کلیک در ترب',
          confidenceScore: 91,
          recommendedAction: 'حفظ قیمت فعلی و افزودن نشان رسمی گارانتی ۱۸ ماهه و ارسال رایگان'
        };
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'AI',
        text: data.reply || 'پاسخ ساختاریافته پردازش شد.',
        timestamp: 'هم‌اکنون',
        source: data.source || 'gemini-4-hydrogen',
        persona: activePersonaKey,
        metrics,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'AI',
        text: 'خطا در ارتباط با مغز مرکزی فروشگاه. لطفاً دوباره تلاش کنید.',
        timestamp: 'هم‌اکنون',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)] text-[var(--accent-text)] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)]">مغز تحلیل بازار و دستیار استراتژیک تجارت (Market Intelligence AI)</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                عارضه‌یابی عمیق، تحلیل کشش قیمتی، ارزیابی ریسک تأمین‌کنندگان و استرس‌تست سناریوهای بحرانی بازار ایران
              </p>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono shrink-0 ${
          networkMode === 'INTRANET' 
            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
            : networkMode === 'AIRGAP_OFFLINE'
            ? 'bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300'
            : 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent-text)]'
        }`}>
          <Brain className={`w-4 h-4 shrink-0 ${
            networkMode === 'INTRANET' ? 'text-emerald-600 dark:text-emerald-400' :
            networkMode === 'AIRGAP_OFFLINE' ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--accent-text)]'
          }`} />
          <span>
            {networkMode === 'INTRANET' && '🇮🇷 تحلیلگر مستقل شبکه ملی (Sovereign Engine)'}
            {networkMode === 'AIRGAP_OFFLINE' && '⚡ موتور تحلیل آفلاین محلی (Airgap Heuristics)'}
            {networkMode === 'GLOBAL' && '🌐 Gemini 3.8 Flash + Multi-Persona Reasoning'}
          </span>
        </div>
      </div>

      {/* 4 Specialized Intelligence Personas Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'CRO_PRICING',
            name: 'استراتژیست قیمت و تبدیل (CRO)',
            desc: 'کشش قیمتی، بهینه‌سازی مارجین، سبد خرید رهاشده',
            icon: TrendingUp,
            badge: 'تمرکز بر حاشیه سود'
          },
          {
            id: 'SUPPLIER_AUDITOR',
            name: 'حسابرس ریسک تأمین‌کنندگان',
            desc: 'پایش SLA، نرخ مرجوعی، ریسک ناموجودی و سوئیچ آفر',
            icon: Truck,
            badge: 'لجستیک و انبار'
          },
          {
            id: 'INVENTORY_PREDICTOR',
            name: 'پیش‌بین انبار و موجودی (ROP)',
            desc: 'تحلیل سرعت فروش (Run-Rate) و پیش‌بینی نقطه سفارش',
            icon: Package,
            badge: 'پیشگیری از صفر شدن'
          },
          {
            id: 'COMPETITOR_RADAR',
            name: 'رادار رقبا و مارکت‌پلیس‌ها',
            desc: 'رصد لحظه‌ای ترب و دیجی‌کالا، سیگنال دامپینگ قیمت',
            icon: Crosshair,
            badge: 'دیده‌بان بازار'
          },
        ].map((persona) => {
          const Icon = persona.icon;
          const isSelected = selectedPersona === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => setSelectedPersona(persona.id as AIPersona)}
              className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-[var(--accent-soft)] border-[var(--border-active)] ring-1 ring-[var(--border-active)] shadow-md text-[var(--text-main)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-xs font-bold">{persona.name}</span>
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">{persona.desc}</p>
              </div>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded w-max ${
                isSelected ? 'bg-[var(--accent-primary)] text-[#F7F3EA]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
              }`}>
                {persona.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ready-to-run Stress Test Scenarios */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span className="font-semibold flex items-center gap-1.5 text-[var(--text-main)]">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            سناریوهای شبیه‌سازی و استرس‌تست سریع (۱ کلیک):
          </span>
          <span>کلیک جهت تحلیل جامع هوش مصنوعی</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {stressTestScenarios.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedPersona(sc.persona);
                  handleSend(sc.query, sc.persona);
                }}
                className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] hover:bg-[var(--bg-card)] text-right text-xs text-[var(--text-main)] transition-all flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-[var(--bg-card)] group-hover:bg-[var(--accent-soft)] text-[var(--text-muted)] group-hover:text-[var(--accent-text)] transition-colors shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-[var(--text-main)] truncate">{sc.title}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:-translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Window */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-6 min-h-[380px] sm:min-h-[460px] max-h-[640px] overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m) => {
          const isUser = m.sender === 'USER';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isUser
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA]'
                  : 'bg-[var(--bg-card)] text-[var(--accent-text)] border border-[var(--border-color)]'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                isUser
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] rounded-tr-none'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-none shadow-xs'
              }`}>
                <div className={`flex items-center justify-between gap-4 mb-2 text-[10px] opacity-80 border-b pb-1.5 ${
                  isUser ? 'border-white/20' : 'border-[var(--border-color)]'
                }`}>
                  <span className="font-bold flex items-center gap-1.5">
                    {isUser ? 'شما (ناظر سیستم عامل)' : 'Commerce Brain AI • ' + (m.persona || 'Strategic Analyst')}
                  </span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="space-y-2">{m.text}</div>

                {/* Structured Strategic Metrics Card for AI messages */}
                {!isUser && m.metrics && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-color)] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      {m.metrics.riskLevel && (
                        <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">سطح ریسک:</span>
                          <span className={`font-bold ${
                            m.metrics.riskLevel === 'HIGH'
                              ? 'text-rose-700 dark:text-rose-400'
                              : m.metrics.riskLevel === 'MEDIUM'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}>
                            {m.metrics.riskLevel}
                          </span>
                        </div>
                      )}
                      {m.metrics.financialUpside && (
                        <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">اثر مالی:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{m.metrics.financialUpside}</span>
                        </div>
                      )}
                      {m.metrics.confidenceScore && (
                        <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between">
                          <span className="text-[var(--text-muted)]">درجه اطمینان مدل:</span>
                          <span className="font-bold text-[var(--accent-text)] font-mono">{m.metrics.confidenceScore}٪</span>
                        </div>
                      )}
                    </div>

                    {m.metrics.recommendedAction && (
                      <div className="p-2.5 rounded-lg bg-[var(--accent-soft)] border border-[var(--border-active)] text-[11px] text-[var(--text-main)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[var(--accent-text)] block">اقدام اجرایی پیشنهادی:</span>
                          <span>{m.metrics.recommendedAction}</span>
                        </div>
                        {onSendActionToApproval && (
                          <button
                            onClick={() => onSendActionToApproval?.(m.metrics?.recommendedAction || '', 8000000)}
                            className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-[10px] whitespace-nowrap transition-colors cursor-pointer"
                          >
                            ثبت در صف تأیید
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Tools: Source & Copy */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span className="font-mono text-[var(--accent-text)]">منبع: {m.source || 'gemini-4-hydrogen'}</span>
                    <button
                      onClick={() => handleCopy(m.id, m.text)}
                      className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>کپی گزارش</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-card)] text-[var(--accent-text)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--accent-text)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
              در حال پایش دیتابیس کاتالوگ، بررسی سیگنال ترب و تدوین سناریوی راهبردی...
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <input
          type="text"
          placeholder="هر سوالی درباره قیمت‌گذاری، رقبا، تأمین‌کنندگان، اتمام انبار یا سناریوهای بحرانی بپرسید..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="px-5 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 text-[#F7F3EA] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
          ارسال
        </button>
      </form>
    </div>
  );
};
