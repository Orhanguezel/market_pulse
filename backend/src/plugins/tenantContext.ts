import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { env } from '@/core/env';
import { enterTenant, enterUser } from '@/core/tenant-context';
import type { JwtUser } from '@/middleware/auth';

function readUserId(user: unknown): string | undefined {
  if (typeof user !== 'object' || user === null || Array.isArray(user)) return undefined;
  const record = user as Record<string, unknown>;
  const sub = record.sub ?? record.id;
  return sub ? String(sub) : undefined;
}

function extractToken(req: { headers: Record<string, unknown>; cookies?: Record<string, unknown> }): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }
  const cookie = req.cookies?.access_token;
  return typeof cookie === 'string' && cookie ? cookie : undefined;
}

/**
 * JWT payload'unu SENKRON decode edip sub'u alir (imza DOGRULAMAZ). Amac: onRequest
 * hook'unda senkron `enterUser` yapabilmek (enterWith await sonrasi handler'a tasinmaz;
 * senkron cagri tasinir — enterTenant gibi). Guvenlik: imza dogrulamasi korunan tum
 * route'larda requireAuth preHandler'inda yapilir; sahte token requireAuth'ta 401 alir,
 * handler hic calismaz, dolayisiyla decode edilen sub gercek bir islemde kullanilmaz.
 */
function decodeJwtSub(token: string): string | undefined {
  const part = token.split('.')[1];
  if (!part) return undefined;
  try {
    const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
    const sub = payload.sub ?? payload.id;
    return sub ? String(sub) : undefined;
  } catch {
    return undefined;
  }
}

function firstString(value: unknown): string | undefined {
  if (Array.isArray(value)) return firstString(value[0]);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

type TenantResolution =
  | { ok: true; tenant: string | undefined }
  | { ok: false; message: 'tenant_forbidden' | 'no_tenant_assigned' };

function getRequestedTenant(req: { query?: unknown; headers: Record<string, unknown> }): string | undefined {
  const query = req.query && typeof req.query === 'object'
    ? req.query as Record<string, unknown>
    : {};
  return firstString(query.tenantKey)
    ?? firstString(req.headers['x-tenant']);
}

function getJwtUser(req: { user?: unknown }): JwtUser | null {
  if (!req.user || typeof req.user !== 'object') return null;
  return req.user as JwtUser;
}

function getAllowedTenants(user: JwtUser): string[] {
  return Array.isArray(user.tenants)
    ? user.tenants.filter((tenant): tenant is string => typeof tenant === 'string' && tenant.trim().length > 0)
    : [];
}

function resolveTenant(req: { query?: unknown; headers: Record<string, unknown>; user?: unknown }): TenantResolution {
  const requested = getRequestedTenant(req);
  const user = getJwtUser(req);

  if (!user) {
    return { ok: true, tenant: env.TENANT_KEY ?? 'default' };
  }

  if (user.isSuperAdmin) {
    // "Switcher zorunlu": super-admin acikca tenant secmeli (X-Tenant/query). Sessizce
    // env/default'a DUSMEZ — secim yoksa store unset kalir; okumalar env'e duser (esnek)
    // ama yazmalar getRequiredTenantKey ile reddedilir (yanlis tenant'a cop birikmesin).
    return { ok: true, tenant: requested };
  }

  const tenants = getAllowedTenants(user);
  if (requested && !tenants.includes(requested)) {
    return { ok: false, message: 'tenant_forbidden' };
  }

  const tenant = requested ?? user.defaultTenant ?? undefined;
  if (!tenant) {
    return { ok: false, message: 'no_tenant_assigned' };
  }

  return { ok: true, tenant };
}

// fp ile sarılır ki onRequest hook'u izole edilmesin ve TÜM route'lara uygulansın.
// (Sarılmazsa hook sadece bu plugin'in alt scope'una etki eder → route'lar tenant context görmez.)
const tenantContextImpl: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', (req, reply, done) => {
    const resolved = resolveTenant(req);
    if (!resolved.ok) {
      void reply.code(403).send({ error: { message: resolved.message } });
      return;
    }
    // tenant undefined ise (super-admin secim yapmadi) store'a yazma; okumalar env'e duser,
    // yazmalar getRequiredTenantKey ile reddedilir.
    if (resolved.tenant) enterTenant(resolved.tenant);
    // Kullanici context'i (owner-scope icin): requireAuth preHandler'da enterUser cagriliyor ama
    // AsyncLocalStorage.enterWith preHandler'dan handler'a TASINMIYOR → getRequestUserId() null →
    // owner-scoped tasks/reminders 401. Cozum: burada (onRequest) SENKRON decode + enterUser.
    // Senkron enterWith handler'a tasinir (enterTenant gibi). Imza dogrulamasi requireAuth'ta.
    let uid = readUserId(req.user);
    if (!uid) {
      const token = extractToken(req);
      if (token) uid = decodeJwtSub(token);
    }
    if (uid) enterUser(uid);
    done();
  });
};

export const tenantContextPlugin = fp(tenantContextImpl, { name: 'tenant-context' });

export default tenantContextPlugin;
