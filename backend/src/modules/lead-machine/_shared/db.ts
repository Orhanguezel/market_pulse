import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

export type LeadChannel = 'amazon' | 'b2b_directory' | 'trade_fair' | 'trade_fair_in_person' | 'icp_match';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed';
export type CandidateStatus = 'pending' | 'approved' | 'rejected' | 'favorite';

export interface LeadSearchJob {
  id: string;
  channel: LeadChannel;
  status: JobStatus;
  icp_id: string | null;
  params: unknown;
  result_count: number;
  error_msg: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface LeadCandidate {
  id: string;
  job_id: string;
  channel: LeadChannel;
  icp_id: string | null;
  status: CandidateStatus;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  raw_data: unknown;
  ai_summary: string | null;
  lead_score: string | number | null;
  decision: string | null;
  reject_reason: string | null;
  reject_tags: string[] | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CandidateInput {
  jobId: string;
  channel: LeadChannel;
  icpId?: string | null;
  name: string;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  rawData?: unknown;
  aiSummary?: string | null;
  leadScore?: number | null;
  decision?: string | null;
}

function parseJsonField<T>(row: T, key: keyof T): T {
  const value = row[key];
  if (typeof value === 'string') {
    try {
      return { ...row, [key]: JSON.parse(value) };
    } catch {
      return row;
    }
  }
  return row;
}

export async function createSearchJob(channel: LeadChannel, params: unknown, icpId?: string | null, createdBy?: string | null) {
  const id = randomUUID();
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    'INSERT INTO lead_search_jobs (id, tenant_key, channel, status, icp_id, params, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, tenantKey, channel, 'pending', icpId ?? null, JSON.stringify(params ?? {}), createdBy ?? null],
  );
  return getSearchJob(id);
}

export async function getSearchJob(id: string) {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM lead_search_jobs WHERE tenant_key = ? AND id = ? LIMIT 1', [tenantKey, id]);
  const row = (rows as LeadSearchJob[])[0];
  return row ? parseJsonField(row, 'params') : null;
}

export async function listSearchJobs(channel?: LeadChannel) {
  const tenantKey = await getActiveTenantKey();
  const [rows] = channel
    ? await pool.execute('SELECT * FROM lead_search_jobs WHERE tenant_key = ? AND channel = ? ORDER BY created_at DESC LIMIT 100', [tenantKey, channel])
    : await pool.execute('SELECT * FROM lead_search_jobs WHERE tenant_key = ? ORDER BY created_at DESC LIMIT 100', [tenantKey]);
  return (rows as LeadSearchJob[]).map(row => parseJsonField(row, 'params'));
}

export async function updateSearchJob(id: string, patch: { status?: JobStatus; resultCount?: number; errorMsg?: string | null; started?: boolean; finished?: boolean }) {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.status) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (patch.resultCount !== undefined) {
    sets.push('result_count = ?');
    values.push(patch.resultCount);
  }
  if (patch.errorMsg !== undefined) {
    sets.push('error_msg = ?');
    values.push(patch.errorMsg);
  }
  if (patch.started) sets.push('started_at = CURRENT_TIMESTAMP');
  if (patch.finished) sets.push('finished_at = CURRENT_TIMESTAMP');
  if (!sets.length) return;
  const tenantKey = await getActiveTenantKey();
  values.push(id);
  values.push(tenantKey);
  await pool.execute(`UPDATE lead_search_jobs SET ${sets.join(', ')} WHERE id = ? AND tenant_key = ?`, values as never[]);
}

export async function insertCandidate(input: CandidateInput) {
  const id = randomUUID();
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    `INSERT INTO lead_candidates
      (id, tenant_key, job_id, channel, icp_id, name, website, country, city, phone, email, contact_name, raw_data, ai_summary, lead_score, decision)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantKey,
      input.jobId,
      input.channel,
      input.icpId ?? null,
      input.name,
      input.website ?? null,
      input.country ?? null,
      input.city ?? null,
      input.phone ?? null,
      input.email ?? null,
      input.contactName ?? null,
      JSON.stringify(input.rawData ?? null),
      input.aiSummary ?? null,
      input.leadScore ?? null,
      input.decision ?? null,
    ],
  );
  return id;
}

export async function listCandidates(filters: { channel?: string; status?: string; jobId?: string; limit: number; offset: number }) {
  const tenantKey = await getActiveTenantKey();
  const where: string[] = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (filters.channel) {
    where.push('channel = ?');
    values.push(filters.channel);
  }
  if (filters.status) {
    where.push('status = ?');
    values.push(filters.status);
  }
  if (filters.jobId) {
    where.push('job_id = ?');
    values.push(filters.jobId);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const limitInt = Math.floor(filters.limit);
  const offsetInt = Math.floor(filters.offset);
  const [rows] = await pool.execute(
    `SELECT * FROM lead_candidates ${whereSql} ORDER BY created_at DESC LIMIT ${limitInt} OFFSET ${offsetInt}`,
    values as never[],
  );
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS count FROM lead_candidates ${whereSql}`, values as never[]);
  return {
    rows: (rows as LeadCandidate[]).map(row => parseJsonField(parseJsonField(row, 'raw_data'), 'reject_tags')),
    count: Number((countRows as Array<{ count: number }>)[0]?.count ?? 0),
  };
}

export async function getCandidate(id: string) {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM lead_candidates WHERE tenant_key = ? AND id = ? LIMIT 1', [tenantKey, id]);
  let row = (rows as LeadCandidate[])[0];
  if (!row) return null;
  row = parseJsonField(row, 'raw_data');
  row = parseJsonField(row, 'reject_tags');
  return row;
}

export async function updateCandidateReview(
  id: string,
  status: CandidateStatus,
  rejectReason?: string | null,
  reviewedBy?: string | null,
  rejectTags?: string[] | null,
) {
  const tagsJson = rejectTags?.length ? JSON.stringify(rejectTags) : null;
  const reason = rejectReason ?? (rejectTags?.length ? rejectTags.join(', ') : null);
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    'UPDATE lead_candidates SET status = ?, reject_reason = ?, reject_tags = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE tenant_key = ? AND id = ?',
    [status, reason, tagsJson, reviewedBy ?? null, tenantKey, id],
  );
  return getCandidate(id);
}
