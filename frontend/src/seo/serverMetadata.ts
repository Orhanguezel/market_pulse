// =============================================================
// FILE: src/seo/serverMetadata.ts
// – Server Metadata Builder (DB-driven locales/default)
//   - Active locales: site_settings.app_locales (DB)
//   - Default locale: getDefaultLocale() (DB)
//   - Canonical + hreflang SSR tek kaynak (alternates)
//   - GLOBAL defaults (locale='*') first-class
//   - NO hardcoded locale unions
// =============================================================
import 'server-only';

import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { fetchSetting, fetchActiveLocales, getDefaultLocale, type JsonLike } from '@/i18n/server';

import {
  FALLBACK_LOCALE,
  absUrlJoin,
  asBool,
  asObj,
  asStr,
  asStrArr,
  localizedPath,
  normLocaleShort,
  normPath,
  normalizeLocalhostOrigin,
  stripTrailingSlash,
  uniq,
} from '@/integrations/shared';
import { getLocaleDescriptionFallback, getPublicAppName } from '@/lib/site-config';

/**
 * ✅ Server runtime base URL (proxy-safe).
 * Öncelik:
 *  1) NEXT_PUBLIC_SITE_URL (varsa sabit)
 *  2) x-forwarded-proto + x-forwarded-host
 *  3) host + https (fallback)
 */
