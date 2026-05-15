// =============================================================
// FILE: src/modules/siteSettings/seo.validation.ts
// corporate-backend – SEO strict Zod schemas (backend)
// SINGLE SOURCE: open_graph.images[]
// Back-compat: if open_graph.image exists, normalize to images[0]
// =============================================================

import { z } from 'zod';

const nonEmpty = z.string().trim().min(1);
const urlish = z
  .string()
  .trim()
  .min(1)
  .refine((s) => /^https?:\/\//i.test(s) || s.startsWith('/'), 'Invalid URL');

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export const seoOpenGraphSchemaStrict = z
  .object({
    type: z.enum(['website', 'article', 'product']).default('website'),
    images: z.array(urlish).default([]),
  })
  .strict();

export const seoTwitterSchemaStrict = z
  .object({
    card: z
      .enum(['summary', 'summary_large_image', 'app', 'player'])
      .default('summary_large_image'),
    site: z.string().trim().optional().default(''),
    creator: z.string().trim().optional().default(''),
  })
  .strict();

export const seoRobotsSchemaStrict = z
  .object({
    noindex: z.boolean().default(false),
    index: z.boolean().default(true),
    follow: z.boolean().default(true),
  })
  .strict();

export const seoSchemaStrict = z
  .object({
    site_name: nonEmpty,
    title_default: nonEmpty,
    title_template: nonEmpty,
    description: z.string().trim().optional().default(''),

    open_graph: seoOpenGraphSchemaStrict.default({
      type: 'website',
      images: ['/img/og-default.jpg'],
    }),

    twitter: seoTwitterSchemaStrict.default({
      card: 'summary_large_image',
      site: '',
      creator: '',
    }),

    robots: seoRobotsSchemaStrict.default({
      noindex: false,
      index: true,
      follow: true,
    }),
  })
  .strict();

export const siteMetaDefaultSchemaStrict = z
  .object({
    title: nonEmpty,
    description: nonEmpty,
    keywords: z.string().trim().optional().default(''),
  })
  .strict();

export type SeoObjectStrict = z.infer<typeof seoSchemaStrict>;
export type SiteMetaDefaultObjectStrict = z.infer<typeof siteMetaDefaultSchemaStrict>;

export const STRICT_SEO_KEYS = new Set(['seo', 'site_seo', 'site_meta_default']);

/** Legacy (DB/FE) -> Strict normalize */
type LegacySeoImageCarrier = {
  image?: unknown;
  images?: unknown;
  type?: unknown;
};

type LegacySeoObject = {
  open_graph?: unknown;
} & Record<string, unknown>;

type ValidationErrorLike = Error & {
  statusCode?: number;
  code?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeLegacySeoValue(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

  const out: LegacySeoObject = { ...value as Record<string, unknown> };

  const og = out.open_graph;
  if (isRecord(og)) {
    const ogValue = og as LegacySeoImageCarrier;
    const legacyOne = typeof ogValue.image === 'string' ? ogValue.image.trim() : '';
    const imagesRaw = Array.isArray(ogValue.images) ? ogValue.images : [];

    const images = uniq(
      [
        ...(legacyOne ? [legacyOne] : []),
        ...imagesRaw.map((x) => String(x || '').trim()),
      ].filter(Boolean),
    );

    // single-source write-back
    out.open_graph = {
      type: typeof ogValue.type === 'string' ? ogValue.type : 'website',
      images,
    };
  }

  // twitter/robots default’lar schema içinde zaten var
  return out;
}

/**
 * Validate + normalize (strict)
 * - seo/site_seo: legacy normalize -> strict parse -> (optional) ensure images default
 * - site_meta_default: strict parse
 */
export function validateSeoSettingValue(key: string, value: unknown) {
  const k = String(key || '')
    .trim()
    .toLowerCase();

  if (k === 'seo' || k === 'site_seo') {
    const normalized = normalizeLegacySeoValue(value);
    const parsed = seoSchemaStrict.parse(normalized);

    // Deterministik: images boşsa default koy (schema default’ı open_graph için var,
    // ama kullanıcı open_graph.images=[] gönderirse de boş kalabilir)
    const og = parsed.open_graph ?? { type: 'website', images: [] };
    const images = Array.isArray(og.images) ? og.images.filter(Boolean) : [];
    const fixed = {
      ...parsed,
      open_graph: {
        type: og.type || 'website',
        images: images.length ? images : ['/img/og-default.jpg'],
      },
    };

    return fixed;
  }

  if (k === 'site_meta_default') {
    return siteMetaDefaultSchemaStrict.parse(value);
  }

  return value;
}

/**
 * Locale rules:
 * - seo, site_seo: '*' allowed (global default) OR arbitrary locale allowed
 * - site_meta_default: '*' NOT allowed (must be per-locale)
 */
export function assertSeoLocaleRule(key: string, locale: string) {
  const k = String(key || '')
    .trim()
    .toLowerCase();
  const loc = String(locale || '').trim();

  if (k === 'site_meta_default' && loc === '*') {
    const err: ValidationErrorLike = new Error('site_meta_default_cannot_be_global');
    err.statusCode = 400;
    err.code = 'validation_error';
    throw err;
  }
}
