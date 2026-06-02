import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

export interface SavedSearch {
  id: string;
  label: string;
  keyword: string;
  marketplace: string;
  watchlistEnabled: boolean;
  lastJobId: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type Row = {
  id: string;
  label: string;
  keyword: string;
  marketplace: string;
  watchlist_enabled: number;
  last_job_id: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

function rowToDto(r: Row): SavedSearch {
  return {
    id:               r.id,
    label:            r.label,
    keyword:          r.keyword,
    marketplace:      r.marketplace,
    watchlistEnabled: r.watchlist_enabled === 1,
    lastJobId:        r.last_job_id ?? null,
    lastRunAt:        r.last_run_at ? String(r.last_run_at) : null,
    createdAt:        String(r.created_at),
    updatedAt:        String(r.updated_at),
  };
}

export async function listSavedSearches(): Promise<SavedSearch[]> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    'SELECT * FROM amazon_saved_searches WHERE tenant_key = ? ORDER BY updated_at DESC',
    [tenantKey],
  );
  return (rows as Row[]).map(rowToDto);
}

export async function createSavedSearch(input: {
  label: string;
  keyword: string;
  marketplace?: string;
  watchlistEnabled?: boolean;
}): Promise<SavedSearch> {
  const tenantKey = await getActiveTenantKey();
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO amazon_saved_searches (id, tenant_key, label, keyword, marketplace, watchlist_enabled)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tenantKey, input.label, input.keyword, input.marketplace ?? 'com', input.watchlistEnabled ? 1 : 0],
  );
  const [rows] = await pool.execute('SELECT * FROM amazon_saved_searches WHERE tenant_key = ? AND id = ?', [tenantKey, id]);
  return rowToDto((rows as Row[])[0]!);
}

export async function updateSavedSearch(
  id: string,
  input: { watchlistEnabled?: boolean; lastJobId?: string; lastRunAt?: Date },
): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  if (input.watchlistEnabled !== undefined && input.lastJobId !== undefined && input.lastRunAt !== undefined) {
    await pool.execute(
      'UPDATE amazon_saved_searches SET watchlist_enabled = ?, last_job_id = ?, last_run_at = ? WHERE tenant_key = ? AND id = ?',
      [input.watchlistEnabled ? 1 : 0, input.lastJobId, input.lastRunAt, tenantKey, id],
    );
  } else if (input.lastJobId !== undefined && input.lastRunAt !== undefined) {
    await pool.execute(
      'UPDATE amazon_saved_searches SET last_job_id = ?, last_run_at = ? WHERE tenant_key = ? AND id = ?',
      [input.lastJobId, input.lastRunAt, tenantKey, id],
    );
  } else if (input.watchlistEnabled !== undefined) {
    await pool.execute(
      'UPDATE amazon_saved_searches SET watchlist_enabled = ? WHERE tenant_key = ? AND id = ?',
      [input.watchlistEnabled ? 1 : 0, tenantKey, id],
    );
  } else if (input.lastJobId !== undefined) {
    await pool.execute(
      'UPDATE amazon_saved_searches SET last_job_id = ? WHERE tenant_key = ? AND id = ?',
      [input.lastJobId, tenantKey, id],
    );
  } else if (input.lastRunAt !== undefined) {
    await pool.execute(
      'UPDATE amazon_saved_searches SET last_run_at = ? WHERE tenant_key = ? AND id = ?',
      [input.lastRunAt, tenantKey, id],
    );
  }
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  await pool.execute('DELETE FROM amazon_saved_searches WHERE tenant_key = ? AND id = ?', [tenantKey, id]);
}
