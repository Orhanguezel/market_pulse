// =============================================================
// FILE: src/integrations/rtk/constants.ts
// Next.js için API URL sabitleri
// =============================================================

function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

/**
 * Önerilen .env.local (SSR / server fetch için tam URL):
 *  NEXT_PUBLIC_API_URL=http://127.0.0.1:8086/api/v1
 *
 * RTK Query (tarayıcı, development): baseApi her zaman `/api/v1` kullanır — Next rewrite.
 */
const rawBase = (process.env.NEXT_PUBLIC_API_URL as string | undefined) || '';

/** Prod: aynı origin /api/v1. Dev: boş — baseApi `resolveRtkBaseUrl()` (client: /api/v1). */
export const BASE_URL = rawBase
  ? trimSlash(rawBase)
  : process.env.NODE_ENV === 'production'
    ? '/api/v1'
    : '';

export const EDGE_URL = BASE_URL;
export const APP_URL = BASE_URL;
