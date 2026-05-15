import { pool } from '@/db/client';
import { scoreAmazonCategory } from './amazon.scoring-engine';
import { filterEligibleProducts } from './signal.validator';
import type { AmazonProduct } from './amazon.scraper';

export type ExcludeFilters = {
  product_urls?: string[];
  seller_names?: string[];
  title_keywords?: string[];
  asins?: string[];
};

type DbProductRow = {
  title: string;
  price: string | number | null;
  rating: string | number | null;
  review_count: string | number | null;
  seller_name: string | null;
  seller_url: string | null;
  product_url: string | null;
  asin: string | null;
};

function rowToProduct(row: DbProductRow): AmazonProduct {
  return {
    product_title: row.title,
    price: row.price != null ? Number(row.price) : undefined,
    rating: row.rating != null ? Number(row.rating) : undefined,
    review_count: row.review_count != null ? Number(row.review_count) : undefined,
    seller_name: row.seller_name ?? undefined,
    seller_url: row.seller_url ?? undefined,
    product_url: row.product_url ?? undefined,
  };
}

function applyExclusions(products: AmazonProduct[], exclude: ExcludeFilters): AmazonProduct[] {
  const urlSet = new Set((exclude.product_urls ?? []).map(u => u.toLowerCase()));
  const sellerSet = new Set((exclude.seller_names ?? []).map(s => s.toLowerCase()));
  const asinSet = new Set((exclude.asins ?? []).map(a => a.toUpperCase()));
  const titleKws = (exclude.title_keywords ?? []).map(k => k.toLowerCase());

  return products.filter(p => {
    if (p.product_url && urlSet.has(p.product_url.toLowerCase())) return false;
    if (p.seller_name && sellerSet.has(p.seller_name.toLowerCase())) return false;

    const asinMatch = p.product_url?.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)?.[1];
    if (asinMatch && asinSet.has(asinMatch)) return false;

    const title = p.product_title.toLowerCase();
    if (titleKws.some(kw => title.includes(kw))) return false;

    return true;
  });
}

export async function rescoreForJob(
  jobId: string,
  exclude: ExcludeFilters,
): Promise<{
  report: ReturnType<typeof scoreAmazonCategory>;
  total_before: number;
  excluded_count: number;
  remaining_count: number;
} | null> {
  const [scanRows] = await pool.execute(
    `SELECT keyword, marketplace FROM amazon_scan_jobs WHERE id = ? LIMIT 1`,
    [jobId],
  );
  const scan = (scanRows as Array<{ keyword: string; marketplace: string }>)[0];
  if (!scan) return null;

  const [productRows] = await pool.execute(
    `SELECT title, price, rating, review_count, seller_name, seller_url, product_url, asin
     FROM amazon_products WHERE job_id = ?`,
    [jobId],
  );
  const allProducts = (productRows as DbProductRow[]).map(rowToProduct);
  const total_before = allProducts.length;

  const afterExclusion = applyExclusions(allProducts, exclude);
  const eligible = filterEligibleProducts(afterExclusion);
  const excluded_count = total_before - afterExclusion.length;

  const report = scoreAmazonCategory({
    keyword: scan.keyword,
    marketplace: scan.marketplace,
    products: eligible,
  });

  return {
    report,
    total_before,
    excluded_count,
    remaining_count: eligible.length,
  };
}
