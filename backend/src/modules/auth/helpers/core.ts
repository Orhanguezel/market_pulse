import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { verify as argonVerify } from 'argon2';
import { env } from '../../../core/env';
import { repoCreateRefreshToken } from '../repository';

export type Role = 'admin' | 'editor' | 'carrier' | 'customer' | 'dealer';

export interface JWTPayload {
  sub: string;
  email?: string;
  role?: Role;
  purpose?: 'password_reset';
  iat?: number;
  exp?: number;
}

export interface JWTLike {
  sign: (p: JWTPayload, opts?: { expiresIn?: string | number }) => string;
  verify: (token: string) => JWTPayload;
}

type UserRow = { id: string; email: string | null; [k: string]: unknown };

/* -------------------- JWT -------------------- */

export function getJWT(app: FastifyInstance): JWTLike {
  return (app as unknown as { jwt: JWTLike }).jwt;
}

export function getJWTFromReq(req: FastifyRequest): JWTLike {
  return getJWT(req.server);
}

/* -------------------- Bearer -------------------- */

export function bearerFrom(req: FastifyRequest): string | null {
  const auth = (req.headers.authorization ?? '') as string;
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
  const token = cookies.access_token ?? cookies.accessToken;
  return token && token.length > 10 ? token : null;
}

/* -------------------- Cookies -------------------- */

const ACCESS_MAX_AGE = 60 * 15; // 15 dk
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
}

export function setAccessCookie(reply: FastifyReply, token: string) {
  const base = { ...cookieBase(), maxAge: ACCESS_MAX_AGE };
  reply.setCookie('access_token', token, base);
  reply.setCookie('accessToken', token, base);
}

export function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie('refresh_token', token, { ...cookieBase(), maxAge: REFRESH_MAX_AGE });
}

export function clearAuthCookies(reply: FastifyReply) {
  const base = { path: '/' };
  reply.clearCookie('access_token', base);
  reply.clearCookie('accessToken', base);
  reply.clearCookie('refresh_token', base);
}

/* -------------------- Token Issue -------------------- */

export async function issueTokens(app: FastifyInstance, u: UserRow, role: Role) {
  const jwt = getJWT(app);
  const access = jwt.sign(
    { sub: u.id, email: u.email ?? undefined, role },
    { expiresIn: `${ACCESS_MAX_AGE}s` },
  );

  const jti = randomUUID();
  const refreshRaw = `${jti}.${randomUUID()}`;
  await repoCreateRefreshToken(u.id, refreshRaw);

  return { access, refresh: refreshRaw };
}

/* -------------------- Password -------------------- */

export async function verifyPasswordSmart(storedHash: string, plain: string): Promise<boolean> {
  const allowTemp = env.ALLOW_TEMP_LOGIN === '1';
  if (allowTemp && storedHash.includes('temporary.hash.needs.reset')) {
    const expected = env.TEMP_PASSWORD || 'admin123';
    return plain === expected;
  }

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compare(plain, storedHash);
  }
  return argonVerify(storedHash, plain);
}

/* -------------------- Misc -------------------- */

export function parseAdminEmailAllowlist(): Set<string> {
  const raw = env.AUTH_ADMIN_EMAILS || '';
  const set = new Set<string>();
  raw
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e: string) => set.add(e));
  return set;
}

export { ACCESS_MAX_AGE };
