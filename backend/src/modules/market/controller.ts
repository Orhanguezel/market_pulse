import { randomUUID } from 'node:crypto';
import type { RouteHandler } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/db/client';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, dirname } from 'node:path';

const execAsync = promisify(exec);
import { db } from '@/db/client';
import { eq, like, and, asc, desc, sql, or } from 'drizzle-orm';
import {
  marketTargets, marketLeads, marketSignals,
  marketDeveloperNotes, marketTestRuns,
  targetToDto, leadToDto, signalToDto,
  marketDeveloperNoteToDto, marketTestRunToDto,
} from './schema';
import {
  targetListQuerySchema, targetCreateSchema, targetPatchSchema,
  leadListQuerySchema, leadCreateSchema, leadPatchSchema,
  signalListQuerySchema, signalCreateSchema,
  paspasExternalListQuerySchema,
  bulkImportSchema, paspasSyncSchema,
  marketDeveloperNoteCreateSchema,
  marketDeveloperNoteListQuerySchema,
  marketDeveloperNotePatchSchema,
  marketTestRunCreateSchema,
  marketTestRunListQuerySchema,
} from './validation';
import {
  getCustomerOrders,
  getPaspasCustomers,
  getPaspasProducts,
} from './external/paspas.repository';
import { computeChurnBreakdown, recalculateChurnScore } from './churn.service';
import { scanAndCreateSignals } from './competitor.signal';
import { generateWeeklyReport, sendWeeklyReportEmail } from './report.service';
import { syncPaspasCustomersToTargets, type PaspasSyncMode } from './external/paspas.sync';

function getRequestUserId(req: { user?: unknown }) {
  const user = req.user;
  if (typeof user !== 'object' || user === null) return null;
  const id = 'id' in user ? user.id : undefined;
  return id ? String(id) : null;
}

// ─── Targets ────────────────────────────────────────────────────────────────

export const listTargets: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = targetListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.q)        conditions.push(or(like(marketTargets.name, `%${q.q}%`), like(marketTargets.city, `%${q.q}%`)));
  if (q.category) conditions.push(eq(marketTargets.category, q.category));
  if (q.status)   conditions.push(eq(marketTargets.status, q.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const orderCol = q.sort === 'name' ? marketTargets.name
    : q.sort === 'churn_risk_score' ? marketTargets.churn_risk_score
    : marketTargets.created_at;
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [rows, countResult] = await Promise.all([
    db.select().from(marketTargets).where(where).orderBy(orderDir).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketTargets).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(targetToDto);
};

export const getTarget: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return targetToDto(rows[0]);
};

export const createTarget: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = targetCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketTargets).values({ id, ...parsed.data });
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, id)).limit(1);
  return reply.code(201).send(targetToDto(rows[0]!));
};

export const updateTarget: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = targetPatchSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  await db.update(marketTargets).set(parsed.data).where(eq(marketTargets.id, req.params.id));
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return targetToDto(rows[0]);
};

export const deleteTarget: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketTargets).where(eq(marketTargets.id, req.params.id));
  return reply.code(204).send();
};

// ─── Leads ──────────────────────────────────────────────────────────────────

export const listLeads: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = leadListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.q)        conditions.push(or(like(marketLeads.name, `%${q.q}%`), like(marketLeads.city, `%${q.q}%`), like(marketLeads.contact_name, `%${q.q}%`)));
  if (q.status)   conditions.push(eq(marketLeads.status, q.status));
  if (q.priority) conditions.push(eq(marketLeads.priority, q.priority));
  if (q.source)   conditions.push(eq(marketLeads.source, q.source));

  const where = conditions.length ? and(...conditions) : undefined;
  const orderCol = q.sort === 'name' ? marketLeads.name
    : q.sort === 'score' ? marketLeads.score
    : q.sort === 'priority' ? marketLeads.priority
    : marketLeads.created_at;
  const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

  const [rows, countResult] = await Promise.all([
    db.select().from(marketLeads).where(where).orderBy(orderDir).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketLeads).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(leadToDto);
};

export const getLead: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const rows = await db.select().from(marketLeads).where(eq(marketLeads.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return leadToDto(rows[0]);
};

export const createLead: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = leadCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketLeads).values({ id, ...parsed.data });
  const rows = await db.select().from(marketLeads).where(eq(marketLeads.id, id)).limit(1);
  return reply.code(201).send(leadToDto(rows[0]!));
};

