import { describe, expect, test } from 'bun:test';
import { calculateConfidence, canMakeDecision } from '../confidence.calculator';

describe('amazon confidence calculator', () => {
  test('maps data point thresholds to confidence levels', () => {
    expect(calculateConfidence(9)).toBe('INSUFFICIENT_DATA');
    expect(calculateConfidence(10)).toBe('LOW');
    expect(calculateConfidence(30)).toBe('LOW');
    expect(calculateConfidence(31)).toBe('MEDIUM');
    expect(calculateConfidence(46)).toBe('HIGH');
  });

  test('allows decision only for medium and high confidence', () => {
    expect(canMakeDecision('INSUFFICIENT_DATA')).toBe(false);
    expect(canMakeDecision('LOW')).toBe(false);
    expect(canMakeDecision('MEDIUM')).toBe(true);
    expect(canMakeDecision('HIGH')).toBe(true);
  });
});
