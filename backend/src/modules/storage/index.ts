// src/modules/storage/index.ts
// External module surface for storage. Keep explicit; no export *.

export { registerStorage } from './router';
export { registerStorageAdmin } from './admin.routes';

export {
  publicServe,
  uploadToBucket,
  signPut,
  signMultipart,
} from './controller';

export {
  adminListAssets,
  adminGetAsset,
  adminCreateAsset,
  adminPatchAsset,
  adminDeleteAsset,
} from './admin.controller';

export {
  adminBulkCreateAssets,
  adminBulkDelete,
  adminListFolders,
  adminDiagCloudinary,
} from './admin.controller.bulk';

export {
  getCloudinaryConfig,
  uploadBufferAuto,
  destroyCloudinaryById,
  renameCloudinaryPublicId,
} from './cloudinary';

export {
  repoListAndCount,
  repoGetById,
  repoGetByIds,
  repoGetByBucketPath,
  repoInsert,
  repoUpdateById,
  repoDeleteById,
  repoDeleteManyByIds,
  repoListFolders,
  repoIsDup,
} from './repository';
export {
  buildStorageWhere,
  buildStorageOrderBy,
  resolveStoragePagination,
} from './helpers';

export {
  storageListQuerySchema,
  storageUpdateSchema,
  signPutBodySchema,
  signMultipartBodySchema,
} from './validation';
export type {
  StorageListQuery,
  StorageUpdateInput,
  SignPutBody,
  SignMultipartBody,
} from './validation';

export { storageAssets } from './schema';

export {
  buildPublicUrl,
  stripLeadingSlashes,
  normalizeFolder,
} from './util';
