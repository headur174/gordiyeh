import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CanonicalProduct, Currency } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { VirtualList } from './VirtualList';
import { 
  Sparkles, 
  HelpCircle, 
  Layers, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  EyeOff, 
  TrendingUp, 
  Package, 
  Truck, 
  ShieldCheck, 
  Search,
  Zap,
  Tag,
  Building2,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Edit3,
  Check
} from 'lucide-react';

interface CatalogBrainViewProps {
  products: CanonicalProduct[];
  currency: Currency;
  onExplainProduct: (product: CanonicalProduct) => void;
  onSwitchSupplierOffer: (productId: string, offerId: string) => void;
  onToggleKillList: (productId: string) => void;
  onRepriceProduct: (productId: string, newPrice: number) => void;
}

const STORAGE_KEY = 'commerce_os_catalog_filters';

// Helper to read initial filters from URL search params or fallback to localStorage
function getInitialFilters() {
  let urlParams: URLSearchParams | null = null;
  if (typeof window !== 'undefined') {
    urlParams = new URLSearchParams(window.location.search);
  }

  // 1. Try URL parameters first
  if (urlParams) {
    const q = urlParams.get('q');
    const status = urlParams.get('status') as 'ALL' | 'PUBLISHED' | 'KILL_LIST' | 'WINNERS' | null;
    const supplier = urlParams.get('supplier');
    const sort = urlParams.get('sort') as 'WINNER_SCORE' | 'MARGIN' | 'PRICE_ASC' | 'PRICE_DESC' | null;

    if (q !== null || status !== null || supplier !== null || sort !== null) {
      return {
        searchTerm: q || '',
        statusFilter: (status === 'PUBLISHED' || status === 'KILL_LIST' || status === 'WINNERS') ? status : 'ALL',
        selectedSupplierId: supplier || 'ALL',
        sortBy: (sort === 'WINNER_SCORE' || sort === 'MARGIN' || sort === 'PRICE_ASC' || sort === 'PRICE_DESC') ? sort : 'WINNER_SCORE',
      };
    }
  }

  // 2. Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          searchTerm: typeof parsed.searchTerm === 'string' ? parsed.searchTerm : '',
          statusFilter: parsed.statusFilter || 'ALL',
          selectedSupplierId: parsed.selectedSupplierId || 'ALL',
          sortBy: parsed.sortBy || 'WINNER_SCORE',
        };
      }
    } catch (e) {
      // ignore parse error
    }
  }

  // 3. Default state
  return {
    searchTerm: '',
    statusFilter: 'ALL' as const,
    selectedSupplierId: 'ALL',
    sortBy: 'WINNER_SCORE' as const,
  };
}

