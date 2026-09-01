import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey, getActiveUserId, getRequiredTenantKey } from '@/modules/_shared';

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

export async function listIcpProfiles(ownerUserId?: string | null) {
  const tenantKey = await getActiveTenantKey();
  const ownerAnd = ownerUserId ? ' AND owner_user_id = ?' : '';
  const values = ownerUserId ? [tenantKey, ownerUserId] : [tenantKey];
  const [rows] = await pool.execute(`SELECT * FROM icp_profiles WHERE tenant_key = ?${ownerAnd} ORDER BY created_at DESC`, values);
  return (rows as IcpProfile[]).map(parseProfile);
}

export async function getIcpProfile(id: string, ownerUserId?: string | null) {
  const tenantKey = await getActiveTenantKey();
  const ownerAnd = ownerUserId ? ' AND owner_user_id = ?' : '';
  const values = ownerUserId ? [tenantKey, id, ownerUserId] : [tenantKey, id];
  const [rows] = await pool.execute(`SELECT * FROM icp_profiles WHERE tenant_key = ? AND id = ?${ownerAnd} LIMIT 1`, values);
  const row = (rows as IcpProfile[])[0];
  return row ? parseProfile(row) : null;
}

export async function createIcpProfile(data: { name: string; definition: unknown; is_active?: boolean }) {
  const id = randomUUID();
  const tenantKey = getRequiredTenantKey(); // switcher zorunlu: tenant secilmeden ICP kaydedilmez
  const ownerUserId = getActiveUserId() ?? null;
  await pool.execute(
    'INSERT INTO icp_profiles (id, tenant_key, owner_user_id, name, is_active, definition) VALUES (?, ?, ?, ?, ?, ?)',
    [id, tenantKey, ownerUserId, data.name, data.is_active === false ? 0 : 1, JSON.stringify(data.definition ?? {})],
  );
  return getIcpProfile(id, ownerUserId);
}

export async function updateIcpProfile(id: string, data: { name?: string; definition?: unknown; is_active?: boolean }, ownerUserId?: string | null) {
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
  if (!sets.length) return getIcpProfile(id, ownerUserId);
  const tenantKey = await getActiveTenantKey();
  values.push(id);
  values.push(tenantKey);
  const ownerAnd = ownerUserId ? ' AND owner_user_id = ?' : '';
  if (ownerUserId) values.push(ownerUserId);
  await pool.execute(`UPDATE icp_profiles SET ${sets.join(', ')} WHERE id = ? AND tenant_key = ?${ownerAnd}`, values as never[]);
  return getIcpProfile(id, ownerUserId);
}

/**
 * ICP siler. Bagli tarama isi varsa varsayilan olarak 409 ICP_HAS_JOBS doner.
 * force=true ise isler/adaylar/kurallar ICP'den koparilir (icp_id = NULL) ve
 * profil silinir — gecmis job kayitlari korunur, sadece ICP referansi dusar.
 */
export async function deleteIcpProfile(id: string, ownerUserId?: string | null, force = false): Promise<boolean> {
  const tenantKey = await getActiveTenantKey();
  const ownerAnd = ownerUserId ? ' AND owner_user_id = ?' : '';
  const scopeValues = ownerUserId ? [tenantKey, id, ownerUserId] : [tenantKey, id];
  const [profiles] = await pool.execute(`SELECT id FROM icp_profiles WHERE tenant_key = ? AND id = ?${ownerAnd} LIMIT 1`, scopeValues);
  if (!(profiles as unknown[]).length) return false;

  const [jobs] = await pool.execute(`SELECT id FROM lead_search_jobs WHERE tenant_key = ? AND icp_id = ?${ownerAnd} LIMIT 1`, scopeValues);
  if ((jobs as unknown[]).length && !force) {
    const err = new Error('ICP_HAS_JOBS');
    (err as Error & { statusCode: number }).statusCode = 409;
    throw err;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (force) {
      await connection.execute(`UPDATE lead_search_jobs SET icp_id = NULL WHERE tenant_key = ? AND icp_id = ?${ownerAnd}`, scopeValues);
      await connection.execute(`UPDATE lead_candidates SET icp_id = NULL WHERE tenant_key = ? AND icp_id = ?${ownerAnd}`, scopeValues);
      await connection.execute(`DELETE FROM lead_scan_rules WHERE tenant_key = ? AND icp_id = ?${ownerAnd}`, scopeValues);
    }
    const [result] = await connection.execute(`DELETE FROM icp_profiles WHERE tenant_key = ? AND id = ?${ownerAnd}`, scopeValues);
    if (Number((result as { affectedRows?: number }).affectedRows ?? 0) !== 1) throw new Error('ICP_DELETE_FAILED');
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
