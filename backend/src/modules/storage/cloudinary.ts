// =============================================================
// FILE: src/modules/storage/cloudinary.ts
// Amaç: STORAGE_DRIVER (local | cloudinary) + Cloudinary key'leri
//  - Öncelik: site_settings (runtime) → ENV (fallback)
// =============================================================
import { v2 as cloudinary } from "cloudinary";
import { env } from "../../core/env";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  getStorageSettings,
  type StorageSettings,
} from "../siteSettings";

type Driver = "local" | "cloudinary";

export type Cfg = {
  driver: Driver;
  cloudName: string;
  apiKey?: string;
  apiSecret?: string;
  defaultFolder?: string;
  unsignedUploadPreset?: string | null;
  localRoot?: string | null;
  localBaseUrl?: string | null;

  // ✅ site_settings üzerinden gelen public URL config'leri
  cdnPublicBase?: string | null;
  publicApiBase?: string | null;
};

export type UploadResult = {
  public_id: string;
  secure_url: string;
  bytes: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  resource_type?: string | null;
  version?: number | null;
  etag?: string | null;
};

export type RenameResult = {
  public_id: string;
  secure_url?: string;
  version?: number;
  format?: string;
};

/* -------------------------------------------------------------------------- */
/*                            CONFIG (CACHED)                                 */
/* -------------------------------------------------------------------------- */

let cachedCfg: Cfg | null = null;
let cachedAt = 0;
const CFG_CACHE_MS = 30_000; // 30sn cache

const envDriver = (): Driver =>
  (env.STORAGE_DRIVER || "").toLowerCase() === "local" ? "local" : "cloudinary";

async function loadStorageSettingsSafe(): Promise<StorageSettings | null> {
  try {
    return await getStorageSettings();
  } catch {
    return null;
  }
}

export async function getCloudinaryConfig(): Promise<Cfg | null> {
  const now = Date.now();
  if (cachedCfg && now - cachedAt < CFG_CACHE_MS) return cachedCfg;

  const settings = await loadStorageSettingsSafe();
  const driver: Driver = settings?.driver ?? envDriver();

  const cfg: Cfg = {
    driver,
    cloudName: settings?.cloudName || (driver === "local" ? "local" : ""),
    apiKey: settings?.apiKey || undefined,
    apiSecret: settings?.apiSecret || undefined,
    defaultFolder: settings?.folder || undefined,
    unsignedUploadPreset: settings?.unsignedUploadPreset ?? null,
    localRoot: settings?.localRoot ?? null,
    localBaseUrl: settings?.localBaseUrl ?? null,

    cdnPublicBase: settings?.cdnPublicBase ?? null,
    publicApiBase: settings?.publicApiBase ?? null,
  };

  if (driver === "cloudinary") {
    if (!cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) return null;

    cloudinary.config({
      cloud_name: cfg.cloudName,
      api_key: cfg.apiKey,
      api_secret: cfg.apiSecret,
      secure: true,
    });
  }

  cachedCfg = cfg;
  cachedAt = now;
  return cfg;
}

/* -------------------------------------------------------------------------- */
/*                              LOCAL YÜKLEME                                  */
/* -------------------------------------------------------------------------- */

type UpOpts = { folder?: string; publicId?: string; mime?: string };
type FsErrorLike = { code?: string };

