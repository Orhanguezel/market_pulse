import { baseApi } from '@/integrations/rtk/baseApi';

export type ProspectList = {
  id: string;
  name: string;
  source_file: string | null;
  total: number;
  free_done: number;
  apollo_done: number;
  created_at: string;
};

export type ProspectCompany = {
  id: string;
  row_index: number | null;
  company_name: string;
  country: string | null;
  website: string | null;
  generic_email: string | null;
  phone: string | null;
  linkedin_search_url: string | null;
  decision_maker_name: string | null;
  decision_maker_title: string | null;
  decision_maker_linkedin: string | null;
  decision_maker_email: string | null;
  decision_maker_email_source: string | null;
  enrich_status: 'pending' | 'free_running' | 'free_done' | 'apollo_running' | 'apollo_done' | 'failed';
  error: string | null;
};

export type ImportCompanyInput = { company_name: string; website?: string | null };

export const prospectListsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listProspectLists: b.query<{ lists: ProspectList[] }, void>({
      query: () => ({ url: '/prospect-lists', method: 'GET' }),
    }),
    importProspectList: b.mutation<{ list_id: string; total: number }, { name: string; source_file?: string; companies: ImportCompanyInput[] }>({
      query: (body) => ({ url: '/prospect-lists', method: 'POST', body }),
    }),
    listProspectCompanies: b.query<{ companies: ProspectCompany[] }, { id: string; limit?: number; offset?: number }>({
      query: ({ id, limit = 500, offset = 0 }) => ({ url: `/prospect-lists/${id}/companies?limit=${limit}&offset=${offset}`, method: 'GET' }),
    }),
    deleteProspectList: b.mutation<void, { id: string }>({
      query: ({ id }) => ({ url: `/prospect-lists/${id}`, method: 'DELETE' }),
    }),
    enrichFree: b.mutation<{ started: boolean; queued: number }, { id: string }>({
      query: ({ id }) => ({ url: `/prospect-lists/${id}/enrich-free`, method: 'POST' }),
    }),
    enrichApollo: b.mutation<{ started: boolean; count: number; apollo_enabled: boolean }, { company_ids: string[] }>({
      query: (body) => ({ url: '/prospect-lists/enrich-apollo', method: 'POST', body }),
    }),
    prospectStatus: b.query<{ apollo_enabled: boolean }, void>({
      query: () => ({ url: '/prospect-lists/status', method: 'GET' }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useListProspectListsQuery,
  useImportProspectListMutation,
  useListProspectCompaniesQuery,
  useDeleteProspectListMutation,
  useEnrichFreeMutation,
  useEnrichApolloMutation,
  useProspectStatusQuery,
} = prospectListsApi;
