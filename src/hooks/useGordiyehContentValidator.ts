import { useMemo, useCallback } from 'react';
import {
  BANNED_WORDS_DICTIONARY,
  lintGordiyehCopy,
} from '../data/contentGuidelines';
import { ContentBlock, derivePlainTextFromBlocks, DocumentKind, DocumentStatus } from '../types/cms';

export type ValidationSeverity = 'error' | 'warning';

export interface ContentValidationIssue {
  id: string;
  severity: ValidationSeverity;
  section: 'بخش ۲ (لحن و سبک)' | 'بخش ۱۱ (چک‌لیست پیش از ذخیره)' | 'سئو و ساختار';
  title: string;
  message: string;
  suggestion?: string;
}

export interface GordiyehValidatorInput {
  title: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  plainText?: string;
  blocks?: ContentBlock[];
  kind?: DocumentKind | 'product';
  status?: DocumentStatus;
}

export interface ToneMismatchHit {
  phrase: string;
  toneType: 'کتابی/اداری' | 'صمیمی‌ـخیابانی';
  suggestion: string;
}

export interface GordiyehContentValidationResult {
  wordCount: number;
  sentenceCount: number;
  avgSentenceWords: number;
  maxSentenceWords: number;
  longSentences: string[];
  exclamationCount: number;
  emojiCount: number;
  bannedHits: Array<{ word: string; category: string; suggestion: string }>;
  toneViolations: ToneMismatchHit[];
  arabicCharsFound: string[];
  hasPlaceholders: boolean;
  hasHonestLimitation: boolean;
  seoTitleLength: number;
  seoDescLength: number;
  errors: ContentValidationIssue[];
  warnings: ContentValidationIssue[];
  allIssues: ContentValidationIssue[];
  score: number;
  canPublish: boolean;
  hasBlockingErrors: boolean;
  hasWarnings: boolean;
  validateBeforeSave: () => {
    allowed: boolean;
    requiresWarningConfirmation: boolean;
    errors: ContentValidationIssue[];
    warnings: ContentValidationIssue[];
    summary: string;
  };
}

const COLLOQUIAL_TONE_RULES: ToneMismatchHit[] = [
  { phrase: 'می‌باشد', toneType: 'کتابی/اداری', suggestion: 'هست / ـه' },
  { phrase: 'نمی‌باشد', toneType: 'کتابی/اداری', suggestion: 'نیست' },
  { phrase: 'می‌گردد', toneType: 'کتابی/اداری', suggestion: 'می‌شه' },
  { phrase: 'گردید', toneType: 'کتابی/اداری', suggestion: 'شد' },
  { phrase: 'بفرمایید', toneType: 'کتابی/اداری', suggestion: 'بزنید / انتخاب کنید' },
  { phrase: 'فرمایید', toneType: 'کتابی/اداری', suggestion: 'انجام بدید' },
  { phrase: 'بنمایید', toneType: 'کتابی/اداری', suggestion: 'بکنید' },
  { phrase: 'می‌نماید', toneType: 'کتابی/اداری', suggestion: 'می‌کنه' },
  { phrase: 'مجدداً', toneType: 'کتابی/اداری', suggestion: 'دوباره' },
  { phrase: 'می‌خواهید', toneType: 'کتابی/اداری', suggestion: 'می‌خواید' },
  { phrase: 'می‌دهد', toneType: 'کتابی/اداری', suggestion: 'می‌ده' },
  { phrase: 'می‌کند', toneType: 'کتابی/اداری', suggestion: 'می‌کنه' },
  { phrase: 'می‌شود', toneType: 'کتابی/اداری', suggestion: 'می‌شه' },
  { phrase: 'می‌خوای', toneType: 'صمیمی‌ـخیابانی', suggestion: 'می‌خواید (مخاطب «شما»)' },
  { phrase: 'می‌تونی', toneType: 'صمیمی‌ـخیابانی', suggestion: 'می‌تونید (مخاطب «شما»)' },
  { phrase: 'بگیری', toneType: 'صمیمی‌ـخیابانی', suggestion: 'بگیرید' },
  { phrase: 'ببینی', toneType: 'صمیمی‌ـخیابانی', suggestion: 'ببینید' },
  { phrase: 'خفن', toneType: 'صمیمی‌ـخیابانی', suggestion: 'کاربردی و دقیق' },
  { phrase: 'باحال', toneType: 'صمیمی‌ـخیابانی', suggestion: 'راحت / کاربردی' },
];

