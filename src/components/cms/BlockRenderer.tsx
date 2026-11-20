import React from 'react';
import {
  ContentBlock,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ImageBlock,
  ProductCardBlock,
  CalloutBlock,
  sanitizeInlineHtml
} from '../../types/cms';
import { CanonicalProduct } from '../../types';
import { formatCurrency } from '../../utils';
import { toCanonicalProductUrl } from '../../gordiyehKit';
import { Info, AlertTriangle, Lightbulb, ShoppingBag, ExternalLink } from 'lucide-react';

export interface BlockRendererProps {
  blocks: ContentBlock[];
  products?: Record<string, CanonicalProduct>;
  onAddToCart?: (product: CanonicalProduct) => void;
  onOpenProduct?: (product: CanonicalProduct) => void;
  className?: string;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  blocks,
  products = {},
  onAddToCart,
  onOpenProduct,
  className = '',
}) => {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const renderHeading = (block: HeadingBlock) => {
    const baseClasses = "font-black tracking-tight text-[var(--text-main)] scroll-mt-20 leading-snug";
    if (block.level === 2) {
      return (
        <h2 key={block.id} className={`${baseClasses} text-xl sm:text-2xl mt-8 mb-4 pb-2 border-b border-[var(--border-color)]`}>
          {block.text}
        </h2>
      );
    }
    if (block.level === 3) {
      return (
        <h3 key={block.id} className={`${baseClasses} text-lg sm:text-xl mt-6 mb-3`}>
          {block.text}
        </h3>
      );
    }
    return (
      <h4 key={block.id} className={`${baseClasses} text-base sm:text-lg mt-5 mb-2`}>
        {block.text}
      </h4>
    );
  };

  const renderParagraph = (block: ParagraphBlock) => {
    let colorClass = "text-[var(--text-main)]";
    if (block.colorToken === 'accent') colorClass = "text-[var(--accent-primary)] font-semibold";
    else if (block.colorToken === 'secondary') colorClass = "text-[var(--accent-secondary)] font-semibold";
    else if (block.colorToken === 'muted') colorClass = "text-[var(--text-muted)]";
    else if (block.colorToken === 'warning') colorClass = "text-amber-500 font-medium";

    const cleanHtml = sanitizeInlineHtml(block.html);

    return (
      <p
        key={block.id}
        className={`leading-relaxed text-sm sm:text-base my-3.5 ${colorClass}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  const renderList = (block: ListBlock) => {
    if (block.ordered) {
      return (
        <ol key={block.id} className="list-decimal list-inside space-y-1.5 my-4 text-sm sm:text-base text-[var(--text-main)] pr-2">
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    }

    return (
      <ul key={block.id} className="list-disc list-inside space-y-1.5 my-4 text-sm sm:text-base text-[var(--text-main)] pr-2">
        {block.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderImage = (block: ImageBlock) => {
    return (
      <figure key={block.id} className="my-6 space-y-2">
        <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)]">
          <img
            src={block.url}
            alt={block.alt}
            width={block.width}
            height={block.height}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover max-h-[550px] transition-transform duration-300"
          />
        </div>
        {block.caption && (
          <figcaption className="text-center text-xs text-[var(--text-muted)] italic pt-1">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  };

  const renderProductCard = (block: ProductCardBlock) => {
    const product = products[block.productId];
    if (!product) {
      // If product does not exist in catalog, gracefully omit the block to avoid broken UI
      return null;
    }

    const canonicalUrl = toCanonicalProductUrl(product.id);

    return (
      <aside
        key={block.id}
        className="my-7 p-4 sm:p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-active)] shadow-theme-glow relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 transition-all"
        aria-label={`مشاهده ${product.title}`}
      >
        <a
          href={canonicalUrl}
          onClick={(e) => {
            if (onOpenProduct) {
              e.preventDefault();
              onOpenProduct(product);
            }
          }}
          className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden bg-[var(--bg-main)] border border-[var(--border-color)] shrink-0 block cursor-pointer"
        >
          <img
            src={product.image}
            alt={product.title}
            width={144}
            height={144}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </a>

        <div className="flex-1 min-w-0 space-y-2 w-full text-right">
          <div className="text-[11px] font-semibold text-[var(--accent-primary)] font-mono">
            محصول مرتبط • {product.brandFa || product.brand || 'گُردیه'}
          </div>

          <a
            href={canonicalUrl}
            onClick={(e) => {
              if (onOpenProduct) {
                e.preventDefault();
                onOpenProduct(product);
              }
            }}
            className="block text-sm sm:text-base font-bold text-[var(--text-main)] hover:text-[var(--accent-primary)] transition-colors line-clamp-2 leading-relaxed"
          >
            {product.title}
          </a>

          <div className="text-base font-black text-[var(--text-main)] font-mono pt-1">
            {formatCurrency(product.retailPrice, 'TOMAN')}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <a
              href={canonicalUrl}
              onClick={(e) => {
                if (onOpenProduct) {
                  e.preventDefault();
                  onOpenProduct(product);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] transition-colors flex items-center gap-1.5"
            >
              <span>مشاهده محصول</span>
              <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
            </a>

            {onAddToCart && (
              <button
                onClick={() => onAddToCart(product)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white accent-gradient-bg hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>افزودن به سبد</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    );
  };

  const renderCallout = (block: CalloutBlock) => {
    let containerClass = "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)]";
    let icon = <Info className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />;

    if (block.intent === 'warning') {
      containerClass = "bg-amber-950/20 border-amber-500/40 text-amber-200";
      icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    } else if (block.intent === 'tip') {
      containerClass = "bg-emerald-950/20 border-emerald-500/40 text-emerald-200";
      icon = <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0" />;
    }

    return (
      <div
        key={block.id}
        className={`my-5 p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm leading-relaxed ${containerClass}`}
      >
        {icon}
        <div className="space-y-1 flex-1 min-w-0">
          {block.title && <div className="font-bold">{block.title}</div>}
          <div className="whitespace-pre-line">{block.text}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`prose-gordiyeh ${className}`}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading':
            return renderHeading(block);
          case 'paragraph':
            return renderParagraph(block);
          case 'list':
            return renderList(block);
          case 'image':
            return renderImage(block);
          case 'product_card':
            return renderProductCard(block);
          case 'callout':
            return renderCallout(block);
          default:
            return null;
        }
      })}
    </div>
  );
};