export const CatalogBrainView: React.FC<CatalogBrainViewProps> = ({
  products,
  currency,
  onExplainProduct,
  onSwitchSupplierOffer,
  onToggleKillList,
  onRepriceProduct,
}) => {
  const initial = useMemo(() => getInitialFilters(), []);
  const [searchTerm, setSearchTerm] = useState(initial.searchTerm);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'KILL_LIST' | 'WINNERS'>(initial.statusFilter);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(initial.selectedSupplierId);
  const [sortBy, setSortBy] = useState<'WINNER_SCORE' | 'MARGIN' | 'PRICE_ASC' | 'PRICE_DESC'>(initial.sortBy);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);

  // Sync state to URL and LocalStorage
  useEffect(() => {
    // 1. LocalStorage
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ searchTerm, statusFilter, selectedSupplierId, sortBy })
      );
    } catch (e) {
      // ignore storage quota errors
    }

    // 2. URL Search Params (without page reload)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (searchTerm) url.searchParams.set('q', searchTerm);
      else url.searchParams.delete('q');

      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      else url.searchParams.delete('status');

      if (selectedSupplierId !== 'ALL') url.searchParams.set('supplier', selectedSupplierId);
      else url.searchParams.delete('supplier');

      if (sortBy !== 'WINNER_SCORE') url.searchParams.set('sort', sortBy);
      else url.searchParams.delete('sort');

      window.history.replaceState(window.history.state, '', url.toString());
    }
  }, [searchTerm, statusFilter, selectedSupplierId, sortBy]);

  // Repricing inline state
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState<number>(0);

  // Extract list of all unique suppliers with product count
  const suppliersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    products.forEach(p => {
      p.supplierOffers.forEach(o => {
        const existing = map.get(o.supplierId) || { id: o.supplierId, name: o.supplierName, count: 0 };
        existing.count += 1;
        map.set(o.supplierId, existing);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  // Comprehensive filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search term (Title, SKU, Category, Supplier Names)
      const query = searchTerm.trim().toLowerCase();
      if (query) {
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesSupplier = p.supplierOffers.some(o => o.supplierName.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSku && !matchesCategory && !matchesSupplier) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter === 'PUBLISHED' && p.status !== 'PUBLISHED') return false;
      if (statusFilter === 'KILL_LIST' && p.status !== 'KILL_LIST') return false;
      if (statusFilter === 'WINNERS' && p.winnerScore <= 85) return false;

      // 3. Supplier Filter
      if (selectedSupplierId !== 'ALL') {
        const hasSupplierOffer = p.supplierOffers.some(o => o.supplierId === selectedSupplierId);
        if (!hasSupplierOffer) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'WINNER_SCORE') return b.winnerScore - a.winnerScore;
      if (sortBy === 'MARGIN') return b.dna.currentMarginPercent - a.dna.currentMarginPercent;
      if (sortBy === 'PRICE_ASC') return a.retailPrice - b.retailPrice;
      if (sortBy === 'PRICE_DESC') return b.retailPrice - a.retailPrice;
      return 0;
    });
  }, [products, searchTerm, statusFilter, selectedSupplierId, sortBy]);

  // Synchronize selection safely so right pane never shows an out-of-filter item
  const selectedProduct = useMemo(() => {
    return filteredProducts.find(p => p.id === selectedProductId) || filteredProducts[0] || null;
  }, [filteredProducts, selectedProductId]);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL' || selectedSupplierId !== 'ALL' || sortBy !== 'WINNER_SCORE';

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSelectedSupplierId('ALL');
    setSortBy('WINNER_SCORE');
  };

  const handleStartRepricing = () => {
    if (selectedProduct) {
      setTempPrice(selectedProduct.retailPrice);
      setIsEditingPrice(true);
    }
  };

  const handleSavePrice = () => {
    if (selectedProduct && tempPrice > 0) {
      onRepriceProduct(selectedProduct.id, tempPrice);
      setIsEditingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white">هسته کاتالوگ و هوش محصول (Canonical Catalog & Product DNA)</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            هر محصول به عنوان هویت استاندارد (Canonical) با چند آفر از تأمین‌کنندگان مختلف و شناسنامه ژنتیکی مستقل پایش می‌شود.
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            کل کاتالوگ: <strong className="text-white font-bold">{products.length}</strong> کالا
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono">
            تأمین‌کنندگان فعال: <strong className="text-indigo-400 font-bold">{suppliersList.length}</strong> مرکز
          </span>
        </div>
      </div>

      {/* SMART SEARCH & FILTER BAR (نوار هوشمند جستجو و فیلتر کاتالوگ) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* 1. Main Search Input (Title, SKU, Category, Supplier) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              placeholder="جستجو هوشمند بر اساس عنوان کالا، SKU، دسته یا تأمین‌کننده..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
                title="پاک‌کردن متن جستجو"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Status Filter Tabs */}
          <div className="md:col-span-4 flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg text-center transition-all whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              همه ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-emerald-700 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              ویترین ({products.filter(p => p.status === 'PUBLISHED').length})
            </button>
            <button
              onClick={() => setStatusFilter('KILL_LIST')}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg text-center transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                statusFilter === 'KILL_LIST'
                  ? 'bg-rose-700 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              لیست مرگ ({products.filter(p => p.status === 'KILL_LIST').length})
            </button>
            <button
              onClick={() => setStatusFilter('WINNERS')}
              className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg text-center transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                statusFilter === 'WINNERS'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              وینر ({products.filter(p => p.winnerScore > 85).length})
            </button>
          </div>

          {/* 3. Supplier Filter Dropdown */}
          <div className="md:col-span-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="ALL">همه تأمین‌کنندگان ({suppliersList.length})</option>
                {suppliersList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.count} کالا)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filter Details & Sorting Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">
              نمایش <strong className="text-white font-bold font-mono">{filteredProducts.length}</strong> از{' '}
              <span className="font-mono">{products.length}</span> کالا
            </span>

            {/* Active filters pills */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-[11px]">
                جستجو: «{searchTerm}»
                <button onClick={() => setSearchTerm('')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px]">
                وضعیت: {statusFilter === 'PUBLISHED' ? 'ویترین فعال' : statusFilter === 'KILL_LIST' ? 'لیست مرگ' : 'وینرها'}
                <button onClick={() => setStatusFilter('ALL')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedSupplierId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px]">
                تأمین‌کننده: {suppliersList.find(s => s.id === selectedSupplierId)?.name}
                <button onClick={() => setSelectedSupplierId('ALL')} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-300 hover:bg-rose-900/40 transition-colors text-[11px]"
              >
                <RotateCcw className="w-3 h-3" />
                پاک‌سازی همه فیلترها
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
              مرتب‌سازی:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="WINNER_SCORE">امتیاز وینر (بیشترین)</option>
              <option value="MARGIN">حاشیه سود (بیشترین)</option>
              <option value="PRICE_ASC">قیمت (ارزان‌ترین)</option>
              <option value="PRICE_DESC">قیمت (گران‌ترین)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Products List & Detailed DNA / Supplier Switching Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection Cards */}
        <div className="lg:col-span-5 space-y-3">
          <VirtualList<CanonicalProduct>
            items={filteredProducts}
            itemHeight={126}
            containerHeight={720}
            overscan={4}
            className="pr-1"
            emptyPlaceholder={
              <div className="p-8 text-center bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-slate-300">
                  هیچ کالایی با فیلترهای انتخابی یافت نشد.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 text-xs font-bold hover:bg-indigo-600/50 transition-colors"
                >
                  بازنشانی فیلترها
                </button>
              </div>
            }
            renderItem={(p) => {
              const isSelected = selectedProduct?.id === p.id;
              const isKill = p.status === 'KILL_LIST';
              const activeOffer = p.supplierOffers.find(o => o.id === p.selectedOfferId) || p.supplierOffers[0];

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-850 border-indigo-500/80 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-14 h-14 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {p.sku}
                        </span>
                        {p.winnerScore > 85 && !isKill && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1 border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5" />
                            Winner {p.winnerScore}
                          </span>
                        )}
                        {isKill && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Kill List
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs font-bold text-white line-clamp-2">{p.title}</h3>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                        <span className="font-bold text-slate-200">{formatCurrency(p.retailPrice, currency)}</span>
                        <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                          مارجین: {formatPercent(p.dna.currentMarginPercent)}
                        </span>
                      </div>

                      {/* Current supplier indicator */}
                      <div className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-500" />
                        <span>تأمین‌کننده فعال: {activeOffer?.supplierName || 'تعیین‌نشده'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Right Column: Deep Product DNA, Multi-Supplier Offers & Explainability */}
        <div className="lg:col-span-7">
          {selectedProduct ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Top Banner with "Why?" Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-indigo-400">{selectedProduct.sku}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{selectedProduct.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      selectedProduct.status === 'PUBLISHED' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {selectedProduct.status === 'PUBLISHED' ? 'منتشر در ویترین' : 'متوقف در لیست مرگ'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white">{selectedProduct.title}</h2>
                </div>

                {/* Explainability "Why?" Button */}
                <button
                  id={`btn-explain-${selectedProduct.id}`}
                  onClick={() => onExplainProduct(selectedProduct)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 text-xs font-bold flex items-center gap-2 transition-all"
                  title="مشاهده شواهد و منطق تصمیمات الگوریتم برای این کالا"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  چرا؟ (Explain Decision)
                </button>
              </div>

              {/* Price & Contribution Margin Row with Quick Reprice Tool */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">قیمت فروش فعلی:</span>
                    <button
                      onClick={handleStartRepricing}
                      className="text-indigo-400 hover:text-indigo-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
                      title="ویرایش قیمت این کالا"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-sm font-bold text-white">{formatCurrency(selectedProduct.retailPrice, currency)}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">قیمت خرید (Cost):</span>
                  <div className="text-sm font-bold text-slate-300">{formatCurrency(selectedProduct.baseCost, currency)}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">میانه قیمت رقبا:</span>
                  <div className="text-sm font-bold text-cyan-400">{formatCurrency(selectedProduct.marketMedianPrice, currency)}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">حاشیه سود ناخالص:</span>
                  <div className="text-sm font-bold text-emerald-400">{formatPercent(selectedProduct.dna.currentMarginPercent)}</div>
                </div>
              </div>

              {/* Inline Reprice Modal / Drawer */}
              {isEditingPrice && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-indigo-400" />
                      تغییر مستقیم قیمت و محاسبه آنی مارجین سود
                    </h4>
                    <button
                      onClick={() => setIsEditingPrice(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-300 block mb-1">قیمت جدید ({currency}):</label>
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-indigo-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">مارجین تخمینی:</label>
                      <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400">
                        {tempPrice > selectedProduct.baseCost 
                          ? `${formatPercent(((tempPrice - selectedProduct.baseCost) / tempPrice) * 100)}`
                          : '⚠️ زیان‌ده'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsEditingPrice(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={handleSavePrice}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      ثبت و اعمال قیمت
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Supplier Offers & Live Switching (The core concept!) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-400" />
                    آفرهای تأمین‌کنندگان (Multi-Supplier Offers & Fallback)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedProduct.supplierOffers.length} آفر متصل به این SKU
                  </span>
                </div>

                <div className="space-y-2.5">
                  {selectedProduct.supplierOffers.map((offer) => {
                    const isSelectedOffer = selectedProduct.selectedOfferId === offer.id;

                    return (
                      <div
                        key={offer.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelectedOffer
                            ? 'bg-indigo-950/30 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-white">{offer.supplierName}</span>
                              {isSelectedOffer && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  تأمین‌کننده فعال (Active)
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                              <div>
                                قیمت آفر: <span className="font-bold text-slate-200">{formatCurrency(offer.offerPrice, currency)}</span>
                              </div>
                              <div>
                                موجودی انبار: <span className={`font-bold ${offer.stock < 20 ? 'text-rose-400' : 'text-emerald-400'}`}>{offer.stock} عدد</span>
                              </div>
                              <div>
                                زمان ارسال: <span className="font-semibold text-slate-300">{offer.dispatchTimeHours} ساعت</span>
                              </div>
                              <div>
                                نرخ تعهد: <span className="font-semibold text-slate-300">{offer.fulfillmentRate}٪</span>
                              </div>
                            </div>
                          </div>

                          {!isSelectedOffer && (
                            <button
                              onClick={() => onSwitchSupplierOffer(selectedProduct.id, offer.id)}
                              className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              سوئیچ به این آفر
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product DNA Snapshot */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  تحلیل هوشمند تقاضا و کشش مناسبتی (Product DNA)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">تقاضای فعال بازار:</span>
                    <span className="font-bold text-cyan-400 text-sm">{selectedProduct.dna.demandScore} / ۱۰۰</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">شدت رقابت:</span>
                    <span className="font-bold text-slate-200 text-sm">{selectedProduct.dna.competitionDensity}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">قرابت یلدا:</span>
                    <span className="font-bold text-rose-400 text-sm">{selectedProduct.dna.eventAffinity.yalda}٪</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">قرابت نوروز:</span>
                    <span className="font-bold text-emerald-400 text-sm">{selectedProduct.dna.eventAffinity.nowruz}٪</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions (Reprice within rule / Kill list) */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  حداقل مارجین مجاز: {selectedProduct.minMargin}٪
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleKillList(selectedProduct.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      selectedProduct.status === 'KILL_LIST'
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-rose-950 border-rose-800 text-rose-300 hover:bg-rose-900'
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {selectedProduct.status === 'KILL_LIST' ? 'خروج از لیست مرگ (بازگردانی به ویترین)' : 'توقف فروش و انتقال به Kill List'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-12 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              یک کالا را برای مشاهده هوش محصول و آفرها انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
