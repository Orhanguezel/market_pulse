// =============================================================
// FILE: src/i18n/useLocaleShort.ts  (DYNAMIC, NO HARDCODED LOCALE LIST)
// =============================================================
'use client';

import { useMemo } from 'react';
import { useResolvedLocale } from '@/i18n';
import { normLocaleTag } from '@/integrations/shared';

export function useLocaleShort(explicitLocale?: string | null): string {
  const resolved = useResolvedLocale(explicitLocale);

  return useMemo(() => {
    // useResolvedLocale zaten activeLocales + defaultLocale validasyonunu yapıyor.
    // Burada sadece normalize ediyoruz.
    return normLocaleTag(resolved) || 'de';
  }, [resolved]);
}
