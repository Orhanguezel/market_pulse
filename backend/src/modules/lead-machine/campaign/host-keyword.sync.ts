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
  added_sectors: string[];
  added_signals: string[];
  preview_existing_sectors: number;
  preview_existing_signals: number;
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

function pickHostQuery(campaign: Awaited<ReturnType<typeof getCampaign>>): string | null {
  if (!campaign) return null;
  // Prefer the legal name (most specific), then short, then full brand name
  return campaign.brand_legal || campaign.brand_short || campaign.brand_name || null;
}

export async function syncHostKeywordsToIcp(campaignId: string): Promise<SyncResult> {
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error('CAMPAIGN_NOT_FOUND');

  const query = pickHostQuery(campaign);
  if (!query) {
    return {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      host_query_used: null,
      host_data: null,
      icp_updated: false,
      icp_id: campaign.icp_id,
      added_sectors: [],
      added_signals: [],
      preview_existing_sectors: 0,
      preview_existing_signals: 0,
    };
  }

  const hostData = await searchMesseExhibitor({ query });
  if (!hostData) {
    return {
      campaign_id: campaign.id,
      campaign_slug: campaign.slug,
      host_query_used: query,
      host_data: null,
      icp_updated: false,
      icp_id: campaign.icp_id,
      added_sectors: [],
      added_signals: [],
      preview_existing_sectors: 0,
      preview_existing_signals: 0,
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
      added_sectors: [],
      added_signals: [],
      preview_existing_sectors: 0,
      preview_existing_signals: 0,
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
      added_sectors: [],
      added_signals: [],
      preview_existing_sectors: 0,
      preview_existing_signals: 0,
    };
  }

  const definition = (icp.definition && typeof icp.definition === 'object' && !Array.isArray(icp.definition))
    ? { ...(icp.definition as Record<string, unknown>) }
    : {};

  const sectors = asStringArray(definition.sectors);
  const positives = asStringArray(definition.positive_signals);

  // Strategy:
  //   - keywords  -> sectors (they are category labels, what we sell)
  //   - product_names -> positive_signals (carry weaker weight)
  const sectorsMerged = dedupCaseInsensitive(sectors, hostData.keywords);
  const signalsMerged = dedupCaseInsensitive(positives, hostData.product_names);

  definition.sectors = sectorsMerged.merged;
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
    icp_updated: sectorsMerged.added.length > 0 || signalsMerged.added.length > 0,
    icp_id: icp.id,
    added_sectors: sectorsMerged.added,
    added_signals: signalsMerged.added,
    preview_existing_sectors: sectors.length,
    preview_existing_signals: positives.length,
  };
}
