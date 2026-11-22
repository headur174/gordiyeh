import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  ShoppingCart, 
  Scale, 
  Check, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  ListOrdered, 
  FileText, 
  Sparkles,
  Video,
  ArrowRight
} from 'lucide-react';
import { CanonicalProduct, Currency } from '../../types';
import { formatCurrency } from '../../utils';
import { ProductVideoIntelligence } from './ProductVideoIntelligence';
import { FAQEngine } from './FAQEngine';

interface ProductDetailPageProps {
  product: CanonicalProduct;
  currency: Currency;
  onClose?: () => void;
  onAddToCart: (product: CanonicalProduct, quantity: number, selectedColor?: string) => void;
  onToggleCompare: (product: CanonicalProduct) => void;
  isInCompare: boolean;
  isPage?: boolean;
  relatedProducts?: CanonicalProduct[];
  onSelectProduct?: (product: CanonicalProduct) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  currency,
  onClose,
  onAddToCart,
  isInCompare,
  onToggleCompare,
  isPage = false,
  relatedProducts = [],
  onSelectProduct,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0].name : ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'review' | 'videos'>('specs');

  React.useEffect(() => {
    setSelectedImage(product.image);
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0].name : '');
    setQuantity(1);
  }, [product.id, product.image]);

  const galleryImages = product.gallery && product.gallery.length > 0 
    ? product.gallery 
    : [product.image];

  const activeOffer = product.supplierOffers?.[0];
  const stockCount = activeOffer?.stock || 10;
  const isOutOfStock = stockCount <= 0;

  const discountPercent = product.discountPercent || (product.originalPrice && product.originalPrice > product.retailPrice 
    ? Math.round(((product.originalPrice - product.retailPrice) / product.originalPrice) * 100) 
    : 0);

  const content = (
    <div className={`space-y-6 text-[var(--text-main)] font-sans text-right pb-32 lg:pb-8 ${isPage ? 'max-w-7xl mx-auto px-4 sm:px-6 pt-6' : 'p-4 sm:p-8'}`}>
      
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {onClose && (
            <button onClick={onClose} className="hover:opacity-80 flex items-center gap-1 text-[var(--accent-primary)] font-bold ml-2">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>برگشت</span>
            </button>
          )}
          <span>فروشگاه</span>
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          <span className="text-[var(--text-muted)]">{product.category}</span>
          {product.subCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              <span className="text-[var(--text-muted)]">{product.subCategory}</span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          <span className="text-[var(--accent-primary)] font-bold truncate max-w-[200px] sm:max-w-xs">{product.brandFa || product.brand || product.title}</span>
        </div>

        {onClose && !isPage && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)] transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </nav>

      {/* 3-Column PDP Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Column 1: Image Gallery & Test/Exchange Box (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm flex items-center justify-center p-4">
            <div className="w-full h-full rounded-2xl bg-[var(--bg-card)]/60 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={selectedImage}
                alt={product.title}
                width={400}
                height={400}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-xl transition-all duration-300"
              />
            </div>
            {discountPercent > 0 && (
              <span className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-xs shadow-sm tabular-nums">
                {discountPercent}٪ تخفیف
              </span>
            )}
          </div>

          {/* Thumbnails Gallery */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === img
                      ? 'border-[var(--accent-primary)] scale-105 shadow-md'
                      : 'border-[var(--border-color)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" width={64} height={64} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Fixed UI Box: جعبه‌ی تست و تعویض */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-color)]">
              <RotateCcw className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
              <span>جعبه‌ی تست و تعویض</span>
            </div>

            {product.testExchangeBox ? (
              <div className="space-y-2 text-xs leading-[1.8]">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[var(--text-muted)] shrink-0">مهلت تست:</span>
                  <span className="font-bold text-[var(--accent-primary)] text-left">{product.testExchangeBox.testWindow}</span>
                </div>
                <div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">شامل چه چیزهایی می‌شه:</span>
                  <p className="text-[var(--text-secondary)] leading-[1.8]">{product.testExchangeBox.covered}</p>
                </div>
                <div>
                  <span className="text-rose-500 dark:text-rose-400 font-bold block mb-0.5">شامل چه چیزهایی نمی‌شه:</span>
                  <p className="text-[var(--text-secondary)] leading-[1.8]">{product.testExchangeBox.notCovered}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                مهلت و شرایط تست این محصول هنوز ثبت نشده؛ برای استعلام پیش از خرید با پشتیبانی تماس بگیرید.
              </p>
            )}
          </div>
        </div>

        {/* Column 2: Product Identity, Lead, Usage Contexts & Honesty Strip (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--accent-primary)] font-bold mb-1.5">
              <span>{product.brandFa || product.brand || 'گُردیه'}</span>
              <span className="opacity-40">•</span>
              <span className="text-[var(--text-muted)] font-normal">کد محصول: <span className="font-mono">{product.sku}</span></span>
            </div>

            <h1 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
              {product.title}
            </h1>

            {product.titleEn && (
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1 tracking-tight opacity-85">
                {product.titleEn}
              </p>
            )}

            {product.description && (
              <p className="text-[13px] sm:text-sm text-[var(--text-secondary)] leading-[1.85] mt-3">
                {product.description}
              </p>
            )}
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
              <div className="text-xs font-semibold text-[var(--text-main)]">
                <span>انتخاب رنگ: </span>
                <span className="text-[var(--accent-primary)] font-bold">{selectedColor || 'پیش‌فرض'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(col => {
                  const isSelected = selectedColor === col.name;
                  return (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColor(col.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'border-[var(--accent-primary)] bg-[var(--badge-bg)] text-[var(--text-main)] shadow'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-active)]'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: col.hex }}
                        className="w-3.5 h-3.5 rounded-full border border-black/20 inline-block"
                      />
                      <span>{col.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Usage Contexts: کجا به کارتون می‌آد */}
          {product.usageContexts && product.usageContexts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
              <h4 className="text-[13px] font-bold text-[var(--text-main)]">کجا به کارتون می‌آد:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.usageContexts.map((ctx, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs space-y-1">
                    <div className="font-bold text-[var(--accent-primary)]">{ctx.title}</div>
                    <p className="text-[var(--text-secondary)] leading-[1.8]">{ctx.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Features Bullet Points */}
          {product.keyFeatures && product.keyFeatures.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-[13px] font-bold text-[var(--text-main)]">ویژگی‌ها:</h4>
              <ul className="space-y-1.5 text-xs sm:text-[13px] text-[var(--text-secondary)] leading-[1.8] pr-2">
                {product.keyFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Honesty Section: برای چه کسی مناسبه / برای چه کسی نیست */}
          {(product.suitableFor || product.notSuitableFor) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {product.suitableFor && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1 text-xs">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">برای چه کسی مناسبه؟</span>
                  <p className="text-[var(--text-main)] leading-[1.8]">{product.suitableFor}</p>
                </div>
              )}
              {product.notSuitableFor && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1 text-xs">
                  <span className="font-bold text-rose-500 dark:text-rose-400 block">برای چه کسی مناسب نیست؟</span>
                  <p className="text-[var(--text-main)] leading-[1.8]">{product.notSuitableFor}</p>
                </div>
              )}
            </div>
          )}

          {/* Short shipping & warranty summary */}
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-[var(--text-muted)]">شرایط گارانتی و تست:</span>
              <span className="text-[var(--text-main)] font-semibold">{product.warranty || 'شرایط تست و تعویض همین صفحه'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[var(--text-muted)]">ارسال:</span>
              <span className="text-emerald-500 font-semibold">پیک و پست پیشتاز</span>
            </div>
          </div>
        </div>

        {/* Column 3: Buy Box (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--text-main)]">قیمت و ثبت سفارش</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold tabular-nums">
                {isOutOfStock ? 'ناموجود' : stockCount <= 5 ? `فقط ${stockCount} عدد مونده` : 'موجود در انبار'}
              </span>
            </div>

            {/* Price section */}
            <div className="space-y-1 text-left">
              {product.originalPrice && product.originalPrice > product.retailPrice && (
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>قیمت قبل:</span>
                  <span className="line-through tabular-nums">{formatCurrency(product.originalPrice, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-bold">قیمت:</span>
                <span className="text-lg font-bold text-[var(--text-main)] tabular-nums">
                  {formatCurrency(product.retailPrice, currency)}
                </span>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)]">تعداد:</span>
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-bold flex items-center justify-center text-sm border border-[var(--border-color)] cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center tabular-nums font-bold text-sm text-[var(--text-main)]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => Math.min(stockCount, prev + 1))}
                  className="w-7 h-7 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-bold flex items-center justify-center text-sm border border-[var(--border-color)] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={() => onAddToCart(product, quantity, selectedColor)}
              disabled={isOutOfStock}
              className={`w-full py-3 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isOutOfStock
                  ? 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border-color)]'
                  : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] shadow-sm'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isOutOfStock ? 'فعلاً ناموجوده' : 'افزودن به سبد'}</span>
            </button>

            <button
              onClick={() => onToggleCompare(product)}
              className={`w-full py-2.5 px-3 rounded-full border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                isInCompare
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-active)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isInCompare ? 'توی لیست مقایسه‌ست' : 'افزودن به مقایسه'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabbed Section: Specs, Review, Videos */}
      <div className="border-t border-[var(--border-color)] pt-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'specs'
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>مشخصات محصول</span>
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'review'
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>بررسی و نکات قبل از خرید</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'videos'
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>ویدیوها</span>
          </button>
        </div>

        {/* Tab 1: Technical Specs */}
        {activeTab === 'specs' && (
          <div className="space-y-6">
            {product.specs && product.specs.length > 0 ? (
              product.specs.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                  <h3 className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                    <span>{group.group}</span>
                  </h3>

                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden divide-y divide-[var(--border-color)] text-xs sm:text-[13px] leading-[1.8]">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="grid grid-cols-1 sm:grid-cols-3 p-3.5 gap-2">
                        <span className="font-medium text-[var(--text-secondary)]">{item.title || item.key}</span>
                        <span className="sm:col-span-2 text-[var(--text-main)] font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 text-center text-xs text-[var(--text-secondary)] space-y-2 leading-[1.8]">
                <p>اطلاعات کلی محصول:</p>
                <div className="text-[var(--text-main)] font-bold">
                  دسته: {product.category} | کد محصول: <span className="font-mono">{product.sku}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Introduction & Review */}
        {activeTab === 'review' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6 text-xs sm:text-[13px] leading-[1.85] text-[var(--text-main)]">
            {product.expertReview ? (
              <>
                <div className="space-y-2">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span>نگاه واقع‌بینانه به این محصول</span>
                  </h3>
                  <p className="text-[var(--text-secondary)] text-[13px] sm:text-sm leading-[1.85]">
                    {product.expertReview.intro || product.expertReview.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                      <ThumbsUp className="w-4 h-4" />
                      <span>نکته‌های مثبت</span>
                    </h4>
                    <ul className="space-y-1 text-[var(--text-main)]">
                      {product.expertReview.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                      <ThumbsDown className="w-4 h-4" />
                      <span>محدودیت‌ها و نکته‌های قبل از خرید</span>
                    </h4>
                    <ul className="space-y-1 text-[var(--text-main)]">
                      {product.expertReview.cons.map((con, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--badge-bg)] border border-[var(--border-color)]">
                  <span className="font-bold text-[var(--accent-primary)] block mb-1">جمع‌بندی:</span>
                  <span className="text-[var(--text-main)]">{product.expertReview.verdict || product.expertReview.summary}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-[var(--text-muted)]">
                بررسی تکمیلی این محصول به‌زودی اضافه می‌شه.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Video Reviews */}
        {activeTab === 'videos' && (
          <ProductVideoIntelligence product={product} />
        )}
      </div>

      {/* Grounded Buyer FAQ Engine (Strict: only documented product card answers) */}
      <FAQEngine product={product} />

      {/* Related Products Carousel */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="pt-6 border-t border-[var(--border-color)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
              <span>محصولات مشابه</span>
            </h3>
            <span className="text-xs text-[var(--text-muted)]">محصولات هم‌رده در دسته‌ی {product.category}</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-none">
            {relatedProducts.slice(0, 6).map(relProd => (
              <div
                key={relProd.id}
                onClick={() => onSelectProduct ? onSelectProduct(relProd) : null}
                className="group min-w-[220px] max-w-[220px] shrink-0 cursor-pointer rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] p-3.5 shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-2.5"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[var(--bg-card)]">
                  <img
                    src={relProd.image}
                    alt={relProd.title}
                    width={180}
                    height={180}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-[var(--accent-primary)] font-semibold">{relProd.brandFa || relProd.brand}</span>
                  <h4 className="text-[13px] font-bold text-[var(--text-main)] line-clamp-2 leading-[1.7]">
                    {relProd.title}
                  </h4>
                  <div className="text-sm font-bold text-[var(--text-main)] tabular-nums pt-1">
                    {formatCurrency(relProd.retailPrice, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Buy Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-[var(--bg-surface)]/95 border-t border-[var(--border-color)] backdrop-blur-md flex items-center justify-between gap-3 z-50">
        <div>
          <div className="text-[11px] text-[var(--text-muted)]">قیمت:</div>
          <div className="text-[15px] font-bold text-[var(--text-main)] tabular-nums">
            {formatCurrency(product.retailPrice, currency)}
          </div>
        </div>
        <button
          onClick={() => onAddToCart(product, quantity, selectedColor)}
          disabled={isOutOfStock}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            isOutOfStock
              ? 'bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed'
              : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] shadow-sm'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isOutOfStock ? 'فعلاً ناموجوده' : 'افزودن به سبد'}</span>
        </button>
      </div>
    </div>
  );

  if (isPage) {
    return <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-6xl shadow-2xl max-h-[95vh] overflow-y-auto my-auto text-[var(--text-main)]">
        {content}
      </div>
    </div>
  );
};
