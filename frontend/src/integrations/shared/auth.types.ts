// =============================================================
// FILE: src/integrations/shared/auth.types.ts
// — Auth module frontend types
// Backend: src/modules/auth/*
// =============================================================

import type { User as AuthUser, UserRoleName } from '@/integrations/shared';

/* ------------------------------------------------------------------
 * Request bodies
 * ------------------------------------------------------------------ */

export type LoginBody = {
  grant_type: 'password';
  email: string;
  password: string;
};

export type SignUpBody = {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  rules_accepted: true;
  options?: {
    emailRedirectTo?: string;
    data?: {
      full_name?: string;
      phone?: string;
      [k: string]: unknown;
    };
  };
};

export type UpdateUserBody = {
  email?: string;
  password?: string;
};

export type PasswordResetRequestBody = {
  email: string;
};

export type PasswordResetConfirmBody = {
  token: string;
  password: string;
};

/* ------------------------------------------------------------------
 * API Responses
 * ------------------------------------------------------------------ */

export type TokenResp = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: 'bearer';
  user: AuthUser;
};

export type UserResp = {
  user: AuthUser;
};

export type StatusResp = {
  authenticated: boolean;
  is_admin: boolean;
  user?: {
    id: string;
    email: string | null;
    role: UserRoleName;
    roles?: UserRoleName[];
  };
};

export type PasswordResetRequestResp = {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
};

export type PasswordResetConfirmResp = {
  success: boolean;
  message?: string;
  error?: string;
};

export type EmailVerificationResp = {
  success: boolean;
  message?: string;
  error?: string;
};

export type EmailVerificationConfirmBody = {
  token: string;
};
