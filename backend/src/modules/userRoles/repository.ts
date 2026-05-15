// =============================================================
// FILE: src/modules/userRoles/repository.ts
// =============================================================
import { db } from '../../db/client';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { buildUserRolesWhere, getUserRolesOrder, type UserRolesListParams } from './helpers';
import { userRoles } from './schema';
import type { RoleName } from './service';

export async function repoListUserRoles(params: UserRolesListParams) {
  let qb = db.select().from(userRoles).$dynamic();
  const where = buildUserRolesWhere(params);
  if (where) qb = qb.where(where);

  qb = qb.orderBy(getUserRolesOrder(params.direction)).limit(params.limit).offset(params.offset);

  return qb;
}

export async function repoCreateUserRole(userId: string, role: RoleName) {
  const id = randomUUID();
  await db.insert(userRoles).values({ id, user_id: userId, role });
  const [row] = await db.select().from(userRoles).where(eq(userRoles.id, id)).limit(1);
  return row;
}

export async function repoDeleteUserRole(id: string) {
  await db.delete(userRoles).where(eq(userRoles.id, id));
}
