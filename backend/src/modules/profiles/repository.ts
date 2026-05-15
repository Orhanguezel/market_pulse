// =============================================================
// FILE: src/modules/profiles/repository.ts
// =============================================================
import { db } from '../../db/client';
import { eq } from 'drizzle-orm';
import { buildProfileUpdatePatch, buildProfileUpsertInsert } from './helpers';
import { profiles, type ProfileInsert } from './schema';

export async function repoGetProfileById(userId: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return row ?? null;
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
