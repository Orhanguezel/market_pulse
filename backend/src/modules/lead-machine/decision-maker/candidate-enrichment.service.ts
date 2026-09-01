import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import { getCandidate, type LeadCandidate } from '../_shared/db';
import { EXPORT_B2B_TITLES } from './finder.service';
import { resolveDecisionMaker, sourceUrlFor, type ResolvedDecisionMaker } from './osint.service';

type BatchParams = {
  candidate_ids?: string[];
  job_id?: string | null;
  icp_id?: string | null;
  titles?: string[];
  limit?: number;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function normalizeRawData(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try { return asRecord(JSON.parse(raw)); } catch { return {}; }
  }
  return asRecord(raw);
}

function decisionMakerPayload(candidate: LeadCandidate, resolved: ResolvedDecisionMaker, titles: string[]) {
  return {
    name: resolved.name,
    title: resolved.title,
    linkedin_url: resolved.linkedin_url,
    source: resolved.evidence.source,
    source_url: sourceUrlFor({
      company: candidate.name,
      city: candidate.city,
      country: candidate.country,
      website: candidate.website,
      googleMapsUrl: typeof asRecord(candidate.raw_data).google_maps_url === 'string'
        ? String(asRecord(candidate.raw_data).google_maps_url)
        : null,
      titles,
    }, resolved),
    confidence: resolved.confidence,
    evidence: resolved.evidence,
    enriched_at: new Date().toISOString(),
  };
}

async function listCandidatesForBatch(params: BatchParams): Promise<LeadCandidate[]> {
  const tenantKey = await getActiveTenantKey();
  const limit = Math.min(Math.max(Number(params.limit ?? 50), 1), 100);
  if (params.candidate_ids?.length) {
    const rows: LeadCandidate[] = [];
    for (const id of params.candidate_ids.slice(0, limit)) {
      const candidate = await getCandidate(id);
      if (candidate) rows.push(candidate);
    }
    return rows;
  }

  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (params.job_id) {
    where.push('job_id = ?');
    values.push(params.job_id);
  }
  if (params.icp_id) {
    where.push('icp_id = ?');
    values.push(params.icp_id);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM lead_candidates WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ${limit}`,
    values as never[],
  );
  return (rows as LeadCandidate[]).map((row) => ({
    ...row,
    raw_data: normalizeRawData(row.raw_data),
  }));
}

export async function enrichCandidateDecisionMakers(params: BatchParams) {
  const tenantKey = await getActiveTenantKey();
  const titles = params.titles?.length ? params.titles : EXPORT_B2B_TITLES;
  const candidates = await listCandidatesForBatch(params);
  const results: Array<{ candidate_id: string; company: string; decision_makers: unknown[] }> = [];

  for (const candidate of candidates) {
    const raw = normalizeRawData(candidate.raw_data);
    const googleMapsUrl = typeof raw.google_maps_url === 'string'
      ? raw.google_maps_url
      : typeof raw.place_url === 'string'
        ? raw.place_url
        : null;
    const resolved = await resolveDecisionMaker({
      company: candidate.name,
      city: candidate.city,
      country: candidate.country,
      website: candidate.website,
      googleMapsUrl,
      titles,
    });
    const payload = decisionMakerPayload(candidate, resolved, titles);
    const existing = Array.isArray(raw.decision_makers) ? raw.decision_makers : [];
    const next = [
      payload,
      ...existing.filter((item) => {
        const row = asRecord(item);
        const key = String(row.linkedin_url ?? row.name ?? '').toLowerCase();
        const current = String(payload.linkedin_url ?? payload.name ?? '').toLowerCase();
        return !current || key !== current;
      }),
    ].slice(0, 10);
    const nextRaw = { ...raw, decision_makers: next };
    await pool.execute(
      'UPDATE lead_candidates SET raw_data = ? WHERE tenant_key = ? AND id = ?',
      [JSON.stringify(nextRaw), tenantKey, candidate.id],
    );
    results.push({ candidate_id: candidate.id, company: candidate.name, decision_makers: next });
  }

  return { processed: candidates.length, results };
}
