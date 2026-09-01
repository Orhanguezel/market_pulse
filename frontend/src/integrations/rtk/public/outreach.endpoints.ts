import { baseApi } from '@/integrations/rtk/baseApi';
import type { OutreachCampaign, OutreachDraft, OutreachList, OutreachRecipient } from '@/integrations/shared/outreach.types';

export const outreachApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listOutreachCampaigns: b.query<OutreachCampaign[], void>({
      query: () => ({ url: '/lead-machine/outreach/campaigns', method: 'GET' }),
      providesTags: ['OutreachCampaigns'],
    }),
    getOutreachCampaign: b.query<OutreachCampaign, string>({
      query: (id) => ({ url: `/lead-machine/outreach/campaigns/${id}`, method: 'GET' }),
      providesTags: ['OutreachCampaigns'],
    }),
    createOutreachCampaign: b.mutation<OutreachCampaign, Partial<OutreachCampaign> & { name: string }>({
      query: (body) => ({ url: '/lead-machine/outreach/campaigns', method: 'POST', body }),
      invalidatesTags: ['OutreachCampaigns'],
    }),
    updateOutreachCampaign: b.mutation<OutreachCampaign, { id: string; patch: Partial<OutreachCampaign> }>({
      query: ({ id, patch }) => ({ url: `/lead-machine/outreach/campaigns/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['OutreachCampaigns'],
    }),
    deleteOutreachCampaign: b.mutation<void, string>({
      query: (id) => ({ url: `/lead-machine/outreach/campaigns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OutreachCampaigns'],
    }),
    generateCampaignDrafts: b.mutation<{ generated: number }, string>({
      query: (id) => ({ url: `/lead-machine/outreach/campaigns/${id}/generate-drafts`, method: 'POST' }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    syncCampaignHostKeywords: b.mutation<unknown, string>({
      query: (id) => ({ url: `/lead-machine/outreach/campaigns/${id}/sync-host-keywords`, method: 'POST' }),
      invalidatesTags: ['OutreachCampaigns', 'IcpProfiles'],
    }),
    listOutreachDrafts: b.query<OutreachDraft[], void>({
      query: () => ({ url: '/lead-machine/outreach/drafts', method: 'GET' }),
      providesTags: ['OutreachDrafts'],
    }),
    generateCandidateOutreachDraft: b.mutation<OutreachDraft, string>({
      query: (candidateId) => ({ url: `/lead-machine/outreach/generate/${candidateId}`, method: 'POST' }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    updateOutreachDraft: b.mutation<OutreachDraft, { id: string; patch: Partial<OutreachDraft> }>({
      query: ({ id, patch }) => ({ url: `/lead-machine/outreach/drafts/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    sendOutreachDraft: b.mutation<OutreachDraft, { id: string; to?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/lead-machine/outreach/drafts/${id}/send`, method: 'POST', body }),
      invalidatesTags: ['OutreachDrafts'],
    }),
    listBulkOutreachLists: b.query<OutreachList[], void>({
      query: () => ({ url: '/lead-machine/outreach/lists', method: 'GET' }),
      providesTags: ['OutreachLists'],
    }),
    uploadBulkOutreachList: b.mutation<unknown, { file: File; name: string; campaignId?: string | null }>({
      query: ({ file, name, campaignId }) => {
        const body = new FormData();
        body.append('file', file);
        body.append('name', name);
        if (campaignId) body.append('campaignId', campaignId);
        return { url: '/lead-machine/outreach/lists', method: 'POST', body };
      },
      invalidatesTags: ['OutreachLists'],
    }),
    listBulkOutreachRecipients: b.query<OutreachRecipient[], { id: string; status?: string }>({
      query: ({ id, status }) => ({ url: `/lead-machine/outreach/lists/${id}/recipients`, method: 'GET', params: { status } }),
      providesTags: ['OutreachLists'],
    }),
    generateBulkOutreachDrafts: b.mutation<{ listId: string; generated: number; skipped: number }, { id: string; subjectTemplate: string; bodyTemplate: string }>({
      query: ({ id, ...body }) => ({ url: `/lead-machine/outreach/lists/${id}/generate`, method: 'POST', body }),
      invalidatesTags: ['OutreachLists', 'OutreachDrafts'],
    }),
    sendBulkOutreachList: b.mutation<{ queued: boolean; list_id: string; rate_per_minute: number; queued_count?: number; bounced?: number; total?: number }, { id: string; ratePerMinute?: number }>({
      query: ({ id, ...body }) => ({ url: `/lead-machine/outreach/lists/${id}/send`, method: 'POST', body }),
      invalidatesTags: ['OutreachLists'],
    }),
    deleteBulkOutreachList: b.mutation<void, string>({
      query: (id) => ({ url: `/lead-machine/outreach/lists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OutreachLists'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useListOutreachCampaignsQuery,
  useGetOutreachCampaignQuery,
  useCreateOutreachCampaignMutation,
  useUpdateOutreachCampaignMutation,
  useDeleteOutreachCampaignMutation,
  useGenerateCampaignDraftsMutation,
  useSyncCampaignHostKeywordsMutation,
  useListOutreachDraftsQuery,
  useGenerateCandidateOutreachDraftMutation,
  useUpdateOutreachDraftMutation,
  useSendOutreachDraftMutation,
  useListBulkOutreachListsQuery,
  useUploadBulkOutreachListMutation,
  useListBulkOutreachRecipientsQuery,
  useGenerateBulkOutreachDraftsMutation,
  useSendBulkOutreachListMutation,
  useDeleteBulkOutreachListMutation,
} = outreachApi;
