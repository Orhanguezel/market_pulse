import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { MultipartFile, MultipartValue } from '@fastify/multipart';
import { getRequiredTenantKey, getRequiredUserId } from '@/modules/_shared';
import { handleRouteError } from '@/modules/_shared';
import { getCloudinaryConfig, uploadBufferAuto, destroyCloudinaryById } from './cloudinary';
import { storageListQuerySchema, storageUpdateSchema } from './validation';
import { normalizeFolder } from './util';
import {
  repoDeleteUserAsset,
  repoGetUserAsset,
  repoInsert,
  repoListUserAssets,
  repoListUserFolders,
  repoUpdateUserAsset,
  type StorageInsertInput,
} from './repository';
import { omitNullish, parseMultipartMetadata, sanitizeName } from './helpers';
import { pickUploadsRoot } from '@/app.helpers';

type UploadRequest = FastifyRequest & { file?: () => Promise<MultipartFile | undefined> };

function userBucket(tenantKey: string, userId: string) {
  const suffix = createHash('sha256').update(`${tenantKey}:${userId}`).digest('hex').slice(0, 24);
  return `user-docs-${suffix}`;
}

function multipartField(fields: Record<string, MultipartValue>, key: string) {
  return fields[key] ? String(fields[key].value ?? '') : undefined;
}

function responseAsset(row: Record<string, unknown>) {
  return {
    ...row,
    url: `/api/v1/storage/my/assets/${encodeURIComponent(String(row.id))}/content`,
  };
}

export async function listMyAssets(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = storageListQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    const userId = getRequiredUserId();
    const bucket = userBucket(getRequiredTenantKey(), userId);
    const { rows, total } = await repoListUserAssets(parsed.data, bucket, userId);
    reply.header('x-total-count', String(total));
    reply.header('access-control-expose-headers', 'x-total-count');
    return rows.map((row) => responseAsset(row as unknown as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(reply, req, error, 'list_my_storage_assets');
  }
}

export async function getMyAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getRequiredUserId();
    const row = await repoGetUserAsset((req.params as { id: string }).id, userBucket(getRequiredTenantKey(), userId), userId);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return responseAsset(row as unknown as Record<string, unknown>);
  } catch (error) {
    return handleRouteError(reply, req, error, 'get_my_storage_asset');
  }
}

export async function uploadMyAsset(req: UploadRequest, reply: FastifyReply) {
  try {
    const cfg = await getCloudinaryConfig();
    if (!cfg) return reply.code(501).send({ error: { message: 'storage_not_configured' } });
    const file = await req.file?.();
    if (!file) return reply.code(400).send({ error: { message: 'file_required' } });
    const buffer = await file.toBuffer();
    const fields = file.fields as Record<string, MultipartValue>;
    const folder = normalizeFolder(multipartField(fields, 'folder'));
    const metadata = parseMultipartMetadata(multipartField(fields, 'metadata'));
    const name = sanitizeName(file.filename || 'file');
    const id = randomUUID();
    const tenantKey = getRequiredTenantKey();
    const userId = getRequiredUserId();
    const bucket = userBucket(tenantKey, userId);
    const providerFolder = [bucket, folder].filter(Boolean).join('/');
    const publicId = `${id}-${name.replace(/\.[^.]+$/, '')}`;
    const uploaded = await uploadBufferAuto(cfg, buffer, { folder: providerFolder, publicId, mime: file.mimetype });
    const path = [folder, `${id}-${name}`].filter(Boolean).join('/');
    const provider = cfg.driver === 'local' ? 'local' : 'cloudinary';
    const record: StorageInsertInput = {
      id,
      user_id: userId,
      name,
      bucket,
      path,
      folder,
      mime: file.mimetype || 'application/octet-stream',
      size: uploaded.bytes || buffer.length,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      url: uploaded.secure_url || null,
      hash: uploaded.etag ?? null,
      etag: uploaded.etag ?? null,
      provider,
      provider_public_id: uploaded.public_id ?? null,
      provider_resource_type: uploaded.resource_type ?? null,
      provider_format: uploaded.format ?? null,
      provider_version: uploaded.version ?? null,
      metadata,
    };
    await repoInsert(omitNullish(record) as StorageInsertInput);
    return reply.code(201).send(responseAsset(record as unknown as Record<string, unknown>));
  } catch (error) {
    return handleRouteError(reply, req, error, 'upload_my_storage_asset');
  }
}

export async function patchMyAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = storageUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    const userId = getRequiredUserId();
    const bucket = userBucket(getRequiredTenantKey(), userId);
    const id = (req.params as { id: string }).id;
    const current = await repoGetUserAsset(id, bucket, userId);
    if (!current) return reply.code(404).send({ error: { message: 'not_found' } });
    const sets: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) sets.name = sanitizeName(parsed.data.name);
    if (parsed.data.folder !== undefined) sets.folder = normalizeFolder(parsed.data.folder);
    if (parsed.data.metadata !== undefined) sets.metadata = parsed.data.metadata;
    await repoUpdateUserAsset(id, bucket, userId, sets);
    const fresh = await repoGetUserAsset(id, bucket, userId);
    return responseAsset(fresh as unknown as Record<string, unknown>);
  } catch (error) {
    return handleRouteError(reply, req, error, 'patch_my_storage_asset');
  }
}

export async function deleteMyAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getRequiredUserId();
    const bucket = userBucket(getRequiredTenantKey(), userId);
    const id = (req.params as { id: string }).id;
    const row = await repoGetUserAsset(id, bucket, userId);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    try {
      const isLocal = row.provider === 'local';
      const publicId = row.provider_public_id || (isLocal ? row.path : row.path.replace(/\.[^.]+$/, ''));
      await destroyCloudinaryById(publicId, row.provider_resource_type || undefined, row.provider || undefined);
    } catch { /* DB kaydını temizlemeye devam et */ }
    await repoDeleteUserAsset(id, bucket, userId);
    return reply.code(204).send();
  } catch (error) {
    return handleRouteError(reply, req, error, 'delete_my_storage_asset');
  }
}

export async function listMyFolders(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getRequiredUserId();
    return repoListUserFolders(userBucket(getRequiredTenantKey(), userId), userId);
  } catch (error) {
    return handleRouteError(reply, req, error, 'list_my_storage_folders');
  }
}

export async function getMyAssetContent(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getRequiredUserId();
    const bucket = userBucket(getRequiredTenantKey(), userId);
    const row = await repoGetUserAsset((req.params as { id: string }).id, bucket, userId);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    if (row.provider !== 'local') {
      if (!row.url) return reply.code(404).send({ error: { message: 'content_not_found' } });
      return reply.redirect(row.url, 302);
    }

    const cfg = await getCloudinaryConfig();
    const root = pickUploadsRoot(cfg?.localRoot);
    const relative = String(row.provider_public_id || row.path).replace(/^\/+/, '');
    const absolute = path.resolve(root, relative);
    const rootPrefix = `${path.resolve(root)}${path.sep}`;
    if (!absolute.startsWith(rootPrefix)) return reply.code(404).send({ error: { message: 'content_not_found' } });

    const disposition = (req.query as { download?: string }).download === '1' ? 'attachment' : 'inline';
    const safeName = String(row.name).replace(/["\\\r\n]/g, '_');
    reply.type(row.mime || 'application/octet-stream');
    reply.header('content-disposition', `${disposition}; filename="${safeName}"`);
    return reply.send(createReadStream(absolute));
  } catch (error) {
    return handleRouteError(reply, req, error, 'get_my_storage_asset_content');
  }
}
