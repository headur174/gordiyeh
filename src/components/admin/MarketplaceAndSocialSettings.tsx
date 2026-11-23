import React, { useEffect, useState } from 'react';
import {
  Share2,
  Send,
  CalendarClock,
  Copy,
  Check,
  Save,
  Trash2,
  RefreshCw,
  ShoppingBag,
  Globe,
  CheckCircle2,
  AlertCircle,
  Lock,
  Plus,
} from 'lucide-react';
import { CanonicalProduct } from '../../types';
import { toPersianDigits } from '../../utils/supportChatStore';

interface MarketplaceStatus {
  feedUrl: string;
  totalProducts: number;
  eligibleCount: number;
  excludedCount: number;
  complianceRules: Array<{ key: string; title: string; status: string; note?: string }>;
}

interface SocialChannelsPublicStatus {
  autoPublishBlogToSocial: boolean;
  telegram: { enabled: boolean; hasToken: boolean; maskedToken: string; chatId: string; source: string };
  bale: { enabled: boolean; hasToken: boolean; maskedToken: string; chatId: string; source: string };
  eitaa: { enabled: boolean; hasToken: boolean; maskedToken: string; chatId: string; source: string };
  instagram: { enabled: boolean; hasToken: boolean; maskedToken: string; igUserId: string; source: string };
  webhook: { enabled: boolean; activeHooksCount: number };
}

interface ScheduledPostItem {
  id: string;
  channels: string[];
  payload: { title?: string; caption: string; targetUrl?: string; imageUrl?: string };
  status: 'SCHEDULED' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  scheduledAt: string;
  publishedAt?: string | null;
  lastError?: string | null;
}

interface DigikalaPublicConfig {
  enabled: boolean;
  configured: boolean;
  hasApiKey: boolean;
  maskedApiKey: string;
  baseUrl: string;
  autoSyncStock: boolean;
  autoSyncOrders: boolean;
  mappedProductsCount: number;
  source: string;
}

interface DigikalaMappingItem {
  productId: string;
  variantId: number;
  dkp?: string;
  extraMarginPercent?: number;
}

interface Props {
  onAuthRequired?: () => void;
}

