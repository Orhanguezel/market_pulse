// Tenant CRM uçları (giriş yapmış müşteri) — /api/v1/crm/...
import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  CrmAccount,
  CrmActivity,
  CrmBusinessSummary,
  CrmContact,
  CrmDashboardSummary,
  CrmDeal,
  CrmDocument,
  CrmLead,
  CrmMailSummary,
  CrmOrder,
  CrmPipelineResponse,
  CrmProduct,
  CrmQuote,
  CrmReminder,
  CrmReportsSummary,
  CrmTask,
  CrmUsersSummary,
} from '@/integrations/shared/crm.types';
export type {
  CrmAccount,
  CrmActivity,
  CrmBusinessSummary,
  CrmContact,
  CrmDashboardSummary,
  CrmDeal,
  CrmDocument,
  CrmLead,
  CrmMailSummary,
  CrmOrder,
  CrmPipelineResponse,
  CrmProduct,
  CrmQuote,
  CrmReminder,
  CrmReportsSummary,
  CrmTask,
  CrmUsersSummary,
} from '@/integrations/shared/crm.types';

type CrmListParams = { limit?: number; account_id?: string; ref_type?: string; ref_id?: string; stage_id?: string };

export const crmApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCrmDashboardSummary: b.query<CrmDashboardSummary, void>({
      query: () => ({ url: '/crm/dashboard/summary', method: 'GET' }),
      providesTags: ['CrmDashboard'],
    }),
    getCrmMailSummary: b.query<CrmMailSummary, void>({
      query: () => ({ url: '/crm/mail/summary', method: 'GET' }),
      providesTags: ['CrmMailSummary'],
    }),
    getCrmReportsSummary: b.query<CrmReportsSummary, void>({
      query: () => ({ url: '/crm/reports/summary', method: 'GET' }),
      providesTags: ['CrmReportsSummary'],
    }),
    getCrmUsersSummary: b.query<CrmUsersSummary, void>({
      query: () => ({ url: '/crm/users/summary', method: 'GET' }),
      providesTags: ['CrmUsersSummary'],
    }),
    getCrmBusinessSummary: b.query<CrmBusinessSummary, void>({
      query: () => ({ url: '/crm/business/summary', method: 'GET' }),
      providesTags: ['CrmBusinessSummary'],
    }),
    getCrmAccounts: b.query<CrmAccount[], void>({
      query: () => ({ url: '/crm/accounts?limit=100', method: 'GET' }),
      providesTags: ['CrmAccounts'],
    }),
    getCrmAccount: b.query<CrmAccount, string>({
      query: (id) => ({ url: `/crm/accounts/${id}`, method: 'GET' }),
      providesTags: ['CrmAccounts'],
    }),
    createCrmAccount: b.mutation<CrmAccount, Partial<CrmAccount> & { name: string }>({
      query: (body) => ({ url: '/crm/accounts', method: 'POST', body }),
      invalidatesTags: ['CrmAccounts', 'CrmDashboard'],
    }),
    updateCrmAccount: b.mutation<CrmAccount, { id: string; patch: Partial<CrmAccount> }>({
      query: ({ id, patch }) => ({ url: `/crm/accounts/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmAccounts', 'CrmDashboard'],
    }),
    deleteCrmAccount: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmAccounts', 'CrmDashboard'],
    }),
    getCrmContacts: b.query<CrmContact[], CrmListParams | void>({
      query: (params) => ({ url: '/crm/contacts', method: 'GET', params: { limit: 100, ...(params ?? {}) } }),
      providesTags: ['CrmContacts'],
    }),
    createCrmContact: b.mutation<CrmContact, Partial<CrmContact>>({
      query: (body) => ({ url: '/crm/contacts', method: 'POST', body }),
      invalidatesTags: ['CrmContacts', 'CrmDashboard'],
    }),
    updateCrmContact: b.mutation<CrmContact, { id: string; patch: Partial<CrmContact> }>({
      query: ({ id, patch }) => ({ url: `/crm/contacts/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmContacts', 'CrmDashboard'],
    }),
    deleteCrmContact: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/contacts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmContacts', 'CrmDashboard'],
    }),
    getCrmDeals: b.query<CrmDeal[], CrmListParams | void>({
      query: (params) => ({ url: '/crm/deals', method: 'GET', params: { limit: 100, ...(params ?? {}) } }),
      providesTags: ['CrmDeals'],
    }),
    getCrmPipelines: b.query<CrmPipelineResponse, void>({
      query: () => ({ url: '/crm/pipelines', method: 'GET' }),
      providesTags: ['CrmDeals'],
    }),
    getCrmDeal: b.query<CrmDeal, string>({
      query: (id) => ({ url: `/crm/deals/${id}`, method: 'GET' }),
      providesTags: ['CrmDeals'],
    }),
    createCrmDeal: b.mutation<CrmDeal, Partial<CrmDeal> & { title: string }>({
      query: (body) => ({ url: '/crm/deals', method: 'POST', body }),
      invalidatesTags: ['CrmDeals', 'CrmDashboard'],
    }),
    updateCrmDeal: b.mutation<CrmDeal, { id: string; patch: Partial<CrmDeal> }>({
      query: ({ id, patch }) => ({ url: `/crm/deals/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmDeals', 'CrmDashboard'],
    }),
    moveCrmDealStage: b.mutation<CrmDeal, { id: string; stage_id: string }>({
      query: ({ id, stage_id }) => ({ url: `/crm/deals/${id}/stage`, method: 'PATCH', body: { stage_id } }),
      invalidatesTags: ['CrmDeals', 'CrmDashboard'],
    }),
    deleteCrmDeal: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/deals/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmDeals', 'CrmDashboard'],
    }),
    getCrmActivities: b.query<CrmActivity[], CrmListParams | void>({
      query: (params) => ({ url: '/crm/activities', method: 'GET', params: { limit: 100, ...(params ?? {}) } }),
      providesTags: ['CrmActivities'],
    }),
    createCrmActivity: b.mutation<CrmActivity, Partial<CrmActivity>>({
      query: (body) => ({ url: '/crm/activities', method: 'POST', body }),
      invalidatesTags: ['CrmActivities', 'CrmDashboard'],
    }),
    updateCrmActivity: b.mutation<CrmActivity, { id: string; patch: Partial<CrmActivity> }>({
      query: ({ id, patch }) => ({ url: `/crm/activities/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmActivities', 'CrmDashboard'],
    }),
    deleteCrmActivity: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/activities/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmActivities', 'CrmDashboard'],
    }),
    getCrmProducts: b.query<CrmProduct[], void>({
      query: () => ({ url: '/crm/products?limit=100', method: 'GET' }),
      providesTags: ['CrmProducts'],
    }),
    getCrmProduct: b.query<CrmProduct, string>({
      query: (id) => ({ url: `/crm/products/${id}`, method: 'GET' }),
      providesTags: ['CrmProducts'],
    }),
    createCrmProduct: b.mutation<CrmProduct, Partial<CrmProduct> & { name: string }>({
      query: (body) => ({ url: '/crm/products', method: 'POST', body }),
      invalidatesTags: ['CrmProducts'],
    }),
    updateCrmProduct: b.mutation<CrmProduct, { id: string; patch: Partial<CrmProduct> }>({
      query: ({ id, patch }) => ({ url: `/crm/products/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmProducts'],
    }),
    deleteCrmProduct: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmProducts'],
    }),
    getCrmQuotes: b.query<CrmQuote[], void>({
      query: () => ({ url: '/crm/quotes?limit=100', method: 'GET' }),
      providesTags: ['CrmQuotes'],
    }),
    getCrmQuote: b.query<CrmQuote, string>({
      query: (id) => ({ url: `/crm/quotes/${id}`, method: 'GET' }),
      providesTags: ['CrmQuotes'],
    }),
    createCrmQuote: b.mutation<CrmQuote, Partial<CrmQuote> & { title: string }>({
      query: (body) => ({ url: '/crm/quotes', method: 'POST', body }),
      invalidatesTags: ['CrmQuotes', 'CrmDashboard'],
    }),
    updateCrmQuote: b.mutation<CrmQuote, { id: string; patch: Partial<CrmQuote> }>({
      query: ({ id, patch }) => ({ url: `/crm/quotes/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmQuotes', 'CrmDashboard'],
    }),
    deleteCrmQuote: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/quotes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmQuotes', 'CrmDashboard'],
    }),
    getCrmOrders: b.query<CrmOrder[], void>({
      query: () => ({ url: '/crm/orders?limit=100', method: 'GET' }),
      providesTags: ['CrmOrders'],
    }),
    getCrmOrder: b.query<CrmOrder, string>({
      query: (id) => ({ url: `/crm/orders/${id}`, method: 'GET' }),
      providesTags: ['CrmOrders'],
    }),
    createCrmOrder: b.mutation<CrmOrder, Partial<CrmOrder> & { title: string }>({
      query: (body) => ({ url: '/crm/orders', method: 'POST', body }),
      invalidatesTags: ['CrmOrders', 'CrmDashboard'],
    }),
    updateCrmOrder: b.mutation<CrmOrder, { id: string; patch: Partial<CrmOrder> }>({
      query: ({ id, patch }) => ({ url: `/crm/orders/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmOrders', 'CrmDashboard'],
    }),
    deleteCrmOrder: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmOrders', 'CrmDashboard'],
    }),
    getCrmDocuments: b.query<CrmDocument[], void>({
      query: () => ({ url: '/crm/documents?limit=100', method: 'GET' }),
      providesTags: ['CrmDocuments'],
    }),
    getCrmDocument: b.query<CrmDocument, string>({
      query: (id) => ({ url: `/crm/documents/${id}`, method: 'GET' }),
      providesTags: ['CrmDocuments'],
    }),
    createCrmDocument: b.mutation<CrmDocument, Partial<CrmDocument> & { title: string }>({
      query: (body) => ({ url: '/crm/documents', method: 'POST', body }),
      invalidatesTags: ['CrmDocuments'],
    }),
    updateCrmDocument: b.mutation<CrmDocument, { id: string; patch: Partial<CrmDocument> }>({
      query: ({ id, patch }) => ({ url: `/crm/documents/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmDocuments'],
    }),
    deleteCrmDocument: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/documents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmDocuments'],
    }),
    getCrmTasks: b.query<CrmTask[], void>({
      query: () => ({ url: '/crm/tasks?limit=100', method: 'GET' }),
      providesTags: ['CrmTasks'],
    }),
    createCrmTask: b.mutation<CrmTask, Partial<CrmTask> & { subject: string }>({
      query: (body) => ({ url: '/crm/tasks', method: 'POST', body }),
      invalidatesTags: ['CrmTasks', 'CrmDashboard'],
    }),
    updateCrmTask: b.mutation<CrmTask, { id: string; patch: Partial<CrmTask> }>({
      query: ({ id, patch }) => ({ url: `/crm/tasks/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmTasks', 'CrmDashboard'],
    }),
    deleteCrmTask: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmTasks', 'CrmDashboard'],
    }),
    getCrmReminders: b.query<CrmReminder[], void>({
      query: () => ({ url: '/crm/reminders?limit=100', method: 'GET' }),
      providesTags: ['CrmReminders'],
    }),
    createCrmReminder: b.mutation<CrmReminder, Partial<CrmReminder> & { title: string }>({
      query: (body) => ({ url: '/crm/reminders', method: 'POST', body }),
      invalidatesTags: ['CrmReminders', 'CrmDashboard'],
    }),
    updateCrmReminder: b.mutation<CrmReminder, { id: string; patch: Partial<CrmReminder> }>({
      query: ({ id, patch }) => ({ url: `/crm/reminders/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['CrmReminders', 'CrmDashboard'],
    }),
    deleteCrmReminder: b.mutation<void, string>({
      query: (id) => ({ url: `/crm/reminders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CrmReminders', 'CrmDashboard'],
    }),
    getCrmLeads: b.query<CrmLead[], void>({
      query: () => ({ url: '/lead-machine/candidates?limit=100', method: 'GET' }),
      providesTags: ['LeadCandidates'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCrmDashboardSummaryQuery,
  useGetCrmMailSummaryQuery,
  useGetCrmReportsSummaryQuery,
  useGetCrmUsersSummaryQuery,
  useGetCrmBusinessSummaryQuery,
  useGetCrmAccountsQuery,
  useGetCrmAccountQuery,
  useCreateCrmAccountMutation,
  useUpdateCrmAccountMutation,
  useDeleteCrmAccountMutation,
  useGetCrmContactsQuery,
  useCreateCrmContactMutation,
  useUpdateCrmContactMutation,
  useDeleteCrmContactMutation,
  useGetCrmDealsQuery,
  useGetCrmPipelinesQuery,
  useGetCrmDealQuery,
  useCreateCrmDealMutation,
  useUpdateCrmDealMutation,
  useMoveCrmDealStageMutation,
  useDeleteCrmDealMutation,
  useGetCrmActivitiesQuery,
  useCreateCrmActivityMutation,
  useUpdateCrmActivityMutation,
  useDeleteCrmActivityMutation,
  useGetCrmProductsQuery,
  useGetCrmProductQuery,
  useCreateCrmProductMutation,
  useUpdateCrmProductMutation,
  useDeleteCrmProductMutation,
  useGetCrmQuotesQuery,
  useGetCrmQuoteQuery,
  useCreateCrmQuoteMutation,
  useUpdateCrmQuoteMutation,
  useDeleteCrmQuoteMutation,
  useGetCrmOrdersQuery,
  useGetCrmOrderQuery,
  useCreateCrmOrderMutation,
  useUpdateCrmOrderMutation,
  useDeleteCrmOrderMutation,
  useGetCrmDocumentsQuery,
  useGetCrmDocumentQuery,
  useCreateCrmDocumentMutation,
  useUpdateCrmDocumentMutation,
  useDeleteCrmDocumentMutation,
  useGetCrmTasksQuery,
  useCreateCrmTaskMutation,
  useUpdateCrmTaskMutation,
  useDeleteCrmTaskMutation,
  useGetCrmRemindersQuery,
  useCreateCrmReminderMutation,
  useUpdateCrmReminderMutation,
  useDeleteCrmReminderMutation,
  useGetCrmLeadsQuery,
} = crmApi;
