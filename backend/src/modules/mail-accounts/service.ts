import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { google } from 'googleapis';
import type { gmail_v1 } from 'googleapis';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { env } from '@/core/env';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import { decryptAes256Gcm, encryptAes256Gcm } from '@/modules/_shared/crypto';
import { checkAndConsumeDailyUsage, getTodayDailyUsageCount, incrementDailyUsage } from '@/modules/public-api/quota.repository';
import { getGoogleSettings } from '@/modules/siteSettings';

const require = createRequire(import.meta.url);

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

type MailAccountStatus = 'connected' | 'expired' | 'error' | 'disconnected';
type MailProvider = 'gmail_oauth' | 'imap_smtp';

export type SafeMailAccount = {
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

type MailAccountRow = SafeMailAccount & {
  tenant_key: string;
  owner_user_id: string;
  enc_access_token: string | null;
  enc_refresh_token: string | null;
  imap_host: string | null;
  imap_port: number | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: number | boolean | null;
  smtp_username: string | null;
  enc_password: string | null;
};

export type SendMailViaAccountInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | null;
};

export type GmailQuotaExceededError = Error & {
  statusCode: number;
  code: 'GMAIL_DAILY_LIMIT_REACHED' | 'DAILY_LIMIT_REACHED';
  quota?: unknown;
};

function encrypt(value: string) {
  return encryptAes256Gcm(value, env.MAIL_ENCRYPTION_KEY, 'MAIL_ENCRYPTION_KEY');
}

function decrypt(value: string) {
  return decryptAes256Gcm(value, env.MAIL_ENCRYPTION_KEY, 'MAIL_ENCRYPTION_KEY');
}

function publicBaseUrl() {
  return (env.PUBLIC_URL || env.APP_URL || '').replace(/\/+$/, '');
}

function callbackUrl() {
  return `${publicBaseUrl()}/api/v1/mail/accounts/gmail/callback`;
}

function hmacSecret() {
  return env.COOKIE_SECRET || env.JWT_SECRET;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function signState(payload: Record<string, unknown>) {
  const body = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', hmacSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyState(state: string): { tenantKey: string; userId: string; exp: number } {
  const [body, sig] = state.split('.');
  if (!body || !sig) throw new Error('invalid_state');
  const expected = crypto.createHmac('sha256', hmacSecret()).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('invalid_state');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Record<string, unknown>;
  const exp = Number(payload.exp ?? 0);
  if (!exp || Date.now() > exp) throw new Error('expired_state');
  const tenantKey = typeof payload.tenantKey === 'string' ? payload.tenantKey : '';
  const userId = typeof payload.userId === 'string' ? payload.userId : '';
  if (!tenantKey || !userId) throw new Error('invalid_state');
  return { tenantKey, userId, exp };
}

async function oauthClient() {
  // Gmail'e ozel client (login'den bagimsiz); yoksa genel Google ayarina duser.
  let clientId = env.GMAIL_OAUTH_CLIENT_ID;
  let clientSecret = env.GMAIL_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const settings = await getGoogleSettings();
    clientId = settings.clientId ?? '';
    clientSecret = settings.clientSecret ?? '';
  }
  if (!clientId || !clientSecret) throw new Error('google_oauth_not_configured');
  return new google.auth.OAuth2(clientId, clientSecret, callbackUrl());
}

function safeAccount(row: MailAccountRow): SafeMailAccount {
  return {
    id: row.id,
    provider: row.provider,
    email: row.email,
    display_name: row.display_name,
    status: row.status,
    scopes: row.scopes,
    token_expiry: row.token_expiry,
    last_synced_at: row.last_synced_at,
    configured: Boolean(row.enc_refresh_token || row.enc_password),
  };
}

function folderToImapPath(folder?: string) {
  if (folder === 'sent') return '[Gmail]/Sent Mail';
  if (folder === 'drafts') return '[Gmail]/Drafts';
  if (folder === 'trash') return '[Gmail]/Trash';
  return 'INBOX';
}

