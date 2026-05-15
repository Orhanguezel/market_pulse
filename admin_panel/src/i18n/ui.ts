// =============================================================
// FILE: src/lib/i18n/ui.ts  (DYNAMIC)
// =============================================================
'use client';

import { useMemo } from 'react';
import type { SupportedLocale, TranslatedLabel } from '@/types/common';
import { useListSiteSettingsQuery } from '@/integrations/hooks';

/**
 * Tüm UI yazıları için tek noktadan EN fallback.
 * (Senin uzun obje AYNEN kalır)
 */
export const UI_FALLBACK_EN = {
  ui_header_nav_home: 'Home',
  ui_header_nav_about: 'About Us',
  ui_header_nav_services: 'Services',
  ui_header_nav_product: 'Products',
  ui_header_nav_sparepart: 'Spare Parts',
  ui_header_nav_references: 'References',
  ui_header_nav_library: 'Library',
  ui_header_nav_blog: 'Blog',
  ui_header_nav_contact: 'Contact',
  ui_home_hero_title: 'Welcome to Our Website',
  ui_home_hero_subtitle: 'We provide the best solutions for your business.',
  ui_home_hero_cta_primary: 'Get Started',
  ui_home_hero_cta_secondary: 'Learn More',
  // ... diğer UI key-value çiftleri
} as const;

export type UIKey = keyof typeof UI_FALLBACK_EN;

type SettingsValueRecord = {
  label?: TranslatedLabel;
  [k: string]: unknown;
};

function normShortLocale(x: unknown): string {
  return String(x || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

function tryParseJson(x: unknown): unknown {
  if (typeof x !== 'string') return x;
  const s = x.trim();
  if (!s) return x;
  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return x;
    }
  }
  return x;
}

function normalizeValueToLabel(value: unknown): SettingsValueRecord {
  const v = tryParseJson(value);

  // 1) string -> {label:{en:string}} legacy
  if (typeof v === 'string') {
    return { label: { en: v } as TranslatedLabel };
  }

  // 2) object -> ya {label:{...}} ya da direkt {en:"",tr:""} gibi
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as any;

    // { label: {...} }
    if (obj.label && typeof obj.label === 'object' && !Array.isArray(obj.label)) {
      return obj as SettingsValueRecord;
    }

    // { en:"", tr:"" } gibi -> label'a sar
    return { label: obj as TranslatedLabel };
  }

  return {};
}

/**
 * useUIStrings:
 * - keys: DB'deki site_settings.key listesi (örn: ui_header_nav_home)
 * - locale: DB query locale (örn: "de")
 *
 * Fallback:
 *  1) label[locale]
 *  2) label.en
 *  3) label.tr
 *  4) label first value
 *  5) UI_FALLBACK_EN[key]
 *  6) key
 */
export function useUIStrings(keys: readonly string[], locale?: SupportedLocale) {
  const keysForQuery = useMemo(() => keys.map((k) => String(k)), [keys]);

  const { data } = useListSiteSettingsQuery();

  const map = useMemo(() => {
    const out: Record<string, SettingsValueRecord> = {};
    if (!data) return out;

    for (const item of data as any[]) {
      const k = String(item?.key || '').trim();
      if (!k) continue;

      if (keysForQuery.length && !keysForQuery.includes(k)) continue;

      out[k] = normalizeValueToLabel(item?.value);
    }

    return out;
  }, [data, keysForQuery]);

  const t = (key: string): string => {
    const k = String(key || '').trim();
    if (!k) return '';

    const raw = map[k];
    const label = (raw?.label || {}) as TranslatedLabel;

    const l = normShortLocale(locale);
    const fallbackFromConst = (UI_FALLBACK_EN as Record<string, string>)[k] ?? '';

    const val =
      (l && (label as any)[l]) ||
      (label as any).en ||
      (label as any).tr ||
      (Object.values(label || {})[0] as string) ||
      fallbackFromConst ||
      k;

    const s = (typeof val === 'string' ? val : '').trim();
    return s || fallbackFromConst || k;
  };

  return { t, map };
}
