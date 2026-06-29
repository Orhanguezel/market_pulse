// Tenant CRM uçları (giriş yapmış müşteri) — /api/v1/crm/...
import { baseApi } from '@/integrations/rtk/baseApi';

export type CrmDashboardSummary = {
  counts: {
    accounts: number; contacts: number; leads: number;
    deals_open: number; deals_won: number; activities_pending: number;
    quotes: number; orders?: number;
  };
  pending: { quotes: number; open_deals: number };
  sales_summary: { month: string; amount: number }[];
  status_breakdown: { label: string; count: number }[];
  team_breakdown?: { label: string; count: number }[];
  totals: { records: number };
};

export const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCrmDashboardSummary: b.query<CrmDashboardSummary, void>({
      query: () => ({ url: '/crm/dashboard/summary', method: 'GET' }),
    }),
  }),
  overrideExisting: true,
});

export const { useGetCrmDashboardSummaryQuery } = crmApi;
