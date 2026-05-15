import { calculateConfidence } from '../confidence.calculator';
import type { AmazonScoreInput, DimensionScore } from '../amazon.types';

export function scoreSkuChaos(input: AmazonScoreInput): DimensionScore {
  const confidence = calculateConfidence(input.products.length);
  if (confidence === 'INSUFFICIENT_DATA') {
    return { score: 0, confidence, reason: 'SKU karmaşası için en az 10 veri noktası gerekir.' };
  }

  const range = input.stats.priceMax - input.stats.priceMin;
  const median = input.stats.priceMedian || 1;
  const spreadRatio = range / median;
  const sigmaRatio = input.stats.priceSigma / median;
  const variantPressure = Math.min(3, input.stats.productCount / 20);
  const score = Math.min(10, spreadRatio * 3 + sigmaRatio * 4 + variantPressure);

  return {
    score: Number(score.toFixed(1)),
    confidence,
    reason: `Fiyat aralığı ${range.toFixed(2)}, sigma ${input.stats.priceSigma.toFixed(2)}, ürün sayısı ${input.stats.productCount}.`,
  };
}
