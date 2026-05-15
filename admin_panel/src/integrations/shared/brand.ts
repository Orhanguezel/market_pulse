// ===================================================================
// FILE: frontend/src/integrations/shared/brand.ts
// FINAL — Brand types + helpers + query mappers
// - Mirrors backend: brand_logos(+i18n)
// - Public: GET /brands => grouped response
// - Admin: /admin/brands
// ===================================================================

import type { BoolLike } from '@/integrations/shared';
import { unwrap } from '@/integrations/shared';

export type BrandTrack = 'right' | 'left';

export interface BrandLogoMerged {
  id: string;
  is_active: boolean;
  display_order: number;

  track: BrandTrack;

  image_url: string | null;
  image_asset_id: string | null;

  locale: string;
  label: string;

  created_at?: string;
  updated_at?: string;
}

export type BrandsGroupedResponse = {
  locale: string;
  logos_right: BrandLogoMerged[];
  logos_left: BrandLogoMerged[];
};

// -----------------------------------------------------
// Query params (list)
// backend validation: limit/offset/is_active/track/locale
// -----------------------------------------------------
export type BrandListParams = {
  locale?: string;

  limit?: number;
  offset?: number;

  active?: boolean; // maps to is_active
  track?: BrandTrack;
};

// -----------------------------------------------------
// Admin payloads (create/patch)
// Backend: brand/validation.ts
// -----------------------------------------------------

export type CreateBrandLogoInput = {
  track?: BrandTrack;

  image_url?: string | null;
  image_asset_id?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  label: string;
};

export type PatchBrandLogoInput = {
  track?: BrandTrack;

  image_url?: string | null;
  image_asset_id?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  label?: string;
};

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

export function toPublicBrandQuery(p?: BrandListParams | void | null) {
  const q: Record<string, any> = {};
  q.is_active = true; // public default

  if (!p) return q;

  if (p.locale) q.locale = p.locale;

  if (typeof p.active === 'boolean') q.is_active = p.active;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.track) q.track = p.track;

  return q;
}

// Admin list query (no default is_active)
export function toAdminBrandQuery(p?: BrandListParams | void | null) {
  const q: Record<string, any> = {};
  if (!p) return q;

  if (p.locale) q.locale = p.locale;

  if (typeof p.active === 'boolean') q.is_active = p.active;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.track) q.track = p.track;

  return q;
}

// -----------------------------------------------------
// Splitters (tolerant)
// -----------------------------------------------------
function isBrandTrack(v: any): v is BrandTrack {
  return v === 'right' || v === 'left';
}

export function splitBrands(raw: any): BrandsGroupedResponse {
  const r = unwrap<any>(raw);

  // case A: grouped response from backend
  if (
    r &&
    typeof r === 'object' &&
    (Array.isArray(r.logos_right) || Array.isArray(r.logos_left))
  ) {
    return {
      locale: typeof r.locale === 'string' ? r.locale : 'en',
      logos_right: Array.isArray(r.logos_right) ? r.logos_right : [],
      logos_left: Array.isArray(r.logos_left) ? r.logos_left : [],
    };
  }

  // case B: list-ish response (best-effort)
  const arr: any[] = Array.isArray(r) ? r : Array.isArray(r?.items) ? r.items : [];

  const logos: BrandLogoMerged[] = arr.filter(
    (x) => x && typeof x === 'object' && isBrandTrack(x.track),
  );

  return {
    locale: typeof r?.locale === 'string' ? r.locale : 'en',
    logos_right: logos.filter((x) => x.track === 'right'),
    logos_left: logos.filter((x) => x.track === 'left'),
  };
}

export function splitBrandLogosRight(raw: any): BrandLogoMerged[] {
  return splitBrands(raw).logos_right || [];
}

export function splitBrandLogosLeft(raw: any): BrandLogoMerged[] {
  return splitBrands(raw).logos_left || [];
}

export function splitBrandLogosAll(raw: any): BrandLogoMerged[] {
  const { logos_right, logos_left } = splitBrands(raw);
  return [...logos_right, ...logos_left];
}
