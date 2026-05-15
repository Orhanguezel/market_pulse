import { canMakeDecision } from './confidence.calculator';
import type { AmazonRiskReport, Decision, DimensionScore } from './amazon.types';
import { COMPOSITE_WEIGHTS, DECISION_THRESHOLDS } from './scoring.config';

export type CompositeWeights = {
  category_risk: number;
  price_war_risk: number;
  sku_chaos: number;
  brand_reliability: number;
  operational_risk: number;
};

export const defaultCompositeWeights: CompositeWeights = { ...COMPOSITE_WEIGHTS };

export class CompositeScorer {
  constructor(private readonly weights: CompositeWeights = defaultCompositeWeights) {}

  score(scores: AmazonRiskReport['scores']) {
    const entries = Object.entries(scores) as Array<[keyof CompositeWeights, DimensionScore]>;
    const usable = entries.filter(([, value]) => canMakeDecision(value.confidence));
    if (!usable.length) {
      return { compositeScore: null, decision: 'INSUFFICIENT_DATA' as const };
    }

    const weightTotal = usable.reduce((sum, [key]) => sum + this.weights[key], 0);
    const weighted = usable.reduce((sum, [key, value]) => sum + value.score * this.weights[key], 0);
    const compositeScore = Number((weighted / weightTotal).toFixed(1));
    return { compositeScore, decision: decide(compositeScore) };
  }
}

export function decide(score: number): Decision {
  if (score <= DECISION_THRESHOLDS.GUVENLI_MAX) return 'GUVENLI';
  if (score <= DECISION_THRESHOLDS.DIKKATLI_OL_MAX) return 'DIKKATLI_OL';
  return 'GIRME';
}

export function calculateOutreachPriority(
  compositeScore: number | null,
  brandReliabilityScore: number,
): number {
  if (compositeScore === null) return 1;
  const brandGap = (10 - brandReliabilityScore) * 0.3;
  const raw = compositeScore * 0.7 + brandGap;
  return Number(Math.min(10, Math.max(1, raw)).toFixed(1));
}
