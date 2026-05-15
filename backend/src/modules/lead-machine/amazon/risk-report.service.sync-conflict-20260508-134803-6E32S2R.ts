import { pool } from '@/db/client';

type DbRow = Record<string, unknown>;

export async function getLatestAmazonRiskReport(keyword: string, marketplace = 'com') {
  const [rows] = await pool.execute(
    `SELECT ars.*, asj.keyword, asj.marketplace, asj.created_at AS scanned_at
     FROM amazon_risk_scores ars
     JOIN amazon_scan_jobs asj ON asj.id = ars.job_id
     WHERE asj.keyword = ? AND asj.marketplace = ?
     ORDER BY ars.created_at DESC
     LIMIT 1`,
    [keyword, marketplace],
  );
  const row = (rows as DbRow[])[0];
  if (!row) return null;

  const jobId = String(row.job_id);
  const [keepaRows] = await pool.execute(
    `SELECT aks.price_30d_min, aks.price_30d_max, aks.price_90d_avg, aks.buy_box_change_count
     FROM amazon_keepa_snapshots aks
     WHERE aks.asin IN (
       SELECT ap.asin FROM amazon_products ap WHERE ap.job_id = ? AND ap.asin IS NOT NULL
     )
     ORDER BY aks.fetched_at DESC
     LIMIT 20`,
    [jobId],
  );
  const keepaTrend = buildKeepaTrend(keepaRows as DbRow[]);
  const [topSellers, products, problemFlags] = await Promise.all([
    getTopSellers(jobId),
    listAmazonScanProducts(jobId, 20),
    getProblemFlags(jobId),
  ]);

  return {
    keyword: row.keyword,
    scanned_at: row.scanned_at,
    data_points: Number(row.data_points ?? 0),
    scores: {
      category_risk: {
        score: Number(row.category_risk_score ?? 0),
        confidence: row.category_risk_confidence,
        reason: String(row.category_risk_reason ?? 'Kategori yoğunluğu ve satıcı dağılımı değerlendirildi.'),
      },
      sku_chaos: {
        score: Number(row.sku_chaos_score ?? 0),
        confidence: row.sku_chaos_confidence,
        reason: String(row.sku_chaos_reason ?? 'Fiyat aralığı, sigma ve varyant baskısı değerlendirildi.'),
      },
      price_war_risk: {
        score: Number(row.price_war_score ?? 0),
        confidence: row.price_war_confidence,
        reason: String(row.price_war_reason ?? 'Fiyat kırılımı ve düşük fiyat kümesi değerlendirildi.'),
      },
      brand_reliability: {
        score: Number(row.brand_reliability_score ?? 0),
        confidence: row.brand_reliability_confidence,
        reason: String(row.brand_reliability_reason ?? 'Marka tutarlılığı ve listing kalitesi değerlendirildi.'),
      },
      operational_risk: {
        score: Number(row.operational_risk_score ?? 0),
        confidence: row.operational_risk_confidence,
        reason: String(row.operational_risk_reason ?? 'Yorum problem skoru ve kritik şikayetler değerlendirildi.'),
      },
    },
    composite_score: row.composite_score === null || row.composite_score === undefined ? null : Number(row.composite_score),
    decision: row.decision,
    summary: row.summary ?? '',
    top_sellers: topSellers,
    products,
    problem_flags: problemFlags,
    ...(keepaTrend.length ? { keepa_trend: keepaTrend } : {}),
    buy_box_change_count: sumBuyBoxChanges(keepaRows as DbRow[]),
  };
}

export async function listAmazonScanProducts(jobId: string, limit = 100) {
  const safeLimit = Math.min(500, Math.max(1, Math.floor(limit)));
  const [rows] = await pool.execute(
    `SELECT title, price, rating, review_count, seller_name, product_url, asin
     FROM amazon_products
     WHERE job_id = ?
     ORDER BY review_count DESC, created_at ASC
     LIMIT ${safeLimit}`,
    [jobId],
  );
  return (rows as DbRow[]).map((row) => ({
    title: String(row.title ?? ''),
    price: nullableNumber(row.price),
    rating: nullableNumber(row.rating),
    review_count: Number(row.review_count ?? 0),
    seller_name: row.seller_name === null || row.seller_name === undefined ? null : String(row.seller_name),
    product_url: row.product_url === null || row.product_url === undefined ? null : String(row.product_url),
    asin: row.asin === null || row.asin === undefined ? null : String(row.asin),
  }));
}

async function getTopSellers(jobId: string) {
  const [rows] = await pool.execute(
    `SELECT seller_name, COUNT(*) AS product_count, AVG(price) AS avg_price
     FROM amazon_products
     WHERE job_id = ? AND seller_name IS NOT NULL AND seller_name <> ''
     GROUP BY seller_name
     ORDER BY product_count DESC, avg_price ASC
     LIMIT 5`,
    [jobId],
  );
  return (rows as DbRow[]).map((row) => ({
    seller_name: String(row.seller_name ?? ''),
    product_count: Number(row.product_count ?? 0),
    avg_price: nullableNumber(row.avg_price),
  }));
}

async function getProblemFlags(jobId: string) {
  const [rows] = await pool.execute(
    `SELECT raw_data
     FROM lead_candidates
     WHERE job_id = ? AND channel = 'amazon'
     ORDER BY created_at DESC
     LIMIT 1`,
    [jobId],
  );
  const rawData = (rows as DbRow[])[0]?.raw_data;
  const raw = parseJson(rawData);
  const value = raw.problem_flags ?? raw.review_flags;
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function parseJson(value: unknown): DbRow {
  if (value && typeof value === 'object') return value as DbRow;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as DbRow : {};
  } catch {
    return {};
  }
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildKeepaTrend(rows: DbRow[]) {
  const avg = (key: string) => {
    const values = rows
      .map((row) => Number(row[key]))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!values.length) return null;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  };
  const points = [
    { label: '30d min', price: avg('price_30d_min') },
    { label: '90d avg', price: avg('price_90d_avg') },
    { label: '30d max', price: avg('price_30d_max') },
  ];
  return points.filter((point): point is { label: string; price: number } => point.price !== null);
}

function sumBuyBoxChanges(rows: DbRow[]) {
  const total = rows.reduce((sum, row) => sum + (Number(row.buy_box_change_count) || 0), 0);
  return total > 0 ? total : 0;
}
