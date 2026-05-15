// =============================================================
// FILE: src/integrations/types/footer_sections.types.ts
// – Footer Sections DTO & Payload Types
// =============================================================

import { BoolLike, safeStr, toBool } from '@/integrations/shared';

/**
 * LIST query params – backend'deki footerSectionListQuerySchema ile uyumlu
 */
export interface FooterSectionListQueryParams {
  order?: string; // "display_order.asc" vb.
  sort?: 'display_order' | 'created_at' | 'updated_at';
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  is_active?: BoolLike;
  q?: string;
  slug?: string;
  locale?: string; // 🔹 çoklu dil desteği
}

/**
 * Backend'den gelen ham kayıt (FooterSectionMerged)
 */
export interface ApiFooterSection {
  id: string;
  is_active: 0 | 1;
  display_order: number;
  created_at: string; // MySQL datetime string
  updated_at: string;

  title: string | null;
  slug: string | null;
  description: string | null;
  locale_resolved: string | null;
}

/**
 * Frontend için normalize edilmiş DTO
 */
export interface FooterSectionDto {
  id: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;

  title: string;
  slug: string;
  description: string | null;
  locale: string | null;
}

/**
 * Admin liste endpoint'i için response shape
 * (body: items[], header: x-total-count)
 */
export interface FooterSectionListResult {
  items: FooterSectionDto[];
  total: number;
}

/**
 * CREATE payload (UpsertFooterSectionBody)
 */
export interface FooterSectionCreatePayload {
  // i18n
  title: string;
  slug: string;
  description?: string | null;
  locale?: string;

  // parent
  is_active?: BoolLike;
  display_order?: number;
}

/**
 * UPDATE payload (PatchFooterSectionBody)
 */
export type FooterSectionUpdatePayload = Partial<FooterSectionCreatePayload>;

/* ------------------------------------------------------------------
 * Normalizer
 * ------------------------------------------------------------------ */

export const normalizeFooterSection = (r: ApiFooterSection): FooterSectionDto => ({
  id: safeStr(r.id),
  is_active: toBool(r.is_active),
  display_order: typeof r.display_order === 'number' ? r.display_order : 0,
  created_at: safeStr(r.created_at),
  updated_at: safeStr(r.updated_at),
  title: r.title ?? '',
  slug: r.slug ?? '',
  description: r.description ?? null,
  locale: r.locale_resolved ?? null,
});
