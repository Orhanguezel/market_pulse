// =============================================================
// FILE: src/integrations/endpoints/admin/mail_admin.endpoints.ts
// SMTP test mail endpoint
// - POST /mail/test
// =============================================================

import { baseApi } from '@/integrations/baseApi';
import type { SendTestMailBody, SendTestMailResponse } from '@/integrations/shared';

export const mailAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    sendTestMail: b.mutation<SendTestMailResponse, SendTestMailBody | void>({
      query: (body) => ({
        url: '/mail/test',
        method: 'POST',
        body: body ?? {},
      }),
      transformResponse: () => ({ ok: true as const }),
    }),
  }),
  overrideExisting: true,
});

export const { useSendTestMailMutation } = mailAdminApi;
