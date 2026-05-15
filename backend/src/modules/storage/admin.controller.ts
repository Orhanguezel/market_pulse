// =============================================================
// FILE: src/modules/storage/admin.controller.ts
// Admin handlers: list, get, create, patch, delete
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import { sql as dsql } from "drizzle-orm";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";

import { handleRouteError } from '../_shared';
import { storageListQuerySchema, storageUpdateSchema } from "./validation";
import { getCloudinaryConfig, uploadBufferAuto, destroyCloudinaryById, renameCloudinaryPublicId } from "./cloudinary";
import { buildPublicUrl, normalizeFolder } from "./util";
import { repoListAndCount, repoGetById, repoGetByBucketPath, repoInsert, repoUpdateById, repoDeleteById, repoIsDup, type StorageInsertInput } from "./repository";
import {
  buildStorageAssetRecord,
  buildStorageAssetResponse,
  buildStoragePatchSet,
  buildStorageRenamePublicId,
  getMultipartStringField,
  omitNullish,
  parseMultipartMetadata,
  resolveStoragePatchTargets,
  sanitizeName,
} from "./helpers";

type FileRequest = FastifyRequest & {
  file?: () => Promise<MultipartFile | undefined>;
  user?: { id?: string | null } | null;
};

type ErrorWithMessage = { message?: string };

/* ---------------------------------- LIST ---------------------------------- */

/** GET /admin/storage/assets */
export async function adminListAssets(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = storageListQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });

    const { rows, total } = await repoListAndCount(parsed.data);
    reply.header("x-total-count", String(total));
    reply.header("content-range", `*/${total}`);
    reply.header("access-control-expose-headers", "x-total-count, content-range");
    return reply.send(rows);
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_list_assets");
  }
}

/* ---------------------------------- GET ----------------------------------- */

/** GET /admin/storage/assets/:id */
export async function adminGetAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });

    const cfg = await getCloudinaryConfig();
    return reply.send({ ...row, url: buildPublicUrl(row.bucket, row.path, row.url, cfg ?? undefined) });
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_get_asset");
  }
}

/* --------------------------------- CREATE --------------------------------- */

/** POST /admin/storage/assets (multipart single file) */
export async function adminCreateAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const cfg = await getCloudinaryConfig();
    if (!cfg) return reply.code(501).send({ message: "storage_not_configured" });

    const mp: MultipartFile | undefined = await (req as FileRequest).file?.();
    if (!mp) return reply.code(400).send({ message: "file_required" });

    const buf = await mp.toBuffer();
    const fields = mp.fields as Record<string, MultipartValue>;

    const bucket = getMultipartStringField(fields, "bucket") ?? "default";
    const folder =
      normalizeFolder(getMultipartStringField(fields, "folder") ?? cfg.defaultFolder ?? null) ?? undefined;
    const metadata = parseMultipartMetadata(getMultipartStringField(fields, "metadata"));

    const cleanName = sanitizeName(mp.filename || "file");
    const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

    const up = await uploadBufferAuto(cfg, buf, { folder, publicId: publicIdBase, mime: mp.mimetype });

    const recId = randomUUID();
    const provider = cfg.driver === "local" ? "local" : "cloudinary";
    const recBase = buildStorageAssetRecord({
      id: recId,
      req: req as FileRequest,
      name: cleanName,
      bucket,
      folder,
      mime: mp.mimetype,
      upload: up,
      metadata,
      fallbackSize: buf.length,
      provider,
    });

    try {
      await repoInsert(omitNullish(recBase) as StorageInsertInput);
    } catch (e: unknown) {
      if (repoIsDup(e)) {
        const existing = await repoGetByBucketPath(bucket, recBase.path);
        if (existing) {
          return reply.code(200).send(buildStorageAssetResponse(existing, cfg));
        }
      }
      const message = typeof e === "object" && e !== null ? (e as ErrorWithMessage).message : undefined;
      return reply.code(502).send({ error: { where: "db_insert", message: message || "db_insert_failed" } });
    }

    const nowIso = new Date().toISOString();
    return reply.code(201).send({
      ...buildStorageAssetResponse(recBase, cfg),
      created_at: nowIso, updated_at: nowIso,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_create_asset");
  }
}

/* --------------------------------- PATCH ---------------------------------- */

/** PATCH /admin/storage/assets/:id */
export async function adminPatchAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const parsed = storageUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });

    const patch = parsed.data;
    const cur = await repoGetById(id);
    if (!cur) return reply.code(404).send({ error: { message: "not_found" } });

    const cfg = await getCloudinaryConfig();
    const { targetFolder, targetName, folderChanged, nameChanged } = resolveStoragePatchTargets(cur, patch);
    let renamed: Awaited<ReturnType<typeof renameCloudinaryPublicId>> | null = null;

    if (folderChanged || nameChanged) {
      if (cur.provider_public_id) {
        const newPublicId = buildStorageRenamePublicId(cur, targetFolder, targetName);
        renamed = await renameCloudinaryPublicId(
          cur.provider_public_id,
          newPublicId,
          cur.provider_resource_type || "image",
          cur.provider || undefined,
        );
      }
    }
    const sets = buildStoragePatchSet({ patch, current: cur, targetFolder, targetName, renamed });

    await repoUpdateById(id, sets);
    const fresh = await repoGetById(id);
    if (!fresh) return reply.code(404).send({ error: { message: "not_found" } });

    return reply.send({ ...fresh, url: buildPublicUrl(fresh.bucket, fresh.path, fresh.url, cfg ?? undefined) });
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_patch_asset");
  }
}

/* --------------------------------- DELETE --------------------------------- */

/** DELETE /admin/storage/assets/:id */
export async function adminDeleteAsset(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetById(id);
    if (!row) return reply.code(404).send({ error: { message: "not_found" } });

    try {
      const isLocal = (row.provider || "") === "local";
      const publicId = row.provider_public_id || (isLocal ? row.path : row.path.replace(/\.[^.]+$/, ""));
      await destroyCloudinaryById(publicId, row.provider_resource_type || undefined, row.provider || undefined);
    } catch { /* provider fail — continue DB delete */ }

    await repoDeleteById(id);
    return reply.code(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_delete_asset");
  }
}
