// =============================================================
// FILE: src/integrations/rtk/endpoints/resources.endpoints.ts
// FINAL — Public resources – GET /resources
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { ResourcePublicItemDto, ResourcesPublicListQueryParams } from '@/integrations/shared';

export const resourcesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** PUBLIC: list active resources  GET /resources?type=... */
    listResourcesPublic: build.query<
      ResourcePublicItemDto[],
      ResourcesPublicListQueryParams | void
    >({
      query: (params?: ResourcesPublicListQueryParams) => ({
        url: '/resources',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'Resources' as const, id: r.id })),
              { type: 'Resources' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'Resources' as const, id: 'PUBLIC_LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useListResourcesPublicQuery } = resourcesPublicApi;
