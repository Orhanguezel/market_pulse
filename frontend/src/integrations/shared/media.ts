// src/lib/shared/media.ts
export type FitMode = "fill" | "fit";

/** Cloudinary (veya düz URL) için güvenli src üretir */
export function toCdnSrc(
  url?: string | null,
  w = 720,
  h = 520,
  mode: FitMode = "fill"
): string {
  const s = (url || "").trim();
  if (!s) return "";
  if (s.startsWith("https://res.cloudinary.com/") && s.includes("/upload/")) {
    const c = mode === "fill" ? "c_fill" : "c_fit";
    const transforms = `f_auto,q_auto:eco,w_${w},h_${h},${c}`;
    return s.replace("/upload/", `/upload/${transforms}/`);
  }
  return s;
}

export function toAvatarSrc(
  img?: string | { url?: string; webp?: string; thumbnail?: string } | null,
  w = 96,
  h = 96
): string {
  const base =
    (typeof img === "string" ? img : img?.webp || img?.url || img?.thumbnail || "")?.trim() || "";
  if (!base) return "";
  if (base.startsWith("https://res.cloudinary.com/") && base.includes("/upload/")) {
    const transforms = `f_auto,q_auto:eco,w_${w},h_${h},c_fill,g_face`;
    return base.replace("/upload/", `/upload/${transforms}/`);
  }
  return base;
}

/** URL'nin geçerli bir resim src'si olup olmadığını kontrol eder */
export function isValidImageSrc(src: string): boolean {
  if (!src || typeof src !== 'string') return false;
  const s = src.trim();
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/');
}
