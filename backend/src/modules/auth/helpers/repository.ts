// src/modules/auth/helpers/repository.ts
// Helpers for auth repository token hashing and admin list query shaping.

import { createHash, randomUUID } from 'crypto';
import { and, asc, desc, eq, like } from 'drizzle-orm';
import { users } from '../schema';
import type { SQL } from 'drizzle-orm';

export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createRefreshTokenRaw() {
  const jti = randomUUID();
  return { jti, raw: `${jti}.${randomUUID()}` };
}

export function parseRefreshTokenJti(tokenRaw: string) {
  return tokenRaw.split('.', 1)[0] ?? '';
}

export function buildRefreshExpiryDate() {
  return new Date(Date.now() + REFRESH_MAX_AGE * 1000);
}

export function buildAdminUsersWhere(params: {
  q?: string;
  is_active?: boolean;
}) {
  const conditions: SQL<unknown>[] = [];

  if (params.q) conditions.push(like(users.email, `%${params.q}%`));
  if (typeof params.is_active === 'boolean') {
    conditions.push(eq(users.is_active, params.is_active ? 1 : 0));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export function resolveAdminUsersSort(sort?: string, order?: string) {
  const sortCol =
    sort === 'email' ? users.email : sort === 'last_login_at' ? users.last_sign_in_at : users.created_at;
  const orderFn = order === 'asc' ? asc : desc;
  return orderFn(sortCol);
}

export function buildAdminUserRoleRows<T extends { role: string }>(rows: T[], role?: string) {
  return role ? rows.filter((row) => row.role === role) : rows;
}
