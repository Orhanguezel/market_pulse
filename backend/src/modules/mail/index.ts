import { createRequire } from 'node:module';
import { env } from '@/core/env';
import { pool } from '@/db/client';
import { getActiveUserId } from '@/modules/_shared';
import { sendViaConnectedAccount } from '@/modules/mail-accounts';
import { getSmtpSettings } from '../siteSettings/service';

const require = createRequire(import.meta.url);

export async function sendMailRaw(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | null;
  useUserSender?: boolean;
}): Promise<void> {
  if (input.useUserSender !== false && await sendViaConnectedAccount(getActiveUserId() ?? null, input)) return;

  const userSender = input.useUserSender === false ? null : await getActiveUserSenderSettings();
  const settings = await getSmtpSettings().catch(() => null);
  const host = userSender?.host || settings?.host || env.SMTP_HOST;
  if (!host) throw new Error('smtp_not_configured');

  const port = userSender?.port || settings?.port || env.SMTP_PORT;
  const fromEmail = userSender?.fromEmail || settings?.fromEmail || env.SMTP_FROM;
  const fromName = userSender?.fromName || settings?.fromName;
  const user = userSender?.username || settings?.username || env.SMTP_USER;
  const pass = userSender?.password || settings?.password || env.SMTP_PASSWORD;
  const nodemailer = require('nodemailer') as typeof import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: userSender?.secure ?? settings?.secure ?? port === 465,
    auth: user ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo || undefined,
  });
}

async function getActiveUserSenderSettings() {
  const userId = getActiveUserId();
  if (!userId) return null;
  const [rows] = await pool.execute(
    `SELECT sender_enabled, sender_name, sender_email, sender_smtp_host, sender_smtp_port,
            sender_smtp_username, sender_smtp_password, sender_smtp_secure
     FROM profiles
     WHERE id = ? LIMIT 1`,
    [userId],
  );
  const row = (rows as Array<{
    sender_enabled: number | boolean | null;
    sender_name: string | null;
    sender_email: string | null;
    sender_smtp_host: string | null;
    sender_smtp_port: number | null;
    sender_smtp_username: string | null;
    sender_smtp_password: string | null;
    sender_smtp_secure: number | boolean | null;
  }>)[0];
  if (!row || !row.sender_enabled || !row.sender_email) return null;
  return {
    fromName: row.sender_name || undefined,
    fromEmail: row.sender_email,
    host: row.sender_smtp_host || undefined,
    port: row.sender_smtp_port || undefined,
    username: row.sender_smtp_username || undefined,
    password: row.sender_smtp_password || undefined,
    secure: row.sender_smtp_secure === null ? undefined : Boolean(row.sender_smtp_secure),
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch
  ));
}

/**
 * Yeni bir uye kaydoldugunda admin'e hatirlatma maili. Amac: admin bu kisiyi
 * Google Cloud Console -> Audience -> Test users listesine ekleyip Gmail baglamasini
 * saglasin. Once admin'in BAGLI Gmail hesabindan gonderilir (sistem SMTP gerekmez),
 * yoksa sistem SMTP'ye duser. Best-effort — signup akisini asla bozmaz.
 */
export async function sendNewMemberAdminAlert(input: {
  to: string;
  viaUserId?: string | null;
  member_email: string;
  member_name?: string | null;
  member_phone?: string | null;
  role?: string | null;
  tenant?: string | null;
  source?: string | null;
}): Promise<void> {
  const to = (input.to || '').split(',').map((s) => s.trim()).filter(Boolean)[0];
  if (!to) return;
  const name = input.member_name || input.member_email.split('@')[0];
  const rowsData: Array<[string, string]> = [
    ['E-posta', input.member_email],
    ['Ad', name],
  ];
  if (input.member_phone) rowsData.push(['Telefon', input.member_phone]);
  if (input.role) rowsData.push(['Rol', input.role]);
  if (input.source) rowsData.push(['Kayıt kaynağı', input.source]);
  if (input.tenant) rowsData.push(['Tenant', input.tenant]);

  const rowsHtml = rowsData
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#64748b">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600;color:#0f172a">${escapeHtml(v)}</td></tr>`)
    .join('');
  const subject = `Yeni üye: ${input.member_email} — Google test user olarak ekle`;
  const html = `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:560px">
    <h2 style="color:#1e40af;margin:0 0 8px">Yeni üye kaydı</h2>
    <p style="color:#334155;margin:0 0 16px;line-height:1.5">Aşağıdaki kullanıcı sisteme kaydoldu. Gmail hesabını bağlayabilmesi için
      <b>Google Cloud Console → Audience → Test users</b> listesine
      <b>${escapeHtml(input.member_email)}</b> adresini eklemeyi unutma.</p>
    <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">${rowsHtml}</table>
    <a href="https://console.cloud.google.com/auth/audience?project=assistan-501512"
       style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:9px 16px;border-radius:6px;font-weight:600;font-size:13px">
      Test users ekranını aç
    </a>
  </div>`;
  const text = `Yeni üye kaydı\n\n${rowsData.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n`
    + `Gmail bağlayabilmesi için Google Console > Audience > Test users listesine ${input.member_email} ekle:\n`
    + 'https://console.cloud.google.com/auth/audience?project=assistan-501512';

  // 1) admin'in bagli Gmail hesabi varsa oradan gonder (SMTP gerekmez)
  if (input.viaUserId && await sendViaConnectedAccount(input.viaUserId, { to, subject, html, text })) return;
  // 2) yoksa sistem SMTP
  await sendMailRaw({ to, subject, html, text, useUserSender: false });
}

export async function sendWelcomeMail(_input: {
  to: string;
  user_name: string;
  user_email: string;
}): Promise<void> {
  // no-op until SMTP settings are configured.
}

export async function sendPasswordChangedMail(_input: {
  to: string;
  user_name?: string;
}): Promise<void> {
  // no-op until SMTP settings are configured.
}
