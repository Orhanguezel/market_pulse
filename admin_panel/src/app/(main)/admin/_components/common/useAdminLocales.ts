// =============================================================
// FILE: src/app/(main)/admin/_components/common/useAdminLocales.ts
// guezelwebdesign – Admin Locales (Centralized)
// Source: site_settings.app_locales + site_settings.default_locale
// - No static locale map
// - Produces AdminLocaleOption[]
// =============================================================

import { useMemo } from 'react';
import { useListSiteSettingsAdminQuery } from '@/integrations/hooks';

import type { AdminLocaleOption } from './AdminLocaleSelect';

type AppLocaleItem = {
  code: string;
  label?: string;
  is_active?: boolean;
  is_default?: boolean;
};

const toShortLocale = (v: unknown): string =>
  String(v || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();

function uniqByCode(items: AppLocaleItem[]): AppLocaleItem[] {
  const seen = new Set<string>();
  const out: AppLocaleItem[] = [];
  for (const it of items) {
    const code = toShortLocale(it?.code);
    if (!code) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push({ ...it, code });
  }
  return out;
}

function buildLocaleLabel(item: AppLocaleItem): string {
  const code = toShortLocale(item.code);
  const label = String(item.label || '').trim();
  if (label) return `${label} (${code})`;

  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames(['tr'], { type: 'language' });
  } catch {
    dn = null;
  }
  const name = dn?.of(code) ?? '';
  return name ? `${name} (${code})` : `${code.toUpperCase()} (${code})`;
}

function parseAppLocalesValue(raw: unknown): AppLocaleItem[] {
  if (!raw) return [];

  // DB array: ["de","en"] or [{code,label,is_active,is_default}]
  if (Array.isArray(raw)) {
    return raw
      .map((x: any) => ({
        code: toShortLocale(x?.code ?? x),
        label: typeof x?.label === 'string' ? x.label : undefined,
        is_active: x?.is_active,
        is_default: x?.is_default,
      }))
      .filter((x) => !!x.code);
  }

  // DB stringified JSON
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return parseAppLocalesValue(parsed);
    } catch {
      return [];
    }
  }

  // DB object: { locales: [...] }
  if (typeof raw === 'object' && raw !== null) {
    const anyObj = raw as any;
    if (Array.isArray(anyObj.locales)) return parseAppLocalesValue(anyObj.locales);
  }

  return [];
}

export type UseAdminLocalesResult = {
  localeOptions: AdminLocaleOption[];
  defaultLocaleFromDb: string; // short locale, can be ""
  activeLocaleCodes: string[]; // short locales, unique, ordered
  hasLocale: (locale: unknown) => boolean;
  coerceLocale: (locale: unknown, fallback?: string) => string; // returns safe locale or fallback or ""
  loading: boolean;
  fetching: boolean;
};

export function useAdminLocales(): UseAdminLocalesResult {
  const {
    data: rows,
    isLoading,
    isFetching,
  } = useListSiteSettingsAdminQuery({
    keys: ['app_locales', 'default_locale'],
  });

  const computed = useMemo(() => {
    const list = rows ?? [];
    const appRow = list.find((r: any) => r.key === 'app_locales');
    const defRow = list.find((r: any) => r.key === 'default_locale');

    const itemsRaw = parseAppLocalesValue(appRow?.value);

    // active filter: default true unless explicitly false
    const active = itemsRaw.filter((x) => x && x.code && x.is_active !== false);
    const uniq = uniqByCode(active);

    const codes = uniq.map((x) => toShortLocale(x.code)).filter(Boolean);

    // default locale
    let def = toShortLocale(defRow?.value);

    // if default_locale empty -> try app_locales is_default
    if (!def) {
      const flagged = uniq.find((x) => x.is_default === true);
      def = flagged ? toShortLocale(flagged.code) : '';
    }

    // if default still not in active list -> pick first active
    if (def && !codes.includes(def)) {
      def = codes[0] ?? '';
    }

    const options: AdminLocaleOption[] = uniq.map((it) => ({
      value: toShortLocale(it.code),
      label: buildLocaleLabel(it),
    }));

    const set = new Set(codes);
    const hasLocale = (locale: unknown) => {
      const v = toShortLocale(locale);
      return !!v && set.has(v);
    };

    const coerceLocale = (locale: unknown, fallback?: string) => {
      const v = toShortLocale(locale);
      if (v && set.has(v)) return v;

      const fb = toShortLocale(fallback);
      if (fb && set.has(fb)) return fb;

      // last resort: default or first active
      if (def && set.has(def)) return def;
      return codes[0] ?? '';
    };

    return {
      localeOptions: options,
      defaultLocaleFromDb: def,
      activeLocaleCodes: codes,
      hasLocale,
      coerceLocale,
    };
  }, [rows]);

  return {
    ...computed,
    loading: isLoading,
    fetching: isFetching,
  };
}
