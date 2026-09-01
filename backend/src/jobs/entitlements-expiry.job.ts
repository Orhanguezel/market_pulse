import type { FastifyInstance } from 'fastify';
import { suspendExpiredModules } from '@/modules/entitlements/service';

const DAY_MS = 24 * 60 * 60 * 1000;

function nextRunDelay(hour: number) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

// B4: her gün süresi (expires_at) geçmiş tenant modüllerini 'suspended' yapar.
export function registerEntitlementsExpiryJob(app: FastifyInstance) {
  let interval: NodeJS.Timeout | null = null;
  const run = () =>
    void suspendExpiredModules()
      .then((n) => {
        if (n > 0) app.log.info({ suspended: n }, 'entitlements_expiry_job');
      })
      .catch((err) => app.log.error({ err }, 'entitlements_expiry_job_failed'));

  const timeout = setTimeout(() => {
    run();
    interval = setInterval(run, DAY_MS);
  }, nextRunDelay(3));

  app.addHook('onClose', async () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  });
}
