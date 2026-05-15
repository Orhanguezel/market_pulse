// =============================================================
// FILE: src/integrations/rtk/endpoints/newsletter_public.endpoints.ts
// PUBLIC Newsletter: subscribe / unsubscribe
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type {
  NewsletterPublicDto,
  NewsletterSubscribePayload,
  NewsletterUnsubscribePayload,
} from '@/integrations/shared';

export const newsletterPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * POST /newsletter/subscribe
     */
    subscribeNewsletter: build.mutation<NewsletterPublicDto, NewsletterSubscribePayload>({
      query: (body) => ({
        url: '/newsletter/subscribe',
        method: 'POST',
        body,
      }),
    }),

    /**
     * POST /newsletter/unsubscribe
     * Backend: { ok: true }
     */
    unsubscribeNewsletter: build.mutation<{ ok: boolean }, NewsletterUnsubscribePayload>({
      query: (body) => ({
        url: '/newsletter/unsubscribe',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useSubscribeNewsletterMutation, useUnsubscribeNewsletterMutation } =
  newsletterPublicApi;
