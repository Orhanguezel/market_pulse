import { describe, expect, test } from 'bun:test';
import { calculateConfidence, canMakeDecision } from '../amazon/confidence.calculator';
import { buildCategoryStats, normalizeProducts } from '../amazon/category.normalizer';
import { filterEligibleProducts, validateSignals } from '../amazon/signal.validator';
import { scoreCategoryRisk } from '../amazon/scorers/category-risk.scorer';
import { scoreSkuChaos } from '../amazon/scorers/sku-chaos.scorer';
import { scorePriceWar } from '../amazon/scorers/price-war.scorer';
import { scoreBrandReliability } from '../amazon/scorers/brand-reliability.scorer';
import { scoreOperationalRisk } from '../amazon/scorers/operational-risk.scorer';
import { CompositeScorer, decide } from '../amazon/composite.scorer';
import { scoreAmazonCategory } from '../amazon/amazon.scoring-engine';
import type { AmazonProduct } from '../amazon/amazon.scraper';
import type { AmazonRiskReport } from '../amazon/amazon.types';

// ─── fixtures ───────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<AmazonProduct> = {}): AmazonProduct {
  return {
    product_title: 'Silikon Paspas',
    price: 29.9,
    rating: 4.2,
    review_count: 120,
    seller_name: 'Seller A',
    seller_url: 'https://amazon.com/sp?seller=A',
    product_url: 'https://amazon.com/dp/B001',
    ...overrides,
  };
}

function makeProducts(count: number, priceFrom = 20, priceTo = 80): AmazonProduct[] {
  return Array.from({ length: count }, (_, i) => makeProduct({
    seller_name: `Seller ${i}`,
    price: priceFrom + ((priceTo - priceFrom) / Math.max(1, count - 1)) * i,
    review_count: 50 + i * 10,
    product_url: `https://amazon.com/dp/B${String(i).padStart(9, '0')}`,
  }));
}

// ─── confidence.calculator ───────────────────────────────────────────────────

describe('confidence.calculator', () => {
  test('returns INSUFFICIENT_DATA for < 10 data points', () => {
    expect(calculateConfidence(0)).toBe('INSUFFICIENT_DATA');
    expect(calculateConfidence(9)).toBe('INSUFFICIENT_DATA');
  });

  test('returns LOW for 10-30 data points', () => {
    expect(calculateConfidence(10)).toBe('LOW');
    expect(calculateConfidence(30)).toBe('LOW');
  });

  test('returns MEDIUM for 31-45 data points', () => {
    expect(calculateConfidence(31)).toBe('MEDIUM');
    expect(calculateConfidence(45)).toBe('MEDIUM');
  });

  test('returns HIGH for > 45 data points', () => {
    expect(calculateConfidence(46)).toBe('HIGH');
    expect(calculateConfidence(100)).toBe('HIGH');
  });

  test('canMakeDecision rejects INSUFFICIENT_DATA and LOW', () => {
    expect(canMakeDecision('INSUFFICIENT_DATA')).toBe(false);
    expect(canMakeDecision('LOW')).toBe(false);
    expect(canMakeDecision('MEDIUM')).toBe(true);
    expect(canMakeDecision('HIGH')).toBe(true);
  });
});

// ─── signal.validator ────────────────────────────────────────────────────────

describe('signal.validator — filterEligibleProducts', () => {
  test('filters out products with review_count < 10', () => {
    const products = [
      makeProduct({ review_count: 9 }),
      makeProduct({ review_count: 10 }),
      makeProduct({ review_count: 100 }),
    ];
    const eligible = filterEligibleProducts(products);
    expect(eligible).toHaveLength(2);
    expect(eligible.every(p => (p.review_count ?? 0) >= 10)).toBe(true);
  });
});

