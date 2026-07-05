// =============================================================
// FILE: src/modules/profiles/repository.ts
// =============================================================
import { db } from '../../db/client';
import { eq } from 'drizzle-orm';
import { buildProfileUpdatePatch, buildProfileUpsertInsert } from './helpers';
import { profiles, type ProfileInsert } from './schema';

const SAFE_PROFILE_COLUMNS = {
  id: profiles.id,
  full_name: profiles.full_name,
  phone: profiles.phone,
  avatar_url: profiles.avatar_url,
  address_line1: profiles.address_line1,
  address_line2: profiles.address_line2,
  city: profiles.city,
  country: profiles.country,
  postal_code: profiles.postal_code,
  sender_enabled: profiles.sender_enabled,
  sender_name: profiles.sender_name,
  sender_email: profiles.sender_email,
  sender_smtp_host: profiles.sender_smtp_host,
  sender_smtp_port: profiles.sender_smtp_port,
  sender_smtp_username: profiles.sender_smtp_username,
  sender_smtp_secure: profiles.sender_smtp_secure,
  sender_smtp_configured: profiles.sender_smtp_password,
  created_at: profiles.created_at,
  updated_at: profiles.updated_at,
};

type SafeProfileRow = {
  sender_smtp_configured: string | null;
} & Record<string, unknown>;

function safeProfile(row: SafeProfileRow | undefined) {
  if (!row) return null;
  return {
    ...row,
    sender_smtp_configured: Boolean(row.sender_smtp_configured),
  };
}

export async function repoGetProfileById(userId: string) {
  const [row] = await db.select(SAFE_PROFILE_COLUMNS).from(profiles).where(eq(profiles.id, userId)).limit(1);
  return safeProfile(row);
}

export async function repoUpsertProfile(userId: string, data: Partial<ProfileInsert>) {
  const existing = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

  if (existing.length > 0) {
    await db
      .update(profiles)
      .set(buildProfileUpdatePatch(data))
      .where(eq(profiles.id, userId));
  } else {
    await db.insert(profiles).values(buildProfileUpsertInsert(userId, data));
  }

  return repoGetProfileById(userId);
}
