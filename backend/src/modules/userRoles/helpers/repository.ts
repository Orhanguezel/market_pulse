// src/modules/userRoles/helpers/repository.ts
import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { userRoles } from "../schema";
import type { RoleName } from "../service";

export type UserRolesListParams = {
  user_id?: string;
  role?: RoleName;
  direction?: "asc" | "desc";
  limit: number;
  offset: number;
};

export function buildUserRolesWhere(params: UserRolesListParams) {
  const conditions: SQL[] = [];

  if (params.user_id) {
    conditions.push(eq(userRoles.user_id, params.user_id));
  }
  if (params.role) {
    conditions.push(eq(userRoles.role, params.role));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : and(...conditions);
}

export function getUserRolesOrder(direction?: "asc" | "desc") {
  const order = direction === "desc" ? desc : asc;
  return order(userRoles.created_at);
}
