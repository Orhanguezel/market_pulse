import { getIcpProfile } from '../icp/icp.repository';
import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { matchesIcp } from '../b2b/icp.matcher';
import { scrapeExhibitorDetail, scrapeOfficialExhibitorList, type RawExhibitor } from './fair.scraper';
import { isNeighborBooth, parseBooth } from './booth';

interface FairJobParams {
  fair_name?: string;
  fair_url?: string;
  fair_date?: string;
  icp_id?: string;
  hall_filters?: string[];
  max_pages?: number;
  max_exhibitors?: number;
  detail_concurrency?: number;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length || 1);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await fn(items[current], current);
    }
  }));
  return results;
}

export async function runFairJob(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as FairJobParams;
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    const icp = params.icp_id ? await getIcpProfile(params.icp_id) : null;
    const exhibitors = await scrapeOfficialExhibitorList(params.fair_url ?? '', {
      halls: params.hall_filters,
      maxPages: params.max_pages,
      maxExhibitors: params.max_exhibitors,
    });
    const detailConcurrency = Math.min(5, Math.max(1, Math.floor(params.detail_concurrency ?? 5)));
    const detailErrors: Array<{ url: string; name: string; error: string }> = [];
    const enrichedExhibitors = await mapWithConcurrency(exhibitors, detailConcurrency, async (listedExhibitor) => {
      const detailUrl = listedExhibitor.detail_url;
      if (!detailUrl) return listedExhibitor;
      try {
        const detail = await scrapeExhibitorDetail(detailUrl);
        return {
          ...listedExhibitor,
          ...detail,
          name: detail.name || listedExhibitor.name,
          website: detail.website || listedExhibitor.website,
          booth_number: detail.booth_number || listedExhibitor.booth_number,
          description: detail.description || listedExhibitor.description,
          detail_url: detail.detail_url || detailUrl,
          product_groups: detail.product_groups?.length ? detail.product_groups : listedExhibitor.product_groups,
          brands: detail.brands?.length ? detail.brands : listedExhibitor.brands,
        };
      } catch (e) {
        detailErrors.push({
          url: detailUrl,
          name: listedExhibitor.name,
          error: e instanceof Error ? e.message : 'UNKNOWN_ERROR',
        });
        return listedExhibitor;
      }
    });
    let count = 0;
    for (const exhibitor of enrichedExhibitors) {
      const boothGrid = parseBooth(exhibitor.booth_number ?? exhibitor.hall ?? null);
      const isNeighbor = isNeighborBooth(boothGrid);
      const match = matchesIcp({
        name: exhibitor.name,
        website: exhibitor.website ?? null,
        country: exhibitor.country,
        city: exhibitor.city,
        address: exhibitor.address,
        phone: exhibitor.phone,
        description: [
          exhibitor.description,
          ...(exhibitor.product_groups ?? []),
          ...(exhibitor.brands ?? []),
          ...(exhibitor.target_markets ?? []),
          ...(exhibitor.trade_audience ?? []),
        ].filter(Boolean).join(' '),
        fairHall: boothGrid.hall ?? exhibitor.hall,
      }, (icp?.definition ?? {}) as Parameters<typeof matchesIcp>[1]);
      if (icp && !match.matches) continue;
      await insertCandidate({
        jobId,
        channel: 'trade_fair',
        icpId: icp?.id ?? null,
        name: exhibitor.name,
        website: exhibitor.website ?? null,
        country: exhibitor.country ?? null,
        city: exhibitor.city ?? null,
        phone: exhibitor.phone ?? null,
        email: exhibitor.email ?? null,
        rawData: {
          fair_info: {
            fair_name: params.fair_name ?? null,
            fair_date: params.fair_date ?? null,
            booth_number: exhibitor.booth_number ?? null,
            booth_grid: boothGrid,
            is_neighbor: isNeighbor,
            neighbor_anchor_booth: '3.1 D11',
            neighbor_column_distance: isNeighbor && boothGrid.col !== null ? Math.abs(boothGrid.col - 11) : null,
          },
          exhibitor,
          match,
        },
        aiSummary: exhibitor.description ?? null,
        leadScore: match.score,
      });
      count += 1;
    }
    if (detailErrors.length) {
      // Detail scrape hataları aday bazında izole edilir; job genel sonucu başarılı kalır.
      await updateSearchJob(jobId, { errorMsg: JSON.stringify({ detail_errors: detailErrors.slice(0, 20) }) });
    }
    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
