import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  PackageCheck,
  BookOpen,
  User,
  HelpCircle,
  Scale,
  Percent,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Currency } from '../../types';
import { formatCurrency } from '../../utils';
import { GORDIYEH_BRAND } from '../../gordiyehKit';
import {
  getInitialTheme,
  applyTheme,
  GordiyehTheme,
  GORDIYEH_THEMES,
  isDarkTheme,
  getThemeMeta,
} from '../../utils/themeManager';

export type StorefrontPage =
  | 'HOME'
  | 'CATALOG'
  | 'USER_DASHBOARD'
  | 'HELP_CENTER'
  | 'BLOG';

interface StorefrontHeaderProps {
  activeStorePage: StorefrontPage;
  onNavigateStorePage: (page: StorefrontPage) => void;
  cartCount: number;
  cartTotal: number;
  currency: Currency;
  onOpenCart: () => void;
  compareCount: number;
  onOpenCompare: () => void;
  searchTerm: string;
  onSearchChange: (query: string) => void;
  isMegaMenuOpen: boolean;
  onToggleMegaMenu: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
  storeName?: string;
  isHomeView?: boolean;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
  activeStorePage,
  onNavigateStorePage,
  cartCount,
  cartTotal,
  currency,
  onOpenCart,
  compareCount,
  onOpenCompare,
  searchTerm,
  onSearchChange,
  isMegaMenuOpen,
  onToggleMegaMenu,
  onSelectCategory,
  selectedCategory,
  storeName = 'فروشگاه اینترنتی گُردیه',
  isHomeView = false,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<GordiyehTheme>(getInitialTheme());
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSelectTheme = (themeId: GordiyehTheme) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
  };

  const handleToggleForestTheme = () => {
    const next: GordiyehTheme = currentTheme === 'forest-dark' ? 'forest-light' : 'forest-dark';
    handleSelectTheme(next);
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const attr = document.documentElement.getAttribute('data-theme') as GordiyehTheme | null;
      if (attr) setCurrentTheme(attr);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const trendingSearches = [
    'پروژکتور هوشمند',
    'G-Lamp',
    'مینی شیکر شارژی',
    'ماساژور تفنگی',
    'دسته بازی بی‌سیم',
    'جارو رباتیک',
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  }, [isSearchOpen]);

  const navCategories = [
    { label: 'کالای دیجیتال', category: 'کالای دیجیتال' },
    { label: 'لوازم خانگی هوشمند', category: 'لوازم خانگی هوشمند' },
    { label: 'سفر و کمپینگ', category: 'سفر و کمپینگ' },
    { label: 'زیبایی و سلامت', category: 'زیبایی و سلامت' },
  ];

  const handleSelectTrending = (text: string) => {
    onSearchChange(text);
    setIsSearchOpen(false);
  };

  return (
    <>
      <header className="w-full gordiyeh-sticky-header border-b border-[var(--border-color)] sticky top-0 z-30 font-sans text-right select-none transition-colors duration-200">
      {/* Single-Row Clean Header (Brand Lockup — Nav Links — Icon Actions) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[70px] flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Lockup & Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--border-active)] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="منوی دسته‌بندی و صفحات"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateStorePage('HOME')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0 text-right"
          >
            <img
              src={GORDIYEH_BRAND.logoAsset}
              alt={GORDIYEH_BRAND.nameFa}
              width={48}
              height={48}
              fetchPriority="high"
              decoding="async"
              className="h-11 sm:h-12 w-auto object-contain gordiyeh-adaptive-logo transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span className="text-lg sm:text-xl font-bold text-[var(--accent-text)] tracking-tight whitespace-nowrap">
                {GORDIYEH_BRAND.nameFa}
              </span>
              <span className="text-[10px] font-mono tracking-[0.22em] text-[var(--text-muted)] mt-0.5 whitespace-nowrap">
                GORDIYEH
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13px] xl:text-sm font-medium leading-[1.8] text-[var(--text-main)]" aria-label="ناوبری اصلی">
          {!isHomeView && (
            <button
              type="button"
              onClick={() => onNavigateStorePage('HOME')}
              className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                activeStorePage === 'HOME'
                  ? 'border-[var(--accent-text)] text-[var(--accent-text)] font-bold'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              خانه
            </button>
          )}

          {navCategories.map((item) => {
            const isActive = activeStorePage === 'CATALOG' && selectedCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => onSelectCategory(item.category)}
                className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'border-[var(--accent-text)] text-[var(--accent-text)] font-bold'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => onNavigateStorePage('BLOG')}
            className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeStorePage === 'BLOG'
                ? 'border-[var(--accent-text)] text-[var(--accent-text)] font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]'
            }`}
          >
            مجله
          </button>
        </nav>

        {/* Zone 3: Minimal Utility & Cart Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" ref={searchPanelRef}>
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
              isSearchOpen || searchTerm
                ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
            title="جستجو در محصولات"
            aria-label="جستجو در محصولات"
          >
            <Search className="w-[19px] h-[19px]" strokeWidth={1.75} />
          </button>

          {/* Compare Trigger (when items selected) */}
          {compareCount > 0 && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="relative p-2 rounded-full text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              title="مقایسه محصول‌ها"
              aria-label="مقایسه محصول‌ها"
            >
              <Scale className="w-[19px] h-[19px]" strokeWidth={1.75} />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] text-[10px] font-bold flex items-center justify-center tabular-nums">
                {compareCount}
              </span>
            </button>
          )}

          {/* Direct 1-Click Forest Day / Night Switcher (Icon-Only Sun & Moon) */}
          <button
            type="button"
            onClick={handleToggleForestTheme}
            data-theme-toggle="forest"
            className="group p-1 rounded-full bg-[var(--bg-card)]/85 hover:bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-all inline-flex items-center gap-0.5 cursor-pointer shrink-0"
            title={`تغییر حالت نمایش (فعلی: ${getThemeMeta(currentTheme).label})`}
            aria-label="تغییر حالت روشن یا تیره فراست"
          >
            <span
              aria-hidden="true"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                !isDarkTheme(currentTheme)
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-xs'
                  : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            </span>
            <span
              aria-hidden="true"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                isDarkTheme(currentTheme)
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-xs'
                  : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            </span>
          </button>

          {/* User Account Dropdown */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="p-2 rounded-full text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              title="حساب کاربری"
              aria-label="حساب کاربری"
            >
              <User className="w-[19px] h-[19px]" strokeWidth={1.75} />
            </button>

            {showUserDropdown && (
              <div className="absolute left-0 mt-2 w-52 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-2 shadow-xl z-50 space-y-1">
                <div className="px-3 py-2 border-b border-[var(--border-color)]">
                  <div className="text-xs font-bold text-[var(--text-main)]">حساب خریدار</div>
                  <div className="text-[11px] text-[var(--text-muted)]">پیگیری سفارش و راهنما</div>
                </div>
                <button
                  type="button"
                  onClick={() => { onNavigateStorePage('USER_DASHBOARD'); setShowUserDropdown(false); }}
                  className="w-full px-3 py-2 rounded-xl text-right text-xs text-[var(--text-main)] hover:bg-[var(--bg-card)] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>سفارش‌ها و تاریخچه چت‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onNavigateStorePage('HELP_CENTER'); setShowUserDropdown(false); }}
                  className="w-full px-3 py-2 rounded-xl text-right text-xs text-[var(--text-main)] hover:bg-[var(--bg-card)] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>راهنما و پشتیبانی</span>
                </button>
              </div>
            )}
          </div>

          {/* Shopping Bag */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative p-2 sm:px-3 sm:py-2 rounded-full text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors min-h-[40px] min-w-[40px] flex items-center gap-2 cursor-pointer"
            title={cartCount > 0 ? `سبد خرید (${formatCurrency(cartTotal, currency)})` : 'سبد خرید'}
            aria-label="سبد خرید"
          >
            <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {/* Expandable Search Omnibox Popover */}
          {isSearchOpen && (
            <div className="absolute left-4 right-4 sm:left-6 sm:right-auto sm:w-[460px] top-[calc(100%+8px)] bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 shadow-2xl z-50 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="جستجوی محصول: پروژکتور، مینی شیکر، G-Lamp، ماساژور..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pr-10 pl-9 py-2.5 text-xs sm:text-[13px] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute left-3 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    aria-label="پاک کردن جستجو"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[var(--text-muted)]">جستجوهای پرکاربرد</div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingSearches.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectTrending(item)}
                      className="px-3 py-1 rounded-full bg-[var(--bg-card)] hover:bg-[var(--accent-soft)] border border-[var(--border-color)] text-xs text-[var(--text-main)] transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Mobile Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          <div className="relative mr-auto w-4/5 max-w-xs h-full bg-[var(--bg-surface)] border-l border-[var(--border-color)] shadow-2xl flex flex-col z-10 overflow-y-auto p-4 space-y-4 text-[var(--text-main)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <img
                  src={GORDIYEH_BRAND.logoAsset}
                  alt={GORDIYEH_BRAND.nameFa}
                  className="h-8 w-auto object-contain gordiyeh-adaptive-logo"
                />
                <span className="text-sm font-bold text-[var(--text-main)]">{storeName}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => { onNavigateStorePage('HOME'); setIsMobileDrawerOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-right flex items-center gap-2.5 font-semibold transition-colors ${
                  activeStorePage === 'HOME' ? 'bg-[var(--accent-primary)] text-[#F7F3EA]' : 'text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>صفحه‌ی اصلی</span>
              </button>

              {navCategories.map((item) => (
                <button
                  key={item.category}
                  type="button"
                  onClick={() => { onSelectCategory(item.category); setIsMobileDrawerOpen(false); }}
                  className="w-full p-2.5 rounded-xl text-right font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  {item.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => { onNavigateStorePage('CATALOG'); setIsMobileDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl text-right flex items-center gap-2.5 font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors"
              >
                <Percent className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>همه‌ی محصولات و تخفیف‌ها</span>
              </button>

              <button
                type="button"
                onClick={() => { onNavigateStorePage('BLOG'); setIsMobileDrawerOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-right flex items-center gap-2.5 font-semibold transition-colors ${
                  activeStorePage === 'BLOG' ? 'bg-[var(--accent-primary)] text-[#F7F3EA]' : 'text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>مجله و راهنمای انتخاب</span>
              </button>

              <button
                type="button"
                onClick={() => { onNavigateStorePage('HELP_CENTER'); setIsMobileDrawerOpen(false); }}
                className={`w-full p-2.5 rounded-xl text-right flex items-center gap-2.5 font-semibold transition-colors ${
                  activeStorePage === 'HELP_CENTER' ? 'bg-[var(--accent-primary)] text-[#F7F3EA]' : 'text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>پشتیبانی و تست و تعویض</span>
              </button>

              <button
                type="button"
                onClick={() => { onNavigateStorePage('USER_DASHBOARD'); setIsMobileDrawerOpen(false); }}
                className="w-full p-2.5 rounded-xl text-right flex items-center justify-between font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors border-t border-[var(--border-color)] pt-3 mt-2"
              >
                <span className="flex items-center gap-2"><User className="w-4 h-4" /> سفارش‌های من</span>
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>

              {/* Mobile Forest Light / Dark Switcher */}
              <div className="pt-3 mt-2 border-t border-[var(--border-color)] space-y-2">
                <div className="text-[11px] font-bold text-[var(--text-muted)] px-1 flex items-center gap-1.5">
                  {isDarkTheme(currentTheme) ? (
                    <Moon className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  )}
                  <span>حالت نمایش فراست</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {GORDIYEH_THEMES.map((themeOption) => {
                    const active = currentTheme === themeOption.id;
                    return (
                      <button
                        key={themeOption.id}
                        type="button"
                        data-theme-option={themeOption.id}
                        onClick={() => handleSelectTheme(themeOption.id)}
                        className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--accent-text)] font-bold'
                            : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)]'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-[var(--border-active)] shrink-0"
                          style={{ backgroundColor: themeOption.accentSwatch }}
                        />
                        <span className="truncate">{themeOption.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-color)] py-1.5 px-3 flex items-center justify-around shadow-xl text-[var(--text-main)]">
        <button
          type="button"
          onClick={() => { onNavigateStorePage('HOME'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-semibold ${
            activeStorePage === 'HOME' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>خانه</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleMegaMenu()}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-semibold ${
            isMegaMenuOpen ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>دسته‌ها</span>
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center gap-0.5 p-1 text-[10px] font-semibold text-[var(--text-muted)] relative"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>سبد خرید</span>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 right-2 w-4 h-4 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] text-[9px] font-bold flex items-center justify-center tabular-nums">
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { onNavigateStorePage('USER_DASHBOARD'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 p-1 text-[10px] font-semibold ${
            activeStorePage === 'USER_DASHBOARD' ? 'text-[var(--accent-primary)] font-bold' : 'text-[var(--text-muted)]'
          }`}
        >
          <User className="w-5 h-5" />
          <span>حساب من</span>
        </button>
      </div>
    </>
  );
};
