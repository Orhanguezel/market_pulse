// =============================================================
// FILE: src/integrations/rtk/endpoints/faqs.endpoints.ts
// Public (auth'suz) FAQ endpoint'leri – locale header destekli
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { FaqDto, FaqListQueryParams } from '@/integrations/shared';
import { cleanParams, makeLocaleHeaders } from '@/integrations/shared';

export const faqsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /faqs – liste (public) */
    listFaqs: builder.query<FaqDto[], FaqListQueryParams | void>({
      query: (params) => {
        const p = (params || {}) as FaqListQueryParams;
        const { locale, ...rest } = p;

        return {
          url: '/faqs',
          method: 'GET',
          params: cleanParams(rest),
          headers: makeLocaleHeaders(locale),
        };
      },
    }),

    /** GET /faqs/:id – tek kayıt (public) */
    getFaq: builder.query<FaqDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/faqs/${id}`,
        method: 'GET',
        headers: makeLocaleHeaders(locale),
      }),
    }),

    /** GET /faqs/by-slug/:slug – slug ile tek kayıt (public) */
    getFaqBySlug: builder.query<FaqDto, { slug: string; locale?: string }>({
      query: ({ slug, locale }) => ({
        url: `/faqs/by-slug/${encodeURIComponent(slug)}`,
        method: 'GET',
        headers: makeLocaleHeaders(locale),
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useListFaqsQuery, useGetFaqQuery, useGetFaqBySlugQuery } = faqsApi;
