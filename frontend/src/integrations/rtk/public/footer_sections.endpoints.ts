// =============================================================
// FILE: src/integrations/rtk/endpoints/footer_sections.endpoints.ts
// – Public Footer Sections RTK endpoints
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  ApiFooterSection,
  FooterSectionDto,
  FooterSectionListQueryParams,
} from '@/integrations/shared';
import { normalizeFooterSection } from '@/integrations/shared';

export const footerSectionsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET /footer_sections
     * Query: FooterSectionListQueryParams
     * Body: FooterSectionDto[]
     */
    listFooterSections: build.query<FooterSectionDto[], FooterSectionListQueryParams | void>({
      query: (params?: FooterSectionListQueryParams) => ({
        url: '/footer_sections',
        method: 'GET',
        params,
      }),
      transformResponse: (response: ApiFooterSection[]) =>
        (response || []).map(normalizeFooterSection),
    }),

    /**
     * GET /footer_sections/:id
     */
    getFooterSection: build.query<FooterSectionDto, string>({
      query: (id) => ({
        url: `/footer_sections/${encodeURIComponent(id)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
    }),

    /**
     * GET /footer_sections/by-slug/:slug
     */
    getFooterSectionBySlug: build.query<FooterSectionDto, string>({
      query: (slug) => ({
        url: `/footer_sections/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
      }),
      transformResponse: (response: ApiFooterSection) => normalizeFooterSection(response),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFooterSectionsQuery,
  useGetFooterSectionQuery,
  useGetFooterSectionBySlugQuery,
} = footerSectionsApi;
