'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/common/useAdminUiCopy.ts
// FINAL — Admin UI copy hook (site_settings.ui_admin)
// =============================================================

import { useMemo } from 'react';

import { useListSiteSettingsAdminQuery } from '@/integrations/hooks';
import type { AdminUiCopy } from '@/integrations/shared';
import { normalizeAdminUiCopy } from '@/integrations/shared';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

type UseAdminUiCopyResult = {
  copy: AdminUiCopy;
  loading: boolean;
  fetching: boolean;
  error?: unknown;
};

export function useAdminUiCopy(): UseAdminUiCopyResult {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  const q = useListSiteSettingsAdminQuery({
    keys: ['ui_admin'],
    locale: adminLocale,
    limit: 1,
    sort: 'updated_at',
    order: 'desc',
  });

  const copy = useMemo(() => {
    const row = (q.data ?? []).find((item) => item.key === 'ui_admin');
    const val = row?.value;
    return normalizeAdminUiCopy(val);
  }, [q.data]);

  return {
    copy,
    loading: q.isLoading,
    fetching: q.isFetching,
    error: q.error,
  };
}
