// src/modules/auth/helpers/index.ts
// Local helper barrel for auth module. Keep explicit; no export *.

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
} from './core';
export type { Role, JWTPayload, JWTLike } from './core';

export {
  formatAdminUserById,
  buildAdminUserPatch,
  resolveAdminPasswordChangedUserName,
  resolveAdminRoleTarget,
} from './admin-controller';

export {
  sha256,
  createRefreshTokenRaw,
  parseRefreshTokenJti,
  buildRefreshExpiryDate,
  buildAdminUsersWhere,
  resolveAdminUsersSort,
  buildAdminUserRoleRows,
  REFRESH_MAX_AGE,
} from './repository';
