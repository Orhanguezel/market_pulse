import type { RouteHandler } from 'fastify';
import { pool } from '@/db/client';
import { approveCandidateToMarketLead } from './_shared/candidate.helpers';
import {
  createSearchJob,
  getCandidate,
  getSearchJob,
  insertCandidate,
  listCandidates,
  listSearchJobs,
  updateCandidateReview,
  updateSearchJob,
  type CandidateStatus,
  type LeadChannel,
} from './_shared/db';
import { runAmazonJob } from './amazon/amazon.job';
import { getLatestAmazonRiskReport, listAmazonScanProducts } from './amazon/risk-report.service';
import { runB2bJob } from './b2b/b2b.job';
import { runFairJob } from './fair/fair.job';
import {
  createIcpProfile,
  deleteIcpProfile,
  getIcpProfile,
  listIcpProfiles,
  updateIcpProfile,
} from './icp/icp.repository';
import { enrichCandidate, listCandidateEnrichment } from './enrichment/enrichment.service';
import { generateOutreachEmail, listOutreachDrafts, updateOutreachDraft } from './outreach/outreach.service';
import { scanCompetitorPage } from './competitor/competitor.scraper';
import { verifyScraperWebhook } from './_shared/scraper.client';

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function runInBackground(task: Promise<unknown>) {
  task.catch(() => undefined);
}

export const listLeadCandidates: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const q = asRecord(req.query);
  const limit = Math.min(100, Math.max(1, Number(q.limit ?? 25)));
  const page = Math.max(1, Number(q.page ?? 1));
  const result = await listCandidates({
    channel: typeof q.channel === 'string' ? q.channel : undefined,
    status: typeof q.status === 'string' ? q.status : undefined,
    jobId: typeof q.job_id === 'string' ? q.job_id : undefined,
    limit,
    offset: (page - 1) * limit,
  });
  reply.header('x-total-count', String(result.count));
  return result.rows;
};

export const reviewCandidate: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  const action = body.action;
  const status: CandidateStatus | null = action === 'approve' ? 'approved'
    : action === 'reject' ? 'rejected'
    : action === 'favorite' ? 'favorite'
    : null;
  if (!status) return reply.code(400).send({ error: { message: 'invalid_action' } });
  const candidate = await updateCandidateReview(req.params.id, status, typeof body.reject_reason === 'string' ? body.reject_reason : null);
  if (!candidate) return reply.code(404).send({ error: { message: 'not_found' } });
  return candidate;
};

export const approveToLead: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const candidate = await getCandidate(req.params.id);
  if (!candidate) return reply.code(404).send({ error: { message: 'not_found' } });
  const lead = await approveCandidateToMarketLead(candidate);
  await updateCandidateReview(req.params.id, 'approved');
  return reply.code(201).send(lead);
};

export const scraperCallback: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const raw = req.headers['x-scraper-signature'] ?? req.headers['x-signature'];
  const signature = Array.isArray(raw) ? raw[0] : raw;
  const rawBody = JSON.stringify(req.body ?? {});
  if (!verifyScraperWebhook(Buffer.from(rawBody), signature, process.env.SCRAPER_CALLBACK_SECRET ?? '')) {
    return reply.code(401).send({ error: { message: 'invalid_signature' } });
  }
  const body = asRecord(req.body);
  const jobId = typeof body.job_id === 'string' ? body.job_id : '';
  if (!jobId) return reply.code(400).send({ error: { message: 'missing_job_id' } });
  const job = await getSearchJob(jobId);
  if (!job) return reply.code(404).send({ error: { message: 'job_not_found' } });
  let inserted = 0;
  const result = asRecord(body.result);
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  for (const item of candidates) {
    const candidate = asRecord(item);
    if (typeof candidate.name !== 'string') continue;
    await insertCandidate({
      jobId,
      channel: job.channel,
      icpId: job.icp_id,
      name: candidate.name,
      website: typeof candidate.website === 'string' ? candidate.website : null,
      country: typeof candidate.country === 'string' ? candidate.country : null,
      city: typeof candidate.city === 'string' ? candidate.city : null,
      phone: typeof candidate.phone === 'string' ? candidate.phone : null,
      email: typeof candidate.email === 'string' ? candidate.email : null,
      contactName: typeof candidate.contact_name === 'string' ? candidate.contact_name : null,
      rawData: candidate.raw_data ?? candidate,
      aiSummary: typeof candidate.ai_summary === 'string' ? candidate.ai_summary : null,
      leadScore: typeof candidate.lead_score === 'number' ? candidate.lead_score : 0,
    });
    inserted += 1;
  }
  await updateSearchJob(jobId, {
    status: body.status === 'failed' ? 'failed' : body.status === 'completed' ? 'done' : 'running',
    resultCount: inserted || undefined,
    errorMsg: typeof body.error === 'string' ? body.error : null,
    finished: body.status === 'completed' || body.status === 'failed',
  });
  return { ok: true, inserted };
};

