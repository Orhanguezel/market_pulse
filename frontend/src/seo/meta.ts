// src/seo/meta.ts
'use client';

export type MetaInput = {
  title?: string;
  description?: string;

  /**
   * NEW STANDARD:
   * - canonical + og:url SSR tek kaynak.
   * - Client builder bu alanları üretmez.
   */
  canonical?: string;
  url?: string;

  image?: string;

  /**
   * og:locale gibi OG alanlarını da SSR’da üretmek idealdir,
   * ama legacy sayfalarda client’ta kalabilir.
   */
  locale?: string; // e.g., "tr_TR"
  siteName?: string;

  noindex?: boolean;

  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;

  /**
   * Debug meta’lar PROD’da basılmamalı.
   * Eğer ihtiyacın varsa sadece dev/test’te bu flag ile aç.
   */
  debug?: Record<string, string | number | boolean | null | undefined>;
};

export type TagSpec =
  | { kind: 'meta-name'; key: string; value: string }
  | { kind: 'meta-prop'; key: string; value: string }
  | { kind: 'link'; rel: string; href: string };

const trimOrEmpty = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const has = (v: unknown) => Boolean(trimOrEmpty(v));

/**
 * ✅ NEW STANDARD (Pages Router / App Router):
 * Client tarafında asla canonical / hreflang / og:url basma.
 * (SSR tek kaynak olacak.)
 */
export function filterClientHeadSpecs(specs: TagSpec[]): TagSpec[] {
  return specs.filter((spec) => {
    if (spec.kind === 'link' && spec.rel === 'canonical') return false;

    // hreflang alternates (link rel=alternate)
    if (spec.kind === 'link' && spec.rel === 'alternate') return false;

    // og:url SSR tek kaynak
    if (spec.kind === 'meta-prop' && spec.key === 'og:url') return false;

    return true;
  });
}

/**
 * Client meta builder (legacy / admin sayfaları için):
 * - Canonical / hreflang / og:url üretmez.
 * - SSR ile çakışmayacak, deterministik tag set üretir.
 */
export function buildMeta(meta: MetaInput): TagSpec[] {
  const out: TagSpec[] = [];

  // Description (SSR’da üretiliyorsa, burada hiç basma istemiyorsan bu bloğu kaldırabilirsin)
  if (has(meta.description)) {
    out.push({
      kind: 'meta-name',
      key: 'description',
      value: trimOrEmpty(meta.description),
    });
  }

  // Robots
  if (meta.noindex) {
    out.push({ kind: 'meta-name', key: 'robots', value: 'noindex, nofollow' });
  }

  // OpenGraph (og:url yok!)
  if (has(meta.title))
    out.push({ kind: 'meta-prop', key: 'og:title', value: trimOrEmpty(meta.title) });
  if (has(meta.description))
    out.push({ kind: 'meta-prop', key: 'og:description', value: trimOrEmpty(meta.description) });
  if (has(meta.image))
    out.push({ kind: 'meta-prop', key: 'og:image', value: trimOrEmpty(meta.image) });

  // og:type: legacy’de sabit kalsın; SSR zaten set ediyorsa kaldırılabilir
  out.push({ kind: 'meta-prop', key: 'og:type', value: 'website' });

  if (has(meta.siteName))
    out.push({ kind: 'meta-prop', key: 'og:site_name', value: trimOrEmpty(meta.siteName) });
  if (has(meta.locale))
    out.push({ kind: 'meta-prop', key: 'og:locale', value: trimOrEmpty(meta.locale) });

  // Twitter
  out.push({
    kind: 'meta-name',
    key: 'twitter:card',
    value: trimOrEmpty(meta.twitterCard) || 'summary_large_image',
  });

  if (has(meta.twitterSite))
    out.push({ kind: 'meta-name', key: 'twitter:site', value: trimOrEmpty(meta.twitterSite) });
  if (has(meta.twitterCreator))
    out.push({
      kind: 'meta-name',
      key: 'twitter:creator',
      value: trimOrEmpty(meta.twitterCreator),
    });

  if (has(meta.title))
    out.push({ kind: 'meta-name', key: 'twitter:title', value: trimOrEmpty(meta.title) });
  if (has(meta.description))
    out.push({
      kind: 'meta-name',
      key: 'twitter:description',
      value: trimOrEmpty(meta.description),
    });
  if (has(meta.image))
    out.push({ kind: 'meta-name', key: 'twitter:image', value: trimOrEmpty(meta.image) });

  // Debug meta (PROD’da basma)
  if (meta.debug && process.env.NODE_ENV !== 'production') {
    for (const [k, v] of Object.entries(meta.debug)) {
      if (v === undefined || v === null) continue;
      out.push({ kind: 'meta-name', key: `debug:${k}`, value: String(v) });
    }
  }

  return filterClientHeadSpecs(out);
}
