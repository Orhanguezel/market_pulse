import { baseApi } from '@/integrations/rtk/baseApi';

export type DecisionMakerConfidence = 'A' | 'B' | 'C';
export type CompanyQualityStatus = 'qualified' | 'possible' | 'manual_review' | 'excluded';

export type DecisionMakerRow = {
  id?: string;
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
  confidence_score: DecisionMakerConfidence;
  review_status?: 'pending' | 'verified' | 'rejected' | 'manual_review';
  email?: string | null;
  email_source?: string | null;
  last_verified_at: string;
};

export type OutreachList = {
  id: string;
  name: string;
  status: string;
  total_count: number;
  sent_count: number;
  created_at: string;
};

export type FindResult = {
  rows: DecisionMakerRow[];
  stats: { companies: number; withDecisionMaker: number };
};

export type CompanyPoolRow = {
  company_name: string;
  city: string | null;
  business_type: string | null;
  website: string | null;
  phone: string | null;
  google_maps_url: string | null;
  address: string | null;
  quality_score: number;
  quality_status: CompanyQualityStatus;
  exclude_reason: string | null;
  source: string;
  last_verified_at: string | null;
};

export type CompanyPoolResult = {
  rows: CompanyPoolRow[];
  stats: { total: number; qualified: number; possible: number; manualReview: number; excluded: number };
};

