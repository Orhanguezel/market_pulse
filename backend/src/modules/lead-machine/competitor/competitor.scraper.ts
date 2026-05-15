import { scrape, type CompetitorPageData } from '../_shared/scraper.client';

export async function scanCompetitorPage(url: string): Promise<CompetitorPageData> {
  const result = await scrape(url, {
    profile:     'competitor-page',
    return_text: false,
    mode:        'stealthy',
  });
  return result.data as unknown as CompetitorPageData;
}
