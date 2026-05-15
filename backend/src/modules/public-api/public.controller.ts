import type { RouteHandler } from 'fastify';
import type { JwtUser } from '@/middleware/auth';
import { pool } from '@/db/client';
import { createSearchJob, getSearchJob } from '@/modules/lead-machine/_shared/db';
import { runAmazonJob } from '@/modules/lead-machine/amazon/amazon.job';
import { getLatestAmazonRiskReport } from '@/modules/lead-machine/amazon/risk-report.service';
import { checkAndConsumeQuota, getQuotaStatus } from './quota.repository';
import { getByokStatus, saveByokKey, deleteByokKey } from './byok.service';

function runInBackground(p: Promise<unknown>) {
  p.catch(() => undefined);
}

function getJwtUser(req: { user?: unknown }): JwtUser | null {
  const u = req.user;
  if (typeof u !== 'object' || u === null) return null;
  return u as JwtUser;
}

// GET /public/amazon/quota
export const getMyQuota: RouteHandler = async (req, reply) => {
  const jwtUser = getJwtUser(req as { user?: unknown });
  const userId = jwtUser?.sub;
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  return getQuotaStatus(userId);
};

// POST /public/amazon/scan
export const publicStartScan: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const jwtUser = getJwtUser(req as { user?: unknown });
  const userId = jwtUser?.sub;
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
  if (!keyword) return reply.code(400).send({ error: { message: 'keyword_required' } });

  const marketplace = typeof body.marketplace === 'string' ? body.marketplace : 'com';

  const { allowed, quota } = await checkAndConsumeQuota(userId);
  if (!allowed) {
    return reply.code(429).send({
      error: { message: 'daily_limit_reached', plan: quota.plan, daily_limit: quota.daily_limit },
    });
  }

  const job = await createSearchJob('amazon', { keyword, marketplace, created_by: userId }, null, userId);
  if (!job) return reply.code(500).send({ error: { message: 'job_create_failed' } });
  runInBackground(runAmazonJob(job.id));

  return reply.code(201).send({ ...job, quota });
};

// GET /public/amazon/scan/:jobId
export const publicGetScan: RouteHandler<{ Params: { jobId: string } }> = async (req, reply) => {
  const job = await getSearchJob(req.params.jobId);
  if (!job) return reply.code(404).send({ error: { message: 'not_found' } });

  // Attach risk report if job is done
  if (job.status === 'done') {
    const p = (job.params ?? {}) as Record<string, unknown>;
    const keyword = typeof p.keyword === 'string' ? p.keyword : '';
    const marketplace = typeof p.marketplace === 'string' ? p.marketplace : 'com';
    if (keyword) {
      const report = await getLatestAmazonRiskReport(keyword, marketplace);
      return { ...job, risk_report: report ?? null };
    }
  }
  return job;
};

// GET /public/amazon/scan/:jobId/products
export const publicGetScanProducts: RouteHandler<{ Params: { jobId: string } }> = async (req, reply) => {
  const [rows] = await pool.execute(
    `SELECT asin, title, price, rating, review_count, seller_count, brand, product_url
     FROM amazon_products WHERE job_id = ? ORDER BY rank ASC LIMIT 200`,
    [req.params.jobId],
  );
  return rows;
};

// POST /public/amazon/bulk-scores
export const publicGetBulkRiskScores: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const keywords = Array.isArray(body.keywords)
    ? (body.keywords as unknown[]).filter((k) => typeof k === 'string').slice(0, 15) as string[]
    : [];
  if (keywords.length < 2) return reply.code(400).send({ error: { message: 'at_least_2_keywords' } });
  const marketplace = typeof body.marketplace === 'string' ? body.marketplace : 'com';
  const reports = await Promise.all(
    keywords.map(async (kw) => ({
      keyword: kw,
      marketplace,
      report: await getLatestAmazonRiskReport(kw, marketplace).catch(() => null),
    })),
  );
  return reports;
};

// GET /public/amazon/risk-scores/:keyword
export const publicGetRiskScores: RouteHandler<{ Params: { keyword: string }; Querystring: unknown }> = async (req, reply) => {
  const keyword = decodeURIComponent(req.params.keyword);
  const q = (req.query && typeof req.query === 'object' ? req.query : {}) as Record<string, unknown>;
  const marketplace = typeof q.marketplace === 'string' ? q.marketplace : 'com';
  const report = await getLatestAmazonRiskReport(keyword, marketplace);
  if (!report) return reply.code(404).send({ error: { message: 'no_score_found' } });
  return report;
};

// GET /public/amazon/byok
export const publicGetByokStatus: RouteHandler = async (req, reply) => {
  const jwtUser = getJwtUser(req as { user?: unknown });
  const userId = jwtUser?.sub;
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  return getByokStatus(userId);
};

// POST /public/amazon/byok
export const publicSaveByokKey: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const jwtUser = getJwtUser(req as { user?: unknown });
  const userId = jwtUser?.sub;
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
  const apiKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';
  if (!apiKey) return reply.code(400).send({ error: { message: 'api_key_required' } });
  await saveByokKey(userId, apiKey);
  return { ok: true };
};

// DELETE /public/amazon/byok
export const publicDeleteByokKey: RouteHandler = async (req, reply) => {
  const jwtUser = getJwtUser(req as { user?: unknown });
  const userId = jwtUser?.sub;
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });
  await deleteByokKey(userId);
  return { ok: true };
};

// GET /public/amazon/history
export const publicGetHistory: RouteHandler = async (req, reply) => {
  const jwtUser = getJwtUser(req as { user?: unknown });
  const userId = jwtUser?.sub;
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const [rows] = await pool.execute(
    `SELECT lsj.id, lsj.status, lsj.created_at, lsj.finished_at, lsj.params,
            ars.decision, ars.composite_score, ars.confidence
     FROM lead_search_jobs lsj
     LEFT JOIN amazon_risk_scores ars ON ars.job_id = lsj.id
     WHERE lsj.channel = 'amazon' AND lsj.created_by = ?
     ORDER BY lsj.created_at DESC
     LIMIT 50`,
    [userId],
  );
  return (rows as Record<string, unknown>[]).map((row) => {
    const params = typeof row.params === 'string' ? JSON.parse(row.params) : (row.params ?? {});
    return {
      id: row.id,
      status: row.status,
      keyword: params.keyword ?? '',
      marketplace: params.marketplace ?? 'com',
      created_at: row.created_at,
      finished_at: row.finished_at,
      decision: row.decision ?? null,
      composite_score: row.composite_score != null ? Number(row.composite_score) : null,
      confidence: row.confidence ?? null,
    };
  });
};
