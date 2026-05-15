import { describe, expect, test } from 'bun:test';
import { CompositeScorer, decide } from '../composite.scorer';
import type { AmazonRiskReport } from '../amazon.types';

const scores: AmazonRiskReport['scores'] = {
  category_risk: { score: 8, confidence: 'HIGH', reason: '' },
  price_war_risk: { score: 6, confidence: 'MEDIUM', reason: '' },
  sku_chaos: { score: 7, confidence: 'HIGH', reason: '' },
  brand_reliability: { score: 4, confidence: 'LOW', reason: '' },
  operational_risk: { score: 5, confidence: 'HIGH', reason: '' },
};

describe('amazon composite scorer', () => {
  test('calculates weighted score from decision-capable dimensions', () => {
    const result = new CompositeScorer().score(scores);

    expect(result.compositeScore).toBeGreaterThan(6);
    expect(result.decision).toBe('GIRME');
  });

  test('maps decision thresholds', () => {
    expect(decide(3)).toBe('GUVENLI');
    expect(decide(6)).toBe('DIKKATLI_OL');
    expect(decide(6.1)).toBe('GIRME');
  });
});