describe('signal.validator — validateSignals (MIXED_SIGNAL)', () => {
  function makeReport(scores: number[]): AmazonRiskReport {
    const [cr, sc, pw, br, or_] = scores;
    return {
      keyword: 'test',
      scanned_at: new Date().toISOString(),
      data_points: 50,
      scores: {
        category_risk:    { score: cr, confidence: 'HIGH', reason: '' },
        sku_chaos:        { score: sc, confidence: 'HIGH', reason: '' },
        price_war_risk:   { score: pw, confidence: 'HIGH', reason: '' },
        brand_reliability:{ score: br, confidence: 'HIGH', reason: '' },
        operational_risk: { score: or_, confidence: 'HIGH', reason: '' },
      },
      composite_score: (cr + sc + pw + br + or_) / 5,
      decision: 'DIKKATLI_OL',
      summary: '',
    };
  }

  test('produces MIXED_SIGNAL when only 1 score is high and 3+ are low', () => {
    const report = makeReport([8, 2, 1, 2, 1]);
    const { decision } = validateSignals(report);
    expect(decision).toBe('MIXED_SIGNAL');
  });

  test('does NOT produce MIXED_SIGNAL when multiple scores are high', () => {
    const report = makeReport([8, 7, 2, 1, 1]);
    const { decision } = validateSignals(report);
    expect(decision).not.toBe('MIXED_SIGNAL');
  });
});

// ─── category.normalizer ─────────────────────────────────────────────────────

describe('category.normalizer', () => {
  test('buildCategoryStats computes correct median and seller count', () => {
    const products = [
      makeProduct({ price: 10, seller_name: 'A' }),
      makeProduct({ price: 20, seller_name: 'B' }),
      makeProduct({ price: 30, seller_name: 'C' }),
    ];
    const stats = buildCategoryStats(products, 'paspas', 'com');
    expect(stats.priceMedian).toBe(20);
    expect(stats.sellerCount).toBe(3);
    expect(stats.productCount).toBe(3);
  });

  test('normalizeProducts returns price/review percentiles in 0-10 range', () => {
    const products = makeProducts(20);
    const normalized = normalizeProducts(products);
    for (const p of normalized) {
      expect(p.pricePercentile).toBeGreaterThanOrEqual(0);
      expect(p.pricePercentile).toBeLessThanOrEqual(10);
    }
  });
});

// ─── scorers (unit) ──────────────────────────────────────────────────────────

const BASE_STATS = buildCategoryStats(makeProducts(50), 'paspas', 'com');
const BASE_PRODUCTS = normalizeProducts(makeProducts(50));
const BASE_INPUT = { keyword: 'paspas', marketplace: 'com', products: BASE_PRODUCTS, stats: BASE_STATS };

describe('category-risk scorer', () => {
  test('returns INSUFFICIENT_DATA for < 10 products', () => {
    const result = scoreCategoryRisk({ ...BASE_INPUT, products: normalizeProducts(makeProducts(5)) });
    expect(result.confidence).toBe('INSUFFICIENT_DATA');
    expect(result.score).toBe(0);
  });

  test('score is between 0 and 10 for normal input', () => {
    const result = scoreCategoryRisk(BASE_INPUT);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });
});

describe('sku-chaos scorer', () => {
  test('high price spread produces higher score', () => {
    const wideStats = buildCategoryStats(makeProducts(50, 5, 200), 'paspas', 'com');
    const narrowStats = buildCategoryStats(makeProducts(50, 28, 32), 'paspas', 'com');
    const wide  = scoreSkuChaos({ ...BASE_INPUT, stats: wideStats });
    const narrow = scoreSkuChaos({ ...BASE_INPUT, stats: narrowStats });
    expect(wide.score).toBeGreaterThan(narrow.score);
  });
});

describe('price-war scorer', () => {
  test('returns INSUFFICIENT_DATA when no price data', () => {
    const noPriceProducts = makeProducts(20).map(p => ({ ...p, price: undefined }));
    const result = scorePriceWar({ ...BASE_INPUT, products: normalizeProducts(noPriceProducts) });
    expect(result.confidence).toBe('INSUFFICIENT_DATA');
  });

  test('high page1-to-page3 price drop increases score', () => {
    const high = scorePriceWar({ ...BASE_INPUT, pageOneAveragePrice: 50, pageThreeAveragePrice: 10 });
    const low  = scorePriceWar({ ...BASE_INPUT, pageOneAveragePrice: 50, pageThreeAveragePrice: 48 });
    expect(high.score).toBeGreaterThan(low.score);
  });
});

