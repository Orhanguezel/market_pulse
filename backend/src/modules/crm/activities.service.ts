import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { ActivityBody, ListQuery } from './schema';
import { buildPatchSql, newId } from './utils';

export async function listActivities(query: ListQuery & { ref_type?: string; ref_id?: string }) {
  const tenantKey = getActiveTenantKey();
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (query.ref_type && query.ref_id) {
    where.push('ref_type = ? AND ref_id = ?');
    values.push(query.ref_type, query.ref_id);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM crm_activities WHERE ${where.join(' AND ')} ORDER BY done ASC, due_at ASC, created_at DESC LIMIT ${query.limit} OFFSET ${query.offset}`,
    values as never[],
  );
  return rows;
}

export async function createActivity(body: ActivityBody) {
  const tenantKey = getActiveTenantKey();
  const id = newId();
  await pool.execute(
    `INSERT INTO crm_activities
      (id, tenant_key, ref_type, ref_id, type, subject, body, due_at, owner_user_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantKey,
      body.ref_type,
      body.ref_id,
      body.type,
      body.subject,
      body.body ?? null,
      body.due_at ?? null,
      body.owner_user_id ?? null,
      body.created_by ?? null,
    ],
  );
  return getActivity(id);
}

export async function getActivity(id: string) {
  const tenantKey = getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM crm_activities WHERE tenant_key = ? AND id = ? LIMIT 1', [tenantKey, id]);
  return (rows as unknown[])[0] ?? null;
}

export async function updateActivity(id: string, body: Partial<ActivityBody> & { done?: boolean }) {
  const patch = {
    ...body,
    done: body.done === undefined ? undefined : body.done ? 1 : 0,
    done_at: body.done === undefined ? undefined : body.done ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
  };
  const { sets, values } = buildPatchSql(patch);
  if (!sets.length) return getActivity(id);
  const tenantKey = getActiveTenantKey();
  values.push(tenantKey, id);
  await pool.execute(`UPDATE crm_activities SET ${sets.join(', ')} WHERE tenant_key = ? AND id = ?`, values as never[]);
  return getActivity(id);
}
