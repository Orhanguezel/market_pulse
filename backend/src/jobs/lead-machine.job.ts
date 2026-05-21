import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { sendDueOutreachReminders, sendDuePostShowFollowups } from '@/modules/lead-machine/outreach/outreach.service';
import { aggregateRejectionPatterns } from '@/modules/lead-machine/scan-rules.service';
import { captureServerException } from '@/plugins/sentry';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STARTUP_DELAY_MS = 5 * 60 * 1000;
const SCRAPER_HEALTH_MS = 15 * 60 * 1000;

export async function checkScraperServiceHealth() {
  const base = env.SCRAPER_SERVICE_URL.replace(/\/+$/, '');
  const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`scraper_health_failed:${res.status}`);
  return { ok: true, status: res.status };
}

export function registerLeadMachineJobs(app: FastifyInstance) {
  let interval: NodeJS.Timeout | null = null;
  let reminderInterval: NodeJS.Timeout | null = null;
  let scraperHealthInterval: NodeJS.Timeout | null = null;
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
    if (interval) clearInterval(interval);
    if (reminderInterval) clearInterval(reminderInterval);
    if (scraperHealthInterval) clearInterval(scraperHealthInterval);
  });
}
