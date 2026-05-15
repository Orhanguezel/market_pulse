import type { FastifyRequest, FastifyReply } from "fastify";
import "@fastify/jwt";
import "@fastify/cookie";
import { setSentryUserContext } from "../plugins/sentry";

/** JWT payload'ın bizde aradığımız minimum alanları */
export interface JwtUser {
  sub?: string;
  email?: string;
  role?: string;
  roles?: string[];
  is_admin?: boolean;
  [k: string]: unknown;
}

function authError(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = 401;
  return err;
}

/**
 * Bearer-first + Cookie fallback
 * - Header: Authorization: Bearer <token>
 * - Cookies: access_token | accessToken
 * Bearer önceliklidir — admin panel gibi istemciler explicit Bearer gönderir,
 * stale cookie'lerin bunu ezmesi engellenir.
 */
export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    try {
      await req.jwtVerify<JwtUser>();
      const u = (req as unknown as { user?: JwtUser }).user;
      if (!u) throw authError("invalid_token");
      if (u.sub) setSentryUserContext(String(u.sub));
      return;
    } catch (err) {
      if (err instanceof Error && (err as Error & { statusCode?: number }).statusCode === 401) throw err;
      req.log.warn({ err }, "auth_failed");
      throw authError("invalid_token");
    }
  }

  const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
  const cookieToken = cookies.access_token ?? cookies.accessToken;

  if (cookieToken) {
    try {
      const payload = (await req.server.jwt.verify(cookieToken)) as JwtUser;
      (req as unknown as { user: JwtUser }).user = payload;
      if (payload.sub) setSentryUserContext(String(payload.sub));
      return;
    } catch {
      // Cookie token expired or invalid — no fallback left
    }
  }

  throw authError("no_token");
}
