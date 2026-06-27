import { and, eq, type SQL } from 'drizzle-orm';
import { env } from '@/core/env';
import { getRequestTenantKey } from '@/core/tenant-context';

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

export function tenantWhereSql(alias?: string): string {
  return `${alias ? `${alias}.` : ''}tenant_key = ?`;
}
