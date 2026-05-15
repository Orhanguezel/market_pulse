// src/modules/_shared/locale.ts

import type { FastifyRequest } from 'fastify';
import { normalizeLocaleStr } from './parse';

// Re-export pure normalizeLocale (no DB/env dependency)
export function normalizeLocale(input?: string | null): string | null {
  return normalizeLocaleStr(input);
}

export type LocaleQueryLike = { locale?: string; default_locale?: string };
export type ResolvedLocales = { locale: string; def: string };
type RequestLocaleLike = FastifyRequest & {
  locale?: unknown;
  query?: unknown;
};

export function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  if (s === '*') return '*';
  return normalizeLocale(s) || s.toLowerCase();
}

// Lazy import to avoid circular dependency (i18n → db/client → env → _shared → i18n)
async function getI18n() {
  return await import('../../core/i18n');
}

function pickSafeDefault(
  runtimeDefault: string,
  locales: string[],
  normFn: (s?: string | null) => string | null,
): string {
  const base = normFn(runtimeDefault) || runtimeDefault;
  if (base && locales.includes(base)) return base;
  return locales[0] || base || '';
}

export async function resolveRequestLocales(
  req: RequestLocaleLike,
  query?: LocaleQueryLike,
): Promise<ResolvedLocales> {
  const i18n = await getI18n();
  await i18n.ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);
  const reqRaw = normalizeLooseLocale(q.locale) ?? normalizeLooseLocale(req.locale);
  const defRawFromQuery = normalizeLooseLocale(q.default_locale);

  const safeDefault = pickSafeDefault(
    i18n.getRuntimeDefaultLocale(),
    i18n.LOCALES,
    normalizeLocale,
  );
  const safeLocale = reqRaw && i18n.isSupported(reqRaw) ? reqRaw : safeDefault;
  const safeDef = defRawFromQuery && i18n.isSupported(defRawFromQuery) ? defRawFromQuery : safeDefault;

  return { locale: safeLocale, def: safeDef };
}

/**
 * Create operasyonu için locale listesi hazırla
 */
export async function getLocalesForCreate(baseLocale: string): Promise<string[]> {
  const i18n = await getI18n();
  await i18n.ensureLocalesLoadedFromSettings();

  const base =
    normalizeLocale(baseLocale) ||
    normalizeLocale(i18n.getRuntimeDefaultLocale()) ||
    i18n.getRuntimeDefaultLocale();

  let list = [...i18n.LOCALES];
  if (base && !list.includes(base)) list.unshift(base);
  list = Array.from(new Set(list));
  return list;
}
