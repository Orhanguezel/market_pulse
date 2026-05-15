import { calculateConfidence } from '../confidence.calculator';
import type { AmazonScoreInput, DimensionScore } from '../amazon.types';

export function scorePriceWar(input: AmazonScoreInput): DimensionScore {
  const pricedProducts = input.products.filter((product) => typeof product.price === 'number');
  if (!pricedProducts.length) {
    return { score: 0, confidence: 'INSUFFICIENT_DATA', reason: 'Fiyat verisi bulunamadı; price war skoru dışarıda bırakıldı.' };
  }

  const confidence = calculateConfidence(pricedProducts.length);
  if (confidence === 'INSUFFICIENT_DATA') {
    return { score: 0, confidence, reason: 'Price war riski için yeterli fiyatlı ürün bulunamadı.' };
  }

  const pageOne = input.pageOneAveragePrice ?? input.stats.priceMedian;
  const pageThree = input.pageThreeAveragePrice ?? input.stats.priceMin;
  const dropRatio = pageOne > 0 ? Math.max(0, (pageOne - pageThree) / pageOne) : 0;
  const sigmaRatio = input.stats.priceMedian > 0 ? input.stats.priceSigma / input.stats.priceMedian : 0;
  const lowPriceCluster = pricedProducts.filter((product) => (product.price ?? 0) <= input.stats.priceMedian * 0.8).length / pricedProducts.length;
  const score = Math.min(10, dropRatio * 5 + sigmaRatio * 3 + lowPriceCluster * 4);

  return {
    score: Number(score.toFixed(1)),
    confidence,
    reason: `Sayfa fiyat düşüş oranı ${(dropRatio * 100).toFixed(0)}%, düşük fiyat kümesi ${(lowPriceCluster * 100).toFixed(0)}%.`,
  };
}
