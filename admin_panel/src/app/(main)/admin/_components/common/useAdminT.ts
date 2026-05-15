'use client';

import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useMemo } from 'react';
import { useAdminTranslations, type TranslateFn } from '@/i18n';

/**
 * Convenience hook: reads admin locale from preferences store
 * and returns a translation function bound to that locale.
 *
 * Usage: const t = useAdminT();
 */
export function useAdminT(prefix?: string): TranslateFn {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  return useMemo(() => {
    const p = String(prefix || 'admin').trim();
    if (!p) return t;

    return (key, params, fallback) => {
      const k = String(key || '').trim();
      const fullKey = k && !k.startsWith('admin.') ? `${p}.${k}` : k;
      return t(fullKey, params, fallback);
    };
  }, [t, prefix]);
}
