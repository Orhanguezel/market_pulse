// =============================================================
// FILE: src/integrations/shared/banners.ts
// Banner types and normalizers
// =============================================================

import { trimStr, toBool, toNumber, parseMediaUrl, isObject } from './common';

export type BannerPlacement =
  | 'home_hero'
  | 'home_sidebar'
  | 'home_footer'
  | 'consultant_list'
  | 'mobile_welcome'
  | 'mobile_home'
  | 'mobile_call_end'
  | 'admin_dashboard';

export type BannerTargetSegment = 'all' | 'free' | 'paid' | 'new_user' | 'existing_user';

export interface BannerRow {
  id: string;
  code: string;
  title_tr?: string | null;
  title_en?: string | null;
  subtitle_tr?: string | null;
  subtitle_en?: string | null;
  image_url: string;
  image_url_mobile?: string | null;
  link_url?: string | null;
  cta_label_tr?: string | null;
  cta_label_en?: string | null;
  placement: BannerPlacement;
  locale: string;
  starts_at?: string | null;
  ends_at?: string | null;
  target_segment: BannerTargetSegment;
  campaign_id?: string | null;
  priority: number;
  is_active: boolean;
  view_count: number;
  click_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminBannersListParams {
  placement?: BannerPlacement;
  locale?: string;
  is_active?: boolean | number;
  limit?: number;
  offset?: number;
}

export interface BannerCreatePayload {
  code: string;
  title_tr?: string;
  title_en?: string;
  subtitle_tr?: string;
  subtitle_en?: string;
  image_url: string;
  image_url_mobile?: string;
  link_url?: string;
  cta_label_tr?: string;
  cta_label_en?: string;
  placement: BannerPlacement;
  locale?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  target_segment?: BannerTargetSegment;
  campaign_id?: string | null;
  priority?: number;
  is_active?: boolean;
}

export interface BannerUpdatePayload extends Partial<BannerCreatePayload> {}

export function normalizeBannerRow(row: unknown): BannerRow {
  if (!isObject(row)) throw new Error('Invalid banner row');
  const r = row as any;
  return {
    id: trimStr(r.id),
    code: trimStr(r.code),
    title_tr: r.title_tr ? trimStr(r.title_tr) : null,
    title_en: r.title_en ? trimStr(r.title_en) : null,
    subtitle_tr: r.subtitle_tr ? trimStr(r.subtitle_tr) : null,
    subtitle_en: r.subtitle_en ? trimStr(r.subtitle_en) : null,
    image_url: parseMediaUrl(r.image_url),
    image_url_mobile: r.image_url_mobile ? parseMediaUrl(r.image_url_mobile) : null,
    link_url: r.link_url ? trimStr(r.link_url) : null,
    cta_label_tr: r.cta_label_tr ? trimStr(r.cta_label_tr) : null,
    cta_label_en: r.cta_label_en ? trimStr(r.cta_label_en) : null,
    placement: (r.placement || 'home_hero') as BannerPlacement,
    locale: trimStr(r.locale || '*'),
    starts_at: r.starts_at ? trimStr(r.starts_at) : null,
    ends_at: r.ends_at ? trimStr(r.ends_at) : null,
    target_segment: (r.target_segment || 'all') as BannerTargetSegment,
    campaign_id: r.campaign_id ? trimStr(r.campaign_id) : null,
    priority: toNumber(r.priority, 0),
    is_active: toBool(r.is_active, true),
    view_count: toNumber(r.view_count, 0),
    click_count: toNumber(r.click_count, 0),
    created_at: r.created_at ? trimStr(r.created_at) : undefined,
    updated_at: r.updated_at ? trimStr(r.updated_at) : undefined,
  };
}

export function buildAdminBannersListParams(params?: AdminBannersListParams): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
