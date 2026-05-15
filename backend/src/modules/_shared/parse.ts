// src/modules/_shared/parse.ts
// Generic value parsers

export const safeTrim = (v: unknown) => (typeof v === 'string' ? v.trim() : String(v ?? '').trim());

/**
 * Boolean-like → boolean
 * true, 1, "1", "true" → true
 */
export function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true';
}

/**
 * QueryString boolean parser (undefined korumalı)
 */
export function toBoolOrUndefined(v: unknown): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'boolean') return v;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return undefined;
}

/**
 * Boş string, null, undefined → null; diğer → string
 */
export function nullIfEmpty(v: unknown): string | null {
  if (v === '' || v === null || v === undefined) return null;
  return String(v);
}

/**
 * Güvenli integer parse
 */
export function toInt(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export function toFiniteNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Boolean-like → boolean with default
 */
export function toBoolDefault(v: unknown, fallback = false): boolean {
  if (v === undefined || v === null || v === '') return fallback;
  return toBool(v);
}

/**
 * Safe number parse (null/undefined → null, string → number)
 */
export function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * MySQL duplicate entry hatası kontrolü
 */
export function isDuplicateError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const record = err as Record<string, unknown>;
  const code = record.code ?? record.errno;
  return code === 'ER_DUP_ENTRY' || code === 1062;
}

/**
 * Locale string normalizer (pure — no DB/env dependency)
 * "TR" → "tr", "en-US" → "en", "de_DE" → "de"
 */
export function normalizeLocaleStr(input?: string | null): string | null {
  if (!input) return null;
  const s = String(input).trim().toLowerCase().replace('_', '-');
  if (!s) return null;
  const base = s.split('-')[0]?.trim();
  return base || null;
}
