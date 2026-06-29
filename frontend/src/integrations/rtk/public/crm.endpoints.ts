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
export type CrmProduct = {
  id: string; sku?: string | null; name: string; unit_price?: number | null;
  currency?: string | null; status?: string | null; created_at?: string;
};
export type CrmQuote = {
  id: string; quote_no?: string | null; title: string; amount?: number | null;
  currency?: string | null; status?: string | null; valid_until?: string | null; created_at?: string;
};
export type CrmOrder = {
  id: string; order_no?: string | null; title: string; amount?: number | null;
  currency?: string | null; status?: string | null; ordered_at?: string | null; created_at?: string;
};
export type CrmDocument = {
  id: string; title: string; ref_type?: string | null; file_url?: string | null;
  mime_type?: string | null; status?: string | null; created_at?: string;
};
export type CrmTask = {
  id: string; subject: string; due_at?: string | null; priority?: string | null;
  status?: string | null; created_at?: string;
};
export type CrmReminder = {
  id: string; title: string; remind_at?: string | null; channel?: string | null;
  status?: string | null; created_at?: string;
};
export type CrmLead = {
  id: string; name?: string | null; country?: string | null; website?: string | null;
  email?: string | null; lead_score?: number | null; status?: string | null; channel?: string | null;
};

export const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCrmDashboardSummary: b.query<CrmDashboardSummary, void>({ query: () => ({ url: '/crm/dashboard/summary', method: 'GET' }) }),
    getCrmAccounts: b.query<CrmAccount[], void>({ query: () => ({ url: '/crm/accounts?limit=100', method: 'GET' }) }),
    getCrmContacts: b.query<CrmContact[], void>({ query: () => ({ url: '/crm/contacts?limit=100', method: 'GET' }) }),
    getCrmDeals: b.query<CrmDeal[], void>({ query: () => ({ url: '/crm/deals?limit=100', method: 'GET' }) }),
    getCrmActivities: b.query<CrmActivity[], void>({ query: () => ({ url: '/crm/activities?limit=100', method: 'GET' }) }),
    getCrmProducts: b.query<CrmProduct[], void>({ query: () => ({ url: '/crm/products?limit=100', method: 'GET' }) }),
    getCrmQuotes: b.query<CrmQuote[], void>({ query: () => ({ url: '/crm/quotes?limit=100', method: 'GET' }) }),
    getCrmOrders: b.query<CrmOrder[], void>({ query: () => ({ url: '/crm/orders?limit=100', method: 'GET' }) }),
    getCrmDocuments: b.query<CrmDocument[], void>({ query: () => ({ url: '/crm/documents?limit=100', method: 'GET' }) }),
    getCrmTasks: b.query<CrmTask[], void>({ query: () => ({ url: '/crm/tasks?limit=100', method: 'GET' }) }),
    getCrmReminders: b.query<CrmReminder[], void>({ query: () => ({ url: '/crm/reminders?limit=100', method: 'GET' }) }),
    getCrmLeads: b.query<CrmLead[], void>({ query: () => ({ url: '/lead-machine/candidates?limit=100', method: 'GET' }) }),
  }),
  overrideExisting: true,
});

export const {
  useGetCrmDashboardSummaryQuery,
  useGetCrmAccountsQuery,
  useGetCrmContactsQuery,
  useGetCrmDealsQuery,
  useGetCrmActivitiesQuery,
  useGetCrmProductsQuery,
  useGetCrmQuotesQuery,
  useGetCrmOrdersQuery,
  useGetCrmDocumentsQuery,
  useGetCrmTasksQuery,
  useGetCrmRemindersQuery,
  useGetCrmLeadsQuery,
} = crmApi;
