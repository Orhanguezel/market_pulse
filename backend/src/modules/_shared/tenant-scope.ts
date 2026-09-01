import { and, eq, type SQL } from 'drizzle-orm';
import { env } from '@/core/env';
import { getRequestTenantKey, getRequestUserId } from '@/core/tenant-context';

type TenantScopedTable = {
  tenant_key: unknown;
};

export function getActiveTenantKey(): string {
  return getRequestTenantKey() ?? env.TENANT_KEY ?? 'default';
}

/**
 * Yazma islemleri icin: aktif tenant ACIKCA secilmis olmali (X-Tenant/query veya
 * kullanicinin atanmis tenant'i). env fallback YOK — "switcher zorunlu" politikasi:
 * tenant secilmeden lead/icp/tarama kaydi yapilamaz (yanlis tenant'a cop birikmesin).
 */
export function getRequiredTenantKey(): string {
  const tenant = getRequestTenantKey();
  if (!tenant) {
    const err = new Error('tenant_not_selected') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
  return tenant;
}

export function getActiveUserId(): string | undefined {
  return getRequestUserId();
}

export function getRequiredUserId(): string {
  const userId = getRequestUserId();
  if (!userId) {
    const err = new Error('unauthorized') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  return userId;
}

export function tenantPredicate(
  table: TenantScopedTable,
  tenantKey: string,
): SQL<unknown> {
  return eq(table.tenant_key as never, tenantKey);
}

export function andTenant(
  table: TenantScopedTable,
  tenantKey: string,
  conditions: Array<SQL<unknown> | undefined>,
): SQL<unknown> {
  return and(tenantPredicate(table, tenantKey), ...conditions.filter(Boolean))!;
}

export function tenantValues<T extends Record<string, unknown>>(
  tenantKey: string,
  values: T,
): T & { tenant_key: string } {
  return { tenant_key: tenantKey, ...values };
}

type OwnerScopedTable = {
  tenant_key: unknown;
  owner_user_id: unknown;
};

/**
 * Kisi-bazli izolasyon: kullanici uclarinda (admin DEGIL) sorguyu owner_user_id ile
 * daraltir. `ownerUserId` null/undefined ise (admin path) sadece tenant filtresi uygulanir.
 * Drizzle where zinciri icin `andTenant`'in owner-farkinda surumu.
 */
export function andTenantOwner(
  table: OwnerScopedTable,
  tenantKey: string,
  ownerUserId: string | null | undefined,
  conditions: Array<SQL<unknown> | undefined>,
): SQL<unknown> {
  const scoped = ownerUserId
    ? [...conditions, eq(table.owner_user_id as never, ownerUserId)]
    : conditions;
  return andTenant(table, tenantKey, scoped);
}

/**
 * @deprecated GUVENLIK: req.url query string'i saldirgan kontrolunde — `?x=/admin/`
 * ekleyerek owner filtresi bypass edilebiliyordu. `ownerScopeForRequest` kullan.
 */
export function ownerScopeForUrl(url: string | undefined): string | null {
  if (url && url.includes('/admin/')) return null;
  return getActiveUserId() ?? null;
}

/**
 * Owner scope'u route KAYDINDAKI bayraktan cozer (spoof edilemez).
 * `config.ownerScope === 'user'` (veya lead-machine icin `leadMachineScope === 'user'`)
 * => aktif kullaniciyla sinirla; aksi halde tenant-geneli (admin) => null.
 * req.url'e ASLA bakma: query string saldirgan kontrolunde.
 */
export function ownerScopeForRequest(req: {
  routeOptions?: { config?: { ownerScope?: 'user' | 'admin'; leadMachineScope?: 'user' | 'admin' | 'public' } };
}): string | null {
  const cfg = req.routeOptions?.config;
  const isUser = cfg?.ownerScope === 'user' || cfg?.leadMachineScope === 'user';
  // Fail-closed: user scope'ta owner ZORUNLU (getRequiredUserId ctx yoksa 401 firlatir).
  // Boylece null owner ile filtre sessizce dusup tenant-geneli veri donmesi imkansiz.
  return isUser ? getRequiredUserId() : null;
}

export function tenantWhereSql(alias?: string): string {
  return `${alias ? `${alias}.` : ''}tenant_key = ?`;
}
