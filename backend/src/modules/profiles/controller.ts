// =============================================================
// FILE: src/modules/profiles/controller.ts
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getAuthUserId, handleRouteError } from "../_shared";
import { buildProfilePatch, parseProfileBody } from './helpers';
import { profileUpsertSchema } from './validation';
import { repoGetProfileById, repoUpsertProfile } from './repository';

/** GET /profiles/me */
export async function getMyProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const row = await repoGetProfileById(userId);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'profile_fetch');
  }
}

/** PUT /profiles/me */
export async function upsertMyProfile(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const input = profileUpsertSchema.parse(parseProfileBody(req.body));
    const row = await repoUpsertProfile(userId, buildProfilePatch(input));
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'profile_upsert');
  }
}
