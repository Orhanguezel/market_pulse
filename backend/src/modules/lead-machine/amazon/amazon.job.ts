import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { analyzeProductReviews } from './review.analyzer';
import { scrapeAmazonProducts, type AmazonFilters, type AmazonProduct } from './amazon.scraper';
import { filterEligibleProducts, deduplicateByAsin } from './signal.validator';
import { scoreAmazonCategory } from './amazon.scoring-engine';
import { calculateCategoryStats, upsertAmazonCategoryStats } from './category.normalizer';
import { shouldFetchKeepa, enqueueKeepaAsins, processKeepaQueue, isKeepaConfigured } from './keepa.client';
import type { AmazonRiskReport } from './amazon.types';

interface AmazonJobParams extends AmazonFilters {
  keyword?: string;
  marketplace?: string;
}

async function saveRiskScore(jobId: string, report: AmazonRiskReport) {
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO amazon_risk_scores (
      id, job_id, keyword,
      category_risk_score, category_risk_confidence, category_risk_reason,
      sku_chaos_score, sku_chaos_confidence, sku_chaos_reason,
      price_war_score, price_war_confidence, price_war_reason,
      brand_reliability_score, brand_reliability_confidence, brand_reliability_reason,
      operational_risk_score, operational_risk_confidence, operational_risk_reason,
      composite_score, decision, summary, data_points,
      outreach_priority, persuasion_points, brand_id, brand_name, enrichment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, jobId, report.keyword,
      safeNum(report.scores.category_risk.score, 0),     report.scores.category_risk.confidence,    report.scores.category_risk.reason ?? '',
      safeNum(report.scores.sku_chaos.score, 0),         report.scores.sku_chaos.confidence,         report.scores.sku_chaos.reason ?? '',
      safeNum(report.scores.price_war_risk.score, 0),    report.scores.price_war_risk.confidence,    report.scores.price_war_risk.reason ?? '',
      safeNum(report.scores.brand_reliability.score, 0), report.scores.brand_reliability.confidence, report.scores.brand_reliability.reason ?? '',
      safeNum(report.scores.operational_risk.score, 0),  report.scores.operational_risk.confidence,  report.scores.operational_risk.reason ?? '',
      safeNum(report.composite_score), report.decision, report.summary ?? '', report.data_points,
      safeNum(report.outreach_priority),
      JSON.stringify(report.persuasion_points),
      null,
      report.brand_context.brand_name,
      report.enrichment !== null ? JSON.stringify(report.enrichment) : null,
    ],
  );
}

function extractAsin(productUrl?: string | null) {
  return productUrl?.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)?.[1] ?? null;
}

function safeNum(v: number | null | undefined, fallback: number | null = null): number | null {
  if (v === null || v === undefined) return fallback;
  return Number.isFinite(v) ? v : fallback;
}

async function saveAmazonProducts(jobId: string, products: AmazonProduct[]) {
  for (const product of products) {
    await pool.execute(
      `INSERT INTO amazon_products (
        id, job_id, title, price, rating, review_count, seller_name, seller_url, product_url, asin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        jobId,
        product.product_title || '',
        safeNum(product.price),
        safeNum(product.rating),
        safeNum(product.review_count, 0) ?? 0,
        product.seller_name ?? null,
        product.seller_url ?? null,
        product.product_url ?? null,
        extractAsin(product.product_url),
      ],
    );
  }
}

async function saveAmazonScanJob(jobId: string, keyword: string, marketplace: string) {
  await pool.execute(
    `INSERT IGNORE INTO amazon_scan_jobs (id, keyword, marketplace, status) VALUES (?, ?, ?, 'running')`,
    [jobId, keyword, marketplace],
  );
}

async function updateAmazonScanJob(jobId: string, patch: { status: string; dataPoints?: number; errorMsg?: string | null }) {
  await pool.execute(
    `UPDATE amazon_scan_jobs SET status = ?, data_points = COALESCE(?, data_points), error_msg = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [patch.status, patch.dataPoints ?? null, patch.errorMsg ?? null, jobId],
  );
}

async function logAmazonJobError(jobId: string, errorMessage: string): Promise<number> {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM amazon_job_error_logs WHERE job_id = ?`,
    [jobId],
  );
  const previous = Number((rows as Array<{ count?: number | string }>)[0]?.count ?? 0);
  const retryCount = previous + 1;
  const errorType = errorMessage.split(':')[0].slice(0, 100) || 'UNKNOWN_ERROR';
  await pool.execute(
    `INSERT INTO amazon_job_error_logs (id, job_id, error_type, error_msg, retry_count) VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), jobId, errorType, errorMessage, retryCount],
  );
  return retryCount;
}

