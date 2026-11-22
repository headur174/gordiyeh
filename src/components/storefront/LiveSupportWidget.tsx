import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  History,
  Plus,
  Edit3,
  ArrowRight,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { CanonicalProduct, Currency } from '../../types';
import { GORDIYEH_BRAND } from '../../gordiyehKit';
import { SupportChatConversation } from './SupportChatConversation';
import {
  CustomerAccount,
  SupportChatSession,
  SUPPORT_UPDATED_EVENT,
  createFreshSession,
  fetchAndMergeSessions,
  getCachedCustomerAccount,
  getKnownCustomerInfo,
  getLocalSessionsForPhone,
  getSavedSupportPhone,
  identifyCustomerAccount,
  isValidIranianPhone,
  normalizeIranianPhone,
  processConversationalTurn,
  saveSessionLocallyAndRemote,
  setSavedSupportPhone,
  stripChatMarkdown,
  toPersianDigits,
} from '../../utils/supportChatStore';

interface LiveSupportWidgetProps {
  products?: CanonicalProduct[];
  currency?: Currency;
  onSelectProduct?: (product: CanonicalProduct) => void;
  onAddToCart?: (product: CanonicalProduct) => void;
  onOpenCart?: () => void;
  onOpenCustomerChats?: () => void;
}

