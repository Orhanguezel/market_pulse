// =============================================================
// FILE: src/integrations/rtk/baseApi.ts
// Next.js + Fastify RTK base (env / site-defaults üzerinden API URL)
// FIXES:
//  - Cookie auth için credentials include
//  - Stale Bearer header 401 üretiyorsa path bazlı bypass
//  - Refresh concurrency (tek refresh in-flight)
//  - MaybePromise uyumlu (no .finally())
//  - ✅ FIX: FormData (multipart) body varsa Content-Type asla set edilmez
//           (PDF upload dahil). Varsa kaldırılır ki boundary bozulmasın.
// =============================================================

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';
import { metahubTags } from './tags';
import { tokenStore } from '@/integrations/rtk/token';
import { BASE_URL as CONFIG_BASE_URL } from '@/integrations/rtk/constants';
import { getPublicApiBaseUrl } from '@/lib/site-config';
import { acquireSlot, releaseSlot } from '@/integrations/rtk/requestThrottle';

/** ---------- Base URL resolve ---------- */
function trimSlash(x: string) {
  return String(x || '').replace(/\/+$/, '');
}

/**
 * Dev tarayıcı: `/api/v1` → Next `rewrites` ile Fastify’a (same-origin, CORS yok).
 * SSR / Node: `NEXT_PUBLIC_API_URL` veya `getPublicApiBaseUrl()` ile doğrudan backend.
 */
function resolveRtkBaseUrl(): string {
  const raw = trimSlash(CONFIG_BASE_URL);
  if (process.env.NODE_ENV === 'production') {
    return raw || '/api/v1';
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  if (raw) return raw;
  return trimSlash(getPublicApiBaseUrl());
}

const BASE_URL = resolveRtkBaseUrl();

/** ---------- helpers & guards ---------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

type AnyArgs = string | FetchArgs;

function isFormDataBody(b: unknown): boolean {
  return typeof FormData !== 'undefined' && b instanceof FormData;
}

function isJsonLikeBody(b: unknown): b is Record<string, unknown> {
  if (!b) return false;
  if (isFormDataBody(b)) return false;
  if (typeof Blob !== 'undefined' && b instanceof Blob) return false;
  if (typeof ArrayBuffer !== 'undefined' && b instanceof ArrayBuffer) return false;
  return isRecord(b);
}

/** İstekleri BE uyumluluğuna göre hafifçe ayarla (legacy) */
function compatAdjustArgs(args: AnyArgs): AnyArgs {
  if (typeof args === 'string') return args;
  const a: FetchArgs = { ...args };

  const urlNoSlash = String(a.url ?? '').replace(/\/+$/, '');
  const isGet = !a.method || a.method.toUpperCase() === 'GET';

  // Supa benzeri GET /profiles?id=..&limit=1 → /profiles/:id
  if (urlNoSlash === '/profiles' && isGet) {
    const params = isRecord(a.params) ? (a.params as Record<string, unknown>) : undefined;
    const id = typeof params?.id === 'string' ? params.id : null;
    const limitIsOne = params ? String(params.limit) === '1' : false;
    if (id && limitIsOne) {
      a.url = `/profiles/${encodeURIComponent(id)}`;
      if (params) {
        const { ...rest } = params;
        a.params = Object.keys(rest).length ? rest : undefined;
      }
    }
  }

  // admin/users mini-batch: ids[] → "a,b,c"
  if (urlNoSlash === '/admin/users' && isGet && isRecord(a.params)) {
    const p = { ...(a.params as Record<string, unknown>) };
    if (Array.isArray(p.ids)) {
      p.ids = (p.ids as unknown[]).map(String).join(',');
    }
    a.params = p;
  }

  return a;
}

/** ---------- Base Query ---------- */
type RBQ = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  unknown,
  FetchBaseQueryMeta
>;

const DEFAULT_LOCALE = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as string | undefined) || 'tr';

/**
 * Bu path’lerde Authorization header’ı eklemek çoğu cookie-auth backend’de sorun çıkarır.
 * (Authorization varsa onu baz alıp cookie’yi ignore etme ihtimali yüksek)
 */
const AUTH_HEADER_BYPASS_PREFIXES = ['/auth/', '/status'] as const;

function toPath(u: string): string {
  const s = String(u || '');
  if (!s) return '/';
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).pathname || '/';
    } catch {
      return s.startsWith('/') ? s : `/${s}`;
    }
  }
  return s.startsWith('/') ? s : `/${s}`;
}

function normalizeCleanPath(u: string): string {
  const p = toPath(u).replace(/\/+$/, '');
  return p || '/';
}

