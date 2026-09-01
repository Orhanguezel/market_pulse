import { baseApi } from '../baseApi';
import type {
  ImapSmtpAccountInput,
  MailAccount,
  MailInboxResponse,
  MailMessage,
  SendMailInput,
} from '@/integrations/shared/mail-account.types';

export const mailAccountsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    listMailAccounts: b.query<MailAccount[], void>({
      query: () => ({ url: '/mail/accounts', method: 'GET' }),
      providesTags: ['MailAccounts'],
    }),
    gmailConnectUrl: b.query<{ url: string }, void>({
      query: () => ({ url: '/mail/accounts/gmail/connect', method: 'GET' }),
    }),
    createImapSmtpAccount: b.mutation<MailAccount[], ImapSmtpAccountInput>({
      query: (body) => ({ url: '/mail/accounts/imap', method: 'POST', body }),
      invalidatesTags: ['MailAccounts'],
    }),
    deleteMailAccount: b.mutation<void, string>({
      query: (id) => ({ url: `/mail/accounts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['MailAccounts'],
    }),
    listMailInbox: b.query<MailInboxResponse, { folder?: string; pageToken?: string; limit?: number }>({
      query: (params) => ({ url: '/mail/inbox', method: 'GET', params }),
      providesTags: ['MailInbox'],
    }),
    getMailMessage: b.query<MailMessage, string>({
      query: (id) => ({ url: `/mail/messages/${id}`, method: 'GET' }),
      providesTags: ['MailInbox'],
    }),
    sendUserMail: b.mutation<{ ok: boolean }, SendMailInput>({
      query: (body) => ({ url: '/mail/send', method: 'POST', body }),
      invalidatesTags: ['MailInbox'],
    }),
  }),
});

export const {
  useListMailAccountsQuery,
  useLazyGmailConnectUrlQuery,
  useCreateImapSmtpAccountMutation,
  useDeleteMailAccountMutation,
  useListMailInboxQuery,
  useGetMailMessageQuery,
  useSendUserMailMutation,
} = mailAccountsApi;
