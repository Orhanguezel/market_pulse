import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

export async function getLatestAmazonRiskReport(keyword: string, marketplace = 'com') {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT ars.*, asj.keyword, asj.marketplace, asj.created_at AS scanned_at
     FROM amazon_risk_scores ars
     JOIN amazon_scan_jobs asj ON asj.tenant_key = ars.tenant_key AND asj.id = ars.job_id
     WHERE ars.tenant_key = ? AND asj.keyword = ? AND asj.marketplace = ?
     ORDER BY ars.created_at DESC
     LIMIT 1`,
    [tenantKey, keyword, marketplace],
  );
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return null;

  const jobId = String(row.job_id);

  const [keepaRows] = await pool.execute(
    `SELECT aks.price_30d_min, aks.price_30d_max, aks.price_90d_avg
     FROM amazon_keepa_snapshots aks
     WHERE aks.tenant_key = ?
       AND aks.asin IN (
       SELECT ap.asin FROM amazon_products ap WHERE ap.tenant_key = ? AND ap.job_id = ? AND ap.asin IS NOT NULL
     )
     ORDER BY aks.fetched_at DESC
     LIMIT 20`,
    [tenantKey, tenantKey, jobId],
  );
  const keepaTrend = buildKeepaTrend(keepaRows as Array<Record<string, unknown>>);

  const [sellerRows] = await pool.execute(
    `SELECT seller_name, COUNT(*) AS product_count, ROUND(AVG(price), 2) AS avg_price
     FROM amazon_products
     WHERE tenant_key = ? AND job_id = ? AND seller_name IS NOT NULL AND seller_name != ''
     GROUP BY seller_name
     ORDER BY product_count DESC
     LIMIT 5`,
    [tenantKey, jobId],
  );
  const topSellers = (sellerRows as Array<Record<string, unknown>>).map(s => ({
    seller_name: String(s.seller_name),
    product_count: Number(s.product_count),
    avg_price: s.avg_price !== null ? Number(s.avg_price) : null,
  }));

  const [productRows] = await pool.execute(
    `SELECT title, price, rating, review_count, seller_name, product_url, asin
     FROM amazon_products
     WHERE tenant_key = ? AND job_id = ?
     ORDER BY review_count DESC
     LIMIT 20`,
    [tenantKey, jobId],
  );
  const amazonDomain = `https://www.amazon.${String(row.marketplace ?? 'com')}`;
  function resolveUrl(url: unknown): string | null {
    if (!url) return null;
    const s = String(url);
    return s.startsWith('http') ? s : `${amazonDomain}${s}`;
  }
  const products = (productRows as Array<Record<string, unknown>>).map(p => ({
    title: String(p.title ?? ''),
    price: p.price !== null ? Number(p.price) : null,
    rating: p.rating !== null ? Number(p.rating) : null,
    review_count: p.review_count !== null ? Number(p.review_count) : null,
    seller_name: p.seller_name ? String(p.seller_name) : null,
    product_url: resolveUrl(p.product_url),
    asin: p.asin ? String(p.asin) : null,
  }));

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
    outreach_priority: row.outreach_priority !== null && row.outreach_priority !== undefined ? Number(row.outreach_priority) : 1,
    persuasion_points: row.persuasion_points
      ? (typeof row.persuasion_points === 'string' ? JSON.parse(row.persuasion_points) : row.persuasion_points) as string[]
      : [],
    brand_context: {
      brand_aggregated: false,
      brand_name: (row.brand_name as string | null) ?? null,
      sku_count: null,
    },
    enrichment: row.enrichment
      ? (typeof row.enrichment === 'string' ? JSON.parse(row.enrichment) : row.enrichment) as Record<string, unknown>
      : null,
    top_sellers: topSellers,
    products,
    ...(keepaTrend.length ? { keepa_trend: keepaTrend } : {}),
  };
}

export async function getAmazonScanProducts(jobId: string) {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT ap.title, ap.price, ap.rating, ap.review_count, ap.seller_name, ap.product_url, ap.asin,
            asj.marketplace,
            CASE WHEN aks.asin IS NOT NULL THEN 1 ELSE 0 END AS has_keepa
     FROM amazon_products ap
     JOIN amazon_scan_jobs asj ON asj.tenant_key = ap.tenant_key AND asj.id = ap.job_id
     LEFT JOIN amazon_keepa_snapshots aks ON aks.tenant_key = ap.tenant_key AND aks.asin = ap.asin
     WHERE ap.tenant_key = ? AND ap.job_id = ?
     ORDER BY ap.review_count DESC`,
    [tenantKey, jobId],
  );
  return (rows as Array<Record<string, unknown>>).map(p => {
    const domain = `https://www.amazon.${String(p.marketplace ?? 'com')}`;
    const rawUrl = p.product_url ? String(p.product_url) : null;
    const product_url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${domain}${rawUrl}`) : null;
    return {
      title: String(p.title ?? ''),
      price: p.price !== null ? Number(p.price) : null,
      rating: p.rating !== null ? Number(p.rating) : null,
      review_count: p.review_count !== null ? Number(p.review_count) : null,
      seller_name: p.seller_name ? String(p.seller_name) : null,
      product_url,
      asin: p.asin ? String(p.asin) : null,
      has_keepa: Number(p.has_keepa) === 1,
    };
  });
}

function buildKeepaTrend(rows: Array<Record<string, unknown>>) {
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
