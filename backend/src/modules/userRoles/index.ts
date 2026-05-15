// src/modules/userRoles/index.ts
// External module surface for userRoles. Keep explicit; no export *.

export { registerUserRoles } from './router';

export {
  listUserRoles,
  createUserRole,
  deleteUserRole,
} from './controller';

export {
  getPrimaryRole,
} from './service';
export type {
  RoleName,
} from './service';

export {
  repoListUserRoles,
  repoCreateUserRole,
  repoDeleteUserRole,
} from './repository';

export {
  buildUserRolesWhere,
  getUserRolesOrder,
  parseUserRolesListParams,
  isDuplicateUserRoleError,
} from './helpers';
export type { UserRolesListParams } from './helpers';

export {
  userRoleListQuerySchema,
  createUserRoleSchema,
} from './validation';
export type {
  UserRoleListQuery,
  CreateUserRoleInput,
} from './validation';

export { userRoles } from './schema';
export type {
  UserRole,
  NewUserRole,
} from './schema';
