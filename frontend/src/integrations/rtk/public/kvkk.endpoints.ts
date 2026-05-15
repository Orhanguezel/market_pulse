// =============================================================
// FILE: src/integrations/rtk/public/kvkk.endpoints.ts
// KVKK: veri ihracı + hesap silme istekleri
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';

export interface KvkkExportPayload {
  [key: string]: unknown;
}

export interface KvkkDeletionRequest {
  id: string;
  user_id: string;
  requested_at?: string;
  scheduled_for?: string;
  status: 'pending' | 'cancelled' | 'completed';
  reason?: string | null;
  message?: string;
  cooling_off_days?: number;
}

interface KvkkWrapped<T> {
  data?: T | null;
}

const kvkkApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountDeletionStatus: build.query<KvkkDeletionRequest | null, void>({
      query: () => ({
        url: '/me/delete-account',
        method: 'GET',
      }),
      transformResponse: (response: KvkkWrapped<KvkkDeletionRequest> | KvkkDeletionRequest | null): KvkkDeletionRequest | null => {
        if (!response) return null;
        return (response as KvkkWrapped<KvkkDeletionRequest>).data ?? (response as KvkkDeletionRequest);
      },
      providesTags: ['Profile'],
    }),

    requestAccountDeletion: build.mutation<KvkkDeletionRequest, { reason?: string }>({
      query: (body) => ({
        url: '/me/delete-account',
        method: 'POST',
        body,
      }),
      transformResponse: (response: KvkkWrapped<KvkkDeletionRequest> | KvkkDeletionRequest): KvkkDeletionRequest => {
        const data = (response as KvkkWrapped<KvkkDeletionRequest>).data;
        return (data as KvkkDeletionRequest) ?? (response as KvkkDeletionRequest);
      },
      invalidatesTags: ['Profile'],
    }),

    cancelAccountDeletion: build.mutation<KvkkDeletionRequest, void>({
      query: () => ({
        url: '/me/delete-account',
        method: 'DELETE',
      }),
      transformResponse: (response: KvkkWrapped<KvkkDeletionRequest> | KvkkDeletionRequest): KvkkDeletionRequest => {
        const data = (response as KvkkWrapped<KvkkDeletionRequest>).data;
        return (data as KvkkDeletionRequest) ?? (response as KvkkDeletionRequest);
      },
      invalidatesTags: ['Profile'],
    }),

    exportMyData: build.mutation<KvkkExportPayload, void>({
      query: () => ({
        url: '/me/export',
        method: 'GET',
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAccountDeletionStatusQuery,
  useRequestAccountDeletionMutation,
  useCancelAccountDeletionMutation,
  useExportMyDataMutation,
} = kvkkApi;
