// =============================================================
// FILE: backend/src/modules/market/marketplace.signal.ts
// Scrapes a target's Hepsiburada / Trendyol / Amazon storefront and
// stores a snapshot in market_signals. The next scan diffs against the
// previous one and only creates a new signal if something material
// changed (product count drift, out-of-stock ratio rise, listing churn).
// =============================================================
import { randomUUID } from 'node:crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';
import { marketTargets, marketSignals } from './schema';
import { scrape, type ScrapeResponse } from '../lead-machine/_shared/scraper.client';
import { andTenant, getActiveTenantKey, tenantValues } from '@/modules/_shared';

export type Marketplace = 'hepsiburada' | 'trendyol' | 'amazon';

interface MarketplaceSnapshot {
  platform: Marketplace | 'unknown';
  product_count: number;
  out_of_stock_count: number;
  content_hash: string;
  page_title: string | null;
  products: Array<{
    name?: string | null;
    url?: string | null;
    price_text?: string | null;
    out_of_stock?: boolean;
  }>;
}

function platformOf(target: { hepsiburada_url: string | null; trendyol_url: string | null; amazon_url: string | null }, platform: Marketplace): string | null {
  if (platform === 'hepsiburada') return target.hepsiburada_url;
  if (platform === 'trendyol')    return target.trendyol_url;
  if (platform === 'amazon')      return target.amazon_url;
  return null;
}

async function getLatestSnapshot(tenantKey: string, targetId: string, platform: Marketplace): Promise<MarketplaceSnapshot | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT description FROM market_signals
      WHERE tenant_key = ? AND target_id = ? AND signal_type = ?
      ORDER BY created_at DESC LIMIT 1`,
    [tenantKey, targetId, `marketplace_${platform}_snapshot`],
  );
  const r = (rows as Array<{ description: string | null }>)[0];
  if (!r?.description) return null;
  try { return JSON.parse(r.description) as MarketplaceSnapshot; } catch { return null; }
}

function diffSnapshots(prev: MarketplaceSnapshot | null, next: MarketplaceSnapshot): {
  changed_fields: string[];
  delta_product_count: number;
  delta_oos_count: number;
} {
  if (!prev) return { changed_fields: [], delta_product_count: 0, delta_oos_count: 0 };
  const changed: string[] = [];
  const dCount = next.product_count - prev.product_count;
  const dOos   = next.out_of_stock_count - prev.out_of_stock_count;
  if (Math.abs(dCount) >= 3) changed.push('product_count');
  if (dOos >= 2) changed.push('out_of_stock_rise');
  if (prev.content_hash !== next.content_hash) changed.push('listing_changed');
  return { changed_fields: changed, delta_product_count: dCount, delta_oos_count: dOos };
}

export async function scanMarketplaceForTarget(targetId: string, platform: Marketplace): Promise<{
  target_id: string;
  platform: Marketplace;
  url: string;
  snapshot: MarketplaceSnapshot;
  changed_fields: string[];
  signals_created: number;
}> {
  const tenantKey = await getActiveTenantKey();
  const [target] = await db
    .select({
      id: marketTargets.id,
      name: marketTargets.name,
      hepsiburada_url: marketTargets.hepsiburada_url,
      trendyol_url: marketTargets.trendyol_url,
      amazon_url: marketTargets.amazon_url,
    })
    .from(marketTargets)
    .where(andTenant(marketTargets, tenantKey, [eq(marketTargets.id, targetId)]))
    .limit(1);

  if (!target) throw Object.assign(new Error('TARGET_NOT_FOUND'), { statusCode: 404 });
  const url = platformOf(target, platform);
  if (!url) throw Object.assign(new Error(`TARGET_HAS_NO_${platform.toUpperCase()}_URL`), { statusCode: 400 });

  const result: ScrapeResponse = await scrape(url, {
    profile: 'marketplace-store',
    return_text: false,
    return_html: false,
    mode: 'stealthy',
  });
  if (!result.success) throw new Error(result.error || 'SCRAPE_FAILED');

  const data = result.data as Record<string, unknown>;
  const summary = (data.summary as Record<string, unknown> | undefined) ?? {};
  const products = Array.isArray(data.products) ? data.products as Array<Record<string, unknown>> : [];

  const snapshot: MarketplaceSnapshot = {
    platform: (data.platform as Marketplace) ?? platform,
    product_count: Number(summary.product_count ?? products.length),
    out_of_stock_count: Number(summary.out_of_stock_count ?? 0),
    content_hash: String(data.content_hash ?? ''),
    page_title: (summary.page_title as string | null | undefined) ?? null,
    products: products.slice(0, 80) as MarketplaceSnapshot['products'],
  };

  const prev = await getLatestSnapshot(tenantKey, targetId, platform);
  const diff = diffSnapshots(prev, snapshot);
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
  if (diff.delta_product_count <= -10) severity = 'critical';
  else if (diff.delta_product_count <= -3) severity = 'high';
  else if (diff.delta_oos_count >= 3) severity = 'high';
  else if (diff.changed_fields.length) severity = 'medium';

  let signalsCreated = 0;

  // Always store the snapshot itself as a 'snapshot' signal so future
  // diffs have a previous row to compare against. Marked 'low' / is_reviewed=1
  // so it doesn't clutter the operator's signal inbox.
  await db.insert(marketSignals).values(tenantValues(tenantKey, {
    id:          randomUUID(),
    target_id:   targetId,
    signal_type: `marketplace_${platform}_snapshot`,
    severity:    'low',
    title:       `${platform} snapshot: ${snapshot.product_count} ürün`,
    description: JSON.stringify(snapshot),
    source_url:  url,
    is_reviewed: 1,
  }));

  // Material diff against previous snapshot → user-facing signal
  if (diff.changed_fields.length > 0) {
    const parts: string[] = [];
    if (diff.delta_product_count !== 0) parts.push(`ürün sayısı ${diff.delta_product_count > 0 ? '+' : ''}${diff.delta_product_count}`);
    if (diff.delta_oos_count > 0)       parts.push(`+${diff.delta_oos_count} tükendi`);
    const title = `${target.name} – ${platform}: ${parts.join(', ') || 'liste değişti'}`;

    await db.insert(marketSignals).values(tenantValues(tenantKey, {
      id:          randomUUID(),
      target_id:   targetId,
      signal_type: `marketplace_${platform}_diff`,
      severity,
      title,
      description: JSON.stringify({
        platform,
        changed_fields: diff.changed_fields,
        delta_product_count: diff.delta_product_count,
        delta_oos_count: diff.delta_oos_count,
        prev: prev ? { count: prev.product_count, oos: prev.out_of_stock_count } : null,
        next: { count: snapshot.product_count, oos: snapshot.out_of_stock_count },
      }),
      source_url: url,
    }));
    signalsCreated = 1;
  }

  await db
    .update(marketTargets)
    .set({ last_seen_at: new Date() })
    .where(andTenant(marketTargets, tenantKey, [eq(marketTargets.id, targetId)]));

  return {
    target_id: targetId,
    platform,
    url,
    snapshot,
    changed_fields: diff.changed_fields,
    signals_created: signalsCreated,
  };
}
