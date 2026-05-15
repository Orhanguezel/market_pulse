// ---------------------------------------------------------------------
// FILE: src/integrations/shared/pricing.ts
// FINAL — Pricing shared types + query mappers (public + admin)
// ---------------------------------------------------------------------

export interface PricingPlan {
  id: string;
  code: string;

  // Public resolved fields (from i18n)
  badge: string;
  title?: string | null;
  description?: string | null;

  price_amount: string; // decimal string
  price_unit: string; // "hour"
  currency: string; // "USD"

  features: string[];

  cta_label?: string | null;
  cta_href?: string | null;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  created_at?: string;
  updated_at?: string;
}

// Admin returns parent + i18n array (repo patternin böyle)
export interface PricingPlanI18nRow {
  id: string;
  plan_id: string;
  locale: string;

  badge: string;
  title?: string | null;
  description?: string | null;

  features: string[];

  cta_label?: string | null;
  cta_href?: string | null;

  created_at?: string;
  updated_at?: string;
}

export type PricingPlanAdmin = {
  id: string;
  code: string;

  price_amount: string;
  price_unit: string;
  currency: string;

  is_active: boolean;
  is_featured: boolean;
  display_order: number;

  cta_href?: string | null;

  created_at?: string;
  updated_at?: string;

  i18n: PricingPlanI18nRow[];
};

export interface PricingPublicResponse {
  plans: PricingPlan[];
}

export type PricingPublicParams = {
  locale?: string;
  plans_limit?: number;
};

export type PricingPlanListParams = {
  // admin list paging
  limit?: number;
  offset?: number;
};

export type UpsertPricingPlanInput = {
  code: string;

  price_amount: string | number;
  price_unit?: string;
  currency?: string;

  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;

  cta_href?: string | null;

  i18n: Array<{
    locale: string;
    badge: string;

    title?: string | null;
    description?: string | null;

    // string[] or csv accepted (backend accepts both, same as zod)
    features?: string[] | string;

    cta_label?: string | null;
    cta_href?: string | null;
  }>;
};

export type PatchPricingPlanInput = Partial<UpsertPricingPlanInput>;

// ----------------------------- Query mappers -----------------------------

// Admin: /admin/pricing/plans?limit=&offset=
export function toAdminPricingQuery(p?: PricingPlanListParams) {
  if (!p) return undefined;
  const q: Record<string, any> = {};
  if (typeof p.limit === 'number') q.limit = p.limit;
  if (typeof p.offset === 'number') q.offset = p.offset;
  return q;
}

// Public: /pricing?locale=en&plans_limit=10
export const toPublicPricingQuery = (p?: PricingPublicParams | void | null) => {
  const q: Record<string, any> = {};
  if (!p) return q;

  if (p.locale) q.locale = p.locale;
  if (typeof p.plans_limit === 'number') q.plans_limit = p.plans_limit;

  return q;
};

export type Props = { locale: string };

export const safeArr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export const money = (amount?: string, currency?: string) => {
  const a = (amount ?? '0.00').toString();
  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
  return `${symbol}${a}`;
};

export const unitText = (unit?: string) => {
  const u = (unit || 'hour').toLowerCase();
  if (u === 'hour' || u === 'hr') return '/H';
  if (u === 'day') return '/Day';
  if (u === 'month') return '/Month';
  return `/${u}`;
};
