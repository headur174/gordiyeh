import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  HelpCircle,
  Phone,
  Info,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { StaticPage } from '../../utils/cmsStore';
import { BlockRenderer } from '../cms/BlockRenderer';
import { UnifiedDocument } from '../../types/cms';

interface StaticPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageSlug: string;
  pages: StaticPage[];
  onSelectPage: (slug: string) => void;
}

export const StaticPagesModal: React.FC<StaticPagesModalProps> = ({
  isOpen,
  onClose,
  pageSlug,
  pages,
  onSelectPage
}) => {
  const [remoteDoc, setRemoteDoc] = useState<UnifiedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activePage = pages.find(p => p.slug === pageSlug) || pages[0];

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

  if (!isOpen) return null;

  const getPageIcon = (slug: string) => {
    switch (slug) {
      case 'about-us':
        return <Info className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'terms':
        return <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'faq':
        return <HelpCircle className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'contact':
        return <Phone className="w-4 h-4 text-[var(--accent-primary)]" />;
      case 'privacy':
        return <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />;
      default:
        return <FileText className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  const title = remoteDoc?.title || activePage.title;
  const lastUpdated = remoteDoc?.updatedAt 
    ? new Date(remoteDoc.updatedAt).toLocaleDateString('fa-IR')
    : activePage.lastUpdated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right font-sans text-[var(--text-main)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2.5">
            {getPageIcon(activePage.slug)}
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">{title}</h2>
              <span className="text-[10px] text-[var(--text-muted)]">آخرین به‌روزرسانی: {lastUpdated}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs between static pages */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]/60 overflow-x-auto">
          {pages.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectPage(p.slug)}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all shrink-0 cursor-pointer ${
                p.slug === activePage.slug
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {p.title.split('|')[0].trim()}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activePage.summary && (
            <div className="p-3.5 bg-[var(--accent-soft)] border border-[var(--border-color)] rounded-2xl text-xs text-[var(--accent-primary)] font-semibold">
              {activePage.summary}
            </div>
          )}

          <div className="text-xs text-[var(--text-main)] leading-relaxed space-y-4 bg-[var(--bg-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
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
        <div className="px-6 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
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
