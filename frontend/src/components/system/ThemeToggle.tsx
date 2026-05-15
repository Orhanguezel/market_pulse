'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { IconSun, IconMoon } from '@/components/ui/icons';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // SSR ile localStorage farkından doğan hydration mismatch'i önlemek için
  // mount olana kadar nötr/şeffaf bir placeholder render ediyoruz.
  useEffect(() => setMounted(true), []);

  const baseCls = `inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--gm-border-soft)] bg-[var(--gm-bg)]/40 text-[var(--gm-gold)] hover:text-[var(--gm-gold-light)] hover:bg-[var(--gm-bg)]/70 transition-colors ${className}`;

  if (!mounted) {
    return <span aria-hidden="true" className={baseCls} />;
  }

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={isDark ? 'Açık tema' : 'Koyu tema'}
      onClick={toggleTheme}
      className={baseCls}
    >
      {isDark ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
    </button>
  );
}
