// src/modules/siteSettings/helpers/constants.ts
// Shared constants for site settings service/domain.

export const STORAGE_KEYS = [
  'storage_driver',
  'storage_local_root',
  'storage_local_base_url',
  'cloudinary_cloud_name',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_folder',
  'cloudinary_unsigned_preset',
  'storage_cdn_public_base',
  'storage_public_api_base',
] as const;

export const GOOGLE_KEYS = ['google_client_id', 'google_client_secret'] as const;

export const TELEGRAM_KEYS = [
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',
  'telegram_bot_token',
  'telegram_default_chat_id',
  'telegram_autoreply_enabled',
  'telegram_autoreply_mode',
  'telegram_autoreply_template',
  'telegram_event_new_contact_enabled',
  'telegram_event_new_ticket_enabled',
  'telegram_event_ticket_replied_enabled',
  'telegram_event_new_newsletter_subscription_enabled',
  'telegram_template_new_contact',
  'telegram_template_new_ticket',
  'telegram_template_ticket_replied',
  'telegram_template_new_newsletter_subscription',
] as const;

export const SITE_MEDIA_KEYS = [
  'site_logo',
  'site_logo_dark',
  'site_logo_light',
  'site_favicon',
  'site_apple_touch_icon',
  'site_app_icon_512',
  'site_og_default_image',
] as const;

export type SiteMediaKey = (typeof SITE_MEDIA_KEYS)[number];
