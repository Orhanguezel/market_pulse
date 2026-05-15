import { db } from '../../db/client';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { hash as argonHash } from 'argon2';
import { users, refresh_tokens } from './schema';
import { userRoles } from '../userRoles';
import { profiles } from '../profiles';
import { notifications, type NotificationInsert } from '../notifications';
import { getPrimaryRole, type RoleName } from '../userRoles';
import {
  buildAdminUserRoleRows,
  buildAdminUsersWhere,
  buildRefreshExpiryDate,
  createRefreshTokenRaw,
  parseRefreshTokenJti,
  REFRESH_MAX_AGE,
  resolveAdminUsersSort,
  sha256,
} from './helpers';

type UserRow = typeof users.$inferSelect;

/* -------------------- User CRUD -------------------- */

export async function repoGetUserByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function repoGetUserById(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function repoCreateUser(data: {
  id: string;
  email: string;
  password_hash: string;
  full_name?: string;
  phone?: string;
  rules_accepted_at?: Date;
  email_verified?: boolean;
}) {
  await db.insert(users).values({
    id: data.id,
    email: data.email,
    password_hash: data.password_hash,
    full_name: data.full_name,
    phone: data.phone,
    is_active: 1,
    email_verified: data.email_verified ? 1 : 0,
    rules_accepted_at: data.rules_accepted_at,
  });
}

export async function repoUpdateUserEmail(userId: string, email: string) {
  await db.update(users).set({ email, updated_at: new Date() }).where(eq(users.id, userId));
}

export async function repoUpdateUserPassword(userId: string, password: string) {
  const password_hash = await argonHash(password);
  await db.update(users).set({ password_hash, updated_at: new Date() }).where(eq(users.id, userId));
}

export async function repoUpdateLastSignIn(userId: string) {
  await db.update(users).set({ last_sign_in_at: new Date(), updated_at: new Date() }).where(eq(users.id, userId));
}

export async function repoSyncGoogleUser(
  userId: string,
  data: {
    full_name?: string | null;
    email_verified?: boolean;
  },
) {
  await db
    .update(users)
    .set({
      ...(data.full_name ? { full_name: data.full_name } : {}),
      ...(data.email_verified ? { email_verified: 1 } : {}),
      updated_at: new Date(),
    })
    .where(eq(users.id, userId));
}

/* -------------------- Roles -------------------- */

export async function repoAssignRole(userId: string, role: RoleName) {
  await db.insert(userRoles).values({ id: randomUUID(), user_id: userId, role });
}

/* -------------------- Profiles -------------------- */

export async function repoEnsureProfileRow(
  userId: string,
  defaults?: { full_name?: string | null; phone?: string | null; avatar_url?: string | null },
) {
  const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!existing) {
    await db.insert(profiles).values({
      id: userId,
      full_name: defaults?.full_name ?? null,
      phone: defaults?.phone ?? null,
      avatar_url: defaults?.avatar_url ?? null,
    });
  } else if (defaults && (defaults.full_name || defaults.phone || defaults.avatar_url)) {
    await db
      .update(profiles)
      .set({
        ...(defaults.full_name ? { full_name: defaults.full_name } : {}),
        ...(defaults.phone ? { phone: defaults.phone } : {}),
        ...(defaults.avatar_url ? { avatar_url: defaults.avatar_url } : {}),
        updated_at: new Date(),
      })
      .where(eq(profiles.id, userId));
  }
}

/* -------------------- Refresh Tokens -------------------- */

export async function repoCreateRefreshToken(userId: string, tokenRaw: string) {
  const jti = parseRefreshTokenJti(tokenRaw);
  await db.insert(refresh_tokens).values({
    id: jti,
    user_id: userId,
    token_hash: sha256(tokenRaw),
    expires_at: buildRefreshExpiryDate(),
  });
}

export async function repoGetRefreshToken(jti: string) {
  const [row] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.id, jti)).limit(1);
  return row ?? null;
}

export async function repoRevokeRefreshToken(jti: string) {
  await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.id, jti));
}

export async function repoRevokeAllUserRefreshTokens(userId: string) {
  await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.user_id, userId));
}

export async function repoRotateRefreshToken(oldRaw: string, userId: string): Promise<string> {
  const oldJti = parseRefreshTokenJti(oldRaw);
  await db.update(refresh_tokens).set({ revoked_at: new Date() }).where(eq(refresh_tokens.id, oldJti));

  const { jti: newJti, raw: newRaw } = createRefreshTokenRaw();
  await db.insert(refresh_tokens).values({
    id: newJti,
    user_id: userId,
    token_hash: sha256(newRaw),
    expires_at: buildRefreshExpiryDate(),
  });
  await db.update(refresh_tokens).set({ replaced_by: newJti }).where(eq(refresh_tokens.id, oldJti));
  return newRaw;
}

/* -------------------- Notifications -------------------- */

export async function repoCreatePasswordChangedNotification(userId: string, message?: string) {
  const notif: NotificationInsert = {
    id: randomUUID(),
    user_id: userId,
    title: 'Şifreniz güncellendi',
    message: message ?? 'Hesap şifreniz başarıyla değiştirildi. Bu işlemi siz yapmadıysanız lütfen en kısa sürede bizimle iletişime geçin.',
    type: 'password_changed',
    is_read: false,
    created_at: new Date(),
  };
  await db.insert(notifications).values(notif);
}

/* -------------------- Admin: User Management -------------------- */

export async function repoAdminListUsers(params: {
  q?: string;
  is_active?: boolean;
  role?: string;
  sort?: string;
  order?: string;
  limit: number;
  offset: number;
}) {
  const where = buildAdminUsersWhere(params);
  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(resolveAdminUsersSort(params.sort, params.order))
    .limit(params.limit)
    .offset(params.offset);

  const withRole = await Promise.all(rows.map(async (u) => ({ ...u, role: await getPrimaryRole(u.id) })));
  return buildAdminUserRoleRows(withRole, params.role);
}

export async function repoAdminUpdateUser(id: string, patch: Partial<UserRow>) {
  await db.update(users).set({ ...patch, updated_at: new Date() }).where(eq(users.id, id));
  return repoGetUserById(id);
}

export async function repoAdminSetActive(id: string, active: boolean) {
  await db
    .update(users)
    .set({
      is_active: active ? 1 : 0,
      ...(active ? { email_verified: 1 } : {}),
      updated_at: new Date(),
    })
    .where(eq(users.id, id));
}

export async function repoAdminSetRoles(id: string, roles: RoleName[]) {
  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.user_id, id));
    if (roles.length > 0) {
      await tx.insert(userRoles).values(roles.map((r) => ({ id: randomUUID(), user_id: id, role: r })));
    }
  });
}

export async function repoAdminSetPassword(id: string, password: string) {
  const password_hash = await argonHash(password);
  await db
    .update(users)
    .set({ password_hash, is_active: 1, email_verified: 1, updated_at: new Date() })
    .where(eq(users.id, id));
}

export async function repoAdminDeleteUser(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(refresh_tokens).where(eq(refresh_tokens.user_id, id));
    await tx.delete(userRoles).where(eq(userRoles.user_id, id));
    await tx.delete(profiles).where(eq(profiles.id, id));
    await tx.delete(users).where(eq(users.id, id));
  });
}
