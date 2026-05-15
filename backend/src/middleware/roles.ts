import type { FastifyReply, FastifyRequest } from 'fastify';

export type AppRole = 'admin' | 'editor' | 'dealer';

type RequestUserRoleLike = {
  role?: unknown;
  roles?: unknown;
  is_admin?: unknown;
};

function readRequestUser(req: FastifyRequest): RequestUserRoleLike {
  const user = (req as FastifyRequest & { user?: unknown }).user;
  if (typeof user !== 'object' || user === null || Array.isArray(user)) {
    return {};
  }
  return user as RequestUserRoleLike;
}

function getRoleBag(req: FastifyRequest): { role?: string; roles: string[]; isAdmin: boolean } {
  const user = readRequestUser(req);
  return {
    role: typeof user.role === 'string' ? user.role : undefined,
    roles: Array.isArray(user.roles) ? user.roles.filter((role): role is string => typeof role === 'string') : [],
    isAdmin: user.is_admin === true,
  };
}

export function hasAnyRole(req: FastifyRequest, allowed: AppRole[]): boolean {
  const bag = getRoleBag(req);
  if (bag.isAdmin && allowed.includes('admin')) return true;
  if (bag.role && allowed.includes(bag.role as AppRole)) return true;
  return bag.roles.some((r: string) => allowed.includes(r as AppRole));
}

function forbiddenError(): Error {
  const err = new Error('forbidden');
  (err as Error & { statusCode: number }).statusCode = 403;
  return err;
}

export async function requireRoles(
  req: FastifyRequest,
  _reply: FastifyReply,
  allowed: AppRole[],
) {
  if (hasAnyRole(req, allowed)) return;
  throw forbiddenError();
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin']);
}

export async function requireEditor(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin', 'editor']);
}

export async function requireDealer(req: FastifyRequest, reply: FastifyReply) {
  return requireRoles(req, reply, ['admin', 'dealer']);
}
