import type { Confidence } from './amazon.types';
import { CONFIDENCE_THRESHOLDS as T } from './scoring.config';

export function calculateConfidence(dataPoints: number): Confidence {
  if (dataPoints <= T.INSUFFICIENT_DATA_MAX) return 'INSUFFICIENT_DATA';
  if (dataPoints <= T.LOW_MAX) return 'LOW';
  if (dataPoints <= T.MEDIUM_MAX) return 'MEDIUM';
  return 'HIGH';
}

export function canMakeDecision(confidence: Confidence) {
  return confidence === 'HIGH' || confidence === 'MEDIUM';
}
