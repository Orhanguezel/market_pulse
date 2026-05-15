// src/modules/storage/helpers/admin.helpers.ts
// Shared helpers for storage admin controllers.
import type { MultipartValue } from '@fastify/multipart';
import { sql as dsql } from 'drizzle-orm';
import { buildPublicUrl, normalizeFolder } from '../util';
import type { Cfg, RenameResult, UploadResult } from '../cloudinary';
import type { NewStorageAsset, StorageAsset } from '../schema';
import type { StorageUpdateInput } from '../validation';

/** NULL/undefined alanlari INSERT'ten at */
export const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

/** Dosya adi sanitize */
export const sanitizeName = (name: string) => name.replace(/[^\w.\-]+/g, "_");

/** Per-request upload log base (user + ip + ua) */
type UploadLogRequest = {
  user?: { id?: string | null } | null;
  headers?: Record<string, unknown>;
  ip?: string;
};

export function makeUploadLogBase(req: UploadLogRequest) {
  const user = req.user;
  const xff = req.headers?.["x-forwarded-for"];
  const ip =
    (typeof xff === "string" && xff.split(",")[0].trim()) ||
    req.ip ||
    undefined;
  const uaRaw = req.headers?.["user-agent"];
  const ua =
    typeof uaRaw === "string"
      ? uaRaw
      : Array.isArray(uaRaw)
      ? uaRaw.join(",")
      : undefined;

  return { where: "storage_upload", user_id: user?.id ? String(user.id) : null, ip, ua };
}

type MultipartFields = Record<string, MultipartValue>;

export function getMultipartStringField(fields: MultipartFields, key: string): string | undefined {
  return fields[key] ? String(fields[key].value) : undefined;
}

export function parseMultipartMetadata(raw: string | undefined): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, value]) =>
        typeof value === 'string' ? [[key, value]] : [],
      ),
    );
  } catch {
    return null;
  }
}

type StorageUserRequest = {
  user?: { id?: string | null } | null;
};

export function getStorageRequestUserId(req: StorageUserRequest): string | null {
  return req.user?.id ? String(req.user.id) : null;
}

export function buildStorageAssetRecord(input: {
  id: string;
  req: StorageUserRequest;
  name: string;
  bucket: string;
  folder?: string | null;
  mime: string;
  upload: UploadResult;
  metadata: Record<string, string> | null;
  fallbackSize: number;
  provider: 'local' | 'cloudinary';
}): NewStorageAsset {
  const path = input.folder ? `${input.folder}/${input.name}` : input.name;
  const etag = typeof input.upload.etag === 'string' ? input.upload.etag.slice(0, 64) : null;

  return {
    id: input.id,
    user_id: getStorageRequestUserId(input.req),
    name: input.name,
    bucket: input.bucket,
    path,
    folder: input.folder ?? null,
    mime: input.mime,
    size: typeof input.upload.bytes === 'number' ? input.upload.bytes : input.fallbackSize,
    width: typeof input.upload.width === 'number' ? input.upload.width : null,
    height: typeof input.upload.height === 'number' ? input.upload.height : null,
    url: input.upload.secure_url || null,
    hash: etag,
    etag,
    provider: input.provider,
    provider_public_id: input.upload.public_id ?? null,
    provider_resource_type: input.upload.resource_type || 'image',
    provider_format: input.upload.format ?? null,
    provider_version: typeof input.upload.version === 'number' ? input.upload.version : null,
    metadata: input.metadata,
  };
}

type StorageAssetResponseLike = {
  id: string;
  bucket: string;
  path: string;
  url?: string | null;
} & Record<string, unknown>;

export function buildStorageAssetResponse(asset: StorageAssetResponseLike, cfg?: Cfg | null) {
  return {
    ...asset,
    asset_id: asset.id,
    url: buildPublicUrl(String(asset.bucket), String(asset.path), typeof asset.url === 'string' ? asset.url : null, cfg ?? undefined),
  };
}

export function resolveStoragePatchTargets(current: StorageAsset, patch: StorageUpdateInput) {
  const targetFolder =
    typeof patch.folder !== 'undefined' ? normalizeFolder(patch.folder) : current.folder ?? null;
  const targetName = typeof patch.name !== 'undefined' ? sanitizeName(patch.name) : current.name;
  const folderChanged = targetFolder !== (current.folder ?? null);
  const nameChanged = targetName !== current.name;

  return { targetFolder, targetName, folderChanged, nameChanged };
}

export function buildStorageRenamePublicId(
  current: StorageAsset,
  targetFolder: string | null,
  targetName: string,
): string {
  const isLocal = (current.provider || '') === 'local';
  const baseName = isLocal ? targetName : targetName.replace(/^\//, '').replace(/\.[^.]+$/, '');
  return targetFolder ? `${targetFolder}/${baseName}` : baseName;
}

export function buildStoragePatchSet(input: {
  patch: StorageUpdateInput;
  current: StorageAsset;
  targetFolder: string | null;
  targetName: string;
  renamed?: RenameResult | null;
}) {
  const { patch, current, targetFolder, targetName, renamed } = input;
  const sets: Record<string, unknown> = { updated_at: dsql`CURRENT_TIMESTAMP(3)` };
  const folderChanged = targetFolder !== (current.folder ?? null);
  const nameChanged = targetName !== current.name;

  if (folderChanged || nameChanged) {
    if (renamed) {
      sets.provider_public_id = renamed.public_id;
      sets.url = renamed.secure_url ?? current.url;
      sets.provider_version = typeof renamed.version === 'number' ? renamed.version : current.provider_version;
      sets.provider_format = renamed.format ?? current.provider_format;
    }
    sets.name = targetName;
    sets.folder = targetFolder;
    sets.path = targetFolder ? `${targetFolder}/${targetName}` : targetName;
  } else {
    if (typeof patch.name !== 'undefined') sets.name = targetName;
    if (typeof patch.folder !== 'undefined') sets.folder = targetFolder;
  }

  if (typeof patch.metadata !== 'undefined') sets.metadata = patch.metadata ?? null;

  return sets;
}
