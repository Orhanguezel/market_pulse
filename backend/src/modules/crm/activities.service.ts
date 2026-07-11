import { pool } from '@/db/client';
import { getActiveTenantKey, getRequiredUserId } from '@/modules/_shared';
import type { ActivityBody, ListQuery } from './schema';
import { buildPatchSql, newId } from './utils';

export async function listActivities(query: ListQuery & { ref_type?: string; ref_id?: string }, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  if (query.ref_type && query.ref_id) {
    where.push('ref_type = ? AND ref_id = ?');
    values.push(query.ref_type, query.ref_id);
  }
  const [rows] = await pool.execute(
    `SELECT ca.*,
       COALESCE(acc.name, deal_acc.name, CONCAT_WS(' ', contact.first_name, contact.last_name), deal.title) AS related_name,
       COALESCE(NULLIF(owner.full_name, ''), owner.email) AS owner_name
     FROM crm_activities ca
     LEFT JOIN crm_accounts acc
       ON ca.ref_type = 'account' AND acc.id = ca.ref_id AND acc.tenant_key = ca.tenant_key
     LEFT JOIN crm_contacts contact
       ON ca.ref_type = 'contact' AND contact.id = ca.ref_id AND contact.tenant_key = ca.tenant_key
     LEFT JOIN crm_deals deal
       ON ca.ref_type = 'deal' AND deal.id = ca.ref_id AND deal.tenant_key = ca.tenant_key
     LEFT JOIN crm_accounts deal_acc
       ON deal.account_id = deal_acc.id AND deal.tenant_key = deal_acc.tenant_key
     LEFT JOIN users owner ON owner.id = ca.owner_user_id
     WHERE ${where.map((clause) => `ca.${clause}`).join(' AND ')}
     ORDER BY ca.done ASC, COALESCE(ca.planned_start_at, ca.due_at) ASC, ca.created_at DESC
     LIMIT ${query.limit} OFFSET ${query.offset}`,
    values as never[],
  );
  return rows;
}

export async function createActivity(body: ActivityBody) {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = getRequiredUserId();
  const id = newId();
  await pool.execute(
    `INSERT INTO crm_activities
      (id, tenant_key, ref_type, ref_id, type, subject, body, planned_start_at, due_at, owner_user_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantKey,
      body.ref_type,
      body.ref_id,
      body.type,
      body.subject,
      body.body ?? null,
      body.planned_start_at ?? null,
      body.due_at ?? null,
      ownerUserId,
      ownerUserId,
    ],
  );
  return getActivity(id);
}

export async function getActivity(id: string, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  const [rows] = await pool.execute(`SELECT * FROM crm_activities WHERE ${where.join(' AND ')} LIMIT 1`, values as never[]);
  return (rows as unknown[])[0] ?? null;
}

export async function updateActivity(id: string, body: Partial<ActivityBody> & { done?: boolean }, ownerUserId?: string | null) {
  const patch = {
    ...body,
    done: body.done === undefined ? undefined : body.done ? 1 : 0,
    done_at: body.done === undefined ? undefined : body.done ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
  };
  const { sets, values } = buildPatchSql(patch);
  if (!sets.length) return getActivity(id);
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  values.push(tenantKey, id);
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  await pool.execute(`UPDATE crm_activities SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`, values as never[]);
  return getActivity(id, ownerUserId);
}

export async function deleteActivity(id: string, ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  if (ownerUserId) {
    where.push('owner_user_id = ?');
    values.push(ownerUserId);
  }
  await pool.execute(`DELETE FROM crm_activities WHERE ${where.join(' AND ')}`, values as never[]);
}
