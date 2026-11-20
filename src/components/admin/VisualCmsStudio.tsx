import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UnifiedDocument,
  DocumentKind,
  DocumentStatus,
  ContentBlock,
  TextColorToken,
  derivePlainTextFromBlocks,
  normalizePersianText,
} from '../../types/cms';
import { CanonicalProduct } from '../../types';
import { BlockRenderer } from '../cms/BlockRenderer';
import {
  GORDIYEH_SYSTEM_INSTRUCTION_V1,
  BANNED_WORDS_DICTIONARY,
  CONTENT_TYPE_TEMPLATES,
  ProductInfoCard,
  buildProductPromptFromCard,
  lintGordiyehCopy,
} from '../../data/contentGuidelines';
import {
  useGordiyehContentValidator,
  ContentValidationIssue,
} from '../../hooks/useGordiyehContentValidator';
import { FAQEngine } from '../storefront/FAQEngine';
import {
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  ShoppingBag,
  List,
  Heading,
  MessageSquare,
  Search,
  Upload,
  Globe,
  RefreshCw,
  BookOpen,
  Copy,
  Check,
  ShieldCheck,
  Wand2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SiteConfig,
  loadSiteConfig,
  saveSiteConfig,
} from '../../utils/cmsStore';

interface VisualCmsStudioProps {
  products: CanonicalProduct[];
  onSelectProductDetails?: (product: CanonicalProduct) => void;
}

function mapCategoryToGuidelineSlug(category?: string): ProductInfoCard['categorySlug'] {
  if (!category) return 'digital';
  if (category.includes('خانگی')) return 'smart-home';
  if (category.includes('سفر') || category.includes('کمپ')) return 'travel-camping';
  if (category.includes('زیبایی') || category.includes('سلامت')) return 'beauty-health';
  return 'digital';
}

