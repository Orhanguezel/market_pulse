// src/modules/_shared/dto.ts
// Auth/User DTO helpers

import type { users } from '../auth';

type UserRow = typeof users.$inferSelect;
type UserDtoExtras = {
  profile_image?: string | null;
  profile_image_asset_id?: string | null;
  profile_image_alt?: string | null;
};

export const toBool01 = (v: unknown): boolean => (typeof v === 'boolean' ? v : Number(v) === 1);

/** Admin/FE DTO tek yerde */
export function pickUserDto(u: UserRow & UserDtoExtras, role: string) {
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name ?? null,
    phone: u.phone ?? null,
    email_verified: u.email_verified,
    is_active: u.is_active,
    created_at: u.created_at,
    last_login_at: u.last_sign_in_at,
    profile_image: u.profile_image ?? null,
    profile_image_asset_id: u.profile_image_asset_id ?? null,
    profile_image_alt: u.profile_image_alt ?? null,
    role,
  };
}
