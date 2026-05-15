// =============================================================
// FILE: src/modules/userRoles/controller.ts
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { isDuplicateUserRoleError, parseUserRolesListParams } from './helpers';
import { userRoleListQuerySchema, createUserRoleSchema } from './validation';
import { repoListUserRoles, repoCreateUserRole, repoDeleteUserRole } from './repository';

/** GET /user_roles */
export async function listUserRoles(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = userRoleListQuerySchema.parse(req.query ?? {});
    const rows = await repoListUserRoles(parseUserRolesListParams(q));
    return reply.send(rows);
  } catch (e) {
    return handleRouteError(reply, req, e, 'list_user_roles');
  }
}

/** POST /user_roles */
export async function createUserRole(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createUserRoleSchema.parse(req.body ?? {});
    const row = await repoCreateUserRole(body.user_id, body.role);
    return reply.code(201).send(row);
  } catch (err: unknown) {
    if (isDuplicateUserRoleError(err)) {
      return reply.code(409).send({ error: { message: 'user_role_already_exists' } });
    }
    return handleRouteError(reply, req, err, 'create_user_role');
  }
}

/** DELETE /user_roles/:id */
export async function deleteUserRole(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteUserRole(id);
    return reply.code(204).send();
  } catch (e) {
    return handleRouteError(reply, req, e, 'delete_user_role');
  }
}
