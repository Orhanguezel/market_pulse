// =============================================================
// FILE: src/integrations/shared/footer_sections.types.ts
// Ensotek – Footer Sections DTO & Payload Types
// =============================================================

import { BoolLike, asStr, toNum } from '@/integrations/shared';
import type { ApiFooterSection } from '@/integrations/shared';

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
export const isTrue = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

export const normalizeFooterSection = (r: ApiFooterSection): FooterSectionDto => ({
  id: asStr((r as any).id),
  is_active: isTrue((r as any).is_active),
  display_order: toNum((r as any).display_order, 0),
  created_at: asStr((r as any).created_at),
  updated_at: asStr((r as any).updated_at),
  title: (r as any).title ?? '',
  slug: (r as any).slug ?? '',
  description: (r as any).description ?? null,
  locale: ((r as any).locale_resolved ?? (r as any).locale ?? null) as any,
});

export const isActiveFooterSection = (s?: FooterSectionDto | null): boolean =>
  !!s && s.is_active !== false;

export const sortFooterSections = (items: FooterSectionDto[]): FooterSectionDto[] =>
  (items || []).slice().sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

export function stableKey(params?: FooterSectionListQueryParams | void) {
  if (!params) return 'list:{}';
  const p = params as FooterSectionListQueryParams;

  const locale = (p as any).locale ?? '';
  const q = (p as any).q ?? '';
  const sort = (p as any).sort ?? '';
  const orderDir = (p as any).orderDir ?? '';
  const limit = typeof (p as any).limit === 'number' ? String((p as any).limit) : '';
  const offset = typeof (p as any).offset === 'number' ? String((p as any).offset) : '';

  return `list:{locale=${locale}|q=${q}|sort=${sort}|orderDir=${orderDir}|limit=${limit}|offset=${offset}}`;
}

export type GetFooterSectionAdminArg = {
  id: string;
  locale?: string; // optional
};