function guessExt(mime?: string): string {
  if (!mime) return "";
  const m = mime.toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return ".jpg";
  if (m === "image/png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  return "";
}

/**
 * LOCAL driver:
 *  - root:
 *      1) cfg.localRoot (site_settings öncelikli)
 *      2) env.LOCAL_STORAGE_ROOT
 *      3) process.cwd()/uploads
 *  - Eğer mkdir EACCES alırsa, otomatik olarak process.cwd()/uploads'a düşer.
 *
 * ✅ KURAL: LOCAL'da public_id = relativePath (extension dahil)
 *    Çünkü delete/rename tarafında dosya yolunu unlink/rename ile kullanıyoruz.
 */
async function uploadLocal(cfg: Cfg, buffer: Buffer, opts: UpOpts): Promise<UploadResult> {
  const fallbackRoot = path.join(process.cwd(), "uploads");

  let root = cfg.localRoot || env.LOCAL_STORAGE_ROOT || fallbackRoot;

  const folder = (opts.folder ?? cfg.defaultFolder ?? "").replace(/^\/+|\/+$/g, "");

  const ext = guessExt(opts.mime);
  let baseName =
    (opts.publicId && opts.publicId.replace(/^\/+/, "")) ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // opts.publicId genelde ext'siz geliyor; local dosyada ext olsun
  if (ext && !baseName.includes(".")) baseName += ext;

  const relativePath = folder ? `${folder}/${baseName}` : baseName;

  let absDir = path.join(root, folder || ".");
  let absFile = path.join(root, relativePath);

  try {
    await fs.mkdir(absDir, { recursive: true });
  } catch (err: unknown) {
    const fsError = typeof err === "object" && err !== null ? (err as FsErrorLike) : {};
    if (fsError.code === "EACCES" || fsError.code === "EPERM") {
      root = fallbackRoot;
      absDir = path.join(root, folder || ".");
      absFile = path.join(root, relativePath);
      await fs.mkdir(absDir, { recursive: true });
    } else {
      throw err;
    }
  }

  await fs.writeFile(absFile, buffer);

  const baseUrlRaw = cfg.localBaseUrl || env.LOCAL_STORAGE_BASE_URL || "/uploads";
  const baseUrl = baseUrlRaw.replace(/\/+$/, "");
  const rel = relativePath.replace(/^\/+/, "");

  const url = `${baseUrl}/${rel}`;

  return {
    // ✅ IMPORTANT FIX: ext dahil
    public_id: rel,
    secure_url: url,
    bytes: buffer.length,
    width: null,
    height: null,
    format: ext ? ext.replace(".", "") : null,
    resource_type: "image",
    version: null,
    etag: null,
  };
}

/* -------------------------------------------------------------------------- */
/*                         CLOUDINARY (SIGNED) UPLOAD                          */
/* -------------------------------------------------------------------------- */

export async function uploadBufferAuto(cfg: Cfg, buffer: Buffer, opts: UpOpts): Promise<UploadResult> {
  const driver: Driver = cfg.driver ?? envDriver();

  if (driver === "local") {
    console.debug?.("[storage] uploadBufferAuto LOCAL", {
      folder: opts.folder ?? cfg.defaultFolder,
      publicId: opts.publicId,
      bytes: buffer.length,
    });
    return uploadLocal(cfg, buffer, opts);
  }

  const folder = opts.folder ?? cfg.defaultFolder;

  console.debug?.("[storage] uploadBufferAuto CLOUDINARY start", {
    cloud: cfg.cloudName,
    folder,
    publicId: opts.publicId,
    mime: opts.mime,
    bytes: buffer.length,
  });

  const rawResult = await new Promise<unknown>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: opts.publicId,
        resource_type: "auto",
        overwrite: true,
      },
      (err, res) => {
        if (err || !res) return reject(err ?? new Error("upload_failed"));
        resolve(res);
      },
    );
    stream.end(buffer);
  });

  const r = rawResult as {
    public_id?: string;
    secure_url?: string;
    bytes?: number;
    width?: number;
    height?: number;
    format?: string;
    resource_type?: string;
    version?: number;
    etag?: string;
  };

  if (!r.public_id || !r.secure_url) {
    console.error("[storage] uploadBufferAuto CLOUDINARY invalid_response", {
      cloud: cfg.cloudName,
      folder,
      publicId: opts.publicId,
    });
    throw new Error("cloudinary_invalid_response");
  }

  console.debug?.("[storage] uploadBufferAuto CLOUDINARY ok", {
    cloud: cfg.cloudName,
    public_id: r.public_id,
    bytes: r.bytes,
    format: r.format,
    resource_type: r.resource_type,
  });

  return {
    public_id: r.public_id,
    secure_url: r.secure_url,
    bytes: typeof r.bytes === "number" ? r.bytes : buffer.length,
    width: typeof r.width === "number" ? r.width : null,
    height: typeof r.height === "number" ? r.height : null,
    format: r.format ?? null,
    resource_type: r.resource_type ?? null,
    version: typeof r.version === "number" ? r.version : null,
    etag: r.etag ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/*                       SİLME / YENİDEN ADLANDIRMA                           */
/* -------------------------------------------------------------------------- */

export async function destroyCloudinaryById(
  publicId: string,
  resourceType?: string,
  provider?: string, // "local" | "cloudinary" | undefined
): Promise<void> {
  const cfg = await getCloudinaryConfig();

  const driverFromProvider: Driver | null =
    provider === "local" ? "local" : provider === "cloudinary" ? "cloudinary" : null;

  const driver: Driver = driverFromProvider ?? cfg?.driver ?? envDriver();

  if (driver === "local") {
    const root = cfg?.localRoot || env.LOCAL_STORAGE_ROOT || path.join(process.cwd(), "uploads");
    const rel = publicId.replace(/^\/+/, "");
    const abs = path.join(root, rel);
    try {
      await fs.unlink(abs);
    } catch {
      // dosya yoksa sessiz geç
    }
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType ?? "image",
    invalidate: true,
  });
}

export async function renameCloudinaryPublicId(
  oldPublicId: string,
  newPublicId: string,
  resourceType: string = "image",
  provider?: string,
): Promise<RenameResult> {
  const cfg = await getCloudinaryConfig();

  const driverFromProvider: Driver | null =
    provider === "local" ? "local" : provider === "cloudinary" ? "cloudinary" : null;

  const driver: Driver = driverFromProvider ?? cfg?.driver ?? envDriver();

  if (driver === "local") {
    const root = cfg?.localRoot || env.LOCAL_STORAGE_ROOT || path.join(process.cwd(), "uploads");
    const oldRel = oldPublicId.replace(/^\/+/, "");
    const newRel = newPublicId.replace(/^\/+/, "");
    const oldAbs = path.join(root, oldRel);
    const newAbs = path.join(root, newRel);

    await fs.mkdir(path.dirname(newAbs), { recursive: true });
    try {
      await fs.rename(oldAbs, newAbs);
    } catch {
      // yoksa sessiz geç
    }

    const baseUrlRaw = cfg?.localBaseUrl || env.LOCAL_STORAGE_BASE_URL || "/uploads";
    const baseUrl = baseUrlRaw.replace(/\/+$/, "");
    const rel = newRel.replace(/^\/+/, "");

    return {
      public_id: newRel,
      secure_url: `${baseUrl}/${rel}`,
    };
  }

  const raw = await cloudinary.uploader.rename(oldPublicId, newPublicId, {
    resource_type: resourceType,
    overwrite: true,
  });

  const r = raw as {
    public_id?: string;
    secure_url?: string;
    version?: number;
    format?: string;
  };

  return {
    public_id: r.public_id ?? newPublicId,
    secure_url: r.secure_url,
    version: r.version,
    format: r.format,
  };
}
