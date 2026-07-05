import crypto from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import { decryptAes256Gcm, encryptAes256Gcm } from '@/modules/_shared/crypto';

function encrypt(text: string): string {
  return encryptAes256Gcm(text, process.env.KEEPA_ENCRYPTION_KEY, 'KEEPA_ENCRYPTION_KEY');
}

function decrypt(stored: string): string {
  return decryptAes256Gcm(stored, process.env.KEEPA_ENCRYPTION_KEY, 'KEEPA_ENCRYPTION_KEY');
}

export interface ByokStatus {
  hasKey: boolean;
  tokenBudget: number | null;
  tokensUsed: number;
  lastCheckedAt: string | null;
}

export async function getByokStatus(userId: string): Promise<ByokStatus> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    'SELECT token_budget, tokens_used, last_checked_at FROM user_keepa_keys WHERE tenant_key = ? AND user_id = ? LIMIT 1',
    [tenantKey, userId],
  );
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return { hasKey: false, tokenBudget: null, tokensUsed: 0, lastCheckedAt: null };
  return {
    hasKey: true,
    tokenBudget: row.token_budget != null ? Number(row.token_budget) : null,
    tokensUsed: Number(row.tokens_used ?? 0),
    lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : null,
  };
}

export async function saveByokKey(userId: string, apiKey: string): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  const encryptedKey = encrypt(apiKey.trim());
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO user_keepa_keys (id, tenant_key, user_id, encrypted_key)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE encrypted_key = VALUES(encrypted_key), updated_at = CURRENT_TIMESTAMP(3)`,
    [id, tenantKey, userId, encryptedKey],
  );
}

export async function deleteByokKey(userId: string): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  await pool.execute('DELETE FROM user_keepa_keys WHERE tenant_key = ? AND user_id = ?', [tenantKey, userId]);
}

export async function getDecryptedByokKey(userId: string): Promise<string | null> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    'SELECT encrypted_key FROM user_keepa_keys WHERE tenant_key = ? AND user_id = ? LIMIT 1',
    [tenantKey, userId],
  );
  const row = (rows as Record<string, unknown>[])[0];
  if (!row?.encrypted_key) return null;
  try {
    return decrypt(String(row.encrypted_key));
  } catch {
    return null;
  }
}
