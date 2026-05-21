import fs from 'node:fs';
import path from 'node:path';
import { env } from '@/core/env';

export function parseCorsOrigins(v?: string | string[]): boolean | string[] {
  if (!v) {
    if (env.NODE_ENV === 'production') {
      console.warn('[CORS] CORS_ORIGIN bos — production icin tanimlanmali!');
      return false;
    }
    return true;
  }
  if (Array.isArray(v)) return v;
  const s = String(v).trim();
  if (!s) return env.NODE_ENV === 'production' ? false : true;
  const arr = s.split(',').map(x => x.trim()).filter(Boolean);
  return arr.length ? arr : (env.NODE_ENV === 'production' ? false : true);
}

export function pickUploadsRoot(rawFromSettings?: string | null): string {
  const fallback = path.join(process.cwd(), 'uploads');
  const envRoot = env.LOCAL_STORAGE_ROOT && String(env.LOCAL_STORAGE_ROOT).trim();
  const candidateRaw = envRoot || (rawFromSettings || '').trim() || fallback;
  const candidate = path.isAbsolute(candidateRaw)
    ? candidateRaw
    : path.resolve(process.cwd(), candidateRaw);

  const ensureDir = (p: string): string => {
    try {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    } catch {
      if (!fs.existsSync(fallback)) fs.mkdirSync(fallback, { recursive: true });
      return fallback;
    }
  };

  return ensureDir(candidate);
}

export function pickUploadsPrefix(rawFromSettings?: string | null): string {
  const envBase = env.LOCAL_STORAGE_BASE_URL && String(env.LOCAL_STORAGE_BASE_URL).trim();
  let p = envBase || (rawFromSettings || '').trim() || '/uploads';
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/+$/, '');
  return `${p}/`;
}