async function getRuntimeBaseUrl(): Promise<string> {
  // 1) env (deterministic)
  const env = stripTrailingSlash(String(process.env.NEXT_PUBLIC_SITE_URL || '').trim());
  if (env) return normalizeLocalhostOrigin(env);

  // 2) DB (site_settings.public_base_url, locale='*')
  const publicBase = await fetchSetting('public_base_url', '*', { revalidate: 600 });
  const fromDb = stripTrailingSlash(String(publicBase?.value || '').trim());
  if (fromDb && /^https?:\/\//i.test(fromDb)) return normalizeLocalhostOrigin(fromDb);

  const h = await headers();

  const xfProto = String(h.get('x-forwarded-proto') || '')
    .split(',')[0]
    ?.trim();
  const xfHost = String(h.get('x-forwarded-host') || '')
    .split(',')[0]
    ?.trim();

  const host = xfHost || String(h.get('host') || '').trim();
  const proto = (xfProto || 'https').trim();

  if (host) return normalizeLocalhostOrigin(stripTrailingSlash(`${proto}://${host}`));

  return 'http://localhost:3000';
}

/**
 * OpenGraph locale formatına çevir:
 * - "pt-br" -> "pt_BR"
 * - "de"    -> "tr_TR" (region yoksa LANG_LANG)
 */
function toOgLocale(l: string): string {
  const raw = String(l || '').trim();
  if (!raw) return `${FALLBACK_LOCALE}_${FALLBACK_LOCALE.toUpperCase()}`;

  const normalized = raw.replace('_', '-').toLowerCase();
  const [langRaw, regionRaw] = normalized.split('-');

  const lang = (langRaw || FALLBACK_LOCALE).toLowerCase().slice(0, 2);
  const region = (regionRaw || '').toUpperCase();

  return `${lang}_${region || lang.toUpperCase()}`;
}

/** Path normalizasyonu: başında / olsun; kök dışı ise sonda / olmasın */
// normPath imported from helpers

// localizedPath + absUrlJoin imported from helpers (App Router: always "/{locale}/...")

/* -------------------- SEO fetch (GLOBAL '*' aware, deterministic) -------------------- */

async function resolveActiveLocales(provided?: string[]) {
  const list = provided && provided.length ? provided : await fetchActiveLocales();
  const normalized = uniq(list.map((l) => normLocaleShort(l, FALLBACK_LOCALE))).filter(Boolean);
  if (!normalized.length) normalized.push(FALLBACK_LOCALE);
  return normalized;
}

/**
 * NEW STANDARD: seo/site_seo için fallback kuralı
 * Öncelik:
 *  1) requested locale
 *  2) global '*'   (kritik: başka locale'a düşmeden önce!)
 *  3) default locale
 *  4) (opsiyonel) diğer active locale'ler
 */
function buildSeoLocaleTryOrder(args: {
  requestedLocale: string;
  defaultLocale: string;
  activeLocales: string[];
}): string[] {
  const req = normLocaleShort(args.requestedLocale, FALLBACK_LOCALE);
  const def = normLocaleShort(args.defaultLocale, FALLBACK_LOCALE);

  const act = uniq((args.activeLocales || []).map((l) => normLocaleShort(l, def))).filter(Boolean);

  // requested -> '*' -> default -> others -> fallback
  return uniq([req, '*', def, ...act, FALLBACK_LOCALE].filter(Boolean));
}

async function fetchSeoRowWithFallback(locale: string, providedActiveLocales?: string[]) {
  const loc = normLocaleShort(locale, FALLBACK_LOCALE);

  // key priority: seo -> site_seo
  const tryKeys = ['seo', 'site_seo'] as const;

  const defaultLocale = await getDefaultLocale();
  const activeLocales = await resolveActiveLocales(providedActiveLocales);

  const tryLocales = buildSeoLocaleTryOrder({
    requestedLocale: loc,
    defaultLocale,
    activeLocales,
  });

  // ✅ Key önce (seo > site_seo), locale sonra
  for (const k of tryKeys) {
    for (const l of tryLocales) {
      const row = await fetchSetting(k, l, { revalidate: 600 });
      if (row?.value != null) return row;
    }
  }

  return null;
}

export async function fetchSeoObject(
  locale: string,
  providedActiveLocales?: string[],
): Promise<Record<string, any>> {
  const row = await fetchSeoRowWithFallback(locale, providedActiveLocales);
  const v = row?.value as JsonLike;
  const obj = asObj(v);
  return obj ?? {};
}

export async function fetchSeoPageObject(
  locale: string,
  pageKey: string,
): Promise<Record<string, any>> {
  const key = String(pageKey || '').trim();
  if (!key) return {};

  const defaultLocale = await getDefaultLocale();
  const activeLocales = await resolveActiveLocales();
  const tryLocales = buildSeoLocaleTryOrder({
    requestedLocale: locale,
    defaultLocale,
    activeLocales,
  });

  for (const l of tryLocales) {
    const row = await fetchSetting('seo_pages', l, { revalidate: 600 });
    const pages = asObj(row?.value);
    const page = asObj(pages?.[key]);
    if (page) return page;
  }

  return {};
}

export function mergeSeoPageIntoSeo(
  seo: Record<string, any>,
  pageSeo: Record<string, any>,
): Record<string, any> {
  const title = asStr(pageSeo.title);
  const description = asStr(pageSeo.description);
  const ogImage = asStr(pageSeo.og_image);
  const noIndex = asBool(pageSeo.no_index);

  const openGraph = asObj(seo.open_graph) || {};
  const robots = asObj(seo.robots) || {};

  return {
    ...seo,
    ...(title ? { title_default: title } : {}),
    ...(description ? { description } : {}),
    open_graph: {
      ...openGraph,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      ...robots,
      ...(typeof noIndex === 'boolean' ? { noindex: noIndex } : {}),
    },
  };
}

/* -------------------- DRY one-liner helper (FAZ 27 SEO refactor) -------------------- */

/**
 * Tek satırla full Metadata üretir — `seo_pages.{pageKey}` overlay + global `site_seo` fallback.
 *
 * **Kullanım** (her sayfanın `generateMetadata` içinde):
 * ```ts
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   const { locale } = await params;
 *   return buildPageMetadata({
 *     locale,
 *     pageKey: 'pricing',
 *     pathname: '/pricing',
 *     fallback: { title: 'Pricing', description: '...' }, // DB boşsa kullanılır
 *   });
 * }
 * ```
 *
 * Önceki 4 satır (fetchSeoObject + fetchSeoPageObject + merge + build) → 1 satır.
 *
 * **Öncelik sırası:**
 * 1. `seo_pages.{pageKey}` (admin'den DB'de doldurulan)
 * 2. `args.fallback` (sayfanın hardcoded baseline metni)
 * 3. global `site_seo` (genel default)
 * 4. siteName + default boilerplate (en son fallback)
 */
export async function buildPageMetadata(args: {
  locale: string;
  pageKey: string;
  pathname?: string;
  activeLocales?: string[];
  fallback?: { title?: string; description?: string; ogImage?: string };
}): Promise<Metadata> {
  const [seo, pageSeoRaw] = await Promise.all([
    fetchSeoObject(args.locale, args.activeLocales),
    fetchSeoPageObject(args.locale, args.pageKey),
  ]);

  // DB'de boş olan alanları sayfanın hardcoded fallback'iyle doldur
  const pageSeo: Record<string, any> = {
    ...pageSeoRaw,
    title: asStr(pageSeoRaw.title) || args.fallback?.title || '',
    description: asStr(pageSeoRaw.description) || args.fallback?.description || '',
    og_image: asStr(pageSeoRaw.og_image) || args.fallback?.ogImage || '',
  };

  return buildMetadataFromSeo(mergeSeoPageIntoSeo(seo, pageSeo), {
    locale: args.locale,
    pathname: args.pathname,
    activeLocales: args.activeLocales,
  });
}

/* -------------------- Metadata builder -------------------- */

type BuildMetadataArgs = {
  locale: string;
  pathname?: string; // locale-prefixsiz path: "/" veya "/blog"
  activeLocales?: string[];
};

export async function buildMetadataFromSeo(
  seo: Record<string, any>,
  args: BuildMetadataArgs,
): Promise<Metadata> {
  const baseUrl = await getRuntimeBaseUrl();

  const active = await resolveActiveLocales(args.activeLocales);
  const defaultLocale = await getDefaultLocale();
  const locale = normLocaleShort(args.locale, FALLBACK_LOCALE);

  // Defaults (DB-driven)
  const siteName = asStr(seo.site_name) || getPublicAppName();
  const titleDefault = asStr(seo.title_default) || siteName;
  // T31-B7: titleDefault === siteName olduğunda template uygulanırsa marka adı iki kez tekrarlanır; template atlanır.
  const isDefaultSameAsBrand = titleDefault.trim().toLowerCase() === siteName.trim().toLowerCase();
  const titleTemplate = asStr(seo.title_template) || (isDefaultSameAsBrand ? '%s' : `%s | ${siteName}`);
  const rawDescription =
    asStr(seo.description) ||
    asStr(seo.description_default) ||
    asStr(seo.site_description) ||
    '';

  const description = rawDescription || getLocaleDescriptionFallback(locale);

  // Open Graph
  const og = asObj(seo.open_graph) || {};
  const ogType = (asStr(og.type) || 'website') as any;

  // ✅ SINGLE SOURCE: og.images[]
  // Legacy support: og.image varsa images[0] gibi davran
  const legacyOne = asStr(og?.image);
  const ogImages = uniq([...(legacyOne ? [legacyOne] : []), ...asStrArr(og?.images)])
    .map((u) => absUrlJoin(baseUrl, u))
    .filter(Boolean);

  // Twitter
  const tw = asObj(seo.twitter) || {};
  const twitterCard = (asStr(tw.card) || 'summary_large_image') as any;
  const twitterSite = asStr(tw.site);
  const twitterCreator = asStr(tw.creator);

  // Robots
  const rb = asObj(seo.robots) || {};
  const robotsNoindex = asBool(rb.noindex) ?? false;
  const robotsIndex = asBool(rb.index) ?? true;
  const robotsFollow = asBool(rb.follow) ?? true;

  const pathname = normPath(args.pathname);

  // ✅ canonical SSR tek kaynak
  const canonical = absUrlJoin(baseUrl, localizedPath(locale, pathname, defaultLocale));

  // ✅ hreflang SSR tek kaynak
  const languages: Record<string, string> = {};
  for (const l of active) {
    languages[l] = absUrlJoin(baseUrl, localizedPath(l, pathname, defaultLocale));
  }
  languages['x-default'] = absUrlJoin(baseUrl, localizedPath(defaultLocale, pathname, defaultLocale));

  const ogLocale = toOgLocale(locale);
  const ogAltLocales = active
    .filter((l) => normLocaleShort(l, FALLBACK_LOCALE) !== normLocaleShort(locale, FALLBACK_LOCALE))
    .map((l) => toOgLocale(l));

  const metadata: Metadata = {
    metadataBase: new URL(baseUrl),

    title: { default: titleDefault, template: titleTemplate },
    ...(description ? { description } : {}),

    alternates: {
      canonical,
      languages,
    },

    // ✅ og:url = canonical (SSR)
    openGraph: {
      type: ogType,
      siteName,
      url: canonical,
      title: titleDefault,
      ...(description ? { description } : {}),
      locale: ogLocale,
      ...(ogAltLocales.length ? { alternateLocale: ogAltLocales } : {}),
      ...(ogImages.length ? { images: ogImages.map((url) => ({ url })) } : {}),
    },

    twitter: {
      card: twitterCard,
      ...(twitterSite ? { site: twitterSite } : {}),
      ...(twitterCreator ? { creator: twitterCreator } : {}),
      ...(ogImages[0] ? { images: [ogImages[0]] } : {}),
    },

    robots: robotsNoindex
      ? { index: false, follow: false }
      : { index: robotsIndex, follow: robotsFollow },
  };

  return metadata;
}
