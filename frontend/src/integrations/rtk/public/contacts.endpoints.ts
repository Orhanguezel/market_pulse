// =============================================================
// FILE: src/integrations/rtk/endpoints/contacts.endpoints.ts
// Public contact form – POST /contacts
// =============================================================

import { baseApi } from '@/integrations/rtk/baseApi';
import type { ContactDto, ContactCreatePayload } from '@/integrations/shared';

export const contactsPublicApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * PUBLIC: Contact form gönderimi
     * POST /contacts
     */
    createContactPublic: build.mutation<ContactDto, ContactCreatePayload>({
      query: (body) => ({
        url: '/contacts',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useCreateContactPublicMutation } = contactsPublicApi;
