export type MailProvider = 'gmail_oauth' | 'imap_smtp';
export type MailAccountStatus = 'connected' | 'expired' | 'error' | 'disconnected';

export type MailAccount = {
  id: string;
  provider: MailProvider;
  email: string;
  display_name: string | null;
  status: MailAccountStatus;
  scopes: string | null;
  token_expiry: string | null;
  last_synced_at: string | null;
  configured: boolean;
};

export type MailInboxMessage = {
  id: string;
  thread_id: string | null;
  from: string | null;
  to: string | null;
  subject: string;
  date: string | null;
  snippet: string;
  unread: boolean;
};

export type MailMessage = MailInboxMessage & {
  text: string;
  html: string;
};

export type MailInboxResponse = {
  account: MailAccount | null;
  messages: MailInboxMessage[];
  nextPageToken: string | null;
};

export type ImapSmtpAccountInput = {
  email: string;
  displayName?: string | null;
  imapHost?: string | null;
  imapPort?: number | null;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean | null;
  smtpUsername?: string | null;
  password: string;
};

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | null;
};
