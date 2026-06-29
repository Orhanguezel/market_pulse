import type { Place } from '../_shared/scraper.client';

interface IcpDefinition {
  geographies?: string[];
  priority_geographies?: string[];
  exclude_geographies?: string[];
  exclude_countries?: string[];
  exclude_patterns?: string[];
  exclude_sectors?: string[];
  exclude_firm_types?: string[];
  firm_types?: string[];
  priority_firm_types?: string[];
  sectors?: string[];
  priority_sectors?: string[];
  priority_crop?: string;
  keywords?: unknown;
  sales_channels?: string[];
  positive_signals?: string[];
  negative_signals?: string[];
  min_lead_score_for_candidate?: number;
}

const BUILT_IN_NEGATIVE_TERMS = [
  'spice',
  'spices',
  'seasoning',
  'culinary',
  'food ingredient',
  'dried pepper',
  'pepper powder',
  'paprika powder',
  'chilli powder',
  'sauce',
];

function flattenKeywords(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(flattenKeywords);
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap(flattenKeywords);
  }
  return [];
}

function includesTerm(text: string, term: string): boolean {
  const normalized = term.toLowerCase().trim();
  return normalized.length > 1 && text.includes(normalized);
}

export function matchesIcp(lead: Partial<Place> & { country?: string | null; city?: string | null; description?: string | null; fairHall?: string | null }, icp: IcpDefinition) {
  const text = `${lead.name} ${lead.address ?? ''} ${lead.description ?? ''} ${lead.website ?? ''}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  const country = lead.country?.toUpperCase();
  const excludedCountries = [...(icp.exclude_countries ?? []), ...(icp.exclude_geographies ?? [])].map(c => c.toUpperCase());
  if (country && excludedCountries.includes(country)) return { matches: false, score: 0, reasons: ['excluded_country'] };
  for (const pattern of icp.exclude_patterns ?? []) {
    if (text.includes(pattern.toLowerCase())) return { matches: false, score: 0, reasons: [`excluded_pattern:${pattern}`] };
  }
  for (const pattern of [...(icp.exclude_sectors ?? []), ...(icp.exclude_firm_types ?? [])]) {
    if (includesTerm(text, pattern)) return { matches: false, score: 0, reasons: [`excluded_pattern:${pattern}`] };
  }
  for (const pattern of BUILT_IN_NEGATIVE_TERMS) {
    if (includesTerm(text, pattern)) {
      score -= 2;
      reasons.push(`negative_term:${pattern}`);
    }
  }
  for (const sector of icp.sectors ?? []) {
    if (includesTerm(text, sector)) {
      score += 3;
      reasons.push(`sector:${sector}`);
    }
  }
  for (const sector of icp.priority_sectors ?? []) {
    if (includesTerm(text, sector)) {
      score += 2;
      reasons.push(`priority_sector:${sector}`);
    }
  }
  for (const keyword of flattenKeywords(icp.keywords)) {
    if (includesTerm(text, keyword)) {
      score += 1;
      reasons.push(`keyword:${keyword}`);
    }
  }
  if (icp.priority_crop && includesTerm(text, icp.priority_crop)) {
    score += 2;
    reasons.push(`priority_crop:${icp.priority_crop}`);
  }
  for (const type of icp.firm_types ?? []) {
    if (includesTerm(text, type)) {
      score += 2;
      reasons.push(`firm_type:${type}`);
    }
  }
  for (const type of icp.priority_firm_types ?? []) {
    if (includesTerm(text, type)) {
      score += 1;
      reasons.push(`priority_firm_type:${type}`);
    }
  }
  for (const channel of icp.sales_channels ?? []) {
    if (includesTerm(text, channel)) {
      score += 1;
      reasons.push(`channel:${channel}`);
    }
  }
  for (const signal of icp.positive_signals ?? []) {
    if (includesTerm(text, signal)) {
      score += 1;
      reasons.push(`positive_signal:${signal}`);
    }
  }
  for (const signal of icp.negative_signals ?? []) {
    if (includesTerm(text, signal)) {
      score -= 2;
      reasons.push(`negative_signal:${signal}`);
    }
  }
  if (country && icp.geographies?.map(c => c.toUpperCase()).includes(country)) {
    score += 2;
    reasons.push(`geography:${country}`);
  }
  if (country && icp.priority_geographies?.map(c => c.toUpperCase()).includes(country)) {
    score += 1;
    reasons.push(`priority_geography:${country}`);
  }
  if (lead.fairHall && ['3.0', '3.1', '4.0'].includes(lead.fairHall)) {
    score += 2;
    reasons.push(`automechanika_accessory_hall:${lead.fairHall}`);
  }
  if (lead.website) {
    score += 2;
    reasons.push('website');
  }
  if (lead.phone) score += 1;
  const threshold = icp.min_lead_score_for_candidate ?? 2;
  const normalizedScore = Math.max(0, Math.min(10, score));
  return { matches: normalizedScore >= threshold, score: normalizedScore, reasons };
}