function encodeImapMessageId(accountId: string, folder: string | undefined, uid: number) {
  return `imap:${accountId}:${encodeURIComponent(folder || 'inbox')}:${uid}`;
}

function decodeImapMessageId(id: string) {
  const parts = id.split(':');
  if (parts.length !== 4 || parts[0] !== 'imap') return null;
  const uid = Number(parts[3]);
  if (!parts[1] || !Number.isFinite(uid)) return null;
  return { accountId: parts[1], folder: decodeURIComponent(parts[2] || 'inbox'), uid };
}

function addressText(value: { text?: string } | Array<{ text?: string }> | undefined) {
  if (Array.isArray(value)) return value.map((item) => item.text).filter(Boolean).join(', ') || null;
  return value?.text ?? null;
}

export async function listMailAccounts(userId: string): Promise<SafeMailAccount[]> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT id, provider, email, display_name, status, scopes, token_expiry, last_synced_at,
            enc_refresh_token, enc_password
       FROM user_mail_accounts
      WHERE tenant_key = ? AND owner_user_id = ?
      ORDER BY created_at DESC`,
    [tenantKey, userId],
  );
  return (rows as MailAccountRow[]).map(safeAccount);
}

export async function createGmailConnectUrl(userId: string): Promise<{ url: string }> {
  const tenantKey = await getActiveTenantKey();
  const client = await oauthClient();
  const state = signState({
    tenantKey,
    userId,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 10 * 60_000,
  });
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state,
    include_granted_scopes: true,
  });
  return { url };
}

export async function handleGmailCallback(code: string, state: string): Promise<{ redirect: string }> {
  const { tenantKey, userId } = verifyState(state);
  const client = await oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email;
  if (!email) throw new Error('gmail_email_missing');

  const accessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
  const refreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
  const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
  const scopes = Array.isArray(tokens.scope) ? tokens.scope.join(' ') : String(tokens.scope || GMAIL_SCOPES.join(' '));

  await pool.execute(
    `INSERT INTO user_mail_accounts
      (id, tenant_key, owner_user_id, provider, email, display_name, enc_access_token,
       enc_refresh_token, token_expiry, scopes, status, last_error)
     VALUES (UUID(), ?, ?, 'gmail_oauth', ?, ?, ?, ?, ?, ?, 'connected', NULL)
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       enc_access_token = COALESCE(VALUES(enc_access_token), enc_access_token),
       enc_refresh_token = COALESCE(VALUES(enc_refresh_token), enc_refresh_token),
       token_expiry = VALUES(token_expiry),
       scopes = VALUES(scopes),
       status = 'connected',
       last_error = NULL,
       updated_at = CURRENT_TIMESTAMP(3)`,
    [tenantKey, userId, email, profile.data.name ?? null, accessToken, refreshToken, expiry, scopes],
  );

  return { redirect: `${publicBaseUrl()}/tr/mail-yonetimi?mail=connected` };
}

async function getPrimaryAccount(userId: string): Promise<MailAccountRow | null> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT *
       FROM user_mail_accounts
      WHERE tenant_key = ? AND owner_user_id = ? AND status = 'connected'
      ORDER BY provider = 'gmail_oauth' DESC, updated_at DESC
      LIMIT 1`,
    [tenantKey, userId],
  );
  return (rows as MailAccountRow[])[0] ?? null;
}

async function getOwnedAccount(userId: string, accountId: string): Promise<MailAccountRow | null> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    'SELECT * FROM user_mail_accounts WHERE tenant_key = ? AND owner_user_id = ? AND id = ? LIMIT 1',
    [tenantKey, userId, accountId],
  );
  return (rows as MailAccountRow[])[0] ?? null;
}

