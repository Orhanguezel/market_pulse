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
  app.addHook('onRequest', async (req, reply) => {
    const resolved = resolveTenant(req);
    if (!resolved.ok) {
      return reply.code(403).send({ error: { message: resolved.message } });
    }
    // tenant undefined ise (super-admin secim yapmadi) store'a yazma; okumalar env'e duser,
    // yazmalar getRequiredTenantKey ile reddedilir.
    if (resolved.tenant) enterTenant(resolved.tenant);
    // Kullanici context'i (owner-scope icin): requireAuth preHandler'da enterUser yapiyor ama
    // AsyncLocalStorage.enterWith preHandler'dan handler'a tasinmadigi icin getRequestUserId()
    // null donuyordu (owner-scoped tasks/reminders 401). Burada onRequest'te, tenant COZULDUKTEN
    // sonra best-effort verify + enterUser: tenant cozumu degismez, user id guvenilir set edilir.
    let uid = readUserId(req.user);
    if (!uid && (typeof req.headers.authorization === 'string' || Boolean(req.cookies?.access_token))) {
      try { await req.jwtVerify(); uid = readUserId(req.user); } catch { /* public/gecersiz token: user context yok */ }
    }
    if (uid) enterUser(uid);
  });
};

export const tenantContextPlugin = fp(tenantContextImpl, { name: 'tenant-context' });

export default tenantContextPlugin;