export const rejectionPatterns: RouteHandler = async () => {
  const [rows] = await pool.execute(
    `SELECT channel, LOWER(TRIM(reject_reason)) AS pattern, COUNT(*) AS count, MAX(reviewed_at) AS last_seen
     FROM lead_candidates
     WHERE status = 'rejected' AND reject_reason IS NOT NULL AND reject_reason <> ''
     GROUP BY channel, LOWER(TRIM(reject_reason))
     ORDER BY count DESC
     LIMIT 50`,
  );
  return rows;
};

export const listIcp: RouteHandler = async () => listIcpProfiles();

export const getIcp: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const profile = await getIcpProfile(req.params.id);
  if (!profile) return reply.code(404).send({ error: { message: 'not_found' } });
  return profile;
};

export const createIcp: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  if (typeof body.name !== 'string') return reply.code(400).send({ error: { message: 'name_required' } });
  return reply.code(201).send(await createIcpProfile({ name: body.name, definition: body.definition ?? {}, is_active: body.is_active !== false }));
};

export const updateIcp: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  const profile = await updateIcpProfile(req.params.id, {
    name: typeof body.name === 'string' ? body.name : undefined,
    definition: body.definition,
    is_active: typeof body.is_active === 'boolean' ? body.is_active : undefined,
  });
  if (!profile) return reply.code(404).send({ error: { message: 'not_found' } });
  return profile;
};

