import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@/middleware/auth';
import { requireModule } from '@/modules/entitlements';
import { runWithTenant } from '@/core/tenant-context';
import { getRequiredTenantKey } from '@/modules/_shared';
import { createAccount } from '@/modules/crm/accounts.service';
import { createContact } from '@/modules/crm/contacts.service';
import { createSearchJob, getSearchJob, insertCandidate, listSearchJobs } from '../_shared/db';
import { runDecisionMakerFinder, buildSearchHints, SECTOR_PRESETS, DEFAULT_TITLES, EXPORT_B2B_TITLES, DEFAULT_EXCLUDE_KEYWORDS, type FinderParams, type CompanyQualityStatus, type DecisionMakerReviewStatus } from './finder.service';
import { saveCompanyPool, saveDecisionMakers, listCompanyPool, listSavedDecisionMakers, updateDecisionMakerReview, updateCompanyPoolStatus } from './persist.service';
import { runDecisionMakerJob, isDecisionMakerJob } from './job.service';
import { decisionMakersToCsv, decisionMakersToXlsx } from './export.service';

/**
 * Karar Verici Bulma (OSINT) — Places havuzu + Apollo people-search.
 * /api/v1/lead-machine/decision-makers/* — requireAuth + requireModule('leads').
 */
export async function registerDecisionMakerPublic(app: FastifyInstance) {
  const guard = { preHandler: [requireAuth, requireModule('leads')] };

  // Sektör/unvan presetleri (UI için)
  app.get('/lead-machine/decision-makers/presets', guard, async () => ({
    sectors: Object.keys(SECTOR_PRESETS),
    business_types: SECTOR_PRESETS,
    default_titles: DEFAULT_TITLES,
    export_b2b_titles: EXPORT_B2B_TITLES,
    default_exclude_keywords: DEFAULT_EXCLUDE_KEYWORDS,
  }));

  // Yarı-manuel OSINT asistanı: Google operatörleri + LinkedIn arama URL'i (firma bazlı)
  app.post('/lead-machine/decision-makers/search-hints', guard, async (req, reply) => {
    const body = (req.body ?? {}) as { company?: string; city?: string; country?: string; titles?: string[] };
    if (!body.company) return reply.status(400).send({ error: { message: 'company_required' } });
    return buildSearchHints(body.company, body.country, body.titles, body.city);
  });

  // Senkron çalıştır → satırlar + istatistik (ilk faz; ileride job'a alınabilir)
  app.post('/lead-machine/decision-makers/find', guard, async (req, reply) => {
    const body = (req.body ?? {}) as Partial<FinderParams>;
    if (!Array.isArray(body.cities) || body.cities.length === 0) {
      return reply.status(400).send({ error: { message: 'cities_required' } });
    }
    const result = await runDecisionMakerFinder({
      sector: body.sector,
      businessTypes: body.businessTypes,
      cities: body.cities.slice(0, 8),
      country: body.country,
      titles: body.titles,
      excludeKeywords: Array.isArray((body as { excludeKeywords?: unknown }).excludeKeywords)
        ? (body as { excludeKeywords: unknown[] }).excludeKeywords.filter((item): item is string => typeof item === 'string')
        : undefined,
      apolloFallback: body.apolloFallback === true,
      perCityLimit: body.perCityLimit,
      targetCount: body.targetCount,
    });
    // Kalıcı kaydet (UPSERT) — sayfa yenilense de kalır, tekrar aramada birikir.
    const savedCompanies = await saveCompanyPool(result.companyPool, body.sector).catch(() => 0);
    const savedCount = await saveDecisionMakers(result.rows, body.sector).catch(() => 0);
    return { ...result, saved: savedCount, savedCompanies };
  });

  // Kayıtlı (birikmiş) karar vericiler — sayfa açılışında yüklenir.
  app.get('/lead-machine/decision-makers/saved', guard, async () => {
    const rows = await listSavedDecisionMakers();
    return { rows, stats: { companies: rows.length, withDecisionMaker: rows.filter((r) => r.decision_maker_name).length } };
  });

  app.get('/lead-machine/decision-makers/company-pool', guard, async (req) => {
    const q = (req.query ?? {}) as { job_id?: string; status?: string; include_excluded?: string; limit?: string };
    const rows = await listCompanyPool({
      jobId: q.job_id,
      status: q.status === 'all' ? 'all' : q.status as never,
      includeExcluded: q.include_excluded === 'true',
      limit: Number(q.limit ?? 500),
    });
    return {
      rows,
      stats: {
        total: rows.length,
        qualified: rows.filter((row) => row.quality_status === 'qualified').length,
        possible: rows.filter((row) => row.quality_status === 'possible').length,
        manualReview: rows.filter((row) => row.quality_status === 'manual_review').length,
        excluded: rows.filter((row) => row.quality_status === 'excluded').length,
      },
    };
  });

  app.post('/lead-machine/decision-makers/jobs', guard, async (req, reply) => {
    const body = parseFinderBody(req.body);
    if (!Array.isArray(body.cities) || body.cities.length === 0) {
      return reply.status(400).send({ error: { message: 'cities_required' } });
    }
    const tenantKey = getRequiredTenantKey();
    const job = await createSearchJob('decision_maker', {
      ...body,
      cities: body.cities.slice(0, 20),
      targetCount: Math.min(Number(body.targetCount ?? 50), 200),
    }, null);
    if (!job) return reply.status(500).send({ error: { message: 'job_create_failed' } });
    runInBackground(runWithTenant(tenantKey, () => runDecisionMakerJob(job.id)));
    return reply.status(201).send(job);
  });

  app.get('/lead-machine/decision-makers/jobs', guard, async () => listSearchJobs('decision_maker'));

  app.get('/lead-machine/decision-makers/jobs/:id', guard, async (req, reply) => {
    const job = await getSearchJob((req.params as { id: string }).id);
    if (!isDecisionMakerJob(job)) return reply.status(404).send({ error: { message: 'not_found' } });
    return job;
  });

  app.get('/lead-machine/decision-makers/results', guard, async (req) => {
    const q = (req.query ?? {}) as { job_id?: string; confidence?: string; sector?: string; limit?: string };
    const rows = await listSavedDecisionMakers({
      jobId: q.job_id,
      confidence: parseConfidence(q.confidence),
      sector: q.sector,
      limit: Number(q.limit ?? 500),
    });
    return { rows, stats: { companies: rows.length, withDecisionMaker: rows.filter((row) => row.decision_maker_name).length } };
  });

  app.get('/lead-machine/decision-makers/export.csv', guard, async (req, reply) => {
    const q = (req.query ?? {}) as { job_id?: string; confidence?: string; sector?: string; limit?: string };
    const rows = await listSavedDecisionMakers({
      jobId: q.job_id,
      confidence: parseConfidence(q.confidence),
      sector: q.sector,
      limit: Number(q.limit ?? 1000),
    });
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="decision-makers.csv"')
      .send(decisionMakersToCsv(rows));
  });

  app.get('/lead-machine/decision-makers/export.xlsx', guard, async (req, reply) => {
    const q = (req.query ?? {}) as { job_id?: string; confidence?: string; sector?: string; limit?: string };
    const rows = await listSavedDecisionMakers({
      jobId: q.job_id,
      confidence: parseConfidence(q.confidence),
      sector: q.sector,
      limit: Number(q.limit ?? 1000),
    });
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="decision-makers.xlsx"')
      .send(decisionMakersToXlsx(rows));
  });

  registerReviewRoutes(app, guard);
}

