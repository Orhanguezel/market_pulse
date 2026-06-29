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

export function buildPatchSql(patch: Record<string, unknown>) {
  const entries = definedEntries(patch);
  return {
    entries,
    sets: entries.map(([key]) => `${key} = ?`),
    values: entries.map(([, value]) => value),
  };
}
