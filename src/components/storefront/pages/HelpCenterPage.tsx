import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  PackageCheck, 
  RotateCcw, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  PhoneCall, 
  MessageSquare, 
  ChevronLeft, 
  ChevronDown,
  CheckCircle2, 
  Clock, 
  Sparkles,
  BookOpen,
  Award,
  Lightbulb,
  Copy,
  Check
} from 'lucide-react';
import { BEHZAD_ECOM_FAQ_PLAYBOOK, BEHZAD_ECOM_PRINCIPLES } from '../../../data/negotiationPlaybook';

interface HelpCenterPageProps {
  onBackToHome: () => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onBackToHome }) => {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [activeFaqCategory, setActiveFaqCategory] = useState<'returns' | 'payment' | 'shipping' | 'guarantee' | 'playbook'>('returns');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [playbookSearch, setPlaybookSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDept, setTicketDept] = useState('orders');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = trackingCode.trim();
    if (!cleanCode) return;

    let matchedOrder: any = null;
    try {
      const orders = JSON.parse(localStorage.getItem('commerce_os_orders') || '[]');
      matchedOrder = orders.find((o: any) => 
        (o.orderNumber && o.orderNumber.toLowerCase() === cleanCode.toLowerCase()) || 
        (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanCode.toLowerCase()) ||
        (o.id && o.id.toLowerCase() === cleanCode.toLowerCase())
      );
    } catch {}

    if (matchedOrder) {
      setTrackingResult({
        code: matchedOrder.trackingNumber || cleanCode,
        orderId: matchedOrder.orderNumber || matchedOrder.id,
        recipient: matchedOrder.customerName,
        destination: `${matchedOrder.province || ''} - ${matchedOrder.city || ''}`,
        status: matchedOrder.status === 'DELIVERED' ? 'تحویل داده شده به مشتری' : 'در حال پردازش و آماده‌سازی ارسال پستی',
        carrier: 'شرکت ملی پست جمهوری اسلامی ایران (پیشتاز)',
        estimatedDelivery: '۲ الی ۳ روز کاری',
        steps: [
          { title: 'ثبت سفارش و تأیید پرداخت اینترنتی', done: true, time: matchedOrder.createdAt ? new Date(matchedOrder.createdAt).toLocaleDateString('fa-IR') : 'امروز' },
          { title: 'کنترل کیفی اصالت و صدور بارنامه پستی', done: true, time: 'انبار مرکزی' },
          { title: 'تحویل به باجه پستی و ثبت در سامانه رهگیری', done: matchedOrder.status === 'SHIPPED' || matchedOrder.status === 'DELIVERED', time: 'در فرآیند ارسال' },
          { title: 'تحویل به خریدار در نشانی مقصد', done: matchedOrder.status === 'DELIVERED', time: 'پیش‌بینی: ۳ روز کاری' },
        ]
      });
    } else {
      setTrackingResult({
        code: cleanCode,
        isNotFound: true,
        status: 'سفارشی با این شماره یا کد پیگیری پیدا نشد.',
        carrier: 'پست پیشتاز / پیک گُردیه',
        message: 'شماره سفارش یا کد پیگیری را دوباره بررسی کنید. اگر مطمئنید درسته، به پشتیبانی پیام بدید تا بررسی کنیم.'
      });
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSuccess(true);
    setTimeout(() => {
      setTicketSubject('');
      setTicketMessage('');
      setTicketSuccess(false);
    }, 4000);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPlaybook = BEHZAD_ECOM_FAQ_PLAYBOOK.filter(item => 
    item.question.includes(playbookSearch) ||
    item.recommendedResponse.includes(playbookSearch) ||
    item.quickTags.some(tag => tag.includes(playbookSearch))
  );

  const standardFaqData = {
    returns: [
      {
        q: 'شرایط تست و تعویض چطوره؟',
        a: 'شرایط تست و تعویض هر محصول توی صفحه‌ی خودش (توی «جعبه‌ی تست و تعویض») نوشته شده. اگه توی همون مهلت، ایراد فنی یا مغایرت دیدید با ما تماس بگیرید؛ هماهنگ می‌کنیم بفرستید و جایگزین بفرستیم یا مبلغ رو برگردونیم.'
      },
      {
        q: 'کدام محصول‌ها امکان مرجوعی سلیقه‌ای ندارن؟',
        a: 'محصول‌های بهداشتی و مراقبت پوست بعد از باز شدن پلمپ امکان مرجوعی سلیقه‌ای ندارن، اما اگه قبل از باز کردن پلمپ ایراد فیزیکی یا مغایرت داشته باشن حتماً تعویض می‌شن.'
      }
    ],
    payment: [
      {
        q: 'پرداخت چطور انجام می‌شه؟',
        a: 'پرداخت اینترنتی از طریق درگاه بانکی شاپرک و با همه‌ی کارت‌های عضو شتاب انجام می‌شه.'
      },
      {
        q: 'اگه پول کم شد ولی سفارش ثبت نشد چی کار کنم؟',
        a: 'مبلغ معمولاً ظرف ۷۲ ساعت کاری توسط بانک برگردونده می‌شه. اگر برنگشت، کد پیگیری تراکنش رو به ایمیل support@gordiyeh.ir یا تلگرام پشتیبانی بفرستید.'
      }
    ],
    shipping: [
      {
        q: 'سفارش‌ها چطور و چه زمانی ارسال می‌شن؟',
        a: 'تهران با پیک و سایر شهرها با پست پیشتاز ارسال می‌شن. کد پیگیری بلافاصله بعد از تحویل به پیک یا پست براتون ارسال می‌شه.'
      },
      {
        q: 'فروش حضوری دارید؟',
        a: 'نه، فقط آنلاین می‌فروشیم تا هزینه‌ی اجاره مغازه روی قیمت محصول نیاد و بتونیم منصفانه بفروشیم.'
      }
    ],
    guarantee: [
      {
        q: 'تست سلامت و کیفیت محصول‌ها چطوره؟',
        a: 'قبل از ارسال هر بسته، محتویات و اقلام همراه چک می‌شن تا محصول بدون نقص و مطابق مشخصات صفحه‌ی خودش به دستتون برسه.'
      }
    ]
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-right text-[var(--text-main)]">
      {/* Top Breadcrumbs */}
      <nav className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <button onClick={onBackToHome} className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
            صفحه اصلی گُردیه
          </button>
          <span>/</span>
          <span className="text-[var(--text-main)] font-medium">راهنما و پیگیری سفارش</span>
        </div>
        <button
          onClick={onBackToHome}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
        >
          <span>برگشت به فروشگاه</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </nav>

      {/* Clean Botanical Hero Search Box */}
      <div className="rounded-[28px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] p-8 sm:p-12 text-center space-y-4 shadow-sm">
        <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[11px] font-semibold">
          پشتیبانی و پیگیری سفارش
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)]">راهنما، شرایط تست و پیگیری سفارش</h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
          شماره سفارشتون رو وارد کنید یا پاسخ سؤال‌های رایج درباره ارسال، پرداخت شاپرک و شرایط تست و تعویض رو بخونید.
        </p>

        {/* Order Tracking Bar */}
        <form onSubmit={handleTrackSubmit} className="max-w-xl mx-auto pt-3 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <PackageCheck className="w-4 h-4 text-[var(--text-muted)] absolute right-4 top-3.5" />
            <input
              type="text"
              placeholder="شماره سفارش یا کد پیگیری (مثلاً ORD-90214)..."
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full pr-10 pl-4 py-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold transition-all flex-shrink-0 cursor-pointer shadow-sm"
          >
            پیگیری سفارش
          </button>
        </form>
      </div>

      {/* Tracking Result Box */}
      {trackingResult && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
            <div>
              <span className="text-[11px] text-[var(--text-muted)] block">کد پیگیری:</span>
              <span className="text-base font-black text-[var(--text-main)] font-mono">{trackingResult.code}</span>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-[var(--text-muted)] block">وضعیت:</span>
              <span className={`text-xs font-bold ${trackingResult.isNotFound ? 'text-amber-500' : 'text-emerald-500'}`}>
                {trackingResult.status}
              </span>
            </div>
          </div>

          {trackingResult.isNotFound ? (
            <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-amber-500/30 text-xs text-[var(--text-main)] space-y-1">
              <p className="font-semibold text-amber-500">{trackingResult.message}</p>
              <p className="text-[11px] text-[var(--text-muted)]">پشتیبانی شنبه تا چهارشنبه ۹ تا ۱۹ و پنج‌شنبه ۹ تا ۱۴ پاسخ‌گوست.</p>
            </div>
          ) : (
            <>
              {trackingResult.recipient && (
                <div className="text-xs text-[var(--text-main)] flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                  <span>تحویل‌گیرنده: <strong>{trackingResult.recipient}</strong></span>
                  <span>مقصد: <strong>{trackingResult.destination}</strong></span>
                </div>
              )}

              {/* Timeline steps */}
              {trackingResult.steps && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {trackingResult.steps.map((st: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border ${
                        st.done
                          ? 'bg-[var(--bg-main)] border-emerald-500/50'
                          : 'bg-[var(--bg-main)]/40 border-[var(--border-color)] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            st.done ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-xs font-bold text-[var(--text-main)]">{st.title}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{st.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 5 Topic Category Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          onClick={() => setActiveFaqCategory('returns')}
          className={`p-4 rounded-xl border text-right transition-all space-y-2 cursor-pointer ${
            activeFaqCategory === 'returns'
              ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-active)]'
          }`}
        >
          <RotateCcw className="w-5 h-5 text-current" />
          <h3 className="text-xs font-bold">تست و تعویض کالا</h3>
          <p className="text-[10px] opacity-80">بر اساس شرایط هر محصول</p>
        </button>

        <button
          onClick={() => setActiveFaqCategory('payment')}
          className={`p-4 rounded-xl border text-right transition-all space-y-2 cursor-pointer ${
            activeFaqCategory === 'payment'
              ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-active)]'
          }`}
        >
          <CreditCard className="w-5 h-5 text-current" />
          <h3 className="text-xs font-bold">پرداخت آنلاین</h3>
          <p className="text-[10px] opacity-80">درگاه بانکی شاپرک و شتاب</p>
        </button>

        <button
          onClick={() => setActiveFaqCategory('shipping')}
          className={`p-4 rounded-xl border text-right transition-all space-y-2 cursor-pointer ${
            activeFaqCategory === 'shipping'
              ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-active)]'
          }`}
        >
          <Truck className="w-5 h-5 text-current" />
          <h3 className="text-xs font-bold">ارسال و تحویل</h3>
          <p className="text-[10px] opacity-80">پیک تهران و پست پیشتاز ایران</p>
        </button>

        <button
          onClick={() => setActiveFaqCategory('guarantee')}
          className={`p-4 rounded-xl border text-right transition-all space-y-2 cursor-pointer ${
            activeFaqCategory === 'guarantee'
              ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-active)]'
          }`}
        >
          <ShieldCheck className="w-5 h-5 text-current" />
          <h3 className="text-xs font-bold">تست پیش از ارسال</h3>
          <p className="text-[10px] opacity-80">بررسی سلامت اقلام و بسته</p>
        </button>

        {/* 5th Card: Direct FAQ Playbook */}
        <button
          onClick={() => setActiveFaqCategory('playbook')}
          className={`p-4 rounded-xl border text-right transition-all space-y-2 cursor-pointer ${
            activeFaqCategory === 'playbook'
              ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-active)]'
          }`}
        >
          <BookOpen className="w-5 h-5 text-current" />
          <h3 className="text-xs font-bold">سؤال‌های رایج پشتیبانی</h3>
          <p className="text-[10px] opacity-80">پاسخ‌های روشن به دغدغه‌ها</p>
        </button>
      </div>

      {/* CATEGORY 5: PLAYBOOK VIEW */}
      {activeFaqCategory === 'playbook' ? (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Banner */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  پاسخ‌های صادقانه به دغدغه‌های خریدار
                </h2>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              مجموعه پاسخ‌های آماده برای پشتیبانی آنلاین جهت توضیح روشن قیمت، ارسال، پرداخت شاپرک و شرایط تعویض.
            </p>
          </div>

          {/* 8 Core Principles Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>اصول پاسخ‌گویی به خریدار:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {BEHZAD_ECOM_PRINCIPLES.map(p => (
                <div key={p.number} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-[11px] font-bold flex items-center justify-center font-mono">
                      {p.number}
                    </span>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">{p.title}</h4>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search bar inside Playbook */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="جستجو در سؤال‌ها (قیمت، تخفیف، اعتماد، تعویض)..."
              value={playbookSearch}
              onChange={(e) => setPlaybookSearch(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full pr-10 pl-4 py-2.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Scenarios List */}
          <div className="space-y-3">
            {filteredPlaybook.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] overflow-hidden space-y-3 p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">{item.question}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.quickTags.map((t, ti) => (
                      <span key={ti} className="px-2.5 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended Response */}
                <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[var(--accent-primary)] font-bold">
                    <span>پاسخ پیشنهادی:</span>
                    <button
                      onClick={() => handleCopyText(item.id, item.recommendedResponse)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 font-bold">کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی متن</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                    {item.recommendedResponse}
                  </p>
                </div>

                {/* Strategic Advice */}
                <div className="text-[11px] text-[var(--text-muted)] flex items-start gap-1.5 pt-1">
                  <Lightbulb className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                  <span><strong className="text-[var(--text-main)]">نکته‌ی مهم:</strong> {item.strategicNote}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* STANDARD FAQ ACCORDION */
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-[var(--text-main)] pb-3 border-b border-[var(--border-color)]">
            سؤال‌های متداول
          </h2>

          <div className="space-y-3">
            {standardFaqData[activeFaqCategory].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 text-right flex items-center justify-between text-xs sm:text-sm font-bold text-[var(--text-main)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedFaq === idx ? 'rotate-180' : ''}`} />
                </button>

                {expandedFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-color)]/60 whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact & Ticket Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info box */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">تماس با پشتیبانی گُردیه</h3>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            شنبه تا چهارشنبه ۹ تا ۱۹ و پنج‌شنبه ۹ تا ۱۴ پاسخ‌گوی شما هستیم. پیام‌های بعد از ساعت کاری صبح روز کاری بعد پیگیری می‌شن.
          </p>

          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">ایمیل پشتیبانی:</span>
              <span className="font-mono font-bold text-[var(--text-main)] dir-ltr">support@gordiyeh.ir</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">تلگرام:</span>
              <span className="font-mono font-bold text-[var(--accent-primary)] dir-ltr">@gordiyeh_gadgets</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] pt-1">ارسال سفارش‌ها از تهران به سراسر ایران با پیک یا پست پیشتاز</div>
          </div>
        </div>

        {/* Submit Ticket Form */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">ارسال پیام به پشتیبانی</h3>
          </div>

          {ticketSuccess ? (
            <div className="p-6 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent-primary)]/40 text-center space-y-2 text-[var(--accent-primary)] text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-8 h-8 text-[var(--accent-primary)] mx-auto" />
              <div>پیامتون ثبت شد.</div>
              <div className="text-[11px] text-[var(--text-muted)] font-normal">تیم پشتیبانی در ساعات کاری پیگیری می‌کنه.</div>
            </div>
          ) : (
            <form onSubmit={handleTicketSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">موضوع:</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: پیگیری سفارش، سؤال درباره یک محصول..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">موضوع کلی:</label>
                <select
                  value={ticketDept}
                  onChange={(e) => setTicketDept(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="orders">پیگیری سفارش و ارسال</option>
                  <option value="returns">تست و تعویض محصول</option>
                  <option value="warranty">سؤال قبل از خرید</option>
                  <option value="management">انتقاد و پیشنهاد</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[var(--text-muted)] block mb-1">پیامتون:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="شماره سفارش یا جزئیات سؤالتون رو بنویسید..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                ارسال پیام
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
