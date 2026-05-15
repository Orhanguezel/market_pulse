// =============================================================
// FILE: frontend/src/integrations/shared/resume.ts
// FINAL — Resume (education/experience) types + query mappers
// - FIX: public is_active => 1/0 (not boolean) for maximum backend compatibility
// - FIX: splitResume wrapper tolerant
// =============================================================

import type { BoolLike } from '@/integrations/shared';

export type ResumeType = 'education' | 'experience';

export interface ResumeMerged {
  id: string;
  type: ResumeType;
  is_active: boolean;
  display_order: number;

  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  is_current: boolean;

  location: string | null;
  organization: string | null;

  score_value: string | null;
  score_scale: number;

  locale: string;
  title: string;
  subtitle: string;
  description: string | null;
  highlights: string[];
  slug: string;

  created_at?: string;
  updated_at?: string;
}

export type ResumeGroupedResponse = {
  locale: string;
  education: ResumeMerged[];
  experience: ResumeMerged[];
};

export type ResumeListParams = {
  locale?: string;
  default_locale?: string;

  type?: ResumeType;
  search?: string;
  slug?: string;
  active?: boolean;

  limit?: number;
  offset?: number;

  orderBy?: 'created_at' | 'updated_at' | 'display_order' | 'start_date';
  order?: 'asc' | 'desc';
};

// --------------------------------------------------
// Admin payloads (create/patch)
// Backend: upsertResumeBodySchema / patchResumeBodySchema
// --------------------------------------------------

export type UpsertResumeInput = {
  // parent
  type: ResumeType;
  is_active?: BoolLike;
  display_order?: number;

  start_date: string; // YYYY-MM-DD
  end_date?: string;
  is_current?: BoolLike;

  location?: string;
  organization?: string;

  score_value?: number | string;
  score_scale?: number;

  // i18n
  locale?: string;
  title: string;
  subtitle: string;
  description?: string;
  highlights?: string[] | string;
  slug: string;
};

export type PatchResumeInput = Partial<UpsertResumeInput>;

export type GetResumeEntryParams = { id: string; locale?: string; default_locale?: string };
export type GetResumeBySlugParams = { slug: string; locale?: string; default_locale?: string };

export function safeLocale(v?: string) {
  const s = (v || '').trim().toLowerCase();
  return s || 'en';
}

export function yearRange(item: ResumeMerged) {
  const sY = item.start_date?.slice(0, 4) || '';
  const eY = item.is_current ? 'Present' : item.end_date?.slice(0, 4) || '';
  if (!sY && !eY) return '';
  return eY ? `${sY} - ${eY}` : sY;
}

export function toPublicQuery(p?: ResumeListParams | void | null) {
  const q: Record<string, any> = {};

  // ✅ public default: active only (as number)
  q.is_active = 1;

  if (!p) return q;

  if (p.locale) q.locale = p.locale;
  if (p.default_locale) q.default_locale = p.default_locale;

  if (p.search) q.q = p.search;
  if (p.slug) q.slug = p.slug;
  if (p.type) q.type = p.type;

  // ✅ IMPORTANT: always send as 1/0
  if (typeof p.active === 'boolean') q.is_active = p.active ? 1 : 0;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.orderBy && p.order) q.order = `${p.orderBy}.${p.order}`;

  return q;
}

// Admin query mapper (no default is_active)
export function toAdminResumeQuery(p?: ResumeListParams | void | null) {
  const q: Record<string, any> = {};
  if (!p) return q;

  if (p.locale) q.locale = p.locale;
  if (p.default_locale) q.default_locale = p.default_locale;

  if (p.search) q.q = p.search;
  if (p.slug) q.slug = p.slug;
  if (p.type) q.type = p.type;

  if (typeof p.active === 'boolean') q.is_active = p.active;

  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;

  if (p.orderBy && p.order) q.order = `${p.orderBy}.${p.order}`;

  return q;
}

/**
 * backend response tolerant splitter
 * Supports:
 * - grouped: {education:[], experience:[]}
 * - wrapped: {data:{education:[], experience:[]}} etc.
 * - list: {items:[...]} or [...] (then split by type)
 */
export function splitResume(raw: any): { education: ResumeMerged[]; experience: ResumeMerged[] } {
  const r = raw?.data ?? raw?.result ?? raw?.payload ?? raw;

  if (r && typeof r === 'object' && (Array.isArray(r.education) || Array.isArray(r.experience))) {
    return {
      education: Array.isArray(r.education) ? r.education : [],
      experience: Array.isArray(r.experience) ? r.experience : [],
    };
  }

  const arr: ResumeMerged[] = Array.isArray(r) ? r : Array.isArray(r?.items) ? r.items : [];

  return {
    education: arr.filter((x) => x?.type === 'education'),
    experience: arr.filter((x) => x?.type === 'experience'),
  };
}
