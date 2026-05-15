// =============================================================
// FILE: src/integrations/endpoints/admin/db_admin.endpoints.ts
// =============================================================
import { baseApi } from '@/integrations/baseApi';
import type {
  DbImportResponse,
  SqlImportFileParams,
  SqlImportTextParams,
  SqlImportUrlParams,
  DbSnapshot,
  CreateDbSnapshotBody,
  DeleteSnapshotResponse,
} from '@/integrations/shared';

const ADMIN_BASE = '/admin/db';

export const dbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /* ---------------------------------------------------------
     * EXPORT: GET /admin/db/export  -> Blob (.sql)
     * --------------------------------------------------------- */
    exportSql: b.mutation<Blob, void>({
      query: () => ({
        url: `${ADMIN_BASE}/export`,
        method: 'GET',
        credentials: 'include',
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => new Blob([ab], { type: 'application/sql' }),
    }),

    /* ---------------------------------------------------------
     * MODULE EXPORT: GET /admin/db/export-module?module=...&upsert=1  -> Blob (.sql)
     * --------------------------------------------------------- */
    exportModuleSql: b.mutation<Blob, { module: string; upsert?: boolean }>({
      query: ({ module, upsert }) => ({
        url: `${ADMIN_BASE}/export-module`,
        method: 'GET',
        params: { module, upsert: upsert ? 1 : undefined },
        credentials: 'include',
        responseHandler: (resp: Response) => resp.arrayBuffer(),
      }),
      transformResponse: (ab: ArrayBuffer) => new Blob([ab], { type: 'application/sql' }),
    }),

    /* ---------------------------------------------------------
     * MODULE IMPORT: POST /admin/db/import-module
     * body: { module, sql, dryRun?, truncateBefore? }
     * --------------------------------------------------------- */
    importModuleSql: b.mutation<
      DbImportResponse,
      { module: string; sql: string; dryRun?: boolean; truncateBefore?: boolean }
    >({
      query: (body) => ({
        url: `${ADMIN_BASE}/import-module`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * MODULE MANIFEST VALIDATE: GET /admin/db/modules/validate
     * params: { module?: string[], includeDbTables?: boolean }
     * --------------------------------------------------------- */
    validateModuleManifest: b.query<
      {
        ok: boolean;
        okAll: boolean;
        db: { database: string };
        unknownRequested?: string[];
        dbTables?: string[];
        results: Array<{
          module: string;
          ok: boolean;
          tables: {
            expected: string[];
            present: string[];
            missing: string[];
          };
          suggestions: Record<string, string[]>;
        }>;
      },
      { module?: string[]; includeDbTables?: boolean } | void
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.module?.length) {
          for (const m of params.module) search.append('module', m);
        }
        if (params?.includeDbTables) search.append('includeDbTables', '1');
        const qs = search.toString();
        return {
          url: `${ADMIN_BASE}/modules/validate${qs ? `?${qs}` : ''}`,
          method: 'GET',
          credentials: 'include',
        };
      },
    }),

    /* ---------------------------------------------------------
     * IMPORT (TEXT): POST /admin/db/import-sql
     * body: { sql, dryRun?, truncateBefore? }
     * --------------------------------------------------------- */
    importSqlText: b.mutation<DbImportResponse, SqlImportTextParams>({
      query: (body) => ({
        url: `${ADMIN_BASE}/import-sql`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (URL): POST /admin/db/import-url
     * body: { url, dryRun?, truncateBefore? }  (gzip destekli)
     * --------------------------------------------------------- */
    importSqlUrl: b.mutation<DbImportResponse, SqlImportUrlParams>({
      query: (body) => ({
        url: `${ADMIN_BASE}/import-url`,
        method: 'POST',
        body,
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * IMPORT (FILE): POST /admin/db/import-file
     * multipart: file(.sql|.gz) + fields: truncateBefore?
     * (BE eski alan adı truncate_before_import'u da kabul ediyor)
     * --------------------------------------------------------- */
    importSqlFile: b.mutation<DbImportResponse, SqlImportFileParams>({
      query: ({ file, truncateBefore }) => {
        const form = new FormData();
        form.append('file', file, file.name);
        if (typeof truncateBefore !== 'undefined') {
          form.append('truncateBefore', String(!!truncateBefore));
          // eski alan adına da yazalım (tam uyumluluk)
          form.append('truncate_before_import', String(!!truncateBefore));
        }
        return {
          url: `${ADMIN_BASE}/import-file`,
          method: 'POST',
          body: form,
          credentials: 'include',
        };
      },
    }),


    /* ---------------------------------------------------------
     * SNAPSHOT LİSTESİ: GET /admin/db/snapshots
     * --------------------------------------------------------- */
    listDbSnapshots: b.query<DbSnapshot[], void>({
      query: () => ({
        url: `${ADMIN_BASE}/snapshots`,
        method: 'GET',
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT OLUŞTUR: POST /admin/db/snapshots
     * body: { label?, note? }
     * --------------------------------------------------------- */
    createDbSnapshot: b.mutation<DbSnapshot, CreateDbSnapshotBody | void>({
      query: (body) => ({
        url: `${ADMIN_BASE}/snapshots`,
        method: 'POST',
        body: body ?? {},
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT'TAN GERİ YÜKLE:
     * POST /admin/db/snapshots/:id/restore
     * body: { truncateBefore?: boolean, dryRun?: boolean }
     * --------------------------------------------------------- */
    restoreDbSnapshot: b.mutation<
      DbImportResponse,
      { id: string; dryRun?: boolean; truncateBefore?: boolean }
    >({
      query: ({ id, dryRun, truncateBefore }) => ({
        url: `${ADMIN_BASE}/snapshots/${encodeURIComponent(id)}/restore`,
        method: 'POST',
        body: {
          truncateBefore: truncateBefore ?? true,
          dryRun: dryRun ?? false,
        },
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SNAPSHOT SİL: DELETE /admin/db/snapshots/:id
     * --------------------------------------------------------- */
    deleteDbSnapshot: b.mutation<DeleteSnapshotResponse, { id: string }>({
      query: ({ id }) => ({
        url: `${ADMIN_BASE}/snapshots/${encodeURIComponent(id)}`,
        method: 'DELETE',
        credentials: 'include',
      }),
    }),

    /* ---------------------------------------------------------
     * SITE SETTINGS UI EXPORT: GET /admin/db/site-settings/ui-export
     * --------------------------------------------------------- */
    exportSiteSettingsUiJson: b.query<any, { fromLocale: string; prefix?: string[] }>({
      query: (params) => ({
        url: `${ADMIN_BASE}/site-settings/ui-export`,
        method: 'GET',
        params,
      }),
    }),

    /* ---------------------------------------------------------
     * SITE SETTINGS UI BOOTSTRAP: POST /admin/db/site-settings/ui-bootstrap
     * --------------------------------------------------------- */
    bootstrapSiteSettingsUiLocale: b.mutation<
      { ok: true; insertedOrUpdated?: number; error?: string },
      { sourceLocale: string; targetLocale: string; prefixes?: string[]; overwrite?: boolean }
    >({
      query: (body) => ({
        url: `${ADMIN_BASE}/site-settings/ui-bootstrap`,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useExportSqlMutation,
  useExportModuleSqlMutation,
  useImportModuleSqlMutation,
  useValidateModuleManifestQuery,
  useLazyValidateModuleManifestQuery,
  useImportSqlTextMutation,
  useImportSqlUrlMutation,
  useImportSqlFileMutation,
  // snapshot hooks:
  useListDbSnapshotsQuery,
  useCreateDbSnapshotMutation,
  useRestoreDbSnapshotMutation,
  useDeleteDbSnapshotMutation,
  // Site Settings UI bootstrap/export:
  useExportSiteSettingsUiJsonQuery,
  useBootstrapSiteSettingsUiLocaleMutation,
} = dbAdminApi;