function parseFinderBody(body: unknown): Partial<FinderParams> {
  return body && typeof body === 'object' ? body as Partial<FinderParams> : {};
}

/** Manuel inceleme/red aksiyonları — hem public (guard) hem admin register'da paylaşılır. */
function registerReviewRoutes(app: FastifyInstance, routeOpts: Record<string, unknown>) {
  app.post('/lead-machine/decision-makers/:id/review', routeOpts, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const status = parseReviewStatus((req.body as { status?: unknown } | undefined)?.status);
    if (!status) return reply.status(400).send({ error: { message: 'invalid_status' } });
    const ok = await updateDecisionMakerReview(id, status);
    if (!ok) return reply.status(404).send({ error: { message: 'not_found' } });
    return { id, review_status: status };
  });

  app.post('/lead-machine/decision-makers/company-pool/:id/status', routeOpts, async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { status?: unknown; exclude_reason?: unknown };
    const status = parseQualityStatus(body.status);
    if (!status) return reply.status(400).send({ error: { message: 'invalid_status' } });
    const reason = typeof body.exclude_reason === 'string' ? body.exclude_reason : null;
    const ok = await updateCompanyPoolStatus(id, status, reason);
    if (!ok) return reply.status(404).send({ error: { message: 'not_found' } });
    return { id, quality_status: status };
  });
}

