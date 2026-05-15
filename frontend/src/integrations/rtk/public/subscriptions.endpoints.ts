// =============================================================
// FILE: src/integrations/rtk/public/subscriptions.endpoints.ts
// Public subscription plan endpoints
// =============================================================

import { baseApi } from '../baseApi';

export type SubscriptionPeriod = 'monthly' | 'yearly' | 'lifetime';

export interface SubscriptionPlanPublic {
  id: string;
  code: string;
  name_tr: string;
  name_en: string;
  description_tr?: string | null;
  description_en?: string | null;
  price_minor: number;
  currency: string;
  period: SubscriptionPeriod;
  trial_days: number;
  features?: unknown;
  is_active: number;
  display_order: number;
}

function parseFeatures(features: unknown): string[] {
  if (!features) return [];

  if (Array.isArray(features)) {
    return features
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        return '';
      })
      .filter(Boolean);
  }

  if (typeof features === 'string') {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [];
}

export interface SubscriptionPlanPublicUi extends Omit<SubscriptionPlanPublic, 'features'> {
  features?: string[];
}

const subscriptionsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSubscriptionPlansPublic: build.query<SubscriptionPlanPublicUi[], void>({
      query: () => '/subscriptions/plans',
      transformResponse: (res: unknown): SubscriptionPlanPublicUi[] => {
        const raw = (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)
          ? (res as { data: unknown }).data
          : res) as unknown;

        if (!Array.isArray(raw)) return [];

        return raw.map((item) => {
          const r = item as Record<string, unknown>;
          const features = parseFeatures(r.features as unknown);
          return {
            id: String(r.id || ''),
            code: String(r.code || ''),
            name_tr: String(r.name_tr || ''),
            name_en: String(r.name_en || ''),
            description_tr: r.description_tr == null ? null : String(r.description_tr),
            description_en: r.description_en == null ? null : String(r.description_en),
            price_minor: Number(r.price_minor ?? 0),
            currency: String(r.currency || 'TRY'),
            period: String(r.period || 'monthly') as SubscriptionPeriod,
            trial_days: Number(r.trial_days ?? 0),
            is_active: Number(r.is_active ?? 0),
            display_order: Number(r.display_order ?? 0),
            features,
          };
        });
      },
    }),
  }),
  overrideExisting: true,
});

export const { useListSubscriptionPlansPublicQuery } = subscriptionsPublicApi;
export const useListSubscriptionPlansQuery = useListSubscriptionPlansPublicQuery;
