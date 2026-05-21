// =============================================================
// FILE: backend/src/jobs/marketplace.job.ts
// Nightly scan of every active target's marketplace storefronts.
// Runs at 08:00 server local time. Mirrors the structure of
// churn.job.ts (setTimeout + setInterval).
// =============================================================
import type { FastifyInstance } from 'fastify';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/db/client';
import { scanMarketplaceForTarget, type Marketplace } from '@/modules/market/marketplace.signal';
import { recalculateChurnScore } from '@/modules/market/churn.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const PLATFORMS: Marketplace[] = ['hepsiburada', 'trendyol', 'amazon'];

function nextRunDelay(hour: number) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Sleep that won't accidentally hold the event loop for tests. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scanAllMarketplaces(app?: FastifyInstance): Promise<{
  scanned: number;
  failed: number;
  signals_created: number;
}> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, hepsiburada_url, trendyol_url, amazon_url
       FROM market_targets
      WHERE status = 'active'
        AND (hepsiburada_url IS NOT NULL OR trendyol_url IS NOT NULL OR amazon_url IS NOT NULL)`,
  );
  const targets = rows as Array<{
    id: string;
    hepsiburada_url: string | null;
    trendyol_url: string | null;
    amazon_url: string | null;
  }>;

  let scanned = 0;
  let failed = 0;
  let signalsCreated = 0;
  const touchedTargets = new Set<string>();

  for (const target of targets) {
    for (const platform of PLATFORMS) {
      const url =
        platform === 'hepsiburada' ? target.hepsiburada_url
        : platform === 'trendyol'  ? target.trendyol_url
        : target.amazon_url;
      if (!url) continue;

      try {
        const result = await scanMarketplaceForTarget(target.id, platform);
        scanned += 1;
        signalsCreated += result.signals_created;
        touchedTargets.add(target.id);
      } catch (err) {
        failed += 1;
        app?.log.warn({ targetId: target.id, platform, err }, 'marketplace_scan_failed');
      }
      // small breather so we don't slam scraper-service when there are many targets
      await sleep(2000);
    }
  }

  // Refresh churn after the batch finishes so the score reflects any new
  // signals raised by diff detection.
  for (const id of touchedTargets) {
    try { await recalculateChurnScore(id); } catch { /* keep going */ }
  }

  return { scanned, failed, signals_created: signalsCreated };
}

export function registerMarketplaceJob(app: FastifyInstance) {
  let interval: NodeJS.Timeout | null = null;
  const timeout = setTimeout(() => {
    void scanAllMarketplaces(app)
      .then((r) => app.log.info({ ...r }, 'marketplace_job_complete'))
      .catch((err) => app.log.error({ err }, 'marketplace_job_failed'));
    interval = setInterval(() => {
      void scanAllMarketplaces(app)
        .then((r) => app.log.info({ ...r }, 'marketplace_job_complete'))
        .catch((err) => app.log.error({ err }, 'marketplace_job_failed'));
    }, DAY_MS);
  }, nextRunDelay(8));

  app.addHook('onClose', async () => {
    clearTimeout(timeout);
    if (interval) clearInterval(interval);
  });
}
