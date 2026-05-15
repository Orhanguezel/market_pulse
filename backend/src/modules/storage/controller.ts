// =============================================================
// FILE: src/modules/storage/controller.ts
// Public route handler'lar — NO DB queries
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";
import type { MultipartFile } from "@fastify/multipart";

import { handleRouteError, maybeTrimUploadBuffer } from '../_shared';
import { getCloudinaryConfig, uploadBufferAuto } from "./cloudinary";
import { buildPublicUrl, stripLeadingSlashes } from "./util";
import { signMultipartBodySchema, type SignPutBody, type SignMultipartBody } from "./validation";
import { repoGetByBucketPath, repoInsert, repoIsDup, type StorageInsertInput } from "./repository";
import type { NewStorageAsset } from "./schema";

/* --------------------------------- helpers -------------------------------- */

const omitNullish = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;

const normalizePath = (bucket: string, raw: string) => {
  let p = stripLeadingSlashes(raw).replace(/\/{2,}/g, "/");
  if (p.startsWith(bucket + "/")) p = p.slice(bucket.length + 1);
  return p;
};

const toBool = (v: string | undefined): boolean => {
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
};

type WildcardParamsRequest = FastifyRequest & {
  params: { bucket: string; "*": string };
};

type FileRequest = FastifyRequest & {
  file?: () => Promise<MultipartFile | undefined>;
  user?: { id?: string | null } | null;
};

type ErrorWithMessage = { message?: string };

/* ---------------------------------- PUBLIC -------------------------------- */

/** GET/HEAD /storage/:bucket/* — provider URL'ye 302 */
export async function publicServe(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { bucket } = req.params as { bucket: string; "*": string };
    const raw = (req as WildcardParamsRequest).params["*"] || "";
    const path = normalizePath(bucket, raw);

    const row = await repoGetByBucketPath(bucket, path);
    if (!row) return reply.code(404).send({ message: "not_found" });

    const cfg = await getCloudinaryConfig();
    const redirectUrl = buildPublicUrl(bucket, path, row.url, cfg ?? undefined);
    return reply.redirect(redirectUrl, 302);
  } catch (e) {
    return handleRouteError(reply, req, e, "public_serve");
  }
}

/** POST /storage/:bucket/upload (FormData) — server-side upload */
export async function uploadToBucket(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { bucket } = req.params as { bucket: string };
    const query = req.query as { path?: string; upsert?: string };

    const cfg = await getCloudinaryConfig();
    if (!cfg) return reply.code(501).send({ message: "storage_not_configured" });

    let mp: MultipartFile | undefined;
    try {
      mp = await (req as FileRequest).file?.();
    } catch {
      return reply.code(400).send({ error: { code: "multipart_parse_error", message: "invalid_multipart_body" } });
    }
    if (!mp) return reply.code(400).send({ message: "file_required" });

    const rawBuf = await mp.toBuffer();
    const desiredRaw = (query.path ?? mp.filename ?? "file").trim();
    const desired = normalizePath(bucket, desiredRaw);
    const cleanName = desired.split("/").pop()!.replace(/[^\w.\-]+/g, "_");
    // Logo/favicon/og-image türü dosyalarda otomatik trim — header şişmesini
    // her projede ayrı ayrı CSS ile kovalamak zorunda kalma.
    const buf = await maybeTrimUploadBuffer(rawBuf, mp.mimetype, cleanName);
    const folderRaw = desired.includes("/") ? desired.split("/").slice(0, -1).join("/") : undefined;
    const folder = folderRaw || bucket; // bucket'ı her zaman folder olarak kullan
    const publicIdBase = cleanName.replace(/\.[^.]+$/, "");

    const up = await uploadBufferAuto(cfg, buf, { folder, publicId: publicIdBase, mime: mp.mimetype });

    const path = `${folder}/${cleanName}`;
    const recId = randomUUID();
    const provider = cfg.driver === "local" ? "local" : "cloudinary";

    const recordBase: NewStorageAsset = {
      id: recId,
      user_id: (req as FileRequest).user?.id ? String((req as FileRequest).user?.id) : null,
      name: cleanName, bucket, path, folder: folder ?? null,
      mime: mp.mimetype,
      size: typeof up.bytes === "number" ? up.bytes : buf.length,
      width: typeof up.width === "number" ? up.width : null,
      height: typeof up.height === "number" ? up.height : null,
      url: up.secure_url || null, hash: up.etag ?? null, etag: up.etag ?? null,
      provider, provider_public_id: up.public_id ?? null,
      provider_resource_type: up.resource_type ?? null,
      provider_format: up.format ?? null,
      provider_version: typeof up.version === "number" ? up.version : null,
      metadata: null,
    };

    const upsert = toBool(query.upsert);

    try {
      await repoInsert(omitNullish(recordBase) as StorageInsertInput);
    } catch (e: unknown) {
      if (repoIsDup(e)) {
        if (!upsert) return reply.code(409).send({ error: { code: "storage_conflict", message: "asset_already_exists" } });
        const existing = await repoGetByBucketPath(bucket, path);
        if (existing) {
          return reply.send({
            id: existing.id, bucket: existing.bucket, path: existing.path,
            folder: existing.folder ?? null,
            url: buildPublicUrl(existing.bucket, existing.path, existing.url, cfg),
            width: existing.width ?? null, height: existing.height ?? null,
            provider: existing.provider, provider_public_id: existing.provider_public_id ?? null,
            provider_resource_type: existing.provider_resource_type ?? null,
            provider_format: existing.provider_format ?? null,
            provider_version: existing.provider_version ?? null, etag: existing.etag ?? null,
          });
        }
        return reply.code(409).send({ error: { code: "storage_conflict", message: "asset_exists" } });
      }
      const message = typeof e === "object" && e !== null ? (e as Error).message : undefined;
      return reply.code(502).send({ error: { code: "storage_db_error", message: message ?? "db_insert_failed" } });
    }

    return reply.send({
      id: recId, bucket, path, folder: folder ?? null,
      url: buildPublicUrl(bucket, path, up.secure_url, cfg),
      width: up.width ?? null, height: up.height ?? null,
      provider, provider_public_id: up.public_id ?? null,
      provider_resource_type: up.resource_type ?? null,
      provider_format: up.format ?? null,
      provider_version: typeof up.version === "number" ? up.version : null,
      etag: up.etag ?? null,
    });
  } catch (e) {
    return handleRouteError(reply, req, e, "upload_to_bucket");
  }
}

/** POST /storage/uploads/sign-put — S3 yoksa 501 */
export async function signPut(_req: FastifyRequest, reply: FastifyReply) {
  return reply.code(501).send({ message: "s3_not_configured" });
}

/** POST /storage/uploads/sign-multipart — Cloudinary unsigned upload */
export async function signMultipart(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = signMultipartBodySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });

    const cfg = await getCloudinaryConfig();
    if (!cfg || cfg.driver === "local") return reply.code(501).send({ message: "cloudinary_not_configured" });

    const uploadPreset = cfg.unsignedUploadPreset;
    if (!uploadPreset) return reply.code(501).send({ message: "unsigned_upload_disabled" });

    const { filename, folder } = parsed.data;
    const clean = (filename || "file").replace(/[^\w.\-]+/g, "_");
    const publicId = clean.replace(/\.[^.]+$/, "");
    const upload_url = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`;
    const fields: Record<string, string> = { upload_preset: uploadPreset, folder: folder ?? "", public_id: publicId };

    return reply.send({ upload_url, fields });
  } catch (e) {
    return handleRouteError(reply, req, e, "sign_multipart");
  }
}
