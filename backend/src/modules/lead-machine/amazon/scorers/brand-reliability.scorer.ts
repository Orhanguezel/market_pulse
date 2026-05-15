import { calculateConfidence } from '../confidence.calculator';
import type { AmazonScoreInput, DimensionScore } from '../amazon.types';

function brandToken(title: string) {
  return title.split(/\s+/).find(Boolean)?.toLowerCase() ?? '';
}

export function scoreBrandReliability(input: AmazonScoreInput): DimensionScore {
  const confidence = calculateConfidence(input.products.length);
  if (confidence === 'INSUFFICIENT_DATA') {
    return { score: 0, confidence, reason: 'Marka güvenilirliği için en az 10 veri noktası gerekir.' };
  }

  const brands = new Map<string, number>();
  let weakListings = 0;
  for (const product of input.products) {
    const token = brandToken(product.product_title);
    if (token) brands.set(token, (brands.get(token) ?? 0) + 1);
    if (!product.seller_name || !product.product_url || (product.rating ?? 0) < 4) weakListings += 1;
  }

  const brandFragmentation = Math.min(4, brands.size / Math.max(1, input.products.length) * 6);
  const weakListingRisk = weakListings / input.products.length * 4;
  const priceDeviationRisk = input.stats.priceMedian > 0 ? Math.min(2, input.stats.priceSigma / input.stats.priceMedian * 3) : 0;
  const score = Math.min(10, brandFragmentation + weakListingRisk + priceDeviationRisk);

  return {
    score: Number(score.toFixed(1)),
    confidence,
    reason: `${brands.size} marka tokenı, ${weakListings} zayıf listing, fiyat sapması ${input.stats.priceSigma.toFixed(2)}.`,
  };
}
