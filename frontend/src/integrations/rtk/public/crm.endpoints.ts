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

export type CrmAccount = {
  id: string; name: string; website?: string | null; country?: string | null;
  city?: string | null; phone?: string | null; email?: string | null;
  industry?: string | null; status?: string | null; created_at?: string;
};
export type CrmContact = {
  id: string; first_name?: string | null; last_name?: string | null;
  title?: string | null; email?: string | null; phone?: string | null;
  account_id?: string | null; created_at?: string;
};
export type CrmDeal = {
  id: string; title: string; amount?: number | null; currency?: string | null;
  status?: string | null; stage_id?: string | null; account_id?: string | null;
  expected_close_date?: string | null; created_at?: string;
};
export type CrmActivity = {
  id: string; type?: string | null; subject?: string | null; body?: string | null;
  due_at?: string | null; done?: number | boolean; ref_type?: string | null; created_at?: string;
};

export const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCrmDashboardSummary: b.query<CrmDashboardSummary, void>({
      query: () => ({ url: '/crm/dashboard/summary', method: 'GET' }),
    }),
    getCrmAccounts: b.query<CrmAccount[], void>({
      query: () => ({ url: '/crm/accounts?limit=100', method: 'GET' }),
    }),
    getCrmContacts: b.query<CrmContact[], void>({
      query: () => ({ url: '/crm/contacts?limit=100', method: 'GET' }),
    }),
    getCrmDeals: b.query<CrmDeal[], void>({
      query: () => ({ url: '/crm/deals?limit=100', method: 'GET' }),
    }),
    getCrmActivities: b.query<CrmActivity[], void>({
      query: () => ({ url: '/crm/activities?limit=100', method: 'GET' }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCrmDashboardSummaryQuery,
  useGetCrmAccountsQuery,
  useGetCrmContactsQuery,
  useGetCrmDealsQuery,
  useGetCrmActivitiesQuery,
} = crmApi;
