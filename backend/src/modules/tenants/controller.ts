import { randomUUID } from 'node:crypto';
import type { RouteHandler } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/db/client';
import { invalidateActiveTenantCache } from '@/core/tenant';
import { tenantKeySchema, tenantOnboardSchema, tenantProfilePatchSchema, tenantRoleCreateSchema } from './validation';

type TenantRow = RowDataPacket & {
  tenant_key: string;
  name: string;
  locale: string;
  status: string;
  plan: string;
  branding: unknown;
};

function parseJson(value: unknown) {
  if (typeof value !== 'string') return value ?? null;
  try { return JSON.parse(value); } catch { return value; }
}

function toTenantDto(row: TenantRow) {
  return {
    key: row.tenant_key,
    name: row.name,
    locale: row.locale,
    status: row.status,
    plan: row.plan,
    branding: parseJson(row.branding) ?? {},
  };
}

async function upsertTenantSetting(tenantKey: string, key: string, value: unknown) {
  await pool.execute(
    `INSERT INTO tenant_settings (tenant_key, \`key\`, value_json)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP`,
    [tenantKey, key, JSON.stringify(value ?? {})],
  );
  invalidateActiveTenantCache();
}

export const listTenants: RouteHandler = async () => {
  const [rows] = await pool.execute<TenantRow[]>(
    `SELECT t.tenant_key, t.name, t.locale, t.status, t.plan, ts.value_json AS branding
       FROM tenants t
       LEFT JOIN tenant_settings ts ON ts.tenant_key = t.tenant_key AND ts.\`key\` = 'branding'
      WHERE t.status = 'active'
      ORDER BY FIELD(t.tenant_key, 'vistaseeds', 'bereketfide', 'tarvista', 'default', 'avrasya'), t.name ASC`,
  );
  return rows.map(toTenantDto);
};

export const getTenant: RouteHandler<{ Params: { key: string } }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });

  const [rows] = await pool.execute<TenantRow[]>(
    `SELECT t.tenant_key, t.name, t.locale, t.status, t.plan, ts.value_json AS branding
       FROM tenants t
       LEFT JOIN tenant_settings ts ON ts.tenant_key = t.tenant_key AND ts.\`key\` = 'branding'
      WHERE t.tenant_key = ?
      LIMIT 1`,
    [key.data],
  );
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return toTenantDto(rows[0]);
};

export const onboardTenant: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = tenantOnboardSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  const body = parsed.data;

  await pool.execute(
    `INSERT INTO tenants (tenant_key, name, locale, status, plan)
     VALUES (?, ?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), locale = VALUES(locale), status = 'active', plan = VALUES(plan)`,
    [body.tenant_key, body.name, body.locale, body.plan],
  );

  await upsertTenantSetting(body.tenant_key, 'branding', {
    appName: 'MarketPulse',
    displayName: body.name,
    logoUrl: '',
    sector: 'platform',
    ...body.branding,
  });
  if (body.external_db) await upsertTenantSetting(body.tenant_key, 'external_db', body.external_db);
  if (body.external_erp) await upsertTenantSetting(body.tenant_key, 'external_erp', body.external_erp);

  return reply.code(201).send({ ok: true, key: body.tenant_key });
};

export const updateTenantProfile: RouteHandler<{ Params: { key: string }; Body: unknown }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });
  const parsed = tenantProfilePatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  const body = parsed.data;

  if (body.name || body.locale || body.status || body.plan) {
    await pool.execute(
      `UPDATE tenants
          SET name = COALESCE(?, name),
              locale = COALESCE(?, locale),
              status = COALESCE(?, status),
              plan = COALESCE(?, plan)
        WHERE tenant_key = ?`,
      [body.name ?? null, body.locale ?? null, body.status ?? null, body.plan ?? null, key.data],
    );
  }

  if (body.branding) await upsertTenantSetting(key.data, 'branding', body.branding);
  if (body.settings) {
    for (const [settingKey, value] of Object.entries(body.settings)) {
      await upsertTenantSetting(key.data, settingKey, value);
    }
  }

  return { ok: true, key: key.data };
};

export const listTenantRoles: RouteHandler<{ Params: { key: string } }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT tr.id, tr.user_id, tr.tenant_key, tr.role, tr.created_at, u.email, u.full_name
       FROM tenant_user_roles tr
       LEFT JOIN users u ON u.id = tr.user_id
      WHERE tr.tenant_key = ?
      ORDER BY tr.created_at DESC`,
    [key.data],
  );
  return rows;
};

export const createTenantRole: RouteHandler<{ Params: { key: string }; Body: unknown }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });
  const parsed = tenantRoleCreateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  await pool.execute(
    `INSERT INTO tenant_user_roles (id, user_id, tenant_key, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [randomUUID(), parsed.data.user_id, key.data, parsed.data.role],
  );
  return reply.code(201).send({ ok: true });
};