export async function deleteMailAccount(userId: string, id: string): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    'SELECT * FROM user_mail_accounts WHERE tenant_key = ? AND owner_user_id = ? AND id = ? LIMIT 1',
    [tenantKey, userId, id],
  );
  const account = (rows as MailAccountRow[])[0];
  if (account?.provider === 'gmail_oauth' && account.enc_access_token) {
    try {
      const client = await oauthClient();
      await client.revokeToken(decrypt(account.enc_access_token));
    } catch {
      // Best effort revoke; row removal is the important local security action.
    }
  }
  await pool.execute('DELETE FROM user_mail_accounts WHERE tenant_key = ? AND owner_user_id = ? AND id = ?', [tenantKey, userId, id]);
}

async function getGmailClient(account: MailAccountRow): Promise<gmail_v1.Gmail> {
  const client = await oauthClient();
  const refreshToken = account.enc_refresh_token ? decrypt(account.enc_refresh_token) : null;
  if (!refreshToken) throw new Error('gmail_refresh_token_missing');
  client.setCredentials({
    refresh_token: refreshToken,
    access_token: account.enc_access_token ? decrypt(account.enc_access_token) : undefined,
    expiry_date: account.token_expiry ? new Date(account.token_expiry).getTime() : undefined,
  });
  if (!account.token_expiry || new Date(account.token_expiry).getTime() < Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    await pool.execute(
      `UPDATE user_mail_accounts
          SET enc_access_token = COALESCE(?, enc_access_token),
              token_expiry = ?,
              status = 'connected',
              last_error = NULL
        WHERE id = ?`,
      [
        credentials.access_token ? encrypt(credentials.access_token) : null,
        credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        account.id,
      ],
    );
    client.setCredentials({ ...client.credentials, ...credentials });
  }
  return google.gmail({ version: 'v1', auth: client });
}

async function consumeGmailSendQuota(userId: string): Promise<void> {
  const productQuota = await checkAndConsumeDailyUsage(userId, 'gmail_send');
  if (!productQuota.allowed) {
    const err = new Error('daily_limit_reached') as GmailQuotaExceededError;
    err.statusCode = 429;
    err.code = 'DAILY_LIMIT_REACHED';
    err.quota = productQuota.quota;
    throw err;
  }

  const providerLimit = env.GMAIL_DAILY_SEND_LIMIT;
  if (providerLimit > -1) {
    const used = await getTodayDailyUsageCount(userId, 'gmail_send_provider');
    if (used + 1 > providerLimit) {
      const err = new Error('gmail_daily_limit_reached') as GmailQuotaExceededError;
      err.statusCode = 429;
      err.code = 'GMAIL_DAILY_LIMIT_REACHED';
      err.quota = { daily_limit: providerLimit, used_today: used, remaining: 0, unlimited: false };
      throw err;
    }
    await incrementDailyUsage(userId, 'gmail_send_provider');
  }
}

