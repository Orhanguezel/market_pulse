// src/modules/profiles/helpers/repository.ts
import type { ProfileInsert } from "../schema";

export function buildProfileUpsertInsert(userId: string, data: Partial<ProfileInsert>): ProfileInsert {
  return { id: userId, ...data };
}

export function buildProfileUpdatePatch(data: Partial<ProfileInsert>): Partial<ProfileInsert> {
  return { ...data, updated_at: new Date() };
}
