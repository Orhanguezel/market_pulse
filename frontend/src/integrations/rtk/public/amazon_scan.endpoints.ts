import { baseApi } from '@/integrations/rtk/baseApi';

export interface ScanJob {
  id: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  channel: string;
  params: {
    keyword?: string;
    marketplace?: string;
  };
  created_at: string;
  finished_at?: string | null;
  error_msg?: string | null;
  risk_report?: RiskReport | null;
  quota?: QuotaStatus;
}

export interface RiskReport {
  decision: 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME' | 'MIXED_SIGNAL' | 'INSUFFICIENT_DATA';
  composite_score: number | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  data_points: number;
  dimensions?: {
    category_risk?: DimensionScore;
    sku_chaos?: DimensionScore;
    price_war_risk?: DimensionScore;
    brand_reliability?: DimensionScore;
    operational_risk?: DimensionScore;
  };
  summary?: string;
}

export interface DimensionScore {
  score: number;
  confidence: string;
  reasons: string[];
}

export interface QuotaStatus {
  plan: 'free' | 'starter' | 'pro' | 'agency';
  daily_limit: number;
  used_today: number;
  remaining: number;
  unlimited: boolean;
}

export interface ScanHistoryItem {
  id: string;
  status: string;
  keyword: string;
  marketplace: string;
  created_at: string;
  finished_at: string | null;
  decision: string | null;
  composite_score: number | null;
  confidence: string | null;
}

export interface StartScanBody {
  keyword: string;
  marketplace?: string;
}

export interface BulkScoreRow {
  keyword: string;
  marketplace: string;
  report: RiskReport | null;
}

export interface ByokStatus {
  hasKey: boolean;
  tokenBudget: number | null;
  tokensUsed: number;
  lastCheckedAt: string | null;
}

export const amazonScanApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyQuota: b.query<QuotaStatus, void>({
      query: () => '/amazon/quota',
      providesTags: ['AmazonQuota'],
    }),
    startPublicScan: b.mutation<ScanJob, StartScanBody>({
      query: (body) => ({ url: '/amazon/scan', method: 'POST', body }),
      invalidatesTags: ['AmazonHistory', 'AmazonQuota'],
    }),
    getPublicScan: b.query<ScanJob, string>({
      query: (jobId) => `/amazon/scan/${jobId}`,
      providesTags: (_r, _e, jobId) => [{ type: 'AmazonScanJob', id: jobId }],
    }),
    getPublicScanProducts: b.query<unknown[], string>({
      query: (jobId) => `/amazon/scan/${jobId}/products`,
    }),
    getPublicRiskScores: b.query<RiskReport, { keyword: string; marketplace?: string }>({
      query: ({ keyword, marketplace = 'com' }) =>
        `/amazon/risk-scores/${encodeURIComponent(keyword)}?marketplace=${marketplace}`,
    }),
    getAmazonHistory: b.query<ScanHistoryItem[], void>({
      query: () => '/amazon/history',
      providesTags: ['AmazonHistory'],
    }),
    getBulkPublicRiskScores: b.mutation<BulkScoreRow[], { keywords: string[]; marketplace: string }>({
      query: (body) => ({ url: '/amazon/bulk-scores', method: 'POST', body }),
    }),
    getByokStatus: b.query<ByokStatus, void>({
      query: () => '/amazon/byok',
      providesTags: ['ByokKey'],
    }),
    saveByokKey: b.mutation<{ ok: boolean }, { api_key: string }>({
      query: (body) => ({ url: '/amazon/byok', method: 'POST', body }),
      invalidatesTags: ['ByokKey'],
    }),
    deleteByokKey: b.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/amazon/byok', method: 'DELETE' }),
      invalidatesTags: ['ByokKey'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMyQuotaQuery,
  useStartPublicScanMutation,
  useGetPublicScanQuery,
  useGetPublicScanProductsQuery,
  useGetPublicRiskScoresQuery,
  useGetAmazonHistoryQuery,
  useGetBulkPublicRiskScoresMutation,
  useGetByokStatusQuery,
  useSaveByokKeyMutation,
  useDeleteByokKeyMutation,
} = amazonScanApi;
