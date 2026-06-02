import { and, eq, type SQL } from 'drizzle-orm';
import { getActiveTenant } from '@/core/tenant';

type TenantScopedTable = {
  tenant_key: unknown;
};

export async function getActiveTenantKey(): Promise<string> {
  const tenant = await getActiveTenant();
  return tenant.key;
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
