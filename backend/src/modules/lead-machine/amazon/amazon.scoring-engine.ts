import { calculateCategoryStats, normalizeProducts } from './category.normalizer';
import { CompositeScorer, calculateOutreachPriority } from './composite.scorer';
import { generatePersuasionPoints } from './persuasion.generator';
import { validateSignals } from './signal.validator';
import { scoreBrandReliability } from './scorers/brand-reliability.scorer';
import { scoreCategoryRisk } from './scorers/category-risk.scorer';
import { scoreOperationalRisk } from './scorers/operational-risk.scorer';
import { scorePriceWar } from './scorers/price-war.scorer';
import { scoreSkuChaos } from './scorers/sku-chaos.scorer';
import type { AmazonProduct } from './amazon.scraper';
import type { AmazonRiskReport } from './amazon.types';

export function scoreAmazonCategory(input: {
  keyword: string;
  marketplace: string;
  products: AmazonProduct[];
  pageOneAveragePrice?: number | null;
  pageThreeAveragePrice?: number | null;
  reviewProblemScore?: number;
  reviewProblemFlags?: string[];
}): AmazonRiskReport {
  const stats = calculateCategoryStats(input.keyword, input.marketplace, input.products);
  const products = normalizeProducts(input.products);
  const scoreInput = { ...input, products, stats };
  const scores = {
    category_risk: scoreCategoryRisk(scoreInput),
    sku_chaos: scoreSkuChaos(scoreInput),
    price_war_risk: scorePriceWar(scoreInput),
    brand_reliability: scoreBrandReliability(scoreInput),
    operational_risk: scoreOperationalRisk(scoreInput),
  };
  const { compositeScore, decision } = new CompositeScorer().score(scores);
  const validated = validateSignals(
    { scores, decision },
    { hasPriceData: products.some((product) => typeof product.price === 'number') },
  );

  return {
    keyword: input.keyword,
    scanned_at: new Date().toISOString(),
    data_points: products.length,
    scores,
    composite_score: compositeScore,
    decision: validated.decision,
    summary: [
      `${products.length} Amazon ürünü analiz edildi.`,
      compositeScore === null ? 'Veri güveni yetersiz.' : `Composite skor ${compositeScore}.`,
      ...validated.notes,
    ].join(' '),
    outreach_priority: calculateOutreachPriority(compositeScore, scores.brand_reliability.score),
    persuasion_points: generatePersuasionPoints(scores),
    brand_context: { brand_aggregated: false, brand_name: null, sku_count: null },
    enrichment: null,
  };
}
