import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  Search,
  Tag,
  Share2,
  ChevronLeft,
  Bot,
  Layers,
  ShoppingBag,
  ExternalLink,
  Plus
} from 'lucide-react';
import { BlogPost } from '../../utils/cmsStore';
import { CanonicalProduct } from '../../types';
import { BlockRenderer } from '../cms/BlockRenderer';
import { ContentBlock, UnifiedDocument } from '../../types/cms';

interface BlogViewProps {
  posts: BlogPost[];
  products: CanonicalProduct[];
  onSelectProduct?: (product: CanonicalProduct) => void;
  onAddToCart?: (product: CanonicalProduct) => void;
  onOpenContentStudio?: () => void;
  onBackToHome: () => void;
}

interface EnrichedArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  category: string;
  coverImage?: string;
  publishedAt: string;
  readingTimeMinutes: number;
  tags: string[];
  blocks?: ContentBlock[];
  connectedProductId?: string;
  isAIGenerated?: boolean;
  delegationMode?: 'FULL_AI' | 'HYBRID_CUSTOM' | 'MANUAL';
}

export const BlogView: React.FC<BlogViewProps> = ({
  posts,
  products,
  onSelectProduct,
  onAddToCart,
  onOpenContentStudio,
  onBackToHome
}) => {
  const [selectedPost, setSelectedPost] = useState<EnrichedArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [remoteArticles, setRemoteArticles] = useState<UnifiedDocument[]>([]);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  // Products lookup map for dynamic product_card resolution
  const productsMap = useMemo(() => {
    const map: Record<string, CanonicalProduct> = {};
    for (const p of products) {
      map[p.id] = p;
      if (p.slug) map[p.slug] = p;
    }
    return map;
  }, [products]);

  // Fetch published articles from CMS API
  useEffect(() => {
    fetch('/api/documents?kind=article')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setRemoteArticles(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Merge local posts with remote CMS documents
  const allArticles: EnrichedArticle[] = useMemo(() => {
    const merged: EnrichedArticle[] = [];
    const seenSlugs = new Set<string>();

    // Remote CMS articles have highest priority
    for (const doc of remoteArticles) {
      seenSlugs.add(doc.slug);
      merged.push({
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        excerpt: doc.seoDescription || doc.derivedPlainText?.slice(0, 160) || '',
        author: doc.author || 'گُردیه',
        category: 'راهنمای خرید',
        coverImage: doc.coverImage,
        publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString('fa-IR') : '۱۴۰۳',
        readingTimeMinutes: Math.max(2, Math.ceil((doc.derivedPlainText?.length || 500) / 450)),
        tags: ['تکنولوژی', 'گُردیه', 'راهنما'],
        blocks: doc.blocks,
      });
    }

    // Append seed posts if not overwritten
    for (const p of posts) {
      if (!seenSlugs.has(p.slug)) {
        seenSlugs.add(p.slug);
        merged.push({
          id: p.id,
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          content: p.content,
          author: p.author,
          category: p.category,
          coverImage: p.coverImage,
          publishedAt: p.publishedAt,
          readingTimeMinutes: p.readingTimeMinutes,
          tags: p.tags,
          connectedProductId: p.connectedProductId,
          isAIGenerated: p.isAIGenerated,
          delegationMode: p.delegationMode,
        });
      }
    }

    return merged;
  }, [remoteArticles, posts]);

  // Check URL pathname for deep link: /blog/:slug or preview token
  useEffect(() => {
    try {
      const path = decodeURIComponent(window.location.pathname);
      const match = path.match(/^\/blog\/([a-zA-Z0-9_-]+)/);
      if (match) {
        const slug = match[1];
        const post = allArticles.find(p => p.slug === slug || p.id === slug);
        if (post) {
          setSelectedPost(post);
        } else {
          // If not in cache, try fetching directly from API (supports draft preview token)
          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');
          const fetchUrl = token ? `/api/documents/${slug}?token=${token}` : `/api/documents/${slug}`;
          setIsLoadingArticle(true);
          fetch(fetchUrl)
            .then(res => res.json())
            .then(res => {
              if (res.success && res.data) {
                const doc: UnifiedDocument = res.data;
                setSelectedPost({
                  id: doc.id,
                  slug: doc.slug,
                  title: doc.title,
                  excerpt: doc.seoDescription || doc.derivedPlainText?.slice(0, 160) || '',
                  author: doc.author || 'گُردیه',
                  category: 'راهنمای خرید',
                  coverImage: doc.coverImage,
                  publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString('fa-IR') : 'پیش‌نویس',
                  readingTimeMinutes: Math.max(2, Math.ceil((doc.derivedPlainText?.length || 500) / 450)),
                  tags: ['پیش‌نمایش'],
                  blocks: doc.blocks,
                });
              }
            })
            .catch(() => {})
            .finally(() => setIsLoadingArticle(false));
        }
      }
    } catch {}
  }, [allArticles]);

  const handleOpenPost = (post: EnrichedArticle) => {
    setSelectedPost(post);
    if (window.location.pathname !== `/blog/${post.slug}`) {
      window.history.pushState(null, '', `/blog/${post.slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePost = () => {
    setSelectedPost(null);
    if (window.location.pathname !== '/blog') {
      window.history.pushState(null, '', '/blog');
    }
  };

  const categories = ['ALL', 'راهنمای خرید', 'بررسی تکنولوژی', 'آموزشی و کاربردی'];

  const filteredPosts = allArticles.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Find connected product if article is opened
  const connectedProduct = selectedPost?.connectedProductId
    ? products.find(p => p.id === selectedPost.connectedProductId)
    : undefined;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-4 sm:p-6 lg:p-8 font-sans text-right max-w-7xl mx-auto transition-colors duration-300">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <button onClick={onBackToHome} className="hover:text-[var(--text-main)] transition-colors">
            گُردیه
          </button>
          <span>/</span>
          <span className="text-[var(--text-main)] font-medium">بلاگ گُردیه</span>
          {selectedPost && (
            <>
              <span>/</span>
              <span className="text-[var(--text-main)] truncate max-w-xs">{selectedPost.title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onOpenContentStudio && (
            <button
              onClick={onOpenContentStudio}
              className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 text-[var(--accent-primary)]" />
              نوشتن مقاله با الگوهای گُردیه
            </button>
          )}

          <button
            onClick={onBackToHome}
            className="px-3 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] text-xs flex items-center gap-1.5 border border-[var(--border-color)] transition-colors"
          >
            <span>برگشت به فروشگاه</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SINGLE POST VIEW */}
      {selectedPost ? (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
          <button
            onClick={handleClosePost}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            برگشت به همه‌ی مقاله‌ها
          </button>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--badge-bg)] text-[var(--accent-primary)] border border-[var(--border-color)]">
                {selectedPost.category}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-main)] leading-[1.5]">
              {selectedPost.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] pt-2 border-y border-[var(--border-color)] py-3 tabular-nums">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                {selectedPost.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                {selectedPost.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                زمان خواندن: {selectedPost.readingTimeMinutes} دقیقه
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {selectedPost.coverImage && (
            <div className="rounded-3xl overflow-hidden border border-[var(--border-color)] max-h-[440px] bg-[var(--bg-card)] shadow-sm">
              <img
                src={selectedPost.coverImage}
                alt={selectedPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Body: Render either BlockRenderer or plain content */}
          <div className="bg-[var(--bg-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--border-color)] leading-[1.85] text-sm text-[var(--text-main)] space-y-5 font-sans shadow-sm">
            {selectedPost.blocks && selectedPost.blocks.length > 0 ? (
              <BlockRenderer
                blocks={selectedPost.blocks}
                products={productsMap}
                onAddToCart={onAddToCart}
                onOpenProduct={onSelectProduct}
              />
            ) : (
              <div className="whitespace-pre-line leading-[1.85] text-[var(--text-secondary)]">
                {selectedPost.content}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Tag className="w-4 h-4 text-[var(--text-muted)]" />
            {selectedPost.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Connected Product Conversion Box */}
          {connectedProduct && (
            <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img
                  src={connectedProduct.image}
                  alt={connectedProduct.title}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-[var(--text-muted)] tracking-normal">
                    محصول مرتبط با این راهنما
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-main)] line-clamp-1">{connectedProduct.title}</h3>
                  <p className="text-[13px] text-[var(--accent-primary)] tabular-nums font-bold">
                    قیمت: {(connectedProduct.retailPrice || (connectedProduct as any).sellPrice || 0).toLocaleString()} تومان
                  </p>
                </div>
              </div>

              {onSelectProduct && (
                <button
                  onClick={() => onSelectProduct(connectedProduct)}
                  className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center gap-2 shadow-sm shrink-0 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  مشاهده محصول و شرایط تست
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* BLOG ARCHIVE LIST */
        <div className="space-y-8">
          {/* Clean Botanical Hero Banner */}
          <div className="relative rounded-[28px] overflow-hidden min-h-[200px] sm:min-h-[220px] p-6 sm:p-10 flex items-end border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
            <div className="relative z-10 max-w-2xl space-y-3 text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] text-xs font-medium">
                مجله و راهنمای انتخاب گُردیه
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] leading-[1.45]">
                بلاگ گُردیه
              </h1>
              <p className="text-[13px] sm:text-sm text-[var(--text-secondary)] leading-[1.85]">
                راهنمای خرید و یادداشت‌های واقعی قبل از خرید گجت؛ عددها و محدودیت‌ها رو ساده و بی‌اغراق می‌نویسیم.
              </p>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="جستجو توی مقاله‌ها و راهنماها..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pr-10 pl-4 py-2.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-[var(--text-muted)]" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold shadow-sm'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                  }`}
                >
                  {cat === 'ALL' ? 'همه‌ی مقاله‌ها' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <article
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="group cursor-pointer rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-active)] overflow-hidden shadow-sm hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Image Niche */}
                <div className="relative h-48 overflow-hidden bg-[var(--bg-card)]">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-[var(--bg-surface)]/95 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-[var(--accent-primary)] border border-[var(--border-color)]">
                    {post.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2 leading-[1.7]">
                      {post.title}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-[1.8]">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <div className="flex items-center gap-2 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>{post.readingTimeMinutes} دقیقه</span>
                    </div>
                    <span className="text-[var(--accent-primary)] group-hover:translate-x-[-4px] transition-transform flex items-center gap-1 font-bold">
                      خواندن مقاله
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
