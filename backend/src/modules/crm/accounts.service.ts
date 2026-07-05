import { pool } from '@/db/client';
import { getActiveTenantKey, getRequiredUserId } from '@/modules/_shared';
import type { AccountBody, ListQuery } from './schema';
import { buildPatchSql, jsonOrNull, newId, parseJsonField } from './utils';

export async function listAccounts(query: ListQuery, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  if (query.status) {
    where.push('status = ?');
    values.push(query.status);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM crm_accounts WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ${query.limit} OFFSET ${query.offset}`,
    values as never[],
  );
  return (rows as Array<Record<string, unknown>>).map((row) => parseJsonField(row, 'raw_data'));
}

export async function getAccount(id: string, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  const [rows] = await pool.execute(`SELECT * FROM crm_accounts WHERE ${where.join(' AND ')} LIMIT 1`, values as never[]);
  const row = (rows as Array<Record<string, unknown>>)[0];
  return row ? parseJsonField(row, 'raw_data') : null;
}

export async function createAccount(body: AccountBody & { source_lead_id?: string | null }) {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = getRequiredUserId();
  const id = newId();
  await pool.execute(
    `INSERT INTO crm_accounts
      (id, tenant_key, name, website, country, city, phone, email, industry, source_lead_id, owner_user_id, status, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantKey,
      body.name,
      body.website ?? null,
      body.country ?? null,
      body.city ?? null,
      body.phone ?? null,
      body.email ?? null,
      body.industry ?? null,
      body.source_lead_id ?? null,
      ownerUserId,
      body.status ?? 'active',
      jsonOrNull(body.raw_data),
    ],
  );
  return getAccount(id);
}

export async function updateAccount(id: string, body: Partial<AccountBody>, ownerUserId?: string | null) {
  const patch = {
    ...body,
    raw_data: body.raw_data === undefined ? undefined : jsonOrNull(body.raw_data),
  };
  const { sets, values } = buildPatchSql(patch);
  if (!sets.length) return getAccount(id);
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  values.push(tenantKey, id);
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  await pool.execute(`UPDATE crm_accounts SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`, values as never[]);
  return getAccount(id, ownerUserId);
}

export async function deleteAccount(id: string, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  await pool.execute(`DELETE FROM crm_accounts WHERE ${where.join(' AND ')}`, values as never[]);
}
