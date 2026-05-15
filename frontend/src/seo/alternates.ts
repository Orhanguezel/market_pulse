// =============================================================
// FILE: src/seo/alternates.ts
// =============================================================
import 'server-only';

import { headers } from 'next/headers';
import { fetchActiveLocales, getDefaultLocale } from '@/i18n/server';

import {
  absUrlJoin,
  localizedPath,
  normLocaleShort,
  normPath,
  normalizeLocalhostOrigin,
  stripTrailingSlash,
  uniq,
} from '@/integrations/shared';

const firstHeader = (v: unknown): string => String(v || '').split(',')[0].trim();

async function getRuntimeBaseUrl(): Promise<string> {
  // 1) env (prod deterministik)
  const env = stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || '');
  if (env) return normalizeLocalhostOrigin(env);

  // 2) SSR headers (proxy-safe)
  const h = await headers();
  const xfProto = firstHeader(h.get('x-forwarded-proto') || '');
  const xfHost = firstHeader(h.get('x-forwarded-host') || '');
  const host = xfHost || firstHeader(h.get('host') || '');

  const proto = (xfProto || 'https').trim() || 'https';
  const base = host ? `${proto}://${host}` : 'http://localhost:3000';

  return normalizeLocalhostOrigin(stripTrailingSlash(base));
}

/** hreflang için mutlak URL haritası üretir (DB app_locales) */
export async function languagesMap(pathname?: string) {
  const baseUrl = await getRuntimeBaseUrl();

  const defaultLocaleRaw = await getDefaultLocale();
  const def = normLocaleShort(defaultLocaleRaw, 'de');

  const activeRaw = await fetchActiveLocales();
  const active = uniq(activeRaw.map((l) => normLocaleShort(l, def))).filter(Boolean);

  // default locale mutlaka listede olsun
  if (!active.includes(def)) active.unshift(def);

  const p = normPath(pathname);

  const map: Record<string, string> = {};
  for (const l of active) {
    map[l] = absUrlJoin(baseUrl, localizedPath(l, p, def));
  }

  // ✅ x-default: default locale canonical
  map['x-default'] = absUrlJoin(baseUrl, localizedPath(def, p, def));

  return map as Readonly<Record<string, string>>;
}

/** Canonical URL (mutlak) – seçilen dil için */
export async function canonicalFor(locale: string, pathname?: string) {
  const baseUrl = await getRuntimeBaseUrl();

  const defaultLocaleRaw = await getDefaultLocale();
  const def = normLocaleShort(defaultLocaleRaw, 'de');

  const p = normPath(pathname);
  const loc = normLocaleShort(locale, def);

  return absUrlJoin(baseUrl, localizedPath(loc, p, def));
}