export function useGordiyehContentValidator(
  input: GordiyehValidatorInput | null | undefined
): GordiyehContentValidationResult {
  const effectivePlainText = useMemo(() => {
    if (!input) return '';
    if (typeof input.plainText === 'string' && input.plainText.trim().length > 0) {
      return input.plainText;
    }
    if (input.blocks && input.blocks.length > 0) {
      return derivePlainTextFromBlocks(input.blocks);
    }
    return '';
  }, [input]);

  const analysis = useMemo(() => {
    const title = (input?.title || '').trim();
    const slug = (input?.slug || '').trim();
    const seoTitle = (input?.seoTitle || '').trim();
    const seoDescription = (input?.seoDescription || '').trim();
    const kind = input?.kind || 'article';
    const status = input?.status || 'DRAFT';

    const combinedText = `${title}\n${seoTitle}\n${seoDescription}\n${effectivePlainText}`.trim();

    // Base lint report from shared guidelines
    const baseLint = lintGordiyehCopy({
      title,
      seoTitle,
      seoDescription,
      plainText: effectivePlainText,
      kind,
    });

    // Word and sentence calculations (Section 2)
    const words = combinedText
      .split(/\s+/)
      .map(w => w.trim())
      .filter(Boolean);
    const wordCount = words.length;

    const sentences = effectivePlainText
      .split(/[.!؟?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const sentenceCount = sentences.length;
    const sentenceWordCounts = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
    const totalSentenceWords = sentenceWordCounts.reduce((acc, n) => acc + n, 0);
    const avgSentenceWords = sentenceCount > 0 ? Math.round(totalSentenceWords / sentenceCount) : 0;
    const maxSentenceWords = sentenceWordCounts.length > 0 ? Math.max(...sentenceWordCounts) : 0;

    // Tone violations (Section 2: محاوره‌ی مؤدب)
    const toneViolations: ToneMismatchHit[] = [];
    for (const rule of COLLOQUIAL_TONE_RULES) {
      const regex = new RegExp(`(^|[\\s،؛.«»(])${rule.phrase}($|[\\s،؛.!؟?»)])`, 'u');
      if (regex.test(combinedText)) {
        toneViolations.push(rule);
      }
    }

    // Placeholders check (Section 11 / 8) - ignore numeric reference citations like [1]
    const hasPlaceholders = /\[\s*\]|\[(?![0-9]+\])[^\]]{1,40}\]|FIXME|TODO/i.test(combinedText);

    // Honest limitations check
    const hasHonestLimitation =
      /برای چه کسی (?:مناسب )?نیست|چه کسی .* نخره|لازم نیست|مناسب نیست|نخره/.test(combinedText);

    const seoTitleLength = (seoTitle || title).length;
    const seoDescLength = seoDescription.length;

    const errors: ContentValidationIssue[] = [];
    const warnings: ContentValidationIssue[] = [];

    // 1. Title & Slug structural checks
    if (!title || title.length < 3) {
      errors.push({
        id: 'missing_title',
        severity: 'error',
        section: 'سئو و ساختار',
        title: 'عنوان اصلی (H1) خالی یا خیلی کوتاهه',
        message: 'عنوان سند باید دست‌کم ۳ کاراکتر و با نام طبیعی موضوع نوشته بشه.',
      });
    }

    if (input?.slug !== undefined && (!slug || !/^[a-z0-9-]+$/.test(slug))) {
      errors.push({
        id: 'invalid_slug',
        severity: 'error',
        section: 'سئو و ساختار',
        title: 'اسلاگ آدرس عمومی معتبر نیست',
        message: 'اسلاگ باید فقط شامل حروف کوچک انگلیسی، عدد و خط تیره باشه.',
        suggestion: 'مثلاً: smart-lighting-guide',
      });
    }

    // 2. Banned words (Section 2) -> ERROR
    if (baseLint.bannedHits.length > 0) {
      for (const hit of baseLint.bannedHits) {
        errors.push({
          id: `banned_${hit.word}`,
          severity: 'error',
          section: 'بخش ۲ (لحن و سبک)',
          title: `واژه‌ی ممنوع: «${hit.word}» (${hit.category})`,
          message: `استفاده از «${hit.word}» طبق دستورالعمل گُردیه مجاز نیست.`,
          suggestion: hit.suggestion,
        });
      }
    }

    // 3. Emoji ban (Section 2) -> ERROR
    if (baseLint.emojiCount > 0) {
      errors.push({
        id: 'emoji_ban',
        severity: 'error',
        section: 'بخش ۲ (لحن و سبک)',
        title: `ایموجی در متن (${baseLint.emojiCount} مورد)`,
        message: 'ایموجی در متن صفحات سایت و مقاله‌های گُردیه ممنوعه.',
        suggestion: 'ایموجی‌ها رو حذف کنید و به‌جاشون جمله‌ی روشن بنویسید.',
      });
    }

    // 4. Exclamation mark limit (Section 2: حداکثر ۱ علامت تعجب) -> ERROR if > 1
    if (baseLint.exclamationCount > 1) {
      errors.push({
        id: 'exclamation_limit',
        severity: 'error',
        section: 'بخش ۲ (لحن و سبک)',
        title: `تعداد علامت تعجب بیش از حده (${baseLint.exclamationCount} عدد)`,
        message: 'طبق بخش ۲ دستورالعمل، در کل متن حداکثر ۱ علامت تعجب مجازه (ترجیحاً صفر).',
        suggestion: 'علامت‌های تعجب اضافه رو با نقطه جایگزین کنید.',
      });
    }

    // 5. Arabic letters (Section 11 / 8) -> ERROR
    if (baseLint.arabicCharsFound.length > 0) {
      errors.push({
        id: 'arabic_chars',
        severity: 'error',
        section: 'بخش ۱۱ (چک‌لیست پیش از ذخیره)',
        title: 'نویسه‌ی عربی (ي یا ك) در متن هست',
        message: `موارد پیداشده: ${baseLint.arabicCharsFound.join(' و ')}.`,
        suggestion: 'از دکمه‌ی «اصلاح خودکار ي و ك» استفاده کنید.',
      });
    }

    // 6. Placeholders check (Section 11 / 8) -> ERROR
    if (hasPlaceholders) {
      errors.push({
        id: 'unfinished_placeholders',
        severity: 'error',
        section: 'بخش ۱۱ (چک‌لیست پیش از ذخیره)',
        title: 'جای‌خالی یا نشانگر ناتمام در متن مونده',
        message: 'عبارت داخل کروشه [...] یا نشانگر ناتمام (TODO/FIXME) پیش از ذخیره باید کامل یا حذف بشه.',
      });
    }

    // 7. Tone consistency (Section 2: محاوره‌ی مؤدب) -> WARNING
    if (toneViolations.length > 0) {
      const sample = toneViolations.slice(0, 3).map(t => `«${t.phrase}» ← ${t.suggestion}`).join(' | ');
      warnings.push({
        id: 'tone_consistency',
        severity: 'warning',
        section: 'بخش ۲ (لحن و سبک)',
        title: `ناهمخوانی با لحن محاوره‌ی مؤدب (${toneViolations.length} مورد)`,
        message: `فعل یا عبارت کتابی/خیابانی در متن دیده شد: ${sample}`,
        suggestion: 'مخاطب «شما» با فعل «ـید» و سوم‌شخص مخفف (می‌ده، می‌شه، هست) باشه.',
      });
    }

    // 8. Sentence length > 25 words (Section 2) -> WARNING
    if (baseLint.longSentences.length > 0) {
      warnings.push({
        id: 'long_sentences',
        severity: 'warning',
        section: 'بخش ۲ (لحن و سبک)',
        title: `${baseLint.longSentences.length} جمله بیش از ۲۵ کلمه دارن`,
        message: `طولانی‌ترین جمله ${maxSentenceWords} کلمه‌ست (سقف مجاز: ۲۵ کلمه، میانگین مطلوب: ۱۲ تا ۱۸ کلمه).`,
        suggestion: 'جمله‌های طولانی رو به دو جمله‌ی کوتاه‌تر بشکنید.',
      });
    } else if (wordCount >= 40 && avgSentenceWords > 18) {
      warnings.push({
        id: 'avg_sentence_high',
        severity: 'warning',
        section: 'بخش ۲ (لحن و سبک)',
        title: `میانگین طول جمله بالاست (${avgSentenceWords} کلمه)`,
        message: 'میانگین استاندارد جمله‌ها بین ۱۲ تا ۱۸ کلمه‌ست.',
        suggestion: 'برای خوانایی بیشتر، بعضی جمله‌ها رو کوتاه‌تر کنید.',
      });
    }

    // 9. Minimum content length check for publishing -> WARNING
    if (status === 'PUBLISHED' && kind === 'article' && wordCount < 45) {
      warnings.push({
        id: 'short_article',
        severity: 'warning',
        section: 'بخش ۱۱ (چک‌لیست پیش از ذخیره)',
        title: `متن مقاله کوتاهه (${wordCount} کلمه)`,
        message: 'برای پاسخ کامل به سؤال خریدار و رعایت ساختار استاندارد، حداقل یک پاسخ کوتاه، تیتر H2 و بخش محدودیت‌ها رو کامل کنید.',
      });
    }

    // 10. Mandatory limitation section (Section 11 / 8) -> WARNING
    if (kind !== 'page' && !hasHonestLimitation) {
      warnings.push({
        id: 'missing_limitation',
        severity: 'warning',
        section: 'بخش ۱۱ (چک‌لیست پیش از ذخیره)',
        title: 'بخش «برای چه کسی مناسب نیست / نخره» پیدا نشد',
        message: 'طبق قانون ۳ و چک‌لیست پیش از تحویل، محدودیت محصول یا شرایطی که خریدش توصیه نمی‌شه باید روشن نوشته بشه.',
      });
    }

    // 11. SEO Title & Description bounds (Section 11 / 6) -> WARNING
    if (seoTitleLength > 60) {
      warnings.push({
        id: 'seo_title_len',
        severity: 'warning',
        section: 'سئو و ساختار',
        title: `عنوان سئو بیشتر از ۶۰ کاراکتره (${seoTitleLength} کاراکتر)`,
        message: 'عنوان سئو حداکثر باید ۶۰ کاراکتر باشه تا توی نتایج جستجو بریده نشه.',
      });
    }
    if (seoDescLength > 0 && (seoDescLength < 120 || seoDescLength > 155)) {
      warnings.push({
        id: 'seo_desc_len',
        severity: 'warning',
        section: 'سئو و ساختار',
        title: `طول توضیحات متا خارج از بازه‌ی ۱۲۰ تا ۱۵۵ کاراکتره (${seoDescLength} کاراکتر)`,
        message: 'توضیحات متا برای نمایش استاندارد در نتایج جستجو بهتره بین ۱۲۰ تا ۱۵۵ کاراکتر باشه.',
      });
    } else if (status === 'PUBLISHED' && seoDescLength === 0) {
      warnings.push({
        id: 'seo_desc_missing',
        severity: 'warning',
        section: 'سئو و ساختار',
        title: 'توضیحات متا (Meta Description) خالیه',
        message: 'پیش از انتشار، خلاصه‌ی ۱۲۰ تا ۱۵۵ کاراکتری صفحه رو توی تنظیمات سئو وارد کنید.',
      });
    }

    const allIssues = [...errors, ...warnings];
    const hasBlockingErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0;
    const canPublish = !hasBlockingErrors;

    // Penalty-adjusted score combined with baseLint checks
    const penalty = errors.length * 14 + warnings.length * 5;
    const score = Math.max(0, Math.min(100, Math.round((baseLint.score + Math.max(0, 100 - penalty)) / 2)));

    return {
      wordCount,
      sentenceCount,
      avgSentenceWords,
      maxSentenceWords,
      longSentences: baseLint.longSentences,
      exclamationCount: baseLint.exclamationCount,
      emojiCount: baseLint.emojiCount,
      bannedHits: baseLint.bannedHits,
      toneViolations,
      arabicCharsFound: baseLint.arabicCharsFound,
      hasPlaceholders,
      hasHonestLimitation,
      seoTitleLength,
      seoDescLength,
      errors,
      warnings,
      allIssues,
      score,
      canPublish,
      hasBlockingErrors,
      hasWarnings,
    };
  }, [input, effectivePlainText]);

  const validateBeforeSave = useCallback(() => {
    const status = input?.status || 'DRAFT';
    const isPublishing = status === 'PUBLISHED';

    if (analysis.errors.length > 0 && isPublishing) {
      return {
        allowed: false,
        requiresWarningConfirmation: false,
        errors: analysis.errors,
        warnings: analysis.warnings,
        summary: `${analysis.errors.length} خطای الزامی پیش از انتشار باید اصلاح بشن.`,
      };
    }

    if (analysis.errors.length > 0 || analysis.warnings.length > 0) {
      return {
        allowed: true,
        requiresWarningConfirmation: true,
        errors: analysis.errors,
        warnings: analysis.warnings,
        summary:
          analysis.errors.length > 0
            ? `${analysis.errors.length} خطا و ${analysis.warnings.length} هشدار در پیش‌نویس دیده شد؛ می‌تونید اصلاح کنید یا به عنوان پیش‌نویس ذخیره کنید.`
            : `${analysis.warnings.length} هشدار لحن یا سئو پیدا شد؛ بررسی کنید یا ذخیره رو تایید کنید.`,
      };
    }

    return {
      allowed: true,
      requiresWarningConfirmation: false,
      errors: [],
      warnings: [],
      summary: 'متن با قواعد بخش ۲ و ۱۱ دستورالعمل گُردیه همخوانی داره.',
    };
  }, [analysis, input?.status]);

  // Keep reference to BANNED_WORDS_DICTIONARY clean
  void BANNED_WORDS_DICTIONARY;

  return {
    ...analysis,
    validateBeforeSave,
  };
}
