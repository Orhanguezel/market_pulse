import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  IcpProfile,
  LeadCandidate,
  LeadCandidateListParams,
  LeadScanRule,
  LeadSearchJob,
  StartLeadJobBody,
} from '@/integrations/shared/lead-machine.types';

type ReviewBody = { id: string; action: 'approve' | 'reject' | 'favorite'; reject_reason?: string | null; reject_tags?: string[] };

export const leadMachineApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listLeadCandidates: b.query<LeadCandidate[], LeadCandidateListParams | void>({
      query: (params) => ({ url: '/lead-machine/candidates', method: 'GET', params: params ?? undefined }),
      providesTags: ['LeadCandidates'],
    }),
    createLeadCandidate: b.mutation<LeadCandidate, Partial<LeadCandidate> & { name: string }>({
      query: (body) => ({ url: '/lead-machine/candidates', method: 'POST', body }),
      invalidatesTags: ['LeadCandidates'],
    }),
    getLeadCandidate: b.query<LeadCandidate, string>({
      query: (id) => ({ url: `/lead-machine/candidates/${id}`, method: 'GET' }),
      providesTags: ['LeadCandidates'],
    }),
    reviewLeadCandidate: b.mutation<LeadCandidate, ReviewBody>({
      query: ({ id, ...body }) => ({ url: `/lead-machine/candidates/${id}/review`, method: 'PATCH', body }),
      invalidatesTags: ['LeadCandidates', 'LeadFeedback'],
    }),
    approveLeadCandidateToLead: b.mutation<unknown, string>({
      query: (id) => ({ url: `/lead-machine/candidates/${id}/approve-to-lead`, method: 'POST' }),
      invalidatesTags: ['LeadCandidates', 'MarketLeads'],
    }),
    enrichLeadCandidate: b.mutation<unknown, string>({
      query: (id) => ({ url: `/lead-machine/enrich/${id}`, method: 'POST' }),
      invalidatesTags: ['LeadCandidates'],
    }),
    enrichLeadCandidatesBatch: b.mutation<unknown, { candidate_ids: string[] }>({
      query: (body) => ({ url: '/lead-machine/enrich/batch', method: 'POST', body }),
      invalidatesTags: ['LeadCandidates'],
    }),

    listIcpProfiles: b.query<IcpProfile[], void>({
      query: () => ({ url: '/lead-machine/icp', method: 'GET' }),
      providesTags: ['IcpProfiles'],
    }),
    createIcpProfile: b.mutation<IcpProfile, Partial<IcpProfile> & { name: string }>({
      query: (body) => ({ url: '/lead-machine/icp', method: 'POST', body }),
      invalidatesTags: ['IcpProfiles'],
    }),
    updateIcpProfile: b.mutation<IcpProfile, { id: string; patch: Partial<IcpProfile> }>({
      query: ({ id, patch }) => ({ url: `/lead-machine/icp/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['IcpProfiles'],
    }),
    deleteIcpProfile: b.mutation<void, string>({
      query: (id) => ({ url: `/lead-machine/icp/${id}`, method: 'DELETE' }),
      invalidatesTags: ['IcpProfiles'],
    }),

    startB2bLeadJob: b.mutation<LeadSearchJob, StartLeadJobBody>({
      query: (body) => ({ url: '/lead-machine/b2b/jobs', method: 'POST', body }),
      invalidatesTags: ['LeadJobs', 'LeadCandidates'],
    }),
    listB2bLeadJobs: b.query<LeadSearchJob[], void>({
      query: () => ({ url: '/lead-machine/b2b/jobs', method: 'GET' }),
      providesTags: ['LeadJobs'],
    }),
    getB2bLeadJob: b.query<LeadSearchJob, string>({
      query: (id) => ({ url: `/lead-machine/b2b/jobs/${id}`, method: 'GET' }),
      providesTags: ['LeadJobs'],
    }),
    startCustomsLeadJob: b.mutation<LeadSearchJob, StartLeadJobBody>({
      query: (body) => ({ url: '/lead-machine/customs/jobs', method: 'POST', body }),
      invalidatesTags: ['LeadJobs', 'LeadCandidates'],
    }),
    listCustomsLeadJobs: b.query<LeadSearchJob[], void>({
      query: () => ({ url: '/lead-machine/customs/jobs', method: 'GET' }),
      providesTags: ['LeadJobs'],
    }),
    getCustomsLeadJob: b.query<LeadSearchJob, string>({
      query: (id) => ({ url: `/lead-machine/customs/jobs/${id}`, method: 'GET' }),
      providesTags: ['LeadJobs'],
    }),
    startFairLeadJob: b.mutation<LeadSearchJob, StartLeadJobBody>({
      query: (body) => ({ url: '/lead-machine/fair/jobs', method: 'POST', body }),
      invalidatesTags: ['LeadJobs', 'LeadCandidates'],
    }),
    runFairLeadJob: b.mutation<LeadSearchJob, StartLeadJobBody>({
      query: (body) => ({ url: '/lead-machine/fair/run', method: 'POST', body }),
      invalidatesTags: ['LeadJobs', 'LeadCandidates'],
    }),
    listFairLeadJobs: b.query<LeadSearchJob[], void>({
      query: () => ({ url: '/lead-machine/fair/jobs', method: 'GET' }),
      providesTags: ['LeadJobs'],
    }),
    getFairLeadJob: b.query<LeadSearchJob, string>({
      query: (id) => ({ url: `/lead-machine/fair/jobs/${id}`, method: 'GET' }),
      providesTags: ['LeadJobs'],
    }),
    getFairBriefingCandidatePdf: b.query<Blob, string>({
      query: (candidateId) => ({
        url: `/lead-machine/fair/brifing/${candidateId}.pdf`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
    getFairBriefingDayPdf: b.query<Blob, string>({
      query: (date) => ({
        url: `/lead-machine/fair/brifing/day/${date}.pdf`,
        method: 'GET',
        responseHandler: (response) => response.blob(),
      }),
    }),
    generateFairBriefingBulkPdf: b.mutation<Blob, { ids: string[] }>({
      query: (body) => ({
        url: '/lead-machine/fair/brifing/bulk',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),

    listLeadRules: b.query<LeadScanRule[], void>({
      query: () => ({ url: '/lead-machine/rules', method: 'GET' }),
      providesTags: ['LeadRules'],
    }),
    createLeadRule: b.mutation<LeadScanRule, Partial<LeadScanRule> & { value: string }>({
      query: (body) => ({ url: '/lead-machine/rules', method: 'POST', body }),
      invalidatesTags: ['LeadRules'],
    }),
    deleteLeadRule: b.mutation<void, string>({
      query: (id) => ({ url: `/lead-machine/rules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LeadRules'],
    }),
    getLeadRejectionStats: b.query<unknown, void>({
      query: () => ({ url: '/lead-machine/feedback/rejection-stats', method: 'GET' }),
      providesTags: ['LeadFeedback'],
    }),
    getLeadApprovedStats: b.query<unknown, void>({
      query: () => ({ url: '/lead-machine/feedback/approved-stats', method: 'GET' }),
      providesTags: ['LeadFeedback'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListLeadCandidatesQuery,
  useCreateLeadCandidateMutation,
  useGetLeadCandidateQuery,
  useReviewLeadCandidateMutation,
  useApproveLeadCandidateToLeadMutation,
  useEnrichLeadCandidateMutation,
  useEnrichLeadCandidatesBatchMutation,
  useListIcpProfilesQuery,
  useCreateIcpProfileMutation,
  useUpdateIcpProfileMutation,
  useDeleteIcpProfileMutation,
  useStartB2bLeadJobMutation,
  useListB2bLeadJobsQuery,
  useGetB2bLeadJobQuery,
  useStartCustomsLeadJobMutation,
  useListCustomsLeadJobsQuery,
  useGetCustomsLeadJobQuery,
  useStartFairLeadJobMutation,
  useRunFairLeadJobMutation,
  useListFairLeadJobsQuery,
  useGetFairLeadJobQuery,
  useLazyGetFairBriefingCandidatePdfQuery,
  useLazyGetFairBriefingDayPdfQuery,
  useGenerateFairBriefingBulkPdfMutation,
  useListLeadRulesQuery,
  useCreateLeadRuleMutation,
  useDeleteLeadRuleMutation,
  useGetLeadRejectionStatsQuery,
  useGetLeadApprovedStatsQuery,
} = leadMachineApi;
