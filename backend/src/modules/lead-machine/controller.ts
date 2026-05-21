import type { FastifyReply, RouteHandler } from 'fastify';
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
import { getLatestAmazonRiskReport, getAmazonScanProducts } from './amazon/risk-report.service';
import { rescoreForJob } from './amazon/rescore.service';
import { runB2bJob } from './b2b/b2b.job';
import { runFairJob } from './fair/fair.job';
import { generateFairBriefingPdf, listFairBriefingCandidateIdsForDay } from './fair/briefing.service';
import { buildGenericFairRunnerParams } from './fair/fair.runner';
import {
  createIcpProfile,
  deleteIcpProfile,
  getIcpProfile,
  listIcpProfiles,
  updateIcpProfile,
} from './icp/icp.repository';
import { enrichCandidate, listCandidateEnrichment } from './enrichment/enrichment.service';
import {
  generateOutreachEmail,
  listOutreachDrafts,
  sendOutreachDraft,
  trackOutreachOpen,
  updateOutreachDraft,
} from './outreach/outreach.service';
import { scanCompetitorPage } from './competitor/competitor.scraper';
import {
  aggregateRejectionPatterns,
  listScanRules,
  createScanRule,
  deleteScanRule,
  getRejectionStats,
  getApprovedStats,
} from './scan-rules.service';
import {
  listSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
  updateSavedSearch,
} from './amazon/saved-searches.service';
import { verifyScraperWebhook } from './_shared/scraper.client';

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function parseJsonField(row: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = row[key];
  if (typeof value === 'string') {
    try { return { ...row, [key]: JSON.parse(value) }; } catch { /* keep as-is */ }
  }
  return row;
}

function runInBackground(task: Promise<unknown>) {
  task.catch(() => undefined);
}

function queueCandidateEnrichment(candidateId: string) {
  setTimeout(() => runInBackground(enrichCandidate(candidateId)), 0);
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
  const rejectTags = Array.isArray(body.reject_tags) ? (body.reject_tags as unknown[]).filter((t): t is string => typeof t === 'string') : null;
  const candidate = await updateCandidateReview(
    req.params.id,
    status,
    typeof body.reject_reason === 'string' ? body.reject_reason : null,
    null,
    rejectTags?.length ? rejectTags : null,
  );
  if (!candidate) return reply.code(404).send({ error: { message: 'not_found' } });
  if (status === 'approved' || status === 'favorite') queueCandidateEnrichment(req.params.id);
  return candidate;
};

export const approveToLead: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const candidate = await getCandidate(req.params.id);
  if (!candidate) return reply.code(404).send({ error: { message: 'not_found' } });
  const lead = await approveCandidateToMarketLead(candidate);
  await updateCandidateReview(req.params.id, 'approved');
  queueCandidateEnrichment(req.params.id);
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

export const aggregateRejectionPatternsHandler: RouteHandler = async () => aggregateRejectionPatterns();

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
export const listAmazonJobs: RouteHandler = async () => {
  const [rows] = await pool.execute(
    `SELECT lsj.*, ars.decision, ars.composite_score, ars.data_points
     FROM lead_search_jobs lsj
     LEFT JOIN amazon_risk_scores ars ON ars.job_id = lsj.id
     WHERE lsj.channel = 'amazon'
     ORDER BY lsj.created_at DESC
     LIMIT 100`
  );
  return (rows as any[]).map(row => {
    const job = parseJsonField(row, 'params');
    if (row.decision) {
      job.risk_report = {
        decision: row.decision,
        composite_score: row.composite_score != null ? Number(row.composite_score) : null,
        data_points: row.data_points != null ? Number(row.data_points) : 0,
      };
    }
    return job;
  });
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

export const startB2bJob: RouteHandler<{ Body: unknown }> = async (req, reply) => reply.code(201).send(await createAndRunJob('b2b_directory', asRecord(req.body)));
export const listB2bJobs: RouteHandler = async () => listSearchJobs('b2b_directory');

export const startFairJob: RouteHandler<{ Body: unknown }> = async (req, reply) => reply.code(201).send(await createAndRunJob('trade_fair', asRecord(req.body)));
export const listFairJobs: RouteHandler = async () => listSearchJobs('trade_fair');
export const fairSuggestions: RouteHandler = async () => [];
export const startGenericFairRunner: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  try {
    return reply.code(201).send(await createAndRunJob('trade_fair', { ...buildGenericFairRunnerParams(asRecord(req.body)) }));
  } catch (e) {
    if (e instanceof Error && (e.message === 'FAIR_URL_REQUIRED' || e.message === 'ICP_ID_REQUIRED')) {
      return reply.code(400).send({ error: { message: e.message.toLowerCase() } });
    }
    throw e;
  }
};

