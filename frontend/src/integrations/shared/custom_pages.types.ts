// =============================================================
// FILE: src/integrations/types/custom_pages.types.ts
// – Custom Pages (Sayfalar) RTK Tipleri (FINAL)
// Backend: src/modules/customPages/*
// - ✅ category_id / sub_category_id REMOVED (and related names/slugs)
// =============================================================

import { BoolLike, SortDirection } from '@/integrations/shared';

/** Sıralama alanları – backend customPageListQuerySchema ile uyumlu */
export type CustomPageSortField = 'created_at' | 'updated_at' | 'display_order' | 'order_num';

/* ------------------------------------------------------------------
 * LIST QUERY PARAMS (public + admin)
 * Backend: customPageListQuerySchema
 * ------------------------------------------------------------------ */
export interface CustomPageListQueryParams {
  order?: string;
  sort?: CustomPageSortField;
  orderDir?: SortDirection;
  limit?: number;
  offset?: number;

  is_published?: BoolLike;
  featured?: BoolLike;
  q?: string;
  slug?: string;
  select?: string;

  module_key?: string;

  /** Liste locale override (örn. "de") */
  locale?: string;
  /** Backend default_locale override (örn. "tr") */
  default_locale?: string;
}

export type CustomPageListAdminQueryParams = CustomPageListQueryParams;
export type CustomPageListPublicQueryParams = CustomPageListQueryParams;

/* ------------------------------------------------------------------
 * API DTO – Backend CustomPageMerged ile uyumlu
 * ------------------------------------------------------------------ */
export interface ApiCustomPage {
  id: string;

  /** parent: custom_pages.module_key */
  module_key: string;

  is_published: 0 | 1;
  featured: 0 | 1;

  featured_image: string | null;
  featured_image_asset_id: string | null;

  // ✅ parent sıralama + görseller (backend CustomPageMerged)
  display_order: number;
  order_num: number;

  image_url: string | null;
  storage_asset_id: string | null;

  /**
   * Not: Backend bazı ortamlarda JSON kolonu string döndürebilir.
   * O yüzden normalizeStringArray hem array hem JSON-string destekler.
   */
  images: string[] | string | null;
  storage_image_ids: string[] | string | null;

  created_at: string;
  updated_at: string;

  title: string | null;
  slug: string | null;

  /**
   * Backend: JSON-string {"html":"..."}
   * repo: CustomPageMerged.content
   */
  content: string | null;

  summary: string | null;

  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;

  tags: string | null;

  locale_resolved: string | null;
}

/* ------------------------------------------------------------------
 * FE DTO – Normalize edilmiş CustomPage
 * ------------------------------------------------------------------ */
export interface CustomPageDto {
  id: string;
  module_key: string;

  is_published: boolean;
  featured: boolean;

  featured_image: string | null;
  featured_image_asset_id: string | null;

  display_order: number;
  order_num: number;

  image_url: string | null;
  storage_asset_id: string | null;
  images: string[];
  storage_image_ids: string[];

  created_at: string;
  updated_at: string;

  title: string | null;
  slug: string | null;

  content_raw: string | null;
  content_html: string;
  content: string;

  summary: string | null;

  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;

  tags_raw: string | null;
  tags: string[];

  locale_resolved: string | null;
}

/* ------------------------------------------------------------------
 * Normalizer helper
 * ------------------------------------------------------------------ */

type ContentJson = { html?: string; [key: string]: unknown };

const unpackContent = (raw: string | null): string => {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Fast path: doesn't look like JSON wrapper
  if (!trimmed.startsWith('{')) return raw;

  // Try standard JSON parse first
  try {
    const parsed = JSON.parse(trimmed) as ContentJson;
    if (typeof parsed.html === 'string') return parsed.html;
    return raw;
  } catch {
    // JSON parse failed (e.g. unescaped quotes inside value)
    // Fallback: extract html value with regex
    const match = trimmed.match(/^\{"html"\s*:\s*"([\s\S]*)"\s*\}$/);
    if (match?.[1]) {
      return match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
    return raw;
  }
};

const toBoolFrom01 = (v: 0 | 1): boolean => v === 1;

const parseTags = (raw: string | null): string[] => {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((t) => t.trim())
    .filter((t, idx, arr) => t.length > 0 && arr.indexOf(t) === idx);
};

/**
 * API içinden ham content string'ini seç:
 * - Öncelik sırası: content → content_raw → content_html
 */
const pickApiContentRaw = (api: ApiCustomPage): string | null => {
  const anyApi = api as any;
  return (api.content ?? anyApi.content_raw ?? anyApi.content_html ?? null) as string | null;
};

const normalizeStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) {
    return v.map((x) => String(x ?? '').trim()).filter((s) => s.length > 0);
  }

  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];

    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x ?? '').trim()).filter((t) => t.length > 0);
        }
      } catch {
        // ignore
      }
    }

    if (s.includes(',') || s.includes(';')) {
      return s
        .split(/[;,]/)
        .map((x) => x.trim())
        .filter((t) => t.length > 0);
    }

    return [s];
  }

  return [];
};

