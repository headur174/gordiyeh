import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CanonicalProduct, Currency, NetworkResilienceMode } from '../types';
import { StorefrontHeader, StorefrontPage } from './storefront/StorefrontHeader';
import { CategoryMegaMenu } from './storefront/CategoryMegaMenu';
import { ProductFilterSidebar, FilterState } from './storefront/ProductFilterSidebar';
import { ProductSortBar, SortOption } from './storefront/ProductSortBar';
import { ProductCard } from './storefront/ProductCard';
import { LiveSupportWidget } from './storefront/LiveSupportWidget';
import { PieceErrorBoundary } from '../core/shell/PieceErrorBoundary';
import { HOMEPAGE_MEDIA } from '../assets/homepageMedia';
import { GordiyehLoader } from './GordiyehLoader';
import type { CartItem } from './storefront/CartAndCheckoutModal';

const ProductDetailPage = React.lazy(() => import('./storefront/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const ProductCompareModal = React.lazy(() => import('./storefront/ProductCompareModal').then(m => ({ default: m.ProductCompareModal })));
const CartAndCheckoutModal = React.lazy(() => import('./storefront/CartAndCheckoutModal').then(m => ({ default: m.CartAndCheckoutModal })));
const BlogView = React.lazy(() => import('./storefront/BlogView').then(m => ({ default: m.BlogView })));
const StaticPagesModal = React.lazy(() => import('./storefront/StaticPagesModal').then(m => ({ default: m.StaticPagesModal })));
const CustomerMemoryHubTile = React.lazy(() => import('../pieces/customer-memory/ui/CustomerMemoryHubTile').then(m => ({ default: m.CustomerMemoryHubTile })));
const UserDashboardPage = React.lazy(() => import('./storefront/pages/UserDashboardPage').then(m => ({ default: m.UserDashboardPage })));
const HelpCenterPage = React.lazy(() => import('./storefront/pages/HelpCenterPage').then(m => ({ default: m.HelpCenterPage })));

import {
  SiteConfig,
  BlogPost,
  StaticPage,
  CategoryDetail,
  INITIAL_SITE_CONFIG,
  INITIAL_BLOG_POSTS,
  INITIAL_STATIC_PAGES,
  INITIAL_CATEGORIES,
  SITE_CONFIG_STORAGE_KEY,
  SITE_CONFIG_UPDATED_EVENT,
  loadSiteConfig,
} from '../utils/cmsStore';
import { GORDIYEH_BRAND, toCanonicalProductUrl } from '../gordiyehKit';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Truck,
  ShieldCheck,
  Headphones,
  BookOpen,
  Filter,
  Laptop,
  Home,
  Tent,
  Leaf,
  Dumbbell,
  Briefcase,
  Car,
  BedDouble,
  Gamepad2,
  Grid,
  HelpCircle,
  Mail,
  Bell,
  Zap,
  Send,
  Instagram,
  Youtube,
  Phone,
  CheckCircle2,
  RotateCcw,
  MessageSquareText,
  Award,
} from 'lucide-react';
import { formatCurrency } from '../utils';

interface StorefrontViewProps {
  products: CanonicalProduct[];
  currency: Currency;
  onOrderCreated: (orderData: any) => void;
  onSwitchToSupervisor?: () => void;
  onSwitchSupplierOffer?: (productId: string, offerId: string) => void;
  networkMode?: NetworkResilienceMode;
  onNetworkModeChange?: (mode: NetworkResilienceMode) => void;
  pendingApprovalsCount?: number;
  pendingManualTasksCount?: number;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  currency,
  onOrderCreated,
}) => {
  // Navigation: Active Page in Storefront
  const [activeStorePage, setActiveStorePage] = useState<StorefrontPage>('HOME');

  // Search & Navigation
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState<boolean>(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Compare state
  const [compareList, setCompareList] = useState<CanonicalProduct[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // PDP (Product Detail Page)
  const [selectedProduct, setSelectedProduct] = useState<CanonicalProduct | null>(null);

  // Hero carousel active slide (Desktop auto-rotate every 6s paused on hover; disabled < 768px)
  const [heroSlide, setHeroSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // Footer newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Horizontal product slider tracks
  const sliderRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollSlider = (sliderKey: string, direction: 'next' | 'prev') => {
    const track = sliderRefs.current[sliderKey];
    if (!track) return;
    track.scrollBy({
      left: direction === 'next' ? -300 : 300,
      behavior: 'smooth',
    });
  };

  // Interactive FAQ Accordion state (5 focused questions, no categories)
  const [openHomeFaqId, setOpenHomeFaqId] = useState<string | null>('faq-shipping');

  const homeFaqs = [
    {
      id: 'faq-shipping',
      question: 'سفارشم کی می‌رسه و هزینه ارسال چقدره؟',
      answer:
        'سفارش‌های تهران اگه تا ساعت ۱۵ ثبت بشن، همون روز یا حداکثر روز کاری بعد با پیک هماهنگ‌شده تحویل می‌شن. بقیه‌ی شهرها ظرف ۲۴ ساعت کاری تحویل پست پیشتاز می‌شن و کد رهگیری پیامک می‌شه (معمولاً ۲ تا ۴ روز کاری بعد می‌رسه).',
      actionLabel: 'مشاهده شرایط ارسال',
      onAction: () => openStaticPage('terms'),
    },
    {
      id: 'faq-warranty',
      question: 'شرایط تست و تعویض کالا چطوره؟',
      answer:
        'مهلت و موارد تحت پوشش تست برای هر محصول فرق می‌کنه و قبل از خرید دقیقاً توی صفحه‌ی همون محصول نوشته شده. در صورت وجود ایراد فنی در مهلت تست، کالا بی‌قیدوشرط با نسخه‌ی آکبند تعویض می‌شه.',
      actionLabel: 'جزئیات تست و تعویض',
      onAction: () => openStaticPage('faq'),
    },
    {
      id: 'faq-honesty',
      question: 'چطور بفهمم یه گجت دقیقاً به کار من می‌آد یا نه؟',
      answer:
        'توی صفحه‌ی هر محصول بخش «برای چه کسی نیست» رو نوشتیم تا محدودیت‌های واقعی (مثل نور محیط پروژکتور یا حجم مینی شیکر) رو پیش از خرید بدونید و بر اساس کاربرد واقعی تصمیم بگیرید.',
      actionLabel: 'خواندن راهنمای انتخاب',
      onAction: () => navigatePage('BLOG'),
    },
    {
      id: 'faq-projector',
      question: 'پروژکتور پرتابل به کامپیوتر یا کابل تصویر نیاز داره؟',
      answer:
        'نه؛ اندروید، وای‌فای و بلوتوث داخلی داره. می‌تونید فیلیمو یا یوتیوب رو مستقیم روی دستگاه اجرا کنید یا تصویر گوشی (آیفون و اندروید) رو بی‌سیم روی دیوار بندازید.',
      actionLabel: 'دیدن کالای دیجیتال',
      onAction: () => handleSelectCategory('کالای دیجیتال'),
    },
    {
      id: 'faq-payment',
      question: 'پرداخت از چه طریقی انجام می‌شه و امنیتش چطوره؟',
      answer:
        'تمامی پرداخت‌ها از درگاه امن شاپرک یا کارت‌به‌کارت تاییدشده انجام می‌شن و بلافاصله بعد از ثبت سفارش، فاکتور و کد پیگیری اختصاصی براتون صادر می‌شه.',
      actionLabel: 'حفظ حریم خصوصی و امنیت',
      onAction: () => openStaticPage('privacy'),
    },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    window.setTimeout(() => setNewsletterSubscribed(false), 5000);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || activeStorePage !== 'HOME' || selectedProduct) return;
    const desktopMq = window.matchMedia('(min-width: 768px)');
    if (!desktopMq.matches || isHeroPaused) return;
    const timer = window.setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [activeStorePage, selectedProduct, isHeroPaused]);

  // Site Config State (Live-synced with Admin / SiteVisualEditor)
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadSiteConfig());

  useEffect(() => {
    const syncSiteConfig = () => setSiteConfig(loadSiteConfig());
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key === SITE_CONFIG_STORAGE_KEY) {
        syncSiteConfig();
      }
    };
    window.addEventListener(SITE_CONFIG_UPDATED_EVENT, syncSiteConfig);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SITE_CONFIG_UPDATED_EVENT, syncSiteConfig);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const [blogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [staticPages] = useState<StaticPage[]>(INITIAL_STATIC_PAGES);
  const [categoriesList] = useState<CategoryDetail[]>(INITIAL_CATEGORIES);

  // Modals state
  const [isCustomerMemoryOpen, setIsCustomerMemoryOpen] = useState(false);
  const [activeStaticPageSlug, setActiveStaticPageSlug] = useState<string | null>(null);

  // Sort State
  const [sortOption, setSortOption] = useState<SortOption>('relevant');

  // Max catalog price calculation
  const maxCatalogPrice = useMemo(() => {
    return Math.max(...products.map(p => p.retailPrice), 50000000);
  }, [products]);

  // Filter State with LocalStorage persistence
  const STOREFRONT_FILTER_KEY = 'commerce_storefront_filters';
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = localStorage.getItem(STOREFRONT_FILTER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          searchWithin: parsed.searchWithin || '',
          selectedCategory: parsed.selectedCategory || 'ALL',
          selectedSubCategory: parsed.selectedSubCategory,
          selectedBrands: Array.isArray(parsed.selectedBrands) ? parsed.selectedBrands : [],
          inStockOnly: !!parsed.inStockOnly,
          expressDeliveryOnly: !!parsed.expressDeliveryOnly,
          originalOnly: !!parsed.originalOnly,
          discountOnly: !!parsed.discountOnly,
          minPrice: typeof parsed.minPrice === 'number' ? parsed.minPrice : 0,
          maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : maxCatalogPrice,
        };
      }
    } catch {
      // ignore
    }
    return {
      searchWithin: '',
      selectedCategory: 'ALL',
      selectedSubCategory: undefined,
      selectedBrands: [],
      inStockOnly: false,
      expressDeliveryOnly: false,
      originalOnly: false,
      discountOnly: false,
      minPrice: 0,
      maxPrice: maxCatalogPrice,
    };
  });

  // Mobile Filter Drawer State
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'orders' | 'chats' | 'profile' | 'privacy'>('orders');

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleOpenProduct = (p: CanonicalProduct, replaceUrl: boolean = false) => {
    setSelectedProduct(p);
    const targetPath = toCanonicalProductUrl(p.id);
    if (window.location.pathname !== targetPath) {
      if (replaceUrl) {
        window.history.replaceState({ productId: p.id }, '', targetPath);
      } else {
        window.history.pushState({ productId: p.id }, '', targetPath);
      }
    }
    scrollToTop();
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    if (window.location.pathname.startsWith('/product/')) {
      window.history.pushState(null, '', '/');
    }
    scrollToTop();
  };

  const openStaticPage = (slug: string) => {
    setSelectedProduct(null);
    setActiveStaticPageSlug(slug);
    const target = `/page/${slug}`;
    if (window.location.pathname !== target) {
      window.history.pushState(null, '', target);
    }
    scrollToTop();
  };

  const closeStaticPage = () => {
    setActiveStaticPageSlug(null);
    if (window.location.pathname.startsWith('/page/')) {
      window.history.pushState(null, '', '/');
    }
  };

  const navigatePage = (page: StorefrontPage) => {
    setSelectedProduct(null);
    setActiveStaticPageSlug(null);
    setActiveStorePage(page);
    let path = '/';
    if (page === 'BLOG') path = '/blog';
    else if (page === 'HELP_CENTER') path = '/help';
    else if (page === 'USER_DASHBOARD') path = '/account';
    else if (page === 'CATALOG') path = '/catalog';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    scrollToTop();
  };

  // URL Deep-Linking & History Synchronizer
  useEffect(() => {
    const syncRouteFromLocation = () => {
      try {
        const path = decodeURIComponent(window.location.pathname);

        // Static page route: /page/:slug
        const pageMatch = path.match(/^\/page\/([a-zA-Z0-9_-]+)/);
        if (pageMatch) {
          const slug = pageMatch[1].toLowerCase();
          setActiveStaticPageSlug(slug);
          setSelectedProduct(null);
          return;
        } else {
          setActiveStaticPageSlug(null);
        }

        // Product detail route: /product/:slug or legacy /product/:id...
        const prodMatch = path.match(/^\/product\/([a-zA-Z0-9_-]+)/);
        if (prodMatch) {
          const param = prodMatch[1].toLowerCase();
          const prod = products.find(p => {
            const canonPath = toCanonicalProductUrl(p.id).toLowerCase();
            const canonSlug = canonPath.replace('/product/', '');
            return p.slug === param || canonSlug === param || p.id.toLowerCase() === param || param.startsWith(p.id.toLowerCase());
          });
          if (prod) {
            setSelectedProduct(prod);
            return;
          }
        } else {
          // Direct legacy product routes like /pro-beam, /g-lamp, /auto-shaker, /massage-gun
          const directProd = products.find(p => {
            const canonPath = toCanonicalProductUrl(p.id).toLowerCase();
            return path === canonPath || (p.slug && path === `/${p.slug}`);
          });
          if (directProd) {
            setSelectedProduct(directProd);
            return;
          }
          setSelectedProduct(null);
        }

        // Category route: /category/:slug
        const catMatch = path.match(/^\/category\/([a-zA-Z0-9_-]+)/);
        if (catMatch) {
          const slug = catMatch[1];
          const categoryMap: Record<string, string> = {
            'digital': 'کالای دیجیتال',
            'smart-home': 'لوازم خانگی هوشمند',
            'travel-camping': 'سفر و کمپینگ',
            'beauty-health': 'زیبایی و سلامت'
          };
          const catName = categoryMap[slug];
          if (catName) {
            setFilters(prev => ({ ...prev, selectedCategory: catName, selectedSubCategory: undefined }));
            setActiveStorePage('CATALOG');
            return;
          }
        }

        if (path.startsWith('/blog')) {
          setActiveStorePage('BLOG');
        } else if (path.startsWith('/help') || path.startsWith('/faq')) {
          setActiveStorePage('HELP_CENTER');
        } else if (path.startsWith('/account') || path.startsWith('/dashboard')) {
          setActiveStorePage('USER_DASHBOARD');
        } else if (path === '/catalog') {
          setActiveStorePage('CATALOG');
        } else if (path === '/' || path === '') {
          setActiveStorePage('HOME');
        }
      } catch (err) {
        console.error('Failed to sync route from location:', err);
      }
    };

    syncRouteFromLocation();
    window.addEventListener('popstate', syncRouteFromLocation);
    return () => window.removeEventListener('popstate', syncRouteFromLocation);
  }, [products]);

  // Active filters count for mobile badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.selectedCategory !== 'ALL') count++;
    if (filters.selectedSubCategory) count++;
    if (filters.selectedBrands.length > 0) count += filters.selectedBrands.length;
    if (filters.inStockOnly) count++;
    if (filters.expressDeliveryOnly) count++;
    if (filters.originalOnly) count++;
    if (filters.discountOnly) count++;
    if (filters.searchWithin) count++;
    if (filters.minPrice > 0 || (filters.maxPrice < maxCatalogPrice && filters.maxPrice > 0)) count++;
    return count;
  }, [filters, maxCatalogPrice]);

  // Save storefront filters to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STOREFRONT_FILTER_KEY, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  // Pagination for category listing (Layout Spec T2: 24 products per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortOption]);

  // Cart operations
  const handleAddToCart = (product: CanonicalProduct, quantity: number = 1, selectedColor?: string) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item => item.product.id === product.id && item.selectedColor === selectedColor
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            product,
            quantity,
            selectedColor: selectedColor || (product.colors && product.colors[0]?.name),
            unitPrice: product.retailPrice,
          }
        ];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number, selectedColor?: string) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.product.id === productId && item.selectedColor === selectedColor) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: string, selectedColor?: string) => {
    setCart(prevCart => prevCart.filter(item => !(item.product.id === productId && item.selectedColor === selectedColor)));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Compare handlers
  const handleToggleCompare = (product: CanonicalProduct) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, product];
      }
    });
  };

  const handleRemoveFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
  };

  // Categories list extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtering & Sorting Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(query);
        const matchesBrand = product.brand.toLowerCase().includes(query) || (product.brandFa && product.brandFa.includes(query));
        const matchesCat = product.category.toLowerCase().includes(query) || (product.subCategory && product.subCategory.toLowerCase().includes(query));
        const matchesSKU = product.sku.toLowerCase().includes(query);
        if (!matchesTitle && !matchesBrand && !matchesCat && !matchesSKU) {
          return false;
        }
      }

      // 2. Search Within results
      if (filters.searchWithin.trim()) {
        const q = filters.searchWithin.toLowerCase();
        if (!product.title.toLowerCase().includes(q)) return false;
      }

      // 3. Category Filter
      if (filters.selectedCategory !== 'ALL' && product.category !== filters.selectedCategory) {
        return false;
      }

      // 4. SubCategory Filter
      if (filters.selectedSubCategory && product.subCategory !== filters.selectedSubCategory) {
        return false;
      }

      // 5. Brand Filter
      if (filters.selectedBrands.length > 0) {
        const brandMatch = 
          filters.selectedBrands.includes(product.brand) || 
          (product.brandFa && filters.selectedBrands.includes(product.brandFa));
        if (!brandMatch) {
          return false;
        }
      }

      // 6. In Stock Only
      const activeOffer = product.supplierOffers.find(o => o.id === product.selectedOfferId) || product.supplierOffers[0];
      if (filters.inStockOnly && (!activeOffer || activeOffer.stock <= 0)) {
        return false;
      }

      // 7. Express Delivery
      if (filters.expressDeliveryOnly && (activeOffer?.dispatchTimeHours || 24) > 6) {
        return false;
      }

      // 8. Discounted Only
      if (filters.discountOnly) {
        const hasDiscount = (product.discountPercent && product.discountPercent > 0) || 
                            (product.originalPrice && product.originalPrice > product.retailPrice);
        if (!hasDiscount) return false;
      }

      // 9. Price Range
      if (product.retailPrice < filters.minPrice) return false;
      if (product.retailPrice > filters.maxPrice) return false;

      return true;
    }).sort((a, b) => {
      if (sortOption === 'price_asc') return a.retailPrice - b.retailPrice;
      if (sortOption === 'price_desc') return b.retailPrice - a.retailPrice;
      if (sortOption === 'bestseller') return (b.winnerScore || 0) - (a.winnerScore || 0);
      if (sortOption === 'views') return (b.ratingCount || 0) - (a.ratingCount || 0);
      if (sortOption === 'discount') {
        const discA = a.discountPercent || 0;
        const discB = b.discountPercent || 0;
        return discB - discA;
      }
      if (sortOption === 'newest') return (b.winnerScore || 0) - (a.winnerScore || 0);
      return 0; // 'relevant'
    });
  }, [products, searchTerm, filters, sortOption]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  // Homepage Sliders Config (Visibility + Auto Deduplicate vs Manual Mode)
  const sliderVisibility = siteConfig?.homepageSliders ?? {
    showDiscounts: true,
    showNewest: true,
    showBestsellers: false,
    deduplicateMode: 'auto' as const,
    discountProductIds: [],
    newestProductIds: [],
    bestsellerProductIds: [],
  };

  const { discountedProducts, newestProducts, bestSellerProducts } = useMemo(() => {
    const isManual = sliderVisibility.deduplicateMode === 'manual';

    if (isManual) {
      const pickByIds = (ids: string[] | undefined, fallback: CanonicalProduct[]) => {
        if (Array.isArray(ids) && ids.length > 0) {
          const picked = ids
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is CanonicalProduct => Boolean(p));
          if (picked.length > 0) return picked;
        }
        return fallback;
      };

      const naturalDiscounted = products
        .filter((p) => (p.discountPercent && p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.retailPrice))
        .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));

      const naturalNewest = [...products].reverse().slice(0, 8);
      const naturalBestsellers = [...products]
        .sort((a, b) => (b.totalSold30d || 0) - (a.totalSold30d || 0))
        .slice(0, 8);

      return {
        discountedProducts: pickByIds(sliderVisibility.discountProductIds, naturalDiscounted),
        newestProducts: pickByIds(sliderVisibility.newestProductIds, naturalNewest),
        bestSellerProducts: pickByIds(sliderVisibility.bestsellerProductIds, naturalBestsellers),
      };
    }

    const usedIds = new Set<string>();

    const discounted = products
      .filter((p) => (p.discountPercent && p.discountPercent > 0) || (p.originalPrice && p.originalPrice > p.retailPrice))
      .sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));

    if (sliderVisibility.showDiscounts) {
      discounted.forEach((p) => usedIds.add(p.id));
    }

    const newestPool = products.filter((p) => !usedIds.has(p.id));
    const newest = (newestPool.length >= 3 ? newestPool : [...products].reverse()).slice(0, 8);
    if (sliderVisibility.showNewest) {
      newest.forEach((p) => usedIds.add(p.id));
    }

    const bestSellerPool = products.filter((p) => !usedIds.has(p.id));
    const bestsellers = (bestSellerPool.length >= 3 ? [...bestSellerPool] : [...products])
      .sort((a, b) => (b.totalSold30d || 0) - (a.totalSold30d || 0))
      .slice(0, 8);

    return {
      discountedProducts: discounted,
      newestProducts: newest,
      bestSellerProducts: bestsellers,
    };
  }, [
    products,
    sliderVisibility.showDiscounts,
    sliderVisibility.showNewest,
    sliderVisibility.deduplicateMode,
    sliderVisibility.discountProductIds,
    sliderVisibility.newestProductIds,
    sliderVisibility.bestsellerProductIds,
  ]);

  const handleSelectCategory = (categoryName: string, subCategoryName?: string) => {
    setSelectedProduct(null);
    setFilters(prev => ({
      ...prev,
      selectedCategory: categoryName,
      selectedSubCategory: subCategoryName
    }));
    setIsMegaMenuOpen(false);
    setActiveStorePage('CATALOG');
    const catSlug = categoryTiles.find(c => c.name === categoryName)?.slug;
    const path = catSlug ? `/category/${catSlug}` : '/catalog';
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    scrollToTop();
  };

  const handleResetFilters = () => {
    setFilters({
      searchWithin: '',
      selectedCategory: 'ALL',
      selectedSubCategory: undefined,
      selectedBrands: [],
      inStockOnly: false,
      expressDeliveryOnly: false,
      originalOnly: false,
      discountOnly: false,
      minPrice: 0,
      maxPrice: maxCatalogPrice,
    });
    setSearchTerm('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hero slides data
  const heroSlides = [
    {
      badge: 'گجت‌های کاربردی برای خونه، سفر و باشگاه',
      title: 'گجت‌هایی که یه کار روزمره رو راحت‌تر می‌کنن',
      subtitle:
        'برای هر محصول می‌گیم چه مشکلی رو حل می‌کنه، چه کاری از دستش برنمی‌آد و شرایط تست و تعویضش چیه.',
      cta: 'دیدن محصولات',
      cat: 'ALL',
      targetProductId: undefined,
      image: HOMEPAGE_MEDIA.heroProjector,
      alt: 'پروژکتور هوشمند قابل حمل در اتاق خواب',
    },
    {
      badge: 'برای میز کار و اتاق خواب',
      title: 'چند کاربرد توی یک دستگاه روی میز کار',
      subtitle:
        'G-Lamp اسپیکر بلوتوث، پد شارژ بی‌سیم ۱۵ وات، رقص نور ۲۵۶ رنگ و ساعت دیجیتال رو کنار هم جمع کرده.',
      cta: 'دیدن G-Lamp',
      cat: 'لوازم خانگی هوشمند',
      targetProductId: 'prod_ported_g_lamp',
      image: HOMEPAGE_MEDIA.spotlightGlamp,
      alt: 'چراغ و اسپیکر شارژر بی‌سیم G-Lamp',
    },
    {
      badge: 'برای باشگاه، محل کار و سفر',
      title: 'شیکر و ماساژور همراه برای تمرین و سفر',
      subtitle:
        'مینی شیکر ۶ تیغه با باتری لیتیومی و شارژ Type-C اسموتی رو همون‌جا آماده می‌کنه؛ کنار ماساژور ضربه‌ای برای رفع خستگی عضله.',
      cta: 'دیدن گجت‌های باشگاه و سفر',
      cat: 'سفر و کمپینگ',
      targetProductId: undefined,
      image: HOMEPAGE_MEDIA.spotlightShaker,
      alt: 'مینی شیکر شارژی قابل حمل با میوه تازه',
    },
  ];

  // 3 Quick Spotlight Cards below Hero
  const spotlightCards = [
    {
      tag: 'برای اتاق خواب و سفر',
      title: 'فیلم رو روی دیوار ببینید',
      cta: 'دیدن پروژکتور',
      image: HOMEPAGE_MEDIA.heroProjector,
      alt: 'پروژکتور قابل حمل مگ‌کیوبیک',
      action: () => {
        const projector = products.find((p) => p.id === 'prod_ported_projector');
        if (projector) handleOpenProduct(projector);
        else handleSelectCategory('کالای دیجیتال');
      },
    },
    {
      tag: 'برای میز کار و اتاق خواب',
      title: 'چند کاربرد، یک دستگاه',
      cta: 'دیدن G-Lamp',
      image: HOMEPAGE_MEDIA.spotlightGlamp,
      alt: 'چراغ هوشمند و اسپیکر G-Lamp',
      action: () => {
        const glamp = products.find((p) => p.id === 'prod_ported_g_lamp');
        if (glamp) handleOpenProduct(glamp);
        else handleSelectCategory('لوازم خانگی هوشمند');
      },
    },
    {
      tag: 'برای باشگاه و سفر',
      title: 'گجت‌های همراه تمرین',
      cta: 'دیدن گجت‌ها',
      image: HOMEPAGE_MEDIA.spotlightShaker,
      alt: 'مینی شیکر شارژی و گجت‌های تمرین',
      action: () => {
        const shaker = products.find((p) => p.id === 'prod_ported_shaker');
        if (shaker) handleOpenProduct(shaker);
        else handleSelectCategory('زیبایی و سلامت');
      },
    },
  ];

  // 4 Real Categories (without product inventory counts)
  const categoryTiles = [
    {
      name: 'کالای دیجیتال',
      slug: 'digital',
      icon: Laptop,
      image: HOMEPAGE_MEDIA.categories.digital,
      focusLabel: 'تصویر، صدا و سرگرمی',
      shortDesc: 'فیلم رو روی دیوار ببینید، سفرتون رو ضبط کنید یا با دسته بازی کنید.',
    },
    {
      name: 'لوازم خانگی هوشمند',
      slug: 'smart-home',
      icon: Home,
      image: HOMEPAGE_MEDIA.categories.smartHome,
      focusLabel: 'کاربردی برای منزل',
      shortDesc: 'نظافت، اسموتی و نور شبانه با دستگاه‌های کوچیک.',
    },
    {
      name: 'سفر و کمپینگ',
      slug: 'travel-camping',
      icon: Tent,
      image: HOMEPAGE_MEDIA.categories.travelCamping,
      focusLabel: 'همراه جاده و کمپ',
      shortDesc: 'قهوه‌ی بدون برق و تشک بادی صندلی عقب ماشین.',
    },
    {
      name: 'زیبایی و سلامت',
      slug: 'beauty-health',
      icon: Leaf,
      image: HOMEPAGE_MEDIA.categories.beautyHealth,
      focusLabel: 'مراقبت و ریکاوری',
      shortDesc: 'پاکسازی سطحی منافذ و ماساژ عضله؛ مراقبت روزمره، نه درمان.',
    },
  ];

  // 6 Situational Tiles
  const situationalTiles = [
    {
      title: 'بعد از باشگاه',
      tag: 'ریکاوری و نوشیدنی',
      cta: 'دیدن گجت تمرین',
      icon: Dumbbell,
      image: HOMEPAGE_MEDIA.situations.afterGym,
      action: () => {
        const shaker = products.find((p) => p.id === 'prod_ported_shaker');
        if (shaker) handleOpenProduct(shaker);
        else handleSelectCategory('زیبایی و سلامت');
      },
    },
    {
      title: 'میز کار',
      tag: 'نور و شارژ بی‌سیم',
      cta: 'مرتب‌سازی میز',
      icon: Briefcase,
      image: HOMEPAGE_MEDIA.situations.workDesk,
      action: () => {
        const glamp = products.find((p) => p.id === 'prod_ported_g_lamp');
        if (glamp) handleOpenProduct(glamp);
        else handleSelectCategory('لوازم خانگی هوشمند');
      },
    },
    {
      title: 'سفر و جاده',
      tag: 'اسپرسو و خواب راحت',
      cta: 'لوازم سفر',
      icon: Car,
      image: HOMEPAGE_MEDIA.situations.roadTrip,
      action: () => handleSelectCategory('سفر و کمپینگ'),
    },
    {
      title: 'اتاق خواب',
      tag: 'نور شب و کهکشان',
      cta: 'دیدن چراغ خواب',
      icon: BedDouble,
      image: HOMEPAGE_MEDIA.situations.bedroomStars,
      action: () => {
        const lamp = products.find((p) => p.id === 'prod_ported_astronaut_lamp');
        if (lamp) handleOpenProduct(lamp);
        else handleSelectCategory('لوازم خانگی هوشمند');
      },
    },
    {
      title: 'فیلم و بازی',
      tag: 'سینمای خانگی و کنسول',
      cta: 'دیدن پروژکتور و گیم',
      icon: Gamepad2,
      image: HOMEPAGE_MEDIA.situations.gamepadTv,
      action: () => handleSelectCategory('کالای دیجیتال'),
    },
    {
      title: 'خونه تمیزتر',
      tag: 'نظافت هوشمند کف',
      cta: 'دیدن جارو رباتیک',
      icon: Home,
      image: HOMEPAGE_MEDIA.situations.robotVacuum,
      action: () => {
        const vac = products.find((p) => p.id === 'prod_ported_robot_vacuum');
        if (vac) handleOpenProduct(vac);
        else handleSelectCategory('لوازم خانگی هوشمند');
      },
    },
  ];

  // Current category details for SEO descriptive text
  const currentCategoryDetail = useMemo(() => {
    if (filters.selectedCategory === 'ALL') return null;
    return categoriesList.find(c => c.name === filters.selectedCategory) || null;
  }, [filters.selectedCategory, categoriesList]);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] gordiyeh-dark-bg text-[var(--text-main)] flex flex-col font-sans transition-colors" dir="rtl">
      {/* 0. TOP ANNOUNCEMENT BANNER */}
      <div className="gordiyeh-announcement-bar px-4 py-2 text-center text-xs font-medium leading-[1.6] flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-90" aria-hidden="true" />
        <span>{siteConfig?.announcementText || 'شرایط تست و تعویض هر محصول توی صفحه‌ی خودش نوشته شده؛ قبل از خرید می‌بینیدش.'}</span>
      </div>

      {/* 1. STOREFRONT HEADER */}
      <StorefrontHeader
        activeStorePage={activeStorePage}
        onNavigateStorePage={navigatePage}
        cartCount={cartCount}
        cartTotal={cartTotal}
        currency={currency}
        onOpenCart={() => setIsCartOpen(true)}
        compareCount={compareList.length}
        onOpenCompare={() => setIsCompareOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={(q) => {
          setSearchTerm(q);
          if (q.trim()) setActiveStorePage('CATALOG');
        }}
        isMegaMenuOpen={isMegaMenuOpen}
        onToggleMegaMenu={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
        onSelectCategory={(cat) => {
          handleSelectCategory(cat);
        }}
        selectedCategory={filters.selectedCategory}
        storeName={siteConfig?.storeName || 'فروشگاه گُردیه'}
        isHomeView={activeStorePage === 'HOME' && !selectedProduct}
      />

      {/* Mega Menu Popover */}
      <CategoryMegaMenu
        isOpen={isMegaMenuOpen}
        onClose={() => setIsMegaMenuOpen(false)}
        onSelectCategory={(cat, subCat) => {
          handleSelectCategory(cat, subCat);
        }}
      />

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {selectedProduct ? (
          <React.Suspense fallback={<GordiyehLoader variant="inline" label="در حال بارگذاری صفحه محصول..." />}>
            <ProductDetailPage
              product={selectedProduct}
              currency={currency}
              isPage={true}
              onClose={handleCloseProduct}
              onAddToCart={(product, qty, color) => {
                handleAddToCart(product, qty, color);
              }}
              isInCompare={compareList.some(cp => cp.id === selectedProduct.id)}
              onToggleCompare={handleToggleCompare}
              relatedProducts={products.filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category)}
              onSelectProduct={handleOpenProduct}
            />
          </React.Suspense>
        ) : (
          <>
            {/* VIEW A: USER DASHBOARD (Layout Spec T6) */}
            {activeStorePage === 'USER_DASHBOARD' && (
              <React.Suspense fallback={<GordiyehLoader variant="inline" label="در حال بارگذاری پنل کاربری..." />}>
                <UserDashboardPage
                  products={products}
                  currency={currency}
                  onSelectProduct={handleOpenProduct}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onBackToHome={() => navigatePage('HOME')}
                  initialTab={dashboardInitialTab}
                />
              </React.Suspense>
            )}

            {/* VIEW B: HELP CENTER (Layout Spec T8) */}
            {activeStorePage === 'HELP_CENTER' && (
              <React.Suspense fallback={<GordiyehLoader variant="inline" label="در حال بارگذاری مرکز راهنما..." />}>
                <HelpCenterPage
                  onBackToHome={() => navigatePage('HOME')}
                />
              </React.Suspense>
            )}

            {/* VIEW C: BLOG (Layout Spec T7) */}
            {activeStorePage === 'BLOG' && (
              <React.Suspense fallback={<GordiyehLoader variant="inline" label="در حال بارگذاری مجله گُردیه..." />}>
                <BlogView
                  posts={blogPosts}
                  products={products}
                  onBackToHome={() => navigatePage('HOME')}
                  onSelectProduct={handleOpenProduct}
                />
              </React.Suspense>
            )}

        {/* VIEW D: CATEGORY LISTING / CATALOG (Layout Spec T2) */}
        {activeStorePage === 'CATALOG' && (
          <div className="space-y-6">
            {/* Top Bar: Breadcrumb + H1 + Results count */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
              <div className="space-y-1">
                <nav className="text-xs text-[var(--text-muted)] flex items-center gap-1.5" aria-label="Breadcrumb">
                  <button onClick={() => navigatePage('HOME')} className="hover:text-[var(--text-main)] cursor-pointer">خانه</button>
                  <span>/</span>
                  <span className="text-[var(--text-main)] font-semibold">
                    {filters.selectedCategory === 'ALL' ? 'همه کالاها' : filters.selectedCategory}
                  </span>
                  {filters.selectedSubCategory && (
                    <>
                      <span>/</span>
                      <span className="text-[var(--text-muted)]">{filters.selectedSubCategory}</span>
                    </>
                  )}
                </nav>
                <h1 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
                  {filters.selectedCategory === 'ALL' ? 'همه‌ی محصول‌های گُردیه' : filters.selectedCategory}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)] tabular-nums">
                  {filteredProducts.length} محصول پیدا شد
                </span>
                <button
                  onClick={() => setIsMobileFilterDrawerOpen(true)}
                  className="lg:hidden px-3.5 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>فیلترها ({activeFiltersCount})</span>
                </button>
              </div>
            </div>

            {/* Sort Bar */}
            <ProductSortBar
              currentSort={sortOption}
              onSortChange={setSortOption}
              totalCount={filteredProducts.length}
            />

            {/* 12-Column Grid: 3 cols Sidebar (right), 9 cols Product Grid (left) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Desktop Filters Sidebar (3 cols) */}
              <div className="hidden lg:block lg:col-span-3">
                <ProductFilterSidebar
                  products={products}
                  filters={filters}
                  onFilterChange={setFilters}
                  onResetFilters={handleResetFilters}
                  categories={categories}
                  maxCatalogPrice={maxCatalogPrice}
                />
              </div>

              {/* Product Grid (9 cols) */}
              <div className="lg:col-span-9 space-y-6">
                {paginatedProducts.length === 0 ? (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4">
                    <Grid className="w-12 h-12 text-[var(--text-muted)] mx-auto" />
                    <h3 className="text-sm font-bold text-[var(--text-main)]">محصولی با این فیلترها پیدا نشد</h3>
                    <p className="text-xs text-[var(--text-muted)]">فیلترها یا عبارت جستجو رو تغییر بدید.</p>
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-bold text-[#F7F3EA] transition-colors cursor-pointer"
                    >
                      پاک کردن فیلترها
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={currency}
                        onSelectProduct={handleOpenProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                      />
                    ))}
                  </div>
                )}

                {/* Numbered Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6 border-t border-[var(--border-color)]">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold tabular-nums transition-all ${
                            currentPage === pageNum
                              ? 'bg-[var(--accent-primary)] text-white shadow'
                              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Category Descriptive Guide & 3 Selection Criteria (v3.0 Guide Section 3) */}
                {currentCategoryDetail && (
                  <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 text-xs sm:text-[13px] text-[var(--text-secondary)] leading-[1.8]">
                    <h2 className="font-bold text-[var(--text-main)] text-base leading-[1.5]">
                      راهنمای خرید در دسته‌ی {currentCategoryDetail.name}
                    </h2>
                    <p className="text-[var(--text-secondary)] leading-[1.85]">{currentCategoryDetail.introText}</p>
                    {currentCategoryDetail.selectionCriteria && currentCategoryDetail.selectionCriteria.length > 0 && (
                      <div className="pt-3 border-t border-[var(--border-color)] space-y-2">
                        <h3 className="font-bold text-[var(--text-main)] text-xs">سه معیار انتخاب</h3>
                        <ol className="list-decimal list-inside space-y-1">
                          {currentCategoryDetail.selectionCriteria.map((criterion, idx) => (
                            <li key={idx}>
                              <strong className="text-[var(--text-main)]">{criterion.title}:</strong> {criterion.question}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {currentCategoryDetail.subcategories.length > 0 && (
                      <div className="pt-2 text-[11px] text-[var(--text-muted)]">
                        زیرشاخه‌ها: {currentCategoryDetail.subcategories.join(' • ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW E: HOME PAGE */}
        {activeStorePage === 'HOME' && (
          <div className="space-y-12 animate-in fade-in duration-150">
            {/* 1. HERO SPLIT BANNER & 2. THREE SPOTLIGHT CARDS */}
            <div className="space-y-5">
              {/* Full-Width Split Hero Showcase (Glowing Violet Arch Portal in Dark Mode, Full-Bleed Botanical Split in Light Mode) */}
              <section
                className="gordiyeh-hero-section relative rounded-[28px] overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm min-h-[380px] lg:min-h-[430px] flex items-end justify-between"
                onMouseEnter={() => setIsHeroPaused(true)}
                onMouseLeave={() => setIsHeroPaused(false)}
              >
                <img
                  src={heroSlides[heroSlide].image}
                  alt={heroSlides[heroSlide].alt}
                  width={1200}
                  height={675}
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="gordiyeh-hero-photo-bg absolute inset-0 w-full h-full object-cover object-left transition-all duration-500"
                />
                <div className="hero-scrim-rtl absolute inset-0 pointer-events-none" />

                <div className="relative z-10 w-full lg:w-[54%] p-6 sm:p-10 lg:p-12 pb-16 sm:pb-10 lg:pb-11 space-y-3.5 text-right self-end banner-hover-legible">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--border-active)]/30 text-[var(--accent-text)] text-xs font-medium leading-[1.4]">
                    {heroSlides[heroSlide].badge}
                  </span>

                  <h1 className="gordiyeh-type-display text-[22px] sm:text-[28px] lg:text-[32px] font-bold text-[var(--text-main)] leading-[1.42] text-balance">
                    {heroSlides[heroSlide].title}
                  </h1>

                  <p className="text-[13px] sm:text-sm text-[var(--text-secondary)] leading-[1.85] max-w-lg">
                    {heroSlides[heroSlide].subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const slide = heroSlides[heroSlide];
                        if (slide.targetProductId) {
                          const prod = products.find((p) => p.id === slide.targetProductId);
                          if (prod) { handleOpenProduct(prod); return; }
                        }
                        if (slide.cat === 'ALL') {
                          setFilters(prev => ({ ...prev, selectedCategory: 'ALL', discountOnly: false }));
                          navigatePage('CATALOG');
                        } else {
                          handleSelectCategory(slide.cat);
                        }
                      }}
                      className="px-6 py-3 min-h-[42px] rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-[var(--shadow-glow)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{heroSlides[heroSlide].cta}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigatePage('BLOG')}
                      className="text-xs sm:text-sm font-bold text-[var(--text-main)] underline underline-offset-8 hover:text-[var(--accent-text)] transition-colors cursor-pointer py-2"
                    >
                      راهنمای انتخاب
                    </button>
                  </div>
                </div>

                {/* Slide Controls */}
                <div className="absolute bottom-4 left-5 z-10 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[var(--bg-glass)] backdrop-blur-sm px-2.5 py-1.5 rounded-full border border-[var(--border-color)]">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setHeroSlide(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          heroSlide === idx
                            ? 'w-5 bg-[var(--accent-primary)]'
                            : 'w-1.5 bg-[var(--text-main)]/25 hover:bg-[var(--text-main)]/55'
                        }`}
                        aria-label={`اسلاید ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeroSlide((heroSlide - 1 + heroSlides.length) % heroSlides.length)}
                    className="w-8 h-8 rounded-full bg-[var(--bg-glass)] backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="اسلاید قبلی"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroSlide((heroSlide + 1) % heroSlides.length)}
                    className="w-8 h-8 rounded-full bg-[var(--bg-glass)] backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="اسلاید بعدی"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </section>

              {/* 3 Feature Spotlight Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {spotlightCards.map((card, idx) => (
                  <div
                    key={idx}
                    onClick={card.action}
                    className="relative rounded-2xl overflow-hidden min-h-[195px] sm:min-h-[205px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] shadow-sm hover:-translate-y-0.5 transition-all flex items-end justify-between gap-3 p-5 text-right group cursor-pointer"
                  >
                    <img
                      src={card.image}
                      alt={card.alt}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover object-left group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="spotlight-scrim-rtl absolute inset-0 pointer-events-none" />

                    <div className="relative z-10 max-w-[58%] space-y-2 flex flex-col items-start self-end banner-hover-legible">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-[11px] font-medium">
                        {card.tag}
                      </span>
                      <h2 className="text-[15px] sm:text-base font-bold text-[var(--text-main)] leading-[1.55]">
                        {card.title}
                      </h2>
                    </div>

                    <span className="relative z-10 px-3.5 py-1.5 rounded-full bg-[var(--accent-primary)] group-hover:bg-[var(--accent-secondary)] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors shadow-md whitespace-nowrap shrink-0">
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>{card.cta}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. SLIDER 1: کالاهای دارای تخفیف (Interleaved directly after Hero & Spotlights) */}
            {sliderVisibility.showDiscounts && discountedProducts.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
                      کالاهای دارای تخفیف
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">تخفیف‌های فعال روی کاتالوگ گُردیه</p>
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollSlider('discounts', 'prev')}
                        aria-label="قبلی در کالاهای دارای تخفیف"
                        className="w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollSlider('discounts', 'next')}
                        aria-label="بعدی در کالاهای دارای تخفیف"
                        className="w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSortOption('discount');
                        setFilters((prev) => ({ ...prev, discountOnly: true, selectedCategory: 'ALL' }));
                        navigatePage('CATALOG');
                      }}
                      className="text-xs font-bold text-[var(--accent-text)] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] pr-2"
                    >
                      <span>دیدن همه‌ی تخفیف‌ها</span>
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div
                  ref={(el) => {
                    sliderRefs.current.discounts = el;
                  }}
                  className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
                >
                  {discountedProducts.map((product) => (
                    <div key={`discounts-${product.id}`} className="w-[262px] sm:w-[276px] lg:w-[290px] shrink-0 snap-start">
                      <ProductCard
                        product={product}
                        currency={currency}
                        onSelectProduct={handleOpenProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. CATEGORY TILES (Wide Banner-Style Photo Cards in Static 2x2 Grid, no product counts) */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[var(--border-color)]" />
                <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5] shrink-0 text-center">
                  دسته‌ها
                </h2>
                <div className="h-px flex-1 bg-[var(--border-color)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {categoryTiles.map((cat, idx) => {
                  const IconComp = cat.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCategory(cat.name)}
                      className="relative rounded-2xl overflow-hidden min-h-[195px] sm:min-h-[210px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] shadow-sm hover:-translate-y-0.5 transition-all flex items-end justify-between gap-4 p-5 sm:p-6 text-right group cursor-pointer"
                    >
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover object-left group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="spotlight-scrim-rtl absolute inset-0 pointer-events-none" />

                      <div className="relative z-10 max-w-[54%] space-y-2 flex flex-col items-start self-end banner-hover-legible">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-[11px] font-medium">
                          <IconComp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                          <span>{cat.focusLabel}</span>
                        </span>
                        <h3 className="text-base sm:text-[18px] font-bold text-[var(--text-main)] leading-[1.5]">
                          {cat.name}
                        </h3>
                        <p className="text-xs font-normal text-[var(--text-secondary)] line-clamp-2 leading-[1.8]">
                          {cat.shortDesc}
                        </p>
                      </div>

                      <span className="relative z-10 px-4 py-1.5 rounded-full bg-[var(--accent-primary)] group-hover:bg-[var(--accent-secondary)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-md whitespace-nowrap shrink-0">
                        <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>مشاهده دسته</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. SLIDER 2: تازه‌ترین‌ها (Interleaved between Categories & Situational Finder, zero overlap with Discounts) */}
            {sliderVisibility.showNewest && newestProducts.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
                      تازه‌ترین‌ها
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                      {sliderVisibility.deduplicateMode === 'manual'
                        ? 'جدیدترین و منتخب محصول‌های اضافه‌شده به فروشگاه'
                        : 'جدیدترین محصول‌های اضافه‌شده به فروشگاه بدون تکرار'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollSlider('newest', 'prev')}
                        aria-label="قبلی در تازه‌ترین‌ها"
                        className="w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollSlider('newest', 'next')}
                        aria-label="بعدی در تازه‌ترین‌ها"
                        className="w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSortOption('newest');
                        setFilters((prev) => ({ ...prev, discountOnly: false, selectedCategory: 'ALL' }));
                        navigatePage('CATALOG');
                      }}
                      className="text-xs font-bold text-[var(--accent-text)] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] pr-2"
                    >
                      <span>دیدن همه‌ی محصول‌ها</span>
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div
                  ref={(el) => {
                    sliderRefs.current.newest = el;
                  }}
                  className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
                >
                  {newestProducts.map((product) => (
                    <div key={`newest-${product.id}`} className="w-[262px] sm:w-[276px] lg:w-[290px] shrink-0 snap-start">
                      <ProductCard
                        product={product}
                        currency={currency}
                        onSelectProduct={handleOpenProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. SHOP BY SITUATION (Banner-Style Photo Cards in Static 3-Col Grid) */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-[var(--border-color)]" />
                <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5] shrink-0 text-center">
                  امروز دنبال چه کاری هستید؟
                </h2>
                <div className="h-px flex-1 bg-[var(--border-color)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {situationalTiles.map((tile, idx) => {
                  const IconComp = tile.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={tile.action}
                      className="relative rounded-2xl overflow-hidden min-h-[168px] sm:min-h-[180px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] shadow-sm hover:-translate-y-0.5 transition-all flex items-end justify-between gap-3 p-5 text-right group cursor-pointer"
                    >
                      <img
                        src={tile.image}
                        alt={tile.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover object-left group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="spotlight-scrim-rtl absolute inset-0 pointer-events-none" />

                      <div className="relative z-10 max-w-[56%] space-y-2 flex flex-col items-start self-end banner-hover-legible">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)] text-[11px] font-medium">
                          <IconComp className="w-3.5 h-3.5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                          <span>{tile.tag}</span>
                        </span>
                        <h3 className="text-[15px] sm:text-base font-bold text-[var(--text-main)] leading-[1.55]">
                          {tile.title}
                        </h3>
                      </div>

                      <span className="relative z-10 px-3 py-1.5 rounded-full bg-[var(--accent-primary)] group-hover:bg-[var(--accent-secondary)] text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors shadow-md whitespace-nowrap shrink-0">
                        <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{tile.cta}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 6. OPTIONAL SLIDER 3: پرفروش‌ترین‌ها (Can be hidden from SiteVisualEditor for newly launched store) */}
            {sliderVisibility.showBestsellers && bestSellerProducts.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
                      پرفروش‌ترین‌ها
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">محبوب‌ترین گجت‌های انتخاب‌شده توسط خریداران گُردیه</p>
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollSlider('bestsellers', 'prev')}
                        aria-label="قبلی در پرفروش‌ترین‌ها"
                        className="w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollSlider('bestsellers', 'next')}
                        aria-label="بعدی در پرفروش‌ترین‌ها"
                        className="w-9 h-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSortOption('bestseller');
                        setFilters((prev) => ({ ...prev, discountOnly: false, selectedCategory: 'ALL' }));
                        navigatePage('CATALOG');
                      }}
                      className="text-xs font-bold text-[var(--accent-text)] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px] pr-2"
                    >
                      <span>دیدن همه‌ی پرفروش‌ها</span>
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div
                  ref={(el) => {
                    sliderRefs.current.bestsellers = el;
                  }}
                  className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none"
                >
                  {bestSellerProducts.map((product) => (
                    <div key={`bestsellers-${product.id}`} className="w-[262px] sm:w-[276px] lg:w-[290px] shrink-0 snap-start">
                      <ProductCard
                        product={product}
                        currency={currency}
                        onSelectProduct={handleOpenProduct}
                        onAddToCart={(p) => handleAddToCart(p, 1)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 7. BLOG SELECTION GUIDES ("قبل از خرید بخونید" با عکس شاخص) */}
            <section className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5] shrink-0">
                    قبل از خرید بخونید
                  </h2>
                  <div className="h-px flex-1 bg-[var(--border-color)]" />
                </div>
                <button
                  type="button"
                  onClick={() => navigatePage('BLOG')}
                  className="text-xs font-bold text-[var(--accent-text)] hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
                >
                  <span>دیدن همه‌ی راهنماها</span>
                  <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {blogPosts.slice(0, 3).map((post, idx) => {
                  const fallbackCover =
                    idx === 0
                      ? HOMEPAGE_MEDIA.heroProjector
                      : idx === 1
                      ? HOMEPAGE_MEDIA.spotlightGlamp
                      : HOMEPAGE_MEDIA.spotlightShaker;
                  return (
                    <a
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigatePage('BLOG');
                      }}
                      className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] shadow-sm hover:-translate-y-0.5 transition-all flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        {/* Featured Cover Image (عکس شاخص مقاله) */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--bg-card)]">
                          <img
                            src={post.coverImage || fallbackCover}
                            alt={post.title}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src !== fallbackCover) img.src = fallbackCover;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--border-color)] text-[11px] font-bold text-[var(--accent-text)]">
                            {post.category}
                          </span>
                          <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-medium tabular-nums">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>{post.readingTimeMinutes || 4} دقیقه مطالعه</span>
                          </span>
                        </div>

                        <div className="p-5 pb-3 space-y-2">
                          <h3 className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent-text)] transition-colors line-clamp-2 leading-[1.7]">
                            {post.title}
                          </h3>
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-[1.8]">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="mx-5 px-0 pb-5 pt-3 flex items-center justify-between border-t border-[var(--border-color)]/60">
                        <span className="text-[11px] font-bold text-[var(--accent-text)] inline-flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>خواندن راهنما</span>
                        </span>
                        <ChevronLeft className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-text)] group-hover:-translate-x-0.5 transition-all" aria-hidden="true" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>

            {/* 8. FOUR TRUST PILLARS — Clean Architectural Cards Matching Gordiyeh Minimal Gadget Brand */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  num: '۱',
                  title: 'ارسال با رهگیری',
                  desc: 'سفارش‌های تهران با پیک و بقیه‌ی شهرها با پست پیشتاز و کد رهگیری ارسال می‌شن.',
                  icon: Truck,
                  tag: 'تهران و سراسر ایران',
                },
                {
                  num: '۲',
                  title: 'تست و تعویض شفاف',
                  desc: 'مهلت و شرایطش برای هر محصول جدا و توی صفحه‌ی خودش نوشته شده.',
                  icon: RotateCcw,
                  tag: 'بی‌قیدوشرط در ایراد فنی',
                },
                {
                  num: '۳',
                  title: 'توضیح صادقانه',
                  desc: 'برای هر محصول می‌نویسیم برای چه کسی مناسبه و برای چه کسی نیست.',
                  icon: MessageSquareText,
                  tag: 'شفافیت پیش از خرید',
                },
                {
                  num: '۴',
                  title: 'پرداخت و پشتیبانی',
                  desc: 'پرداخت از درگاه شاپرکی انجام می‌شه و برای راهنمایی می‌تونید با پشتیبانی تماس بگیرید.',
                  icon: ShieldCheck,
                  tag: 'پاسخ‌گویی واقعی',
                },
              ].map((pillar) => {
                const IconComp = pillar.icon;
                return (
                  <div
                    key={pillar.num}
                    className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] p-5 flex flex-col justify-between gap-4 shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)]/35 flex items-center justify-center text-[var(--accent-text)] shrink-0">
                          <IconComp className="w-5 h-5" strokeWidth={1.9} aria-hidden="true" />
                        </div>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">
                          {pillar.tag}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--accent-text)]/65 tabular-nums">
                        {pillar.num}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <h3 className="text-sm font-bold text-[var(--text-main)] leading-[1.6]">{pillar.title}</h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 9. COMPACT ASYMMETRIC 2-COLUMN FAQ ACCORDION (Bottom above Footer, 5 Questions, No leading zero) */}
            <section className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
                {/* Right Side Column (4 cols): Section Header & Quick Link */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--border-active)]/30 text-[var(--accent-text)] text-xs font-medium">
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>پیش از ثبت سفارش</span>
                  </div>
                  <h2 className="text-[18px] sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
                    سؤال‌های رایج
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] leading-[1.85]">
                    پاسخ شفاف و سریع درباره نحوه ارسال، شرایط تست و تعویض، پرداخت امن و کاربرد واقعی گجت‌های گُردیه.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigatePage('HELP_CENTER')}
                      className="px-4 py-2 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>مرکز راهنما و پرسش‌ها</span>
                      <ChevronLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Left Side Column (8 cols): 5 Focused Questions with Distinct Open Header vs Answer Contrast */}
                <div className="lg:col-span-8 space-y-2.5">
                  {homeFaqs.slice(0, 5).map((faq, idx) => {
                    const isOpen = openHomeFaqId === faq.id;
                    const persianIndex = String(idx + 1).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isOpen
                            ? 'bg-[var(--bg-surface)] border-[var(--border-active)] shadow-md'
                            : 'bg-[var(--bg-surface)]/75 border-[var(--border-color)] hover:border-[var(--border-active)]/75'
                        }`}
                      >
                        <button
                          type="button"
                          id={`home-faq-btn-${faq.id}`}
                          aria-expanded={isOpen}
                          aria-controls={`home-faq-panel-${faq.id}`}
                          onClick={() => setOpenHomeFaqId(isOpen ? null : faq.id)}
                          className={`w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-right cursor-pointer min-h-[52px] transition-colors ${
                            isOpen
                              ? 'bg-[var(--accent-soft)]/75 border-b border-[var(--border-active)]/35'
                              : 'hover:bg-[var(--bg-card-hover)]/45'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-xl text-xs font-bold tabular-nums flex items-center justify-center shrink-0 transition-colors ${
                                isOpen
                                  ? 'bg-[var(--accent-primary)] text-white'
                                  : 'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--border-color)]'
                              }`}
                            >
                              {persianIndex}
                            </span>
                            <span
                              className={`text-[13px] sm:text-sm font-bold leading-[1.6] ${
                                isOpen ? 'text-[var(--accent-text)]' : 'text-[var(--text-main)]'
                              }`}
                            >
                              {faq.question}
                            </span>
                          </div>

                          <ChevronDown
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[var(--accent-text)]' : 'text-[var(--text-muted)]'
                            }`}
                            aria-hidden="true"
                          />
                        </button>

                        {isOpen && (
                          <div
                            id={`home-faq-panel-${faq.id}`}
                            role="region"
                            aria-labelledby={`home-faq-btn-${faq.id}`}
                            className="px-4 sm:px-5 pb-4 pt-3 pr-14 bg-[var(--bg-surface)] space-y-3 text-xs sm:text-[13px]"
                          >
                            <p className="text-[var(--text-secondary)] leading-[1.85]">
                              {faq.answer}
                            </p>
                            <div>
                              <button
                                type="button"
                                onClick={faq.onAction}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-text)] hover:underline cursor-pointer"
                              >
                                <span>{faq.actionLabel}</span>
                                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop-Only Guidance & Pre-Purchase Consultation Banner directly beneath FAQ */}
              <div className="hidden lg:flex items-center justify-between gap-6 mt-6 pt-6 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-active)]/40 flex items-center justify-center text-[var(--accent-text)] shrink-0">
                    <Headphones className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5 text-right">
                    <h3 className="text-sm font-bold text-[var(--text-main)] leading-[1.6]">
                      پاسخ سؤالتان را پیدا نکردید یا بین دو گجت مردد هستید؟
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                      پیش از خرید با پشتیبانی واقعی گُردیه تماس بگیرید تا کاربرد و محدودیت هر مدل را صادقانه بررسی کنیم.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href="/page/contact"
                    onClick={(e) => {
                      e.preventDefault();
                      openStaticPage('contact');
                    }}
                    className="px-4 py-2.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] text-xs font-bold inline-flex items-center gap-2 transition-colors tabular-nums"
                  >
                    <Phone className="w-3.5 h-3.5 text-[var(--accent-text)]" aria-hidden="true" />
                    <span>۰۲۱-۸۸۲۹۹۰۴۰</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => navigatePage('HELP_CENTER')}
                    className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>راهنمای خرید و تست کالا</span>
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
          </>
        )}
      </main>

      {/* 3. GORDIYEH FOOTER */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] mt-14 pt-10 pb-20 md:pb-10 text-[var(--text-muted)] text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Top Newsletter / Offers Banner — Focused Explicit 2-Column Split (Right: Copy, Left: Form) */}
          <div className="rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-color)] px-5 py-4 sm:px-7 sm:py-5 grid grid-cols-1 lg:grid-cols-2 items-center gap-4 lg:gap-8 shadow-sm">
            {/* Right Column (RTL start): Compact badge + single-line title + short subtitle */}
            <div className="flex items-center gap-3.5 min-w-0 justify-self-start w-full">
              <div className="relative w-11 h-11 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-active)] flex items-center justify-center text-[var(--accent-text)] shrink-0">
                <Mail className="w-5 h-5" />
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[var(--accent-primary)] text-[#F7F3EA] flex items-center justify-center shadow-xs">
                  <Bell className="w-2.5 h-2.5" />
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-[var(--text-main)] leading-[1.5] truncate">
                  با جدیدترین <span className="text-[var(--accent-text)]">تخفیف‌ها</span>، اول باخبر شوید!
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-[1.8] truncate">
                  اطلاع از پیشنهادهای ویژه و کالاهای جدید بدون ایمیل اضافی.
                </p>
              </div>
            </div>

            {/* Left Column (RTL end): Compact pill input + CTA anchored opposite side */}
            <div className="w-full lg:max-w-[380px] lg:justify-self-end">
              {newsletterSubscribed ? (
                <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-soft)] border border-[var(--border-active)] text-[var(--accent-text)] text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>ایمیل شما با موفقیت ثبت شد.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex items-center gap-1.5 p-1 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] focus-within:border-[var(--accent-primary)] transition-colors"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2.5 pl-1">
                    <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <input
                      type="email"
                      required
                      dir="auto"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="ایمیل شما..."
                      aria-label="ایمیل شما برای عضویت در خبرنامه"
                      className="w-full min-w-0 bg-transparent text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none text-right py-1.5"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    عضویت
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Main 4-Column Structural Grid with Subtle Hairline Dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-x-reverse lg:divide-[var(--border-color)] items-start">
            {/* Col 1 (RTL rightmost): Brand Identity + Prominent Enlarged Logo + Description */}
            <div className="lg:pl-7 space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={GORDIYEH_BRAND.logoAsset}
                  alt={GORDIYEH_BRAND.nameFa}
                  className="h-16 sm:h-[74px] w-auto object-contain gordiyeh-footer-logo shrink-0"
                />
                <div>
                  <span className="tracking-wide text-xl font-bold text-[var(--text-main)] block leading-[1.3]">
                    گُردیه
                  </span>
                  <span className="text-[11px] tracking-[0.26em] text-[var(--text-muted)] font-mono block mt-1.5">
                    GORDIYEH
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-[var(--border-color)]/60">
                <div className="text-[13px] font-bold text-[var(--text-main)] leading-[1.7]">
                  فروشگاه گجت‌های کاربردی برای خونه، سفر و باشگاه
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                  ما اینجا هستیم تا با معرفی محصولات کاربردی و توضیح صادقانه، زندگی روزمره‌تون رو ساده‌تر کنیم.
                </p>
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div className="lg:px-7 space-y-3.5">
              <h5 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--accent-text)]" />
                <span>دسترسی سریع</span>
              </h5>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      navigatePage('HOME');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>صفحه اصلی</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/category/digital"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectCategory('ALL');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>دسته‌بندی محصولات</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/category/smart-home"
                    onClick={(e) => {
                      e.preventDefault();
                      setFilters((prev) => ({ ...prev, selectedCategory: 'ALL', discountOnly: true }));
                      setActiveStorePage('CATALOG');
                      setSelectedProduct(null);
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>پیشنهادهای ویژه</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    onClick={(e) => {
                      e.preventDefault();
                      navigatePage('BLOG');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>راهنمای انتخاب و مجله</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/page/contact"
                    onClick={(e) => {
                      e.preventDefault();
                      openStaticPage('contact');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>تماس با ما</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Shopping Guide */}
            <div className="lg:px-7 space-y-3.5">
              <h5 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[var(--accent-text)]" />
                <span>راهنمای خرید</span>
              </h5>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a
                    href="/orders"
                    onClick={(e) => {
                      e.preventDefault();
                      navigatePage('USER_DASHBOARD');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>پیگیری سفارش‌ها</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/page/terms"
                    onClick={(e) => {
                      e.preventDefault();
                      openStaticPage('terms');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>شرایط ارسال و تحویل</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/page/faq"
                    onClick={(e) => {
                      e.preventDefault();
                      openStaticPage('faq');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>سوالات متداول و تست کالا</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/compare"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsCompareOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>مقایسه‌ی محصول‌ها</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/page/about-us"
                    onClick={(e) => {
                      e.preventDefault();
                      openStaticPage('about-us');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors font-semibold text-[var(--text-main)]"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>درباره گُردیه</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/page/licenses"
                    rel="nofollow"
                    onClick={(e) => {
                      e.preventDefault();
                      openStaticPage('licenses');
                    }}
                    className="inline-flex items-center gap-1.5 hover:text-[var(--accent-text)] transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                    <span>مجوزها و نمادهای اعتماد</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4 (RTL leftmost): Follow Us + Social Squares + Safe Purchase Card */}
            <div className="lg:pr-7 space-y-4">
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-[var(--text-main)]">ما را دنبال کنید</h5>
                <p className="text-[11px] text-[var(--text-muted)]">
                  در شبکه‌های اجتماعی همراه ما باشید (@gordiyeh_gadgets)
                </p>
              </div>

              {/* 4 Social / Contact Icon Buttons */}
              <div className="flex items-center gap-2.5">
                <a
                  href="/page/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    openStaticPage('contact');
                  }}
                  aria-label="تماس تلفنی پشتیبانی"
                  title="۰۲۱-۸۸۲۹۹۰۴۰"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-text)] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href="/blog"
                  onClick={(e) => {
                    e.preventDefault();
                    navigatePage('BLOG');
                  }}
                  aria-label="ویدیوها و بررسی‌ها"
                  title="بررسی‌های ویدیویی گُردیه"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-text)] transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="/page/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    openStaticPage('contact');
                  }}
                  aria-label="اینستاگرام گُردیه"
                  title="@gordiyeh_gadgets"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-text)] transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="/page/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    openStaticPage('contact');
                  }}
                  aria-label="تلگرام پشتیبانی"
                  title="پشتیبانی تلگرام گُردیه"
                  className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-main)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-text)] transition-colors"
                >
                  <Send className="w-4 h-4" />
                </a>
              </div>

              {/* Safe & Trusted Purchase Card */}
              <button
                type="button"
                onClick={() => setIsCustomerMemoryOpen(true)}
                className="w-full text-right p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] flex items-center gap-3 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-main)] group-hover:text-[var(--accent-text)] transition-colors">
                    خرید امن و مطمئن
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    حفظ حریم خصوصی و مدیریت داده‌ها
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Bottom Bar: Portrait E-Namad-Style Trust & Payment Seals & Copyright */}
          <div className="pt-6 pb-4 md:pb-2 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)] sm:pl-28">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {/* Dedicated Footer Licenses Section Link -> /page/licenses (noindex, nofollow) */}
              <a
                href="/page/licenses"
                rel="nofollow"
                onClick={(e) => {
                  e.preventDefault();
                  openStaticPage('licenses');
                }}
                title="مشاهده برگه مجوزها و نمادهای اعتماد (اینماد و زرین‌پال)"
                aria-label="مجوزها و نمادهای اعتماد گُردیه"
                className="h-[92px] min-w-[116px] px-3 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-active)] hover:border-[var(--accent-primary)] hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm flex flex-col items-center justify-center gap-1 text-center group"
              >
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-[var(--text-main)] group-hover:text-[var(--accent-text)] leading-tight">
                  مجوزها و نمادها
                </span>
                <span className="text-[9.5px] text-[var(--text-muted)] leading-none">
                  اینماد • زرین‌پال
                </span>
              </a>

              <a
                href="https://shaparak.ir"
                target="_blank"
                rel="noopener noreferrer"
                title="درگاه پرداخت الکترونیک شاپرک"
                aria-label="درگاه شاپرک"
                className="inline-block rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm bg-white p-0.5 border border-[var(--border-color)]"
              >
                <img
                  src="/assets/payments/shaparak.svg"
                  alt="درگاه شاپرک"
                  width={76}
                  height={92}
                  className="h-[88px] w-auto block"
                />
              </a>

              <a
                href="https://www.cbi.ir"
                target="_blank"
                rel="noopener noreferrer"
                title="شبکه پرداخت شتاب بانکی"
                aria-label="شتاب"
                className="inline-block rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm bg-white p-0.5 border border-[var(--border-color)]"
              >
                <img
                  src="/assets/payments/shetab.svg"
                  alt="شتاب"
                  width={76}
                  height={92}
                  className="h-[88px] w-auto block"
                />
              </a>

              <a
                href="/page/terms"
                onClick={(e) => {
                  e.preventDefault();
                  openStaticPage('terms');
                }}
                title="شرایط پرداخت کارت‌به‌کارت امن گُردیه"
                aria-label="کارت‌به‌کارت امن"
                className="inline-block rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all shadow-sm bg-white p-0.5 border border-[var(--border-color)]"
              >
                <img
                  src="/assets/payments/card-to-card.svg"
                  alt="کارت‌به‌کارت امن"
                  width={76}
                  height={92}
                  className="h-[88px] w-auto block"
                />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-center sm:text-left tabular-nums">
              <span>تلفن: ۰۲۱-۸۸۲۹۹۰۴۰ (شنبه تا چهارشنبه ۹ تا ۱۹)</span>
              <span className="hidden sm:inline opacity-40">|</span>
              <span>کلیه حقوق این سایت متعلق به فروشگاه گُردیه است.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. MODALS & OVERLAYS */}

      {/* Cart & 3-Step Checkout Drawer */}
      {isCartOpen && (
        <React.Suspense fallback={null}>
          <CartAndCheckoutModal
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            currency={currency}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOrderCompleted={(order) => {
              onOrderCreated(order);
            }}
          />
        </React.Suspense>
      )}

      {/* Compare Modal */}
      {isCompareOpen && (
        <React.Suspense fallback={null}>
          <ProductCompareModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            products={products}
            compareList={compareList}
            onRemoveFromCompare={handleRemoveFromCompare}
            onAddToCompare={(p) => {
              if (compareList.length < 4) {
                setCompareList(prev => [...prev, p]);
              }
            }}
            onSelectProductForDetails={handleOpenProduct}
            currency={currency}
          />
        </React.Suspense>
      )}

      {/* Static Pages Modal */}
      {activeStaticPageSlug && (
        <React.Suspense fallback={null}>
          <StaticPagesModal
            isOpen={!!activeStaticPageSlug}
            pageSlug={activeStaticPageSlug || 'about-us'}
            pages={staticPages}
            onSelectPage={(slug) => openStaticPage(slug)}
            onClose={closeStaticPage}
            trustLicenses={siteConfig.trustLicenses}
          />
        </React.Suspense>
      )}

      {/* Customer Memory & Privacy Hub */}
      {isCustomerMemoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <PieceErrorBoundary pieceId="piece_customer_memory" pieceName="مرکز کنترل حریم خصوصی و حافظه مشتری">
              <React.Suspense fallback={<GordiyehLoader variant="inline" label="در حال بارگذاری مرکز حریم خصوصی..." />}>
                <CustomerMemoryHubTile
                  customerId="cust_guest_me"
                  onClose={() => setIsCustomerMemoryOpen(false)}
                />
              </React.Suspense>
            </PieceErrorBoundary>
          </div>
        </div>
      )}

      {/* Mobile Filter Slide-Over Drawer */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm h-full bg-[var(--bg-card)] border-r border-[var(--border-color)] shadow-2xl flex flex-col z-10 text-[var(--text-main)]">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)] shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--accent-text)]" />
                <h3 className="font-bold text-[var(--text-main)] text-sm">فیلترهای محصول</h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold tabular-nums">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-[var(--text-muted)] hover:text-rose-500 font-medium px-2 py-1 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    حذف فیلترها
                  </button>
                )}
                <button
                  onClick={() => setIsMobileFilterDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] border border-[var(--border-color)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--bg-card)]">
              <ProductFilterSidebar
                products={products}
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                categories={categories}
                maxCatalogPrice={maxCatalogPrice}
              />
            </div>

            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-main)] shrink-0">
              <button
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="w-full py-3 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>دیدن نتیجه‌ها ({filteredProducts.length} محصول)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Support Widget */}
      <LiveSupportWidget
        products={products}
        currency={currency}
        onSelectProduct={handleOpenProduct}
        onAddToCart={(p) => {
          handleAddToCart(p);
          setIsCartOpen(true);
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCustomerChats={() => {
          setDashboardInitialTab('chats');
          navigatePage('USER_DASHBOARD');
        }}
      />
    </div>
  );
};
