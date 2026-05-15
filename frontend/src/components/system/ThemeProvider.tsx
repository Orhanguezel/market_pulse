'use client';

// Tema mode toggle (light/dark) — SSR-aware.
//
// Öncelik sırası:
//  1. Kullanıcı toggle yaptıysa → localStorage('theme_mode_override') kullanılır.
//  2. Yoksa → SSR'da HTML'in `data-theme` attribute'undan okunur (DB-driven).
//  3. Hiçbiri yoksa → 'light' fallback.
//
// SSR'daki değer `app/layout.tsx`'te `detectThemeMode(tokens)` ile DB'den gelir.
// Yani admin paneldeki active_theme_preset doğal olarak respect edilir.

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

const OVERRIDE_KEY = 'theme_mode_override';

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  resetToServerTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
  resetToServerTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** SSR'dan gelen mode'u oku (HTML root'unda). */
function readServerTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' ? 'dark' : 'light';
}

/** localStorage'da kullanıcının manuel override'ı varsa döner. */
function readUserOverride(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    // Eski "theme" key'i (her zaman 'dark' set ediyordu) — migration: kullanıcı tercihi
    // değilse temizle. Yeni OVERRIDE_KEY'i kontrol et.
    const legacy = window.localStorage.getItem('theme');
    if (legacy) {
      window.localStorage.removeItem('theme');
    }

    const v = window.localStorage.getItem(OVERRIDE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* localStorage erişilemez (private mode vb.) */
  }
  return null;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial state: SSR'da set edilmiş data-theme'i kullan (hydration mismatch yok).
  const [theme, setTheme] = useState<Theme>(() => readServerTheme());
  const [mounted, setMounted] = useState(false);

  // Mount sonrası: kullanıcı override'ı varsa onu uygula
  useEffect(() => {
    const override = readUserOverride();
    if (override && override !== theme) {
      setTheme(override);
    }
    setMounted(true);
    // theme intentionally excluded — yalnızca mount olduğunda override kontrolü
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme değiştikçe HTML attribute'unu güncelle
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(OVERRIDE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  /** Kullanıcının override'ını temizler ve server (DB) temasına geri döner. */
  const resetToServerTheme = useCallback(() => {
    try {
      window.localStorage.removeItem(OVERRIDE_KEY);
    } catch {
      /* ignore */
    }
    setTheme(readServerTheme());
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, resetToServerTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
