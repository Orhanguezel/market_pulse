// =============================================================
// FILE: backend/src/modules/lead-machine/campaign/host-keyword.sync.ts
// Pulls the host exhibitor's public keywords/description from Messe,
// merges them into the linked ICP definition's sectors[] / positive_signals[]
// and persists the data on the campaign for transparency.
// =============================================================

import { getCampaign } from './campaign.repository';
import { getIcpProfile, updateIcpProfile } from '../icp/icp.repository';
import { searchMesseExhibitor, type HostExhibitorData } from './host-exhibitor.lookup';

export interface SyncResult {
  campaign_id: string;
  campaign_slug: string;
  host_query_used: string | null;
  host_data: HostExhibitorData | null;
  icp_updated: boolean;
  icp_id: string | null;
  added_keywords: string[];
  added_signals: string[];
  preview_existing_keywords: number;
  preview_existing_signals: number;
  /** Deprecated — kept for backward-compat with older UI builds */
  added_sectors: string[];
  preview_existing_sectors: number;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];
}

function dedupCaseInsensitive(existing: string[], additions: string[]): { merged: string[]; added: string[] } {
  const lower = new Set(existing.map((s) => s.toLowerCase().trim()));
  const added: string[] = [];
  const merged = [...existing];
  for (const item of additions) {
    const norm = item.toLowerCase().trim();
    if (!norm || lower.has(norm)) continue;
    lower.add(norm);
    merged.push(item);
    added.push(item);
  }
  return { merged, added };
}

function toAsciiNoAbbrev(text: string): string {
  // Strip "San.", "Tic.", "Ltd.", "Şti.", "Sp. z o.o.", "GmbH", "S.r.l." etc by
  // removing punctuation-heavy tokens, then transliterate Turkish/German/Polish
  // diacritics so Messe's name-matching can hit. Cheap best-effort, not perfect.
  const noAbbrev = text
    .replace(/\b(?:san|tic|ltd|şti|sti|s\.?p\.?\s*z\s*o\.?o\.?|gmbh|s\.?r\.?l|sas|sa|sl|ag|co|kg)\.?/gi, '')
    .replace(/[.,/&]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return noAbbrev
    .replace(/[şŞ]/g, 's')
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[ą]/g, 'a').replace(/[ę]/g, 'e').replace(/[ł]/g, 'l').replace(/[ń]/g, 'n')
    .replace(/[ć]/g, 'c').replace(/[ś]/g, 's').replace(/[ż]/g, 'z').replace(/[ź]/g, 'z')
    .replace(/[äÄ]/g, 'a').replace(/[ßẞ]/g, 'ss');
}

function buildQueryCandidates(campaign: Awaited<ReturnType<typeof getCampaign>>): string[] {
  if (!campaign) return [];
  const queries: string[] = [];
  const push = (s: string | null | undefined) => {
    if (!s) return;
    const trimmed = s.trim();
    if (trimmed && !queries.includes(trimmed)) queries.push(trimmed);
  };

  push(campaign.brand_legal);
  if (campaign.brand_legal) {
    const ascii = toAsciiNoAbbrev(campaign.brand_legal);
    push(ascii);
    const firstTwo = ascii.split(/\s+/).slice(0, 2).join(' ');
    push(firstTwo);
    push(ascii.split(/\s+/)[0]);
  }
  push(campaign.brand_short);
  if (campaign.brand_short) push(toAsciiNoAbbrev(campaign.brand_short));
  // brand_name often contains a slash "Brand A / Brand B" — try each part.
  if (campaign.brand_name) {
    for (const part of campaign.brand_name.split(/[\\/|·]/)) {
      push(part.trim());
    }
  }
  return queries;
}

