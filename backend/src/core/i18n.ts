// =============================================================
// FILE: src/core/i18n.ts
// Bereket Fide – Dynamic i18n core (LOCALES runtime from site_settings)
//  - app_locales locale='*' priority
//  - supports object[] [{code,label,is_active,is_default}, ...]
//  - supports string[] and CSV and JSON string
//  - filters inactive locales
//  - LOCALES mutated in-place
//  - default_locale read from site_settings (locale='*') with cache
// =============================================================

import { db } from '../db/client';
import { siteSettings } from '../modules/siteSettings/schema';
import { and, eq } from 'drizzle-orm';

export const APP_LOCALES_SETTING_KEY = 'app_locales';
export const DEFAULT_LOCALE_SETTING_KEY = 'default_locale';

/** "tr-TR" → "tr" normalize */
export function normalizeLocale(input?: string | null): string | undefined {
  if (!input) return undefined;
  const s = String(input).trim().toLowerCase().replace('_', '-');
  if (!s) return undefined;
  const base = s.split('-')[0];
  return base || undefined;
}

// ENV başlangıç
const initialLocaleCodes = (process.env.APP_LOCALES || 'tr,en,de')
  .split(',')
  .map((s) => normalizeLocale(s) || '')
  .filter(Boolean);

const uniqueInitial: string[] = [];
for (const l of initialLocaleCodes) {
  if (!uniqueInitial.includes(l)) uniqueInitial.push(l);
}

export const LOCALES: string[] = uniqueInitial.length ? uniqueInitial : ['de'];
export type Locale = (typeof LOCALES)[number];

// Build-time default (koru)
export const DEFAULT_LOCALE: Locale =
  (normalizeLocale(process.env.DEFAULT_LOCALE) as Locale) ||
  (LOCALES[0] as Locale) ||
  ('de' as Locale);

export function isSupported(l?: string | null): l is Locale {
  if (!l) return false;
  const n = normalizeLocale(l);
  if (!n) return false;
  return LOCALES.includes(n);
}

function parseAcceptLanguage(header?: string | null): string[] {
  if (!header) return [];
  const items = String(header)
    .split(',')
    .map((part) => {
      const [tag, ...rest] = part.trim().split(';');
      const qMatch = rest.find((p) => p.trim().startsWith('q='));
      const q = qMatch ? Number(qMatch.split('=')[1]) : 1;
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q)
    .map((x) => x.tag);
  return items;
}

export function bestFromAcceptLanguage(header?: string | null): Locale | undefined {
  const candidates = parseAcceptLanguage(header);
  for (const cand of candidates) {
    const base = normalizeLocale(cand);
    if (base && isSupported(base)) return base as Locale;
  }
  return undefined;
}

export function resolveLocaleFromHeaders(headers: Record<string, unknown>): {
  locale: Locale;
  selectedBy: 'x-locale' | 'accept-language' | 'default';
} {
  const rawXL = (headers['x-locale'] ??
    (headers as any)['X-Locale'] ??
    (headers as any)['x_locale']) as string | undefined;

  const xlNorm = normalizeLocale(rawXL);
  if (xlNorm && isSupported(xlNorm)) {
    return { locale: xlNorm as Locale, selectedBy: 'x-locale' };
  }

  const al = bestFromAcceptLanguage(
    (headers['accept-language'] ?? (headers as any)['Accept-Language']) as string | undefined,
  );
  if (al && isSupported(al)) {
    return { locale: al as Locale, selectedBy: 'accept-language' };
  }

  // ✅ runtime default varsa onu kullan
  return { locale: (getRuntimeDefaultLocale() as Locale) || DEFAULT_LOCALE, selectedBy: 'default' };
}

/** Runtime default (DB’den yüklenir). Yüklenmemişse build-time DEFAULT_LOCALE döner. */
let __runtimeDefaultLocale: string | null = null;

export function getRuntimeDefaultLocale(): Locale {
  const n = normalizeLocale(__runtimeDefaultLocale) as Locale | undefined;
  if (n && LOCALES.includes(n)) return n;
  // fallback: LOCALES[0] > DEFAULT_LOCALE
  return (LOCALES[0] as Locale) || DEFAULT_LOCALE;
}

/** Fallback zinciri: primary -> runtime default -> LOCALES */
export function fallbackChain(primary: Locale): Locale[] {
  const seen = new Set<string>();
  const runtimeDef = getRuntimeDefaultLocale();
  const order: string[] = [primary, runtimeDef, ...LOCALES];

  const uniq: Locale[] = [];
  for (const l of order) {
    const n = normalizeLocale(l) || l;
    if (!seen.has(n)) {
      seen.add(n);
      uniq.push(n as Locale);
    }
  }
  return uniq;
}

export function setLocalesFromSettings(localeCodes: string[]) {
  const next: string[] = [];
  for (const code of localeCodes) {
    const n = normalizeLocale(code);
    if (!n) continue;
    if (!next.includes(n)) next.push(n);
  }
  if (!next.length) return;

  LOCALES.splice(0, LOCALES.length, ...next);
}

/* ------------------------------------------------------------------
 * SiteSettings parse helpers
 * ------------------------------------------------------------------ */

type AppLocaleObjLike = {
  code?: unknown;
  locale?: unknown;
  value?: unknown;
  lang?: unknown;
  is_active?: unknown;
  is_default?: unknown;
};

function extractLocaleCode(v: unknown): { code: string; isDefault: boolean } | null {
  if (v == null) return null;

  if (typeof v === 'string') {
    const n = normalizeLocale(v);
    return n ? { code: n, isDefault: false } : null;
  }

  if (typeof v === 'object') {
    const o = v as AppLocaleObjLike;
    if (o.is_active === false) return null;

    const raw = o.code ?? o.locale ?? o.value ?? o.lang ?? null;
    if (typeof raw === 'string') {
      const n = normalizeLocale(raw);
      if (!n) return null;
      const isDef = o.is_default === true;
      return { code: n, isDefault: isDef };
    }
  }

  return null;
}

function parseJsonMaybe(s: string): unknown | null {
  const x = s.trim();
  if (!x) return null;
  if (!((x.startsWith('[') && x.endsWith(']')) || (x.startsWith('{') && x.endsWith('}'))))
    return null;
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

function parseAppLocalesUnknown(raw: unknown): { locales: string[]; defaultFromList?: string } {
  // returns: locales uniq + optional default from list (is_default)
  const out: string[] = [];
  let def: string | undefined;

  const push = (code: string, isDef: boolean) => {
    if (!out.includes(code)) out.push(code);
    if (isDef && !def) def = code;
  };

  if (raw == null) return { locales: [], defaultFromList: undefined };

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const r = extractLocaleCode(item);
      if (r) push(r.code, r.isDefault);
    }
    return { locales: out, defaultFromList: def };
  }

  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return { locales: [], defaultFromList: undefined };

    const parsed = parseJsonMaybe(s);
    if (parsed != null) return parseAppLocalesUnknown(parsed);

    for (const part of s.split(/[;,]+/)) {
      const code = normalizeLocale(part);
      if (code && !out.includes(code)) out.push(code);
    }
    return { locales: out, defaultFromList: undefined };
  }

  // object ama array değilse, desteklemiyoruz
  return { locales: [], defaultFromList: undefined };
}

