// =============================================================
// FILE: src/i18n/localeUtils.ts  (DYNAMIC)
// =============================================================

import { FALLBACK_LOCALE as CONFIG_FALLBACK_LOCALE } from './config';

/**
 * ⚠️ DEPRECATED:
 * Burada fallback locale tanımlamayın.
 * Hard fallback: src/i18n/config.ts -> FALLBACK_LOCALE
 * Server fallback: src/i18n/server.ts -> DEFAULT_LOCALE_FALLBACK
 */
export const FALLBACK_LOCALE = CONFIG_FALLBACK_LOCALE;

export function normLocaleTag(x: unknown): string {
  return String(x || '')
    .toLowerCase()
    .trim()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

/** order-preserving dedupe */
export function uniqKeepOrder(locales: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of locales) {
    const n = normLocaleTag(l);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function tryParseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  const s = raw.trim();
  if (!s) return raw;

  if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
    try {
      return JSON.parse(s);
    } catch {
      return raw;
    }
  }

  return raw;
}

type AppLocaleObj = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

export function normalizeLocales(raw: unknown): string[] {
  let v: any = tryParseJson(raw);

  // legacy wrapper
  if (v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.locales)) {
    v = v.locales;
  }

  const arr: any[] = Array.isArray(v) ? v : [];

  const actives: string[] = [];
  const defaults: string[] = [];

  for (const item of arr) {
    if (typeof item === 'string') {
      const code = normLocaleTag(item);
      if (code) actives.push(code);
      continue;
    }

    if (item && typeof item === 'object') {
      const obj = item as AppLocaleObj;
      const code = normLocaleTag(obj.code);
      if (!code) continue;

      const isActive = obj.is_active === undefined ? true : Boolean(obj.is_active);
      if (!isActive) continue;

      actives.push(code);

      const isDefault = Boolean(obj.is_default);
      if (isDefault) defaults.push(code);
    }
  }

  const activeUniq = uniqKeepOrder(actives);
  if (!activeUniq.length) return [];

  const defaultUniq = uniqKeepOrder(defaults).filter((d) => activeUniq.includes(d));
  if (!defaultUniq.length) return activeUniq;

  const d = defaultUniq[0]!;
  return [d, ...activeUniq.filter((x) => x !== d)];
}

export function resolveDefaultLocale(
  defaultLocaleValue: unknown,
  appLocalesValue: unknown,
): string {
  const active = normalizeLocales(appLocalesValue);
  const activeSet = new Set(active.map(normLocaleTag));

  const cand = normLocaleTag(defaultLocaleValue);
  if (cand && activeSet.has(cand)) return cand;

  return normLocaleTag(active[0]) || FALLBACK_LOCALE;
}

export function pickFromAcceptLanguage(accept: string | null, active: string[]): string {
  const activeClean = uniqKeepOrder(active);
  if (!activeClean.length) return FALLBACK_LOCALE;

  const a = (accept || '').toLowerCase();
  if (!a) return activeClean[0] || FALLBACK_LOCALE;

  const prefs = a
    .split(',')
    .map((part) => part.trim().split(';')[0]?.trim())
    .filter(Boolean)
    .map((tag) => normLocaleTag(tag))
    .filter(Boolean);

  for (const p of prefs) {
    if (activeClean.includes(p)) return p;
  }

  return activeClean[0] || FALLBACK_LOCALE;
}

export function pickFromCookie(cookieLocale: string | undefined, active: string[]): string | null {
  const c = normLocaleTag(cookieLocale);
  if (!c) return null;

  const activeClean = uniqKeepOrder(active);
  return activeClean.includes(c) ? c : null;
}
