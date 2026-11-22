import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ShoppingCart,
  ExternalLink,
  Package,
  Slash,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { CanonicalProduct, Currency } from '../../types';
import { formatCurrency } from '../../utils';
import {
  SLASH_COMMANDS,
  SlashCommandDef,
  SupportChatSession,
  stripChatMarkdown,
  toPersianDigits,
} from '../../utils/supportChatStore';

interface SupportChatConversationProps {
  session: SupportChatSession;
  products: CanonicalProduct[];
  currency?: Currency;
  isTyping: boolean;
  errorMessage?: string | null;
  onSendMessage: (text: string) => void;
  onSelectProduct?: (product: CanonicalProduct) => void;
  onAddToCart?: (product: CanonicalProduct) => void;
  compact?: boolean;
}

export const SupportChatConversation: React.FC<SupportChatConversationProps> = ({
  session,
  products,
  currency = 'TOMAN',
  isTyping,
  errorMessage,
  onSendMessage,
  onSelectProduct,
  onAddToCart,
  compact = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [selectedCmdIndex, setSelectedCmdIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages.length, isTyping, session.id]);

  // Filter slash commands dynamically when input starts with /
  const slashQuery = inputText.trim().startsWith('/')
    ? inputText.trim().toLowerCase()
    : '';

  const filteredCommands: SlashCommandDef[] = slashQuery
    ? SLASH_COMMANDS.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(slashQuery) ||
          cmd.label.includes(slashQuery.slice(1)) ||
          cmd.aliases.some((a) => a.toLowerCase().includes(slashQuery))
      )
    : SLASH_COMMANDS;

  const visibleCommands = filteredCommands.length > 0 ? filteredCommands : SLASH_COMMANDS;

  useEffect(() => {
    if (inputText.trim().startsWith('/')) {
      setSlashMenuOpen(true);
      setSelectedCmdIndex(0);
    } else if (slashMenuOpen && inputText.length > 0) {
      setSlashMenuOpen(false);
    }
  }, [inputText]);

  const submitText = (text: string) => {
    const clean = text.trim();
    if (!clean || isTyping) return;
    setSlashMenuOpen(false);
    setInputText('');
    onSendMessage(clean);
  };

  const handleSelectSlashCommand = (cmd: SlashCommandDef) => {
    setSlashMenuOpen(false);
    setInputText('');
    onSendMessage(cmd.command);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (slashMenuOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCmdIndex((prev) => (prev + 1) % visibleCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCmdIndex((prev) => (prev - 1 + visibleCommands.length) % visibleCommands.length);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const exactMatch = visibleCommands.find(
          (c) => c.command.toLowerCase() === inputText.trim().toLowerCase()
        );
        const chosen = exactMatch || visibleCommands[selectedCmdIndex] || visibleCommands[0];
        if (chosen) {
          handleSelectSlashCommand(chosen);
          return;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitText(inputText);
    }
  };

  const findProductObj = (productId: string, fallbackTitle: string): CanonicalProduct | undefined => {
    return (
      products.find((p) => p.id === productId) ||
      products.find((p) => p.title === fallbackTitle)
    );
  };

  const activeFlowLabel =
    session.flowState?.flow === 'ONBOARD_NAME'
      ? 'آشنایی اولیه و ثبت نام در حساب کاربری'
      : session.flowState?.flow === 'OFFER_OTP_ACCOUNT'
      ? 'پیشنهاد تایید پیامکی و ساخت حساب دائمی'
      : session.flowState?.flow === 'OTP_VERIFY'
      ? 'در انتظار ثبت کد تایید پیامکی'
      : session.flowState?.flow === 'GIFT'
      ? 'مشاوره هوشمند انتخاب هدیه'
      : session.flowState?.flow === 'TRACKING'
      ? 'پیگیری سفارش'
      : session.flowState?.flow === 'OPERATOR'
      ? 'هماهنگی تماس اپراتور'
      : session.flowState?.flow === 'QUESTION'
      ? 'پرسش و پاسخ هوشمند'
      : session.flowState?.flow === 'PRIVACY'
      ? 'تنظیمات حافظه گفتگو'
      : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[var(--bg-main)] relative">
      {/* Subtle Command Guide Bar */}
      <div className="px-3.5 py-2 bg-[var(--bg-card)]/70 border-b border-[var(--border-color)] flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)] shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
          <span className="truncate">
            {activeFlowLabel
              ? activeFlowLabel
              : 'با تایپ / لیست درخواست‌ها باز میشه (بدون فرم، پرسش و پاسخ سریع)'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setSlashMenuOpen((prev) => !prev);
            inputRef.current?.focus();
          }}
          className="px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shrink-0 cursor-pointer transition-colors"
        >
          / دستورها
        </button>
      </div>

      {/* Messages Stream */}
      <div className={`flex-1 overflow-y-auto ${compact ? 'p-3.5' : 'p-4 sm:p-5'} space-y-3.5`}>
        {session.messages.map((msg, index) => {
          const isLastMessage = index === session.messages.length - 1;
          const isUser = msg.sender === 'user';

          return (
            <div key={msg.id} className="space-y-2">
              <div className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-[1.8] shadow-sm ${
                    isUser
                      ? 'bg-[var(--accent-primary)] text-[#F7F3EA] rounded-tr-sm'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm'
                  }`}
                >
                  {msg.flowTag && !isUser && (
                    <div className="mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--badge-bg)] text-[var(--accent-primary)] text-[10px] font-bold">
                      <span>{msg.flowTag}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line">{stripChatMarkdown(msg.text)}</div>

                  {/* Order Status Card inside Chat */}
                  {msg.orderCard && (
                    <div className="mt-2.5 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2 text-[var(--text-main)]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Package className="w-4 h-4 text-[var(--accent-primary)]" />
                          <span className="font-mono">{msg.orderCard.orderNumber}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[var(--badge-bg)] text-[var(--accent-primary)] text-[10px] font-bold">
                          {msg.orderCard.status === 'PAID'
                            ? 'پرداخت‌شده / آماده‌سازی'
                            : msg.orderCard.status === 'DELIVERED'
                            ? 'تحویل‌شده'
                            : msg.orderCard.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
                        <div>
                          <span className="text-[var(--text-muted)]">کد رهگیری: </span>
                          <span className="font-mono font-bold">
                            {msg.orderCard.trackingCode || 'در انتظار صدور'}
                          </span>
                        </div>
                        {typeof msg.orderCard.totalAmount === 'number' && msg.orderCard.totalAmount > 0 && (
                          <div>
                            <span className="text-[var(--text-muted)]">مبلغ: </span>
                            <span className="font-bold tabular-nums">
                              {formatCurrency(msg.orderCard.totalAmount, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product Recommendation Cards inside Chat */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {msg.recommendedProducts.map((rec) => {
                        const prodObj = findProductObj(rec.productId, rec.title);
                        return (
                          <div
                            key={rec.productId}
                            className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-3 text-[var(--text-main)]"
                          >
                            {rec.image && (
                              <img
                                src={rec.image}
                                alt={rec.title}
                                loading="lazy"
                                decoding="async"
                                className="w-12 h-12 rounded-lg object-cover border border-[var(--border-color)] shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">{rec.title}</div>
                              <div className="text-[11px] font-bold text-[var(--accent-primary)] tabular-nums mt-0.5">
                                {formatCurrency(rec.price, currency)}
                              </div>
                              {rec.matchReason && (
                                <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                                  {rec.matchReason}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              {prodObj && onSelectProduct && (
                                <button
                                  type="button"
                                  onClick={() => onSelectProduct(prodObj)}
                                  className="px-2 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>مشاهده</span>
                                </button>
                              )}
                              {prodObj && onAddToCart && (
                                <button
                                  type="button"
                                  onClick={() => onAddToCart(prodObj)}
                                  className="px-2 py-1 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  <span>خرید</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 flex items-center gap-1 text-[10px] tabular-nums ${
                      isUser ? 'text-white/75' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{toPersianDigits(msg.timestamp)}</span>
                    {isUser && <CheckCircle2 className="w-2.5 h-2.5 mr-auto" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-end">
            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Slash Command Palette (/) */}
      {slashMenuOpen && (
        <div
          role="listbox"
          aria-label="لیست دستورهای چت پشتیبانی"
          className="mx-3 mb-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-active)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-20"
        >
          <div className="px-3 py-2 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between text-[11px] font-bold text-[var(--text-main)]">
            <div className="flex items-center gap-1.5">
              <Slash className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span>لیست درخواست‌ها و دستورهای سریع</span>
            </div>
            <button
              type="button"
              onClick={() => setSlashMenuOpen(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              بستن
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border-color)]/60">
            {visibleCommands.map((cmd, idx) => {
              const active = idx === selectedCmdIndex;
              return (
                <button
                  key={cmd.command}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setSelectedCmdIndex(idx)}
                  onClick={() => handleSelectSlashCommand(cmd)}
                  className={`w-full text-right px-3.5 py-2.5 flex items-start gap-2.5 transition-colors cursor-pointer ${
                    active ? 'bg-[var(--badge-bg)]' : 'hover:bg-[var(--bg-card)]/60'
                  }`}
                >
                  <span className="px-2 py-0.5 rounded-md bg-[var(--accent-primary)] text-[#F7F3EA] text-[11px] font-bold shrink-0">
                    {cmd.command}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--text-main)]">{cmd.label}</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {cmd.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Real Error Feedback Banner (if Gemini API is unavailable or misconfigured) */}
      {errorMessage && (
        <div
          role="alert"
          className="mx-3 mb-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-medium flex items-center gap-2 shrink-0"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Single Chat Input Bar */}
      <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)] shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSlashMenuOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            title="باز کردن لیست درخواست‌ها با /"
            aria-label="باز کردن لیست دستورهای پشتیبانی"
            className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shrink-0 ${
              slashMenuOpen
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] border-[var(--accent-primary)]'
                : 'bg-[var(--bg-surface)] text-[var(--accent-primary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
            }`}
          >
            /
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="پیامتون رو بنویسید یا / رو بزنید..."
            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none transition-colors"
          />

          <button
            type="button"
            onClick={() => submitText(inputText)}
            disabled={!inputText.trim() || isTyping}
            aria-label="ارسال پیام"
            className="w-10 h-10 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-45 text-[#F7F3EA] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
