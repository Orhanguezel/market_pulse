import type { IcpProfile } from '../icp/icp.repository';
import { scrape, searchGoogleMaps, type DirectoryListingData, type Place } from '../_shared/scraper.client';

export async function searchDirectory(
  source: string,
  icp: IcpProfile | null,
  params: { search_query?: string; country?: string; limit?: number },
): Promise<Partial<Place>[]> {
  const definition = (icp?.definition ?? {}) as { sectors?: string[] };
  const query = params.search_query || definition.sectors?.[0] || 'automotive accessories distributor';

  if (source === 'google_maps') {
    const data = await searchGoogleMaps(query, {
      total:    Math.min(params.limit ?? 10, 10),
      language: 'en',
      region:   params.country ?? undefined,
    });
    return data.places ?? [];
  }

  const url = source === 'tobb'
    ? `https://www.tobb.org.tr/Sayfalar/Arama.php?q=${encodeURIComponent(query)}`
    : `https://www.europages.com/search/companies?query=${encodeURIComponent(query)}`;

  const result = await scrape(url, {
    profile:     'directory-listing',
    return_text: true,
    mode:        'stealthy',
    options:     { country: params.country ?? null, limit: params.limit ?? 25 },
  });

  const data = result.data as unknown as DirectoryListingData;
  return (data.companies ?? []).map(c => ({
    name:    c.name,
    website: c.website,
    phone:   c.phone,
    address: null,
    place_url: c.source_url,
  }));
}
