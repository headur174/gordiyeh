import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/800.css';
import App from './App.tsx';
import './index.css';
import { getInitialTheme, applyTheme, watchSystemTheme } from './utils/themeManager';

// Initialize Gordiyeh Forest theme (saved preference or system prefers-color-scheme)
applyTheme(getInitialTheme(), false);
watchSystemTheme();

// Safeguard against iframe/sandbox environments where fetch is getter-only
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      const origFetch = window.fetch ? window.fetch.bind(window) : undefined;
      let activeFetch = origFetch;
      Object.defineProperty(window, 'fetch', {
        get: () => activeFetch,
        set: (fn) => { activeFetch = fn; },
        configurable: true,
        enumerable: true,
      });
    }
  } catch {
    // Graceful fallback
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