function header(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string) {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function decodeBody(data: string | null | undefined) {
  if (!data) return '';
  return Buffer.from(data, 'base64url').toString('utf8');
}

function collectBody(part: gmail_v1.Schema$MessagePart | undefined, acc: { text: string[]; html: string[] }) {
  if (!part) return;
  if (part.mimeType === 'text/plain') acc.text.push(decodeBody(part.body?.data));
  if (part.mimeType === 'text/html') acc.html.push(decodeBody(part.body?.data));
  for (const child of part.parts ?? []) collectBody(child, acc);
}

export async function listInbox(userId: string, opts: { folder?: string; pageToken?: string; limit?: number }) {
  const account = await getPrimaryAccount(userId);
  if (!account) return { account: null, messages: [], nextPageToken: null };
  if (account.provider === 'imap_smtp') return listImapInbox(account, opts);
  if (account.provider !== 'gmail_oauth') return { account: safeAccount(account), messages: [], nextPageToken: null };
  const gmail = await getGmailClient(account);
  const folder = opts.folder || 'inbox';
  const q = folder === 'sent' ? 'in:sent' : folder === 'trash' ? 'in:trash' : folder === 'drafts' ? 'in:drafts' : 'in:inbox';
  const list = await gmail.users.messages.list({
    userId: 'me',
    q,
    maxResults: Math.min(Math.max(opts.limit ?? 20, 1), 50),
    pageToken: opts.pageToken,
  });
  const ids = list.data.messages ?? [];
  const messages = await Promise.all(ids.map(async (msg) => {
    const res = await gmail.users.messages.get({ userId: 'me', id: msg.id!, format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] });
    const payload = res.data.payload;
    return {
      id: res.data.id!,
      thread_id: res.data.threadId ?? null,
      from: header(payload?.headers, 'From'),
      to: header(payload?.headers, 'To'),
      subject: header(payload?.headers, 'Subject') || '(konu yok)',
      date: header(payload?.headers, 'Date'),
      snippet: res.data.snippet ?? '',
      unread: Boolean(res.data.labelIds?.includes('UNREAD')),
    };
  }));
  await pool.execute('UPDATE user_mail_accounts SET last_synced_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [account.id]);
  return { account: safeAccount(account), messages, nextPageToken: list.data.nextPageToken ?? null };
}

export async function getMessage(userId: string, messageId: string) {
  const imapId = decodeImapMessageId(messageId);
  if (imapId) {
    const account = await getOwnedAccount(userId, imapId.accountId);
    if (!account || account.provider !== 'imap_smtp') return null;
    return getImapMessage(account, imapId.folder, imapId.uid);
  }
  const account = await getPrimaryAccount(userId);
  if (!account || account.provider !== 'gmail_oauth') return null;
  const gmail = await getGmailClient(account);
  const res = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  const body = { text: [] as string[], html: [] as string[] };
  collectBody(res.data.payload, body);
  return {
    id: res.data.id!,
    thread_id: res.data.threadId ?? null,
    from: header(res.data.payload?.headers, 'From'),
    to: header(res.data.payload?.headers, 'To'),
    subject: header(res.data.payload?.headers, 'Subject') || '(konu yok)',
    date: header(res.data.payload?.headers, 'Date'),
    snippet: res.data.snippet ?? '',
    text: body.text.join('\n\n'),
    html: body.html.join('\n\n'),
  };
}

async function createImapClient(account: MailAccountRow) {
  if (!account.imap_host || !account.imap_port || !account.enc_password) throw new Error('imap_not_configured');
  const client = new ImapFlow({
    host: account.imap_host,
    port: account.imap_port,
    secure: account.imap_port === 993,
    auth: {
      user: account.smtp_username || account.email,
      pass: decrypt(account.enc_password),
    },
    logger: false,
  });
  await client.connect();
  return client;
}

async function listImapInbox(account: MailAccountRow, opts: { folder?: string; limit?: number }) {
  const client = await createImapClient(account);
  try {
    const folder = opts.folder || 'inbox';
    const mailbox = await client.mailboxOpen(folderToImapPath(folder), { readOnly: true });
    const exists = Number(mailbox.exists || 0);
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
    if (exists === 0) return { account: safeAccount(account), messages: [], nextPageToken: null };
    const start = Math.max(1, exists - limit + 1);
    const messages = [];
    for await (const msg of client.fetch(`${start}:*`, { uid: true, envelope: true, flags: true, internalDate: true }, { uid: false })) {
      const envelope = msg.envelope;
      messages.push({
        id: encodeImapMessageId(account.id, folder, msg.uid),
        thread_id: null,
        from: envelope?.from?.map((addr) => addr.address || addr.name).filter(Boolean).join(', ') || null,
        to: envelope?.to?.map((addr) => addr.address || addr.name).filter(Boolean).join(', ') || null,
        subject: envelope?.subject || '(konu yok)',
        date: msg.internalDate ? String(msg.internalDate) : null,
        snippet: '',
        unread: !msg.flags?.has('\\Seen'),
      });
    }
    await pool.execute('UPDATE user_mail_accounts SET last_synced_at = CURRENT_TIMESTAMP(3) WHERE id = ?', [account.id]);
    return { account: safeAccount(account), messages: messages.reverse(), nextPageToken: null };
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function getImapMessage(account: MailAccountRow, folder: string, uid: number) {
  const client = await createImapClient(account);
  try {
    await client.mailboxOpen(folderToImapPath(folder), { readOnly: true });
    const msg = await client.fetchOne(String(uid), { uid: true, source: true, flags: true }, { uid: true });
    if (!msg || !msg.source) return null;
    const parsed = await simpleParser(msg.source);
    return {
      id: encodeImapMessageId(account.id, folder, uid),
      thread_id: null,
      from: addressText(parsed.from),
      to: addressText(parsed.to),
      subject: parsed.subject || '(konu yok)',
      date: parsed.date ? parsed.date.toISOString() : null,
      snippet: parsed.text?.slice(0, 200) ?? '',
      unread: !msg.flags?.has('\\Seen'),
      text: parsed.text ?? '',
      html: typeof parsed.html === 'string' ? parsed.html : '',
    };
  } finally {
    await client.logout().catch(() => undefined);
  }
}

async function buildRawMessage(input: SendMailViaAccountInput & { from: string; fromName?: string | null }) {
  const MailComposer = require('nodemailer/lib/mail-composer');
  const composer = new MailComposer({
    from: input.fromName ? `${input.fromName} <${input.from}>` : input.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo || undefined,
  });
  const message = await composer.compile().build();
  return Buffer.from(message).toString('base64url');
}

export async function sendViaConnectedAccount(userId: string | null, input: SendMailViaAccountInput): Promise<boolean> {
  if (!userId) return false;
  const account = await getPrimaryAccount(userId);
  if (!account) return false;
  if (account.provider === 'gmail_oauth') {
    await consumeGmailSendQuota(userId);
    const gmail = await getGmailClient(account);
    const raw = await buildRawMessage({ ...input, from: account.email, fromName: account.display_name });
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    return true;
  }
  if (account.provider === 'imap_smtp' && account.smtp_host && account.smtp_port && account.enc_password) {
    const nodemailer = require('nodemailer') as typeof import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port,
      secure: Boolean(account.smtp_secure),
      auth: account.smtp_username ? { user: account.smtp_username, pass: decrypt(account.enc_password) } : undefined,
    });
    await transporter.sendMail({
      from: account.display_name ? `${account.display_name} <${account.email}>` : account.email,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo || undefined,
    });
    return true;
  }
  return false;
}

export async function sendUserMail(userId: string, input: SendMailViaAccountInput): Promise<void> {
  const sent = await sendViaConnectedAccount(userId, input);
  if (!sent) throw new Error('mail_account_not_connected');
}

export async function saveImapSmtpAccount(userId: string, input: {
  email: string;
  displayName?: string | null;
  imapHost?: string | null;
  imapPort?: number | null;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean | null;
  smtpUsername?: string | null;
  password: string;
}) {
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    `INSERT INTO user_mail_accounts
      (id, tenant_key, owner_user_id, provider, email, display_name, imap_host, imap_port,
       smtp_host, smtp_port, smtp_secure, smtp_username, enc_password, status)
     VALUES (UUID(), ?, ?, 'imap_smtp', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'connected')
     ON DUPLICATE KEY UPDATE
       display_name = VALUES(display_name),
       imap_host = VALUES(imap_host),
       imap_port = VALUES(imap_port),
       smtp_host = VALUES(smtp_host),
       smtp_port = VALUES(smtp_port),
       smtp_secure = VALUES(smtp_secure),
       smtp_username = VALUES(smtp_username),
       enc_password = VALUES(enc_password),
       status = 'connected',
       updated_at = CURRENT_TIMESTAMP(3)`,
    [
      tenantKey,
      userId,
      input.email,
      input.displayName ?? null,
      input.imapHost ?? null,
      input.imapPort ?? null,
      input.smtpHost,
      input.smtpPort,
      input.smtpSecure == null ? null : Number(input.smtpSecure),
      input.smtpUsername ?? null,
      encrypt(input.password),
    ],
  );
  return listMailAccounts(userId);
}
