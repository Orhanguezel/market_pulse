// =============================================================
// FILE: src/integrations/endpoints/public/profiles.endpoints.ts
// FINAL — Profiles RTK (me + public by id)
// Backend:
// - GET  /profiles/me        (auth)
// - PUT  /profiles/me        (auth)
// - GET  /profiles/:id       (public)  ✅ NEW
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  GetMyProfileResp,
  UpsertMyProfileReq,
  UpsertMyProfileResp,
  Profile,
} from '@/integrations/shared';
import { normalizeProfile } from '@/integrations/shared';

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyProfile: b.query<GetMyProfileResp, void>({
      query: () => ({ url: '/profiles/me', method: 'GET' }),
      transformResponse: (res: unknown): GetMyProfileResp => {
        if (!res) return null;
        return normalizeProfile(res as any);
      },
      providesTags: ['Profile'],
    }),

    upsertMyProfile: b.mutation<UpsertMyProfileResp, UpsertMyProfileReq>({
      query: (body) => ({ url: '/profiles/me', method: 'PUT', body }),
      transformResponse: (res: unknown): UpsertMyProfileResp => normalizeProfile(res as any),
      invalidatesTags: ['Profile'],
    }),

    // ✅ NEW: Public profile by id (author box için)
    getProfileById: b.query<Profile | null, string>({
      query: (id) => ({ url: `/profiles/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): Profile | null => {
        if (!res) return null;
        return normalizeProfile(res as any);
      },
      providesTags: ['Profile'],
      keepUnusedDataFor: 60,
    }),
  }),
  overrideExisting: true,
});

export const { useGetMyProfileQuery, useUpsertMyProfileMutation, useGetProfileByIdQuery } =
  profilesApi;
