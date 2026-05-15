import type { AmazonSeller } from './seller.extractor';
import { scoreAmazonSellerLegacy } from './legacy.scorer';

/**
 * @deprecated Legacy seller-centric scoring.
 * Use product/category-centric scoring pipeline entrypoint instead.
 */
export function scoreAmazonSeller(
  seller: AmazonSeller,
  reviewAnalysis: { problem_score: number },
): number {
  return scoreAmazonSellerLegacy(seller, reviewAnalysis);
}