function pdfReply(reply: FastifyReply, pdf: Buffer, filename: string) {
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', `inline; filename="${filename}"`)
    .send(pdf);
}

export const fairBriefingCandidatePdf: RouteHandler<{ Params: { candidateId: string } }> = async (req, reply) => {
  const pdf = await generateFairBriefingPdf([req.params.candidateId]);
  return pdfReply(reply, pdf, `fair-briefing-${req.params.candidateId}.pdf`);
};

export const fairBriefingBulkPdf: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
  const pdf = await generateFairBriefingPdf(ids.slice(0, 100));
  return pdfReply(reply, pdf, 'fair-briefing-bulk.pdf');
};

export const fairBriefingDayPdf: RouteHandler<{ Params: { date: string } }> = async (req, reply) => {
  const ids = await listFairBriefingCandidateIdsForDay(req.params.date);
  const pdf = await generateFairBriefingPdf(ids);
  return pdfReply(reply, pdf, `fair-briefing-${req.params.date}.pdf`);
};

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
  const body = asRecord(req.body);
  const draft = await updateOutreachDraft(req.params.id, {
    subject: typeof body.subject === 'string' ? body.subject : undefined,
    body: typeof body.body === 'string' ? body.body : undefined,
    status: typeof body.status === 'string' ? body.status : undefined,
    reply_status: 'reply_status' in body ? (body.reply_status === null ? null : String(body.reply_status)) : undefined,
  });
  if (!draft) return reply.code(404).send({ error: { message: 'not_found' } });
  return draft;
};

export const sendDraft: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  try {
    return await sendOutreachDraft(req.params.id, typeof body.to === 'string' ? body.to : null);
  } catch (e) {
    if (e instanceof Error && e.message === 'DRAFT_NOT_FOUND') {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }
    if (e instanceof Error && e.message === 'OUTREACH_RECIPIENT_NOT_FOUND') {
      return reply.code(422).send({ error: { message: 'recipient_not_found' } });
    }
    throw e;
  }
};

const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64');

export const openTrackingPixel: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await trackOutreachOpen(req.params.id);
  return reply
    .header('content-type', 'image/gif')
    .header('cache-control', 'no-store, no-cache, must-revalidate, max-age=0')
    .send(TRACKING_PIXEL);
};

export const getLeadCandidate: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const candidate = await getCandidate(req.params.id);
  if (!candidate) return reply.code(404).send({ error: { message: 'not_found' } });
  return candidate;
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

export const getBulkAmazonRiskScores: RouteHandler<{ Body: unknown }> = async (req) => {
  const body = asRecord(req.body);
  const rawKeywords = Array.isArray(body.keywords) ? body.keywords : [];
  const keywords = rawKeywords
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
    .slice(0, 15)
    .map((k) => k.trim());
  const marketplace = typeof body.marketplace === 'string' ? body.marketplace : 'com';

  const results = await Promise.all(
    keywords.map(async (kw) => {
      const report = await getLatestAmazonRiskReport(kw, marketplace);
      return { keyword: kw, marketplace, report: report ?? null };
    }),
  );
  return results;
};

export const getAmazonScanProductsList: RouteHandler<{ Params: { jobId: string } }> = async (req, reply) => {
  const products = await getAmazonScanProducts(req.params.jobId);
  if (!products.length) return reply.code(404).send({ error: { message: 'no_products_found' } });
  return { products };
};

