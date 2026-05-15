// src/integrations/shared/users.ts

import type { BoolLike } from '@/integrations/shared';

export type UserRoleName = 'admin' | 'consultant' | 'user';

export type ProfileRow = {
  id: string;

  full_name: string | null;
  phone?: string | null;
  avatar_url?: string | null;

  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  country?: string | null;
  postal_code?: string | null;

  // social (optional)
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  x_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;

  created_at: string;
  updated_at?: string | null;
};

export type AdminUserRaw = {
  id: string;
  email: string | null;

  full_name?: string | null;
  phone?: string | null;

  is_active?: BoolLike;
  email_verified?: BoolLike;

  created_at?: string | null;

  last_sign_in_at?: string | null;
  last_login_at?: string | null;

  role?: UserRoleName | string | null;
  roles?: Array<UserRoleName | string> | string | null;
};

export type AdminUserView = {
  id: string;
  email: string | null;

  full_name: string | null;
  phone: string | null;

  is_active: boolean;
  email_verified: boolean;

  created_at: string | null;
  last_sign_in_at: string | null;

  roles: UserRoleName[];
};

export type AdminUsersListParams = {
  q?: string;
  role?: UserRoleName;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'email' | 'last_sign_in_at';
  order?: 'asc' | 'desc';
};

export type AdminUpdateUserBody = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
};

export type AdminSetActiveBody = { id: string; is_active: boolean };
export type AdminSetRolesBody = { id: string; roles: UserRoleName[] };
export type AdminSetPasswordBody = { id: string; password: string };
export type AdminRemoveUserBody = { id: string };
