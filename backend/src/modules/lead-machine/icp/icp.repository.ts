import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

export interface IcpProfile {
  id: string;
  name: string;
  is_active: number;
  definition: unknown;
  created_at: string;
  updated_at: string;
}

function parseProfile(row: IcpProfile) {
  if (typeof row.definition === 'string') {
    try {
      return { ...row, definition: JSON.parse(row.definition) };
    } catch {
      return row;
    }
  }
  return row;
}

export async function listIcpProfiles() {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM icp_profiles WHERE tenant_key = ? ORDER BY created_at DESC', [tenantKey]);
  return (rows as IcpProfile[]).map(parseProfile);
}

export async function getIcpProfile(id: string) {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM icp_profiles WHERE tenant_key = ? AND id = ? LIMIT 1', [tenantKey, id]);
  const row = (rows as IcpProfile[])[0];
  return row ? parseProfile(row) : null;
}

export async function createIcpProfile(data: { name: string; definition: unknown; is_active?: boolean }) {
  const id = randomUUID();
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    'INSERT INTO icp_profiles (id, tenant_key, name, is_active, definition) VALUES (?, ?, ?, ?, ?)',
    [id, tenantKey, data.name, data.is_active === false ? 0 : 1, JSON.stringify(data.definition ?? {})],
  );
  return getIcpProfile(id);
}

export async function updateIcpProfile(id: string, data: { name?: string; definition?: unknown; is_active?: boolean }) {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) {
    sets.push('name = ?');
    values.push(data.name);
  }
  if (data.is_active !== undefined) {
    sets.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }
  if (data.definition !== undefined) {
    sets.push('definition = ?');
    values.push(JSON.stringify(data.definition));
  }
  if (!sets.length) return getIcpProfile(id);
  const tenantKey = await getActiveTenantKey();
  values.push(id);
  values.push(tenantKey);
  await pool.execute(`UPDATE icp_profiles SET ${sets.join(', ')} WHERE id = ? AND tenant_key = ?`, values as never[]);
  return getIcpProfile(id);
}

export async function deleteIcpProfile(id: string) {
  const tenantKey = await getActiveTenantKey();
  const [jobs] = await pool.execute('SELECT id FROM lead_search_jobs WHERE tenant_key = ? AND icp_id = ? LIMIT 1', [tenantKey, id]);
  if ((jobs as unknown[]).length) {
    const err = new Error('ICP_HAS_JOBS');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }
  await pool.execute('DELETE FROM icp_profiles WHERE tenant_key = ? AND id = ?', [tenantKey, id]);
}
