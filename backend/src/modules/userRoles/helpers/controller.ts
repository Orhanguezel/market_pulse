// src/modules/userRoles/helpers/controller.ts
import type { UserRoleListQuery } from "../validation";

type ErrorWithCode = { code?: string };

export function parseUserRolesListParams(query: UserRoleListQuery) {
  return {
    user_id: query.user_id,
    role: query.role,
    direction: query.direction,
    limit: query.limit && query.limit > 0 ? query.limit : 50,
    offset: query.offset && query.offset >= 0 ? query.offset : 0,
  };
}

export function isDuplicateUserRoleError(err: unknown): boolean {
  return (err as ErrorWithCode)?.code === "ER_DUP_ENTRY";
}