export const updateLead: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = leadPatchSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const payload: typeof parsed.data & { converted_at?: Date | null } = { ...parsed.data };
  if (parsed.data.status === 'converted') {
    payload.converted_at = new Date();
  }
  await db.update(marketLeads).set(payload).where(eq(marketLeads.id, req.params.id));
  const rows = await db.select().from(marketLeads).where(eq(marketLeads.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return leadToDto(rows[0]);
};

export const getConversionStats: RouteHandler = async () => {
  const [stageCounts, recentConversions, bySource] = await Promise.all([
    db.select({
      status: marketLeads.status,
      count:  sql<number>`count(*)`,
    }).from(marketLeads).groupBy(marketLeads.status),

    db.select({
      id:           marketLeads.id,
      name:         marketLeads.name,
      source:       marketLeads.source,
      score:        marketLeads.score,
      converted_at: marketLeads.converted_at,
    }).from(marketLeads)
      .where(eq(marketLeads.status, 'converted'))
      .orderBy(desc(marketLeads.converted_at))
      .limit(5),

    db.select({
      source: marketLeads.source,
      count:  sql<number>`count(*)`,
    }).from(marketLeads)
      .where(eq(marketLeads.status, 'converted'))
      .groupBy(marketLeads.source)
      .orderBy(desc(sql<number>`count(*)`)),
  ]);

  return {
    stage_counts: stageCounts.map((r) => ({
      status: r.status,
      count:  Number(r.count),
    })),
    recent_conversions: recentConversions.map((r) => ({
      id:           r.id,
      name:         r.name,
      source:       r.source,
      score:        Number(r.score ?? 0),
      converted_at: r.converted_at,
    })),
    by_source: bySource.map((r) => ({
      source: r.source,
      count:  Number(r.count),
    })),
  };
};

export const deleteLead: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketLeads).where(eq(marketLeads.id, req.params.id));
  return reply.code(204).send();
};

// ─── Signals ─────────────────────────────────────────────────────────────────

export const listSignals: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = signalListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.target_id !== undefined)   conditions.push(eq(marketSignals.target_id, q.target_id));
  if (q.lead_id !== undefined)     conditions.push(eq(marketSignals.lead_id, q.lead_id));
  if (q.severity)                  conditions.push(eq(marketSignals.severity, q.severity));
  if (q.is_reviewed !== undefined) conditions.push(eq(marketSignals.is_reviewed, q.is_reviewed ? 1 : 0));

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(marketSignals).where(where).orderBy(desc(marketSignals.created_at)).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketSignals).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(signalToDto);
};

export const createSignal: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = signalCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketSignals).values({ id, ...parsed.data });
  const rows = await db.select().from(marketSignals).where(eq(marketSignals.id, id)).limit(1);
  return reply.code(201).send(signalToDto(rows[0]!));
};

export const reviewSignal: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.update(marketSignals)
    .set({ is_reviewed: 1, reviewed_at: new Date() })
    .where(eq(marketSignals.id, req.params.id));
  const rows = await db.select().from(marketSignals).where(eq(marketSignals.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return signalToDto(rows[0]);
};

export const deleteSignal: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketSignals).where(eq(marketSignals.id, req.params.id));
  return reply.code(204).send();
};

// ─── Test Center ────────────────────────────────────────────────────────────

export const listMarketTestRuns: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = marketTestRunListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.suite) conditions.push(eq(marketTestRuns.suite, q.suite));
  if (q.status) conditions.push(eq(marketTestRuns.status, q.status));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(marketTestRuns).where(where).orderBy(desc(marketTestRuns.created_at)).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketTestRuns).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(marketTestRunToDto);
};

export const createMarketTestRun: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = marketTestRunCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketTestRuns).values({
    id,
    ...parsed.data,
    created_by: getRequestUserId(req),
  });
  const rows = await db.select().from(marketTestRuns).where(eq(marketTestRuns.id, id)).limit(1);
  return reply.code(201).send(marketTestRunToDto(rows[0]!));
};

const ALLOWED_TEST_COMMANDS = new Set([
  'cd backend && bun test',
  'cd admin_panel && bun test',
  'cd admin_panel && bun run typecheck',
  'cd admin_panel && bun run build',
]);

type CommandRunner = (command: string) => Promise<{ stdout: string; stderr: string } | string>;

function getTestCommandCwd() {
  return basename(process.cwd()) === 'backend' ? dirname(process.cwd()) : process.cwd();
}

async function defaultCommandRunner(command: string) {
  return execAsync(command, { cwd: getTestCommandCwd() }) as Promise<{ stdout: string; stderr: string }>;
}

let marketTestCommandRunner: CommandRunner = defaultCommandRunner;

