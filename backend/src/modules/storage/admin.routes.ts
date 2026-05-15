// src/modules/storage/admin.routes.ts
import type { FastifyInstance } from "fastify";
import { adminListAssets, adminGetAsset, adminCreateAsset, adminPatchAsset, adminDeleteAsset } from "./admin.controller";
import { adminBulkCreateAssets, adminBulkDelete, adminListFolders, adminDiagCloudinary } from "./admin.controller.bulk";

export async function registerStorageAdmin(app: FastifyInstance) {
  const B = "/storage";

  app.get(`${B}/assets`, adminListAssets);
  app.get(`${B}/assets/:id`, adminGetAsset);
  app.post(`${B}/assets`, adminCreateAsset);
  app.post(`${B}/assets/bulk`, adminBulkCreateAssets);
  app.patch(`${B}/assets/:id`, adminPatchAsset);
  app.delete(`${B}/assets/:id`, adminDeleteAsset);
  app.post(`${B}/assets/bulk-delete`, adminBulkDelete);
  app.get(`${B}/folders`, adminListFolders);
  app.get(`${B}/_diag/cloud`, adminDiagCloudinary);
}
