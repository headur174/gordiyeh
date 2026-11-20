import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  CheckCheck,
  RefreshCw,
  Sparkles,
  Headphones,
  PhoneCall,
  ChevronDown,
  Minimize2,
  Gift,
  Search,
  Package,
  Heart,
  Truck,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShoppingCart,
  Calendar,
  DollarSign,
  BookOpen,
  Copy,
  Check,
  Phone,
  Radio,
  Flame,
  Cpu,
  Compass,
  Sliders,
  Shield
} from 'lucide-react';
import { CanonicalProduct } from '../../types';
import { formatCurrency } from '../../utils';
import { CustomerMemoryHubTile } from '../../pieces/customer-memory/ui/CustomerMemoryHubTile';
import { PieceErrorBoundary } from '../../core/shell/PieceErrorBoundary';
import { BEHZAD_ECOM_FAQ_PLAYBOOK, BEHZAD_ECOM_PRINCIPLES } from '../../data/negotiationPlaybook';
import { GORDIYEH_BRAND, GORDIYEH_PALETTE } from '../../gordiyehKit';

interface Message {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
  suggestedProduct?: CanonicalProduct;
  actionCart?: boolean;
}

interface GiftProfile {
  id: string;
  recipient: string;
  style: string;
  budgetMax: number;
  occasion: string;
  notes: string;
}

interface RecommendationItem {
  productId: string;
  product: CanonicalProduct;
  matchReason: string;
  prosForRecipient: string;
  watchOut: string;
}

interface LiveSupportWidgetProps {
  products?: CanonicalProduct[];
  onSelectProduct?: (product: CanonicalProduct) => void;
  onAddToCart?: (product: CanonicalProduct) => void;
  onOpenCart?: () => void;
}

