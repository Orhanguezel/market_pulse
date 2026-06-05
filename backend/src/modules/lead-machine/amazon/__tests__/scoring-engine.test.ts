import { describe, expect, test } from 'bun:test';
import { scoreAmazonCategory } from '../amazon.scoring-engine';
import { products } from './fixtures/scoring-fixtures';

describe('amazon scoring engine', () => {
  test('creates full 5-dimensional risk report', () => {
    const report = scoreAmazonCategory({
      keyword: 'oto aksesuar',
      marketplace: 'de',
      products: products(50),
      reviewProblemScore: 6,
      reviewProblemFlags: ['quality', 'return'],
    });

    expect(report.keyword).toBe('oto aksesuar');
    expect(report.data_points).toBe(50);
    expect(report.scores.category_risk.confidence).toBe('HIGH');
    expect(report.composite_score).toBeNumber();
    expect(['GUVENLI', 'DIKKATLI_OL', 'GIRME', 'MIXED_SIGNAL']).toContain(report.decision);
  });

  test('does not create composite score when confidence is insufficient', () => {
    const report = scoreAmazonCategory({ keyword: 'x', marketplace: 'de', products: products(5) });

    expect(report.composite_score).toBeNull();
    expect(report.decision).toBe('INSUFFICIENT_DATA');
  });
});
