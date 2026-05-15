import type { AmazonSeller } from './seller.extractor';

export function scoreAmazonSellerLegacy(
  seller: AmazonSeller,
  reviewAnalysis: { problem_score: number },
): number {
  const product = seller.products[0];
  let score = 0;
  const reviews = product?.review_count ?? 0;
  const rating = product?.rating ?? 0;
  const price = product?.price ?? 0;
  if (reviews >= 50 && reviews <= 200) score += 2;
  if (rating >= 4.0 && rating <= 4.5) score += 2;
  if (reviewAnalysis.problem_score >= 5) score += 3;
  if (seller.seller_url) score += 1;
  if (price >= 15 && price <= 100) score += 2;
  return Math.min(10, score);
}
