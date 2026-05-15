// =============================================================
// FILE: src/modules/storage/repository.ts
// =============================================================
import {
  and,
  eq,
  inArray,
  sql as dsql,
} from "drizzle-orm";

import { db } from "../../db/client";
import { storageAssets, type NewStorageAsset } from "./schema";
import type { StorageListQuery } from "./validation";
import {
  buildStorageOrderBy,
  buildStorageWhere,
  resolveStoragePagination,
} from './helpers';

export type StorageInsertInput =
  Partial<NewStorageAsset> &
  Pick<NewStorageAsset, "id" | "name" | "bucket" | "path" | "mime" | "size" | "provider">;

/** MySQL dup guard */
export function repoIsDup(err: unknown) {
  const e = typeof err === "object" && err !== null ? (err as Record<string, unknown>) : null;
  const cause = typeof e?.cause === "object" && e?.cause !== null ? (e.cause as Record<string, unknown>) : null;
  const codes = [e?.code, e?.errno, cause?.code, cause?.errno];
  return codes.includes("ER_DUP_ENTRY") || codes.includes(1062);
}

/** List + count */
export async function repoListAndCount(q: StorageListQuery) {
  const where = buildStorageWhere(q);
  const [{ total }] = await db
    .select({ total: dsql<number>`COUNT(*)` })
    .from(storageAssets)
    .where(where);

  const { limit, offset } = resolveStoragePagination(q);

  const rows = await db
    .select()
    .from(storageAssets)
    .where(where)
    .orderBy(buildStorageOrderBy(q))
    .limit(limit)
    .offset(offset);

  return { rows, total };
}

/** Tekil getir */
export async function repoGetById(id: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(eq(storageAssets.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Çoklu getir */
export async function repoGetByIds(ids: string[]) {
  if (!ids.length) return [];
  return db
    .select()
    .from(storageAssets)
    .where(inArray(storageAssets.id, ids));
}

/** bucket+path ile getir */
export async function repoGetByBucketPath(bucket: string, path: string) {
  const rows = await db
    .select()
    .from(storageAssets)
    .where(
      and(eq(storageAssets.bucket, bucket), eq(storageAssets.path, path)),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Insert */
export async function repoInsert(values: StorageInsertInput) {
  await db.insert(storageAssets).values(values);
}

/** Update by id (partial) */
export async function repoUpdateById(id: string, sets: Record<string, unknown>) {
  await db
    .update(storageAssets)
    .set(sets)
    .where(eq(storageAssets.id, id));
}

/** Delete by id */
export async function repoDeleteById(id: string) {
  await db.delete(storageAssets).where(eq(storageAssets.id, id));
}

/** Delete many by ids */
export async function repoDeleteManyByIds(ids: string[]) {
  if (!ids.length) return 0;
  await db
    .delete(storageAssets)
    .where(inArray(storageAssets.id, ids));
  return ids.length;
}

/** Klasor listesi (distinct) */
export async function repoListFolders(): Promise<string[]> {
  const rows = await db
    .select({ folder: storageAssets.folder })
    .from(storageAssets)
    .where(dsql`${storageAssets.folder} IS NOT NULL`)
    .groupBy(storageAssets.folder);

  return rows
    .map((r) => r.folder as string)
    .filter(Boolean);
}
