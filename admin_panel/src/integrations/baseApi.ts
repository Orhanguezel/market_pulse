// =============================================================
// FILE: src/integrations/baseApi.ts
// Next.js FINAL (App Router compatible)
// =============================================================
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query';

import { tags } from './tags';
import { tokenStore } from '@/integrations/core/token';
import { BASE_URL } from '@/integrations/apiBase';

/* -------------------- helpers -------------------- */

function isAbsUrl(x: string) {
  return /^https?:\/\//i.test(x);
}

const DEBUG_API = String(process.env.NEXT_PUBLIC_DEBUG_API || '') === '1';
if (DEBUG_API) {
  // eslint-disable-next-line no-console
  console.info('[gzl] BASE_URL =', BASE_URL);
}

/* -------------------- guards -------------------- */

type AnyArgs = string | FetchArgs;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Cross-realm FormData guard (SSR-safe)
function isProbablyFormData(b: unknown): boolean {
  return !!b && typeof b === 'object' && typeof (b as any).append === 'function';
}

// JSON body tespiti (FormData/Blob/ArrayBuffer hariç)
function isJsonLikeBody(b: unknown): b is Record<string, unknown> {
  if (typeof FormData !== 'undefined' && b instanceof FormData) return false;
  if (typeof Blob !== 'undefined' && b instanceof Blob) return false;
  if (typeof ArrayBuffer !== 'undefined' && b instanceof ArrayBuffer) return false;
  if (isProbablyFormData(b)) return false;
  return isRecord(b);
}

const AUTH_SKIP_REAUTH = new Set<string>([
  '/auth/token',
  '/auth/signup',
  '/auth/google',
  '/auth/google/start',
  '/auth/token/refresh',
  '/auth/logout',
]);

function extractPath(u: string): string {
  try {
    if (isAbsUrl(u)) {
      const url = new URL(u);
      return url.pathname.replace(/\/+$/, '');
    }
    return u.replace(/^https?:\/\/[^/]+/i, '').replace(/\/+$/, '');
  } catch {
    return u.replace(/\/+$/, '');
  }
}

/** Göreli url'leri '/foo' formatına normalize et */
function normalizeUrlArg(arg: AnyArgs): AnyArgs {
  if (typeof arg === 'string') {
    if (isAbsUrl(arg) || arg.startsWith('/')) return arg;
    return `/${arg}`;
  }
  const url = arg.url ?? '';
  if (url && !isAbsUrl(url) && !url.startsWith('/')) {
    return { ...arg, url: `/${url}` };
  }
  return arg;
}

/* -------------------- defaults -------------------- */

function getDefaultLocale(): string {
  const envLocale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE || '').trim();
  if (envLocale) return envLocale;

  if (typeof navigator !== 'undefined') {
    return (navigator.language || 'tr').trim() || 'tr';
  }
  return 'tr';
}

function safeGetLocalStorageItem(key: string): string {
  try {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSetLocalStorageItem(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveLocalStorageItem(key: string) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* -------------------- Base Query -------------------- */

type RBQ = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  unknown,
  FetchBaseQueryMeta
>;

const rawBaseQuery: RBQ = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    if (headers.get('x-skip-auth') === '1') {
      headers.delete('x-skip-auth');
      if (!headers.has('Accept')) headers.set('Accept', 'application/json');
      if (!headers.has('Accept-Language')) headers.set('Accept-Language', getDefaultLocale());
      return headers;
    }

    const token = tokenStore.get() || safeGetLocalStorageItem('mh_access_token');

    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`);
    }

    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    if (!headers.has('Accept-Language')) headers.set('Accept-Language', getDefaultLocale());

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

/* ---------- Hata gövdesini serileştir (Blob/ArrayBuffer) ---------- */
async function coerceSerializableError(result: Awaited<ReturnType<typeof rawBaseQuery>>) {
  const err = (result as any)?.error as FetchBaseQueryError | undefined;
  if (!err) return result;

  const d: any = (err as any).data;
  try {
    if (typeof Blob !== 'undefined' && d instanceof Blob) {
      let text = '';
      try {
        text = await d.text();
      } catch {}
      (err as any).data = text || `[binary ${d.type || 'unknown'} ${d.size ?? ''}B]`;
    } else if (typeof ArrayBuffer !== 'undefined' && d instanceof ArrayBuffer) {
      const dec = new TextDecoder();
      (err as any).data = dec.decode(new Uint8Array(d));
    }
  } catch {
    (err as any).data = String(d ?? '');
  }
  return result;
}

/* ---------- Body tipine göre doğru Content-Type ---------- */
function ensureProperHeaders(fa: FetchArgs): FetchArgs {
  const next: FetchArgs = { ...fa };
  const hdr = (next.headers as Record<string, string>) ?? {};

  if (isJsonLikeBody(next.body)) {
    next.headers = { ...hdr, 'Content-Type': 'application/json' };
  } else {
    if (hdr['Content-Type']) {
      const { ['Content-Type']: _omit, ...rest } = hdr;
      next.headers = rest;
    }
  }
  return next;
}

/* -------------------- 401 → refresh → retry -------------------- */

const baseQueryWithReauth: RBQ = async (args, api, extra) => {
  let req: AnyArgs = normalizeUrlArg(args);
  const path = typeof req === 'string' ? req : req.url || '';
  const cleanPath = extractPath(path);

  if (typeof req !== 'string') {
    if (AUTH_SKIP_REAUTH.has(cleanPath)) {
      const orig = (req.headers as Record<string, string> | undefined) ?? {};
      req.headers = { ...orig, 'x-skip-auth': '1' };
    }
    req = ensureProperHeaders(req);
  }

  let result = await rawBaseQuery(req, api, extra);
  result = await coerceSerializableError(result);

  if (result.error?.status === 401 && !AUTH_SKIP_REAUTH.has(cleanPath)) {
    const refreshRes = await rawBaseQuery(
      {
        url: '/auth/token/refresh',
        method: 'POST',
        headers: { 'x-skip-auth': '1', Accept: 'application/json' },
      },
      api,
      extra,
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string } | undefined)?.access_token;

      if (access_token) {
        tokenStore.set(access_token);
        safeSetLocalStorageItem('mh_access_token', access_token);

        let retry: AnyArgs = normalizeUrlArg(args);
        if (typeof retry !== 'string') {
          retry = ensureProperHeaders(retry);
        }

        result = await rawBaseQuery(retry, api, extra);
        result = await coerceSerializableError(result);
      } else {
        tokenStore.set(null);
        safeRemoveLocalStorageItem('mh_access_token');
        safeRemoveLocalStorageItem('mh_refresh_token');
      }
    } else {
      tokenStore.set(null);
      safeRemoveLocalStorageItem('mh_access_token');
      safeRemoveLocalStorageItem('mh_refresh_token');
    }
  }

  return result;
};

/* -------------------- API -------------------- */

export const baseApi = createApi({
  reducerPath: 'gwdApi',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: tags,
});

export { rawBaseQuery };

// Not: BASE_URL artık '@/integrations/apiBase' içinden export ediliyor.
export { BASE_URL };
