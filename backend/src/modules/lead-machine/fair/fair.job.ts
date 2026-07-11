import { getIcpProfile } from '../icp/icp.repository';
import { getActiveTenantKey, getActiveUserId } from '@/modules/_shared';
import { pool } from '@/db/client';
import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { matchesIcp } from '../b2b/icp.matcher';
import { scrapeExhibitorDetail, scrapeOfficialExhibitorList, type RawExhibitor } from './fair.scraper';
import { isNeighborBooth, parseBooth } from './booth';
import { buildSummary, classifyMail, computeKeywordOverlap, computeScore, recommend } from './enrichment';

function extractHostKeywords(definition: unknown): string[] {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) return [];
  const def = definition as Record<string, unknown>;
  const collected: string[] = [];

  // Primary source: editable definition.keywords (managed by UI + sync)
  const direct = def.keywords;
  if (Array.isArray(direct)) {
    for (const k of direct) {
      if (typeof k === 'string' && k.trim()) collected.push(k);
    }
  }

  // Fallback: snapshot stored by sync under fair.host_exhibitor.messe_snapshot.keywords
  const fair = def.fair;
  if (fair && typeof fair === 'object' && !Array.isArray(fair)) {
    const host = (fair as Record<string, unknown>).host_exhibitor;
    if (host && typeof host === 'object' && !Array.isArray(host)) {
      const snap = (host as Record<string, unknown>).messe_snapshot;
      if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
        const kws = (snap as Record<string, unknown>).keywords;
        if (Array.isArray(kws)) {
          for (const k of kws) {
            if (typeof k === 'string' && k.trim()) collected.push(k);
          }
        }
      }
    }
  }

  // Dedup case-insensitive while preserving first occurrence order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of collected) {
    const norm = k.toLowerCase().trim();
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(k);
    }
  }
  return out;
}

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
  const ownerUserId = getActiveUserId() ?? null;
  const tenantKey = getActiveTenantKey();
  const job = await getSearchJob(jobId, { ownerUserId });
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as FairJobParams;
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    const icp = params.icp_id ? await getIcpProfile(params.icp_id, ownerUserId) : null;
    const hostKeywords = extractHostKeywords(icp?.definition);
    const [existingRows] = await pool.execute(
      `SELECT name, JSON_UNQUOTE(JSON_EXTRACT(raw_data, '$.exhibitor.detail_url')) AS detail_url
         FROM lead_candidates
        WHERE tenant_key = ? AND job_id = ?${ownerUserId ? ' AND owner_user_id = ?' : ''}`,
      [tenantKey, jobId, ...(ownerUserId ? [ownerUserId] : [])],
    );
    const existing = existingRows as Array<{ name: string; detail_url: string | null }>;
    const existingDetailUrls = new Set(existing.map((row) => row.detail_url).filter((url): url is string => Boolean(url)));
    const existingNames = new Set(existing.map((row) => row.name.trim().toLocaleLowerCase('en')));
    const exhibitors = await scrapeOfficialExhibitorList(params.fair_url ?? '', {
      halls: params.hall_filters,
      maxPages: params.max_pages,
      maxExhibitors: params.max_exhibitors,
    });
    const detailConcurrency = Math.min(2, Math.max(1, Math.floor(params.detail_concurrency ?? 2)));
    const detailErrors: Array<{ url: string; name: string; error: string }> = [];
    let count = existing.length;

    const matchAndInsert = async (exhibitor: RawExhibitor) => {
      const boothGrid = parseBooth(exhibitor.booth_number ?? exhibitor.hall ?? null);
      const isNeighbor = isNeighborBooth(boothGrid);
      const candidateBlob = [
        exhibitor.description,
        ...(exhibitor.product_groups ?? []),
        ...(exhibitor.brands ?? []),
        ...(exhibitor.target_markets ?? []),
        ...(exhibitor.trade_audience ?? []),
      ].filter(Boolean).join(' ');
      const match = matchesIcp({
        name: exhibitor.name,
        website: exhibitor.website ?? null,
        country: exhibitor.country,
        city: exhibitor.city,
        address: exhibitor.address,
        phone: exhibitor.phone,
        description: candidateBlob,
        fairHall: boothGrid.hall ?? exhibitor.hall,
      }, (icp?.definition ?? {}) as Parameters<typeof matchesIcp>[1]);
      if (icp && !match.matches) return;

      const mailType = classifyMail(exhibitor.email);
      const overlap = computeKeywordOverlap(`${exhibitor.name} ${candidateBlob}`, hostKeywords);
      const finalScore = computeScore(exhibitor.name, exhibitor.country, mailType, overlap.boost);
      const recommendation = recommend({
        name: exhibitor.name,
        email: exhibitor.email,
        website: exhibitor.website,
        countryIso: exhibitor.country,
      }, mailType, finalScore);
      const aiSummary = buildSummary({
        name: exhibitor.name,
        city: exhibitor.city,
        countryIso: exhibitor.country,
        hall: boothGrid.hall ?? exhibitor.hall ?? null,
        booth: exhibitor.booth_number,
        fairName: params.fair_name,
        mailType,
        score: finalScore,
      });

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
          source: 'messefrankfurt_api',
          fair_info: {
            fair_name: params.fair_name ?? null,
            fair_date: params.fair_date ?? null,
            hall: boothGrid.hall ?? exhibitor.hall ?? null,
            booth_number: exhibitor.booth_number ?? null,
            booth_grid: boothGrid,
            is_neighbor: isNeighbor,
            neighbor_anchor_booth: '3.1 D11',
            neighbor_column_distance: isNeighbor && boothGrid.col !== null ? Math.abs(boothGrid.col - 11) : null,
          },
          exhibitor,
          match,
          host_keyword_match: {
            shared: overlap.shared,
            count: overlap.count,
            score_boost: overlap.boost,
          },
          mail_classification: {
            type: mailType,
            classified_at: new Date().toISOString(),
          },
          recommendation,
        },
        aiSummary,
        leadScore: finalScore,
      });
      count += 1;
      existingNames.add(exhibitor.name.trim().toLocaleLowerCase('en'));
      if (exhibitor.detail_url) existingDetailUrls.add(exhibitor.detail_url);
      if (count % 10 === 0) await updateSearchJob(jobId, { resultCount: count });
    };

    await mapWithConcurrency(exhibitors, detailConcurrency, async (listedExhibitor) => {
      const detailUrl = listedExhibitor.detail_url;
      const normalizedName = listedExhibitor.name.trim().toLocaleLowerCase('en');
      if ((detailUrl && existingDetailUrls.has(detailUrl)) || existingNames.has(normalizedName)) return;
      let enriched: RawExhibitor = listedExhibitor;
      if (detailUrl) {
        try {
          const detail = await scrapeExhibitorDetail(detailUrl);
          enriched = {
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
        }
      }
      try {
        await matchAndInsert(enriched);
      } catch (e) {
        detailErrors.push({
          url: enriched.detail_url ?? '',
          name: enriched.name,
          error: `insert_failed: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    });

    if (detailErrors.length) {
      await updateSearchJob(jobId, { errorMsg: JSON.stringify({ detail_errors: detailErrors.slice(0, 20), detail_error_count: detailErrors.length }) });
    }
    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
