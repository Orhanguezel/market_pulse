import type { RouteHandler } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import {
  createExternalDbPool,
  repoCreateExternalDbConnection,
  repoDeleteExternalDbConnection,
  repoGetExternalDbConnection,
  repoGetExternalDbConnectionForRuntime,
  repoListExternalDbConnections,
  repoUpdateExternalDbConnection,
  repoUpdateExternalDbTestState,
} from './repository';
import { externalDbBodySchema, externalDbQueryBodySchema } from './validation';

const FORBIDDEN_SQL = /\b(drop|insert|update|delete|truncate|alter|create|replace|grant|revoke|call|load|outfile)\b/i;

function isSelectOnly(sql: string) {
  const trimmed = sql.trim().replace(/;+\s*$/, '');
  return /^select\b/i.test(trimmed) && !FORBIDDEN_SQL.test(trimmed);
}

async function withExternalPool<T>(id: string, fn: (pool: Awaited<ReturnType<typeof createExternalDbPool>>) => Promise<T>) {
  const row = await repoGetExternalDbConnectionForRuntime(id);
  if (!row) {
    const err = new Error('not_found');
    Object.assign(err, { statusCode: 404 });
    throw err;
  }

  const pool = await createExternalDbPool(row);
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

export const listExternalDbConnections: RouteHandler = async () => {
  return repoListExternalDbConnections();
};

export const createExternalDbConnection: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = externalDbBodySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  return reply.code(201).send(await repoCreateExternalDbConnection(parsed.data));
};

export const updateExternalDbConnection: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = externalDbBodySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
  const row = await repoUpdateExternalDbConnection(req.params.id, parsed.data);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return row;
};

export const deleteExternalDbConnection: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await repoDeleteExternalDbConnection(req.params.id);
  return reply.send({ ok: true });
};

export const testExternalDbConnection: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    await withExternalPool(req.params.id, async (externalPool) => {
      await externalPool.query('SHOW TABLES');
    });
    await repoUpdateExternalDbTestState(req.params.id, true);
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'test_failed';
    await repoUpdateExternalDbTestState(req.params.id, false, message).catch(() => undefined);
    return reply.code(400).send({ ok: false, error: { message } });
  }
};

export const listExternalDbTables: RouteHandler<{ Params: { id: string } }> = async (req) => {
  return withExternalPool(req.params.id, async (externalPool) => {
    const [rows] = await externalPool.query<RowDataPacket[]>(
      `SELECT table_name AS tableName
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
       ORDER BY table_name ASC`,
    );
    return rows.map((row) => ({ tableName: String(row.tableName) }));
  });
};

export const runExternalDbSelectQuery: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = externalDbQueryBodySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const sql = parsed.data.sql.trim().replace(/;+\s*$/, '');
  if (!isSelectOnly(sql)) return reply.code(400).send({ error: { message: 'select_only_query_required' } });

  return withExternalPool(req.params.id, async (externalPool) => {
    const [rows] = await externalPool.query<RowDataPacket[]>(sql);
    return { rows };
  });
};