export function setMarketTestCommandRunnerForTests(runner?: CommandRunner) {
  marketTestCommandRunner = runner ?? defaultCommandRunner;
}

export const executeMarketTestRun: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = req.body as { suite?: string; title?: string; command?: string };
  if (!body.suite || !body.command) {
    return reply.code(400).send({ error: { message: 'missing_suite_or_command' } });
  }
  const command = body.command.trim();
  if (!ALLOWED_TEST_COMMANDS.has(command)) {
    return reply.code(400).send({ error: { message: 'unsafe_command' } });
  }

  let outputExcerpt = '';
  let status: 'passed' | 'failed' = 'failed';
  let passCount = 0;
  let failCount = 0;

  try {
    const execResult = await marketTestCommandRunner(command) as unknown;
    const stdout = typeof execResult === 'string'
      ? execResult
      : (execResult as { stdout?: string }).stdout ?? '';
    const stderr = typeof execResult === 'string'
      ? ''
      : (execResult as { stderr?: string }).stderr ?? '';
    outputExcerpt = (stdout + '\n' + stderr).trim().slice(-1000);
    status = 'passed';
    const passMatch = stdout.match(/(\d+)\s+pass/i);
    const failMatch = stdout.match(/(\d+)\s+fail/i);
    if (passMatch) passCount = parseInt(passMatch[1], 10);
    if (failMatch) failCount = parseInt(failMatch[1], 10);
  } catch (error: unknown) {
    status = 'failed';
    const e = error as { stdout?: string; stderr?: string; message?: string };
    const out = (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + (e.message || '');
    outputExcerpt = out.trim().slice(-1000);
    const passMatch = out.match(/(\d+)\s+pass/i);
    const failMatch = out.match(/(\d+)\s+fail/i);
    if (passMatch) passCount = parseInt(passMatch[1], 10);
    if (failMatch) failCount = parseInt(failMatch[1], 10);
  }

  const id = randomUUID();
  await db.insert(marketTestRuns).values({
    id,
    suite: body.suite,
    title: body.title || body.suite,
    command,
    status,
    pass_count: passCount,
    fail_count: failCount,
    skip_count: 0,
    output_excerpt: outputExcerpt,
    created_by: getRequestUserId(req),
  });

  const rows = await db.select().from(marketTestRuns).where(eq(marketTestRuns.id, id)).limit(1);
  return reply.code(201).send(marketTestRunToDto(rows[0]!));
};

// ─── Developer Notes ────────────────────────────────────────────────────────

export const listMarketDeveloperNotes: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = marketDeveloperNoteListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  const q = parsed.data;
  const conditions = [];
  if (q.status) conditions.push(eq(marketDeveloperNotes.status, q.status));
  if (q.priority) conditions.push(eq(marketDeveloperNotes.priority, q.priority));
  if (q.page_path) conditions.push(eq(marketDeveloperNotes.page_path, q.page_path));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select().from(marketDeveloperNotes).where(where).orderBy(desc(marketDeveloperNotes.created_at)).limit(q.limit).offset(q.offset),
    db.select({ count: sql<number>`count(*)` }).from(marketDeveloperNotes).where(where),
  ]);
  reply.header('x-total-count', String(Number(countResult[0]?.count ?? 0)));
  return rows.map(marketDeveloperNoteToDto);
};

export const createMarketDeveloperNote: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = marketDeveloperNoteCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const id = randomUUID();
  await db.insert(marketDeveloperNotes).values({
    id,
    ...parsed.data,
    created_by: getRequestUserId(req),
  });
  const rows = await db.select().from(marketDeveloperNotes).where(eq(marketDeveloperNotes.id, id)).limit(1);
  return reply.code(201).send(marketDeveloperNoteToDto(rows[0]!));
};

export const updateMarketDeveloperNote: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const parsed = marketDeveloperNotePatchSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  await db.update(marketDeveloperNotes).set(parsed.data).where(eq(marketDeveloperNotes.id, req.params.id));
  const rows = await db.select().from(marketDeveloperNotes).where(eq(marketDeveloperNotes.id, req.params.id)).limit(1);
  if (!rows[0]) return reply.code(404).send({ error: { message: 'not_found' } });
  return marketDeveloperNoteToDto(rows[0]);
};

