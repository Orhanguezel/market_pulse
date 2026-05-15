// src/integrations/shared/adminUsers.normalize.ts
import type { AdminUserRaw, AdminUserView, UserRoleName } from './users';

const asRole = (v: unknown): UserRoleName | null => {
  const s = String(v ?? '').toLowerCase();
  return s === 'admin' || s === 'consultant' || s === 'user' ? (s as UserRoleName) : null;
};

const toBool = (v: unknown): boolean => (typeof v === 'boolean' ? v : Number(v ?? 0) === 1);

const coerceRoles = (raw: AdminUserRaw): UserRoleName[] => {
  if ((raw as any).role != null) {
    const r = asRole((raw as any).role);
    return r ? [r] : [];
  }

  const src = (raw as any).roles;

  if (Array.isArray(src)) return src.map(asRole).filter(Boolean) as UserRoleName[];

  if (typeof src === 'string' && src.trim()) {
    try {
      const parsed = JSON.parse(src);
      if (Array.isArray(parsed)) return parsed.map(asRole).filter(Boolean) as UserRoleName[];
      const single = asRole(parsed);
      return single ? [single] : [];
    } catch {
      const single = asRole(src);
      return single ? [single] : [];
    }
  }

  return [];
};

const pickLastSignIn = (u: AdminUserRaw): string | null => {
  const a = (u as any).last_sign_in_at;
  const b = (u as any).last_login_at;
  return (a ?? b ?? null) as any;
};

export const normalizeAdminUser = (u: AdminUserRaw): AdminUserView => ({
  id: String((u as any).id),
  email: (u as any).email ?? null,

  full_name: (u as any).full_name ?? null,
  phone: (u as any).phone ?? null,

  is_active: toBool((u as any).is_active),
  email_verified: toBool((u as any).email_verified),

  created_at: (u as any).created_at ?? null,
  last_sign_in_at: pickLastSignIn(u),

  roles: coerceRoles(u),
});
