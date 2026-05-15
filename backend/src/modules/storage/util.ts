// =============================================================
// FILE: src/modules/storage/util.ts
// =============================================================

const encSeg = (s: string) => encodeURIComponent(s);
const encPath = (p: string) => p.split("/").map(encSeg).join("/");
const decPath = (p: string) => decodeURIComponent(p);

export type Cfg = {
  cdnPublicBase?: string | null;
  publicApiBase?: string | null;
};

/**
 * Public URL üretimi:
 *  1) providerUrl (Cloudinary secure_url / local URL) varsa onu kullan
 *  2) cfg.cdnPublicBase doluysa → {cdn}/{bucket}/{path}
 *  3) cfg.publicApiBase doluysa → {api}/storage/{bucket}/{path}
 *  4) fallback: /storage/:bucket/:path
 */
export function buildPublicUrl(
  bucket: string,
  path: string,
  providerUrl?: string | null,
  cfg?: Cfg | null,
): string {
  if (providerUrl) {
    if (providerUrl.startsWith("/") && cfg?.publicApiBase) {
      return `${cfg.publicApiBase.replace(/\/+$/, "")}${providerUrl}`;
    }
    return providerUrl;
  }

  const cdnBaseRaw = cfg?.cdnPublicBase ?? "";
  const cdnBase = cdnBaseRaw.replace(/\/+$/, "");
  if (cdnBase) {
    return `${cdnBase}/${encSeg(bucket)}/${encPath(path)}`;
  }

  const apiBaseRaw = cfg?.publicApiBase ?? "";
  const apiBase = apiBaseRaw.replace(/\/+$/, "");
  if (apiBase) {
    return `${apiBase}/storage/${encSeg(bucket)}/${encPath(path)}`;
  }

  // en son çare: relative path
  return `/storage/${encSeg(bucket)}/${encPath(path)}`;
}

/** Eski kullanım için basit wrapper (cfg yoksa sadece providerUrl / fallback kullanır) */
export function publicUrlOf(
  bucket: string,
  path: string,
  providerUrl?: string | null,
): string {
  return buildPublicUrl(bucket, path, providerUrl, null);
}

export function publicUrlForAsset(asset: {
  bucket: string;
  path: string;
  url?: string | null;
}) {
  return publicUrlOf(asset.bucket, asset.path, asset.url ?? null);
}

export const stripLeadingSlashes = (s: string) => s.replace(/^\/+/, "");

export const normalizeFolder = (s?: string | null) => {
  if (!s) return null;
  let f = s.trim().replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
  return f.length ? f.slice(0, 255) : null;
};

export function chunk<T>(arr: T[], size = 100) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
