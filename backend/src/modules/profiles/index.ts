// src/modules/profiles/index.ts
// External module surface for profiles. Keep explicit; no export *.

export { registerProfiles } from './router';

export {
  getMyProfile,
  upsertMyProfile,
} from './controller';

export {
  repoGetProfileById,
  repoUpsertProfile,
} from './repository';

export {
  parseProfileBody,
  buildProfilePatch,
  buildProfileUpsertInsert,
  buildProfileUpdatePatch,
} from './helpers';

export {
  profileUpsertSchema,
} from './validation';

export { profiles } from './schema';