describe('brand-reliability scorer', () => {
  test('score is 0-10 for normal input', () => {
    const result = scoreBrandReliability(BASE_INPUT);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(10);
  });
});

describe('operational-risk scorer', () => {
  test('high problem score increases operational risk', () => {
    const high = scoreOperationalRisk({ ...BASE_INPUT, reviewProblemScore: 9, reviewProblemFlags: ['return', 'quality', 'broke'] });
    const low  = scoreOperationalRisk({ ...BASE_INPUT, reviewProblemScore: 0, reviewProblemFlags: [] });
    expect(high.score).toBeGreaterThan(low.score);
  });
});

// ─── composite scorer ─────────────────────────────────────────────────────────

describe('composite scorer', () => {
  test('decide returns correct labels', () => {
    expect(decide(0)).toBe('GUVENLI');
    expect(decide(3)).toBe('GUVENLI');
    expect(decide(4)).toBe('DIKKATLI_OL');
    expect(decide(6)).toBe('DIKKATLI_OL');
    expect(decide(7)).toBe('GIRME');
    expect(decide(10)).toBe('GIRME');
  });

  test('CompositeScorer returns null composite when all dimensions INSUFFICIENT', () => {
    const scores: AmazonRiskReport['scores'] = {
      category_risk:    { score: 0, confidence: 'INSUFFICIENT_DATA', reason: '' },
      sku_chaos:        { score: 0, confidence: 'INSUFFICIENT_DATA', reason: '' },
      price_war_risk:   { score: 0, confidence: 'INSUFFICIENT_DATA', reason: '' },
      brand_reliability:{ score: 0, confidence: 'INSUFFICIENT_DATA', reason: '' },
      operational_risk: { score: 0, confidence: 'INSUFFICIENT_DATA', reason: '' },
    };
    const { compositeScore, decision } = new CompositeScorer().score(scores);
    expect(compositeScore).toBeNull();
    expect(decision).toBe('INSUFFICIENT_DATA');
  });

  test('CompositeScorer weighs dimensions correctly', () => {
    const allHigh: AmazonRiskReport['scores'] = {
      category_risk:    { score: 10, confidence: 'HIGH', reason: '' },
      sku_chaos:        { score: 10, confidence: 'HIGH', reason: '' },
      price_war_risk:   { score: 10, confidence: 'HIGH', reason: '' },
      brand_reliability:{ score: 10, confidence: 'HIGH', reason: '' },
      operational_risk: { score: 10, confidence: 'HIGH', reason: '' },
    };
    const { compositeScore } = new CompositeScorer().score(allHigh);
    expect(compositeScore).toBe(10);
  });
});

// ─── scoring engine (integration) ────────────────────────────────────────────

describe('scoreAmazonCategory (integration)', () => {
  test('produces a complete AmazonRiskReport for sufficient data', () => {
    const products = makeProducts(50);
    const report = scoreAmazonCategory({
      keyword: 'silikon paspas',
      marketplace: 'com',
      products,
      reviewProblemScore: 3,
      reviewProblemFlags: ['smell'],
    });

    expect(report.keyword).toBe('silikon paspas');
    expect(report.data_points).toBe(50);
    expect(report.scores).toBeDefined();
    expect(typeof report.composite_score).toBe('number');
    expect(['GUVENLI', 'DIKKATLI_OL', 'GIRME', 'MIXED_SIGNAL', 'INSUFFICIENT_DATA']).toContain(report.decision);
    expect(report.summary.length).toBeGreaterThan(10);
  });

  test('returns INSUFFICIENT_DATA decision for < 10 products', () => {
    const products = makeProducts(5);
    const report = scoreAmazonCategory({ keyword: 'test', marketplace: 'com', products });
    expect(report.decision).toBe('INSUFFICIENT_DATA');
    expect(report.composite_score).toBeNull();
  });
});
