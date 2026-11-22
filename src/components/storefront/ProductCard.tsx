import React from 'react';
import {
  Truck,
  ShoppingBag,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { CanonicalProduct, Currency } from '../../types';
import { formatCurrency } from '../../utils';
import { toCanonicalProductUrl } from '../../gordiyehKit';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'item';
}

interface ProductCardProps {
  product: CanonicalProduct;
  currency: Currency;
  viewMode?: 'grid' | 'list';
  onSelect?: (product: CanonicalProduct) => void;
  onSelectProduct?: (product: CanonicalProduct) => void;
  onAddToCart: (product: CanonicalProduct) => void;
  isInCompare?: boolean;
  onToggleCompare?: (product: CanonicalProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  viewMode = 'grid',
  onSelect,
  onSelectProduct,
  onAddToCart,
}) => {
  const handleSelect = onSelectProduct || onSelect || (() => {});
  const activeOffer = product.supplierOffers?.find(o => o.id === product.selectedOfferId) || product.supplierOffers?.[0];
  const isOutOfStock = !activeOffer || activeOffer.stock <= 0;
  const isLowStock = activeOffer && activeOffer.stock > 0 && activeOffer.stock <= 5;
  const isExpress = (activeOffer?.dispatchTimeHours || 24) <= 6;
  const discountPercent = product.discountPercent || (product.originalPrice && product.originalPrice > product.retailPrice
    ? Math.round(((product.originalPrice - product.retailPrice) / product.originalPrice) * 100)
    : 0);

  const productUrl = toCanonicalProductUrl(product.id);

  if (viewMode === 'list') {
    return (
      <div className="group bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] shadow-sm rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-center gap-5">
        <a
          href={productUrl}
          onClick={(e) => {
            e.preventDefault();
            handleSelect(product);
          }}
          className="relative w-full sm:w-44 h-44 rounded-xl overflow-hidden bg-[var(--bg-card)] shrink-0 cursor-pointer block"
        >
          <img
            src={product.image}
            alt={product.title}
            width={176}
            height={176}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </a>

        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--accent-primary)]">{product.brandFa || product.brand || product.category}</span>
              {discountPercent > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{discountPercent}٪ تخفیف</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">{product.sku}</span>
          </div>

          <a
            href={productUrl}
            onClick={(e) => {
              e.preventDefault();
              handleSelect(product);
            }}
            className="block text-[13px] sm:text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 leading-[1.8]"
          >
            {product.title}
          </a>

          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <div className="hidden md:flex flex-wrap gap-2 pt-1 text-xs text-[var(--text-secondary)] leading-[1.8]">
              {product.keyFeatures.slice(0, 2).map((feat, idx) => (
                <span key={idx}>{idx > 0 ? `· ${feat}` : feat}</span>
              ))}
            </div>
          )}
        </div>

        <div className="sm:border-r border-[var(--border-color)] sm:pr-5 flex flex-col items-end justify-between self-stretch gap-3 w-full sm:w-56">
          <div className="text-left w-full space-y-1">
            {product.originalPrice && product.originalPrice > product.retailPrice && (
              <div className="text-xs text-[var(--text-muted)] line-through tabular-nums">
                {formatCurrency(product.originalPrice, currency)}
              </div>
            )}
            <div className="text-[15px] sm:text-base font-bold text-[var(--text-main)] tabular-nums leading-[1.65]">
              {formatCurrency(product.retailPrice, currency)}
            </div>
            {isLowStock && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>فقط {activeOffer?.stock} عدد مونده</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                isOutOfStock
                  ? 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]'
                  : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] shadow-sm'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'ناموجوده' : 'افزودن به سبد'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View — 10/10 Clean Persian Gadget Retail Card
  const shortSpecs = (product.keyFeatures || [])
    .slice(0, 2)
    .map((f) => f.split('(')[0].split(':')[0].trim())
    .filter(Boolean);

  return (
    <div className="group bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] rounded-2xl p-3.5 shadow-sm hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full">
      <div>
        {/* 1. Clean Photo Stage */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[var(--bg-card)] mb-3">
          <a
            href={productUrl}
            onClick={(e) => {
              e.preventDefault();
              handleSelect(product);
            }}
            className="block w-full h-full cursor-pointer"
          >
            <img
              src={product.image}
              alt={product.title}
              width={320}
              height={320}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </a>

          {discountPercent > 0 ? (
            <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[var(--accent-primary)] text-white text-[11px] font-medium tabular-nums shadow-sm pointer-events-none">
              {discountPercent}٪ تخفیف
            </span>
          ) : isExpress ? (
            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-color)] text-[var(--text-main)] text-[11px] font-medium inline-flex items-center gap-1 backdrop-blur-sm pointer-events-none">
              <Truck className="w-3 h-3 text-[var(--accent-text)]" aria-hidden="true" />
              <span>ارسال سریع</span>
            </span>
          ) : null}

          <button
            type="button"
            onClick={() => handleSelect(product)}
            className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-[var(--bg-glass)] backdrop-blur-sm border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center opacity-85 group-hover:opacity-100 transition-all cursor-pointer"
            title="مشاهده محصول"
            aria-label="مشاهده محصول"
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* 2. Brand + Visible Swatches Row */}
        <div className="flex items-center justify-between gap-2 px-0.5 mb-1.5">
          <span className="text-[11px] font-bold text-[var(--accent-text)] truncate">
            {product.brandFa || product.brand || product.category}
          </span>

          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0" aria-label="رنگ‌های موجود">
              {product.colors.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  style={{ backgroundColor: c.hex }}
                  className="w-3.5 h-3.5 rounded-full border border-[var(--border-color)] ring-1 ring-inset ring-black/15 inline-block shadow-xs"
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Balanced 2-Line Title */}
        <a
          href={productUrl}
          onClick={(e) => {
            e.preventDefault();
            handleSelect(product);
          }}
          className="block px-0.5 text-[13px] sm:text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent-text)] transition-colors cursor-pointer line-clamp-2 leading-[1.8] min-h-[3.1rem]"
        >
          {product.title}
        </a>

        {/* 4. Concise 2 Key Specs (Readable Text Meta) */}
        {shortSpecs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 px-0.5">
            {shortSpecs.map((spec, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-color)] text-[11px] font-medium text-[var(--text-secondary)] truncate max-w-[138px]"
                title={spec}
              >
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5. Aligned Price & Primary Add-to-Cart Bar */}
      <div className="pt-3 mt-3 border-t border-[var(--border-color)] space-y-2.5 px-0.5">
        <div className="flex items-center justify-between gap-2 min-h-[36px]">
          <div>
            {isLowStock ? (
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium tabular-nums">
                فقط {activeOffer?.stock} عدد مونده
              </div>
            ) : isExpress && discountPercent > 0 ? (
              <span className="text-[11px] text-[var(--text-secondary)] inline-flex items-center gap-1 font-medium">
                <Truck className="w-3.5 h-3.5 text-[var(--accent-text)]" aria-hidden="true" />
                <span>ارسال سریع</span>
              </span>
            ) : null}
          </div>

          <div className="text-left mr-auto">
            {product.originalPrice && product.originalPrice > product.retailPrice && (
              <div className="text-[11px] text-[var(--text-muted)] line-through tabular-nums">
                {formatCurrency(product.originalPrice, currency)}
              </div>
            )}
            <div className="text-[15px] sm:text-base font-bold text-[var(--text-main)] tabular-nums leading-[1.5]">
              {formatCurrency(product.retailPrice, currency)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className={`w-full min-h-[40px] py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            isOutOfStock
              ? 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]'
              : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white shadow-sm'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{isOutOfStock ? 'ناموجوده' : 'افزودن به سبد'}</span>
        </button>
      </div>
    </div>
  );
};