export const deleteIcp: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    await deleteIcpProfile(req.params.id);
    return reply.code(204).send();
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) return reply.code(Number((e as Error & { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    throw e;
  }
};

async function createAndRunJob(channel: LeadChannel, body: Record<string, unknown>) {
  const icpId = typeof body.icp_id === 'string' ? body.icp_id : null;
  const job = await createSearchJob(channel, body, icpId);
  if (!job) throw new Error('JOB_CREATE_FAILED');
  if (channel === 'amazon') runInBackground(runAmazonJob(job.id));
  if (channel === 'b2b_directory') runInBackground(runB2bJob(job.id));
  if (channel === 'trade_fair') runInBackground(runFairJob(job.id));
  return job;
}

export const startAmazonJob: RouteHandler<{ Body: unknown }> = async (req, reply) => reply.code(201).send(await createAndRunJob('amazon', asRecord(req.body)));
export const startAmazonScan: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  if (typeof body.keyword !== 'string' || !body.keyword.trim()) {
    return reply.code(400).send({ error: { message: 'keyword_required' } });
  }
  return reply.code(201).send(await createAndRunJob('amazon', {
    ...body,
    keyword: body.keyword.trim(),
    marketplace: typeof body.marketplace === 'string' ? body.marketplace : 'com',
  }));
};
function amazonRiskReportFromRow(row: Record<string, unknown>) {
  return {
    keyword: row.keyword,
    scanned_at: row.created_at,
    data_points: Number(row.data_points ?? 0),
    scores: {
      category_risk: {
        score: Number(row.category_risk_score ?? 0),
        confidence: row.category_risk_confidence,
        reason: String(row.category_risk_reason ?? ''),
      },
      sku_chaos: {
        score: Number(row.sku_chaos_score ?? 0),
        confidence: row.sku_chaos_confidence,
        reason: String(row.sku_chaos_reason ?? ''),
      },
      price_war_risk: {
        score: Number(row.price_war_score ?? 0),
        confidence: row.price_war_confidence,
        reason: String(row.price_war_reason ?? ''),
      },
      brand_reliability: {
        score: Number(row.brand_reliability_score ?? 0),
        confidence: row.brand_reliability_confidence,
        reason: String(row.brand_reliability_reason ?? ''),
      },
      operational_risk: {
        score: Number(row.operational_risk_score ?? 0),
        confidence: row.operational_risk_confidence,
        reason: String(row.operational_risk_reason ?? ''),
      },
    },
    composite_score: row.composite_score === null || row.composite_score === undefined ? null : Number(row.composite_score),
    decision: row.decision,
    summary: row.summary ?? '',
  };
}

export const listAmazonJobs: RouteHandler = async () => {
  const jobs = await listSearchJobs('amazon');
  if (!jobs.length) return jobs;
  const placeholders = jobs.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT *
     FROM amazon_risk_scores
     WHERE job_id IN (${placeholders})
     ORDER BY created_at DESC`,
    jobs.map((job) => job.id),
  );
  const riskByJobId = new Map<string, ReturnType<typeof amazonRiskReportFromRow>>();
  for (const row of rows as Record<string, unknown>[]) {
    const jobId = String(row.job_id ?? '');
    if (jobId && !riskByJobId.has(jobId)) {
      riskByJobId.set(jobId, amazonRiskReportFromRow(row));
    }
  }
  return jobs.map((job) => ({
    ...job,
    risk_report: riskByJobId.get(job.id),
  }));
};
export const getAmazonJob: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const job = await getSearchJob(req.params.id);
  if (!job || job.channel !== 'amazon') return reply.code(404).send({ error: { message: 'not_found' } });
  return job;
};

export const getAmazonScan: RouteHandler<{ Params: { jobId: string } }> = async (req, reply) => {
  const [rows] = await pool.execute('SELECT * FROM amazon_scan_jobs WHERE id = ? LIMIT 1', [req.params.jobId]);
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return row;
};

export const listAmazonScanProductsHandler: RouteHandler<{ Params: { jobId: string }; Querystring: unknown }> = async (req) => {
  const q = asRecord(req.query);
  const limit = q.limit === undefined ? 100 : Number(q.limit);
  return listAmazonScanProducts(req.params.jobId, limit);
};

export const startB2bJob: RouteHandler<{ Body: unknown }> = async (req, reply) => reply.code(201).send(await createAndRunJob('b2b_directory', asRecord(req.body)));
export const listB2bJobs: RouteHandler = async () => listSearchJobs('b2b_directory');

export const startFairJob: RouteHandler<{ Body: unknown }> = async (req, reply) => reply.code(201).send(await createAndRunJob('trade_fair', asRecord(req.body)));
export const listFairJobs: RouteHandler = async () => listSearchJobs('trade_fair');
export const fairSuggestions: RouteHandler = async () => [];

export const enrichOne: RouteHandler<{ Params: { candidateId: string } }> = async (req, reply) => reply.code(201).send(await enrichCandidate(req.params.candidateId));
export const listEnrichment: RouteHandler<{ Params: { candidateId: string } }> = async (req) => listCandidateEnrichment(req.params.candidateId);
export const enrichBatch: RouteHandler<{ Body: unknown }> = async (req) => {
  const ids = Array.isArray(asRecord(req.body).candidate_ids) ? asRecord(req.body).candidate_ids as string[] : [];
  const selected = ids.slice(0, 50);
  return Promise.all(selected.map(id => enrichCandidate(id)));
};

export const generateOutreach: RouteHandler<{ Params: { candidateId: string } }> = async (req, reply) => reply.code(201).send(await generateOutreachEmail(req.params.candidateId));
export const listDrafts: RouteHandler<{ Querystring: unknown }> = async (req) => {
  const q = asRecord(req.query);
  return listOutreachDrafts(typeof q.candidate_id === 'string' ? q.candidate_id : undefined, typeof q.market_lead_id === 'string' ? q.market_lead_id : undefined);
};
export const updateDraft: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const draft = await updateOutreachDraft(req.params.id, asRecord(req.body) as { subject?: string; body?: string; status?: string });
  if (!draft) return reply.code(404).send({ error: { message: 'not_found' } });
  return draft;
};

export const competitorScan: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  const url = typeof body.url === 'string' ? body.url : null;
  if (!url) return reply.code(400).send({ error: { message: 'url_required' } });
  return scanCompetitorPage(url);
};

export const getAmazonRiskScores: RouteHandler<{ Params: { keyword: string }; Querystring: unknown }> = async (req, reply) => {
  const keyword = decodeURIComponent(req.params.keyword);
  const q = asRecord(req.query);
  const marketplace = typeof q.marketplace === 'string' ? q.marketplace : 'com';
  const report = await getLatestAmazonRiskReport(keyword, marketplace);
  if (!report) return reply.code(404).send({ error: { message: 'no_score_found' } });
  return report;
};