export const normalizeCustomPage = (api: ApiCustomPage): CustomPageDto => {
  const rawContent = pickApiContentRaw(api);
  const html = unpackContent(rawContent);

  const images = normalizeStringArray(api.images);
  const storageImageIds = normalizeStringArray(api.storage_image_ids);

  const tagsArray = parseTags(api.tags);

  return {
    id: api.id,
    module_key: String((api as any).module_key ?? (api as any).moduleKey ?? ''),
    is_published: toBoolFrom01(api.is_published),
    featured: toBoolFrom01(api.featured),

    featured_image: api.featured_image ?? null,
    featured_image_asset_id: api.featured_image_asset_id ?? null,

    display_order: Number.isFinite(Number(api.display_order)) ? Number(api.display_order) : 0,
    order_num: Number.isFinite(Number(api.order_num)) ? Number(api.order_num) : 0,

    image_url: api.image_url ?? null,
    storage_asset_id: api.storage_asset_id ?? null,
    images,
    storage_image_ids: storageImageIds,

    created_at: String(api.created_at),
    updated_at: String(api.updated_at),

    title: api.title ?? null,
    slug: api.slug ?? null,

    content_raw: rawContent,
    content_html: html,
    content: html,

    summary: api.summary ?? null,

    featured_image_alt: api.featured_image_alt ?? null,
    meta_title: api.meta_title ?? null,
    meta_description: api.meta_description ?? null,

    tags_raw: api.tags ?? null,
    tags: tagsArray,

    locale_resolved: api.locale_resolved ?? null,
  };
};

export const mapApiCustomPageToDto = normalizeCustomPage;

/* ------------------------------------------------------------------
 * PAYLOAD – CREATE / UPDATE
 * Backend: UpsertCustomPageBody, PatchCustomPageBody
 * ------------------------------------------------------------------ */

export interface CustomPageCreatePayload {
  // i18n zorunlu alanlar
  locale?: string;
  title: string;
  slug: string;
  content: string; // düz HTML – backend packContent ile {"html":"..."} yapar

  summary?: string | null;

  featured_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;

  tags?: string | null;

  // parent alanları
  is_published?: BoolLike;
  featured?: BoolLike;

  featured_image?: string | null;
  featured_image_asset_id?: string | null;

  display_order?: number;
  order_num?: number;

  image_url?: string | null;
  storage_asset_id?: string | null;
  images?: string[] | null;
  storage_image_ids?: string[] | null;
}

export interface CustomPageUpdatePayload {
  locale?: string;

  // parent
  is_published?: BoolLike;
  featured?: BoolLike;
  featured_image?: string | null;
  featured_image_asset_id?: string | null;

  display_order?: number;
  order_num?: number;

  image_url?: string | null;
  storage_asset_id?: string | null;
  images?: string[] | null;
  storage_image_ids?: string[] | null;

  // i18n
  title?: string;
  slug?: string;
  content?: string;

  summary?: string | null;

  featured_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;

  tags?: string | null;
}

/* ------------------------------------------------------------------
 * Query args (endpoint-specific)
 * ------------------------------------------------------------------ */

export type CustomPageBySlugArgs = {
  slug: string;
  locale?: string;
  default_locale?: string;
};


/** Featured olanı tercih et, yoksa ilk published'i al */
export function pickPage(items: CustomPageDto[]): CustomPageDto | null {
  const published = items.filter((p) => p.is_published);
  return published.find((p) => p.featured) ?? published[0] ?? null;
}