export type DecisionMakerJob = {
  id: string;
  channel: 'decision_maker';
  status: 'pending' | 'running' | 'done' | 'failed';
  icp_id: string | null;
  params: Record<string, unknown>;
  result_count: number;
  error_msg: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type DecisionMakerPresets = {
  sectors: string[];
  business_types: Record<string, string[]>;
  default_titles: string[];
  export_b2b_titles: string[];
  default_exclude_keywords: string[];
};

export type FindBody = {
  sector?: string;
  businessTypes?: string[];
  cities: string[];
  country?: string;
  titles?: string[];
  excludeKeywords?: string[];
  apolloFallback?: boolean;
  targetCount?: number;
  perCityLimit?: number;
};

export type DecisionMakerResultParams = {
  job_id?: string;
  confidence?: 'A' | 'B' | 'C' | 'all';
  sector?: string;
  limit?: number;
};

export type CompanyPoolParams = {
  job_id?: string;
  status?: CompanyQualityStatus | 'all';
  include_excluded?: boolean;
  limit?: number;
};

export const decisionMakerApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getDecisionMakerPresets: b.query<DecisionMakerPresets, void>({
      query: () => ({ url: '/lead-machine/decision-makers/presets', method: 'GET' }),
    }),
    findDecisionMakers: b.mutation<FindResult & { saved?: number }, FindBody>({
      query: (body) => ({ url: '/lead-machine/decision-makers/find', method: 'POST', body }),
      invalidatesTags: ['DecisionMakerResults'],
    }),
    startDecisionMakerJob: b.mutation<DecisionMakerJob, FindBody>({
      query: (body) => ({ url: '/lead-machine/decision-makers/jobs', method: 'POST', body }),
      invalidatesTags: ['DecisionMakerJobs', 'DecisionMakerResults'],
    }),
    listDecisionMakerJobs: b.query<DecisionMakerJob[], void>({
      query: () => ({ url: '/lead-machine/decision-makers/jobs', method: 'GET' }),
      providesTags: ['DecisionMakerJobs'],
    }),
    getDecisionMakerJob: b.query<DecisionMakerJob, string>({
      query: (id) => ({ url: `/lead-machine/decision-makers/jobs/${id}`, method: 'GET' }),
      providesTags: ['DecisionMakerJobs'],
    }),
    listDecisionMakerResults: b.query<FindResult, DecisionMakerResultParams | void>({
      query: (params) => ({
        url: '/lead-machine/decision-makers/results',
        method: 'GET',
        params: params ? {
          ...params,
          confidence: params.confidence && params.confidence !== 'all' ? params.confidence : undefined,
        } : undefined,
      }),
      providesTags: ['DecisionMakerResults'],
    }),
    listDecisionMakerCompanyPool: b.query<CompanyPoolResult, CompanyPoolParams | void>({
      query: (params) => ({
        url: '/lead-machine/decision-makers/company-pool',
        method: 'GET',
        params: params ? {
          ...params,
          status: params.status && params.status !== 'all' ? params.status : undefined,
        } : undefined,
      }),
      providesTags: ['DecisionMakerResults'],
    }),
    exportDecisionMakersCsv: b.query<string, DecisionMakerResultParams | void>({
      query: (params) => ({
        url: '/lead-machine/decision-makers/export.csv',
        method: 'GET',
        params: params ? {
          ...params,
          confidence: params.confidence && params.confidence !== 'all' ? params.confidence : undefined,
        } : undefined,
        responseHandler: async (response) => response.text(),
      }),
    }),
    exportDecisionMakersXlsx: b.query<ArrayBuffer, DecisionMakerResultParams | void>({
      query: (params) => ({
        url: '/lead-machine/decision-makers/export.xlsx',
        method: 'GET',
        params: params ? {
          ...params,
          confidence: params.confidence && params.confidence !== 'all' ? params.confidence : undefined,
        } : undefined,
        responseHandler: async (response) => response.arrayBuffer(),
      }),
    }),
    getSavedDecisionMakers: b.query<FindResult, void>({
      query: () => ({ url: '/lead-machine/decision-makers/saved', method: 'GET' }),
      providesTags: ['DecisionMakerResults'],
    }),

    // ---- Outreach / Email ----
    findDecisionMakerEmails: b.mutation<{ queued: number; no_website: number; allow_apollo: boolean }, { job_id?: string; ids?: string[]; confidence?: DecisionMakerConfidence | 'all'; allowApollo?: boolean }>({
      query: (body) => ({ url: '/lead-machine/decision-makers/find-emails', method: 'POST', body }),
    }),
    decisionMakersToOutreachList: b.mutation<{ list: OutreachList; inserted: number }, { job_id?: string; ids?: string[]; confidence?: DecisionMakerConfidence | 'all'; name?: string }>({
      query: (body) => ({ url: '/lead-machine/decision-makers/to-outreach-list', method: 'POST', body }),
      invalidatesTags: ['OutreachLists'],
    }),
    listOutreachLists: b.query<OutreachList[], void>({
      query: () => ({ url: '/lead-machine/outreach/lists', method: 'GET' }),
      providesTags: ['OutreachLists'],
    }),
    getOutreachList: b.query<OutreachList, string>({
      query: (id) => ({ url: `/lead-machine/outreach/lists/${id}`, method: 'GET' }),
      providesTags: ['OutreachLists'],
    }),
    generateOutreachDrafts: b.mutation<{ listId: string; generated: number; skipped: number }, { id: string; subjectTemplate: string; bodyTemplate: string }>({
      query: ({ id, ...body }) => ({ url: `/lead-machine/outreach/lists/${id}/generate`, method: 'POST', body }),
      invalidatesTags: ['OutreachLists'],
    }),
    sendOutreachList: b.mutation<{ queued: boolean; list_id: string; rate_per_minute: number }, { id: string; ratePerMinute?: number }>({
      query: ({ id, ...body }) => ({ url: `/lead-machine/outreach/lists/${id}/send`, method: 'POST', body }),
      invalidatesTags: ['OutreachLists'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDecisionMakerPresetsQuery,
  useFindDecisionMakersMutation,
  useStartDecisionMakerJobMutation,
  useListDecisionMakerJobsQuery,
  useGetDecisionMakerJobQuery,
  useListDecisionMakerResultsQuery,
  useListDecisionMakerCompanyPoolQuery,
  useExportDecisionMakersCsvQuery,
  useLazyExportDecisionMakersCsvQuery,
  useExportDecisionMakersXlsxQuery,
  useLazyExportDecisionMakersXlsxQuery,
  useGetSavedDecisionMakersQuery,
  useFindDecisionMakerEmailsMutation,
  useDecisionMakersToOutreachListMutation,
  useListOutreachListsQuery,
  useGetOutreachListQuery,
  useGenerateOutreachDraftsMutation,
  useSendOutreachListMutation,
} = decisionMakerApi;
