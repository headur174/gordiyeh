// Gordiyeh Theme Management System
// Supports 4 Complete Themes across 2 Design Identities:
// 1. Modern Violet (Iranian Arch Hero): violet-dark & violet-light
// 2. Organic Botanical Forest (Full-Bleed Split Hero): forest-light & forest-dark

export type GordiyehTheme = 'violet-dark' | 'violet-light' | 'forest-light' | 'forest-dark';

export interface GordiyehThemeMeta {
  id: GordiyehTheme;
  label: string;
  shortLabel: string;
  identity: 'violet' | 'forest';
  identityLabel: string;
  isDark: boolean;
  bgSwatch: string;
  accentSwatch: string;
}

export const GORDIYEH_THEMES: GordiyehThemeMeta[] = [
  {
    id: 'violet-dark',
    label: 'تیره مدرن (بنفش + طاق ایرانی)',
    shortLabel: 'مدرن تیره',
    identity: 'violet',
    identityLabel: 'هویت مدرن بنفش',
    isDark: true,
    bgSwatch: '#090712',
    accentSwatch: '#7C3AED',
  },
  {
    id: 'violet-light',
    label: 'روشن مدرن (سفید یاسی + طاق ایرانی)',
    shortLabel: 'مدرن روشن',
    identity: 'violet',
    identityLabel: 'هویت مدرن بنفش',
    isDark: false,
    bgSwatch: '#FAF8FF',
    accentSwatch: '#6D28D9',
  },
  {
    id: 'forest-dark',
    label: 'تیره ارگانیک (سبز زغالی + بنر عریض)',
    shortLabel: 'ارگانیک تیره',
    identity: 'forest',
    identityLabel: 'هویت ارگانیک سبز',
    isDark: true,
    bgSwatch: '#09120E',
    accentSwatch: '#1F7A54',
  },
  {
    id: 'forest-light',
    label: 'روشن ارگانیک (آلاباستر + بنر عریض)',
    shortLabel: 'ارگانیک روشن',
    identity: 'forest',
    identityLabel: 'هویت ارگانیک سبز',
    isDark: false,
    bgSwatch: '#F3EDE0',
    accentSwatch: '#1E4635',
  },
];

const THEME_STORAGE_KEY = 'gordiyeh_theme';

export function isValidTheme(val: string | null): val is GordiyehTheme {
  return (
    val === 'violet-dark' ||
    val === 'violet-light' ||
    val === 'forest-light' ||
    val === 'forest-dark'
  );
}

export function isDarkTheme(theme: GordiyehTheme): boolean {
  return theme === 'violet-dark' || theme === 'forest-dark';
}

export function getThemeMeta(theme: GordiyehTheme): GordiyehThemeMeta {
  return GORDIYEH_THEMES.find((t) => t.id === theme) || GORDIYEH_THEMES[3];
}

export function getInitialTheme(): GordiyehTheme {
  if (typeof window === 'undefined') return 'forest-light';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(saved)) {
      return saved;
    }
  } catch {}
  return 'forest-light';
}

export function applyTheme(theme: GordiyehTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  const themeColors: Record<GordiyehTheme, string> = {
    'violet-dark': '#090712',
    'violet-light': '#FAF8FF',
    'forest-dark': '#09120E',
    'forest-light': '#F3EDE0',
  };

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', themeColors[theme]);
  }
}

