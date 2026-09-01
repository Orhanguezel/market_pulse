// src/integrations/shared/profiles.ts


export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  country: string | null;
  postal_code: string | null;
  sender_enabled: number | boolean | null;
  sender_name: string | null;
  sender_email: string | null;
  sender_smtp_host: string | null;
  sender_smtp_port: number | null;
  sender_smtp_username: string | null;
  sender_smtp_secure: number | boolean | null;
  sender_smtp_configured: boolean;
  push_notifications: number | boolean | null;
  email_notifications: number | boolean | null;
  sms_notifications: number | boolean | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
};

export type ProfileUpsertInput = Partial<
  Pick<
    Profile,
    | 'full_name'
    | 'phone'
    | 'avatar_url'
    | 'address_line1'
    | 'address_line2'
    | 'city'
    | 'country'
    | 'postal_code'
    | 'sender_enabled'
    | 'sender_name'
    | 'sender_email'
    | 'sender_smtp_host'
    | 'sender_smtp_port'
    | 'sender_smtp_username'
    | 'sender_smtp_secure'
    | 'push_notifications'
    | 'email_notifications'
    | 'sms_notifications'
  >
> & { sender_smtp_password?: string | null };

export type ProfileUpsertRequest = {
  profile: ProfileUpsertInput;
};
