export async function sendMailRaw(_input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  // SMTP is intentionally optional in the standalone MarketPulse backend.
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
