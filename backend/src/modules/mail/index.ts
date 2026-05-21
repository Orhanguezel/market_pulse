import { createRequire } from 'node:module';
import { env } from '@/core/env';
import { getSmtpSettings } from '../siteSettings/service';

const require = createRequire(import.meta.url);

export async function sendMailRaw(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const settings = await getSmtpSettings().catch(() => null);
  const host = settings?.host || env.SMTP_HOST;
  if (!host) throw new Error('smtp_not_configured');

  const port = settings?.port || env.SMTP_PORT;
  const fromEmail = settings?.fromEmail || env.SMTP_FROM;
  const fromName = settings?.fromName;
  const user = settings?.username || env.SMTP_USER;
  const pass = settings?.password || env.SMTP_PASSWORD;
  const nodemailer = require('nodemailer') as typeof import('nodemailer');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: settings?.secure || port === 465,
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
