import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Trash2, Eye, EyeOff, RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ZeroTrustBus } from '../../../core/zeroTrustBus';
import { getCustomerAuthHeaders } from '../../../utils/supportChatStore';
import { CustomerMemorySnapshot } from '../contract';

interface Props {
  customerId?: string;
  onClose?: () => void;
}

export const CustomerMemoryHubTile: React.FC<Props> = ({ customerId = 'cust_guest_me', onClose }) => {
  const [memory, setMemory] = useState<CustomerMemorySnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/memory/${encodeURIComponent(customerId)}`, {
        headers: getCustomerAuthHeaders(),
      });
      if (res.status === 401 || res.status === 403) {
        setFeedbackMsg('برای مشاهده و مدیریت حافظه شخصی خرید، ابتدا با شماره موبایل و کد پیامکی وارد شوید.');
        setMemory(null);
        return;
      }
      const json = await res.json();
      if (json.success && json.memory) {
        setMemory(json.memory);
      } else {
        setMemory(null);
      }
    } catch {
      setFeedbackMsg('خطا در دریافت اطلاعات حافظه مشتری از سرور.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [customerId]);

  const handleClearMemory = async () => {
    setClearing(true);
    try {
      const delRes = await fetch(`/api/customer/memory/${encodeURIComponent(customerId)}`, {
        method: 'DELETE',
        headers: getCustomerAuthHeaders(),
      });
      if (!delRes.ok) {
        const errJson = await delRes.json().catch(() => ({}));
        setFeedbackMsg(errJson?.error || 'امکان پاکسازی حافظه بدون احراز هویت وجود ندارد.');
        return;
      }
      
      // Emit event on ZeroTrustBus with manifest validation
      ZeroTrustBus.emit('piece_customer_memory', 'v1.memory.cleared', {
        customerId,
        timestamp: Date.now(),
      });

      setMemory(prev => prev ? {
        ...prev,
        preferences: { colorPreferences: [], dislikedAttributes: [], preferredCategories: [] },
        giftProfiles: []
      } : null);

      setFeedbackMsg('تمامی ترجیحات و اطلاعات ثبت‌شده با موفقیت پاک شد.');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (e: any) {
      setFeedbackMsg('خطا در پاک‌سازی: ' + (e?.message || 'خطای شبکه'));
    } finally {
      setClearing(false);
    }
  };

  const handleTogglePersonalization = () => {
    setMemory(prev => prev ? { ...prev, isPersonalizationEnabled: !prev.isPersonalizationEnabled } : null);
    setFeedbackMsg('تنظیمات شخصی‌سازی هوش مصنوعی بروزرسانی شد.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border-color)] shadow-sm overflow-hidden text-right font-sans text-[var(--text-main)]" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-[var(--accent-primary)] text-[#F7F3EA] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-[#F7F3EA]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#F7F3EA]">مرکز کنترل حریم خصوصی و حافظه</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-[#F7F3EA] border border-white/25">
                رمزنگاری AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-[#F7F3EA]/80 mt-0.5">
              شفافیت کامل: ببینید همراه هوشمند خرید درباره سلیقه و مناسبت‌های شما چه می‌داند.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#F7F3EA]/80 hover:text-white px-3 py-1 rounded-full hover:bg-white/15 transition-colors text-xs font-bold"
          >
            بستن
          </button>
        )}
      </div>

      {/* Zero Plaintext Security Seal */}
      <div className="bg-[var(--accent-soft)]/50 border-b border-[var(--border-color)] p-3.5 sm:px-5 flex items-start sm:items-center justify-between gap-3 text-xs text-[var(--text-main)]">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <span>
            <strong>تضمین حفاظت داده خام (Zero-Plaintext at Rest):</strong> تمام ترجیحات و آدرس‌های شما با رمزنگاری استاندارد نگهداری می‌شود.
          </span>
        </div>
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className="text-[var(--accent-primary)] hover:opacity-80 font-bold flex items-center gap-1 shrink-0 underline decoration-dotted"
        >
          {privacyMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {privacyMode ? 'نمایش مقادیر' : 'مخفی‌سازی'}
        </button>
      </div>

      {feedbackMsg && (
        <div className="m-4 p-3 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-active)] text-[var(--accent-primary)] text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Body Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Toggle Personalization Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]/60">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)]">مشاوره تطبیق‌یافته با سلیقه من</h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              در صورت غیرفعال بودن، راهنمای خرید بدون ارجاع به خریدهای پیشین پاسخ می‌دهد.
            </p>
          </div>
          <button
            onClick={handleTogglePersonalization}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              memory?.isPersonalizationEnabled
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                : 'bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)]'
            }`}
          >
            {memory?.isPersonalizationEnabled ? 'فعال' : 'غیرفعال'}
          </button>
        </div>

        {/* What AI Remembers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preferences Box */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <h5 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                سلیقه‌ها و ترجیحات خرید
              </h5>
              <span className="text-[11px] text-[var(--text-muted)]">
                {memory?.preferences.colorPreferences.length || 0} مورد
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block mb-1">رنگ‌های مورد علاقه:</span>
                <div className="flex flex-wrap gap-1.5">
                  {memory?.preferences.colorPreferences.length ? (
                    memory.preferences.colorPreferences.map((c, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px]">
                        {privacyMode ? '••••' : c}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--text-muted)] italic">موردی ثبت نشده است.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-1">ویژگی‌های نامطلوب (عدم پیشنهاد):</span>
                <div className="flex flex-wrap gap-1.5">
                  {memory?.preferences.dislikedAttributes.length ? (
                    memory.preferences.dislikedAttributes.map((d, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] border border-rose-500/20">
                        {privacyMode ? '••••' : d}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--text-muted)] italic">موردی ثبت نشده است.</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block mb-0.5">سقف بودجه معمول:</span>
                <span className="font-semibold text-[var(--text-main)] tabular-nums">
                  {privacyMode ? '••••' : memory?.preferences.priceCeilingToman?.toLocaleString() + ' تومان'}
                </span>
              </div>
            </div>
          </div>

          {/* Gift Profiles Box */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)]/60 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <h5 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                پروفایل‌های هدیه ثبت‌شده
              </h5>
              <span className="text-[11px] text-[var(--text-muted)]">
                {memory?.giftProfiles.length || 0} نفر
              </span>
            </div>

            <div className="space-y-2">
              {memory?.giftProfiles.length ? (
                memory.giftProfiles.map(gp => (
                  <div key={gp.id} className="p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs">
                    <div className="flex items-center justify-between font-bold text-[var(--text-main)]">
                      <span>{privacyMode ? '••••' : gp.recipientName} ({gp.relationship})</span>
                      <span className="text-[var(--accent-primary)] font-semibold tabular-nums">
                        {privacyMode ? '••••' : gp.budget.toLocaleString() + ' ت'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      مناسبت: {gp.occasion} | {privacyMode ? '••••' : gp.notes}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic p-2">هنوز فردی برای هدیه در سیستم ثبت نکرده‌اید.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls & Reset */}
        <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>حق فراموشی کامل (Right to be Forgotten) و پاک‌سازی آنی برای شما فعال است.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMemory}
              disabled={loading}
              className="px-4 py-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] hover:bg-[var(--bg-card)] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </button>
            <button
              onClick={handleClearMemory}
              disabled={clearing}
              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearing ? 'در حال پاک‌سازی...' : 'صفر کردن حافظه'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
