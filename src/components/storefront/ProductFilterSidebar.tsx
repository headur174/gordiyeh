import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  ShieldCheck, 
  CheckCircle2, 
  Flame, 
  X
} from 'lucide-react';
import { CanonicalProduct } from '../../types';

export interface FilterState {
  searchWithin: string;
  selectedCategory: string;
  selectedSubCategory?: string;
  selectedBrands: string[];
  inStockOnly: boolean;
  expressDeliveryOnly: boolean;
  originalOnly: boolean;
  discountOnly: boolean;
  minPrice: number;
  maxPrice: number;
}

interface ProductFilterSidebarProps {
  products: CanonicalProduct[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  categories: string[];
  maxCatalogPrice: number;
}

export const ProductFilterSidebar: React.FC<ProductFilterSidebarProps> = ({
  products,
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  maxCatalogPrice,
}) => {
  const [brandSearch, setBrandSearch] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    brands: true,
    price: true,
    status: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute available brands and item counts
  const availableBrands = useMemo(() => {
    const brandMap: Record<string, { brand: string; brandFa?: string; count: number }> = {};
    products.forEach(p => {
      const b = p.brand || 'عمومی';
      if (!brandMap[b]) {
        brandMap[b] = { brand: b, brandFa: p.brandFa, count: 0 };
      }
      brandMap[b].count++;
    });
    return Object.values(brandMap);
  }, [products]);

  const filteredBrands = availableBrands.filter(b => 
    b.brand.toLowerCase().includes(brandSearch.toLowerCase()) || 
    (b.brandFa && b.brandFa.includes(brandSearch))
  );

  const toggleBrand = (brandName: string) => {
    const isSelected = filters.selectedBrands.includes(brandName);
    const newBrands = isSelected
      ? filters.selectedBrands.filter(b => b !== brandName)
      : [...filters.selectedBrands, brandName];
    onFilterChange({ ...filters, selectedBrands: newBrands });
  };

  // Count active filters
  const activeFilterCount = 
    (filters.selectedCategory !== 'ALL' ? 1 : 0) +
    (filters.selectedSubCategory ? 1 : 0) +
    filters.selectedBrands.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.expressDeliveryOnly ? 1 : 0) +
    (filters.originalOnly ? 1 : 0) +
    (filters.discountOnly ? 1 : 0) +
    (filters.searchWithin ? 1 : 0) +
    (filters.minPrice > 0 || filters.maxPrice < maxCatalogPrice ? 1 : 0);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 space-y-5 text-[var(--text-main)] transition-colors">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-main)]">فیلترها</h3>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onResetFilters}
            className="text-[11px] text-[var(--accent-primary)] hover:underline font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>حذف همه</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[var(--border-color)]">
          {filters.selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)]">
              <span>دسته: {filters.selectedCategory}</span>
              <button onClick={() => onFilterChange({ ...filters, selectedCategory: 'ALL' })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.selectedSubCategory && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)]">
              <span>{filters.selectedSubCategory}</span>
              <button onClick={() => onFilterChange({ ...filters, selectedSubCategory: undefined })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.selectedBrands.map(b => (
            <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)]">
              <span>{b}</span>
              <button onClick={() => toggleBrand(b)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {filters.inStockOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[10px] text-[var(--text-main)]">
              <span>فقط موجود</span>
              <button onClick={() => onFilterChange({ ...filters, inStockOnly: false })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.expressDeliveryOnly && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[10px] text-[var(--text-main)]">
              <span>ارسال سریع</span>
              <button onClick={() => onFilterChange({ ...filters, expressDeliveryOnly: false })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* 1. Quick Toggles */}
      <div className="space-y-3 pt-1">
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-xs font-semibold text-[var(--text-main)]">فقط محصول‌های موجود</span>
          </div>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-main)]">ارسال سریع (پیک / پیشتاز)</span>
          </div>
          <input
            type="checkbox"
            checked={filters.expressDeliveryOnly}
            onChange={(e) => onFilterChange({ ...filters, expressDeliveryOnly: e.target.checked })}
            className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[var(--accent-secondary)]" />
            <span className="text-xs font-semibold text-[var(--text-main)]">دارای تخفیف</span>
          </div>
          <input
            type="checkbox"
            checked={filters.discountOnly}
            onChange={(e) => onFilterChange({ ...filters, discountOnly: e.target.checked })}
            className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] cursor-pointer transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-xs font-semibold text-[var(--text-main)]">با شرایط تست و تعویض ثبت‌شده</span>
          </div>
          <input
            type="checkbox"
            checked={filters.originalOnly}
            onChange={(e) => onFilterChange({ ...filters, originalOnly: e.target.checked })}
            className="w-4 h-4 rounded accent-[var(--accent-primary)] cursor-pointer"
          />
        </label>
      </div>

      {/* 2. Search within Results */}
      <div className="pt-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="جستجو توی این بخش..."
            value={filters.searchWithin}
            onChange={(e) => onFilterChange({ ...filters, searchWithin: e.target.value })}
            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
          />
          {filters.searchWithin && (
            <button
              onClick={() => onFilterChange({ ...filters, searchWithin: '' })}
              className="absolute left-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Category Tree Navigation */}
      <div className="border-t border-[var(--border-color)] pt-3">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-main)] hover:text-[var(--accent-primary)] pb-2 transition-colors"
        >
          <span>دسته‌بندی محصول‌ها</span>
          {openSections.categories ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </button>

        {openSections.categories && (
          <div className="space-y-1 mt-1 pr-1 max-h-44 overflow-y-auto">
            {categories.map((cat) => {
              const isSelected = filters.selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onFilterChange({ 
                    ...filters, 
                    selectedCategory: cat,
                    selectedSubCategory: undefined
                  })}
                  className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[var(--bg-main)] text-[var(--accent-primary)] font-bold border border-[var(--border-active)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)]/50'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'همه‌ی دسته‌ها' : cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Brand Filtering with Search */}
      <div className="border-t border-[var(--border-color)] pt-3">
        <button
          onClick={() => toggleSection('brands')}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-main)] hover:text-[var(--accent-primary)] pb-2 transition-colors"
        >
          <span>برند و مدل</span>
          {openSections.brands ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </button>

        {openSections.brands && (
          <div className="space-y-2 mt-1">
            <input
              type="text"
              placeholder="جستجوی برند..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {filteredBrands.map(b => {
                const isSelected = filters.selectedBrands.includes(b.brand);
                return (
                  <label
                    key={b.brand}
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--bg-main)]/50 cursor-pointer text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleBrand(b.brand)}
                        className="w-3.5 h-3.5 rounded accent-[var(--accent-primary)] cursor-pointer"
                      />
                      <span className="text-[var(--text-main)] font-medium">
                        {b.brandFa || b.brand}
                      </span>
                    </div>
                    <span className="text-[11px] tabular-nums text-[var(--text-muted)]">
                      ({b.count})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Price Range Filter (Slider & Toman Inputs) */}
      <div className="border-t border-[var(--border-color)] pt-3">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-main)] hover:text-[var(--accent-primary)] pb-2 transition-colors"
        >
          <span>محدوده‌ی قیمت (تومان)</span>
          {openSections.price ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </button>

        {openSections.price && (
          <div className="space-y-3 mt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>از:</span>
                <span className="tabular-nums font-bold text-[var(--text-main)]">
                  {filters.minPrice.toLocaleString()} تومان
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxCatalogPrice}
                step={500000}
                value={filters.minPrice}
                onChange={(e) => onFilterChange({ ...filters, minPrice: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)] h-1.5 bg-[var(--bg-main)] rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>تا:</span>
                <span className="tabular-nums font-bold text-[var(--text-main)]">
                  {filters.maxPrice.toLocaleString()} تومان
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxCatalogPrice}
                step={500000}
                value={filters.maxPrice}
                onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full accent-[var(--accent-primary)] h-1.5 bg-[var(--bg-main)] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
