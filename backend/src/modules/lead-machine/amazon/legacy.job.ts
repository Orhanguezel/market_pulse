import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { analyzeProductReviews } from './review.analyzer';
import { scoreAmazonSellerLegacy } from './legacy.scorer';
import { scrapeAmazonProducts, type AmazonFilters } from './amazon.scraper';
import { extractUniqueSellers } from './seller.extractor';

interface LegacyJobParams extends AmazonFilters {
  keyword?: string;
  marketplace?: string;
}

/** @deprecated Seller-centric eski akış — yeni product/category-centric pipeline için runAmazonJob kullan */
export async function runAmazonJobLegacy(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as LegacyJobParams;
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    const products = await scrapeAmazonProducts(params.keyword ?? '', params.marketplace ?? 'com', params);
    const sellers = extractUniqueSellers(products);
    let count = 0;
    for (const seller of sellers) {
      const product = seller.products[0];
      const analysis = product?.product_url
        ? await analyzeProductReviews(product.product_url, params.marketplace)
        : { problem_flags: [], problem_score: 0, ai_summary: '' };
      const score = scoreAmazonSellerLegacy(seller, analysis);
      await insertCandidate({
        jobId,
        channel: 'amazon',
        name: seller.seller_name,
        website: seller.seller_url ?? product?.product_url ?? null,
        rawData: { seller_url: seller.seller_url, products: seller.products, review_flags: analysis.problem_flags, problem_score: analysis.problem_score },
        aiSummary: analysis.ai_summary,
        leadScore: score,
      });
      count += 1;
    }
    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
