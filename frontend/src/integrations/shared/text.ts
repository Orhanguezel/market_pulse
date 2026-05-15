// src/lib/shared/text.ts
import type { SupportedLocale } from "@/types/common";

export function stripHtml(x = ""): string {
  return x.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
export function excerpt(x = "", max = 220): string {
  const t = stripHtml(x);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = cut.lastIndexOf(" ");
  return (last > 40 ? cut.slice(0, last) : cut) + "…";
}

export function pickML(tf: any, l: SupportedLocale): string {
  if (!tf) return "";
  if (typeof tf === "string") return tf.trim();
  const cand =
    tf?.[l] ||
    tf?.en ||
    tf?.tr ||
    (Object.values(tf || {}).find((x: any) => typeof x === "string" && x.trim()) as string) ||
    "";
  return (cand || "").toString().trim();
}

/** 🔒 Çok dilli alan için KATI seçim (fallback yok) */
export function pickStrict(tf: any, l: SupportedLocale): string {
  if (!tf) return "";
  if (typeof tf === "string") return tf.trim(); // backend tek dilli döndüyse kabul et
  const v = (tf as Record<string, unknown>)[l];
  return typeof v === "string" ? v.trim() : "";
}

/** Locale-aware tarih formatlama */
export function formatDate(locale: string, isoLike: unknown): string {
  const s = typeof isoLike === 'string' ? isoLike.trim() : '';
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/** HTML'den class ve style attribute'larını temizle, ilk h1'i kaldır */
export function stripPresentationAttrs(html: string): string {
  const src = (typeof html === 'string' ? html : '').trim();
  if (!src) return '';
  const noClass = src.replace(/\sclass="[^"]*"/gi, '');
  const noStyle = noClass.replace(/\sstyle="[^"]*"/gi, '');
  return noStyle.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, '').trim();
}

/** HTML içerisinden img src URL'lerini çıkar */
export function extractImgSrcListFromHtml(html: string): string[] {
  const src = (typeof html === 'string' ? html : '').trim();
  if (!src) return [];
  const out: string[] = [];
  const re = /<img\b[^>]*?\ssrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const u = (m[1] || '').trim();
    if (u) out.push(u);
    if (out.length >= 12) break;
  }
  return out;
}
