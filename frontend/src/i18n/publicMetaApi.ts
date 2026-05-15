// =============================================================
// FILE: src/i18n/publicMetaApi.ts
// Public i18n META fetch helpers (client-safe)
// - Single source of truth for API base + no-store JSON fetch
// - Normalizes common API wrappers: { data: ... } or { value: ... }
// =============================================================

'use client';

import { normalizePublicApiBase } from '@/lib/normalize-public-api-base';

export type MaybeWrapped<T> = T | { data?: T } | { value?: T } | null | undefined;

export function unwrapMaybeData<T>(x: MaybeWrapped<T>): T | null {
  if (x == null) return null;
  if (typeof x !== 'object' || Array.isArray(x)) return x as T;
  if ('data' in (x as any)) return ((x as any).data ?? null) as T | null;
  if ('value' in (x as any)) return ((x as any).value ?? null) as T | null;
  return x as T;
}

export function getPublicApiBase(): string {
  const raw =
    (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim() ||
    (process.env.NEXT_PUBLIC_API_URL || '').trim() ||
    (process.env.API_BASE_URL || '').trim();

  const base = raw.replace(/\/+$/, '');
  if (!base) return '';
  return normalizePublicApiBase(base);
}

export async function fetchJsonNoStore<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'omit', cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

