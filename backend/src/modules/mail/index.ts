import { createRequire } from 'node:module';
import { env } from '@/core/env';
import { pool } from '@/db/client';
import { getActiveUserId } from '@/modules/_shared';
import { getSmtpSettings } from '../siteSettings/service';

const require = createRequire(import.meta.url);

export async function sendMailRaw(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  useUserSender?: boolean;
}): Promise<void> {
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
