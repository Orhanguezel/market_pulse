// src/shared/validation.ts

/** Basit e-posta format kontrolü */
export function isValidEmail(v: string): boolean {
  const s = (v || '').trim().toLowerCase();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/** YYYY-MM-DD format kontrolü */
export function isValidYmd(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/** HH:mm format kontrolü */
export function isValidHm(v: string): boolean {
  return /^\d{2}:\d{2}$/.test(v);
}

/** Rating değerini 1–5 arasına sıkıştır */
export function clampRating(n: number): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 5;
  return Math.max(1, Math.min(5, x));
}
