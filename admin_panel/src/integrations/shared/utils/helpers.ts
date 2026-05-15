// =============================================================
// FILE: src/integrations/shared/utils/helpers.ts
// Unified helper functions - Single source of truth
// =============================================================

export type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | null | undefined | unknown;

// -------------------- Type Guards --------------------

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

export function assertIsObject(v: unknown, name = 'data'): asserts v is Record<string, unknown> {
  if (!isObject(v)) {
    throw new Error(`Invalid ${name}: expected object, got ${typeof v}`);
  }
}

export function assertIsArray(v: unknown, name = 'data'): asserts v is unknown[] {
  if (!Array.isArray(v)) {
    throw new Error(`Invalid ${name}: expected array, got ${typeof v}`);
  }
}

// -------------------- String Helpers --------------------

export function toStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return v == null ? '' : String(v);
}

export function trimStr(v: unknown): string {
  return toStr(v).trim();
}

export function toNullStr(v: unknown): string | null {
  const s = trimStr(v);
  return s ? s : null;
}

export function trimOrUndef(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

export const text = (v: unknown): string =>
  typeof v === 'string' ? v : v == null ? '' : String(v);

export const nonEmpty = (v: unknown): string => {
  const s = text(v).trim();
  return s ? s : '';
};

// -------------------- Number Helpers --------------------

export function toNumber(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function toInt(v: unknown): number {
  const n = toNumber(v);
  return Number.isFinite(n) ? Math.trunc(n) : n;
}

export type NullableNumber = number | null | undefined;
export function numOrNullish(v: unknown): NullableNumber {
  return v == null ? (v as null | undefined) : toNumber(v);
}

export const clamp = (n: number, min = 1, max = 200): number =>
  Math.max(min, Math.min(max, n));

// -------------------- Boolean Helpers --------------------

/**
 * Unified boolean converter - handles backend 0/1 and BoolLike
 * @param v - Value to convert (boolean | 0 | 1 | '0' | '1' | 'true' | 'false' etc.)
 * @param fallback - Default if conversion fails
 */
export function toBool(v: BoolLike, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (v == null) return fallback;

  const s = toStr(v).trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;

  return fallback;
}

/**
 * Backend-specific: Converts 0/1 to boolean
 */
export function toBool01(v: unknown): boolean {
  if (v === true) return true;
  if (v === false) return false;
  const n = Number(v ?? 0);
  return n === 1;
}

/**
 * Converts boolean to 0/1 for backend
 */
export function boolTo01(v: unknown): 0 | 1 | undefined {
  const b = toBool(v);
  return b === undefined ? undefined : (b ? 1 : 0);
}

// -------------------- Date/ISO Helpers --------------------

export function toIso(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (v instanceof Date) return v.toISOString();

  // Try date conversion
  if (typeof v === 'number' || typeof v === 'string') {
    const d = new Date(v as string | number);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  return String(v ?? '');
}

export function toNullIso(v: unknown): string | null {
  const s = toIso(v);
  return s ? s : null;
}

// -------------------- JSON Parsing Helpers --------------------

export function isJsonishString(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  const t = v.trim();
  return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
}

export function tryParseJson<T = unknown>(val: unknown): T | null {
  if (val == null) return null;
  if (typeof val === 'object') return val as T;

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s || !isJsonishString(s)) return null;

    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  return null;
}

export function parseJsonArray<T = unknown>(val: unknown): T[] {
  const arr = tryParseJson<T[]>(val);
  return Array.isArray(arr) ? arr : [];
}

export function parseJsonObject(val: unknown): Record<string, unknown> {
  const obj = tryParseJson<Record<string, unknown>>(val);
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
}

export const safeJsonLd = (raw: string): object | null => {
  const s = (raw || '').trim();
  if (!s) return null;
  try {
    return JSON.parse(s) as object;
  } catch {
    return null;
  }
};

// -------------------- Array Helpers --------------------

export function ensureArray<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

// -------------------- Object Helpers --------------------

export const pickFirst = (src: Record<string, unknown>, keys: readonly string[]): unknown => {
  for (const k of keys) {
    const v = src[k];
    if (v != null) return v;
  }
  return undefined;
};

export const pickStr = (
  src: Record<string, unknown>,
  keys: readonly string[],
  fallback = '',
): string => {
  const v = pickFirst(src, keys);
  const s = trimStr(v);
  return s ? s : fallback;
};

export const pickOptStr = (
  src: Record<string, unknown>,
  keys: readonly string[],
): string | null => {
  const v = pickFirst(src, keys);
  const s = trimStr(v);
  return s ? s : null;
};

// -------------------- Cleanup Utilities --------------------

/**
 * Remove undefined/null values from query params
 */
export function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Generic unwrap utility for API responses that may be wrapped in { data: ... }
 */
export function unwrap<T>(raw: unknown): T {
  if (!isObject(raw)) return raw as T;

  // If response has a 'data' property, unwrap it
  if ('data' in raw) {
    return raw.data as T;
  }

  return raw as T;
}
