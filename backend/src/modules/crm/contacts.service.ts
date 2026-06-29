import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { ContactBody, ListQuery } from './schema';
import { buildPatchSql, newId } from './utils';

export async function listContacts(query: ListQuery & { account_id?: string }) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (query.account_id) {
    where.push('account_id = ?');
    values.push(query.account_id);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM crm_contacts WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ${query.limit} OFFSET ${query.offset}`,
    values as never[],
  );
  return rows;
}

export async function getContact(id: string) {
  const tenantKey = getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM crm_contacts WHERE tenant_key = ? AND id = ? LIMIT 1', [tenantKey, id]);
  return (rows as unknown[])[0] ?? null;
}

export async function createContact(body: ContactBody & { source_lead_id?: string | null }) {
  const tenantKey = getActiveTenantKey();
  const id = newId();
  await pool.execute(
    `INSERT INTO crm_contacts
      (id, tenant_key, account_id, first_name, last_name, title, email, phone, linkedin_url, source_lead_id, owner_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantKey,
      body.account_id ?? null,
      body.first_name ?? null,
      body.last_name ?? null,
      body.title ?? null,
      body.email ?? null,
      body.phone ?? null,
      body.linkedin_url ?? null,
      body.source_lead_id ?? null,
      body.owner_user_id ?? null,
    ],
  );
  return getContact(id);
}

export async function updateContact(id: string, body: Partial<ContactBody>) {
  const { sets, values } = buildPatchSql(body);
  if (!sets.length) return getContact(id);
  const tenantKey = getActiveTenantKey();
  values.push(tenantKey, id);
  await pool.execute(`UPDATE crm_contacts SET ${sets.join(', ')} WHERE tenant_key = ? AND id = ?`, values as never[]);
  return getContact(id);
}
