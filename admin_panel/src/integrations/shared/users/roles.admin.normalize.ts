// src/integrations/shared/roles.admin.normalize.ts
import type { ApiRole, Role } from './roles.admin';

const toIso = (x: unknown): string => new Date(x as any).toISOString();

const tryParse = <T>(x: unknown): T => {
  if (typeof x === 'string') {
    try {
      return JSON.parse(x) as T;
    } catch {
      return x as any as T;
    }
  }
  return x as T;
};

export const normalizeRole = (r: ApiRole): Role => ({
  ...r,
  permissions: Array.isArray(r.permissions)
    ? r.permissions.map(String)
    : tryParse<string[]>(r.permissions),
  created_at: toIso(r.created_at),
  updated_at: toIso(r.updated_at),
});
