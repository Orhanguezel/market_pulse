// =============================================================
// FILE: src/modules/_shared/repo-helpers.ts
// Ortak repository yardımcıları
// =============================================================
import { env } from "../../core/env";

/**
 * Provider URL varsa onu döndür, yoksa CDN base → /storage/:bucket/:path
 * Slider ve Properties modullerindeki aynı fonksiyon buradan kullanılır.
 */
export function publicUrlOf(
  bucket?: string | null,
  path?: string | null,
  providerUrl?: string | null,
): string | null {
  if (providerUrl) return providerUrl;
  if (!bucket || !path) return null;

  const encSeg = (s: string) => encodeURIComponent(s);
  const encPath = path.split("/").map(encSeg).join("/");

  const cdnBase = (env.CDN_PUBLIC_BASE || "").replace(/\/+$/, "");
  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath}`;

  const apiBase = (env.PUBLIC_API_BASE || "").replace(/\/+$/, "");
  return `${apiBase || ""}/storage/${encSeg(bucket)}/${encPath}`;
}

/** Sayfa bazlı sorgular için limit/offset hesapla */
export function pageToOffset(page: number, limit: number): number {
  return Math.max(0, (page - 1) * limit);
}