export const LiveSupportWidget: React.FC<LiveSupportWidgetProps> = ({
  products = [],
  onSelectProduct,
  onAddToCart,
  onOpenCart
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'GIFT_PROFILE' | 'TRACKING' | 'PLAYBOOK' | 'HOTLINE' | 'MEMORY'>('CHAT');

  // Playbook State (Document 2: Behzad Ecom Direct Playbook)
  const [playbookSearch, setPlaybookSearch] = useState('');
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  const handleCopyFaq = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedFaqId(id);
    setTimeout(() => setCopiedFaqId(null), 2000);
  };

  const filteredPlaybook = BEHZAD_ECOM_FAQ_PLAYBOOK.filter(item =>
    item.question.includes(playbookSearch) ||
    item.recommendedResponse.includes(playbookSearch) ||
    item.quickTags.some(tag => tag.includes(playbookSearch))
  );

  // Chat State
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [operatorMode, setOperatorMode] = useState<'AI' | 'HUMAN'>('AI');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'support',
      text: 'سلام! خوش اومدید به پشتیبانی گُردیه. هر سؤالی درباره انتخاب محصول، شرایط تست و تعویض یا پیگیری سفارش دارید بپرسید.',
      timestamp: 'الان'
    }
  ]);

  // Gift Profile State
  const [recipient, setRecipient] = useState<string>('همسر');
  const [style, setStyle] = useState<string>('کاربردی و روزمره');
  const [budgetMax, setBudgetMax] = useState<number>(4000000);
  const [occasion, setOccasion] = useState<string>('تولد');
  const [notes, setNotes] = useState<string>('');
  const [isAnalyzingGift, setIsAnalyzingGift] = useState<boolean>(false);
  const [giftVerdict, setGiftVerdict] = useState<string>('');
  const [honestAdvice, setHonestAdvice] = useState<string>('');
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [alternativeAlternative, setAlternativeAlternative] = useState<string>('');

  // Order Tracking State
  const [trackingQuery, setTrackingQuery] = useState<string>('');
  const [isSearchingOrder, setIsSearchingOrder] = useState<boolean>(false);
  const [trackedOrderResult, setTrackedOrderResult] = useState<any>(null);
  const [trackingError, setTrackingError] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'CHAT') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

  const quickQuestions = [
    'این گجت به کار من می‌آد یا نه؟',
    'پیشنهاد محصول با بودجه مشخص',
    'پیگیری سفارش و کد پستی',
    'شرایط تست و تعویض چطوره؟'
  ];

  // Send Chat Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory: messages
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        let matchingProduct: CanonicalProduct | undefined;
        const lowText = text.toLowerCase();
        if (lowText.includes('شیکر') || lowText.includes('اسپرسو') || lowText.includes('سفر')) {
          matchingProduct = products.find(p => p.title.includes('شیکر') || p.title.includes('اسپرسو'));
        } else if (lowText.includes('چراغ') || lowText.includes('اسپیکر') || lowText.includes('پروژکتور')) {
          matchingProduct = products.find(p => p.title.includes('چراغ') || p.title.includes('پروژکتور'));
        } else if (lowText.includes('کادو') || lowText.includes('هدیه')) {
          matchingProduct = products.find(p => p.isFeatured) || products[0];
        }

        const supportMsg: Message = {
          id: `sup_${Date.now()}`,
          sender: 'support',
          text: data.reply || 'سلام! چطور می‌تونم کمکتون کنم؟',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          suggestedProduct: matchingProduct,
          actionCart: !!matchingProduct
        };
        setMessages(prev => [...prev, supportMsg]);
      } else {
        throw new Error('Support API error');
      }
    } catch {
      const fallbackMsg: Message = {
        id: `sup_${Date.now()}`,
        sender: 'support',
        text: 'پیامتون رسید. هر محصول توی گُردیه شرایط تست و تعویض مخصوص خودش رو داره و سفارش‌ها با پیک یا پست پیشتاز ارسال می‌شن.',
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Gift Profile AI Search
  const handleAnalyzeGift = async () => {
    setIsAnalyzingGift(true);
    setGiftVerdict('');
    setHonestAdvice('');
    setRecommendations([]);
    setAlternativeAlternative('');

    try {
      const res = await fetch('/api/companion/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          style,
          budgetMax,
          occasion,
          notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGiftVerdict(data.companionVerdict || '');
        setHonestAdvice(data.honestAdvice || '');
        setRecommendations(data.recommendations || []);
        setAlternativeAlternative(data.alternativeAlternative || '');
      }
    } catch (err) {
      console.error('Gift advisor error:', err);
    } finally {
      setIsAnalyzingGift(false);
    }
  };

  // Direct Dropshipping Order Tracking Lookup
  const handleTrackOrder = async () => {
    if (!trackingQuery.trim()) return;
    setIsSearchingOrder(true);
    setTrackedOrderResult(null);
    setTrackingError('');

    try {
      const res = await fetch(`/api/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `استعلام سفارش ${trackingQuery.trim()}`,
          chatHistory: []
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Fetch direct slip if possible
        const slipRes = await fetch(`/api/dropshipping/dispatch-slip/${encodeURIComponent(trackingQuery.trim())}`);
        if (slipRes.ok) {
          const slipData = await slipRes.json();
          setTrackedOrderResult({
            text: data.reply,
            slip: slipData.slip
          });
        } else {
          setTrackedOrderResult({ text: data.reply });
        }
      } else {
        setTrackingError('سفارشی با این مشخصات در پایگاه داده یافت نشد.');
      }
    } catch {
      setTrackingError('ارتباط با سرور برای استعلام سفارش برقرار نشد.');
    } finally {
      setIsSearchingOrder(false);
    }
  };

  return (
    <div className="fixed bottom-[72px] md:bottom-5 left-4 z-40 font-sans">
      {/* Compact Floating Trigger Button — Icon-Only Miniature Iranian Arch Portal (4-Theme Adaptive) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="پشتیبانی گُردیه"
          title="پشتیبانی گُردیه"
          className="relative group inline-flex flex-col items-center transition-all duration-200 hover:-translate-y-1 cursor-pointer focus-visible:outline-none"
        >
          {/* Outer Iranian Arch portal frame */}
          <div className="gordiyeh-support-arch-outer relative p-[2px] rounded-t-[40px] rounded-b-[4px] transition-all">
            <div className="w-[50px] h-[52px] rounded-t-[38px] rounded-b-[2px] bg-[var(--bg-card)] p-[2.5px] relative overflow-hidden">
              {/* Inner arched portal */}
              <div className="gordiyeh-support-arch-inner w-full h-full rounded-t-[35px] rounded-b-[2px] relative flex items-center justify-center pt-1 overflow-hidden">
                <Headphones
                  className="gordiyeh-support-arch-icon w-[22px] h-[22px] group-hover:scale-110 transition-transform"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Architectural Two-Step Iranian Arch Plinth Base */}
          <span
            aria-hidden="true"
            className="gordiyeh-support-arch-plinth1 w-[56px] h-[3px] rounded-t-[2px] border-x border-t"
          />
          <span
            aria-hidden="true"
            className="gordiyeh-support-arch-plinth2 w-[62px] h-[3.5px] rounded-b-sm border shadow-md"
          />
        </button>
      )}

      {/* Main Companion Modal */}
      {isOpen && (
        <div className="w-[390px] sm:w-[480px] h-[640px] max-w-[calc(100vw-2rem)] max-h-[85vh] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 text-right text-[var(--text-main)]">
          {/* Header */}
          <div className="px-4 py-3 bg-[var(--accent-primary)] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black flex items-center gap-1.5">
                  پشتیبانی گُردیه
                </h3>
                <p className="text-[10px] text-white/75">شنبه تا چهارشنبه ۹ تا ۱۹، پنج‌شنبه ۹ تا ۱۴</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/15 transition-colors cursor-pointer"
                aria-label="بستن"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-[var(--border-color)] bg-[var(--bg-card)] p-1.5 gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('CHAT')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'CHAT'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>گفت‌وگو</span>
            </button>

            <button
              onClick={() => setActiveTab('GIFT_PROFILE')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'GIFT_PROFILE'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>راهنمای هدیه</span>
            </button>

            <button
              onClick={() => setActiveTab('TRACKING')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeTab === 'TRACKING'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>پیگیری سفارش</span>
            </button>

            <button
              onClick={() => setActiveTab('PLAYBOOK')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeTab === 'PLAYBOOK'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="سؤال‌های رایج خرید"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>سؤال‌های رایج</span>
            </button>

            <button
              onClick={() => setActiveTab('HOTLINE')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeTab === 'HOTLINE'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="راه‌های تماس"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>تماس با ما</span>
            </button>

            <button
              onClick={() => setActiveTab('MEMORY')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                activeTab === 'MEMORY'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="تنظیمات حریم خصوصی"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>حریم خصوصی</span>
            </button>
          </div>

          {/* TAB 1: Chat Companion */}
          {activeTab === 'CHAT' && (
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--bg-main)]">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[var(--accent-primary)] text-[#F7F3EA] rounded-br-sm shadow-sm'
                          : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-color)] rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>

                      {/* Product Suggestion Card inside chat */}
                      {msg.suggestedProduct && (
                        <div className="mt-3 p-2.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={msg.suggestedProduct.image}
                              alt={msg.suggestedProduct.title}
                              className="w-12 h-12 object-cover rounded-xl shrink-0"
                            />
                            <div className="truncate flex-1">
                              <p className="text-[11px] font-bold text-[var(--text-main)] truncate">{msg.suggestedProduct.title}</p>
                              <p className="text-[10px] text-[var(--accent-primary)] tabular-nums font-bold">
                                {msg.suggestedProduct.retailPrice.toLocaleString()} تومان
                              </p>
                              <span className="text-[9px] text-[var(--text-muted)] block">ارسال مستقیم از انبار</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[var(--border-color)]">
                            {onSelectProduct && (
                              <button
                                onClick={() => onSelectProduct(msg.suggestedProduct!)}
                                className="flex-1 py-1.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-color)] text-[10px] font-bold transition-all text-center cursor-pointer"
                              >
                                بررسی کالا
                              </button>
                            )}
                            {onAddToCart && (
                              <button
                                onClick={() => {
                                  onAddToCart(msg.suggestedProduct!);
                                  if (onOpenCart) onOpenCart();
                                }}
                                className="flex-1 py-1.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>سبد خرید & شاپرک</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] w-fit px-3 py-2 rounded-xl border border-[var(--border-color)]">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] animate-spin" />
                    <span className="text-[11px]">مشاور در حال بررسی...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Question Pills */}
              <div className="px-3 py-2 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="whitespace-nowrap px-3 py-1 rounded-full text-[10px] bg-[var(--bg-surface)] hover:bg-[var(--accent-soft)] text-[var(--text-main)] border border-[var(--border-color)] transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <div className="p-3 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="سوالی درباره خرید، مقایسه یا محدودیت کالا دارید؟..."
                  className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full px-4 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--text-muted)]"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="p-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </>
          )}

          {/* TAB 2: Gift Profile Engine */}
          {activeTab === 'GIFT_PROFILE' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--bg-main)] text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-color)] space-y-1">
                <div className="flex items-center gap-2 text-[var(--accent-primary)] font-bold">
                  <Gift className="w-4 h-4" />
                  <span>دستیار انتخاب هدیه</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  مشخصات فرد مورد نظر و بودجه رو مشخص کنید تا بر اساس کاتالوگ گُردیه بهترین گزینه‌ها پیشنهاد بشن.
                </p>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">گیرنده هدیه:</label>
                    <select
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                    >
                      <option value="همسر">همسر</option>
                      <option value="خواهر">خواهر</option>
                      <option value="برادر">برادر</option>
                      <option value="مادر">مادر</option>
                      <option value="پدر">پدر</option>
                      <option value="دوست صمیمی">دوست صمیمی</option>
                      <option value="همکار">همکار</option>
                      <option value="فرزند / نوجوان">فرزند / نوجوان</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">سبک و سلیقه:</label>
                    <select
                      value={style}
                      onChange={e => setStyle(e.target.value)}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                    >
                      <option value="مینیمال و شیک">مینیمال و شیک</option>
                      <option value="تکنولوژی و گجت">تکنولوژی و گجت</option>
                      <option value="ورزشی و اسپرت">ورزشی و اسپرت</option>
                      <option value="چرم و لوکس">چرم و لوکس</option>
                      <option value="کاربردی و روزمره">کاربردی و روزمره</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">سقف بودجه (تومان):</label>
                    <select
                      value={budgetMax}
                      onChange={e => setBudgetMax(Number(e.target.value))}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-main)] tabular-nums"
                    >
                      <option value={1000000}>تا ۱,۰۰۰,۰۰۰ تومان</option>
                      <option value={2000000}>تا ۲,۰۰۰,۰۰۰ تومان</option>
                      <option value={4000000}>تا ۴,۰۰۰,۰۰۰ تومان</option>
                      <option value={8000000}>تا ۸,۰۰۰,۰۰۰ تومان</option>
                      <option value={20000000}>بودجه آزاد</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] block mb-1">مناسبت خرید:</label>
                    <select
                      value={occasion}
                      onChange={e => setOccasion(e.target.value)}
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-main)]"
                    >
                      <option value="تولد">تولد</option>
                      <option value="نوروز ۱۴۰۶">عید نوروز</option>
                      <option value="شب یلدا">شب یلدا</option>
                      <option value="روز مادر / زن">روز زن و مادر</option>
                      <option value="روز پدر / مرد">روز مرد و پدر</option>
                      <option value="سالگرد">سالگرد ازدواج</option>
                      <option value="ولنتاین">هدیه ویژه</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-[var(--text-muted)] block mb-1">یادداشت سلیقه اختصاصی (اختیاری):</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="مثال: اهل گیم است، رنگ تیره دوست دارد، کارهای سنگین نمی‌کند..."
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]"
                  />
                </div>

                <button
                  onClick={handleAnalyzeGift}
                  disabled={isAnalyzingGift}
                  className="w-full py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isAnalyzingGift ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال تحلیل و انتخاب کالا...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>یافتن بهترین کالای پیشنهادی</span>
                    </>
                  )}
                </button>
              </div>

              {/* Analysis Result Output */}
              {giftVerdict && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
                    <span className="text-[11px] font-bold text-[var(--accent-primary)] block">
                      تحلیل و توصیه خرید:
                    </span>
                    <p className="text-[var(--text-main)] text-xs leading-relaxed">{giftVerdict}</p>
                    
                    {honestAdvice && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>نکته مهم: {honestAdvice}</span>
                      </div>
                    )}
                  </div>

                  {/* Recommendations Cards */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-[var(--text-main)] block">کالاهای پیشنهادی متناسب:</span>
                    {recommendations.map((rec, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-3 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl space-y-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={rec.product.image}
                            alt={rec.product.title}
                            className="w-14 h-14 object-cover rounded-xl shrink-0"
                          />
                          <div className="flex-1 truncate">
                            <h4 className="text-xs font-bold text-[var(--text-main)] truncate">{rec.product.title}</h4>
                            <p className="text-xs tabular-nums font-bold text-[var(--accent-primary)] mt-0.5">
                              {rec.product.retailPrice.toLocaleString()} تومان
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)] block">{rec.matchReason}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[10px] p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
                          <div>
                            <span className="text-[var(--accent-primary)] font-bold block">چرا خوشحال می‌شود:</span>
                            <p className="text-[var(--text-main)] line-clamp-2">{rec.prosForRecipient}</p>
                          </div>
                          <div>
                            <span className="text-amber-600 dark:text-amber-400 font-bold block">قبل از خرید بدانید:</span>
                            <p className="text-[var(--text-muted)] line-clamp-2">{rec.watchOut}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {onSelectProduct && (
                            <button
                              onClick={() => onSelectProduct(rec.product)}
                              className="flex-1 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] text-xs font-bold transition-all text-center cursor-pointer"
                            >
                              دیدن جزئیات
                            </button>
                          )}
                          {onAddToCart && (
                            <button
                              onClick={() => {
                                onAddToCart(rec.product);
                                if (onOpenCart) onOpenCart();
                              }}
                              className="flex-1 py-1.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>خرید و تسویه شاپرک</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {alternativeAlternative && (
                    <p className="text-[11px] text-[var(--text-muted)] italic text-center p-2">
                      پیشنهاد جایگزین: {alternativeAlternative}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Dropshipping Direct Tracking */}
          {activeTab === 'TRACKING' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--bg-main)] text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-1">
                <div className="flex items-center gap-2 text-[var(--accent-primary)] font-bold">
                  <Truck className="w-4 h-4" />
                  <span>پیگیری وضعیت سفارش</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  شماره سفارش (مثلاً ORD-171...) یا شماره‌ی موبایلی که هنگام خرید وارد کردید بنویسید تا وضعیت ارسال و کد رهگیری پستی رو ببینید.
                </p>
              </div>

              {/* Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={e => setTrackingQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrackOrder()}
                  placeholder="شماره سفارش یا شماره همراه خریدار..."
                  className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full px-4 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  onClick={handleTrackOrder}
                  disabled={isSearchingOrder}
                  className="px-4 py-2 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSearchingOrder ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>رهگیری</span>
                </button>
              </div>

              {trackingError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs">
                  {trackingError}
                </div>
              )}

              {trackedOrderResult && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2 leading-relaxed whitespace-pre-line text-[var(--text-main)]">
                    {trackedOrderResult.text}
                  </div>

                  {trackedOrderResult.slip && (
                    <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent-primary)]/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[var(--accent-primary)] text-xs">مشخصات ارسال سفارش:</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">{trackedOrderResult.slip.slipNumber}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] space-y-1">
                        <div>گیرنده: <span className="text-[var(--text-main)] font-bold">{trackedOrderResult.slip.customer.fullName}</span></div>
                        <div>مقصد: {trackedOrderResult.slip.customer.city} - {trackedOrderResult.slip.customer.address}</div>
                        <div>روش ارسال: <span className="text-[var(--accent-primary)] font-bold">{trackedOrderResult.slip.shippingProvider}</span></div>
                        <div>کد رهگیری: <span className="font-mono text-[var(--accent-primary)]">{trackedOrderResult.slip.trackingNumber}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Sales & Negotiation Playbook */}
          {activeTab === 'PLAYBOOK' && (
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[var(--bg-main)] text-xs">
              <div className="p-3 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-color)] space-y-1">
                <div className="flex items-center justify-between text-[var(--accent-primary)] font-bold">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>سؤال‌های رایج پشتیبانی گُردیه</span>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  پاسخ‌های آماده و صادقانه برای دغدغه‌های خریداران درباره قیمت، ارسال، پرداخت شاپرک و شرایط تست.
                </p>
              </div>

              {/* Search Playbook */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="جستجو در سناریوها (قیمت، تخفیف، گارانتی، ارسال...)"
                  value={playbookSearch}
                  onChange={e => setPlaybookSearch(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-full pr-9 pl-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Scenarios List */}
              <div className="space-y-2.5">
                {filteredPlaybook.map(faq => (
                  <div
                    key={faq.id}
                    className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-[var(--text-main)] text-[11px] leading-snug">
                        {faq.question}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyFaq(faq.id, faq.recommendedResponse)}
                          className="p-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                          title="کپی پاسخ"
                        >
                          {copiedFaqId === faq.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('CHAT');
                            handleSendMessage(faq.recommendedResponse);
                          }}
                          className="px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-[10px] font-semibold transition-colors cursor-pointer"
                          title="ارسال مستقیم به چت"
                        >
                          ارسال
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] leading-relaxed whitespace-pre-line">
                      {faq.recommendedResponse}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                      <span className="text-[var(--accent-primary)]">نکته: {faq.strategicNote}</span>
                      <div className="flex gap-1">
                        {faq.quickTags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-1.5 py-0.5 bg-[var(--bg-card)] text-[var(--text-muted)] rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Contact Hours & Direct Support */}
          {activeTab === 'HOTLINE' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[var(--bg-main)] text-xs">
              <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--text-main)] font-bold">
                  <PhoneCall className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>راه‌های ارتباط با پشتیبانی گُردیه</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  شنبه تا چهارشنبه ۹ تا ۱۹ و پنج‌شنبه ۹ تا ۱۴ پاسخ‌گوی شما هستیم. پیام‌های بعد از ساعت کاری صبح روز کاری بعد پیگیری می‌شن.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">ایمیل پشتیبانی</span>
                    <span className="text-sm font-bold text-[var(--text-main)] font-mono dir-ltr">support@gordiyeh.ir</span>
                  </div>
                  <a href="mailto:support@gordiyeh.ir" className="p-2.5 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] hover:bg-[var(--accent-secondary)] shadow-sm transition-all">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">تلگرام پشتیبانی</span>
                    <span className="text-sm font-bold text-[var(--text-main)] font-mono">@gordiyeh_gadgets</span>
                  </div>
                  <a href="https://t.me/gordiyeh_gadgets" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--accent-soft)] transition-all">
                    <Send className="w-4 h-4" />
                  </a>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] leading-relaxed">
                  خرید حضوری نداریم؛ سفارش‌ها مستقیم از تهران به سراسر ایران ارسال می‌شن و هزینه‌ی اجاره مغازه روی قیمت‌ها نمی‌آد.
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Customer Memory & Privacy Hub (COCA Piece) */}
          {activeTab === 'MEMORY' && (
            <div className="flex-1 p-3 overflow-y-auto bg-[var(--bg-main)]">
              <PieceErrorBoundary pieceId="piece_customer_memory" pieceName="مرکز کنترل حریم خصوصی">
                <CustomerMemoryHubTile customerId="cust_guest_me" />
              </PieceErrorBoundary>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
