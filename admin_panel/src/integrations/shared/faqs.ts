// =============================================================
// FILE: src/integrations/types/faqs.types.ts
// FINAL — Backend faqs modülü ile uyumlu tipler
// =============================================================

import type { BoolLike } from '@/integrations/shared';

export type FaqSortable = 'created_at' | 'updated_at' | 'display_order';

export interface FaqDto {
  id: string;
  is_active: BoolLike;
  display_order: number;

  created_at: string;
  updated_at: string;

  question: string | null;
  answer: string | null;
  slug: string | null;

  locale_resolved: string | null;
}

export interface ApiFaqAdmin {
  id: string | number;

  is_active: BoolLike;
  display_order?: number | null;

  created_at: string | Date;
  updated_at: string | Date;

  question?: string | null;
  answer?: string | null;
  slug?: string | null;

  locale_resolved?: string | null;
}

const toIsoString = (v: unknown): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
};

const toNumber = (v: unknown, fallback = 0): number => {
  const n =
    typeof v === 'number'
      ? v
      : typeof v === 'string'
      ? Number(v)
      : v == null
      ? NaN
      : Number(String(v));
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeFaqAdmin = (row: ApiFaqAdmin): FaqDto => ({
  id: String(row?.id ?? ''),
  is_active: (row?.is_active ?? 0) as BoolLike,
  display_order: toNumber(row?.display_order, 0),

  created_at: toIsoString(row?.created_at),
  updated_at: toIsoString(row?.updated_at),

  question: row?.question ?? null,
  answer: row?.answer ?? null,
  slug: row?.slug ?? null,
  locale_resolved: row?.locale_resolved ?? null,
});

/**
 * LIST query params – backend faqListQuerySchema uyumlu
 * ✅ Tek format: sort + orderDir
 * ✅ locale: RTK seviyesinde desteklenir (header/query)
 */
export interface FaqListQueryParams {
  sort?: FaqSortable;
  orderDir?: 'asc' | 'desc';

  limit?: number;
  offset?: number;

  is_active?: BoolLike;
  q?: string;
  slug?: string;

  select?: string;

  locale?: string;
}

interface FaqBasePayload {
  is_active?: BoolLike;
  display_order?: number;
}

export interface FaqCreatePayload extends FaqBasePayload {
  question: string;
  answer: string;
  slug: string;
  locale?: string;
}

export interface FaqUpdatePayload extends FaqBasePayload {
  question?: string;
  answer?: string;
  slug?: string;
  locale?: string;
}