export const getKeepaUsage: RouteHandler = async () => {
  const [todayRows] = await pool.execute(
    `SELECT budget_date, token_budget, tokens_used FROM amazon_keepa_daily_budget WHERE budget_date = CURDATE() LIMIT 1`,
  );
  const todayRow = (todayRows as Array<{ budget_date: string; token_budget: string | number; tokens_used: string | number }>)[0] ?? null;
  const today = todayRow ? {
    budget_date: todayRow.budget_date,
    token_budget: Number(todayRow.token_budget),
    tokens_used: Number(todayRow.tokens_used),
    remaining: Math.max(0, Number(todayRow.token_budget) - Number(todayRow.tokens_used)),
  } : null;

  const [historyRows] = await pool.execute(
    `SELECT budget_date, token_budget, tokens_used FROM amazon_keepa_daily_budget ORDER BY budget_date DESC LIMIT 7`,
  );
  const history = (historyRows as Array<{ budget_date: string; token_budget: string | number; tokens_used: string | number }>).map(r => ({
    budget_date: String(r.budget_date).slice(0, 10),
    token_budget: Number(r.token_budget),
    tokens_used: Number(r.tokens_used),
  }));

  const [queueRows] = await pool.execute(
    `SELECT
       SUM(status = 'pending')                                    AS pending,
       SUM(status = 'done' AND DATE(processed_at) = CURDATE())   AS done_today,
       SUM(status = 'failed')                                     AS failed_total
     FROM amazon_keepa_queue`,
  );
  const q = (queueRows as Array<{ pending: string | number | null; done_today: string | number | null; failed_total: string | number | null }>)[0] ?? {};
  const queue = {
    pending: Number(q.pending ?? 0),
    done_today: Number(q.done_today ?? 0),
    failed_total: Number(q.failed_total ?? 0),
  };

  return { today, history, queue };
};

export const feedbackRejectionStats: RouteHandler = async () => getRejectionStats();
export const feedbackApprovedStats: RouteHandler = async () => getApprovedStats();

export const listRules: RouteHandler<{ Querystring: unknown }> = async (req) => {
  const q = asRecord(req.query);
  const icpId = typeof q.icp_id === 'string' ? q.icp_id : undefined;
  return listScanRules(icpId);
};

export const createRule: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  if (typeof body.value !== 'string' || !body.value.trim()) {
    return reply.code(400).send({ error: { message: 'value_required' } });
  }
  const rule = await createScanRule({
    icp_id: typeof body.icp_id === 'string' ? body.icp_id : null,
    channel: typeof body.channel === 'string' ? body.channel : null,
    rule_type: typeof body.rule_type === 'string' ? body.rule_type : 'exclude_reject_tag',
    value: body.value.trim(),
    label: typeof body.label === 'string' ? body.label : null,
  });
  return reply.code(201).send(rule);
};

export const deleteRule: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await deleteScanRule(req.params.id);
  return reply.code(204).send();
};

export const rescoreAmazonJob: RouteHandler<{ Params: { jobId: string }; Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  const exclude = asRecord(body.exclude);
  const toStringArray = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

  const result = await rescoreForJob(req.params.jobId, {
    product_urls: toStringArray(exclude.product_urls),
    seller_names: toStringArray(exclude.seller_names),
    title_keywords: toStringArray(exclude.title_keywords),
    asins: toStringArray(exclude.asins),
  });

  if (!result) return reply.code(404).send({ error: { message: 'job_not_found' } });
  return result;
};

// ─── Saved Searches ──────────────────────────────────────────────────────────

export const listSavedSearchesHandler: RouteHandler = async () => listSavedSearches();

export const createSavedSearchHandler: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  if (typeof body.keyword !== 'string' || !body.keyword.trim())
    return reply.code(400).send({ error: { message: 'keyword_required' } });
  const label = typeof body.label === 'string' && body.label.trim()
    ? body.label.trim()
    : body.keyword as string;
  const result = await createSavedSearch({
    label,
    keyword:          (body.keyword as string).trim(),
    marketplace:      typeof body.marketplace === 'string' ? body.marketplace : 'com',
    watchlistEnabled: body.watchlist_enabled === true,
  });
  return reply.code(201).send(result);
};

export const updateSavedSearchHandler: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const body = asRecord(req.body);
  await updateSavedSearch(req.params.id, {
    watchlistEnabled: typeof body.watchlist_enabled === 'boolean' ? body.watchlist_enabled : undefined,
  });
  return reply.code(204).send();
};

export const deleteSavedSearchHandler: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await deleteSavedSearch(req.params.id);
  return reply.code(204).send();
};

export const runSavedSearchHandler: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const [rows] = await pool.execute(
    'SELECT * FROM amazon_saved_searches WHERE id = ?',
    [req.params.id],
  ) as [Array<{ keyword: string; marketplace: string }>, unknown];
  const saved = rows[0];
  if (!saved) return reply.code(404).send({ error: { message: 'not_found' } });

  const job = await createAndRunJob('amazon', {
    keyword:     saved.keyword,
    marketplace: saved.marketplace,
  });
  await updateSavedSearch(req.params.id, {
    lastJobId:  (job as { id: string }).id,
    lastRunAt: new Date(),
  });
  return reply.code(201).send(job);
};
