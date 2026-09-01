import { randomUUID } from 'node:crypto';

export function newId() {
  return randomUUID();
}

export function parseJsonField<T extends Record<string, unknown>>(row: T, key: keyof T): T {
  const value = row[key];
  if (typeof value !== 'string') return row;
  try {
    return { ...row, [key]: JSON.parse(value) };
  } catch {
    return row;
  }
}

export function jsonOrNull(value: unknown) {
  return value === undefined ? null : JSON.stringify(value);
}

export function definedEntries<T extends Record<string, unknown>>(patch: T) {
  return Object.entries(patch).filter(([, value]) => value !== undefined);
}

// Sahiplik alanlari UPDATE ile ASLA degistirilemez — kullanici kendi kaydini baska
// bir kullaniciya atayamaz/created_by'i ezemez. Tum CRM update'leri buradan gectigi
// icin merkezi bir savunma.
const IMMUTABLE_PATCH_FIELDS = new Set(['owner_user_id', 'created_by', 'tenant_key', 'id']);

export function buildPatchSql(patch: Record<string, unknown>) {
  const entries = definedEntries(patch).filter(([key]) => !IMMUTABLE_PATCH_FIELDS.has(key));
  return {
    entries,
    sets: entries.map(([key]) => `${key} = ?`),
    values: entries.map(([, value]) => value),
  };
}
