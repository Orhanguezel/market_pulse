import { randomUUID } from 'node:crypto';
import type { RouteHandler } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/db/client';
import { platformSettingsQuerySchema, platformSettingsUpsertSchema } from './validation';

function parseJson(value: unknown) {
  if (typeof value !== 'string') return value ?? null;
  try { return JSON.parse(value); } catch { return value; }
}

export const listPlatformSettings: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = platformSettingsQuerySchema.safeParse(req.query);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const locale = parsed.data.locale || '*';
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, \`key\`, locale, value, created_at, updated_at
       FROM platform_settings
      WHERE locale IN ('*', ?)
      ORDER BY \`key\` ASC, locale ASC`,
    [locale],
  );

  return rows.map((row) => ({
    id: row.id,
    key: row.key,
    locale: row.locale,
    value: parseJson(row.value),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

export const upsertPlatformSetting: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = platformSettingsUpsertSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  const body = parsed.data;

  await pool.execute(
    `INSERT INTO platform_settings (id, \`key\`, locale, value)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
    [randomUUID(), body.key, body.locale || '*', JSON.stringify(body.value)],
  );

  return { ok: true, key: body.key, locale: body.locale || '*' };
};
