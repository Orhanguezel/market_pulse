/* -------- Types -------- */
export type DbImportResponse = {
  ok: boolean;
  dryRun?: boolean;
  message?: string;
  error?: string;
};

export type SqlImportCommon = {
  /** Varolan verileri temizleyip içe aktar */
  truncateBefore?: boolean;
  /** İşlemi prova olarak çalıştır (yalnızca /import-sql ve /import-url destekler) */
  dryRun?: boolean;
};

export type SqlImportTextParams = SqlImportCommon & {
  /** Tam SQL script (utf8) */
  sql: string;
};

export type SqlImportUrlParams = SqlImportCommon & {
  /** .sql veya .sql.gz URL */
  url: string;
};

export type SqlImportFileParams = {
  /** .sql veya .gz dosya */
  file: File;
  /** Varolan verileri temizleyip içe aktar */
  truncateBefore?: boolean;
};

/* (ESKİ) Geriye dönük: bazı yerlerde bu tip adı geçiyorsa bozulmasın. */
export type SqlImportParams = {
  tenant?: string; // tenantsızda yok sayılır
  truncate_before_import?: boolean; // eski alan adı
};

/* -------- Snapshot Types -------- */
export type DbSnapshot = {
  id: string;
  filename?: string | null;
  label?: string | null;
  note?: string | null;
  created_at: string;
  size_bytes?: number | null;
};

export type CreateDbSnapshotBody = {
  label?: string;
  note?: string;
};

export type DeleteSnapshotResponse = {
  ok: boolean;
  message?: string;
};