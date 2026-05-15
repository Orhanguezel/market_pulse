import { calculateConfidence } from '../confidence.calculator';
import type { AmazonScoreInput, DimensionScore } from '../amazon.types';

const criticalFlags = new Set(['return', 'quality', 'broke', 'fit', 'slippery']);

export function scoreOperationalRisk(input: AmazonScoreInput): DimensionScore {
  const confidence = calculateConfidence(input.products.length);
  if (confidence === 'INSUFFICIENT_DATA') {
    return { score: 0, confidence, reason: 'Operasyonel risk için en az 10 veri noktası gerekir.' };
  }

  const flags = input.reviewProblemFlags ?? [];
  const criticalCount = flags.filter((flag) => criticalFlags.has(flag)).length;
  const problemScore = input.reviewProblemScore ?? 0;
  const lowRatedRatio = input.products.filter((product) => (product.rating ?? 5) < 4).length / input.products.length;
  const score = Math.min(10, problemScore * 0.65 + criticalCount * 0.6 + lowRatedRatio * 3);

  return {
    score: Number(score.toFixed(1)),
    confidence,
    reason: `Review problem skoru ${problemScore.toFixed(1)}, kritik şikayet bayrağı ${criticalCount}.`,
  };
}