export async function runAmazonJob(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as AmazonJobParams;
  const keyword = params.keyword ?? '';
  const marketplace = params.marketplace ?? 'com';

  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  await saveAmazonScanJob(jobId, keyword, marketplace);

  try {
    const allProducts = await scrapeAmazonProducts(keyword, marketplace, params);
    const deduped = deduplicateByAsin(allProducts);
    const eligible = filterEligibleProducts(deduped);
    await saveAmazonProducts(jobId, eligible);
    const categoryStats = calculateCategoryStats(keyword, marketplace, eligible);
    await upsertAmazonCategoryStats(categoryStats);

    // Sayfa 1 ve 3 ortalama fiyat (price war scorer için)
    const page1Prices = allProducts.slice(0, 10).map(p => p.price).filter((p): p is number => typeof p === 'number');
    const page3Prices = allProducts.slice(20, 30).map(p => p.price).filter((p): p is number => typeof p === 'number');
    const pageOneAvg   = page1Prices.length ? page1Prices.reduce((a, b) => a + b, 0) / page1Prices.length : null;
    const pageThreeAvg = page3Prices.length ? page3Prices.reduce((a, b) => a + b, 0) / page3Prices.length : null;

    // Review analizi: ilk ürün üzerinden (operasyonel risk için)
    const firstWithUrl = eligible.find(p => p.product_url);
    const reviewAnalysis = firstWithUrl?.product_url
      ? await analyzeProductReviews(firstWithUrl.product_url, marketplace).catch(() => ({ problem_flags: [], problem_score: 0, ai_summary: '' }))
      : { problem_flags: [], problem_score: 0, ai_summary: '' };

    const report = {
      ...scoreAmazonCategory({
      keyword,
      marketplace,
      products: eligible,
      pageOneAveragePrice: pageOneAvg,
      pageThreeAveragePrice: pageThreeAvg,
      reviewProblemScore: reviewAnalysis.problem_score,
      reviewProblemFlags: reviewAnalysis.problem_flags,
      }),
      problem_flags: reviewAnalysis.problem_flags,
    };

    await saveRiskScore(jobId, report);

    // Keepa: yetersiz güven veya yüksek risk varsa ASIN'leri zenginleştir
    if (
      await isKeepaConfigured()
      && shouldFetchKeepa({ confidence: report.scores.price_war_risk.confidence, score: report.composite_score })
    ) {
      const asins = eligible.map(p => extractAsin(p.product_url)).filter(Boolean) as string[];
      await enqueueKeepaAsins(jobId, asins.slice(0, 20));
      await processKeepaQueue(20);
    }

    // Geriye dönük uyumluluk: lead_candidates'a da kaydet
    await insertCandidate({
      jobId,
      channel: 'amazon',
      name: `${keyword} — Amazon Skor Raporu`,
      website: `https://www.amazon.${marketplace}/s?k=${encodeURIComponent(keyword)}`,
      rawData: report,
      aiSummary: report.summary,
      leadScore: report.composite_score ?? null,
      decision: report.decision,
    });

    await updateAmazonScanJob(jobId, { status: 'done', dataPoints: report.data_points });
    await updateSearchJob(jobId, { status: 'done', resultCount: 1, finished: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
    try {
      await logAmazonJobError(jobId, msg);
    } catch {
      // log tablosu hatası, ana job hata yönetimini engellememeli
    }
    await updateAmazonScanJob(jobId, { status: 'failed', errorMsg: msg });
    await updateSearchJob(jobId, { status: 'failed', errorMsg: msg, finished: true });
  }
}

// Eski seller-centric flow — backward compat için korunuyor
export { runAmazonJobLegacy } from './legacy.job';
