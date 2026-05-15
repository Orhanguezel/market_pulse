import type { Place } from '../_shared/scraper.client';

interface IcpDefinition {
  geographies?: string[];
  exclude_countries?: string[];
  exclude_patterns?: string[];
  firm_types?: string[];
  sectors?: string[];
}

export function matchesIcp(lead: Partial<Place> & { country?: string | null; description?: string | null }, icp: IcpDefinition) {
  const text = `${lead.name} ${lead.address ?? ''} ${lead.description ?? ''}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (lead.country && icp.exclude_countries?.includes(lead.country)) return { matches: false, score: 0, reasons: ['excluded_country'] };
  for (const pattern of icp.exclude_patterns ?? []) {
    if (text.includes(pattern.toLowerCase())) return { matches: false, score: 0, reasons: [`excluded_pattern:${pattern}`] };
  }
  for (const sector of icp.sectors ?? []) {
    if (text.includes(sector.toLowerCase())) {
      score += 3;
      reasons.push(`sector:${sector}`);
    }
  }
  for (const type of icp.firm_types ?? []) {
    if (text.includes(type.toLowerCase())) {
      score += 2;
      reasons.push(`firm_type:${type}`);
    }
  }
  if (lead.website) {
    score += 2;
    reasons.push('website');
  }
  if (lead.phone) score += 1;
  return { matches: score >= 2, score: Math.min(10, score), reasons };
}