export const MarketplaceAndSocialSettings: React.FC<Props> = ({ onAuthRequired }) => {
  const [torobStatus, setTorobStatus] = useState<MarketplaceStatus | null>(null);
  const [emallsStatus, setEmallsStatus] = useState<MarketplaceStatus | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Social Channels Config
  const [socialStatus, setSocialStatus] = useState<SocialChannelsPublicStatus | null>(null);
  const [autoPublishBlog, setAutoPublishBlog] = useState(false);
  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [baleEnabled, setBaleEnabled] = useState(false);
  const [baleToken, setBaleToken] = useState('');
  const [baleChatId, setBaleChatId] = useState('');
  const [eitaaEnabled, setEitaaEnabled] = useState(false);
  const [eitaaToken, setEitaaToken] = useState('');
  const [eitaaChatId, setEitaaChatId] = useState('');
  const [igEnabled, setIgEnabled] = useState(false);
  const [igToken, setIgToken] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [whEnabled, setWhEnabled] = useState(true);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialFeedback, setSocialFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Social Publish & Schedule Composer
  const [postTitle, setPostTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postTargetUrl, setPostTargetUrl] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [postScheduleAt, setPostScheduleAt] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['telegram']);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPostItem[]>([]);
  const [publishingPost, setPublishingPost] = useState(false);
  const [composerFeedback, setComposerFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Digikala Seller Center
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [dkStatus, setDkStatus] = useState<DigikalaPublicConfig | null>(null);
  const [dkEnabled, setDkEnabled] = useState(false);
  const [dkApiKeyInput, setDkApiKeyInput] = useState('');
  const [dkBaseUrl, setDkBaseUrl] = useState('https://seller.digikala.com/api/v1');
  const [dkMappings, setDkMappings] = useState<DigikalaMappingItem[]>([]);
  const [newMapProductId, setNewMapProductId] = useState('');
  const [newMapVariantId, setNewMapVariantId] = useState('');
  const [newMapDkp, setNewMapDkp] = useState('');
  const [savingDk, setSavingDk] = useState(false);
  const [syncingDk, setSyncingDk] = useState(false);
  const [dkFeedback, setDkFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    void loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const [torobRes, emallsRes, socialRes, schedRes, dkRes, prodRes] = await Promise.all([
        fetch('/api/v1/integrations/torob/status'),
        fetch('/api/v1/integrations/emalls/status'),
        fetch('/api/v1/admin/integrations/social'),
        fetch('/api/v1/social/schedule'),
        fetch('/api/v1/admin/integrations/digikala'),
        fetch('/api/v1/products'),
      ]);

      if ([torobRes, emallsRes, socialRes, schedRes, dkRes].some((r) => r.status === 401 || r.status === 403)) {
        onAuthRequired?.();
      }

      if (torobRes.ok) {
        const d = await torobRes.json();
        setTorobStatus(d);
      }
      if (emallsRes.ok) {
        const d = await emallsRes.json();
        setEmallsStatus(d);
      }
      if (socialRes.ok) {
        const d = await socialRes.json();
        const cfg: SocialChannelsPublicStatus | undefined = d?.config;
        if (cfg) {
          setSocialStatus(cfg);
          setAutoPublishBlog(Boolean(cfg.autoPublishBlogToSocial));
          setTgEnabled(Boolean(cfg.telegram.enabled));
          setTgChatId(cfg.telegram.chatId || '');
          setBaleEnabled(Boolean(cfg.bale.enabled));
          setBaleChatId(cfg.bale.chatId || '');
          setEitaaEnabled(Boolean(cfg.eitaa.enabled));
          setEitaaChatId(cfg.eitaa.chatId || '');
          setIgEnabled(Boolean(cfg.instagram.enabled));
          setIgUserId(cfg.instagram.igUserId || '');
          setWhEnabled(Boolean(cfg.webhook.enabled));
        }
      }
      if (schedRes.ok) {
        const d = await schedRes.json();
        if (Array.isArray(d?.items)) setScheduledPosts(d.items);
      }
      if (dkRes.ok) {
        const d = await dkRes.json();
        if (d?.config) {
          setDkStatus(d.config);
          setDkEnabled(Boolean(d.config.enabled));
          setDkBaseUrl(d.config.baseUrl || 'https://seller.digikala.com/api/v1');
        }
        if (Array.isArray(d?.mappings)) setDkMappings(d.mappings);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        if (Array.isArray(d?.products)) {
          setProducts(d.products);
          if (!newMapProductId && d.products.length > 0) {
            setNewMapProductId(d.products[0].id);
          }
        }
      }
    } catch {}
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSaveSocialConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSocial(true);
    setSocialFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/integrations/social', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoPublishBlogToSocial: autoPublishBlog,
          telegram: { enabled: tgEnabled, botToken: tgToken.trim(), chatId: tgChatId.trim() },
          bale: { enabled: baleEnabled, botToken: baleToken.trim(), chatId: baleChatId.trim() },
          eitaa: { enabled: eitaaEnabled, apiToken: eitaaToken.trim(), chatId: eitaaChatId.trim() },
          instagram: { enabled: igEnabled, accessToken: igToken.trim(), igUserId: igUserId.trim() },
          webhook: { enabled: whEnabled },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        onAuthRequired?.();
        setSocialFeedback({ ok: false, text: 'نشست ادمین منقضی شده است.' });
        return;
      }
      if (!res.ok) {
        setSocialFeedback({ ok: false, text: data?.error || 'خطا در ذخیره تنظیمات کانال‌ها.' });
        return;
      }
      if (data?.config) setSocialStatus(data.config);
      setTgToken('');
      setBaleToken('');
      setEitaaToken('');
      setIgToken('');
      setSocialFeedback({ ok: true, text: 'توکن‌ها و تنظیمات کانال‌های اجتماعی با رمزنگاری ذخیره شدند.' });
    } catch {
      setSocialFeedback({ ok: false, text: 'خطا در ارتباط با سرور.' });
    } finally {
      setSavingSocial(false);
    }
  };

  const handleToggleChannel = (ch: string) => {
    setSelectedChannels((prev) => (prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]));
  };

  const handleDispatchPost = async (mode: 'NOW' | 'SCHEDULE') => {
    if (!postCaption.trim()) {
      setComposerFeedback({ ok: false, text: 'متن کپشن پست الزامی است.' });
      return;
    }
    if (mode === 'SCHEDULE' && !postScheduleAt) {
      setComposerFeedback({ ok: false, text: 'لطفاً تاریخ و ساعت انتشار را انتخاب کنید.' });
      return;
    }
    setPublishingPost(true);
    setComposerFeedback(null);
    try {
      const endpoint = mode === 'NOW' ? '/api/v1/social/publish' : '/api/v1/social/schedule';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: selectedChannels,
          title: postTitle.trim() || undefined,
          caption: postCaption.trim(),
          targetUrl: postTargetUrl.trim() || undefined,
          imageUrl: postImageUrl.trim() || undefined,
          ...(mode === 'SCHEDULE' ? { scheduledAt: new Date(postScheduleAt).toISOString() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setComposerFeedback({ ok: false, text: data?.error || 'ارسال یا زمان‌بندی ناموفق بود.' });
        return;
      }
      if (mode === 'SCHEDULE') {
        setComposerFeedback({ ok: true, text: 'پست در صف زمان‌بندی رمزنگاری‌شده ذخیره شد.' });
        setPostCaption('');
        setPostTitle('');
        await loadIntegrations();
      } else {
        const results = Array.isArray(data?.results) ? data.results : [];
        const okCount = results.filter((r: any) => r.ok).length;
        const firstErr = results.find((r: any) => !r.ok)?.error;
        setComposerFeedback({
          ok: okCount > 0,
          text:
            okCount > 0
              ? `در ${toPersianDigits(okCount)} کانال با موفقیت منتشر شد${firstErr ? ` (خطای کانال دیگر: ${firstErr})` : ''}.`
              : firstErr || 'انتشار در کانال‌های انتخابی ناموفق بود.',
        });
      }
    } catch {
      setComposerFeedback({ ok: false, text: 'خطا در ارتباط با سرور.' });
    } finally {
      setPublishingPost(false);
    }
  };

  const handleDeleteScheduled = async (id: string) => {
    const res = await fetch(`/api/v1/social/schedule/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setScheduledPosts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSaveDigikala = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDk(true);
    setDkFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/integrations/digikala', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: dkEnabled,
          apiKey: dkApiKeyInput.trim(),
          baseUrl: dkBaseUrl.trim() || 'https://seller.digikala.com/api/v1',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDkFeedback({ ok: false, text: data?.error || 'خطا در ذخیره تنظیمات دیجی‌کالا.' });
        return;
      }
      if (data?.config) setDkStatus(data.config);
      setDkApiKeyInput('');
      setDkFeedback({ ok: true, text: 'تنظیمات پنل فروشندگان دیجی‌کالا ذخیره شد.' });
    } catch {
      setDkFeedback({ ok: false, text: 'خطا در ارتباط با سرور.' });
    } finally {
      setSavingDk(false);
    }
  };

  const handleAddMapping = async () => {
    const variantNum = parseInt(newMapVariantId, 10);
    if (!newMapProductId || isNaN(variantNum) || variantNum <= 0) {
      setDkFeedback({ ok: false, text: 'محصول و شناسه تنوع (Variant ID) معتبر دیجی‌کالا را وارد کنید.' });
      return;
    }
    const nextMappings = [
      ...dkMappings.filter((m) => m.productId !== newMapProductId),
      { productId: newMapProductId, variantId: variantNum, ...(newMapDkp.trim() ? { dkp: newMapDkp.trim() } : {}) },
    ];
    const res = await fetch('/api/v1/admin/integrations/digikala/mappings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings: nextMappings }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.mappings)) {
      setDkMappings(data.mappings);
      setNewMapVariantId('');
      setNewMapDkp('');
      setDkFeedback({ ok: true, text: 'نگاشت محصول به Variant ID دیجی‌کالا ذخیره شد.' });
    }
  };

  const handleRemoveMapping = async (productId: string) => {
    const nextMappings = dkMappings.filter((m) => m.productId !== productId);
    const res = await fetch('/api/v1/admin/integrations/digikala/mappings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mappings: nextMappings }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data?.mappings)) {
      setDkMappings(data.mappings);
    }
  };

  const handleDigikalaSync = async (action: 'inventory' | 'orders') => {
    setSyncingDk(true);
    setDkFeedback(null);
    try {
      const endpoint =
        action === 'inventory'
          ? '/api/v1/integrations/digikala/sync-inventory'
          : '/api/v1/integrations/digikala/sync-orders';
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDkFeedback({ ok: false, text: data?.error || 'درخواست با خطا مواجه شد.' });
        return;
      }
      if (action === 'inventory') {
        setDkFeedback({
          ok: Boolean(data.success),
          text: `همگام‌سازی دیجی‌کالا انجام شد: ${toPersianDigits(data.syncedCount || 0)} موفق، ${toPersianDigits(data.failedCount || 0)} ناموفق.`,
        });
      } else {
        const count = Array.isArray(data.orders) ? data.orders.length : 0;
        setDkFeedback({
          ok: true,
          text: `استعلام سفارش‌ها از دیجی‌کالا انجام شد (${toPersianDigits(count)} سفارش دریافتی).`,
        });
      }
    } catch {
      setDkFeedback({ ok: false, text: 'خطا در برقراری ارتباط با سرور.' });
    } finally {
      setSyncingDk(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 5: TOROB & EMALLS COMPARISON ENGINES */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              ۵. اتصال رسمی به موتورهای جستجوی کالا (ترب و ایمالز) + همگام‌سازی SSR
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
            قیمت و موجودی فید با صفحات کانونیکال /product/:slug یکپارچه است
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'torob', label: 'فید رسمی ترب (Torob API)', data: torobStatus },
            { key: 'emalls', label: 'فید رسمی ایمالز (Emalls JSON)', data: emallsStatus },
          ].map(({ key, label, data }) => (
            <div key={key} className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)]">{label}</span>
                {data && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    مجاز: <strong className="text-[var(--text-main)]">{toPersianDigits(data.eligibleCount)}</strong> | مسدود: {toPersianDigits(data.excludedCount)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={data?.feedUrl || `/api/v1/integrations/${key}/feed`}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-main)]"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(data?.feedUrl || '', key)}
                  className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] text-[var(--text-main)] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === key ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: SOCIAL AUTO-PUBLISHING CHANNELS & SCHEDULER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        <form
          onSubmit={handleSaveSocialConfig}
          className="lg:col-span-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[var(--accent-primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">
                ۶. اتصال شبکه‌های اجتماعی و انتشار خودکار محتوا
              </h3>
            </div>
          </div>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] cursor-pointer">
            <span className="font-bold text-[var(--text-main)]">انتشار خودکار مقالات جدید مجله پس از انتشار در CMS</span>
            <input
              type="checkbox"
              checked={autoPublishBlog}
              onChange={(e) => setAutoPublishBlog(e.target.checked)}
              className="w-4 h-4 accent-[var(--accent-primary)]"
            />
          </label>

          {/* Telegram & Bale */}
          <div className="space-y-3">
            {[
              {
                title: 'تلگرام (Telegram Bot API)',
                enabled: tgEnabled,
                setEnabled: setTgEnabled,
                token: tgToken,
                setToken: setTgToken,
                chat: tgChatId,
                setChat: setTgChatId,
                status: socialStatus?.telegram,
                chatPlaceholder: '@gordiyeh_channel یا -100...',
              },
              {
                title: 'بله (Bale Bot API)',
                enabled: baleEnabled,
                setEnabled: setBaleEnabled,
                token: baleToken,
                setToken: setBaleToken,
                chat: baleChatId,
                setChat: setBaleChatId,
                status: socialStatus?.bale,
                chatPlaceholder: '@channel_id یا شناسه عددی',
              },
              {
                title: 'ایتا (EitaaYar API)',
                enabled: eitaaEnabled,
                setEnabled: setEitaaEnabled,
                token: eitaaToken,
                setToken: setEitaaToken,
                chat: eitaaChatId,
                setChat: setEitaaChatId,
                status: socialStatus?.eitaa,
                chatPlaceholder: 'شناسه کانال در ایتایار',
              },
            ].map((ch) => (
              <div key={ch.title} className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-main)]">{ch.title}</span>
                  <div className="flex items-center gap-2">
                    {ch.status?.hasToken && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        {ch.status.maskedToken}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => ch.setEnabled(!ch.enabled)}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                        ch.enabled ? 'bg-emerald-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                      }`}
                    >
                      {ch.enabled ? 'فعال' : 'خاموش'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    dir="ltr"
                    value={ch.token}
                    onChange={(e) => ch.setToken(e.target.value)}
                    placeholder={ch.status?.hasToken ? 'برای تغییر توکن جدید وارد کنید' : 'Bot / API Token'}
                    className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={ch.chat}
                    onChange={(e) => ch.setChat(e.target.value)}
                    placeholder={ch.chatPlaceholder}
                    className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px]"
                  />
                </div>
              </div>
            ))}

            {/* Instagram Graph API */}
            <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-main)]">اینستاگرام (Meta Graph API v21)</span>
                <div className="flex items-center gap-2">
                  {socialStatus?.instagram?.hasToken && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      {socialStatus.instagram.maskedToken}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIgEnabled(!igEnabled)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                      igEnabled ? 'bg-emerald-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    {igEnabled ? 'فعال' : 'خاموش'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  dir="ltr"
                  value={igToken}
                  onChange={(e) => setIgToken(e.target.value)}
                  placeholder={socialStatus?.instagram?.hasToken ? 'Access Token جدید (اختیاری)' : 'Page Access Token'}
                  className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={igUserId}
                  onChange={(e) => setIgUserId(e.target.value)}
                  placeholder="IG Business User ID"
                  className="px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {socialFeedback && (
            <div className={`p-3 rounded-xl font-bold flex items-center gap-2 border ${socialFeedback.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
              {socialFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{socialFeedback.text}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSocial}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingSocial ? 'در حال ذخیره...' : 'ذخیره توکن‌های شبکه‌های اجتماعی'}</span>
            </button>
          </div>
        </form>

        {/* Publisher & Scheduler */}
        <div className="lg:col-span-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-color)]">
            <CalendarClock className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">ارسال فوری و زمان‌بندی انتشار محتوا</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'telegram', label: 'تلگرام' },
              { id: 'bale', label: 'بله' },
              { id: 'eitaa', label: 'ایتا' },
              { id: 'instagram', label: 'اینستاگرام' },
              { id: 'webhook', label: 'وب‌هوک n8n' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggleChannel(item.id)}
                className={`px-3 py-1.5 rounded-lg border font-bold cursor-pointer ${
                  selectedChannels.includes(item.id)
                    ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#F7F3EA]'
                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="عنوان پست یا نام محصول (اختیاری)"
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]"
            />
            <textarea
              rows={3}
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder="متن کامل یا کپشن جهت انتشار در کانال‌ها..."
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                dir="ltr"
                value={postTargetUrl}
                onChange={(e) => setPostTargetUrl(e.target.value)}
                placeholder="/product/mini-shaker-blender یا لینک"
                className="px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-[11px]"
              />
              <input
                type="url"
                dir="ltr"
                value={postImageUrl}
                onChange={(e) => setPostImageUrl(e.target.value)}
                placeholder="HTTPS Image URL (الزامی برای اینستاگرام)"
                className="px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-[11px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="datetime-local"
                dir="ltr"
                value={postScheduleAt}
                onChange={(e) => setPostScheduleAt(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono text-[11px]"
              />
              <button
                type="button"
                disabled={publishingPost}
                onClick={() => handleDispatchPost('SCHEDULE')}
                className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span>زمان‌بندی</span>
              </button>
              <button
                type="button"
                disabled={publishingPost}
                onClick={() => handleDispatchPost('NOW')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>انتشار فوری</span>
              </button>
            </div>
          </div>

          {composerFeedback && (
            <div className={`p-3 rounded-xl font-bold flex items-center gap-2 border ${composerFeedback.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
              {composerFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{composerFeedback.text}</span>
            </div>
          )}

          {scheduledPosts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)] max-h-48 overflow-y-auto">
              <div className="font-bold text-[var(--text-muted)]">صف زمان‌بندی و سوابق اخیر ({toPersianDigits(scheduledPosts.length)})</div>
              {scheduledPosts.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-[var(--text-main)] truncate">
                      {item.payload?.title || item.payload?.caption?.slice(0, 45)}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono" dir="ltr">
                      [{item.channels.join(', ')}] • {item.status} • {new Date(item.scheduledAt).toLocaleString('fa-IR')}
                    </div>
                    {item.lastError && <div className="text-[10px] text-rose-500 truncate">{item.lastError}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteScheduled(item.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 7: DIGIKALA SELLER CENTER API */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 shadow-sm text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">
              ۷. اتصال مستقیم به پنل فروشندگان دیجی‌کالا (Digikala Seller Center API)
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setDkEnabled((prev) => !prev)}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer ${
              dkEnabled ? 'bg-emerald-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'
            }`}
          >
            {dkEnabled ? 'اتصال دیجی‌کالا فعال' : 'اتصال غیرفعال'}
          </button>
        </div>

        <form onSubmit={handleSaveDigikala} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5 space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[var(--text-main)] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>کلید API فروشندگان (Seller Token)</span>
              </label>
              {dkStatus?.hasApiKey && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{dkStatus.maskedApiKey}</span>
              )}
            </div>
            <input
              type="password"
              dir="ltr"
              value={dkApiKeyInput}
              onChange={(e) => setDkApiKeyInput(e.target.value)}
              placeholder={dkStatus?.hasApiKey ? 'برای تغییر توکن جدید وارد کنید' : 'توکن پنل فروشندگان دیجی‌کالا'}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono"
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="font-bold text-[var(--text-main)] block">Base URL</label>
            <input
              type="url"
              dir="ltr"
              value={dkBaseUrl}
              onChange={(e) => setDkBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] font-mono"
            />
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={savingDk}
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingDk ? 'ذخیره...' : 'ذخیره'}</span>
            </button>
          </div>
        </form>

        {/* Mapping Table */}
        <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3">
          <div className="font-bold text-[var(--text-main)]">نگاشت محصولات فروشگاه به Variant ID دیجی‌کالا (تبدیل خودکار تومان ← ریال)</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <select
              value={newMapProductId}
              onChange={(e) => setNewMapProductId(e.target.value)}
              className="sm:col-span-5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.retailPrice.toLocaleString('fa-IR')} تومان)
                </option>
              ))}
            </select>
            <input
              type="number"
              dir="ltr"
              value={newMapVariantId}
              onChange={(e) => setNewMapVariantId(e.target.value)}
              placeholder="Variant ID (مثلا 1482921)"
              className="sm:col-span-3 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono"
            />
            <input
              type="text"
              dir="ltr"
              value={newMapDkp}
              onChange={(e) => setNewMapDkp(e.target.value)}
              placeholder="DKP (اختیاری)"
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] font-mono"
            />
            <button
              type="button"
              onClick={handleAddMapping}
              className="sm:col-span-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن</span>
            </button>
          </div>

          {dkMappings.length > 0 && (
            <div className="space-y-1.5">
              {dkMappings.map((m) => {
                const matched = products.find((p) => p.id === m.productId);
                return (
                  <div key={m.productId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
                    <div className="truncate">
                      <span className="font-bold text-[var(--text-main)]">{matched?.title || m.productId}</span>
                      <span className="mx-2 text-[var(--text-muted)] font-mono" dir="ltr">
                        Variant #{m.variantId} {m.dkp ? `(${m.dkp})` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMapping(m.productId)}
                      className="p-1 text-rose-500 hover:bg-rose-500/10 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {dkFeedback ? (
            <div className={`p-2.5 rounded-xl font-bold flex items-center gap-2 border ${dkFeedback.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
              {dkFeedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{dkFeedback.text}</span>
            </div>
          ) : (
            <span className="text-[11px] text-[var(--text-muted)]">
              همگام‌سازی واقعی با تایید کلید پنل فروشندگان دیجی‌کالا (بدون شبیه‌سازی)
            </span>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={syncingDk}
              onClick={() => handleDigikalaSync('orders')}
              className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingDk ? 'animate-spin' : ''}`} />
              <span>دریافت سفارش‌های دیجی‌کالا</span>
            </button>
            <button
              type="button"
              disabled={syncingDk}
              onClick={() => handleDigikalaSync('inventory')}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingDk ? 'animate-spin' : ''}`} />
              <span>ارسال قیمت و موجودی به دیجی‌کالا</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
