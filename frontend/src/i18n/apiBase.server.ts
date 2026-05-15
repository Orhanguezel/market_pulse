import 'server-only';

import { normalizePublicApiBase } from '@/lib/normalize-public-api-base';

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

/**
 * Server-side API base — her zaman `/api/v1` kökü (ekosistem standardı).
 */
export function getServerApiBase(): string {
  const raw =
    (process.env.API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_URL || '').trim();

  const base = trimSlash(raw);
  if (!base) return '';

  if (/^https?:\/\//i.test(base)) return normalizePublicApiBase(base);
  if (/\/api\/v\d+$/i.test(base)) return base;
  if (/\/api$/i.test(base)) return `${base}/v1`;
  return `${base}/api/v1`;
}