export const LiveSupportWidget: React.FC<LiveSupportWidgetProps> = ({
  products = [],
  currency = 'TOMAN',
  onSelectProduct,
  onAddToCart,
  onOpenCustomerChats,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePhone, setActivePhone] = useState<string>(() => getSavedSupportPhone());
  const [phoneInput, setPhoneInput] = useState<string>(() => getSavedSupportPhone());
  const [phoneError, setPhoneError] = useState<string>('');
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);

  const [sessions, setSessions] = useState<SupportChatSession[]>(() => {
    const phone = getSavedSupportPhone();
    return phone ? getLocalSessionsForPhone(phone) : [];
  });
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() => {
    const phone = getSavedSupportPhone();
    return phone ? getCachedCustomerAccount(phone) : null;
  });
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [showHistoryList, setShowHistoryList] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');

  const knownCustomer = getKnownCustomerInfo();

  const loadSessionsForVerifiedPhone = async (phone: string) => {
    const { account } = await identifyCustomerAccount(phone);
    setCustomerAccount(account);

    const local = getLocalSessionsForPhone(phone);
    if (local.length > 0) {
      setSessions(local);
      setActiveSessionId((prev) =>
        prev && local.some((s) => s.id === prev) ? prev : local[0].id
      );
    }

    const merged = await fetchAndMergeSessions(phone);
    if (merged.length > 0) {
      setSessions(merged);
      setActiveSessionId((prev) =>
        prev && merged.some((s) => s.id === prev) ? prev : merged[0].id
      );
    } else {
      const fresh = createFreshSession(phone, account);
      await saveSessionLocallyAndRemote(fresh);
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    }
  };

  useEffect(() => {
    if (isOpen && activePhone && isValidIranianPhone(activePhone)) {
      void loadSessionsForVerifiedPhone(activePhone);
    }
  }, [isOpen, activePhone]);

  useEffect(() => {
    const handleSync = () => {
      const savedPhone = getSavedSupportPhone();
      if (savedPhone && savedPhone !== activePhone && !isEditingPhone) {
        setActivePhone(savedPhone);
        setPhoneInput(savedPhone);
      }
      if (savedPhone) {
        setCustomerAccount(getCachedCustomerAccount(savedPhone));
        const latestLocal = getLocalSessionsForPhone(savedPhone);
        setSessions(latestLocal);
        if (latestLocal.length > 0) {
          setActiveSessionId((prev) =>
            prev && latestLocal.some((s) => s.id === prev) ? prev : latestLocal[0].id
          );
        }
      }
    };

    window.addEventListener(SUPPORT_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(SUPPORT_UPDATED_EVENT, handleSync);
  }, [activePhone, isEditingPhone]);

  const handleConfirmPhone = async (rawValue: string) => {
    const normalized = normalizeIranianPhone(rawValue);
    if (!isValidIranianPhone(normalized)) {
      setPhoneError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
      return;
    }
    setPhoneError('');
    setChatError('');
    setSavedSupportPhone(normalized);
    setActivePhone(normalized);
    setPhoneInput(normalized);
    setIsEditingPhone(false);
    setShowHistoryList(false);
    await loadSessionsForVerifiedPhone(normalized);
  };

  const handleCreateNewSession = async () => {
    if (!activePhone) return;
    setChatError('');
    const account = customerAccount || getCachedCustomerAccount(activePhone);
    const fresh = createFreshSession(activePhone, account);
    const nextList = await saveSessionLocallyAndRemote(fresh);
    setSessions(nextList);
    setActiveSessionId(fresh.id);
    setShowHistoryList(false);
  };

  const currentSession: SupportChatSession | null =
    sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  const handleSendMessage = async (text: string) => {
    if (!activePhone || !currentSession) return;
    setChatError('');
    setIsTyping(true);
    try {
      const result = await processConversationalTurn(currentSession, text, products);
      if (result.errorMessage) {
        setChatError(result.errorMessage);
        return;
      }
      const nextList = await saveSessionLocallyAndRemote(result.updatedSession);
      setSessions(nextList);
      setActiveSessionId(result.updatedSession.id);
    } finally {
      setIsTyping(false);
    }
  };

  const needsPhoneGate = !activePhone || !isValidIranianPhone(activePhone) || isEditingPhone;

  return (
    <div className="fixed bottom-24 md:bottom-12 right-4 sm:right-6 z-40 font-sans">
      {/* Compact Floating Trigger Button — Preserved Iranian Arch Portal */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="پشتیبانی گُردیه"
          title="پشتیبانی گُردیه"
          className="relative group inline-flex flex-col items-center transition-all duration-200 hover:-translate-y-1 cursor-pointer focus-visible:outline-none"
        >
          {/* Subtle online presence indicator */}
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 z-20 flex h-3 w-3"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[var(--bg-main)] shadow-sm" />
          </span>

          {/* Outer Iranian Arch portal frame */}
          <div className="gordiyeh-support-arch-outer relative p-[2.5px] rounded-t-[44px] rounded-b-[4px] transition-all">
            <div className="w-[56px] h-[58px] rounded-t-[40px] rounded-b-[2px] bg-[var(--bg-card)] p-[2.5px] relative overflow-hidden">
              {/* Inner arched portal */}
              <div className="gordiyeh-support-arch-inner w-full h-full rounded-t-[37px] rounded-b-[2px] relative flex items-end justify-center pt-0.5 overflow-hidden">
                <img
                  src={GORDIYEH_BRAND.supportAvatarAsset}
                  alt="پشتیبانی گُردیه"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top scale-[1.03] group-hover:scale-[1.09] transition-transform drop-shadow-sm select-none"
                />
              </div>
            </div>
          </div>

          {/* Architectural Two-Step Iranian Arch Plinth Base */}
          <span
            aria-hidden="true"
            className="gordiyeh-support-arch-plinth1 w-[62px] h-[3.5px] rounded-t-[2px] border-x border-t"
          />
          <span
            aria-hidden="true"
            className="gordiyeh-support-arch-plinth2 w-[68px] h-[4px] rounded-b-sm border shadow-md"
          />
        </button>
      )}

      {/* Unified Single-Screen Support Chatbot Window */}
      {isOpen && (
        <div className="w-[390px] sm:w-[450px] h-[610px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-7.5rem)] md:max-h-[82vh] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 text-right text-[var(--text-main)]">
          {/* Unified Header */}
          <div className="px-4 py-3 bg-[var(--accent-primary)] text-[#F7F3EA] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="gordiyeh-support-arch-inner w-10 h-10 rounded-t-[20px] rounded-b-md border border-white/35 flex items-end justify-center pt-0.5 overflow-hidden shrink-0 shadow-sm">
                <img
                  src={GORDIYEH_BRAND.supportAvatarAsset}
                  alt="پشتیبان گُردیه"
                  decoding="async"
                  className="w-full h-full object-cover object-top scale-[1.04]"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold truncate">
                  {customerAccount?.preferredName
                    ? `پشتیبانی گُردیه • ${customerAccount.preferredName} عزیز`
                    : 'چت با پشتیبانی گُردیه'}
                </div>
                {activePhone && !needsPhoneGate ? (
                  <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(activePhone);
                        setIsEditingPhone(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-white/90 hover:text-white tabular-nums cursor-pointer"
                      title="تغییر شماره موبایل (نام کاربری)"
                    >
                      <span>نام کاربری:</span>
                      <span dir="ltr">{toPersianDigits(activePhone)}</span>
                      <Edit3 className="w-2.5 h-2.5 opacity-80" />
                    </button>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/15 text-white/95">
                      {customerAccount?.isVerified ? 'تایید پیامکی' : 'ذخیره ۱ ساله'}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-white/80">نام کاربری = شماره موبایل و ذخیره گفتگو</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!needsPhoneGate && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowHistoryList((prev) => !prev)}
                    title="تاریخچه گفتگوهای ذخیره‌شده"
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      showHistoryList
                        ? 'bg-white text-[#182B22]'
                        : 'bg-white/15 hover:bg-white/25 text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>تاریخچه</span>
                    <span className="tabular-nums opacity-85">({toPersianDigits(sessions.length)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewSession}
                    title="شروع گفتگوی جدید"
                    aria-label="گفتگوی جدید"
                    className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {onOpenCustomerChats && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenCustomerChats();
                      }}
                      title="مشاهده تاریخچه در پنل کاربری"
                      aria-label="پنل کاربری و تاریخچه چت"
                      className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="بستن پنجره پشتیبانی"
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* STATE A: Phone Gate (Required to Start & Persist Chat History) */}
          {needsPhoneGate ? (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center space-y-5 bg-[var(--bg-main)]">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--accent-primary)]">
                  <Phone className="w-7 h-7" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)]">
                  {isEditingPhone ? 'تغییر شماره موبایل (نام کاربری)' : 'ورود با شماره موبایل و چت پشتیبانی'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                  شماره موبایل به‌عنوان نام کاربری شما ثبت می‌شه. پس از خوشامدگویی می‌توانید حساب را با کد پیامکی دائمی کنید یا بدون پیامک، اطلاعات اسم و شماره تا یک سال محفوظ بماند.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    شماره موبایل
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleConfirmPhone(phoneInput);
                      }
                    }}
                    placeholder="09123456789"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-sm font-bold text-center tracking-wider tabular-nums text-[var(--text-main)] outline-none"
                  />
                  {phoneError && (
                    <div className="text-[11px] text-rose-500 font-bold">{phoneError}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleConfirmPhone(phoneInput)}
                  className="w-full py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  ورود به چت پشتیبانی
                </button>

                {knownCustomer?.phone && knownCustomer.phone !== normalizeIranianPhone(phoneInput) && (
                  <button
                    type="button"
                    onClick={() => void handleConfirmPhone(knownCustomer.phone!)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-bold text-[var(--accent-primary)] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ادامه با شماره ثبت‌شده ({toPersianDigits(knownCustomer.phone)})</span>
                  </button>
                )}

                {isEditingPhone && activePhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhone(false);
                      setPhoneError('');
                    }}
                    className="w-full py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    بازگشت به گفتگوی فعلی
                  </button>
                )}
              </div>
            </div>
          ) : showHistoryList ? (
            /* STATE B: Saved Chat History Drawer inside Widget */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--bg-main)]">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowHistoryList(false)}
                  className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>برگشت به چت</span>
                </button>
                <span className="text-[11px] text-[var(--text-muted)]">
                  تاریخچه شماره <span className="font-bold tabular-nums">{toPersianDigits(activePhone)}</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {sessions.map((sess) => {
                  const isCurrent = sess.id === currentSession?.id;
                  const lastMsg = sess.messages[sess.messages.length - 1];
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => {
                        setActiveSessionId(sess.id);
                        setShowHistoryList(false);
                      }}
                      className={`w-full text-right p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        isCurrent
                          ? 'bg-[var(--badge-bg)] border-[var(--accent-primary)]'
                          : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)] truncate">
                          <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                          <span className="truncate">{sess.title}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0 tabular-nums flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sess.updatedAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                      {lastMsg && (
                        <div className="text-[11px] text-[var(--text-muted)] truncate">
                          {stripChatMarkdown(lastMsg.text)}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--text-muted)] tabular-nums">
                          {toPersianDigits(sess.messages.length)} پیام
                        </span>
                        {sess.status === 'OPERATOR_REQUESTED' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">
                            درخواست تماس ثبت‌شده
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {onOpenCustomerChats && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCustomerChats();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-bold text-[var(--accent-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>مدیریت کامل چت‌ها در پنل کاربری</span>
                </button>
              )}
            </div>
          ) : currentSession ? (
            /* STATE C: Single Conversational Chatbot Interface (No Forms, Slash Palette Ready) */
            <SupportChatConversation
              session={currentSession}
              products={products}
              currency={currency}
              isTyping={isTyping}
              errorMessage={chatError}
              onSendMessage={handleSendMessage}
              onSelectProduct={(p) => {
                setIsOpen(false);
                onSelectProduct?.(p);
              }}
              onAddToCart={onAddToCart}
              compact
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
