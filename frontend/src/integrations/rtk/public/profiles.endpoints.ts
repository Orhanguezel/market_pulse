// src/integrations/rtk/endpoints/profiles.endpoints.ts

import { baseApi } from '@/integrations/rtk/baseApi';
import type { Profile, ProfileUpsertRequest } from '@/integrations/shared';

export const profilesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyProfile: b.query<Profile | null, void>({
      query: () => ({ url: '/profiles/me', method: 'GET' }),
      providesTags: ['Profile'],
    }),

    upsertMyProfile: b.mutation<Profile, ProfileUpsertRequest>({
      query: (body) => ({
        url: '/profiles/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
  overrideExisting: true,
});

export const { useGetMyProfileQuery, useUpsertMyProfileMutation } = profilesApi;
