// src/integrations/shared/auth.public.ts
import type { UserRoleName } from './users';

export interface AuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  email_verified: number | boolean;
  is_active: number | boolean;
  role: UserRoleName;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  is_admin: boolean;
  user?: {
    id: string;
    email: string | null;
    role: UserRoleName;
  };
}

export interface AuthMeResponse {
  user: {
    id: string;
    email: string | null;
    role: UserRoleName;
  };
}

export type AuthMeNormalized = {
  id: string;
  email: string | null;
  role: UserRoleName;
  isAdmin: boolean;
  authenticated: boolean;
};

export interface PasswordResetRequestResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export interface PasswordResetConfirmResponse {
  success: boolean;
  message: string;
}

export interface AuthTokenRefreshResponse {
  access_token: string;
  token_type: string;
}

export interface AuthSignupBody {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  options?: {
    data?: Record<string, unknown>;
  };
}

export interface AuthTokenBody {
  email: string;
  password: string;
  grant_type?: 'password';
}

export interface AuthUpdateBody {
  email?: string;
  password?: string;
}

export interface PasswordResetRequestBody {
  email: string;
}

export interface PasswordResetConfirmBody {
  token: string;
  password: string;
}

const roleList: UserRoleName[] = ['admin', 'consultant', 'user'];

const coerceRole = (v: unknown): UserRoleName => {
  const s = String(v ?? '').trim().toLowerCase();
  return (roleList as string[]).includes(s) ? (s as UserRoleName) : 'user';
};

export function normalizeMeFromStatus(res?: AuthStatusResponse | null): AuthMeNormalized | null {
  if (!res || res.authenticated !== true) return null;
  const user = (res as any).user ?? {};
  const id = String(user.id ?? '').trim();
  if (!id) return null;
  const role = coerceRole(user.role);
  const isAdmin = (res as any).is_admin === true || role === 'admin';
  return {
    id,
    email: user.email ?? null,
    role,
    isAdmin,
    authenticated: true,
  };
}