export async function syncHostKeywordsToIcp(campaignId: string): Promise<SyncResult> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');

  const queryCandidates = buildQueryCandidates(campaign);
  if (queryCandidates.length === 0) {
    return {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      host_query_used: null,
      host_data: null,
      icp_updated: false,
      icp_id: campaign.icp_id,
      added_keywords: [],
      added_signals: [],
      preview_existing_keywords: 0,
      preview_existing_signals: 0,
      added_sectors: [],
      preview_existing_sectors: 0,
    };
  }

  let hostData: HostExhibitorData | null = null;
  let queryUsed: string | null = null;
  for (const q of queryCandidates) {
    try {
      const found = await searchMesseExhibitor({ query: q });
      if (found) {
        hostData = found;
        queryUsed = q;
        break;
      }
    } catch {
      // try the next candidate
    }
  }
  const query = queryUsed;
  if (!hostData) {
    return {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      host_query_used: query,
      host_data: null,
      icp_updated: false,
      icp_id: campaign.icp_id,
      added_keywords: [],
      added_signals: [],
      preview_existing_keywords: 0,
      preview_existing_signals: 0,
      added_sectors: [],
      preview_existing_sectors: 0,
    };
  }

  if (!campaign.icp_id) {
    return {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      host_query_used: query,
      host_data: hostData,
      icp_updated: false,
      icp_id: null,
      added_keywords: [],
      added_signals: [],
      preview_existing_keywords: 0,
      preview_existing_signals: 0,
      added_sectors: [],
      preview_existing_sectors: 0,
    };
  }

  const icp = await getIcpProfile(campaign.icp_id);
  if (!icp) {
    return {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      host_query_used: query,
      host_data: hostData,
      icp_updated: false,
      icp_id: campaign.icp_id,
      added_keywords: [],
      added_signals: [],
      preview_existing_keywords: 0,
      preview_existing_signals: 0,
      added_sectors: [],
      preview_existing_sectors: 0,
    };
  }

  const definition = (icp.definition && typeof icp.definition === 'object' && !Array.isArray(icp.definition))
    ? { ...(icp.definition as Record<string, unknown>) }
    : {};

  const keywords = asStringArray(definition.keywords);
  const positives = asStringArray(definition.positive_signals);

  // Strategy:
  //   - Messe keywords  -> definition.keywords  (host-specific, drives the
  //     keyword-overlap badge + score boost; intentionally kept out of
  //     definition.sectors so it does NOT widen the ICP inclusion filter)
  //   - product_names   -> positive_signals  (still surfaces in matchesIcp
  //     as a weaker text signal)
  const keywordsMerged = dedupCaseInsensitive(keywords, hostData.keywords);
  const signalsMerged = dedupCaseInsensitive(positives, hostData.product_names);

  definition.keywords = keywordsMerged.merged;
  definition.positive_signals = signalsMerged.merged;

  // Store the host snapshot under fair.host_exhibitor.messe_snapshot so the UI
  // and future runs can see what we pulled in and when.
  const fair = (definition.fair && typeof definition.fair === 'object' && !Array.isArray(definition.fair))
    ? { ...(definition.fair as Record<string, unknown>) }
    : {};
  const host = (fair.host_exhibitor && typeof fair.host_exhibitor === 'object' && !Array.isArray(fair.host_exhibitor))
    ? { ...(fair.host_exhibitor as Record<string, unknown>) }
    : {};
  host.messe_snapshot = {
    fetched_at: new Date().toISOString(),
    source_url: hostData.source_url,
    name: hostData.name,
    description: hostData.description,
    short_description: hostData.short_description,
    keywords: hostData.keywords,
    product_names: hostData.product_names,
    hall: hostData.hall,
    booth: hostData.booth,
  };
  fair.host_exhibitor = host;
  definition.fair = fair;

  await updateIcpProfile(icp.id, { definition });

  return {
    campaign_id: campaign.id,
    campaign_slug: campaign.slug,
    host_query_used: query,
    host_data: hostData,
    icp_updated: keywordsMerged.added.length > 0 || signalsMerged.added.length > 0,
    icp_id: icp.id,
    added_keywords: keywordsMerged.added,
    added_signals: signalsMerged.added,
    preview_existing_keywords: keywords.length,
    preview_existing_signals: positives.length,
    // backward-compat
    added_sectors: keywordsMerged.added,
    preview_existing_sectors: keywords.length,
  };
}
