import { randomUUID } from 'node:crypto';
import type { RouteHandler } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { hash as argonHash } from 'argon2';
import { pool } from '@/db/client';
import { encryptTenantSecret, invalidateActiveTenantCache } from '@/core/tenant';
import { getActiveTenantKey, getActiveUserId } from '@/modules/_shared';
import { DEFAULT_USER_MODULES, listTenantModules, listUserModuleGrants, setUserModule } from '@/modules/entitlements/service';
import {
  tenantKeySchema,
  tenantOnboardSchema,
  tenantProfilePatchSchema,
  tenantRoleCreateSchema,
  tenantSecretUpsertSchema,
  workspaceInviteSchema,
  workspaceRolePatchSchema,
  workspaceUserModuleSchema,
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

type TenantAdminRow = TenantRow & {
  member_count: number | string;
  active_module_count: number | string;
  next_expires_at: Date | string | null;
};

function toTenantAdminDto(row: TenantAdminRow) {
  return {
    ...toTenantDto(row),
    member_count: Number(row.member_count) || 0,
    active_module_count: Number(row.active_module_count) || 0,
    next_expires_at: row.next_expires_at ?? null,
  };
}

// Süper-admin platform yönetimi: her tenant için özet (üye sayısı, aktif modül, en yakın süre bitişi).
// Public /tenants (login seçici) minimal kalır; bu uç yalnız admin scope'unda (requireAuth+requireAdmin).
export const listTenantsAdmin: RouteHandler = async () => {
  const [rows] = await pool.execute<TenantAdminRow[]>(
    `SELECT t.tenant_key, t.name, t.locale, t.status, t.plan,
            ts.value_json AS branding,
            COALESCE(mc.member_count, 0)        AS member_count,
            COALESCE(am.active_module_count, 0) AS active_module_count,
            am.next_expires_at                  AS next_expires_at
       FROM tenants t
       LEFT JOIN tenant_settings ts
              ON ts.tenant_key = t.tenant_key AND ts.\`key\` = 'branding'
       LEFT JOIN (
              SELECT tenant_key, COUNT(*) AS member_count
                FROM tenant_user_roles
               GROUP BY tenant_key
            ) mc ON mc.tenant_key = t.tenant_key
       LEFT JOIN (
              SELECT tenant_key,
                     COUNT(*)        AS active_module_count,
                     MIN(expires_at) AS next_expires_at
                FROM tenant_modules
               WHERE status IN ('active', 'trial')
               GROUP BY tenant_key
            ) am ON am.tenant_key = t.tenant_key
      ORDER BY FIELD(t.status, 'active') DESC,
               FIELD(t.tenant_key, 'vistaseeds', 'bereketfide', 'tarvista', 'default', 'avrasya'),
               t.name ASC`,
  );
  return rows.map(toTenantAdminDto);
};

// A2: Tenant detay — üyeler + rol + her üyenin aktif modülleri (default mail/calendar + user_modules grant).
// Süper-admin scope (/tenants/admin/:key/members). 2 sorgu, N+1 yok.
export const listTenantMembersAdmin: RouteHandler<{ Params: { key: string } }> = async (req, reply) => {
  const key = tenantKeySchema.safeParse(req.params.key);
  if (!key.success) return reply.code(400).send({ error: { message: 'invalid_tenant_key' } });

  const [memberRows] = await pool.execute<RowDataPacket[]>(
    `SELECT tur.user_id, tur.role, tur.created_at,
            u.email, u.full_name, u.is_active, u.last_sign_in_at,
            p.full_name AS profile_name
       FROM tenant_user_roles tur
       JOIN users u ON u.id = tur.user_id
       LEFT JOIN profiles p ON p.id = u.id
      WHERE tur.tenant_key = ?
      ORDER BY FIELD(tur.role, 'tenant_admin', 'tenant_editor'),
               COALESCE(p.full_name, u.full_name, u.email) ASC`,
    [key.data],
  );

  const [grantRows] = await pool.execute<RowDataPacket[]>(
    `SELECT um.user_id, um.module_key, COALESCE(mc.name, um.module_key) AS name
       FROM user_modules um
       LEFT JOIN module_catalog mc ON mc.module_key = um.module_key
      WHERE um.tenant_key = ? AND um.status = 'active'`,
    [key.data],
  );

  const grantsByUser = new Map<string, Array<{ module_key: string; name: string }>>();
  for (const g of grantRows) {
    const list = grantsByUser.get(g.user_id) ?? [];
    list.push({ module_key: g.module_key, name: g.name });
    grantsByUser.set(g.user_id, list);
  }

  const defaults = [...DEFAULT_USER_MODULES].map((m) => ({ module_key: m, name: m, default_on: true as const }));

  return {
    tenant_key: key.data,
    members: memberRows.map((m) => ({
      user_id: m.user_id,
      email: m.email,
      full_name: m.profile_name ?? m.full_name ?? null,
      role: m.role,
      is_active: Boolean(m.is_active),
      last_sign_in_at: m.last_sign_in_at ?? null,
      modules: [
        ...defaults,
        ...(grantsByUser.get(m.user_id) ?? []).map((g) => ({ ...g, default_on: false as const })),
      ],
    })),
  };
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

/**
 * Kişi-bazlı modül matrisi — tenant yöneticisinin kendi ekibi için (dashboard).
 * GET: workspace'teki her kullanıcı × tenant'ın aktif modülleri; her hücrede kullanıcı durumu.
 * default-açık modüller (mail/calendar) daima 'active' ve düzenlenemez.
 */
export const listWorkspaceUserModules: RouteHandler<{ Params: { userId: string } }> = async (req, reply) => {
  const tenantKey = getActiveTenantKey();
  if (!await requireTenantAdmin(req, reply, tenantKey)) return;
  const [tenantModules, grants] = await Promise.all([
    listTenantModules(tenantKey),
    listUserModuleGrants(tenantKey, req.params.userId),
  ]);
  const grantMap = new Map(grants.map((g) => [g.module_key, g.status]));
  return {
    user_id: req.params.userId,
    modules: tenantModules
      .filter((m) => m.status === 'active' || m.status === 'trial')
      .map((m) => ({
        module_key: m.module_key,
        name: m.name ?? m.module_key,
        category: m.category ?? null,
        default_on: DEFAULT_USER_MODULES.has(m.module_key),
        user_status: DEFAULT_USER_MODULES.has(m.module_key) ? 'active' : (grantMap.get(m.module_key) ?? 'none'),
      })),
  };
};

export const setWorkspaceUserModule: RouteHandler<{ Params: { userId: string }; Body: unknown }> = async (req, reply) => {
  const tenantKey = getActiveTenantKey();
  if (!await requireTenantAdmin(req, reply, tenantKey)) return;
  const parsed = workspaceUserModuleSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  if (DEFAULT_USER_MODULES.has(parsed.data.module_key)) {
    return reply.code(400).send({ error: { message: 'default_module_not_configurable' } });
  }
  // Hedef kullanıcı bu workspace'in üyesi olmalı (yabancı userId ile grant yazılamaz).
  const [memberRows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM tenant_user_roles WHERE tenant_key = ? AND user_id = ? LIMIT 1',
    [tenantKey, req.params.userId],
  );
  if (!memberRows[0]) return reply.code(404).send({ error: { message: 'user_not_in_workspace' } });
  // Yalnızca tenant'ın SAHİP OLDUĞU aktif modüller kullanıcıya atanabilir.
  const tenantModules = await listTenantModules(tenantKey);
  const owned = tenantModules.find((m) => m.module_key === parsed.data.module_key && (m.status === 'active' || m.status === 'trial'));
  if (!owned) return reply.code(400).send({ error: { message: 'module_not_owned_by_tenant' } });
  await setUserModule(tenantKey, req.params.userId, parsed.data.module_key, parsed.data.status);
  return { ok: true, module_key: parsed.data.module_key, status: parsed.data.status };
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