export const deleteMarketDeveloperNote: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await db.delete(marketDeveloperNotes).where(eq(marketDeveloperNotes.id, req.params.id));
  return reply.code(204).send();
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getMarketStats: RouteHandler = async (_req, _reply) => {
  const [targets, leads, signals] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(marketTargets),
    db.select({ count: sql<number>`count(*)` }).from(marketLeads),
    db.select({ count: sql<number>`count(*)` }).from(marketSignals).where(eq(marketSignals.is_reviewed, 0)),
  ]);

  return {
    totalTargets:     Number(targets[0]?.count ?? 0),
    totalLeads:       Number(leads[0]?.count ?? 0),
    pendingSignals:   Number(signals[0]?.count ?? 0),
  };
};

// ─── External: Paspas ERP ───────────────────────────────────────────────────

export const listPaspasCustomers: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = paspasExternalListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  try {
    return await getPaspasCustomers(parsed.data.q, parsed.data.limit);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

export const listPaspasProducts: RouteHandler<{ Querystring: unknown }> = async (req, reply) => {
  const parsed = paspasExternalListQuerySchema.safeParse(req.query);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });

  try {
    return await getPaspasProducts(parsed.data.q, parsed.data.limit);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

export const listPaspasCustomerOrders: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    return await getCustomerOrders(req.params.id);
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

// ─── Churn ──────────────────────────────────────────────────────────────────

export const recalculateTargetChurn: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const score = await recalculateChurnScore(req.params.id);
    return { id: req.params.id, churnRiskScore: score };
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

// ─── Paspas Sync ────────────────────────────────────────────────────────────

export const syncPaspasTargets: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = paspasSyncSchema.safeParse(req.body ?? {});
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  try {
    const result = await syncPaspasCustomersToTargets(parsed.data.mode as PaspasSyncMode);
    return {
      ok:       true,
      inserted: result.inserted,
      updated:  result.updated,
      total:    result.total,
      message:  `${result.total} kayıt işlendi: ${result.inserted} eklendi, ${result.updated} güncellendi.`,
    };
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

// ─── Bulk Import ─────────────────────────────────────────────────────────────

const CSV_HEADER = 'name,category,website,phone,email,contact_name,city,district,notes';
const CSV_EXAMPLE = 'Örnek Bayi A.Ş.,dealer,https://example.com,05321234567,info@example.com,Ahmet Yılmaz,İstanbul,Kadıköy,';

export const downloadImportTemplate: RouteHandler = async (_req, reply) => {
  const csv = `${CSV_HEADER}\n${CSV_EXAMPLE}\n`;
  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', 'attachment; filename="hedef-sablonu.csv"')
    .send(csv);
};

export const bulkImportTargets: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const parsed = bulkImportSchema.safeParse(req.body);
  if (!parsed.success)
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });

  const { rows, dry_run, on_conflict } = parsed.data;
  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;
  const preview: Array<typeof rows[number] & { _action: 'insert' | 'update' | 'skip' }> = [];

  for (const row of rows) {
    // Duplicate detection: website öncelikli, yoksa name
    const existingRows = row.website
      ? await db.select({ id: marketTargets.id }).from(marketTargets).where(eq(marketTargets.website, row.website)).limit(1)
      : await db.select({ id: marketTargets.id }).from(marketTargets).where(eq(marketTargets.name, row.name)).limit(1);

    const existing = existingRows[0];

    if (existing) {
      if (on_conflict === 'update') {
        if (!dry_run) {
          await db.update(marketTargets).set({
            name:         row.name,
            category:     row.category ?? 'prospect',
            website:      row.website ?? null,
            phone:        row.phone ?? null,
            email:        row.email ?? null,
            contact_name: row.contact_name ?? null,
            city:         row.city ?? null,
            district:     row.district ?? null,
            notes:        row.notes ?? null,
          }).where(eq(marketTargets.id, existing.id));
        }
        preview.push({ ...row, _action: 'update' });
        updated++;
      } else {
        preview.push({ ...row, _action: 'skip' });
        skipped++;
      }
    } else {
      if (!dry_run) {
        await db.insert(marketTargets).values({
          id:           randomUUID(),
          name:         row.name,
          category:     row.category ?? 'prospect',
          status:       'active',
          website:      row.website ?? null,
          phone:        row.phone ?? null,
          email:        row.email ?? null,
          contact_name: row.contact_name ?? null,
          city:         row.city ?? null,
          district:     row.district ?? null,
          notes:        row.notes ?? null,
        });
      }
      preview.push({ ...row, _action: 'insert' });
      inserted++;
    }
  }

  return { inserted, updated, skipped, total: rows.length, dry_run, preview };
};

// ─── Competitor Scan ─────────────────────────────────────────────────────────

