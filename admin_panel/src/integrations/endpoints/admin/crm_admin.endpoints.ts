import { baseApi } from '@/integrations/baseApi';

export type CrmDealStatus = 'open' | 'won' | 'lost';
export type CrmActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note';

export interface CrmAccount {
  id: string;
  tenant_key: string;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  industry: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CrmContact {
  id: string;
  tenant_key: string;
  account_id: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmPipeline {
  id: string;
  tenant_key: string;
  name: string;
  is_default: 0 | 1;
  sort: number;
}

export interface CrmStage {
  id: string;
  tenant_key: string;
  pipeline_id: string;
  name: string;
  sort: number;
  probability: string | number;
  is_won: 0 | 1;
  is_lost: 0 | 1;
}

export interface CrmDeal {
  id: string;
  tenant_key: string;
  account_id: string | null;
  contact_id: string | null;
  pipeline_id: string;
  stage_id: string;
  title: string;
  amount: string | number | null;
  currency: string;
  expected_close_date: string | null;
  owner_user_id: string | null;
  status: CrmDealStatus;
  account_name?: string | null;
  contact_email?: string | null;
  stage_name?: string | null;
  pipeline_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmActivity {
  id: string;
  tenant_key: string;
  ref_type: 'deal' | 'contact' | 'account';
  ref_id: string;
  type: CrmActivityType;
  subject: string;
  body: string | null;
  due_at: string | null;
  done: 0 | 1;
  done_at: string | null;
  owner_user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmPipelinesResponse {
  pipelines: CrmPipeline[];
  stages: CrmStage[];
}

export const crmAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listCrmPipelines: b.query<CrmPipelinesResponse, void>({
      query: () => ({ url: '/crm/pipelines' }),
      providesTags: ['Crm' as never],
    }),
    listCrmDeals: b.query<CrmDeal[], { status?: CrmDealStatus; stage_id?: string; account_id?: string } | void>({
      query: (params) => ({ url: '/crm/deals', params: params ?? undefined }),
      providesTags: ['Crm' as never],
    }),
    createCrmDeal: b.mutation<CrmDeal, Partial<CrmDeal> & { title: string }>({
      query: (body) => ({ url: '/crm/deals', method: 'POST', body }),
      invalidatesTags: ['Crm' as never],
    }),
    moveCrmDealStage: b.mutation<CrmDeal, { id: string; stage_id: string }>({
      query: ({ id, stage_id }) => ({ url: `/crm/deals/${id}/stage`, method: 'PATCH', body: { stage_id } }),
      invalidatesTags: ['Crm' as never],
    }),
    listCrmActivities: b.query<CrmActivity[], { ref_type?: string; ref_id?: string } | void>({
      query: (params) => ({ url: '/crm/activities', params: params ?? undefined }),
      providesTags: ['Crm' as never],
    }),
    createCrmActivity: b.mutation<CrmActivity, {
      ref_type: 'deal' | 'contact' | 'account';
      ref_id: string;
      type?: CrmActivityType;
      subject: string;
      body?: string | null;
      due_at?: string | null;
    }>({
      query: (body) => ({ url: '/crm/activities', method: 'POST', body }),
      invalidatesTags: ['Crm' as never],
    }),
    updateCrmActivity: b.mutation<CrmActivity, { id: string; done?: boolean; subject?: string }>({
      query: ({ id, ...body }) => ({ url: `/crm/activities/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Crm' as never],
    }),
    listCrmAccounts: b.query<CrmAccount[], void>({
      query: () => ({ url: '/crm/accounts' }),
      providesTags: ['Crm' as never],
    }),
    listCrmContacts: b.query<CrmContact[], void>({
      query: () => ({ url: '/crm/contacts' }),
      providesTags: ['Crm' as never],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListCrmPipelinesQuery,
  useListCrmDealsQuery,
  useCreateCrmDealMutation,
  useMoveCrmDealStageMutation,
  useListCrmActivitiesQuery,
  useCreateCrmActivityMutation,
  useUpdateCrmActivityMutation,
  useListCrmAccountsQuery,
  useListCrmContactsQuery,
} = crmAdminApi;
