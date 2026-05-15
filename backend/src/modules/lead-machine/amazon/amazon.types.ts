import type { AmazonProduct } from './amazon.scraper';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
export type Decision = 'GUVENLI' | 'DIKKATLI_OL' | 'GIRME' | 'MIXED_SIGNAL';

export type DimensionScore = {
  score: number;
  confidence: Confidence;
  reason: string;
};

export type AmazonCategoryStats = {
  keyword: string;
  marketplace: string;
  productCount: number;
  priceMin: number;
  priceMax: number;
  priceMedian: number;
  priceSigma: number;
  sellerCount: number;
  dominantBrandRatio: number;
};

export type NormalizedProduct = AmazonProduct & {
  pricePercentile: number;
  reviewPercentile: number;
  ratingPercentile: number;
  normalizedPriceScore: number;
  normalizedReviewScore: number;
  normalizedRatingScore: number;
};

export type AmazonScoreInput = {
  keyword: string;
  marketplace: string;
  products: NormalizedProduct[];
  stats: AmazonCategoryStats;
  pageOneAveragePrice?: number | null;
  pageThreeAveragePrice?: number | null;
  reviewProblemScore?: number;
  reviewProblemFlags?: string[];
};

export type BrandContext = {
  brand_aggregated: boolean;
  brand_name: string | null;
  sku_count: number | null;
};

export type AmazonRiskReport = {
  keyword: string;
  scanned_at: string;
  data_points: number;
  scores: {
    category_risk: DimensionScore;
    sku_chaos: DimensionScore;
    price_war_risk: DimensionScore;
    brand_reliability: DimensionScore;
    operational_risk: DimensionScore;
  };
  composite_score: number | null;
  decision: Decision | 'INSUFFICIENT_DATA';
  summary: string;
  outreach_priority: number;
  persuasion_points: string[];
  brand_context: BrandContext;
  enrichment: Record<string, unknown> | null;
  problem_flags?: string[];
};
