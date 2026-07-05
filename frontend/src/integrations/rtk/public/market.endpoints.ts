import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  MarketBulkImportResult,
  MarketBulkImportRow,
  MarketLead,
  MarketListParams,
  MarketplaceHistory,
  MarketSignal,
  MarketStats,
  MarketTarget,
  MarketTargetIntel,
} from '@/integrations/shared/market.types';

export const marketApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMarketTargets: b.query<MarketTarget[], MarketListParams | void>({
      query: (params) => ({ url: '/market/targets', method: 'GET', params: params ?? undefined }),
      providesTags: ['MarketTargets'],
    }),
    createMarketTarget: b.mutation<MarketTarget, Partial<MarketTarget> & { name: string }>({
      query: (body) => ({ url: '/market/targets', method: 'POST', body }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    updateMarketTarget: b.mutation<MarketTarget, { id: string; patch: Partial<MarketTarget> }>({
      query: ({ id, patch }) => ({ url: `/market/targets/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    deleteMarketTarget: b.mutation<void, string>({
      query: (id) => ({ url: `/market/targets/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    recalculateMarketTargetChurn: b.mutation<{ id: string; churnRiskScore: number }, string>({
      query: (id) => ({ url: `/market/targets/${id}/recalculate-churn`, method: 'POST' }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    getMarketTargetIntel: b.query<MarketTargetIntel, string>({
      query: (id) => ({ url: `/market/targets/${id}/intel`, method: 'GET' }),
      providesTags: ['MarketTargets'],
    }),
    scanMarketTargetCompetitor: b.mutation<{ target_id: string; signals_created: number }, string>({
      query: (id) => ({ url: `/market/targets/${id}/scan-competitor`, method: 'POST' }),
      invalidatesTags: ['MarketTargets', 'MarketSignals', 'MarketStats'],
    }),
    scanAllMarketTargetCompetitors: b.mutation<unknown, void>({
      query: () => ({ url: '/market/targets/scan-all-competitors', method: 'POST' }),
      invalidatesTags: ['MarketTargets', 'MarketSignals', 'MarketStats'],
    }),
    scanMarketTargetMarketplace: b.mutation<unknown, { id: string; platform: 'hepsiburada' | 'trendyol' | 'amazon' }>({
      query: ({ id, platform }) => ({ url: `/market/targets/${id}/scan-marketplace/${platform}`, method: 'POST' }),
      invalidatesTags: ['MarketTargets', 'MarketSignals', 'MarketStats'],
    }),
    scanAllMarketTargetMarketplaces: b.mutation<unknown, void>({
      query: () => ({ url: '/market/targets/scan-all-marketplaces', method: 'POST' }),
      invalidatesTags: ['MarketTargets', 'MarketSignals', 'MarketStats'],
    }),
    getMarketTargetMarketplaceHistory: b.query<MarketplaceHistory, { id: string; platform: 'hepsiburada' | 'trendyol' | 'amazon'; limit?: number }>({
      query: ({ id, platform, limit }) => ({ url: `/market/targets/${id}/marketplace-history/${platform}`, method: 'GET', params: { limit } }),
      providesTags: ['MarketSignals'],
    }),
    bulkImportMarketTargets: b.mutation<MarketBulkImportResult, { rows: MarketBulkImportRow[]; dry_run?: boolean; on_conflict?: 'skip' | 'update' }>({
      query: (body) => ({ url: '/market/targets/bulk-import', method: 'POST', body }),
      invalidatesTags: ['MarketTargets', 'MarketStats'],
    }),
    downloadMarketTargetImportTemplate: b.query<Blob, void>({
      query: () => ({ url: '/market/targets/import-template', method: 'GET', responseHandler: async (response) => response.blob() }),
    }),
    listMarketLeads: b.query<MarketLead[], MarketListParams | void>({
      query: (params) => ({ url: '/market/leads', method: 'GET', params: params ?? undefined }),
      providesTags: ['MarketLeads'],
    }),
    createMarketLead: b.mutation<MarketLead, Partial<MarketLead> & { name: string }>({
      query: (body) => ({ url: '/market/leads', method: 'POST', body }),
      invalidatesTags: ['MarketLeads', 'MarketStats'],
    }),
    listMarketSignals: b.query<MarketSignal[], MarketListParams | void>({
      query: (params) => ({ url: '/market/signals', method: 'GET', params: params ?? undefined }),
      providesTags: ['MarketSignals'],
    }),
    createMarketSignal: b.mutation<MarketSignal, Partial<MarketSignal> & { title: string }>({
      query: (body) => ({ url: '/market/signals', method: 'POST', body }),
      invalidatesTags: ['MarketSignals', 'MarketStats'],
    }),
    reviewMarketSignal: b.mutation<MarketSignal, { id: string; status?: string }>({
      query: ({ id, ...body }) => ({ url: `/market/signals/${id}/review`, method: 'POST', body }),
      invalidatesTags: ['MarketSignals', 'MarketStats'],
    }),
    deleteMarketSignal: b.mutation<void, string>({
      query: (id) => ({ url: `/market/signals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MarketSignals', 'MarketStats'],
    }),
    getMarketStats: b.query<MarketStats, void>({
      query: () => ({ url: '/market/stats', method: 'GET' }),
      providesTags: ['MarketStats'],
    }),
    previewWeeklyMarketReport: b.query<Blob, void>({
      query: () => ({ url: '/market/reports/weekly/preview', method: 'GET', responseHandler: async (response) => response.blob() }),
      providesTags: ['MarketReports'],
    }),
    sendWeeklyMarketReport: b.mutation<{ ok: boolean }, { to: string }>({
      query: (body) => ({ url: '/market/reports/weekly/send', method: 'POST', body }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMarketTargetsQuery,
  useCreateMarketTargetMutation,
  useUpdateMarketTargetMutation,
  useDeleteMarketTargetMutation,
  useRecalculateMarketTargetChurnMutation,
  useGetMarketTargetIntelQuery,
  useScanMarketTargetCompetitorMutation,
  useScanAllMarketTargetCompetitorsMutation,
  useScanMarketTargetMarketplaceMutation,
  useScanAllMarketTargetMarketplacesMutation,
  useGetMarketTargetMarketplaceHistoryQuery,
  useBulkImportMarketTargetsMutation,
  useDownloadMarketTargetImportTemplateQuery,
  useListMarketLeadsQuery,
  useCreateMarketLeadMutation,
  useListMarketSignalsQuery,
  useCreateMarketSignalMutation,
  useReviewMarketSignalMutation,
  useDeleteMarketSignalMutation,
  useGetMarketStatsQuery,
  usePreviewWeeklyMarketReportQuery,
  useSendWeeklyMarketReportMutation,
} = marketApi;
