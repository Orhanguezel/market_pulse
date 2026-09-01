import { pool } from '@/db/client';
import { getActiveTenantKey, getRequiredUserId } from '@/modules/_shared';
import type { ContactBody, ListQuery } from './schema';
import { buildPatchSql, newId } from './utils';

export async function listContacts(query: ListQuery & { account_id?: string }, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
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

export async function getContact(id: string, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  const [rows] = await pool.execute(`SELECT * FROM crm_contacts WHERE ${where.join(' AND ')} LIMIT 1`, values as never[]);
  return (rows as unknown[])[0] ?? null;
}

export async function createContact(body: ContactBody & { source_lead_id?: string | null }) {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = getRequiredUserId();
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
      ownerUserId,
    ],
  );
  return getContact(id);
}

export async function updateContact(id: string, body: Partial<ContactBody>, ownerUserId?: string | null) {
  const { sets, values } = buildPatchSql(body);
  if (!sets.length) return getContact(id);
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  values.push(tenantKey, id);
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  await pool.execute(`UPDATE crm_contacts SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`, values as never[]);
  return getContact(id, ownerUserId);
}

export async function deleteContact(id: string, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  await pool.execute(`DELETE FROM crm_contacts WHERE ${where.join(' AND ')}`, values as never[]);
}
