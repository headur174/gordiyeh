import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  HelpCircle,
  Phone,
  Info,
  Award,
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SiteConfig, StaticPage } from '../../utils/cmsStore';
import { BlockRenderer } from '../cms/BlockRenderer';
import { UnifiedDocument } from '../../types/cms';

interface StaticPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSlug: string;
  pages: StaticPage[];
  onSelectPage: (slug: string) => void;
  trustLicenses?: SiteConfig['trustLicenses'];
}

export const StaticPagesModal: React.FC<StaticPagesModalProps> = ({
  isOpen,
  onClose,
  pageSlug,
  pages,
  onSelectPage,
  trustLicenses
}) => {
  const [remoteDoc, setRemoteDoc] = useState<UnifiedDocument | null>(null);
  const [, setIsLoading] = useState(false);

  const activePage = pages.find(p => p.slug === pageSlug) || pages[0];
  const isLicensesPage = activePage?.slug === 'licenses';

  useEffect(() => {
    if (!isOpen || !activePage) return;

    setIsLoading(true);
    fetch(`/api/documents/${activePage.slug}`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setRemoteDoc(res.data);
        } else {
          setRemoteDoc(null);
        }
      })
      .catch(() => setRemoteDoc(null))
      .finally(() => setIsLoading(false));
  }, [isOpen, activePage?.slug]);

  // Synchronize <meta name="robots" content="noindex, nofollow" /> in client DOM when viewing licenses page
  useEffect(() => {
    if (!isOpen || !activePage) return;

    const shouldNoindexNofollow = Boolean(activePage.noindex && activePage.nofollow) || activePage.slug === 'licenses';
    if (!shouldNoindexNofollow) return;

    const head = document.head;
    const existingMeta = head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const previousContent = existingMeta?.getAttribute('content') ?? null;

    let createdMeta: HTMLMetaElement | null = null;
    if (existingMeta) {
      existingMeta.setAttribute('content', 'noindex, nofollow');
    } else {
      createdMeta = document.createElement('meta');
      createdMeta.setAttribute('name', 'robots');
      createdMeta.setAttribute('content', 'noindex, nofollow');
      head.appendChild(createdMeta);
    }

    return () => {
      if (createdMeta && createdMeta.parentNode) {
        createdMeta.parentNode.removeChild(createdMeta);
      } else if (existingMeta) {
        if (previousContent !== null) {
          existingMeta.setAttribute('content', previousContent);
        } else {
          existingMeta.removeAttribute('content');
        }
      }
    };
  }, [isOpen, activePage?.slug, activePage?.noindex, activePage?.nofollow]);

  if (!isOpen) return null;

  const getPageIcon = (slug: string) => {
    switch (slug) {
      case 'about-us':
        return <Info className="w-4 h-4 text-[var(--accent-text)]" />;
      case 'terms':
        return <ShieldCheck className="w-4 h-4 text-[var(--accent-text)]" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4 text-[var(--accent-text)]" />;
      case 'contact':
        return <Phone className="w-4 h-4 text-[var(--accent-text)]" />;
      case 'privacy':
        return <ShieldCheck className="w-4 h-4 text-[var(--accent-text)]" />;
      case 'licenses':
        return <Award className="w-4 h-4 text-[var(--accent-text)]" />;
      default:
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const title = remoteDoc?.title || activePage.title;
  const lastUpdated = remoteDoc?.updatedAt 
    ? new Date(remoteDoc.updatedAt).toLocaleDateString('fa-IR')
    : activePage.lastUpdated;

  const enamadUrl = trustLicenses?.enamadUrl?.trim() || '';
  const enamadCode = trustLicenses?.enamadCode?.trim() || '';
  const zarinpalUrl = trustLicenses?.zarinpalUrl?.trim() || '';
  const samandehiUrl = trustLicenses?.samandehiUrl?.trim() || '';
  const unionTitle = trustLicenses?.unionTitle?.trim() || '';
  const unionUrl = trustLicenses?.unionUrl?.trim() || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-right font-sans text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5 min-w-0">
            {getPageIcon(activePage.slug)}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[var(--text-main)] truncate">{title}</h2>
              <span className="text-[10px] text-[var(--text-muted)]">آخرین به‌روزرسانی: {lastUpdated}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن صفحه"
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs between static pages */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]/60 overflow-x-auto">
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectPage(p.slug)}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all shrink-0 cursor-pointer ${
                p.slug === activePage.slug
                  ? 'border-[var(--accent-primary)] text-[var(--accent-text)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {p.title.split('|')[0].trim()}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {activePage.summary && (
            <div className="p-3.5 bg-[var(--accent-soft)] border border-[var(--border-active)] rounded-2xl text-xs text-[var(--accent-text)] font-semibold leading-relaxed">
              {activePage.summary}
            </div>
          )}

          {/* Dedicated Trust Seals & Licenses Showcase */}
          {isLicensesPage && (
            <section
              aria-label="نمادهای اعتماد و مجوزهای رسمی گُردیه"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
              {/* 1. eNamad Slot */}
              <div
                id="gordiyeh-enamad-slot"
                className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center shrink-0 p-1.5">
                    <Award className="w-7 h-7 text-[var(--accent-text)]" />
                    <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1">eNamad</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                        نماد اعتماد الکترونیکی (اینماد)
                      </h3>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                      مرکز توسعه تجارت الکترونیکی وزارت صمت — محل درج نشان و لینک استعلام رسمی فروشگاه.
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-color)]/70 flex items-center justify-between gap-2">
                  {enamadUrl ? (
                    <a
                      href={enamadUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      referrerPolicy="origin"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-[11px] font-bold transition-colors"
                    >
                      <span>استعلام رسمی اینماد</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--badge-bg)] text-[var(--accent-text)] text-[10px] font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>جایگاه آماده‌ی درج کد اینماد</span>
                    </span>
                  )}
                  {enamadCode && (
                    <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[120px]">
                      کد: {enamadCode}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. ZarinPal Slot */}
              <div
                id="gordiyeh-zarinpal-slot"
                className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center shrink-0 p-1.5">
                    <ShieldCheck className="w-7 h-7 text-amber-500" />
                    <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1">ZarinPal</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      نشان اعتماد درگاه زرین‌پال
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                      پرداخت‌یار رسمی بانک مرکزی — محل درج گواهی تایید پذیرنده و تراست‌پنل زرین‌پال.
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-color)]/70 flex items-center justify-between gap-2">
                  {zarinpalUrl ? (
                    <a
                      href={zarinpalUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-[11px] font-bold transition-colors"
                    >
                      <span>مشاهده گواهی زرین‌پال</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--badge-bg)] text-[var(--accent-text)] text-[10px] font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>جایگاه آماده‌ی درج نشان زرین‌پال</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Samandehi & Union Slot */}
              <div
                id="gordiyeh-samandehi-slot"
                className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-colors flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col items-center justify-center shrink-0 p-1.5">
                    <ShieldCheck className="w-7 h-7 text-[var(--accent-text)]" />
                    <span className="text-[9px] font-bold text-[var(--text-muted)] mt-1">ساماندهی</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      {unionTitle || 'نشان ملی ثبت (ساماندهی) و اتحادیه'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                      ثبت رسانه‌های دیجیتال و پروانه‌های صنفی کسب‌وکارهای اینترنتی برای بررسی اصالت فروشگاه.
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-color)]/70 flex flex-wrap items-center justify-between gap-2">
                  {samandehiUrl || unionUrl ? (
                    <a
                      href={samandehiUrl || unionUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-[11px] font-bold transition-colors"
                    >
                      <span>استعلام مجوز رسمی</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--badge-bg)] text-[var(--accent-text)] text-[10px] font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>جایگاه آماده‌ی درج کد شامد / مجوز</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Active Shaparak & Shetab Infrastructure */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-colors flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-11 h-16 rounded-xl bg-white border border-[var(--border-color)] p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src="/assets/payments/shaparak.svg"
                        alt="درگاه شاپرک"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="w-11 h-16 rounded-xl bg-white border border-[var(--border-color)] p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src="/assets/payments/shetab.svg"
                        alt="شبکه شتاب"
                        className="h-full w-auto object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">
                      پرداخت ایمن شاپرک و شتاب
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                      تسویه آنلاین در بستر شاپرک با رمزنگاری کامل TLS و پشتیبانی مستقیم شتاب.
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--border-color)]/70 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-[var(--accent-text)] text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>زیرساخت فعال</span>
                  </span>
                  <a
                    href="https://shaparak.ir"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-text)] hover:underline font-medium"
                  >
                    <span>پرتال شاپرک</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>
          )}

          <div className="text-[13px] text-[var(--text-secondary)] leading-[1.85] space-y-4 bg-[var(--bg-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
            {remoteDoc?.blocks && remoteDoc.blocks.length > 0 ? (
              <BlockRenderer blocks={remoteDoc.blocks} />
            ) : (
              <div className="whitespace-pre-line">
                {activePage.contentHtml}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
          <span>اطلاعات رسمی و به‌روز فروشگاه گُردیه</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold cursor-pointer transition-colors"
          >
            بستن صفحه
          </button>
        </div>
      </div>
    </div>
  );
};
