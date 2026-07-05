import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

export type ModuleStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

export interface ModuleCatalogItem {
  module_key: string;
  name: string;
  description: string | null;
  category: string;
  base_price: string | number;
  currency: string;
  billing_period: 'monthly' | 'yearly';
  is_active: 0 | 1;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface TenantModule {
  id: string;
  tenant_key: string;
  module_key: string;
  status: ModuleStatus;
  price_snapshot: string | number;
  currency: string;
  activated_at: string;
  expires_at: string | null;
  config: unknown;
  created_at: string;
  updated_at: string;
  name?: string;
  description?: string | null;
  category?: string;
}

export async function hasModule(tenantKey: string, moduleKey: string): Promise<boolean> {
  const [rows] = await pool.execute(
    `SELECT 1
       FROM tenant_modules
      WHERE tenant_key = ?
        AND module_key = ?
        AND status IN ('trial', 'active')
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1`,
    [tenantKey, moduleKey],
  );
  return (rows as unknown[]).length > 0;
}

// Herkese default-açık modüller (kişi izni gerekmez). Nav'da mail-yonetimi + takvim.
export const DEFAULT_USER_MODULES = new Set(['mail', 'calendar']);

/** Kullanıcı bu tenant'ta tenant_admin mi? (admin'ler tüm modülleri görür) */
export async function isTenantAdmin(tenantKey: string, userId: string): Promise<boolean> {
  const [rows] = await pool.execute(
    `SELECT 1 FROM tenant_user_roles WHERE tenant_key = ? AND user_id = ? AND role = 'tenant_admin' LIMIT 1`,
    [tenantKey, userId],
  );
  return (rows as unknown[]).length > 0;
}

/**
 * Kullanıcının GÖREBİLECEĞİ aktif modüller (kişi-bazlı).
 * fullAccess (super-admin veya tenant_admin) → tenant'ın tüm aktif modülleri.
 * Aksi halde: tenant-aktif modüllerden yalnızca default-açık (mail/calendar) VEYA
 * kullanıcıya açıkça verilmiş (user_modules active) olanlar.
 */
export async function listUserActiveModules(
  tenantKey: string,
  userId: string,
  fullAccess: boolean,
): Promise<TenantModule[]> {
  const tenantActive = await listActiveTenantModules(tenantKey);
  if (fullAccess) return tenantActive;
  const [rows] = await pool.execute(
    `SELECT module_key FROM user_modules WHERE tenant_key = ? AND user_id = ? AND status = 'active'`,
    [tenantKey, userId],
  );
  const granted = new Set((rows as Array<{ module_key: string }>).map((r) => r.module_key));
  return tenantActive.filter((m) => DEFAULT_USER_MODULES.has(m.module_key) || granted.has(m.module_key));
}

/** Admin (cross-tenant): kullanıcının üye olduğu tenant'lar + rolü. */
export async function listUserTenants(
  userId: string,
): Promise<Array<{ tenant_key: string; role: string }>> {
  const [rows] = await pool.execute(
    `SELECT tenant_key, role FROM tenant_user_roles WHERE user_id = ? ORDER BY created_at ASC`,
    [userId],
  );
  return rows as Array<{ tenant_key: string; role: string }>;
}

/** Admin: kullanıcının kişi-bazlı modül grant kayıtları. */
export async function listUserModuleGrants(
  tenantKey: string,
  userId: string,
): Promise<Array<{ module_key: string; status: string }>> {
  const [rows] = await pool.execute(
    `SELECT module_key, status FROM user_modules WHERE tenant_key = ? AND user_id = ?`,
    [tenantKey, userId],
  );
  return rows as Array<{ module_key: string; status: string }>;
}

/** Admin: kullanıcıya modül izni ver/askıya al (upsert). */
export async function setUserModule(
  tenantKey: string,
  userId: string,
  moduleKey: string,
  status: 'active' | 'suspended',
): Promise<void> {
  await pool.execute(
    `INSERT INTO user_modules (id, tenant_key, user_id, module_key, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = CURRENT_TIMESTAMP(3)`,
    [randomUUID(), tenantKey, userId, moduleKey, status],
  );
}

export async function listCatalog(): Promise<ModuleCatalogItem[]> {
  const [rows] = await pool.execute(
    `SELECT *
       FROM module_catalog
      ORDER BY sort ASC, module_key ASC`,
  );
  return rows as ModuleCatalogItem[];
}

export async function listTenantModules(tenantKey: string): Promise<TenantModule[]> {
  const [rows] = await pool.execute(
    `SELECT tm.*, mc.name, mc.description, mc.category
       FROM tenant_modules tm
       JOIN module_catalog mc ON mc.module_key = tm.module_key
      WHERE tm.tenant_key = ?
      ORDER BY mc.sort ASC, tm.module_key ASC`,
    [tenantKey],
  );
  return (rows as TenantModule[]).map(parseConfig);
}

export async function listActiveTenantModules(tenantKey: string): Promise<TenantModule[]> {
  const [rows] = await pool.execute(
    `SELECT tm.*, mc.name, mc.description, mc.category
       FROM tenant_modules tm
       JOIN module_catalog mc ON mc.module_key = tm.module_key
      WHERE tm.tenant_key = ?
        AND tm.status IN ('trial', 'active')
        AND (tm.expires_at IS NULL OR tm.expires_at > NOW())
      ORDER BY mc.sort ASC, tm.module_key ASC`,
    [tenantKey],
  );
  return (rows as TenantModule[]).map(parseConfig);
}

function parseConfig(row: TenantModule): TenantModule {
  if (typeof row.config !== 'string') return row;
  try {
    return { ...row, config: JSON.parse(row.config) };
  } catch {
    return row;
  }
}

export async function activateModule(
  tenantKey: string,
  moduleKey: string,
  opts: { status?: ModuleStatus; expiresAt?: string | null; config?: unknown } = {},
): Promise<TenantModule | null> {
  const status = opts.status ?? 'active';
  const [catalogRows] = await pool.execute(
    'SELECT base_price, currency FROM module_catalog WHERE module_key = ? AND is_active = 1 LIMIT 1',
    [moduleKey],
  );
  const catalog = (catalogRows as Array<{ base_price: string | number; currency: string }>)[0];
  if (!catalog) {
    const err = new Error('module_not_found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    `INSERT INTO tenant_modules
       (id, tenant_key, module_key, status, price_snapshot, currency, activated_at, expires_at, config)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       price_snapshot = VALUES(price_snapshot),
       currency = VALUES(currency),
       activated_at = CURRENT_TIMESTAMP,
       expires_at = VALUES(expires_at),
       config = VALUES(config)`,
    [
      randomUUID(),
      tenantKey,
      moduleKey,
      status,
      catalog.base_price,
      catalog.currency,
      opts.expiresAt ?? null,
      opts.config === undefined ? null : JSON.stringify(opts.config),
    ],
  );

  return getTenantModule(tenantKey, moduleKey);
}

export async function suspendModule(tenantKey: string, moduleKey: string): Promise<TenantModule | null> {
  await pool.execute(
    `UPDATE tenant_modules
        SET status = 'suspended'
      WHERE tenant_key = ? AND module_key = ?`,
    [tenantKey, moduleKey],
  );
  return getTenantModule(tenantKey, moduleKey);
}

async function getTenantModule(tenantKey: string, moduleKey: string): Promise<TenantModule | null> {
  const [rows] = await pool.execute(
    `SELECT tm.*, mc.name, mc.description, mc.category
       FROM tenant_modules tm
       JOIN module_catalog mc ON mc.module_key = tm.module_key
      WHERE tm.tenant_key = ? AND tm.module_key = ?
      LIMIT 1`,
    [tenantKey, moduleKey],
  );
  const row = (rows as TenantModule[])[0];
  return row ? parseConfig(row) : null;
}
