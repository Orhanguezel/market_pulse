import crypto from 'crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { env } from '@/core/env';
import { pool } from '@/db/client';

type TenantRow = RowDataPacket & {
  tenant_key: string;
  name: string;
  locale: string;
  status: string;
  plan: string;
  created_at: string;
  updated_at: string;
};

type SettingRow = RowDataPacket & {
  key: string;
  value_json: unknown;
};

type SecretRow = RowDataPacket & {
  value_encrypted: string;
};

export type ActiveTenant = {
  key: string;
  name: string;
  locale: string;
  status: string;
  plan: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

let activeTenantPromise: Promise<ActiveTenant> | undefined;

function parseJsonValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function loadActiveTenant(): Promise<ActiveTenant> {
  const tenantKey = env.TENANT_KEY;
  const [tenantRows] = await pool.execute<TenantRow[]>(
    'SELECT tenant_key, name, locale, status, plan, created_at, updated_at FROM tenants WHERE tenant_key = ? AND status = ? LIMIT 1',
    [tenantKey, 'active'],
  );

  const tenant = tenantRows[0];
  if (!tenant) {
    throw new Error(`Unknown TENANT_KEY: ${tenantKey}`);
  }

  const [settingRows] = await pool.execute<SettingRow[]>(
    'SELECT `key`, value_json FROM tenant_settings WHERE tenant_key = ?',
    [tenantKey],
  );

  const settings = Object.fromEntries(
    settingRows.map(row => [row.key, parseJsonValue(row.value_json)]),
  );

  return {
    key: tenant.tenant_key,
    name: tenant.name,
    locale: tenant.locale,
    status: tenant.status,
    plan: tenant.plan,
    settings,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
  };
}

export async function getActiveTenant(): Promise<ActiveTenant> {
  activeTenantPromise ??= loadActiveTenant();
  return activeTenantPromise;
}

export async function getTenantSetting<T = unknown>(
  key: string,
  fallback?: T,
): Promise<T | undefined> {
  const tenant = await getActiveTenant();
  return Object.hasOwn(tenant.settings, key) ? tenant.settings[key] as T : fallback;
}

function getEncryptionKey(rawKey: string): Buffer {
  if (/^[a-f0-9]{64}$/i.test(rawKey)) return Buffer.from(rawKey, 'hex');
  const base64 = Buffer.from(rawKey, 'base64');
  if (base64.length === 32) return base64;
  return crypto.createHash('sha256').update(rawKey).digest();
}

function decryptAes256Gcm(value: string, rawKey: string): string {
  const parts = value.split(':');
  if (parts.length !== 4 || parts[0] !== 'aes-256-gcm') {
    throw new Error('unsupported_secret_format');
  }

  const [, ivHex, authTagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(rawKey),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

export function encryptTenantSecret(value: string, rawKey = env.DB_ENCRYPTION_KEY): string {
  if (!rawKey) {
    console.warn('DB_ENCRYPTION_KEY is not set; storing tenant secret as plaintext fallback.');
    return value;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(rawKey), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    'aes-256-gcm',
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

export async function getTenantSecret(key: string): Promise<string | undefined> {
  const tenant = await getActiveTenant();
  const [rows] = await pool.execute<SecretRow[]>(
    'SELECT value_encrypted FROM tenant_secrets WHERE tenant_key = ? AND `key` = ? LIMIT 1',
    [tenant.key, key],
  );

  const value = rows[0]?.value_encrypted;
  if (!value) return undefined;

  if (!env.DB_ENCRYPTION_KEY) {
    console.warn('DB_ENCRYPTION_KEY is not set; returning tenant secret as plaintext fallback.');
    return value;
  }

  return decryptAes256Gcm(value, env.DB_ENCRYPTION_KEY);
}

export function resetActiveTenantCacheForTests(): void {
  activeTenantPromise = undefined;
}
