import { scrape, type FairExhibitorData } from '../_shared/scraper.client';

export interface RawExhibitor {
  name:         string;
  website?:     string;
  country?:     string;
  booth_number?: string;
  description?: string;
}

export async function scrapeOfficialExhibitorList(fairUrl: string): Promise<RawExhibitor[]> {
  const result = await scrape(fairUrl, {
    profile:     'fair-exhibitor',
    return_html: true,
    return_text: true,
    mode:        'stealthy',
  });
  const data = result.data as unknown as FairExhibitorData;
  return (data.exhibitors ?? []).map(e => ({
    name:         e.name,
    website:      e.website ?? undefined,
    country:      undefined,
    booth_number: e.booth_number ?? undefined,
    description:  e.description ?? undefined,
  }));
}
