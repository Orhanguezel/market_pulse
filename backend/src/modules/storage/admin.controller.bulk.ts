// =============================================================
// FILE: src/modules/storage/admin.controller.bulk.ts
// Admin handlers: bulk create, bulk delete, folders, diag
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import type { MultipartFile, MultipartValue } from "@fastify/multipart";

import { handleRouteError } from '../_shared';
import { getCloudinaryConfig, uploadBufferAuto, destroyCloudinaryById, type UploadResult } from "./cloudinary";
import { buildPublicUrl, normalizeFolder } from "./util";
import { repoGetByBucketPath, repoGetByIds, repoInsert, repoDeleteManyByIds, repoIsDup, repoListFolders, type StorageInsertInput } from "./repository";
import {
  buildStorageAssetRecord,
  buildStorageAssetResponse,
  omitNullish,
  sanitizeName,
} from "./helpers";

type BulkBody = { ids?: unknown };
type PartsRequest = FastifyRequest & {
  parts?: () => AsyncIterable<MultipartFile | MultipartValue>;
  user?: { id?: string | null } | null;
};
type CloudinaryApiLike = { api?: { ping?: () => Promise<unknown> } };
type ErrorWithMessage = { message?: string; http_code?: number; name?: string };

/* ------------------------------ BULK DELETE ------------------------------- */

/** POST /admin/storage/assets/bulk-delete { ids: string[] } */
export async function adminBulkDelete(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req.body ?? {}) as BulkBody;
    const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean).map(String) : [];
    if (!ids.length) return reply.send({ deleted: 0 });

    const rows = await repoGetByIds(ids);
    if (!rows.length) return reply.send({ deleted: 0 });

    for (const r of rows) {
      const isLocal = (r.provider || "") === "local";
      const pid = r.provider_public_id || (isLocal ? r.path : r.path.replace(/\.[^.]+$/, ""));
      try {
        await destroyCloudinaryById(pid, r.provider_resource_type || undefined, r.provider || undefined);
      } catch { /* provider fail — continue */ }
    }

    await repoDeleteManyByIds(rows.map((r) => r.id));
    return reply.send({ deleted: rows.length });
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_bulk_delete");
  }
}

/* ------------------------------ BULK CREATE ------------------------------ */

/** POST /admin/storage/assets/bulk (multipart mixed: fields + files...) */
export async function adminBulkCreateAssets(req: FastifyRequest, reply: FastifyReply) {
  try {
    const cfg = await getCloudinaryConfig();
    if (!cfg) return reply.code(501).send({ message: "storage_not_configured" });

    const partsIt = typeof (req as PartsRequest).parts === "function" ? (req as PartsRequest).parts?.() ?? null : null;
    if (!partsIt || typeof partsIt[Symbol.asyncIterator] !== "function") {
      return reply.code(400).send({ message: "multipart_required" });
    }

    let formBucket: string | undefined;
    let formFolder: string | null | undefined;
    let formMeta: Record<string, string> | null = null;
    const out: unknown[] = [];

    for await (const part of partsIt) {
      if (part.type === "field") {
        if (part.fieldname === "bucket") formBucket = String(part.value || "");
        if (part.fieldname === "folder") formFolder = normalizeFolder(String(part.value || ""));
        if (part.fieldname === "metadata") {
          try { formMeta = JSON.parse(String(part.value || "")); } catch { formMeta = null; }
        }
        continue;
      }
      if (part.type !== "file") continue;

      const buf = await part.toBuffer();
      const bucket = formBucket || "default";
      const folder = formFolder ?? undefined;
      const cleanName = sanitizeName(part.filename || "file");
      const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

      let up: UploadResult;
      try {
        up = await uploadBufferAuto(cfg, buf, { folder, publicId: publicIdBase, mime: part.mimetype });
      } catch (e: unknown) {
        const err = typeof e === "object" && e !== null ? (e as ErrorWithMessage) : {};
        out.push({ file: cleanName, error: { where: "cloudinary_upload", message: err.message, http: err.http_code ?? null } });
        continue;
      }

      const recId = randomUUID();
      const provider = cfg.driver === "local" ? "local" : "cloudinary";
      const recBase = buildStorageAssetRecord({
        id: recId,
        req: req as PartsRequest,
        name: cleanName,
        bucket,
        folder,
        mime: part.mimetype,
        upload: up,
        metadata: formMeta,
        fallbackSize: buf.length,
        provider,
      });

      try {
        await repoInsert(omitNullish(recBase) as StorageInsertInput);
        out.push(buildStorageAssetResponse(recBase, cfg));
      } catch (e: unknown) {
        if (repoIsDup(e)) {
          const existing = await repoGetByBucketPath(bucket, recBase.path);
          if (existing) {
            out.push(buildStorageAssetResponse(existing, cfg));
            continue;
          }
        }
        const err = typeof e === "object" && e !== null ? (e as ErrorWithMessage) : {};
        out.push({ file: cleanName, error: { where: "db_insert", message: err.message ?? "db_insert_failed" } });
      }
    }

    return reply.send({ count: out.length, items: out });
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_bulk_create");
  }
}

/* -------------------------------- FOLDERS --------------------------------- */

/** GET /admin/storage/folders */
export async function adminListFolders(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const folders = await repoListFolders();
    return reply.send(folders);
  } catch (e) {
    return handleRouteError(reply, _req, e, "admin_list_folders");
  }
}

/* ---------------------------------- DIAG ---------------------------------- */

/** GET /admin/storage/_diag/cloud */
export async function adminDiagCloudinary(req: FastifyRequest, reply: FastifyReply) {
  try {
    const cfg = await getCloudinaryConfig();
    if (!cfg || cfg.driver === "local") return reply.code(501).send({ message: "cloudinary_not_configured" });

    try {
      await (cloudinary as CloudinaryApiLike).api?.ping?.();
    } catch (e: unknown) {
      const err = typeof e === "object" && e !== null ? (e as ErrorWithMessage) : {};
      return reply.code(502).send({ step: "api.ping", error: { name: err.name, msg: err.message, http: err.http_code } });
    }

    const tiny = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMBg/4qQpwAAAAASUVORK5CYII=",
      "base64",
    );

    const up = await uploadBufferAuto(cfg, tiny, { folder: "diag", publicId: `ping_${Date.now()}` });
    return reply.send({ ok: true, cloud: cfg.cloudName, uploaded: { public_id: up.public_id, secure_url: up.secure_url } });
  } catch (e) {
    return handleRouteError(reply, req, e, "admin_diag_cloudinary");
  }
}
