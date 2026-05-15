/**
 * Logo / favicon / OG image dosyalarının etrafındaki tek-renkli padding'i
 * upload sırasında otomatik kırpar. Ekosistem genelinde tek noktadan
 * kullanılır — yeni proje her seferinde CSS hack'i yazmak zorunda kalmaz.
 *
 * Neden: kullanıcılar logolarını PNG içinde beyaz/şeffaf padding ile
 * yüklüyor; frontend'te header ince görünmek yerine şişiyor. sharp.trim()
 * alfa-bound (PNG) veya renk-bound (JPG) kırpma yapar.
 *
 * Kullanım: storage/controller.ts gibi upload handler'ında buffer'ı trim et.
 *   import { trimImageBuffer, shouldAutoTrim } from '../_shared/image-trim';
 *   if (shouldAutoTrim(mime, filename)) buf = await trimImageBuffer(buf, mime);
 */

import sharp from 'sharp';

const TRIMMABLE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
]);

const AUTO_TRIM_PATTERN =
  /(^|[._-])(logo|favicon|apple[-_]?touch|brand|og[-_]?image|mark|symbol)([._-]|\.[a-z]+$|$)/i;

/**
 * Dosya otomatik trim edilmeli mi? MIME desteklenen raster türlerden biri
 * VE dosya adı logo/favicon/og-image pattern'ine uyuyorsa true.
 */
export function shouldAutoTrim(mime: string | undefined, filename: string | undefined): boolean {
  if (!mime || !filename) return false;
  if (!TRIMMABLE_MIMES.has(mime.toLowerCase())) return false;
  return AUTO_TRIM_PATTERN.test(filename);
}

export interface TrimOptions {
  /** sharp.trim threshold — kırpma için tolerans (0-100+). Yüksek = agresif. */
  threshold?: number;
  /** Kırpma sonrası yeniden kodla. Default true. */
  reencode?: boolean;
}

/**
 * Buffer'ı sharp ile trim eder. Kırpılacak bir kenar yoksa (veya sharp
 * hata atarsa) orijinal buffer döner — upload asla bloklanmaz.
 */
export async function trimImageBuffer(
  input: Buffer,
  mime: string,
  options: TrimOptions = {},
): Promise<Buffer> {
  const threshold = options.threshold ?? 10;
  try {
    const pipeline = sharp(input, { failOn: 'none' }).trim({ threshold });
    if (options.reencode !== false) {
      if (mime === 'image/png') return await pipeline.png({ compressionLevel: 9 }).toBuffer();
      if (mime === 'image/jpeg' || mime === 'image/jpg') return await pipeline.jpeg({ quality: 92 }).toBuffer();
      if (mime === 'image/webp') return await pipeline.webp({ quality: 92 }).toBuffer();
      if (mime === 'image/avif') return await pipeline.avif({ quality: 80 }).toBuffer();
    }
    return await pipeline.toBuffer();
  } catch {
    return input;
  }
}

/**
 * Güvenli tek-adım wrapper: şart sağlanıyorsa trim, değilse orijinal.
 * Upload handler'ları bunu kullanmalı.
 */
export async function maybeTrimUploadBuffer(
  input: Buffer,
  mime: string | undefined,
  filename: string | undefined,
  options: TrimOptions = {},
): Promise<Buffer> {
  if (!mime || !shouldAutoTrim(mime, filename)) return input;
  return trimImageBuffer(input, mime, options);
}
