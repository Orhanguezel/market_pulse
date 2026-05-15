// src/integrations/shared/profiles.normalize.ts
import type { Profile } from './profiles';

export const normalizeProfile = (x: any): Profile => ({
  id: String(x?.id ?? ''),

  full_name: x?.full_name ?? null,
  phone: x?.phone ?? null,
  avatar_url: x?.avatar_url ?? null,

  address_line1: x?.address_line1 ?? null,
  address_line2: x?.address_line2 ?? null,
  city: x?.city ?? null,
  country: x?.country ?? null,
  postal_code: x?.postal_code ?? null,

  website_url: x?.website_url ?? null,
  instagram_url: x?.instagram_url ?? null,
  facebook_url: x?.facebook_url ?? null,
  x_url: x?.x_url ?? null,
  linkedin_url: x?.linkedin_url ?? null,
  youtube_url: x?.youtube_url ?? null,
  tiktok_url: x?.tiktok_url ?? null,

  created_at: String(x?.created_at ?? new Date().toISOString()),
  updated_at: String(x?.updated_at ?? new Date().toISOString()),
});
