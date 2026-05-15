import { normLocaleTag, uniqKeepOrder } from './localeUtils';

export type AppLocaleMeta = {
  code?: unknown;
  label?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

export function normalizeAppLocalesMeta(v: unknown): AppLocaleMeta[] {
  if (Array.isArray(v)) return v as AppLocaleMeta[];
  if (v && typeof v === 'object' && 'data' in v && Array.isArray((v as any).data)) {
    return (v as any).data as AppLocaleMeta[];
  }
  return [];
}

export function normalizeDefaultLocaleValue(v: unknown): string {
  if (v && typeof v === 'object' && 'data' in v) return normLocaleTag((v as any).data);
  return normLocaleTag(v);
}

export function computeActiveLocales(meta: AppLocaleMeta[] | null | undefined, fallback: string): string[] {
  const arr = Array.isArray(meta) ? meta : [];

  const active = arr
    .filter((x) => x && (x as any).is_active !== false)
    .map((x) => normLocaleTag((x as any).code))
    .filter(Boolean) as string[];

  const uniq = uniqKeepOrder(active);

  const def = arr.find((x) => (x as any)?.is_default === true && (x as any)?.is_active !== false);
  const defCode = def ? normLocaleTag((def as any).code) : '';

  const out = defCode ? [defCode, ...uniq.filter((x) => x !== defCode)] : uniq;

  const fb = normLocaleTag(fallback) || 'tr';
  return out.length ? out : [fb];
}

