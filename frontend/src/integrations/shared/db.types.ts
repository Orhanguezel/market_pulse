// =============================================================
// FILE: src/integrations/types/db.types.ts
// =============================================================

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

/* =============================================================
 * MODULE Export/Import Types
 * ============================================================= */

export type ModuleExportFormat = 'sql' | 'json';

export type ExportModuleParams = {
  module: string; // ModuleKey (backend validate ediyor)
  format?: ModuleExportFormat; // default: 'sql'
};

/** SQL text ile module import */
export type ImportModuleSqlTextBody = {
  module: string;
  sqlText: string;
  truncateBefore?: boolean;
};

/** File ile module import (multipart) */
export type ImportModuleFileBody = {
  module: string;
  file: File;
  truncateBefore?: boolean;
};

export type ImportModuleBody = ImportModuleSqlTextBody | ImportModuleFileBody;

/* =============================================================
 * Site Settings UI Bulk Ops
 * ============================================================= */

export type SiteSettingsUiExportResponse = {
  data: Record<string, Record<string, unknown>>;
  locales: string[];
  keys: string[];
};

export type SiteSettingsUiBootstrapBody = {
  locale: string;
  fromLocale?: string;
  overwrite?: boolean;
  onlyUiKeys?: boolean;
};

/* =============================================================
 * Manifest Validation
 * ============================================================= */

export type ManifestValidateQuery = {
  module?: string[] | string;
  includeDbTables?: boolean | 0 | 1 | '0' | '1';
};

export type ManifestValidateResponse = {
  ok: boolean;
  summary?: {
    checkedModules: string[];
    totalTablesDeclared: number;
    duplicates: string[];
    unknownTablesInManifest?: string[];
    missingInDb?: string[];
  };
  results: Array<{
    module: string;
    ok: boolean;
    warnings: string[];
    errors: string[];
  }>;
};