// ─── Per-target Intel (aggregated detail) ───────────────────────────────────
//
// One request returns everything the target detail panel needs to render:
//   - the target row (DTO form)
//   - churn score with the three contributors broken out
//   - recent signals (latest 20, newest first)
//   - paspas order history (latest 30) + a coarse 90d/prev90d trend bucket
//
// Drives the expandable row on /admin/market/targets.

export const targetIntel: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const rows = await db.select().from(marketTargets).where(eq(marketTargets.id, req.params.id)).limit(1);
  const row = rows[0];
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  let churn: Awaited<ReturnType<typeof computeChurnBreakdown>> | null = null;
  try { churn = await computeChurnBreakdown(req.params.id); } catch { /* keep null */ }

  const [signalRows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, target_id, signal_type, severity, title, description, source_url,
            is_reviewed, created_at, data
       FROM market_signals
      WHERE target_id = ?
      ORDER BY created_at DESC
      LIMIT 20`,
    [req.params.id],
  );

  let orders: Awaited<ReturnType<typeof getCustomerOrders>> = [];
  let ordersError: string | null = null;
  if (row.paspas_customer_id) {
    try {
      orders = await getCustomerOrders(row.paspas_customer_id);
    } catch (e) {
      ordersError = e instanceof Error ? e.message : 'paspas_fetch_failed';
    }
  }

  // Coarse 90d vs previous-90d trend (used by the panel and shows up next to
  // 'Sipariş Geçmişi'). Done in JS instead of SQL so we don't hammer paspas
  // with a second query.
  const now = Date.now();
  const window90 = 90 * 86_400_000;
  const last90  = orders.filter((o) => now - new Date(o.siparisTarihi).getTime() <= window90);
  const prev90  = orders.filter((o) => {
    const age = now - new Date(o.siparisTarihi).getTime();
    return age > window90 && age <= 2 * window90;
  });
  const sum = (arr: typeof orders) => arr.reduce((acc, o) => acc + (o.toplamTutar || 0), 0);
  const orderTrend = {
    last90_count:  last90.length,
    last90_value:  sum(last90),
    prev90_count:  prev90.length,
    prev90_value:  sum(prev90),
    delta_pct: prev90.length === 0 ? null : Math.round(((last90.length - prev90.length) / prev90.length) * 1000) / 10,
  };

  return {
    target: targetToDto(row),
    churn,
    signals: signalRows,
    orders: {
      latest: orders.slice(0, 30),
      trend: orderTrend,
      error: ordersError,
    },
  };
};

export const scanCompetitor: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  try {
    const result = await scanAndCreateSignals(req.params.id);
    // Each scan creates new signals; churn score depends on signals, so refresh
    // it immediately so the UI doesn't display a stale value.
    await recalculateChurnScore(req.params.id);
    return result;
  } catch (e) {
    if (e instanceof Error && 'statusCode' in e) {
      return reply.code(Number((e as { statusCode: number }).statusCode)).send({ error: { message: e.message } });
    }
    throw e;
  }
};

export const scanAllCompetitors: RouteHandler = async (_req, _reply) => {
  const allActive = await db
    .select({ id: marketTargets.id, website: marketTargets.website })
    .from(marketTargets)
    .where(eq(marketTargets.status, 'active'));

  const scannable = allActive.filter((t) => t.website && String(t.website).trim());
  const without_website = allActive.length - scannable.length;

  const results = await Promise.allSettled(scannable.map(t => scanAndCreateSignals(t.id)));
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed    = results.filter(r => r.status === 'rejected').length;
  const signals   = results.reduce((acc, r) =>
    r.status === 'fulfilled' ? acc + r.value.signals_created : acc, 0);

  // Refresh churn scores for everything we just touched.
  for (const r of results) {
    if (r.status === 'fulfilled') {
      try { await recalculateChurnScore(r.value.target_id); } catch { /* keep going */ }
    }
  }

  return {
    total_active: allActive.length,
    scanned: scannable.length,
    succeeded,
    failed,
    signals_created: signals,
    without_website,
  };
};

// ─── Reports ────────────────────────────────────────────────────────────────

export const previewWeeklyReport: RouteHandler = async (_req, reply) => {
  const pdf = await generateWeeklyReport();
  return reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', 'inline; filename="marketpulse-weekly-report.pdf"')
    .send(pdf);
};

export const sendWeeklyReport: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const body = (req.body ?? {}) as { to?: unknown };
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  if (!to || !to.includes('@')) return reply.code(400).send({ error: { message: 'valid_recipient_required' } });
  await sendWeeklyReportEmail(to);
  return { ok: true };
};
