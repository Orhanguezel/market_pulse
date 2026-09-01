import { randomUUID } from 'node:crypto';

import { pool } from '@/db/client';
import { getKeepaSettings } from '@/modules/siteSettings/service';
import { getActiveTenantKey } from '@/modules/_shared';

export type KeepaSnapshot = {
  asin: string;
  price_30d_min: number | null;
  price_30d_max: number | null;
  price_90d_avg: number | null;
  buy_box_change_count: number;
  seller_count_trend: 'up' | 'down' | 'flat' | null;
  stock_history_json: unknown;
};

export async function isKeepaConfigured(): Promise<boolean> {
  const { apiKey } = await getKeepaSettings();
  return Boolean(apiKey);
}

export function shouldFetchKeepa(input: { confidence: string; score?: number | null }) {
  return input.confidence === 'INSUFFICIENT_DATA' || (input.score ?? 0) > 7;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function getRemainingDailyBudget(): Promise<number> {
  const tenantKey = await getActiveTenantKey();
  const { tokenBudget } = await getKeepaSettings();
  const date = todayUtcDate();
  await pool.execute(
    `INSERT INTO amazon_keepa_daily_budget (tenant_key, budget_date, token_budget, tokens_used)
     VALUES (?, ?, ?, 0)
     ON DUPLICATE KEY UPDATE token_budget = token_budget`,
    [tenantKey, date, tokenBudget],
  );
  const [rows] = await pool.execute(
    `SELECT token_budget, tokens_used FROM amazon_keepa_daily_budget WHERE tenant_key = ? AND budget_date = ? LIMIT 1`,
    [tenantKey, date],
  );
  const row = (rows as Array<{ token_budget?: number | string; tokens_used?: number | string }>)[0];
  const budget = Number(row?.token_budget ?? tokenBudget);
  const used = Number(row?.tokens_used ?? 0);
  return Math.max(0, budget - used);
}

async function consumeDailyTokens(amount: number): Promise<void> {
  if (amount <= 0) return;
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    `UPDATE amazon_keepa_daily_budget SET tokens_used = tokens_used + ? WHERE tenant_key = ? AND budget_date = ?`,
    [amount, tenantKey, todayUtcDate()],
  );
}

export async function enqueueKeepaAsins(jobId: string, asins: string[]): Promise<number> {
  if (!await isKeepaConfigured()) return 0;
  const tenantKey = await getActiveTenantKey();
  const uniqueAsins = [...new Set(asins.map((asin) => asin.trim()).filter(Boolean))];
  for (const asin of uniqueAsins) {
    await pool.execute(
      `INSERT INTO amazon_keepa_queue (id, tenant_key, job_id, asin, status, retry_count)
       VALUES (?, ?, ?, ?, 'pending', 0)`,
      [randomUUID(), tenantKey, jobId, asin],
    );
  }
  return uniqueAsins.length;
}

export async function processKeepaQueue(limit = 10): Promise<{ processed: number; skippedByBudget: number }> {
  if (!await isKeepaConfigured()) return { processed: 0, skippedByBudget: 0 };
  const tenantKey = await getActiveTenantKey();
  const limitInt = Math.floor(limit);
  const [rows] = await pool.execute(
    `SELECT id, asin FROM amazon_keepa_queue
     WHERE tenant_key = ? AND status = 'pending'
     ORDER BY created_at ASC
     LIMIT ${limitInt}`,
    [tenantKey],
  );
  const queue = rows as Array<{ id: string; asin: string }>;
  if (queue.length === 0) return { processed: 0, skippedByBudget: 0 };

  let remaining = await getRemainingDailyBudget();
  let processed = 0;
  let skippedByBudget = 0;
  for (const item of queue) {
    if (remaining < 1) {
      skippedByBudget += 1;
      continue;
    }
    try {
      const snapshot = await fetchKeepaSnapshot(item.asin);
      await saveKeepaSnapshot(snapshot);
      await consumeDailyTokens(1);
      remaining -= 1;
      processed += 1;
      await pool.execute(
        `UPDATE amazon_keepa_queue SET status = 'done', processed_at = CURRENT_TIMESTAMP WHERE tenant_key = ? AND id = ?`,
        [tenantKey, item.id],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'KEEPA_UNKNOWN_ERROR';
      await pool.execute(
        `UPDATE amazon_keepa_queue
         SET status = 'failed', retry_count = retry_count + 1, last_error = ?, processed_at = CURRENT_TIMESTAMP
         WHERE tenant_key = ? AND id = ?`,
        [message, tenantKey, item.id],
      );
    }
  }

  return { processed, skippedByBudget };
}

export async function fetchKeepaSnapshot(asin: string): Promise<KeepaSnapshot> {
  const { apiKey } = await getKeepaSettings();
  if (!apiKey) throw new Error('KEEPA_NOT_CONFIGURED');
  const url = new URL('https://api.keepa.com/product');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('domain', '1');
  url.searchParams.set('asin', asin);
  url.searchParams.set('stats', '90');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`KEEPA_FETCH_FAILED_${res.status}`);
  const data = await res.json() as { products?: Array<{ stats?: { min?: number[]; max?: number[]; avg90?: number[] }; buyBoxSellerIdHistory?: unknown[] }> };
  const product = data.products?.[0];
  return {
    asin,
    price_30d_min: centsToUnit(product?.stats?.min?.[1]),
    price_30d_max: centsToUnit(product?.stats?.max?.[1]),
    price_90d_avg: centsToUnit(product?.stats?.avg90?.[1]),
    buy_box_change_count: product?.buyBoxSellerIdHistory?.length ?? 0,
    seller_count_trend: null,
    stock_history_json: product ?? null,
  };
}

function centsToUnit(value: number | undefined) {
  if (typeof value !== 'number' || value < 0) return null;
  return Number((value / 100).toFixed(2));
}

export async function saveKeepaSnapshot(snapshot: KeepaSnapshot) {
  const tenantKey = await getActiveTenantKey();
  await pool.execute(
    `INSERT INTO amazon_keepa_snapshots (
      id, tenant_key, asin, price_30d_min, price_30d_max, price_90d_avg, buy_box_change_count, seller_count_trend, stock_history_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      randomUUID(),
      tenantKey,
      snapshot.asin,
      snapshot.price_30d_min,
      snapshot.price_30d_max,
      snapshot.price_90d_avg,
      snapshot.buy_box_change_count,
      snapshot.seller_count_trend,
      JSON.stringify(snapshot.stock_history_json ?? null),
    ],
  );
}