/* ------------------------------------------------------------------
 * DB fetch + cache
 * ------------------------------------------------------------------ */

let lastLocalesLoadedAt = 0;
const LOCALES_REFRESH_MS = 60_000;

async function readSettingValue(key: string, locale: string): Promise<string | null> {
  const rows = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
    .limit(1);

  if (!rows.length) return null;
  return rows[0].value ?? null;
}

export async function loadLocalesFromSiteSettings() {
  try {
    // 1) app_locales: önce locale='*'
    const appRawStar = await readSettingValue(APP_LOCALES_SETTING_KEY, '*');
    const appRawAny = appRawStar
      ? appRawStar
      : await (async () => {
          const rows = await db
            .select({ value: siteSettings.value })
            .from(siteSettings)
            .where(eq(siteSettings.key, APP_LOCALES_SETTING_KEY))
            .limit(1);
          return rows.length ? rows[0].value : null;
        })();

    const { locales: parsedLocales, defaultFromList } = parseAppLocalesUnknown(appRawAny);

    if (parsedLocales.length) {
      setLocalesFromSettings(parsedLocales);
    }

    // 2) default_locale: önce locale='*'
    const defRawStar = await readSettingValue(DEFAULT_LOCALE_SETTING_KEY, '*');
    const defNorm = normalizeLocale(defRawStar || undefined);

    // Runtime default seçimi önceliği:
    //  - default_locale (DB)
    //  - app_locales içindeki is_default
    //  - LOCALES[0]
    const candidate =
      (defNorm && LOCALES.includes(defNorm) ? defNorm : undefined) ||
      (defaultFromList && LOCALES.includes(defaultFromList) ? defaultFromList : undefined) ||
      LOCALES[0] ||
      DEFAULT_LOCALE;

    __runtimeDefaultLocale = candidate || null;

    // default locale’i LOCALES başına taşı (prefixless default mantığı için deterministik)
    if (candidate && LOCALES.includes(candidate)) {
      const next = [candidate, ...LOCALES.filter((x) => x !== candidate)];
      LOCALES.splice(0, LOCALES.length, ...next);
    }
  } catch (err) {
    console.error('loadLocalesFromSiteSettings failed:', err);
  } finally {
    lastLocalesLoadedAt = Date.now();
  }
}

export async function ensureLocalesLoadedFromSettings() {
  const now = Date.now();
  if (now - lastLocalesLoadedAt < LOCALES_REFRESH_MS) return;
  await loadLocalesFromSiteSettings();
}

/* ------------------------------------------------------------------
 * Fastify request typing
 * ------------------------------------------------------------------ */
declare module 'fastify' {
  interface FastifyRequest {
    locale: Locale;
    localeFallbacks: Locale[];
  }
}
