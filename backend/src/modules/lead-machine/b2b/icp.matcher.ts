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
  sectors?: string[];
  sales_channels?: string[];
  positive_signals?: string[];
  negative_signals?: string[];
  min_lead_score_for_candidate?: number;
}

export function matchesIcp(lead: Partial<Place> & { country?: string | null; city?: string | null; description?: string | null; fairHall?: string | null }, icp: IcpDefinition) {
  const text = `${lead.name} ${lead.address ?? ''} ${lead.description ?? ''}`.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  const country = lead.country?.toUpperCase();
  const excludedCountries = [...(icp.exclude_countries ?? []), ...(icp.exclude_geographies ?? [])].map(c => c.toUpperCase());
  if (country && excludedCountries.includes(country)) return { matches: false, score: 0, reasons: ['excluded_country'] };
  for (const pattern of icp.exclude_patterns ?? []) {
    if (text.includes(pattern.toLowerCase())) return { matches: false, score: 0, reasons: [`excluded_pattern:${pattern}`] };
  }
  for (const pattern of [...(icp.exclude_sectors ?? []), ...(icp.exclude_firm_types ?? [])]) {
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
  for (const channel of icp.sales_channels ?? []) {
    if (text.includes(channel.toLowerCase())) {
      score += 1;
      reasons.push(`channel:${channel}`);
    }
  }
  for (const signal of icp.positive_signals ?? []) {
    if (text.includes(signal.toLowerCase())) {
      score += 1;
      reasons.push(`positive_signal:${signal}`);
    }
  }
  for (const signal of icp.negative_signals ?? []) {
    if (text.includes(signal.toLowerCase())) {
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
