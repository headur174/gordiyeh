// Gordiyeh Theme Management System (Unified Botanical Forest Identity)
// 100% Forest Design System across Storefront & Admin:
// - forest-light: Warm Alabaster & Forest Green (Default)
// - forest-dark: Deep Charcoal Forest & Emerald

export type GordiyehTheme = 'forest-light' | 'forest-dark';

export interface GordiyehThemeMeta {
  id: GordiyehTheme;
  label: string;
  shortLabel: string;
  identity: 'forest';
  identityLabel: string;
  isDark: boolean;
  bgSwatch: string;
  accentSwatch: string;
}

export const GORDIYEH_THEMES: GordiyehThemeMeta[] = [
  {
    id: 'forest-light',
    label: 'روشن فراست (آلاباستر و سبز جنگلی)',
    shortLabel: 'روشن فراست',
    identity: 'forest',
    identityLabel: 'هویت یکپارچه فراست',
    isDark: false,
    bgSwatch: '#F3EDE0',
    accentSwatch: '#1E4635',
  },
  {
    id: 'forest-dark',
    label: 'تیره فراست (سبز زغالی و زمردی)',
    shortLabel: 'تیره فراست',
    identity: 'forest',
    identityLabel: 'هویت یکپارچه فراست',
    isDark: true,
    bgSwatch: '#09120E',
    accentSwatch: '#1F7A54',
  },
];

const THEME_STORAGE_KEY = 'gordiyeh_theme';

export function isValidTheme(val: string | null): val is GordiyehTheme {
  return val === 'forest-light' || val === 'forest-dark';
}

export function isDarkTheme(theme: GordiyehTheme): boolean {
  return theme === 'forest-dark';
}

export function getThemeMeta(theme: GordiyehTheme): GordiyehThemeMeta {
  return GORDIYEH_THEMES.find((t) => t.id === theme) || GORDIYEH_THEMES[0];
}

export function getSystemPreferredTheme(): GordiyehTheme {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'forest-dark';
    }
  }
  return 'forest-light';
}

export function hasSavedThemePreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(saved) || saved === 'violet-dark' || saved === 'violet-light';
  } catch {
    return false;
  }
}

export function getInitialTheme(): GordiyehTheme {
  if (typeof window === 'undefined') return 'forest-light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    // Graceful migration from legacy violet themes to unified Forest
    if (saved === 'violet-dark') {
      localStorage.setItem(THEME_STORAGE_KEY, 'forest-dark');
      return 'forest-dark';
    }
    if (saved === 'violet-light') {
      localStorage.setItem(THEME_STORAGE_KEY, 'forest-light');
      return 'forest-light';
    }
    if (isValidTheme(saved)) {
      return saved;
    }
  } catch {}
  return getSystemPreferredTheme();
}

export function applyTheme(theme: GordiyehTheme, persist = true): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }

  const themeColors: Record<GordiyehTheme, string> = {
    'forest-light': '#F3EDE0',
    'forest-dark': '#09120E',
  };

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', themeColors[theme]);
  }
}

export function watchSystemTheme(onChange?: (theme: GordiyehTheme) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    if (!hasSavedThemePreference()) {
      const next: GordiyehTheme = e.matches ? 'forest-dark' : 'forest-light';
      applyTheme(next, false);
      onChange?.(next);
    }
  };
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
