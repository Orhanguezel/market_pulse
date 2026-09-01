import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import { createDecipheriv, createHash } from 'node:crypto';
import { env } from '@/core/env';
import { pool as mainPool } from '@/db/client';

type ExternalDbConfig = {
  host?: string;
  port: number;
  user?: string;
  password?: string;
  name?: string;
};

export type ExternalPoolConfig = {
  host?: string;
  port?: number;
  user?: string;
  username?: string;
  password?: string;
  name?: string;
  database?: string;
};

type ExternalDbConfigRow = RowDataPacket & {
  host: string;
  port: number;
  username: string;
  db_name: string;
  password_enc: string | null;
};

const pools = new Map<string, Pool>();

function parsePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : 3306;
}

function readEnvConfig(key: string): ExternalDbConfig {
  const prefix = `EXTERNAL_DB_${key.toUpperCase()}_`;
  return {
    host: process.env[`${prefix}HOST`],
    port: parsePort(process.env[`${prefix}PORT`]),
    user: process.env[`${prefix}USER`],
    password: process.env[`${prefix}PASSWORD`],
    name: process.env[`${prefix}NAME`],
  };
}

function mergeEnvConfig(key: string, config: ExternalPoolConfig): ExternalDbConfig {
  const envConfig = readEnvConfig(key);
  return {
    host: config.host ?? envConfig.host,
    port: Number(config.port ?? envConfig.port ?? 3306),
    user: config.user ?? config.username ?? envConfig.user,
    password: config.password ?? envConfig.password,
    name: config.name ?? config.database ?? envConfig.name,
  };
}

function isConfigured(config: ExternalDbConfig): config is Required<ExternalDbConfig> {
  return Boolean(config.host && config.user && config.name);
}

function createPool(config: Required<ExternalDbConfig>): Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.name,
    waitForConnections: true,
    connectionLimit: 5,
    supportBigNumbers: true,
    dateStrings: true,
  });
}

function getEncryptionKey() {
  if (!env.DB_ENCRYPTION_KEY) return null;
  return createHash('sha256').update(env.DB_ENCRYPTION_KEY).digest();
}

export function decryptExternalPassword(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const key = getEncryptionKey();
  if (!key) throw new Error('db_encryption_key_required');

  const [ivPart, dataPart] = value.split(':');
  if (!ivPart || !dataPart) throw new Error('invalid_encrypted_password');

  const decipher = createDecipheriv('aes-256-cbc', key, Buffer.from(ivPart, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

async function readDbConfig(key: string): Promise<ExternalDbConfig | null> {
  const [rows] = await mainPool.query<ExternalDbConfigRow[]>(
    `SELECT host, port, username, db_name, password_enc
     FROM external_db_connections
     WHERE \`key\` = ? AND is_active = 1
     LIMIT 1`,
    [key],
  );

  const row = rows[0];
  if (!row || !row.host || !row.username || !row.db_name) return null;

  return {
    host: row.host,
    port: Number(row.port || 3306),
    user: row.username,
    password: decryptExternalPassword(row.password_enc),
    name: row.db_name,
  };
}

export async function getExternalPool(key: string): Promise<Pool | null> {
  const normalizedKey = key.toUpperCase();
  const existing = pools.get(normalizedKey);
  if (existing) return existing;

  const dbConfig = await readDbConfig(normalizedKey).catch(() => null);
  const config = dbConfig ?? readEnvConfig(normalizedKey);
  if (!isConfigured(config)) return null;

  const pool = createPool(config);

  pools.set(normalizedKey, pool);
  return pool;
}

export async function getExternalPoolFromConfig(
  key: string,
  rawConfig: ExternalPoolConfig,
): Promise<Pool | null> {
  const normalizedKey = key.toUpperCase();
  const cacheKey = `${normalizedKey}:${rawConfig.database ?? rawConfig.name ?? ''}:${rawConfig.host ?? ''}`;
  const existing = pools.get(cacheKey);
  if (existing) return existing;

  const config = mergeEnvConfig(normalizedKey, rawConfig);
  if (!isConfigured(config)) return null;

  const pool = createPool(config);
  pools.set(cacheKey, pool);
  return pool;
}

export async function closeExternalPools() {
  await Promise.all([...pools.values()].map((pool) => pool.end()));
  pools.clear();
}
