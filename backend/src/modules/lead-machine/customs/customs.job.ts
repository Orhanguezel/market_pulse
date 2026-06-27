import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { getActiveTenantKey } from '@/modules/_shared';
import { aggregateBuyers, type AggregatedBuyer } from './customs.repository';

interface CustomsJobParams {
  hs_prefix?: string;
  hs_codes?: string[];
  product_query?: string;
  buyer_country?: string;
  min_value?: number;
  limit?: number;
}

function toNum(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Deterministik (AI'siz) lead skoru 0-10. Ithalat degeri (value tier),
 * kayit sikligi (frequency) ve son kayit yili (recency) bilesenlerinden uretilir.
 */
export function scoreBuyer(buyer: AggregatedBuyer): number {
  const tv = toNum(buyer.total_value);
  const rec = toNum(buyer.record_count);
  const latest = buyer.latest_month ?? '';
  let score = 0;

  // value tier
  if (tv > 100000) score += 5;
  else if (tv > 10000) score += 3;
  else if (tv > 1000) score += 1;

  // frequency
  if (rec >= 10) score += 3;
  else if (rec >= 3) score += 2;
  else if (rec >= 1) score += 1;

  // recency
  if (latest.includes('2024') || latest.includes('2025')) score += 2;

  return Math.max(0, Math.min(10, score));
}

export async function runCustomsJob(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as CustomsJobParams;
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    // Validates that candidate writes below still use the active tenant context.
    void getActiveTenantKey();
    const limit = params.limit && params.limit > 0 ? params.limit : 200;
    const buyers = await aggregateBuyers({
      hsPrefix: params.hs_prefix,
      hsCodes: params.hs_codes,
      productQuery: params.product_query,
      buyerCountry: params.buyer_country,
      minValue: params.min_value,
      limit,
    });

    let count = 0;
    for (const buyer of buyers) {
      if (!buyer.buyer_name) continue;
      const tv = toNum(buyer.total_value);
      const tq = toNum(buyer.total_quantity);
      const rec = toNum(buyer.record_count);
      const hsCodes = (buyer.hs_codes ?? '').split(', ').filter(Boolean);
      const exporterNames = (buyer.exporter_names ?? '').split(', ').filter(Boolean);
      const leadScore = scoreBuyer(buyer);

      const hsLabel = hsCodes[0] ?? 'ilgili urun';
      const aiSummary = `${rec} kayitta ${hsLabel} urununu ithal etti, toplam ~$${Math.round(tv).toLocaleString('en-US')}.`;

      await insertCandidate({
        jobId,
        channel: 'customs',
        country: buyer.buyer_country,
        name: buyer.buyer_name,
        rawData: {
          hs_codes: hsCodes,
          exporter_names: exporterNames,
          total_value: tv,
          total_quantity: tq,
          record_count: rec,
          latest_month: buyer.latest_month ?? null,
        },
        aiSummary,
        leadScore,
        decision: null,
      });
      count += 1;
    }

    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