function shouldBypassAuthHeader(path: string): boolean {
  const p = normalizeCleanPath(path);
  return AUTH_HEADER_BYPASS_PREFIXES.some((pref) => p === pref || p.startsWith(pref));
}

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    // `x-skip-auth` ile refresh işleminde auth'u bypass et
    if (headers.get('x-skip-auth') === '1') {
      headers.delete('x-skip-auth');
      headers.delete('authorization');
      headers.delete('Authorization');

      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      if (!headers.has('Accept-Language')) headers.set('Accept-Language', DEFAULT_LOCALE);
      return headers;
    }

    const token = tokenStore.get();
    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!headers.has('Accept-Language')) headers.set('Accept-Language', DEFAULT_LOCALE);
    return headers;
  },
  responseHandler: async (response) => {
    const ct = response.headers.get('content-type') || '';
    if (ct.includes('application/json')) return response.json();
    if (ct.includes('text/')) return response.text();
    try {
      const t = await response.text();
      return t || null;
    } catch {
      return null;
    }
  },
  validateStatus: (res) => res.ok,
}) as RBQ;

/** ---------- Throttled wrapper — 429 koruması ---------- */
const throttledBaseQuery: RBQ = async (args, api, extra) => {
  await acquireSlot();
  try {
    return (await Promise.resolve(rawBaseQuery(args, api, extra))) as any;
  } finally {
    releaseSlot();
  }
};

/** ---------- 401 → refresh → retry ---------- */
type RawResult = Awaited<ReturnType<typeof rawBaseQuery>>;

// Bu endpoint'lerde 401 alırsak refresh denemesi yapma
const AUTH_SKIP_REAUTH = new Set<string>([
  '/auth/token',
  '/auth/signup',
  '/auth/google',
  '/auth/google/start',
  '/auth/token/refresh',
  '/auth/logout',
]);

/**
 * ✅ JSON body'lerde Content-Type ekle.
 * ✅ FormData body'lerde Content-Type'ı asla set etme; varsa kaldır (boundary bozulmasın).
 */
const ensureJson = (fa: FetchArgs) => {
  // multipart (PDF upload vs)
  if (typeof fa.body !== 'undefined' && isFormDataBody(fa.body)) {
    const h = { ...(fa.headers || {}) } as Record<string, any>;
    delete h['content-type'];
    delete h['Content-Type'];
    fa.headers = h;
    return fa;
  }

  // json-like
  if (typeof fa.body !== 'undefined' && isJsonLikeBody(fa.body)) {
    fa.headers = { ...(fa.headers || {}), 'Content-Type': 'application/json' };
  }

  return fa;
};

function stripAuthHeaderIfNeeded(req: FetchArgs, cleanPath: string): FetchArgs {
  if (shouldBypassAuthHeader(cleanPath)) {
    const h = { ...(req.headers || {}) } as Record<string, any>;
    delete h.authorization;
    delete h.Authorization;
    req.headers = h;
  }
  return req;
}

// ✅ refresh concurrency (MaybePromise uyumlu)
let refreshInFlight: Promise<RawResult> | null = null;

async function runRefresh(api: any, extra: any): Promise<RawResult> {
  const r = await Promise.resolve(
    throttledBaseQuery(
      {
        url: '/auth/token/refresh',
        method: 'POST',
        headers: { 'x-skip-auth': '1', Accept: 'application/json' },
      },
      api,
      extra,
    ),
  );
  return r as RawResult;
}

const baseQueryWithReauth: RBQ = async (args, api, extra) => {
  let req: AnyArgs = compatAdjustArgs(args);
  const urlPath = typeof req === 'string' ? req : req.url || '';
  const cleanPath = normalizeCleanPath(urlPath);

  if (typeof req !== 'string') {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      req.headers = { ...(req.headers || {}), 'x-skip-auth': '1' };
    }

    req = stripAuthHeaderIfNeeded(req, cleanPath);
    req = ensureJson(req);
  }

  let result: RawResult = (await Promise.resolve(throttledBaseQuery(req, api, extra))) as RawResult;

  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        try {
          return await runRefresh(api, extra);
        } finally {
          refreshInFlight = null;
        }
      })();
    }

    const refreshRes = await refreshInFlight;

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;
      if (access_token) tokenStore.set(access_token);

      // retry
      let retry: AnyArgs = compatAdjustArgs(args);
      const retryPath = typeof retry === 'string' ? retry : retry.url || '';
      const retryCleanPath = normalizeCleanPath(retryPath);

      if (typeof retry !== 'string') {
        if (AUTH_SKIP_REAUTH.has(retryCleanPath)) {
          retry.headers = { ...(retry.headers || {}), 'x-skip-auth': '1' };
        }
        retry = stripAuthHeaderIfNeeded(retry, retryCleanPath);
        retry = ensureJson(retry);
      }

      result = (await Promise.resolve(throttledBaseQuery(retry, api, extra))) as RawResult;
    } else {
      tokenStore.set(null);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: metahubTags,
});

export { rawBaseQuery };
