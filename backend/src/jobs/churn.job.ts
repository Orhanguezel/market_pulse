import type { FastifyInstance } from 'fastify';
import { recalculateAllChurnScores } from '@/modules/market/churn.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function nextRunDelay(hour: number) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function registerChurnJob(app: FastifyInstance) {
  let interval: NodeJS.Timeout | null = null;
  const timeout = setTimeout(() => {
    void recalculateAllChurnScores().catch((err) => app.log.error({ err }, 'churn_job_failed'));
    interval = setInterval(() => {
      void recalculateAllChurnScores().catch((err) => app.log.error({ err }, 'churn_job_failed'));
    }, DAY_MS);
  }, nextRunDelay(2));

  app.addHook('onClose', async () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  });
}
