import React, { useState } from 'react';
import { 
  Laptop, 
  Sparkles, 
  Coffee, 
  Heart,
  ChevronLeft, 
  ArrowRight
} from 'lucide-react';
import { INITIAL_CATEGORIES, CategoryDetail } from '../../utils/cmsStore';

interface CategoryMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (categoryName: string, subCategoryName?: string) => void;
  categories?: CategoryDetail[];
}

export const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  categories = INITIAL_CATEGORIES,
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(categories[0]?.id || 'cat_digital');

  if (!isOpen) return null;

  const currentCategory = categories.find(c => c.id === activeCategoryId) || categories[0];

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'digital':
        return Laptop;
      case 'smart-home':
        return Sparkles;
      case 'travel-camping':
        return Coffee;
      case 'beauty-health':
        return Heart;
      default:
        return Laptop;
    }
  };

  return (
    <div 
      className="hidden lg:block absolute top-full right-0 left-0 z-40 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-color)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 transition-colors"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto flex h-80">
        {/* Right column: Main Category list */}
        <div className="w-64 border-l border-[var(--border-color)] p-3 space-y-1 overflow-y-auto bg-[var(--bg-main)]">
          <div className="text-[11px] font-bold text-[var(--text-muted)] px-3 py-1.5">
            <span>دسته‌بندی‌های گُردیه</span>
          </div>
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.slug);
            const isActive = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onMouseEnter={() => setActiveCategoryId(cat.id)}
                onClick={() => {
                  onSelectCategory(cat.name);
                  onClose();
                }}
                className={`w-full text-right px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-active)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{cat.name}</span>
                </div>
                <ChevronLeft className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]/60'}`} />
              </button>
            );
          })}

          <div className="pt-3 mt-2 border-t border-[var(--border-color)] px-2">
            <button
              onClick={() => {
                onSelectCategory('ALL');
                onClose();
              }}
              className="w-full text-right px-3 py-2 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[11px] text-[var(--text-main)] font-semibold flex items-center justify-between border border-[var(--border-color)]"
            >
              <span>مشاهده‌ی همه‌ی محصول‌ها</span>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            </button>
          </div>
        </div>

        {/* Left column: Subcategories */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col justify-between bg-[var(--bg-card)]/40">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-main)]">{currentCategory.name}</span>
                <span className="text-xs text-[var(--text-secondary)]">| {currentCategory.description}</span>
              </div>
              <button
                onClick={() => {
                  onSelectCategory(currentCategory.name);
                  onClose();
                }}
                className="text-xs text-[var(--accent-primary)] hover:underline font-bold flex items-center gap-1"
              >
                <span>مشاهده تمام کالاهای این گروه</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Subcategories */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {currentCategory.subcategories.map((sub, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    onSelectCategory(currentCategory.name, sub);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] hover:shadow-theme-glow cursor-pointer transition-all group"
                >
                  <h4 className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {sub}
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">مشاهده‌ی محصول‌ها</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
