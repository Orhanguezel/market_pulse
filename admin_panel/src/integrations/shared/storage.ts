// =============================================================
// FILE: src/integrations/shared/storage.ts
// =============================================================
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
export type StorageMeta = Record<string, string> | null;

export type StorageAsset = {
  id: string;
  name: string;
  bucket: string;
  path: string;
  folder: string | null;
  mime: string;
  size: number;
  width?: number | null;
  height?: number | null;
  url?: string | null;
  metadata: StorageMeta;
  created_at: string;
  updated_at: string;
};

export type ApiStorageAsset = Omit<
  StorageAsset,
  'size' | 'width' | 'height' | 'metadata' | 'created_at' | 'updated_at'
> & {
  size: number | string;
  width?: number | string | null;
  height?: number | string | null;
  metadata: string | StorageMeta;
  created_at: string | number | Date;
  updated_at: string | number | Date;
};

export type StorageListParams = {
  q?: string;
  bucket?: string;
  folder?: string | null;
  mime?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'name' | 'size';
  order?: 'asc' | 'desc';
};

/** ---- Public endpoints tipleri ---- */

/** POST /storage/uploads/sign-multipart */
export type StorageSignMultipartBody = {
  filename: string;
  folder?: string;
};

export type StorageSignMultipartResponse = {
  upload_url: string;
  fields: Record<string, string>;
};

/** POST /storage/:bucket/upload?path=&upsert= */
export type StoragePublicUploadResponse = {
  path: string;
  url: string;
};

export type StorageServerUploadArgs = {
  bucket: string;
  file: File;
  path?: string; // "folder/name.ext" gibi
  upsert?: boolean;
};

export type StorageListQuery = {
  q?: string;
  bucket?: string;
  folder?: string | null;
  mime?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'name' | 'size';
  order?: 'asc' | 'desc';
};
export type StorageUpdateInput = {
  name?: string;
  folder?: string | null;
  metadata?: Record<string, string> | null;
};

export const sanitize = (name: string) => name.replace(/[^\w.\-]+/g, '_');

export type UploadManyResponse = { items: StoragePublicUploadResponse[] };

/** File[]’a kesin daraltma: undefined/null/yanlış tipleri atar */
export function compactFiles(list: unknown[]): File[] {
  const out: File[] = [];
  for (const f of list) {
    if (!f) continue;
    if (typeof File !== 'undefined' && f instanceof File) {
      out.push(f);
      continue;
    }
    if (typeof Blob !== 'undefined' && f instanceof Blob) {
      try {
        const name = (f as any)?.name || 'blob';
        out.push(
          new File([f], name, {
            type: (f as any).type || 'application/octet-stream',
          }),
        );
      } catch {
        out.push(f as unknown as File);
      }
    }
  }
  return out;
}

function canOptimizeImage(file: File): boolean {
  const type = String(file?.type || '').toLowerCase();
  if (!type.startsWith('image/')) return false;
  if (type === 'image/svg+xml' || type === 'image/gif' || type === 'image/x-icon' || type === 'image/vnd.microsoft.icon') {
    return false;
  }
  return true;
}

function changeExt(name: string, ext: string): string {
  const base = String(name || 'upload').replace(/\.[^.]+$/, '');
  return `${base}.${ext}`;
}

export async function optimizeImageFileForUpload(
  file: File,
  opts?: { maxWidth?: number; maxHeight?: number; quality?: number },
): Promise<File> {
  if (typeof window === 'undefined' || !canOptimizeImage(file)) return file;

  const maxWidth = Math.max(320, Number(opts?.maxWidth ?? 2560));
  const maxHeight = Math.max(320, Number(opts?.maxHeight ?? 2560));
  const quality = Math.min(0.92, Math.max(0.6, Number(opts?.quality ?? 0.82)));

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image_load_failed'));
      el.src = objectUrl;
    });

    const srcW = Math.max(1, Number(img.naturalWidth || img.width || 1));
    const srcH = Math.max(1, Number(img.naturalHeight || img.height || 1));
    const ratio = Math.min(1, maxWidth / srcW, maxHeight / srcH);
    const outW = Math.max(1, Math.round(srcW * ratio));
    const outH = Math.max(1, Math.round(srcH * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], changeExt(file.name, 'webp'), {
      type: 'image/webp',
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export type ListResponse = { items: StorageAsset[]; total: number };

export type BulkCreateErrorItem = {
  file: string;
  error: {
    where?: string;
    message?: string;
    http?: number | null;
  };
};

export type BulkCreateResponse = {
  count: number;
  items: Array<StorageAsset | BulkCreateErrorItem>;
};

// NULL-güvenli tag helper
export const StorageListTags = (items?: StorageAsset[]) =>
  items && items.length
    ? [
        { type: 'Storage' as const, id: 'LIST' as const },
        ...items.map((r) => ({ type: 'Storage' as const, id: r.id })),
      ]
    : [{ type: 'Storage' as const, id: 'LIST' as const }];

// Backend query tipini Record<string, string | number>’e çevir
export const toQueryParams = (q?: Partial<StorageListQuery>): Record<string, string | number> => {
  if (!q) return {};

  const params: Record<string, string | number> = {};

  if (q.q) params.q = q.q;
  if (q.bucket) params.bucket = q.bucket;
  if (q.folder != null) params.folder = q.folder;
  if (q.mime) params.mime = q.mime;
  if (typeof q.limit === 'number') params.limit = q.limit;
  if (typeof q.offset === 'number') params.offset = q.offset;
  if (q.sort) params.sort = q.sort;
  if (q.order) params.order = q.order;

  return params;
};

// Hata helper (eslint no-explicit-any için: FetchBaseQueryError union'ı kullan)
export const makeCustomError = (message: string, data?: unknown): FetchBaseQueryError => ({
  status: 'CUSTOM_ERROR',
  error: message,
  data,
});
