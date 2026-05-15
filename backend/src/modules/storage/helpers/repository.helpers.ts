// src/modules/storage/helpers/repository.helpers.ts
// Shared repository helpers for storage queries

import {
  and,
  asc,
  desc,
  eq,
  like,
  sql as dsql,
} from 'drizzle-orm';
import { storageAssets } from '../schema';
import type { StorageListQuery } from '../validation';

const STORAGE_ORDER = {
  created_at: storageAssets.created_at,
  name: storageAssets.name,
  size: storageAssets.size,
} as const;

export function buildStorageWhere(query: StorageListQuery) {
  return and(
    query.bucket ? eq(storageAssets.bucket, query.bucket) : dsql`1=1`,
    query.folder != null ? eq(storageAssets.folder, query.folder) : dsql`1=1`,
    query.mime ? like(storageAssets.mime, `${query.mime}%`) : dsql`1=1`,
    query.q ? like(storageAssets.name, `%${query.q}%`) : dsql`1=1`,
  );
}

export function buildStorageOrderBy(query: StorageListQuery) {
  const sort = query.sort ?? 'created_at';
  const order = query.order ?? 'desc';
  const column = STORAGE_ORDER[sort] ?? storageAssets.created_at;
  return order === 'asc' ? asc(column) : desc(column);
}

export function resolveStoragePagination(query: StorageListQuery) {
  const limit = typeof query.limit === 'number' && query.limit > 0 ? query.limit : 50;
  const offset = typeof query.offset === 'number' && query.offset >= 0 ? query.offset : 0;
  return { limit, offset };
}
