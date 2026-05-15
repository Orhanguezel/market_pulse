// src/modules/auth/admin-controller.helpers.ts
// Helpers to keep auth admin controller thin.

import { formatAdminUserRow, toBool } from '../../_shared';
import { getPrimaryRole } from '../../userRoles';
import { repoGetUserByEmail, repoGetUserById } from '../repository';

export async function formatAdminUserById(userId: string) {
  const user = await repoGetUserById(userId);
  if (!user) return null;

  const role = await getPrimaryRole(user.id);
  return formatAdminUserRow(user, role);
}

export function buildAdminUserPatch(body: {
  full_name?: string;
  phone?: string;
  email?: string;
  is_active?: unknown;
}) {
  const patch: Record<string, unknown> = {};

  if (body.full_name) patch.full_name = body.full_name;
  if (body.phone) patch.phone = body.phone;
  if (body.email) patch.email = body.email;
  if (body.is_active != null) patch.is_active = toBool(body.is_active) ? 1 : 0;

  return patch;
}

export function resolveAdminPasswordChangedUserName(user: {
  full_name?: string | null;
  email?: string | null;
}) {
  return (user.full_name && user.full_name.length > 0 ? user.full_name : user.email?.split('@')[0]) || 'Kullanıcı';
}

export async function resolveAdminRoleTarget(input: { user_id?: string; email?: string }) {
  if (input.user_id) return repoGetUserById(input.user_id);
  if (input.email) return repoGetUserByEmail(input.email);
  return null;
}
