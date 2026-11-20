import React from 'react';
import { 
  ArrowDownUp, 
  LayoutGrid, 
  List, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Clock, 
  Zap,
  Filter
} from 'lucide-react';

export type SortOption = 
  | 'relevant' 
  | 'views' 
  | 'newest' 
  | 'bestseller' 
  | 'price_asc' 
  | 'price_desc' 
  | 'discount' 
  | 'fastest';

interface ProductSortBarProps {
  totalCount: number;
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  onOpenMobileFilters?: () => void;
  activeFiltersCount?: number;
}

const SORT_TABS: { id: SortOption; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { id: 'relevant', label: 'مرتبط‌ترین' },
  { id: 'bestseller', label: 'منتخب گُردیه' },
  { id: 'newest', label: 'جدیدترین' },
  { id: 'discount', label: 'بیشترین تخفیف' },
  { id: 'price_asc', label: 'ارزان‌ترین' },
  { id: 'price_desc', label: 'گران‌ترین' },
  { id: 'fastest', label: 'سریع‌ترین ارسال' },
];

export const ProductSortBar: React.FC<ProductSortBarProps> = ({
  totalCount,
  currentSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenMobileFilters,
  activeFiltersCount = 0,
}) => {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-[var(--text-main)] transition-colors shadow-sm">
      {/* Right side: Mobile Filter Trigger & Sort tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto scrollbar-none">
        {/* Mobile Filter Button (visible below lg breakpoint) */}
        {onOpenMobileFilters && (
          <button
            onClick={onOpenMobileFilters}
            className="lg:hidden shrink-0 px-3 py-1.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>فیلترها</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] text-[10px] flex items-center justify-center tabular-nums font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] pl-2 border-l border-[var(--border-color)] whitespace-nowrap hidden lg:flex">
          <ArrowDownUp className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="font-bold">مرتب‌سازی:</span>
        </div>

        {SORT_TABS.map((tab) => {
          const isActive = currentSort === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSortChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Left side: Product counter & view switcher */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
        <div className="text-xs text-[var(--text-muted)] tabular-nums">
          <span className="text-[var(--text-main)] font-bold">{totalCount}</span> کالا
        </div>

        {onViewModeChange && (
          <div className="flex items-center gap-1 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-active)] shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="نمایش شبکه‌ای"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-active)] shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="نمایش سطری"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