function parseConfidence(value: unknown): 'A' | 'B' | 'C' | null {
  return value === 'A' || value === 'B' || value === 'C' ? value : null;
}

function parseReviewStatus(value: unknown): DecisionMakerReviewStatus | null {
  return value === 'pending' || value === 'verified' || value === 'rejected' || value === 'manual_review' ? value : null;
}

function parseQualityStatus(value: unknown): CompanyQualityStatus | null {
  return value === 'qualified' || value === 'possible' || value === 'manual_review' || value === 'excluded' ? value : null;
}

function runInBackground(task: Promise<unknown>) {
  task.catch(() => undefined);
}

function scoreForConfidence(confidence: 'A' | 'B' | 'C') {
  if (confidence === 'A') return 9;
  if (confidence === 'B') return 7;
  return 4;
}

function splitPersonName(name: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first_name: null, last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts.at(-1) ?? null };
}

export async function registerDecisionMakerAdmin(app: FastifyInstance) {
  app.addHook('preHandler', requireModule('leads'));

  app.get('/lead-machine/decision-makers/presets', async () => ({
    sectors: Object.keys(SECTOR_PRESETS),
    business_types: SECTOR_PRESETS,
    default_titles: DEFAULT_TITLES,
    export_b2b_titles: EXPORT_B2B_TITLES,
    default_exclude_keywords: DEFAULT_EXCLUDE_KEYWORDS,
  }));

  app.post('/lead-machine/decision-makers/search-hints', async (req, reply) => {
    const body = (req.body ?? {}) as { company?: string; city?: string; country?: string; titles?: string[] };
    if (!body.company) return reply.status(400).send({ error: { message: 'company_required' } });
    return buildSearchHints(body.company, body.country, body.titles, body.city);
  });

  app.post('/lead-machine/decision-makers/jobs', async (req, reply) => {
    const body = parseFinderBody(req.body);
    if (!Array.isArray(body.cities) || body.cities.length === 0) {
      return reply.status(400).send({ error: { message: 'cities_required' } });
    }
    const tenantKey = getRequiredTenantKey();
    const job = await createSearchJob('decision_maker', {
      ...body,
      cities: body.cities.slice(0, 20),
      targetCount: Math.min(Number(body.targetCount ?? 50), 200),
    }, null);
    if (!job) return reply.status(500).send({ error: { message: 'job_create_failed' } });
    runInBackground(runWithTenant(tenantKey, () => runDecisionMakerJob(job.id)));
    return reply.status(201).send(job);
  });

  app.get('/lead-machine/decision-makers/jobs', async () => listSearchJobs('decision_maker'));

  app.get('/lead-machine/decision-makers/jobs/:id', async (req, reply) => {
    const job = await getSearchJob((req.params as { id: string }).id);
    if (!isDecisionMakerJob(job)) return reply.status(404).send({ error: { message: 'not_found' } });
    return job;
  });

  app.get('/lead-machine/decision-makers/results', async (req) => {
    const q = (req.query ?? {}) as { job_id?: string; confidence?: string; sector?: string; limit?: string };
    const rows = await listSavedDecisionMakers({
      jobId: q.job_id,
      confidence: parseConfidence(q.confidence),
      sector: q.sector,
      limit: Number(q.limit ?? 500),
    });
    return { rows, stats: { companies: rows.length, withDecisionMaker: rows.filter((row) => row.decision_maker_name).length } };
  });

  app.get('/lead-machine/decision-makers/company-pool', async (req) => {
    const q = (req.query ?? {}) as { job_id?: string; status?: string; include_excluded?: string; limit?: string };
    const rows = await listCompanyPool({
      jobId: q.job_id,
      status: q.status === 'all' ? 'all' : q.status as never,
      includeExcluded: q.include_excluded === 'true',
      limit: Number(q.limit ?? 500),
    });
    return {
      rows,
      stats: {
        total: rows.length,
        qualified: rows.filter((row) => row.quality_status === 'qualified').length,
        possible: rows.filter((row) => row.quality_status === 'possible').length,
        manualReview: rows.filter((row) => row.quality_status === 'manual_review').length,
        excluded: rows.filter((row) => row.quality_status === 'excluded').length,
      },
    };
  });

  app.get('/lead-machine/decision-makers/export.csv', async (req, reply) => {
    const q = (req.query ?? {}) as { job_id?: string; confidence?: string; sector?: string; limit?: string };
    const rows = await listSavedDecisionMakers({
      jobId: q.job_id,
      confidence: parseConfidence(q.confidence),
      sector: q.sector,
      limit: Number(q.limit ?? 1000),
    });
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="decision-makers.csv"')
      .send(decisionMakersToCsv(rows));
  });

  app.get('/lead-machine/decision-makers/export.xlsx', async (req, reply) => {
    const q = (req.query ?? {}) as { job_id?: string; confidence?: string; sector?: string; limit?: string };
    const rows = await listSavedDecisionMakers({
      jobId: q.job_id,
      confidence: parseConfidence(q.confidence),
      sector: q.sector,
      limit: Number(q.limit ?? 1000),
    });
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="decision-makers.xlsx"')
      .send(decisionMakersToXlsx(rows));
  });

  registerReviewRoutes(app, {});

  app.post('/lead-machine/decision-makers/promote-candidates', async (req, reply) => {
    const body = (req.body ?? {}) as { job_id?: string; confidence?: string; limit?: number };
    if (!body.job_id) return reply.status(400).send({ error: { message: 'job_id_required' } });
    const confidence = body.confidence === 'all' ? null : parseConfidence(body.confidence);
    const rows = await listSavedDecisionMakers({
      jobId: body.job_id,
      confidence,
      limit: Math.min(Math.max(Number(body.limit ?? 200), 1), 500),
    });
    let created = 0;
    for (const row of rows) {
      await insertCandidate({
        jobId: body.job_id,
        channel: 'decision_maker',
        name: row.company_name,
        website: row.company_website,
        country: 'TR',
        city: row.city,
        contactName: row.decision_maker_name,
        rawData: {
          source: 'decision_maker_module',
          business_type: row.business_type,
          source_url: row.source_url,
          social_url: row.social_url,
          confidence_score: row.confidence_score,
          fit_note: row.fit_note,
          decision_makers: row.decision_maker_name ? [{
            name: row.decision_maker_name,
            title: row.title,
            linkedin_url: row.linkedin_profile_url,
            confidence: row.confidence_score,
            source_url: row.source_url,
          }] : [],
        },
        aiSummary: row.fit_note,
        leadScore: scoreForConfidence(row.confidence_score),
        decision: row.confidence_score === 'C' ? 'MANUAL_REVIEW' : 'GO',
      });
      created++;
    }
    return { created, total: rows.length };
  });

  app.post('/lead-machine/decision-makers/promote-crm', async (req, reply) => {
    const body = (req.body ?? {}) as { job_id?: string; confidence?: string; limit?: number };
    if (!body.job_id) return reply.status(400).send({ error: { message: 'job_id_required' } });
    const confidence = body.confidence === 'all' ? null : parseConfidence(body.confidence);
    const rows = await listSavedDecisionMakers({
      jobId: body.job_id,
      confidence,
      limit: Math.min(Math.max(Number(body.limit ?? 200), 1), 500),
    });
    let accounts = 0;
    let contacts = 0;
    for (const row of rows) {
      const account = await createAccount({
        name: row.company_name,
        website: row.company_website,
        country: 'TR',
        city: row.city,
        industry: row.business_type,
        raw_data: {
          source: 'decision_maker_module',
          confidence_score: row.confidence_score,
          source_url: row.source_url,
          fit_note: row.fit_note,
        },
      });
      accounts++;
      const accountId = typeof (account as Record<string, unknown> | null)?.id === 'string'
        ? (account as Record<string, string>).id
        : null;
      if (row.decision_maker_name || row.linkedin_profile_url) {
        const name = splitPersonName(row.decision_maker_name);
        await createContact({
          account_id: accountId,
          first_name: name.first_name,
          last_name: name.last_name,
          title: row.title,
          linkedin_url: row.linkedin_profile_url,
        });
        contacts++;
      }
    }
    return { accounts, contacts, total: rows.length };
  });
}
