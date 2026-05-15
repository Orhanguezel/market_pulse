import mysql, { type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { createCipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { env } from '@/core/env';
import { decryptExternalPassword } from '@/db/external';

export type ExternalDbConnectionDto = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  host: string;
  port: number;
  db_name: string;
  username: string;
  is_active: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  last_error: string | null;
};

type ExternalDbConnectionRow = RowDataPacket & {
  id: string;
  key: string;
  name: string;
  description: string | null;
  host: string;
  port: number;
  db_name: string;
  username: string;
  password_enc: string | null;
  is_active: number;
  last_tested_at: string | null;
  last_test_ok: number | null;
  last_error: string | null;
};

export type ExternalDbInput = {
  key?: string;
  name: string;
  description?: string | null;
  host: string;
  port: number;
  db_name: string;
  username: string;
  password?: string;
  is_active?: boolean;
};

function toDto(row: ExternalDbConnectionRow): ExternalDbConnectionDto {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    host: row.host,
    port: Number(row.port || 3306),
    db_name: row.db_name,
    username: row.username,
    is_active: row.is_active === 1,
    last_tested_at: row.last_tested_at,
    last_test_ok: row.last_test_ok == null ? null : row.last_test_ok === 1,
    last_error: row.last_error,
  };
}

function encryptionKey() {
  if (!env.DB_ENCRYPTION_KEY) return null;
  return createHash('sha256').update(env.DB_ENCRYPTION_KEY).digest();
}

function encryptPassword(password?: string): string | null | undefined {
  if (password === undefined) return undefined;
  if (!password) return null;
  const key = encryptionKey();
  if (!key) {
    const err = new Error('db_encryption_key_required');
    Object.assign(err, { statusCode: 400 });
    throw err;
  }

  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return `${iv.toString('base64')}:${encrypted.toString('base64')}`;
}

export async function repoListExternalDbConnections() {
  const [rows] = await pool.query<ExternalDbConnectionRow[]>(
    `SELECT id, \`key\`, name, description, host, port, db_name, username, password_enc,
            is_active, last_tested_at, last_test_ok, last_error
     FROM external_db_connections
     ORDER BY name ASC`,
  );
  return rows.map(toDto);
}

async function repoGetExternalDbConnectionRow(id: string) {
  const [rows] = await pool.query<ExternalDbConnectionRow[]>(
    `SELECT id, \`key\`, name, description, host, port, db_name, username, password_enc,
            is_active, last_tested_at, last_test_ok, last_error
     FROM external_db_connections
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function repoGetExternalDbConnection(id: string) {
  const row = await repoGetExternalDbConnectionRow(id);
  return row ? toDto(row) : null;
}

export async function repoGetExternalDbConnectionForRuntime(id: string) {
  return repoGetExternalDbConnectionRow(id);
}

export async function repoCreateExternalDbConnection(input: ExternalDbInput) {
  const id = randomUUID();
  await pool.query<ResultSetHeader>(
    `INSERT INTO external_db_connections
       (id, \`key\`, name, description, host, port, db_name, username, password_enc, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      (input.key || input.name).toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      input.name,
      input.description ?? null,
      input.host,
      input.port || 3306,
      input.db_name,
      input.username,
      encryptPassword(input.password) ?? null,
      input.is_active === false ? 0 : 1,
    ],
  );
  return repoGetExternalDbConnection(id);
}

export async function repoUpdateExternalDbConnection(id: string, input: ExternalDbInput) {
  const encrypted = encryptPassword(input.password);
  await pool.query<ResultSetHeader>(
    `UPDATE external_db_connections
     SET \`key\` = ?, name = ?, description = ?, host = ?, port = ?, db_name = ?,
         username = ?, is_active = ?${encrypted !== undefined ? ', password_enc = ?' : ''}
     WHERE id = ?`,
    [
      (input.key || input.name).toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      input.name,
      input.description ?? null,
      input.host,
      input.port || 3306,
      input.db_name,
      input.username,
      input.is_active === false ? 0 : 1,
      ...(encrypted !== undefined ? [encrypted] : []),
      id,
    ],
  );
  return repoGetExternalDbConnection(id);
}

export async function repoDeleteExternalDbConnection(id: string) {
  await pool.query<ResultSetHeader>('DELETE FROM external_db_connections WHERE id = ?', [id]);
}

export async function repoUpdateExternalDbTestState(id: string, ok: boolean, error?: string | null) {
  await pool.query<ResultSetHeader>(
    `UPDATE external_db_connections
     SET last_tested_at = CURRENT_TIMESTAMP, last_test_ok = ?, last_error = ?
     WHERE id = ?`,
    [ok ? 1 : 0, error?.slice(0, 500) ?? null, id],
  );
}

export async function createExternalDbPool(row: ExternalDbConnectionRow) {
  return mysql.createPool({
    host: row.host,
    port: Number(row.port || 3306),
    user: row.username,
    password: decryptExternalPassword(row.password_enc),
    database: row.db_name,
    waitForConnections: true,
    connectionLimit: 2,
    supportBigNumbers: true,
    dateStrings: true,
  });
}
