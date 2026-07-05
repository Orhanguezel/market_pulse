import { randomUUID } from 'node:crypto';
import type { RouteHandler } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { hash as argonHash } from 'argon2';
import { pool } from '@/db/client';
import { encryptTenantSecret, invalidateActiveTenantCache } from '@/core/tenant';
import { getActiveTenantKey, getActiveUserId } from '@/modules/_shared';
import {
  tenantKeySchema,
  tenantOnboardSchema,
  tenantProfilePatchSchema,
  tenantRoleCreateSchema,
  tenantSecretUpsertSchema,
  workspaceInviteSchema,
  workspaceRolePatchSchema,
} from './validation';

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

function isSuperAdmin(req: Parameters<RouteHandler>[0]) {
  const user = (req as unknown as { user?: Record<string, unknown> }).user;
  return user?.isSuperAdmin === true || user?.is_admin === true || user?.role === 'admin';
}

async function requireTenantAdmin(req: Parameters<RouteHandler>[0], reply: Parameters<RouteHandler>[1], tenantKey: string) {
  if (isSuperAdmin(req)) return true;
  const userId = getActiveUserId();
  if (!userId) {
    reply.code(401).send({ error: { message: 'unauthorized' } });
    return false;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1
       FROM tenant_user_roles
      WHERE tenant_key = ? AND user_id = ? AND role = 'tenant_admin'
      LIMIT 1`,
    [tenantKey, userId],
  );
  if (rows[0]) return true;
  reply.code(403).send({ error: { message: 'tenant_admin_required' } });
  return false;
}

async function workspaceMemberDto(tenantKey: string, userId: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT tur.id, tur.user_id, tur.tenant_key, tur.role, tur.created_at,
            u.email, u.full_name, u.is_active, u.email_verified, u.last_sign_in_at,
            p.full_name AS profile_name
       FROM tenant_user_roles tur
       JOIN users u ON u.id = tur.user_id
       LEFT JOIN profiles p ON p.id = u.id
      WHERE tur.tenant_key = ? AND tur.user_id = ?
      LIMIT 1`,
    [tenantKey, userId],
  );
  return rows[0] ?? null;
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

export const listWorkspaceUsers: RouteHandler = async (req, reply) => {
  const tenantKey = getActiveTenantKey();
  if (!await requireTenantAdmin(req, reply, tenantKey)) return;
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT tur.id, tur.user_id, tur.tenant_key, tur.role, tur.created_at,
            u.email, u.full_name, u.is_active, u.email_verified, u.last_sign_in_at,
            p.full_name AS profile_name
       FROM tenant_user_roles tur
       JOIN users u ON u.id = tur.user_id
       LEFT JOIN profiles p ON p.id = u.id
      WHERE tur.tenant_key = ?
      ORDER BY FIELD(tur.role, 'tenant_admin', 'tenant_editor'), COALESCE(p.full_name, u.full_name, u.email) ASC`,
    [tenantKey],
  );
  return rows;
};

export const inviteWorkspaceUser: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const tenantKey = getActiveTenantKey();
  if (!await requireTenantAdmin(req, reply, tenantKey)) return;
  const parsed = workspaceInviteSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  const body = parsed.data;
  const email = body.email.toLowerCase();

  const [existingRows] = await pool.execute<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  let userId = existingRows[0]?.id as string | undefined;
  let temporaryPassword: string | null = null;

  if (!userId) {
    userId = randomUUID();
    temporaryPassword = randomUUID().replace(/-/g, '').slice(0, 14);
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified)
       VALUES (?, ?, ?, ?, 1, 0)`,
      [userId, email, await argonHash(temporaryPassword), body.full_name ?? null],
    );
    await pool.execute(
      `INSERT INTO profiles (id, full_name, created_at, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE full_name = COALESCE(VALUES(full_name), full_name), updated_at = CURRENT_TIMESTAMP(3)`,
      [userId, body.full_name ?? null],
    );
  }

  await pool.execute(
    `INSERT INTO tenant_user_roles (id, user_id, tenant_key, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [randomUUID(), userId, tenantKey, body.role],
  );

  return reply.code(201).send({
    member: await workspaceMemberDto(tenantKey, userId),
    temporary_password: temporaryPassword,
  });
};

export const updateWorkspaceUserRole: RouteHandler<{ Params: { userId: string }; Body: unknown }> = async (req, reply) => {
  const tenantKey = getActiveTenantKey();
  if (!await requireTenantAdmin(req, reply, tenantKey)) return;
  const parsed = workspaceRolePatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  await pool.execute(
    'UPDATE tenant_user_roles SET role = ? WHERE tenant_key = ? AND user_id = ?',
    [parsed.data.role, tenantKey, req.params.userId],
  );
  const member = await workspaceMemberDto(tenantKey, req.params.userId);
  if (!member) return reply.code(404).send({ error: { message: 'not_found' } });
  return member;
};

export const removeWorkspaceUser: RouteHandler<{ Params: { userId: string } }> = async (req, reply) => {
  const tenantKey = getActiveTenantKey();
  if (!await requireTenantAdmin(req, reply, tenantKey)) return;
  if (getActiveUserId() === req.params.userId && !isSuperAdmin(req)) {
    return reply.code(400).send({ error: { message: 'cannot_remove_self' } });
  }
  await pool.execute('DELETE FROM tenant_user_roles WHERE tenant_key = ? AND user_id = ?', [tenantKey, req.params.userId]);
  return reply.code(204).send();
};

export const listTenantSecrets: RouteHandler<{ Params: { key: string } }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT \`key\`, created_at, updated_at
       FROM tenant_secrets
      WHERE tenant_key = ?
      ORDER BY \`key\` ASC`,
    [key.data],
  );

  return rows.map((row) => ({
    key: row.key,
    configured: true,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

export const upsertTenantSecret: RouteHandler<{ Params: { key: string }; Body: unknown }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });
  const parsed = tenantSecretUpsertSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  await pool.execute(
    `INSERT INTO tenant_secrets (tenant_key, \`key\`, value_encrypted)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value_encrypted = VALUES(value_encrypted), updated_at = CURRENT_TIMESTAMP`,
    [key.data, parsed.data.key, encryptTenantSecret(parsed.data.value)],
  );

  return reply.code(201).send({ ok: true, key: parsed.data.key });
};
