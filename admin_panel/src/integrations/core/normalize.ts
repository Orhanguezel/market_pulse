// =============================================================
// FILE: src/integrations/metahub/core/normalize.ts
// Ortak normalize yardımcıları (no-any, tip güvenli)
// =============================================================

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Sayı zorlaması (NaN ise NaN döner; UI'da kontrol edersin) */
export function toNumber(x: unknown): number {
  return typeof x === "number" ? x : Number(x as unknown);
}

/** Tamsayı (base 10) */
export function toInt(x: unknown): number {
  const n = toNumber(x);
  return Number.isFinite(n) ? Math.trunc(n) : n;
}

/** `null | undefined` koruyarak sayı */
export type NullableNumber = number | null | undefined;
export function numOrNullish(x: unknown): NullableNumber {
  return x == null ? (x as null | undefined) : toNumber(x);
}

/** ISO string üret (geçersiz tarihse string'e dokunma) */
export function toIso(x: unknown): string {
  if (x instanceof Date) return x.toISOString();
  if (typeof x === "number" || typeof x === "string") {
    const d = new Date(x as string | number);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return String(x ?? "");
}

/** JSON-string ise parse; değilse olduğu gibi döndür */
export function tryParse<T>(x: unknown): T {
  if (typeof x === "string") {
    try { return JSON.parse(x) as T; } catch { /* fallthrough */ }
  }
  return x as T;
}

/** 0/1/true/false/"yes"/"no" → boolean | undefined */
export function toBool(x: unknown): boolean | undefined {
  if (typeof x === "boolean") return x;
  if (typeof x === "number") return x !== 0;
  if (typeof x === "string") {
    const s = x.trim().toLowerCase();
    if (["1","true","yes","on"].includes(s)) return true;
    if (["0","false","no","off"].includes(s)) return false;
  }
  return undefined;
}

/** boolean benzeri → 0/1 (anlaşılamazsa undefined) */
export function boolTo01(v: unknown): 0 | 1 | undefined {
  const b = toBool(v);
  return b === undefined ? undefined : (b ? 1 : 0);
}

/** Tek öğe/array → her durumda array */
export function ensureArray<T>(x: T | T[] | null | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

/** Güvenli trim; boş ise undefined */
export function trimOrUndef(x: unknown): string | undefined {
  if (typeof x !== "string") return undefined;
  const s = x.trim();
  return s.length ? s : undefined;
}
