/**
 * Ekosistem standardı: kamu REST kökü `/api/v1` (Fastify prefix ile uyumlu).
 * `.../api` ile biten env değerlerini otomatik `.../api/v1` yapar.
 */
export function normalizePublicApiBase(raw: string): string {
  const base = String(raw || '').replace(/\/+$/, '');
  if (!base) return '';
  if (/\/api\/v\d+$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}
