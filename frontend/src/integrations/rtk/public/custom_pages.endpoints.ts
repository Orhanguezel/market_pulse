// =============================================================
// FILE: src/integrations/rtk/endpoints/custom_pages.endpoints.ts
// – Custom Pages Public RTK Endpoints (FINAL)
// Backend: src/modules/customPages/router.ts
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiCustomPage,
  CustomPageDto,
  CustomPageListPublicQueryParams,
  CustomPageBySlugArgs,
} from '@/integrations/shared';
import {
  mapApiCustomPageToDto,
  cleanParams,
  parseTotalFromHeaders,
  normalizeArrayResponse,
} from '@/integrations/shared';

export const customPagesPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCustomPagesPublic: build.query<
      { items: CustomPageDto[]; total: number },
      CustomPageListPublicQueryParams | void
    >({
      query: (params) => ({
        url: '/custom-pages',
        method: 'GET',
        params: cleanParams(params as any),
      }),
      transformResponse: (response: unknown, meta) => {
        const rows = normalizeArrayResponse<ApiCustomPage>(response);
        const total = parseTotalFromHeaders(
          (meta as any)?.response?.headers,
          rows.length,
        );
        return { items: rows.map(mapApiCustomPageToDto), total };
      },
      providesTags: (result) =>
        result?.items?.length
          ? [
              ...result.items.map((p) => ({ type: 'CustomPage' as const, id: p.id })),
              { type: 'CustomPage' as const, id: 'PUBLIC_LIST' },
            ]
          : [{ type: 'CustomPage' as const, id: 'PUBLIC_LIST' }],
    }),

    getCustomPagePublic: build.query<
      CustomPageDto,
      { id: string; locale?: string; default_locale?: string }
    >({
      query: ({ id, locale, default_locale }) => ({
        url: `/custom-pages/${encodeURIComponent(id)}`,
        method: 'GET',
        params: cleanParams({ locale, default_locale }),
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      providesTags: (_result, _error, { id }) => [{ type: 'CustomPage' as const, id }],
    }),

    getCustomPageBySlugPublic: build.query<CustomPageDto, CustomPageBySlugArgs>({
      query: ({ slug, locale, default_locale }) => ({
        url: `/custom-pages/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        params: cleanParams({ locale, default_locale }),
      }),
      transformResponse: (response: ApiCustomPage) => mapApiCustomPageToDto(response),
      providesTags: (_result, _error, args) => [{ type: 'CustomPageSlug' as const, id: args.slug }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomPagesPublicQuery,
  useGetCustomPagePublicQuery,
  useGetCustomPageBySlugPublicQuery,
} = customPagesPublicApi;