export const VisualCmsStudio: React.FC<VisualCmsStudioProps> = ({ products }) => {
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'article' | 'page'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [studioMode, setStudioMode] = useState<'documents' | 'guidelines' | 'sliders'>('documents');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadSiteConfig());

  // Selected document for editing (null = list view)
  const [editingDoc, setEditingDoc] = useState<UnifiedDocument | null>(null);
  const [editorSubTab, setEditorSubTab] = useState<'builder' | 'seo' | 'preview' | 'guidelines'>('builder');
  const [saveLoading, setSaveLoading] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [preSaveGate, setPreSaveGate] = useState<{
    mode: 'blocked' | 'confirm';
    summary: string;
    errors: ContentValidationIssue[];
    warnings: ContentValidationIssue[];
  } | null>(null);

  // Content Playbook & Generator State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPrefillProductId, setSelectedPrefillProductId] = useState<string>(products[0]?.id || '');
  const [productCardForm, setProductCardForm] = useState<ProductInfoCard>(() => {
    const p = products[0];
    if (p) {
      return {
        nameAndModel: p.title,
        brand: p.brand || 'گُردیه',
        categorySlug: mapCategoryToGuidelineSlug(p.category),
        priceToman: `${new Intl.NumberFormat('fa-IR').format(p.retailPrice)} تومان`,
        warranty: p.warranty || '',
        testWindow: p.testExchangeBox?.testWindow || '',
        testCovered: p.testExchangeBox?.covered || '',
        testNotCovered: p.testExchangeBox?.notCovered || '',
        confirmedSpecs: (p.keyFeatures || []).join(' • '),
        usageSituations: (p.usageContexts || []).join(' • '),
        limitationsAndNotSuitableFor: p.notSuitableFor || '',
        safetyWarnings: '',
        ourTestNotes: '',
      };
    }
    return {
      nameAndModel: '',
      brand: '',
      categorySlug: 'digital',
      priceToman: '',
      warranty: '',
      testWindow: '',
      testCovered: '',
      testNotCovered: '',
      confirmedSpecs: '',
      usageSituations: '',
      limitationsAndNotSuitableFor: '',
      safetyWarnings: '',
      ourTestNotes: '',
    };
  });

  const [sandboxDraftTitle, setSandboxDraftTitle] = useState('راهنمای خرید مینی پروژکتور: لومن واقعی ANSI چیه؟');
  const [sandboxSeoTitle, setSandboxSeoTitle] = useState('راهنمای خرید مینی پروژکتور: لومن واقعی ANSI چیه؟');
  const [sandboxSeoDesc, setSandboxSeoDesc] = useState(
    'چرا عددهای روی جعبه‌ی پروژکتورها با هم مقایسه نمی‌شن، تفاوت ANSI و LED لومن چیه و چه کسی پروژکتور پرتابل نخره.'
  );
  const [sandboxPlainText, setSandboxPlainText] = useState(
    'اگه می‌خواید توی اتاق کم‌نور فیلم ببینید، فقط به عدد ANSI لومن نگاه کنید. برای اتاق روشن و زیر نور آفتاب، پروژکتور پرتابل کوچیک مناسب نیست.'
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeImageBlockId, setActiveImageBlockId] = useState<string | null>(null);

  const showBanner = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2500);
    } catch {
      showBanner('info', 'امکان دسترسی خودکار به کلیپ‌بورد نبود؛ متن رو دستی انتخاب و کپی کنید.');
    }
  };

  const applyProductToCardForm = (productId: string) => {
    setSelectedPrefillProductId(productId);
    const p = products.find((item) => item.id === productId);
    if (!p) return;
    setProductCardForm({
      nameAndModel: p.title,
      brand: p.brand || 'گُردیه',
      categorySlug: mapCategoryToGuidelineSlug(p.category),
      priceToman: `${new Intl.NumberFormat('fa-IR').format(p.retailPrice)} تومان`,
      warranty: p.warranty || '',
      testWindow: p.testExchangeBox?.testWindow || '',
      testCovered: p.testExchangeBox?.covered || '',
      testNotCovered: p.testExchangeBox?.notCovered || '',
      confirmedSpecs: (p.keyFeatures || []).join(' • '),
      usageSituations: (p.usageContexts || []).join(' • '),
      limitationsAndNotSuitableFor: p.notSuitableFor || '',
      safetyWarnings: '',
      ourTestNotes: '',
    });
  };

  // Products lookup dictionary for BlockRenderer
  const productMap = useMemo(() => {
    const map: Record<string, CanonicalProduct> = {};
    for (const p of products) {
      map[p.id] = p;
    }
    return map;
  }, [products]);

  // Live Prompt from Card
  const promptResult = useMemo(() => buildProductPromptFromCard(productCardForm), [productCardForm]);

  // Live Copy Lint Report + Full Hook Validation (Section 2 & 11)
  const lintReport = useMemo(() => {
    if (editingDoc) {
      return lintGordiyehCopy({
        title: editingDoc.title,
        seoTitle: editingDoc.seoTitle,
        seoDescription: editingDoc.seoDescription,
        plainText: derivePlainTextFromBlocks(editingDoc.blocks),
        kind: editingDoc.kind,
      });
    }
    return lintGordiyehCopy({
      title: sandboxDraftTitle,
      seoTitle: sandboxSeoTitle,
      seoDescription: sandboxSeoDesc,
      plainText: sandboxPlainText,
      kind: 'article',
    });
  }, [editingDoc, sandboxDraftTitle, sandboxSeoTitle, sandboxSeoDesc, sandboxPlainText]);

  const validatorInput = useMemo(
    () =>
      editingDoc
        ? {
            title: editingDoc.title,
            slug: editingDoc.slug,
            seoTitle: editingDoc.seoTitle,
            seoDescription: editingDoc.seoDescription,
            blocks: editingDoc.blocks,
            kind: editingDoc.kind,
            status: editingDoc.status,
          }
        : {
            title: sandboxDraftTitle,
            seoTitle: sandboxSeoTitle,
            seoDescription: sandboxSeoDesc,
            plainText: sandboxPlainText,
            kind: 'article' as const,
            status: 'PUBLISHED' as const,
          },
    [editingDoc, sandboxDraftTitle, sandboxSeoTitle, sandboxSeoDesc, sandboxPlainText]
  );

  const validator = useGordiyehContentValidator(validatorInput);

  useEffect(() => {
    setPreSaveGate(null);
  }, [editingDoc?.id, editingDoc?.title, editingDoc?.slug, editingDoc?.status, editingDoc?.seoTitle, editingDoc?.seoDescription, editingDoc?.blocks]);

  // Fetch admin documents
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/documents', {
        headers: {
          'x-admin-role': 'ADMIN',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch CMS documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filtered documents for list view
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (activeTab !== 'all' && d.kind !== activeTab) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = d.title.toLowerCase().includes(q);
        const matchSlug = d.slug.toLowerCase().includes(q);
        const matchAuthor = d.author.toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchAuthor) return false;
      }
      return true;
    });
  }, [documents, activeTab, statusFilter, searchQuery]);

  // Create new document (with optional starter template blocks)
  const handleCreateNew = (kind: DocumentKind, starterBlocks?: ContentBlock[], starterTitle?: string) => {
    const newDoc: UnifiedDocument = {
      id: `doc_${Date.now()}`,
      kind,
      slug: kind === 'article' ? `new-article-${Date.now().toString().slice(-4)}` : `new-page-${Date.now().toString().slice(-4)}`,
      title: starterTitle || (kind === 'article' ? 'عنوان مقاله‌ی جدید' : 'عنوان صفحه‌ی جدید'),
      status: 'DRAFT',
      version: 0,
      author: 'تیم گُردیه',
      noindex: false,
      updatedAt: new Date().toISOString(),
      contentModifiedAt: new Date().toISOString(),
      derivedPlainText: '',
      blocks: starterBlocks
        ? starterBlocks.map((b, idx) => ({ ...b, id: `blk_${Date.now()}_${idx}` }))
        : [
            {
              id: `blk_${Date.now()}_1`,
              schemaVersion: 1,
              type: 'heading',
              level: 2,
              text: 'جواب کوتاه یا سؤال خریدار',
            },
            {
              id: `blk_${Date.now()}_2`,
              schemaVersion: 1,
              type: 'paragraph',
              html: 'لید موقعیت ← راه‌حل رو اینجا بنویسید...',
              colorToken: 'default',
            },
          ],
    };

    setEditingDoc(newDoc);
    setEditorSubTab('builder');
    setStudioMode('documents');
    setConflictError(null);
    setFeedbackBanner(null);
  };

  // Add block to editing document
  const handleAddBlock = (type: ContentBlock['type']) => {
    if (!editingDoc) return;
    const blockId = `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let newBlock: ContentBlock;

    switch (type) {
      case 'heading':
        newBlock = {
          id: blockId,
          schemaVersion: 1,
          type: 'heading',
          level: 2,
          text: 'تیتر سؤال خریدار',
        };
        break;
      case 'paragraph':
        newBlock = {
          id: blockId,
          schemaVersion: 1,
          type: 'paragraph',
          html: 'متن پاراگراف رو با لحن محاوره‌ی مؤدب بنویسید...',
          colorToken: 'default',
        };
        break;
      case 'list':
        newBlock = {
          id: blockId,
          schemaVersion: 1,
          type: 'list',
          ordered: false,
          items: ['مورد اول', 'مورد دوم'],
        };
        break;
      case 'image':
        newBlock = {
          id: blockId,
          schemaVersion: 1,
          type: 'image',
          url: products[0]?.image || '/assets/gordiyeh-logo-emblem.png',
          alt: 'تصویر گجت گُردیه',
          width: 800,
          height: 500,
          caption: 'توضیح تصویر',
        };
        break;
      case 'product_card':
        newBlock = {
          id: blockId,
          schemaVersion: 1,
          type: 'product_card',
          productId: products[0]?.id || 'prod_ported_projector',
        };
        break;
      case 'callout':
        newBlock = {
          id: blockId,
          schemaVersion: 1,
          type: 'callout',
          intent: 'info',
          title: 'قاعده‌ی عملی',
          text: 'نکته‌ی کاربردی یا محدودیت استفاده رو اینجا بنویسید.',
        };
        break;
    }

    setEditingDoc({
      ...editingDoc,
      blocks: [...editingDoc.blocks, newBlock],
    });
  };

  const handleInsertQuestionHeading = (question: string, documentedAnswer?: string) => {
    if (editingDoc) {
      const ts = Date.now();
      const rand = Math.random().toString(36).substring(2, 6);
      const addedBlocks: ContentBlock[] = [
        { id: `blk_${ts}_${rand}_h`, schemaVersion: 1, type: 'heading', level: 2, text: question },
      ];
      if (documentedAnswer && documentedAnswer.trim()) {
        addedBlocks.push({
          id: `blk_${ts}_${rand}_p`,
          schemaVersion: 1,
          type: 'paragraph',
          html: documentedAnswer.trim(),
          colorToken: 'default',
        });
      }
      setEditingDoc({
        ...editingDoc,
        blocks: [...editingDoc.blocks, ...addedBlocks],
      });
      setEditorSubTab('builder');
      showBanner(
        'success',
        documentedAnswer
          ? 'تیتر H2 سؤال و پاسخ مستند محصول به انتهای سند اضافه شدن.'
          : 'تیتر H2 سؤال به انتهای سند اضافه شد.'
      );
    } else {
      handleCopyText(`q_${question}`, documentedAnswer ? `${question}\n${documentedAnswer}` : question);
    }
  };

  const handleApplyTemplateBlocks = (starterBlocks: ContentBlock[]) => {
    if (!editingDoc) return;
    const cloned = starterBlocks.map((b, i) => ({
      ...b,
      id: `blk_${Date.now()}_${i}`,
    }));
    setEditingDoc({
      ...editingDoc,
      blocks: [...editingDoc.blocks, ...cloned],
    });
    setEditorSubTab('builder');
    showBanner('success', 'بلوک‌های الگو به انتهای سند اضافه شدن.');
  };

  const handleNormalizeActiveDocArabicChars = () => {
    if (!editingDoc) return;
    const cleanedBlocks = editingDoc.blocks.map((b) => {
      if (b.type === 'heading') return { ...b, text: normalizePersianText(b.text) };
      if (b.type === 'paragraph') return { ...b, html: normalizePersianText(b.html) };
      if (b.type === 'list') return { ...b, items: b.items.map(normalizePersianText) };
      if (b.type === 'callout') {
        return {
          ...b,
          title: b.title ? normalizePersianText(b.title) : b.title,
          text: normalizePersianText(b.text),
        };
      }
      if (b.type === 'image') {
        return {
          ...b,
          alt: normalizePersianText(b.alt),
          caption: b.caption ? normalizePersianText(b.caption) : b.caption,
        };
      }
      return b;
    });

    setEditingDoc({
      ...editingDoc,
      title: normalizePersianText(editingDoc.title),
      seoTitle: editingDoc.seoTitle ? normalizePersianText(editingDoc.seoTitle) : editingDoc.seoTitle,
      seoDescription: editingDoc.seoDescription
        ? normalizePersianText(editingDoc.seoDescription)
        : editingDoc.seoDescription,
      blocks: cleanedBlocks,
    });
    showBanner('success', 'همه‌ی حرف‌های عربی (ي و ك) توی سند فعلی به فارسی تبدیل شدن.');
  };

  // Move block up or down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!editingDoc) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingDoc.blocks.length) return;

    const newBlocks = [...editingDoc.blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setEditingDoc({
      ...editingDoc,
      blocks: newBlocks,
    });
  };

  // Remove block
  const handleRemoveBlock = (index: number) => {
    if (!editingDoc) return;
    const newBlocks = editingDoc.blocks.filter((_, idx) => idx !== index);
    setEditingDoc({
      ...editingDoc,
      blocks: newBlocks,
    });
  };

  // Update block content
  const handleUpdateBlock = (index: number, updatedBlock: ContentBlock) => {
    if (!editingDoc) return;
    const newBlocks = [...editingDoc.blocks];
    newBlocks[index] = updatedBlock;
    setEditingDoc({
      ...editingDoc,
      blocks: newBlocks,
    });
  };

  // Trigger file upload for an image block
  const handleUploadImageForBlock = (blockId: string) => {
    setActiveImageBlockId(blockId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDoc || !activeImageBlockId) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: {
          'x-admin-role': 'ADMIN',
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const uploaded = data.data || data;
        const blockIdx = editingDoc.blocks.findIndex((b) => b.id === activeImageBlockId);
        if (blockIdx !== -1) {
          const currentImg = editingDoc.blocks[blockIdx] as any;
          handleUpdateBlock(blockIdx, {
            ...currentImg,
            url: uploaded.url,
            width: uploaded.width,
            height: uploaded.height,
          });
          showBanner('success', 'تصویر با فرمت WebP آپلود و اندازه‌گیری شد.');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showBanner('error', `خطا در آپلود تصویر: ${errData.error || 'فرمت یا حجم تصویر مجاز نیست'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      showBanner('error', 'ارتباط با سرور آپلود برقرار نشد.');
    } finally {
      setUploadLoading(false);
      setActiveImageBlockId(null);
    }
  };

  // Save document with pre-save Gordiyeh validation + OCC (handles 409 Conflict)
  const handleSaveDocument = async (bypassWarnings = false) => {
    if (!editingDoc) return;

    const validationCheck = validator.validateBeforeSave();
    if (!validationCheck.allowed) {
      setPreSaveGate({
        mode: 'blocked',
        summary: validationCheck.summary,
        errors: validationCheck.errors,
        warnings: validationCheck.warnings,
      });
      showBanner('error', validationCheck.summary);
      return;
    }

    if (validationCheck.requiresWarningConfirmation && !bypassWarnings) {
      setPreSaveGate({
        mode: 'confirm',
        summary: validationCheck.summary,
        errors: validationCheck.errors,
        warnings: validationCheck.warnings,
      });
      return;
    }

    setPreSaveGate(null);
    setSaveLoading(true);
    setConflictError(null);
    setFeedbackBanner(null);

    try {
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-role': 'ADMIN',
        },
        body: JSON.stringify(editingDoc),
      });

      if (res.status === 409) {
        setConflictError(
          'تداخل در ذخیره: این سند توسط کاربر یا تب دیگه‌ای تغییر کرده. برای جلوگیری از رونویسی، اول سندها رو دوباره بارگذاری کنید.'
        );
        return;
      }

      if (res.ok) {
        const result = await res.json();
        setEditingDoc(result.document);
        showBanner('success', 'سند ذخیره شد و اطلاعات سئو همگام‌سازی شدن.');
        fetchDocuments();
      } else {
        const err = await res.json().catch(() => ({}));
        showBanner('error', `خطا در ذخیره: ${err.error || 'اطلاعات سند کامل یا معتبر نیست'}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      showBanner('error', 'خطا در ارسال اطلاعات به سرور.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Reusable Interactive Content Pattern & Linter Studio
  const renderContentPlaybookStudio = (isInsideEditor: boolean) => (
    <div className="space-y-6 text-right font-sans">
      {/* 1. 11-Point Automated Lint Report */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>
                پایشگر خودکار دستورالعمل گُردیه ({isInsideEditor ? 'سند در حال ویرایش' : 'پیش‌نویس آزمایشی'})
              </span>
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              بررسی واژه‌های ممنوع، حروف عربی، طول جمله، علامت تعجب، ایموجی و طول فیلدهای سئو.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isInsideEditor && lintReport.arabicCharsFound.length > 0 && (
              <button
                type="button"
                onClick={handleNormalizeActiveDocArabicChars}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-500/25"
              >
                اصلاح خودکار ي و ك
              </button>
            )}
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                lintReport.score >= 85
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              }`}
            >
              امتیاز: {lintReport.score}% ({lintReport.passedCount}/{lintReport.totalCount})
            </span>
          </div>
        </div>

        {/* Sandbox inputs when outside document editor */}
        {!isInsideEditor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-[var(--text-muted)]">تیتر نمونه برای بررسی</label>
              <input
                type="text"
                value={sandboxDraftTitle}
                onChange={(e) => setSandboxDraftTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
              />
              <label className="block text-[11px] font-bold text-[var(--text-muted)]">عنوان سئو (تا ۶۰ کاراکتر)</label>
              <input
                type="text"
                value={sandboxSeoTitle}
                onChange={(e) => setSandboxSeoTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
              />
              <label className="block text-[11px] font-bold text-[var(--text-muted)]">توضیحات متا (۱۲۰ تا ۱۵۵ کاراکتر)</label>
              <textarea
                rows={2}
                value={sandboxSeoDesc}
                onChange={(e) => setSandboxSeoDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <label className="block text-[11px] font-bold text-[var(--text-muted)]">متن پیش‌نویس برای کنترل لحن و واژه‌های ممنوع</label>
              <textarea
                rows={6}
                value={sandboxPlainText}
                onChange={(e) => setSandboxPlainText(e.target.value)}
                className="w-full flex-1 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-main)] leading-relaxed focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Live Metrics from useGordiyehContentValidator (Section 2 & 11) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="text-[11px] text-[var(--text-muted)]">تعداد کلمات و جمله</div>
            <div className="font-mono font-bold text-[var(--text-main)] mt-1">
              {validator.wordCount} کلمه · {validator.sentenceCount} جمله
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="text-[11px] text-[var(--text-muted)]">طول جمله (مطلوب ۱۲–۱۸)</div>
            <div className="font-mono font-bold text-[var(--text-main)] mt-1">
              میانگین {validator.avgSentenceWords} · سقف {validator.maxSentenceWords}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="text-[11px] text-[var(--text-muted)]">تعجب / ایموجی / عربی</div>
            <div className="font-mono font-bold text-[var(--text-main)] mt-1">
              {validator.exclamationCount} ! · {validator.emojiCount} ایموجی · {validator.arabicCharsFound.length} عربی
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="text-[11px] text-[var(--text-muted)]">وضعیت پیش از ذخیره</div>
            <div className="font-bold mt-1 text-[var(--text-main)]">
              <span className={validator.errors.length > 0 ? 'text-red-400' : 'text-emerald-400'}>
                {validator.errors.length} خطا
              </span>
              <span className="mx-1.5 text-[var(--text-muted)]">·</span>
              <span className={validator.warnings.length > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {validator.warnings.length} هشدار
              </span>
            </div>
          </div>
        </div>

        {/* Checklist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {lintReport.checks.map((chk) => (
            <div
              key={chk.id}
              className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-start gap-2.5 text-xs"
            >
              {chk.status === 'PASS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : chk.status === 'WARN' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold text-[var(--text-main)]">{chk.label}</div>
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">{chk.details}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Itemized Validator Errors & Warnings */}
        {validator.allIssues.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-[var(--text-main)]">
              گزارش خطاها و هشدارهای پیش از ذخیره ({validator.allIssues.length} مورد):
            </div>
            <div className="grid grid-cols-1 gap-2">
              {validator.allIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    issue.severity === 'error'
                      ? 'bg-red-950/20 border-red-500/40'
                      : 'bg-amber-950/20 border-amber-500/35'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`font-bold flex items-center gap-1.5 ${issue.severity === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                      {issue.severity === 'error' ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                      <span>{issue.title}</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">{issue.section}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-main)] leading-relaxed">{issue.message}</div>
                  {issue.suggestion && (
                    <div className="text-[11px] text-[var(--text-muted)]">پیشنهاد اصلاح: {issue.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banned Words Hit Details */}
        {lintReport.bannedHits.length > 0 && (
          <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/40 space-y-2 text-xs">
            <div className="font-bold text-red-300">واژه‌های ممنوع پیدا شده در متن:</div>
            <div className="space-y-1.5">
              {lintReport.bannedHits.map((hit, i) => (
                <div key={i} className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-main)]/60 p-2 rounded-lg">
                  <span className="font-bold text-red-200">
                    «{hit.word}» ({hit.category})
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">پیشنهاد: {hit.suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Info Card -> Prompt Builder (نداریم = نمی‌نویسیم) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>ساخت پرامپت استاندارد از کارت اطلاعات محصول (نداریم = نمی‌نویسیم)</span>
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              یک محصول رو انتخاب یا اطلاعاتش رو پر کنید تا پرامپت کامل با دستورالعمل ۱٫۰ و قفل محدودیت‌ها ساخته بشه.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPrefillProductId}
              onChange={(e) => applyProductToCardForm(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden max-w-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  پر کردن از: {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">اسم و مدل دقیق محصول *</label>
            <input
              type="text"
              value={productCardForm.nameAndModel}
              onChange={(e) => setProductCardForm({ ...productCardForm, nameAndModel: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1">برند</label>
              <input
                type="text"
                value={productCardForm.brand}
                onChange={(e) => setProductCardForm({ ...productCardForm, brand: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--text-muted)] mb-1">مهلت تست (از جعبه‌ی محصول)</label>
              <input
                type="text"
                value={productCardForm.testWindow || ''}
                onChange={(e) => setProductCardForm({ ...productCardForm, testWindow: e.target.value })}
                placeholder="مثلاً: ثبت نشده یا ۷ روز"
                className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">مشخصات فنی تأییدشده (فقط عددهای دارای سند)</label>
            <textarea
              rows={2}
              value={productCardForm.confirmedSpecs}
              onChange={(e) => setProductCardForm({ ...productCardForm, confirmedSpecs: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
            />
          </div>

          <div>
            <label className="block text-[11px] text-[var(--text-muted)] mb-1">محدودیت‌ها و «برای چه کسی مناسب نیست» (اجباری)</label>
            <textarea
              rows={2}
              value={productCardForm.limitationsAndNotSuitableFor}
              onChange={(e) => setProductCardForm({ ...productCardForm, limitationsAndNotSuitableFor: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)]"
            />
          </div>
        </div>

        {promptResult.missingFields.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/40 text-xs text-amber-200 space-y-1">
            <div className="font-bold">موردهای ناقص در کارت (هوش مصنوعی اجازه حدس زدن نداره):</div>
            <div>{promptResult.missingFields.join(' • ')}</div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-main)]">پرامپت آماده‌ی کپی برای تولید متن محصول</span>
            <button
              type="button"
              onClick={() => handleCopyText('product_prompt', promptResult.prompt)}
              className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedId === 'product_prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'product_prompt' ? 'کپی شد' : 'کپی پرامپت کامل'}</span>
            </button>
          </div>
          <pre className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto font-sans">
            {promptResult.prompt}
          </pre>
        </div>
      </div>

      {/* 3. Starter Templates & Buyer Question Bank */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>الگوهای آماده‌ی صفحه‌های سایت</span>
          </h4>
          <div className="space-y-3">
            {CONTENT_TYPE_TEMPLATES.map((tpl) => (
              <div key={tpl.kind} className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[var(--text-main)]">{tpl.title}</span>
                  {tpl.starterBlocks && (
                    <button
                      type="button"
                      onClick={() =>
                        isInsideEditor
                          ? handleApplyTemplateBlocks(tpl.starterBlocks!)
                          : handleCreateNew(tpl.kind === 'terms' ? 'page' : 'article', tpl.starterBlocks, tpl.title)
                      }
                      className="px-2.5 py-1 rounded-lg bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-bold cursor-pointer hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                    >
                      {isInsideEditor ? '+ درج در این سند' : '+ ساخت سند با الگو'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{tpl.description}</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-[var(--text-muted)]">
                  {tpl.structureSteps.map((st, idx) => (
                    <li key={idx}>{st}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
          <FAQEngine
            mode="manager"
            products={products}
            onInsertToDocument={(question, documentedAnswer) => handleInsertQuestionHeading(question, documentedAnswer)}
          />
        </div>
      </div>

      {/* 4. System Instruction v1.0 & Banned Words Reference */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <h4 className="text-sm font-bold text-[var(--text-main)]">
            متن کامل دستورالعمل محتوایی گُردیه (System Instruction v1.0)
          </h4>
          <button
            type="button"
            onClick={() => handleCopyText('system_instruction', GORDIYEH_SYSTEM_INSTRUCTION_V1)}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
          >
            {copiedId === 'system_instruction' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'system_instruction' ? 'دستورالعمل کپی شد' : 'کپی دستورالعمل کامل'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-sans">
          {GORDIYEH_SYSTEM_INSTRUCTION_V1}
        </pre>

        <div>
          <h5 className="text-xs font-bold text-[var(--text-main)] mb-2">
            مرجع سریع واژه‌های ممنوع و پیشنهاد جایگزین ({BANNED_WORDS_DICTIONARY.length} مورد)
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pl-1">
            {BANNED_WORDS_DICTIONARY.map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[11px] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-red-300">«{item.word}»</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.category}</span>
                </div>
                <div className="text-[var(--text-muted)]">{item.suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // VIEW: LIST OF DOCUMENTS OR GUIDELINES MODE
  // -------------------------------------------------------------
  if (!editingDoc) {
    return (
      <div className="space-y-6 text-right font-sans rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] p-5 sm:p-6 shadow-sm">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-primary)]" />
              <span>مدیریت محتوا و راهنمای نگارش گُردیه</span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              ویرایش مقاله‌ها، صفحه‌های ثابت، اتصال محصول به متن و ابزار ساخت و بررسی لحن گُردیه
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setSiteConfig(loadSiteConfig());
                setStudioMode(studioMode === 'sliders' ? 'documents' : 'sliders');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                studioMode === 'sliders'
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--border-active)]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>
                {studioMode === 'sliders' ? 'بازگشت به فهرست سندها' : 'مدیریت اسلایدرها و ویترین'}
              </span>
            </button>
            <button
              onClick={() => setStudioMode(studioMode === 'guidelines' ? 'documents' : 'guidelines')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                studioMode === 'guidelines'
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[var(--border-active)]'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>
                {studioMode === 'guidelines' ? 'بازگشت به فهرست سندها' : 'الگوی تولید محتوا و دستورالعمل گُردیه'}
              </span>
            </button>
            <button
              onClick={() => handleCreateNew('article')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white accent-gradient-bg hover:opacity-95 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>مقاله‌ی جدید</span>
            </button>
            <button
              onClick={() => handleCreateNew('page')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>صفحه‌ی ثابت جدید</span>
            </button>
          </div>
        </div>

        {feedbackBanner && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                : feedbackBanner.type === 'error'
                ? 'bg-red-950/30 border-red-500/50 text-red-200'
                : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)]'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
        )}

        {studioMode === 'sliders' ? (() => {
          const sliders = {
            showDiscounts: true,
            showNewest: true,
            showBestsellers: false,
            deduplicateMode: 'auto' as const,
            discountProductIds: [] as string[],
            newestProductIds: [] as string[],
            bestsellerProductIds: [] as string[],
            ...(siteConfig.homepageSliders || {}),
          };

          const updateSliders = (patch: Partial<NonNullable<SiteConfig['homepageSliders']>>) => {
            const updated: SiteConfig = {
              ...siteConfig,
              homepageSliders: {
                ...sliders,
                ...patch,
              },
            };
            setSiteConfig(updated);
            saveSiteConfig(updated);
            showBanner('success', 'تنظیمات اسلایدرها ذخیره و روی ویترین اعمال شد.');
          };

          const toggleProductInSlider = (
            listKey: 'discountProductIds' | 'newestProductIds' | 'bestsellerProductIds',
            productId: string
          ) => {
            const current = sliders[listKey] || [];
            const next = current.includes(productId)
              ? current.filter((id) => id !== productId)
              : [...current, productId];
            updateSliders({ [listKey]: next });
          };

          return (
            <div className="space-y-6">
              {/* 1. Slider Visibility Controls */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)]">
                    نمایش یا مخفی‌سازی اسلایدرهای صفحه اصلی
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    می‌توانید هر اسلایدر را به صورت مستقل در صفحه اصلی نمایش دهید یا مخفی کنید.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { key: 'showDiscounts' as const, title: 'کالاهای دارای تخفیف', desc: 'نمایش بعد از کارت‌های معرفی' },
                    { key: 'showNewest' as const, title: 'تازه‌ترین‌ها', desc: 'نمایش بین دسته‌ها و کاربردها' },
                    { key: 'showBestsellers' as const, title: 'پرفروش‌ترین‌ها', desc: 'مناسب بعد از رشد سفارش‌ها' },
                  ].map((item) => {
                    const enabled = Boolean(sliders[item.key]);
                    return (
                      <div
                        key={item.key}
                        className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-[var(--text-main)]">{item.title}</div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.desc}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSliders({ [item.key]: !enabled })}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                            enabled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {enabled ? 'آشکار' : 'مخفی'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Deduplication Mode */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)]">
                    مدیریت تکرار کالا بین اسلایدرها (خودکار یا دستی)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    حالت خودکار کالاهای نمایش‌داده‌شده در اسلایدر قبلی را حذف می‌کند؛ در حالت دستی کنترل دقیق محصولات هر اسلایدر در اختیار شماست.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSliders({ deduplicateMode: 'auto' })}
                    className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                      sliders.deduplicateMode !== 'manual'
                        ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--text-main)] font-bold'
                        : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="text-xs font-bold">۱. جلوگیری خودکار از تکرار</div>
                    <div className="text-[11px] font-normal mt-1 opacity-85">
                      کالای نمایش‌داده‌شده در یک اسلایدر، به‌صورت خودکار در اسلایدر بعدی نمایش داده نمی‌شود.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSliders({ deduplicateMode: 'manual' })}
                    className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                      sliders.deduplicateMode === 'manual'
                        ? 'bg-[var(--accent-soft)] border-[var(--border-active)] text-[var(--text-main)] font-bold'
                        : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    <div className="text-xs font-bold">۲. مدیریت دستی هر اسلایدر</div>
                    <div className="text-[11px] font-normal mt-1 opacity-85">
                      هیچ محصولی خودکار حذف نمی‌شود؛ می‌توانید محصولات هر اسلایدر را دستی تیک بزنید یا مستقل بگذارید.
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Manual Per-Slider Selection Grid */}
              {sliders.deduplicateMode === 'manual' && (
                <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">
                      انتخاب دستی محصولات هر اسلایدر
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        updateSliders({
                          discountProductIds: [],
                          newestProductIds: [],
                          bestsellerProductIds: [],
                        })
                      }
                      className="text-xs text-[var(--accent-text)] hover:underline cursor-pointer"
                    >
                      بازنشانی به لیست پیش‌فرض هر اسلایدر
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'discountProductIds' as const, title: 'کالاهای دارای تخفیف' },
                      { key: 'newestProductIds' as const, title: 'تازه‌ترین‌ها' },
                      { key: 'bestsellerProductIds' as const, title: 'پرفروش‌ترین‌ها' },
                    ].map((group) => {
                      const selectedIds = sliders[group.key] || [];
                      return (
                        <div
                          key={group.key}
                          className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-color)]">
                            <span>{group.title}</span>
                            <span className="text-[11px] text-[var(--accent-text)]">
                              {selectedIds.length > 0 ? `${selectedIds.length} مورد` : 'پیش‌فرض'}
                            </span>
                          </div>
                          <div className="max-h-52 overflow-y-auto space-y-1.5 pl-1">
                            {products.map((prod) => {
                              const checked = selectedIds.includes(prod.id);
                              return (
                                <label
                                  key={`${group.key}-${prod.id}`}
                                  className="flex items-center gap-2 text-xs text-[var(--text-main)] cursor-pointer py-0.5"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleProductInSlider(group.key, prod.id)}
                                    className="rounded border-[var(--border-color)]"
                                  />
                                  <span className="truncate">{prod.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })() : studioMode === 'guidelines' ? (
          renderContentPlaybookStudio(false)
        ) : (
          <>
            {/* Filters and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'all' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  همه ({documents.length})
                </button>
                <button
                  onClick={() => setActiveTab('article')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'article' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  مقاله‌ها ({documents.filter((d) => d.kind === 'article').length})
                </button>
                <button
                  onClick={() => setActiveTab('page')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'page' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  صفحه‌های ثابت ({documents.filter((d) => d.kind === 'page').length})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="PUBLISHED">منتشرشده</option>
                  <option value="DRAFT">پیش‌نویس</option>
                </select>

                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="جستجوی عنوان یا اسلاگ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Documents Table */}
            {loading ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)]">در حال دریافت سندها...</div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
                <div className="text-sm font-bold text-[var(--text-main)]">سندی پیدا نشد</div>
                <p className="text-xs text-[var(--text-muted)]">محتوایی با مشخصات جستجوی شما وجود نداره.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)]">
                        <th className="py-3 px-4 font-semibold">عنوان سند</th>
                        <th className="py-3 px-4 font-semibold">نوع</th>
                        <th className="py-3 px-4 font-semibold">اسلاگ (URL)</th>
                        <th className="py-3 px-4 font-semibold">وضعیت</th>
                        <th className="py-3 px-4 font-semibold">تعداد بلوک‌ها</th>
                        <th className="py-3 px-4 font-semibold">نسخه</th>
                        <th className="py-3 px-4 font-semibold text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                          <td className="py-3 px-4 font-bold text-[var(--text-main)] max-w-xs truncate">
                            {doc.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-mono text-[var(--text-muted)]">
                              {doc.kind === 'article' ? 'مقاله' : 'صفحه‌ی ثابت'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[var(--accent-primary)] dir-ltr text-right">
                            /{doc.kind === 'article' ? 'blog' : 'page'}/{doc.slug}
                          </td>
                          <td className="py-3 px-4">
                            {doc.status === 'PUBLISHED' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>منتشرشده</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>پیش‌نویس</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            {doc.blocks.length} بلوک
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-muted)]">
                            v{doc.version}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setEditingDoc(doc);
                                setEditorSubTab('builder');
                              }}
                              className="px-3 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--accent-primary)] hover:text-white hover:bg-[var(--accent-primary)] transition-colors cursor-pointer text-[11px] font-semibold"
                            >
                              ویرایش و صفحه‌آرایی
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: VISUAL STUDIO EDITOR
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 text-right font-sans pb-16">
      {/* Hidden file input for sharp WebP image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Editor Header Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingDoc(null);
              fetchDocuments();
            }}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            ← بازگشت به فهرست
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]">
                {editingDoc.kind === 'article' ? 'مقاله‌ی وبلاگ' : 'صفحه‌ی ثابت'} • v{editingDoc.version}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                شناسه: {editingDoc.id}
              </span>
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)] mt-1 truncate max-w-md">
              {editingDoc.title}
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditorSubTab('guidelines')}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              validator.errors.length === 0 && validator.warnings.length === 0
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : validator.errors.length > 0
                ? 'bg-red-950/20 border-red-500/40 text-red-300'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              پایش لحن: {validator.score}% · {validator.errors.length} خطا · {validator.warnings.length} هشدار
            </span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 min-h-[40px] rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs">
            <span className="text-[var(--text-muted)]">وضعیت:</span>
            <select
              value={editingDoc.status}
              onChange={(e) => setEditingDoc({ ...editingDoc, status: e.target.value as DocumentStatus })}
              className="bg-transparent font-bold text-[var(--text-main)] focus:outline-hidden cursor-pointer"
            >
              <option value="DRAFT">پیش‌نویس (DRAFT)</option>
              <option value="PUBLISHED">منتشرشده (PUBLISHED)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleSaveDocument(false)}
            disabled={saveLoading}
            className="px-5 py-2 min-h-[40px] rounded-xl text-xs font-bold text-white accent-gradient-bg hover:opacity-95 shadow-md shadow-[var(--accent-primary)]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {saveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Save className="w-3.5 h-3.5 shrink-0" />}
            <span>ذخیره‌ی سند</span>
          </button>
        </div>
      </div>

      {/* Pre-Save Content Validator Gate Panel (Errors block Publish; Warnings require explicit confirmation) */}
      {preSaveGate && (
        <div
          className={`p-4 rounded-2xl border space-y-3 text-xs ${
            preSaveGate.mode === 'blocked'
              ? 'bg-red-950/25 border-red-500/50 text-red-100'
              : 'bg-amber-950/25 border-amber-500/45 text-amber-100'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-bold flex items-center gap-2">
              {preSaveGate.mode === 'blocked' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{preSaveGate.summary}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditorSubTab('guidelines')}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                بازبینی کامل در پایشگر
              </button>
              {preSaveGate.mode === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleSaveDocument(true)}
                  disabled={saveLoading}
                  className="px-4 py-2 min-h-[40px] rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  تایید و ذخیره‌ی سند
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreSaveGate(null)}
                className="px-3 py-2 min-h-[40px] rounded-xl bg-transparent border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer whitespace-nowrap shrink-0"
              >
                بستن
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[...preSaveGate.errors, ...preSaveGate.warnings].slice(0, 6).map((iss) => (
              <div
                key={iss.id}
                className="p-2.5 rounded-xl bg-[var(--bg-main)]/80 border border-[var(--border-color)] space-y-0.5"
              >
                <div className={`font-bold ${iss.severity === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                  {iss.title}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{iss.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict / Feedback Banner */}
      {conflictError && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/50 text-red-200 text-xs flex items-center justify-between gap-3">
          <span>{conflictError}</span>
          <button
            onClick={() => {
              setConflictError(null);
              fetchDocuments();
            }}
            className="px-3 py-1 rounded-lg bg-red-800 text-white font-bold cursor-pointer"
          >
            بارگذاری مجدد از سرور
          </button>
        </div>
      )}

      {feedbackBanner && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
              : feedbackBanner.type === 'error'
              ? 'bg-red-950/30 border-red-500/50 text-red-200'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-main)]'
          }`}
        >
          {feedbackBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackBanner.text}</span>
        </div>
      )}

      {/* Editor Sub-Tabs (Builder vs SEO vs Live Preview vs Guidelines) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-color)] pb-2 text-xs">
        <button
          onClick={() => setEditorSubTab('builder')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
            editorSubTab === 'builder'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          ویرایشگر بلوک‌ها (Block Studio)
        </button>

        <button
          onClick={() => setEditorSubTab('seo')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            editorSubTab === 'seo'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>تنظیمات سئو و متادیتا</span>
        </button>

        <button
          onClick={() => setEditorSubTab('preview')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            editorSubTab === 'preview'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>پیش‌نمایش زنده خریدار (WYSIWYG)</span>
        </button>

        <button
          onClick={() => setEditorSubTab('guidelines')}
          className={`px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            editorSubTab === 'guidelines'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>الگوی تولید محتوا و پایش لحن</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 1: BLOCK BUILDER STUDIO */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'builder' && (
        <div className="space-y-6">
          {/* Main Document Title & Slug Input */}
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--text-main)] mb-1">
                عنوان اصلی سند (H1 یکتای صفحه) *
              </label>
              <input
                type="text"
                value={editingDoc.title}
                onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                اسلاگ آدرس عمومی (فقط حروف کوچک انگلیسی و خط تیره) *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--text-muted)] dir-ltr">
                  /{editingDoc.kind === 'article' ? 'blog' : 'page'}/
                </span>
                <input
                  type="text"
                  value={editingDoc.slug}
                  onChange={(e) =>
                    setEditingDoc({ ...editingDoc, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
                  }
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-main)] focus:outline-hidden dir-ltr text-right"
                />
              </div>
            </div>
          </div>

          {/* Block Palette Bar */}
          <div className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--text-main)]">افزودن بلوک جدید:</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleAddBlock('heading')}
                className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              >
                <Heading className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>+ تیتر (H2-H4)</span>
              </button>

              <button
                onClick={() => handleAddBlock('paragraph')}
                className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                <span>+ پاراگراف متن</span>
              </button>

              <button
                onClick={() => handleAddBlock('list')}
                className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              >
                <List className="w-3.5 h-3.5 text-sky-400" />
                <span>+ لیست گزینه‌ای</span>
              </button>

              <button
                onClick={() => handleAddBlock('image')}
                className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ تصویر (WebP)</span>
              </button>

              <button
                onClick={() => handleAddBlock('product_card')}
                className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                <span>+ کارت خرید کالا</span>
              </button>

              <button
                onClick={() => handleAddBlock('callout')}
                className="px-3 py-1.5 rounded-xl text-xs bg-[var(--bg-main)] border border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>+ کادر نکته</span>
              </button>
            </div>
          </div>

          {/* Blocks Sequence List */}
          <div className="space-y-4">
            {editingDoc.blocks.map((block, idx) => (
              <div
                key={block.id}
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-active)] transition-all space-y-3 relative group"
              >
                {/* Block Header Control Strip */}
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border-color)] text-[10px]">
                      #{idx + 1} • {block.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveBlock(idx, 'up')}
                      disabled={idx === 0}
                      title="انتقال به بالا"
                      className="p-1 rounded-md hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveBlock(idx, 'down')}
                      disabled={idx === editingDoc.blocks.length - 1}
                      title="انتقال به پایین"
                      className="p-1 rounded-md hover:bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveBlock(idx)}
                      title="حذف بلوک"
                      className="p-1 rounded-md hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-colors cursor-pointer mr-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Specific Block Editor Forms */}
                {block.type === 'heading' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">سطح تیتر:</span>
                      {[2, 3, 4].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => handleUpdateBlock(idx, { ...block, level: lvl as any })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                            block.level === lvl
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                          }`}
                        >
                          H{lvl}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => handleUpdateBlock(idx, { ...block, text: e.target.value })}
                      placeholder="متن تیتر رو بنویسید..."
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-sm font-bold text-[var(--text-main)] focus:outline-hidden"
                    />
                  </div>
                )}

                {block.type === 'paragraph' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[var(--text-muted)]">رنگ متن:</span>
                        {[
                          { token: 'default', label: 'پیش‌فرض' },
                          { token: 'accent', label: 'بنفش اصلی' },
                          { token: 'secondary', label: 'بنفش روشن' },
                          { token: 'muted', label: 'خاکستری' },
                          { token: 'warning', label: 'کهربایی' },
                        ].map((c) => (
                          <button
                            key={c.token}
                            type="button"
                            onClick={() => handleUpdateBlock(idx, { ...block, colorToken: c.token as TextColorToken })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                              (block.colorToken || 'default') === c.token
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>

                      <span className="text-[10px] text-[var(--text-muted)]">
                        تگ‌های مجاز: &lt;a&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={block.html}
                      onChange={(e) => handleUpdateBlock(idx, { ...block, html: e.target.value })}
                      placeholder="متن پاراگراف رو تایپ کنید..."
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-main)] leading-relaxed focus:outline-hidden"
                    />
                  </div>
                )}

                {block.type === 'list' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-muted)]">نوع لیست:</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { ...block, ordered: false })}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          !block.ordered ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                        }`}
                      >
                        نقطه‌ای (Unordered)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { ...block, ordered: true })}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          block.ordered ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                        }`}
                      >
                        شماره‌دار (Ordered)
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {block.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)] font-mono">{itemIdx + 1}.</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...block.items];
                              newItems[itemIdx] = e.target.value;
                              handleUpdateBlock(idx, { ...block, items: newItems });
                            }}
                            className="flex-1 px-3 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newItems = block.items.filter((_, i) => i !== itemIdx);
                              handleUpdateBlock(idx, { ...block, items: newItems });
                            }}
                            className="text-red-400 p-1 hover:bg-red-950/20 rounded cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { ...block, items: [...block.items, 'مورد جدید'] })}
                        className="text-xs text-[var(--accent-primary)] hover:underline pt-1 cursor-pointer block"
                      >
                        + افزودن سطر جدید به لیست
                      </button>
                    </div>
                  </div>
                )}

                {block.type === 'image' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-1">آدرس تصویر *</label>
                        <input
                          type="text"
                          value={block.url}
                          onChange={(e) => handleUpdateBlock(idx, { ...block, url: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden dir-ltr text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-1">متن جایگزین (Alt برای سئو و دسترس‌پذیری) *</label>
                        <input
                          type="text"
                          value={block.alt}
                          onChange={(e) => handleUpdateBlock(idx, { ...block, alt: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-1">عرض (Width px)</label>
                        <input
                          type="number"
                          value={block.width}
                          onChange={(e) => handleUpdateBlock(idx, { ...block, width: parseInt(e.target.value, 10) || 800 })}
                          className="w-full px-3 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-1">ارتفاع (Height px)</label>
                        <input
                          type="number"
                          value={block.height}
                          onChange={(e) => handleUpdateBlock(idx, { ...block, height: parseInt(e.target.value, 10) || 500 })}
                          className="w-full px-3 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleUploadImageForBlock(block.id)}
                          disabled={uploadLoading}
                          className="w-full py-1.5 px-3 rounded-lg bg-[var(--bg-main)] border border-[var(--accent-primary)] hover:bg-[var(--accent-primary)] text-[var(--accent-primary)] hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadLoading ? 'در حال تبدیل و آپلود...' : 'آپلود و تبدیل به WebP'}</span>
                        </button>
                      </div>
                    </div>

                    {block.url && (
                      <div className="w-24 h-16 rounded-lg overflow-hidden border border-[var(--border-color)] mt-2">
                        <img src={block.url} alt={block.alt} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'product_card' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                      انتخاب محصول از کاتالوگ (قیمت و موجودی زنده خوانده می‌شه) *
                    </label>
                    <select
                      value={block.productId}
                      onChange={(e) => handleUpdateBlock(idx, { ...block, productId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (کد: {p.sku})
                        </option>
                      ))}
                    </select>

                    {productMap[block.productId] && (
                      <div className="p-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center gap-3 mt-2">
                        <img
                          src={productMap[block.productId].image}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-[var(--text-main)]">{productMap[block.productId].title}</div>
                          <div className="text-[var(--text-muted)] font-mono">شناسه‌ی کالا: {block.productId}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {block.type === 'callout' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[var(--text-muted)]">نوع پیام:</span>
                      {[
                        { type: 'info', label: 'اطلاع‌رسانی (Info)' },
                        { type: 'warning', label: 'هشدار (Warning)' },
                        { type: 'tip', label: 'قاعده‌ی عملی (Tip)' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleUpdateBlock(idx, { ...block, intent: item.type as any })}
                          className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                            block.intent === item.type
                              ? 'bg-[var(--accent-primary)] text-white'
                              : 'bg-[var(--bg-main)] text-[var(--text-muted)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={(e) => handleUpdateBlock(idx, { ...block, title: e.target.value })}
                      placeholder="عنوان اختیاری کادر..."
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] focus:outline-hidden"
                    />

                    <textarea
                      rows={2}
                      value={block.text}
                      onChange={(e) => handleUpdateBlock(idx, { ...block, text: e.target.value })}
                      placeholder="متن پیام داخل کادر..."
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 2: SEO & METADATA INSPECTOR */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'seo' && (
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
          <h4 className="text-sm font-bold text-[var(--text-main)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
            <span>تنظیمات سئو و متادیتا (Search Engine Metadata)</span>
          </h4>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                <span>عنوان سئو (Title Tag - حداکثر ۶۰ کاراکتر)</span>
                <span className="font-mono">{(editingDoc.seoTitle || editingDoc.title).length}/60</span>
              </div>
              <input
                type="text"
                value={editingDoc.seoTitle || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, seoTitle: e.target.value })}
                placeholder={editingDoc.title}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                <span>توضیحات متا (Meta Description - ایده‌آل ۱۲۰ تا ۱۵۵ کاراکتر)</span>
                <span className="font-mono">{(editingDoc.seoDescription || '').length}/160</span>
              </div>
              <textarea
                rows={3}
                value={editingDoc.seoDescription || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, seoDescription: e.target.value })}
                placeholder="خلاصه‌ی روشن برای نمایش در نتایج جستجو..."
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">نام نویسنده (Author Schema)</label>
                <input
                  type="text"
                  value={editingDoc.author}
                  onChange={(e) => setEditingDoc({ ...editingDoc, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">تصویر شاخص شبکه اجتماعی (og:image)</label>
                <input
                  type="text"
                  value={editingDoc.coverImage || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, coverImage: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden dir-ltr text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                آدرس کنونیکال سفارشی (Canonical URL - فقط در صورت ضرورت)
              </label>
              <input
                type="text"
                value={editingDoc.canonicalUrl || ''}
                onChange={(e) => setEditingDoc({ ...editingDoc, canonicalUrl: e.target.value })}
                placeholder="پیش‌فرض: آدرس همین سند"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-hidden dir-ltr text-right"
              />
            </div>

            <div className="pt-2 border-t border-[var(--border-color)] flex items-center gap-3">
              <input
                type="checkbox"
                id="noindex-checkbox"
                checked={editingDoc.noindex}
                onChange={(e) => setEditingDoc({ ...editingDoc, noindex: e.target.checked })}
                className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="noindex-checkbox" className="text-xs font-semibold text-[var(--text-main)] cursor-pointer">
                عدم ایندکس توسط موتورهای جستجو (noindex) - حذف خودکار از سایت‌مپ و افزودن هدر noindex
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 3: LIVE WYSIWYG PREVIEW */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'preview' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--bg-main)] border border-[var(--border-color)] shadow-xl space-y-6">
          <div className="pb-4 border-b border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--accent-primary)]">
              پیش‌نمایش زنده (رندر همسان با صفحه‌ی عمومی)
            </span>
            <span className="font-mono">
              /{editingDoc.kind === 'article' ? 'blog' : 'page'}/{editingDoc.slug}
            </span>
          </div>

          {/* Document Title (H1) */}
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] leading-tight tracking-tight">
            {editingDoc.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pb-4 border-b border-[var(--border-color)]">
            <span>نویسنده: {editingDoc.author}</span>
            <span>•</span>
            <span>وضعیت: {editingDoc.status === 'PUBLISHED' ? 'منتشرشده' : 'پیش‌نویس'}</span>
          </div>

          {/* Shared BlockRenderer Component */}
          <BlockRenderer
            blocks={editingDoc.blocks}
            products={productMap}
            onAddToCart={(p) => showBanner('info', `پیش‌نمایش افزودن به سبد: ${p.title}`)}
          />
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 4: CONTENT GUIDELINES, PROMPT BUILDER & LINTER */}
      {/* ------------------------------------------------------------- */}
      {editorSubTab === 'guidelines' && renderContentPlaybookStudio(true)}
    </div>
  );
};

