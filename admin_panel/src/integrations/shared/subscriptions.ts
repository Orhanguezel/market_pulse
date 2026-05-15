// =============================================================
// Subscription admin/shared types
// =============================================================

export type AdminSubscriptionStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'grace_period'
  | 'past_due';

export type SubscriptionProvider = 'iyzipay' | 'apple_iap' | 'google_iap' | 'manual';

export type SubscriptionPlanPeriod = 'monthly' | 'yearly' | 'lifetime';

export type SubscriptionPlanAdmin = {
  id: string;
  code: string;
  name_tr: string;
  name_en: string;
  description_tr: string | null;
  description_en: string | null;
  price_minor: number;
  currency: string;
  period: SubscriptionPlanPeriod;
  trial_days: number;
  features: string | string[] | null;
  is_active: number;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type SubscriptionAdmin = {
  id: string;
  user_id: string;
  plan_id: string;
  provider: SubscriptionProvider;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  status: AdminSubscriptionStatus;
  started_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  auto_renew: number;
  price_minor: number;
  currency: string;
  created_at: string | null;
  updated_at: string | null;

  user_email: string | null;
  user_full_name: string | null;
  user_phone: string | null;

  plan_code: string | null;
  plan_name_tr: string | null;
  plan_name_en: string | null;
};

export type SubscriptionPlanAdminPayload = {
  code: string;
  name_tr: string;
  name_en: string;
  description_tr?: string | null;
  description_en?: string | null;
  price_minor: number;
  currency?: string;
  period: SubscriptionPlanPeriod;
  trial_days?: number;
  features?: string[] | null;
  is_active?: number;
  display_order?: number;
};

export type SubscriptionPlanAdminUpdatePayload = Partial<SubscriptionPlanAdminPayload>;

export type SubscriptionAdminListQuery = {
  q?: string;
  status?: AdminSubscriptionStatus;
  user_id?: string;
  plan_id?: string;
  provider?: string;
  limit?: number;
  offset?: number;
};

export type SubscriptionPlanAdminListQuery = {
  q?: string;
  is_active?: boolean | number;
  period?: SubscriptionPlanPeriod;
  limit?: number;
  offset?: number;
};

export type SubscriptionAdminListResponse = {
  data: SubscriptionAdmin[];
  limit: number;
  offset: number;
  total: number;
};

export type SubscriptionPlanAdminListResponse = {
  data: SubscriptionPlanAdmin[];
  limit: number;
  offset: number;
  total: number;
};

export type RefundSubscriptionPayload = {
  reason?: string;
  ended_at?: string;
};

function asStr(v: unknown) {
  return String(v ?? '').trim();
}

function asNullStr(v: unknown): string | null {
  const s = asStr(v);
  return s ? s : null;
}

function asNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBoolNum(v: unknown, fallback = 0): number {
  if (v === true) return 1;
  if (v === false) return 0;
  if (typeof v === 'number') return v ? 1 : 0;
  const s = asStr(v).toLowerCase();
  return s === 'true' || s === '1' ? 1 : fallback;
}

function normalizeStatus(v: unknown): AdminSubscriptionStatus {
  const s = asStr(v);
  if (['pending', 'active', 'cancelled', 'expired', 'grace_period', 'past_due'].includes(s)) {
    return s as AdminSubscriptionStatus;
  }
  return 'pending';
}

function normalizeProvider(v: unknown): SubscriptionProvider {
  const p = asStr(v);
  if (['apple_iap', 'google_iap', 'manual'].includes(p)) return p as SubscriptionProvider;
  return 'iyzipay';
}

function normalizePlanPeriod(v: unknown): SubscriptionPlanPeriod {
  const p = asStr(v);
  if (['monthly', 'yearly', 'lifetime'].includes(p)) return p as SubscriptionPlanPeriod;
  return 'monthly';
}

export function normalizeFeatures(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    return raw.map((v) => asStr(v)).filter(Boolean);
  }

  const s = asStr(raw);
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => asStr(v)).filter(Boolean);
    }
  } catch {
    return s
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return null;
}

export function normalizeSubscriptionAdmin(raw: unknown): SubscriptionAdmin {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asStr(r.id),
    user_id: asStr(r.user_id),
    plan_id: asStr(r.plan_id),
    provider: normalizeProvider(r.provider),
    provider_subscription_id: asNullStr(r.provider_subscription_id),
    provider_customer_id: asNullStr(r.provider_customer_id),
    status: normalizeStatus(r.status),
    started_at: asNullStr(r.started_at),
    ends_at: asNullStr(r.ends_at),
    trial_ends_at: asNullStr(r.trial_ends_at),
    cancelled_at: asNullStr(r.cancelled_at),
    cancellation_reason: asNullStr(r.cancellation_reason),
    auto_renew: asNum(r.auto_renew, 0),
    price_minor: asNum(r.price_minor, 0),
    currency: asStr(r.currency || 'TRY') || 'TRY',

    created_at: asNullStr(r.created_at),
    updated_at: asNullStr(r.updated_at),

    user_email: asNullStr(r.user_email),
    user_full_name: asNullStr(r.user_full_name),
    user_phone: asNullStr(r.user_phone),

    plan_code: asNullStr(r.plan_code),
    plan_name_tr: asNullStr(r.plan_name_tr),
    plan_name_en: asNullStr(r.plan_name_en),
  };
}

export function normalizeSubscriptionAdminList(raw: unknown): SubscriptionAdminListResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeSubscriptionAdmin) : [];
  return {
    data,
    limit: asNum(r.limit, data.length),
    offset: asNum(r.offset, 0),
    total: asNum(r.total, data.length),
  };
}

export function normalizeSubscriptionPlanAdmin(raw: unknown): SubscriptionPlanAdmin {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: asStr(r.id),
    code: asStr(r.code),
    name_tr: asStr(r.name_tr),
    name_en: asStr(r.name_en),
    description_tr: asNullStr(r.description_tr),
    description_en: asNullStr(r.description_en),
    price_minor: asNum(r.price_minor, 0),
    currency: asStr(r.currency || 'TRY') || 'TRY',
    period: normalizePlanPeriod(r.period),
    trial_days: asNum(r.trial_days, 0),
    features: normalizeFeatures(r.features),
    is_active: asBoolNum(r.is_active, 0),
    display_order: asNum(r.display_order, 0),
    created_at: asNullStr(r.created_at),
    updated_at: asNullStr(r.updated_at),
  };
}

export function normalizeSubscriptionPlanAdminList(
  raw: unknown,
): SubscriptionPlanAdminListResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(normalizeSubscriptionPlanAdmin) : [];
  return {
    data,
    limit: asNum(r.limit, data.length),
    offset: asNum(r.offset, 0),
    total: asNum(r.total, data.length),
  };
}

