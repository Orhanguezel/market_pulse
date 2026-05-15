// src/modules/auth/index.ts
// External module surface for auth. Keep explicit; no export *.

export { registerAuth } from './router';
export { registerUserAdmin } from './admin.routes';

export {
  signup,
  token,
  refresh,
  passwordResetRequest,
  passwordResetConfirm,
  me,
  status,
  update,
  logout,
} from './controller';

export {
  adminListUsers,
  adminGetUser,
  adminUpdateUser,
  adminSetUserActive,
  adminSetUserRoles,
  adminSetUserPassword,
  adminDeleteUser,
  adminGrantRole,
  adminMakeByEmail,
} from './admin.controller';

export {
  getJWT,
  getJWTFromReq,
  bearerFrom,
  setAccessCookie,
  setRefreshCookie,
  clearAuthCookies,
  issueTokens,
  verifyPasswordSmart,
  parseAdminEmailAllowlist,
  ACCESS_MAX_AGE,
} from './helpers';
export type { Role, JWTPayload, JWTLike } from './helpers';

export {
  repoGetUserByEmail,
  repoGetUserById,
  repoCreateUser,
  repoUpdateUserEmail,
  repoUpdateUserPassword,
  repoUpdateLastSignIn,
  repoAssignRole,
  repoEnsureProfileRow,
  repoCreateRefreshToken,
  repoGetRefreshToken,
  repoRevokeRefreshToken,
  repoRevokeAllUserRefreshTokens,
  repoRotateRefreshToken,
  repoCreatePasswordChangedNotification,
  repoAdminListUsers,
  repoAdminUpdateUser,
  repoAdminSetActive,
  repoAdminSetRoles,
  repoAdminSetPassword,
  repoAdminDeleteUser,
} from './repository';


export {
  signupBody,
  tokenBody,
  updateBody,
  googleBody,
  passwordResetRequestBody,
  passwordResetConfirmBody,
} from './validation';

export {
  adminListUsersQuery,
  adminUpdateUserBody,
  adminSetActiveBody,
  adminSetRolesBody,
  adminSetPasswordBody,
  adminRoleBody,
  adminMakeByEmailBody,
} from './admin.validation';

export {
  users,
  refresh_tokens,
} from './schema';
export type {
  User,
  NewUser,
  RefreshToken,
} from './schema';
