import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { sendDueOutreachReminders, sendDuePostShowFollowups } from '@/modules/lead-machine/outreach/outreach.service';
import { registerMailQueueWorker } from '@/modules/lead-machine/outreach/mail-queue';
import { aggregateRejectionPatterns } from '@/modules/lead-machine/scan-rules.service';
import { captureServerException } from '@/plugins/sentry';
import { pool } from '@/db/client';
import { runWithTenantAndUser } from '@/core/tenant-context';
import { runFairJob } from '@/modules/lead-machine/fair/fair.job';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 5 * 60 * 1000;
const SCRAPER_HEALTH_MS = 15 * 60 * 1000;
const FAIR_RECOVERY_DELAY_MS = 15 * 1000;

type RecoverableFairJob = { id: string; tenant_key: string; owner_user_id: string | null };

export async function recoverInterruptedFairJobs(app: FastifyInstance) {
  const [rows] = await pool.execute(
    `SELECT id, tenant_key, owner_user_id
       FROM lead_search_jobs
      WHERE channel = 'trade_fair' AND status = 'running' AND finished_at IS NULL
      ORDER BY started_at ASC
      LIMIT 10`,
  );
  for (const job of rows as RecoverableFairJob[]) {
    if (!job.owner_user_id) {
      await pool.execute(
        `UPDATE lead_search_jobs SET status = 'failed', error_msg = 'INTERRUPTED_OWNER_CONTEXT_MISSING', finished_at = CURRENT_TIMESTAMP
          WHERE id = ? AND tenant_key = ? AND status = 'running'`,
        [job.id, job.tenant_key],
      );
      continue;
    }
    app.log.info({ job_id: job.id, tenant_key: job.tenant_key, owner_user_id: job.owner_user_id }, 'fair_job_recovery_started');
    void runWithTenantAndUser(job.tenant_key, job.owner_user_id, () => runFairJob(job.id))
      .then(() => app.log.info({ job_id: job.id, tenant_key: job.tenant_key }, 'fair_job_recovery_finished'))
      .catch((err) => app.log.error({ err, job_id: job.id, tenant_key: job.tenant_key }, 'fair_job_recovery_failed'));
  }
  return { recovered: (rows as RecoverableFairJob[]).filter((job) => job.owner_user_id).length };
}

export async function checkScraperServiceHealth() {
  const base = env.SCRAPER_SERVICE_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`scraper_health_failed:${res.status}`);
  return { ok: true, status: res.status };
}

export function registerLeadMachineJobs(app: FastifyInstance) {
  registerMailQueueWorker(app);

  let interval: NodeJS.Timeout | null = null;
  let reminderInterval: NodeJS.Timeout | null = null;
  let scraperHealthInterval: NodeJS.Timeout | null = null;
  const recoveryTimeout = setTimeout(() => {
    void recoverInterruptedFairJobs(app)
      .then((result) => app.log.info({ result }, 'fair_job_recovery_scan_finished'))
      .catch((err) => app.log.error({ err }, 'fair_job_recovery_scan_failed'));
  }, FAIR_RECOVERY_DELAY_MS);
  const run = () => {
    void aggregateRejectionPatterns()
      .then((result) => app.log.info({ result }, 'lead_rejection_patterns_aggregated'))
      .catch((err) => app.log.error({ err }, 'lead_rejection_patterns_job_failed'));
  };
  const runReminders = () => {
    void Promise.all([sendDueOutreachReminders(), sendDuePostShowFollowups()])
      .then(([reminder, followup]) => app.log.info({ reminder, followup }, 'lead_outreach_sequences_processed'))
      .catch((err) => app.log.error({ err }, 'lead_outreach_reminder_job_failed'));
  };
  const runScraperHealth = () => {
    void checkScraperServiceHealth()
      .then((result) => app.log.info({ result, scraper_url: env.SCRAPER_SERVICE_URL }, 'scraper_service_health_ok'))
      .catch((err) => {
        app.log.error({ err, scraper_url: env.SCRAPER_SERVICE_URL }, 'scraper_service_health_failed');
        captureServerException(err, { module: 'scraper_service_health', scraper_url: env.SCRAPER_SERVICE_URL });
      });
  };

  const timeout = setTimeout(() => {
    run();
    interval = setInterval(run, SIX_HOURS_MS);
    runReminders();
    reminderInterval = setInterval(runReminders, ONE_DAY_MS);
    runScraperHealth();
    scraperHealthInterval = setInterval(runScraperHealth, SCRAPER_HEALTH_MS);
  }, STARTUP_DELAY_MS);

  app.addHook('onClose', async () => {
    clearTimeout(timeout);
    clearTimeout(recoveryTimeout);
    if (interval) clearInterval(interval);
    if (reminderInterval) clearInterval(reminderInterval);
    if (scraperHealthInterval) clearInterval(scraperHealthInterval);
  });
}
