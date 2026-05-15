// ===================================================================
// FILE: frontend/src/integrations/shared/skill.ts
// FINAL — Skill types + helpers + query mappers
// - Mirrors backend: skill_counters(+i18n) + skill_logos(+i18n)
// - Public: GET /skills => grouped response
// - Admin: /admin/skill-counters, /admin/skill-logos
// - NO default_locale requirement (per request)
// ===================================================================

import type { BoolLike } from '@/integrations/shared';

export type SkillTrack = 'right' | 'left';

export interface SkillCounterMerged {
  id: string;
  is_active: boolean;
  display_order: number;

  percent: number; // 0..100

  image_url: string | null;
  image_asset_id: string | null;

  locale: string;
  title: string;
  slug: string;

  created_at?: string;
  updated_at?: string;
}

export interface SkillLogoMerged {
  id: string;
  is_active: boolean;
  display_order: number;

  track: SkillTrack;

  image_url: string | null;
  image_asset_id: string | null;

  locale: string;
  label: string;

  created_at?: string;
  updated_at?: string;
}

export type SkillsGroupedResponse = {
  locale: string;
  counters: SkillCounterMerged[];
  logos_right: SkillLogoMerged[];
  logos_left: SkillLogoMerged[];
};

// -----------------------------------------------------
// Query params (list)
// backend validation: limit/offset/is_active/track/locale
// -----------------------------------------------------
export type SkillListParams = {
  locale?: string;

  limit?: number;
  offset?: number;

  active?: boolean; // maps to is_active
  track?: SkillTrack;
};

// -----------------------------------------------------
// Admin payloads (create/patch)
// Backend: skill/validation.ts
// -----------------------------------------------------

export type CreateSkillCounterInput = {
  percent: number;

  image_url?: string | null;
  image_asset_id?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  title: string;
  slug: string;
};

export type PatchSkillCounterInput = {
  percent?: number;

  image_url?: string | null;
  image_asset_id?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  title?: string;
  slug?: string;
};

export type CreateSkillLogoInput = {
  track?: SkillTrack;

  image_url?: string | null;
  image_asset_id?: string | null;

  is_active?: BoolLike;
  display_order?: number;

  locale?: string;
  label: string;
};

export type PatchSkillLogoInput = {
  track?: SkillTrack;

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
export function unwrap<T>(raw: any): T {
  return (raw?.data ?? raw?.result ?? raw?.payload ?? raw) as T;
}

export function toPublicSkillQuery(p?: SkillListParams | void | null) {
  const q: Record<string, any> = {};
  q.is_active = true; // public default

  if (!p) return q;

  if (p.locale) q.locale = p.locale;

  if (typeof p.active === 'boolean') q.is_active = p.active;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  // optional (if backend ever supports filtering logos by track via query)
  if (p.track) q.track = p.track;

  return q;
}

// Admin list query (no default is_active)
export function toAdminSkillQuery(p?: SkillListParams | void | null) {
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
function isSkillTrack(v: any): v is SkillTrack {
  return v === 'right' || v === 'left';
}

export function splitSkills(raw: any): SkillsGroupedResponse {
  const r = unwrap<any>(raw);

  // case A: grouped response from backend
  if (
    r &&
    typeof r === 'object' &&
    (Array.isArray(r.counters) || Array.isArray(r.logos_right) || Array.isArray(r.logos_left))
  ) {
    return {
      locale: typeof r.locale === 'string' ? r.locale : 'en',
      counters: Array.isArray(r.counters) ? r.counters : [],
      logos_right: Array.isArray(r.logos_right) ? r.logos_right : [],
      logos_left: Array.isArray(r.logos_left) ? r.logos_left : [],
    };
  }

  // case B: list-ish response (best-effort)
  const arr: any[] = Array.isArray(r) ? r : Array.isArray(r?.items) ? r.items : [];

  const counters: SkillCounterMerged[] = arr.filter(
    (x) => x && typeof x === 'object' && typeof x.percent !== 'undefined',
  );

  const logos: SkillLogoMerged[] = arr.filter(
    (x) => x && typeof x === 'object' && isSkillTrack(x.track),
  );

  return {
    locale: typeof r?.locale === 'string' ? r.locale : 'en',
    counters,
    logos_right: logos.filter((x) => x.track === 'right'),
    logos_left: logos.filter((x) => x.track === 'left'),
  };
}

// -------------------------
// Convenience splitters
// -------------------------
/** convenience for Skills1 only */
export function splitSkillsCounters(raw: any): SkillCounterMerged[] {
  return splitSkills(raw).counters || [];
}

/** convenience for Skills2 marquee (right track) */
export function splitSkillsLogosRight(raw: any): SkillLogoMerged[] {
  return splitSkills(raw).logos_right || [];
}

/** convenience for Skills2 marquee (left track) */
export function splitSkillsLogosLeft(raw: any): SkillLogoMerged[] {
  return splitSkills(raw).logos_left || [];
}
