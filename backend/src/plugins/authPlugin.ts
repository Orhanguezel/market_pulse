import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { enterUser } from '@/core/tenant-context';

type RouteAuthConfig = { auth?: boolean };

function readUserId(user: unknown): string | undefined {
  if (typeof user !== 'object' || user === null || Array.isArray(user)) return undefined;
  const record = user as Record<string, unknown>;
  const sub = record.sub ?? record.id;
  return sub ? String(sub) : undefined;
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS') return;
    if (process.env.DISABLE_AUTH === '1') return;

    const cfg = (req.routeOptions?.config ?? {}) as RouteAuthConfig;
    if (cfg.auth !== true) return;

    const hasAuthHeader = typeof req.headers.authorization === 'string';
    const hasCookie = Boolean(req.cookies?.access_token);
    if (!hasAuthHeader && !hasCookie) {
      return reply.code(401).send({ error: { message: 'no_token' } });
    }

    try {
      await req.jwtVerify();
      const userId = readUserId(req.user);
      if (userId) enterUser(userId);
    } catch {
      return reply.code(401).send({ error: { message: 'invalid_token' } });
    }
  });
};

export default fp(authPlugin);
