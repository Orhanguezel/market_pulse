// =============================================================
// FILE: src/integrations/shared/campaigns.ts
// Campaign types and normalizers
// =============================================================

import { trimStr, toBool, toNumber, isObject } from './common';

export type CampaignType = 'discount_percentage' | 'discount_fixed' | 'bonus_credits' | 'free_trial_days';
export type CampaignAppliesTo = 'subscription' | 'credit_package' | 'consultant_booking' | 'all';

export interface CampaignRow {
  id: string;
  code: string;
  name_tr: string;
  name_en: string;
  description_tr?: string | null;
  description_en?: string | null;
  type: CampaignType;
  value: number;
  max_uses?: number | null;
  max_uses_per_user: number;
  used_count: number;
  starts_at?: string | null;
  ends_at?: string | null;
  applies_to: CampaignAppliesTo;
  target_audience?: any | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminCampaignsListParams {
  is_active?: boolean | number;
  applies_to?: CampaignAppliesTo;
  limit?: number;
  offset?: number;
}

export interface CampaignCreatePayload {
  code: string;
  name_tr: string;
  name_en: string;
  description_tr?: string;
  description_en?: string;
  type: CampaignType;
  value: number;
  max_uses?: number | null;
  max_uses_per_user?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  applies_to?: CampaignAppliesTo;
  target_audience?: any;
  is_active?: boolean;
}

export interface CampaignUpdatePayload extends Partial<CampaignCreatePayload> {}

export function normalizeCampaignRow(row: unknown): CampaignRow {
  if (!isObject(row)) throw new Error('Invalid campaign row');
  const r = row as any;
  return {
    id: trimStr(r.id),
    code: trimStr(r.code),
    name_tr: trimStr(r.name_tr),
    name_en: trimStr(r.name_en),
    description_tr: r.description_tr ? trimStr(r.description_tr) : null,
    description_en: r.description_en ? trimStr(r.description_en) : null,
    type: (r.type || 'discount_percentage') as CampaignType,
    value: toNumber(r.value, 0),
    max_uses: r.max_uses !== undefined && r.max_uses !== null ? toNumber(r.max_uses) : null,
    max_uses_per_user: toNumber(r.max_uses_per_user, 1),
    used_count: toNumber(r.used_count, 0),
    starts_at: r.starts_at ? trimStr(r.starts_at) : null,
    ends_at: r.ends_at ? trimStr(r.ends_at) : null,
    applies_to: (r.applies_to || 'all') as CampaignAppliesTo,
    target_audience: r.target_audience,
    is_active: toBool(r.is_active, true),
    created_at: r.created_at ? trimStr(r.created_at) : undefined,
    updated_at: r.updated_at ? trimStr(r.updated_at) : undefined,
  };
}

export function buildAdminCampaignsListParams(params?: AdminCampaignsListParams): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
