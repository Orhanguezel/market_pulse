import type { FastifyInstance } from 'fastify';
import { env } from '@/core/env';
import { sendWeeklyReportEmail } from '@/modules/market/report.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function nextMondayDelay() {
  const now = new Date();
  const next = new Date(now);
  const day = next.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  next.setDate(next.getDate() + daysUntilMonday);
  next.setHours(8, 0, 0, 0);
  return next.getTime() - now.getTime();
}

export function registerReportJob(app: FastifyInstance) {
  if (!env.REPORT_EMAIL_TO) return;
  let interval: NodeJS.Timeout | null = null;
  const timeout = setTimeout(() => {
    void sendWeeklyReportEmail(env.REPORT_EMAIL_TO).catch((err) => app.log.error({ err }, 'weekly_report_job_failed'));
    interval = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1) {
        void sendWeeklyReportEmail(env.REPORT_EMAIL_TO).catch((err) => app.log.error({ err }, 'weekly_report_job_failed'));
      }
    }, DAY_MS);
  }, nextMondayDelay());

  app.addHook('onClose', async () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  });
}
