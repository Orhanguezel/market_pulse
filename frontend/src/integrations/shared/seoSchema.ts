// =============================================================
// FILE: src/integrations/shared/seoSchema.ts
// SEO Schema (STRICT) + DB-backed Defaults — varsayılanlar src/config/site-defaults.json
// SINGLE SOURCE OF TRUTH: open_graph.images[]
// =============================================================

import { z } from 'zod';

import siteDefaults from '@/config/site-defaults.json';
import { getPublicAppName } from '@/lib/site-config';

function resolveAppNameTemplates(s: string): string {
  const app = getPublicAppName();
  return s.replace(/\{\{appName\}\}/g, app);
}

const nonEmpty = z.string().trim().min(1);

/** -------------------------------------------------------------
 * STRICT SCHEMAS
 * ------------------------------------------------------------ */

export const seoOpenGraphSchema = z
  .object({
    type: z.enum(['website', 'article', 'product']).default('website'),
    /** ✅ SINGLE SOURCE: images[] only */
    images: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const seoTwitterSchema = z
  .object({
    card: z
      .enum(['summary', 'summary_large_image', 'app', 'player'])
      .default('summary_large_image'),
    site: z.string().trim().optional(),
    creator: z.string().trim().optional(),
  })
  .strict();

export const seoRobotsSchema = z
  .object({
    noindex: z.boolean().default(false),
    index: z.boolean().default(true),
    follow: z.boolean().default(true),
  })
  .strict();

export const seoSchema = z
  .object({
    site_name: nonEmpty,
    title_default: nonEmpty,
    title_template: nonEmpty,
    description: z.string().trim().optional(),

    open_graph: seoOpenGraphSchema.default({
      type: 'website',
      images: ['/img/og-default.jpg'],
    }),

    twitter: seoTwitterSchema.default({
      card: 'summary_large_image',
      site: '',
      creator: '',
    }),

    robots: seoRobotsSchema.default({
      noindex: false,
      index: true,
      follow: true,
    }),
  })
  .strict();

export type SeoObject = z.infer<typeof seoSchema>;

export const siteMetaDefaultSchema = z
  .object({
    title: nonEmpty,
    description: nonEmpty,
    keywords: z.string().trim().optional(),
  })
  .strict();

export type SiteMetaDefaultObject = z.infer<typeof siteMetaDefaultSchema>;

export const DEFAULT_OG_IMAGE = '/img/og-default.jpg';

/** -------------------------------------------------------------
 * GLOBAL FALLBACKS (DB boş/kırık ise)
 * ------------------------------------------------------------ */

/**
 * ✅ Global fallback – DB boş/kırık olduğunda kullanılır.
 * Asıl değerler site_settings.seo / site_settings.site_seo içinden gelir.
 */
const parsedSeoGlobal = seoSchema.parse(siteDefaults.seo.global);
export const DEFAULT_SEO_GLOBAL: SeoObject = {
  ...parsedSeoGlobal,
  site_name: resolveAppNameTemplates(parsedSeoGlobal.site_name),
  title_default: resolveAppNameTemplates(parsedSeoGlobal.title_default),
  title_template: resolveAppNameTemplates(parsedSeoGlobal.title_template),
  description: parsedSeoGlobal.description
    ? resolveAppNameTemplates(parsedSeoGlobal.description)
    : undefined,
};

/**
 * ✅ Locale bazlı meta fallback – DB’de locale karşılığı yoksa kullanılır.
 * Asıl değerler site_settings.site_meta_default içinden gelecektir.
 */
export const DEFAULT_SITE_META_DEFAULT_BY_LOCALE: Record<string, SiteMetaDefaultObject> =
  Object.fromEntries(
    Object.entries(
      siteDefaults.seo.siteMetaByLocale as Record<string, { title: string; description: string; keywords?: string }>,
    ).map(([k, v]) => [
      k,
      siteMetaDefaultSchema.parse({
        title: resolveAppNameTemplates(v.title),
        description: resolveAppNameTemplates(v.description),
        keywords: v.keywords ? resolveAppNameTemplates(v.keywords) : undefined,
      }),
    ]),
  );

/* ------------------------------------------------------------------
 * HELPERS – DB site_settings.value -> Tip güvenli objeler
 * ------------------------------------------------------------------ */

function tryParseJson(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  const s = input.trim();
  if (!s) return {};
  if (!((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']')))) {
    return input;
  }
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * open_graph.images normalizer:
 * - DB’de bazen images: [{url:"..."}] veya {images:[...]} gibi karışık format gelebilir
 * - Bizim tek kabulümüz: string[]
 */
function normalizeOgImages(input: unknown): string[] {
  const out: string[] = [];

  const pushIfString = (v: unknown) => {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) out.push(s);
    }
  };

  if (!input) return out;

  // direct array
  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === 'string') pushIfString(item);
      else if (item && typeof item === 'object' && !Array.isArray(item)) {
        // common shapes: { url: "..." } or { src: "..." }
        const anyObj = item as Record<string, unknown>;
        pushIfString(anyObj.url);
        pushIfString(anyObj.src);
      }
    }
    return out;
  }

  // object { images: [...] } or { url: '...' }
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.images)) {
      return normalizeOgImages(obj.images);
    }
    pushIfString(obj.url);
    pushIfString(obj.src);
    return out;
  }

  // string
  pushIfString(input);
  return out;
}

