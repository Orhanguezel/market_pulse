import { baseApi } from '@/integrations/rtk/baseApi';

export type DecisionMakerRow = {
  company_name: string;
  city: string;
  business_type: string;
  decision_maker_name: string | null;
  title: string | null;
  linkedin_profile_url: string | null;
  company_website: string | null;
  social_url: string | null;
  source_url: string | null;
  fit_note: string;
  confidence_score: 'A' | 'B' | 'C';
  last_verified_at: string;
};

export type FindResult = {
  rows: DecisionMakerRow[];
  stats: { companies: number; withDecisionMaker: number };
};

export type FindBody = {
  sector?: string;
  cities: string[];
  country?: string;
  targetCount?: number;
  perCityLimit?: number;
};

export const decisionMakerApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    findDecisionMakers: b.mutation<FindResult, FindBody>({
      query: (body) => ({ url: '/lead-machine/decision-makers/find', method: 'POST', body }),
    }),
  }),
  overrideExisting: true,
});

export const { useFindDecisionMakersMutation } = decisionMakerApi;