/**
 * site_settings.seo / site_seo için parse helper:
 *
 *  - input: DB’den gelen value (JSON string, object, vs.)
 *  - output: SeoObject
 *  - davranış:
 *      * Zod ile validate eder
 *      * Eksik alanları DEFAULT_SEO_GLOBAL ile doldurur
 *      * open_graph.images normalize edilir (string[])
 *      * Bozuk/parse edilemeyen durumda tam fallback: DEFAULT_SEO_GLOBAL
 */
export function parseSeoFromSettings(input: unknown): SeoObject {
  const base = DEFAULT_SEO_GLOBAL;

  if (input === null || input === undefined) return base;

  const raw = tryParseJson(input);

  try {
    const partial = seoSchema.partial().parse(raw) as Partial<SeoObject>;

    // normalize images (single source)
    const images = normalizeOgImages(partial.open_graph?.images);

    return {
      ...base,
      ...partial,
      open_graph: {
        ...base.open_graph,
        ...(partial.open_graph ?? {}),
        images: images.length ? images : base.open_graph.images,
      },
      twitter: {
        ...base.twitter,
        ...(partial.twitter ?? {}),
      },
      robots: {
        ...base.robots,
        ...(partial.robots ?? {}),
      },
    };
  } catch {
    return base;
  }
}

/**
 * site_settings.site_meta_default parse helper (Energetische Massage uyumlu):
 *
 * Desteklenen DB formatları:
 *
 * A) ✅ Yeni standart (senin seed’in): locale başına tek kayıt
 *    value = { "title":"...", "description":"...", "keywords":"..." }
 *
 * B) Eski/alternatif: tek kayıtta map
 *    value = {
 *      "tr": { "title":"...", "description":"...", "keywords":"..." },
 *      "en": { ... },
 *      "de": { ... }
 *    }
 *
 * Bu helper her iki formatı da normalize edip döndürür:
 *   Record<string, SiteMetaDefaultObject>
 */
export function parseSiteMetaDefaultByLocale(
  input: unknown,
): Record<string, SiteMetaDefaultObject> {
  const base = DEFAULT_SITE_META_DEFAULT_BY_LOCALE;

  if (input === null || input === undefined) return base;

  const raw = tryParseJson(input);

  // Case A: direct object {title,description,...}
  // (DB'den locale bazlı tek kayıt okuyorsan bu fonksiyonu çağırırken locale'ı ayrıca biliyor olabilirsin,
  // ama burada yine de map formatına normalize edeceğiz.)
  const looksLikeSingle = (v: unknown) => {
    return (
      !!v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      'title' in (v as any) &&
      'description' in (v as any)
    );
  };

  // Case B: map { tr:{...}, en:{...} }
  const looksLikeMap = (v: unknown) => {
    return !!v && typeof v === 'object' && !Array.isArray(v) && !looksLikeSingle(v);
  };

  // If it's a single meta object, we cannot know locale here; return base merged with "en" override as safest.
  // Prefer caller to use parseSiteMetaDefault(input) below when locale known.
  if (looksLikeSingle(raw)) {
    // validate single then merge as "en" override fallback
    try {
      const single = siteMetaDefaultSchema.parse(raw);
      return {
        ...base,
        en: single,
      };
    } catch {
      return base;
    }
  }

  if (!looksLikeMap(raw)) return base;

  const result: Record<string, SiteMetaDefaultObject> = {};

  for (const [locale, val] of Object.entries(raw as Record<string, unknown>)) {
    try {
      result[locale] = siteMetaDefaultSchema.parse(val);
    } catch {
      const fb = base[locale] || base.en || base.tr;
      if (fb) result[locale] = fb;
    }
  }

  for (const [loc, def] of Object.entries(base)) {
    if (!result[loc]) result[loc] = def;
  }

  return result;
}

/**
 * ✅ site_settings.site_meta_default tek kayıt (locale’ye göre okunuyorsa) için pratik helper:
 * - input: o locale için value (tek obje)
 * - locale: 'tr' | 'en' | 'de' | ...
 */
export function parseSiteMetaDefault(input: unknown, locale: string): SiteMetaDefaultObject {
  const base =
    DEFAULT_SITE_META_DEFAULT_BY_LOCALE[locale] || DEFAULT_SITE_META_DEFAULT_BY_LOCALE.en;

  if (input === null || input === undefined) return base;

  const raw = tryParseJson(input);

  try {
    return siteMetaDefaultSchema.parse(raw);
  } catch {
    return base;
  }
}
