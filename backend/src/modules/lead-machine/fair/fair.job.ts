import { getIcpProfile } from '../icp/icp.repository';
import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { matchesIcp } from '../b2b/icp.matcher';
import { scrapeOfficialExhibitorList } from './fair.scraper';

interface FairJobParams {
  fair_name?: string;
  fair_url?: string;
  fair_date?: string;
  icp_id?: string;
}

export async function runFairJob(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as FairJobParams;
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    const icp = params.icp_id ? await getIcpProfile(params.icp_id) : null;
    const exhibitors = await scrapeOfficialExhibitorList(params.fair_url ?? '');
    let count = 0;
    for (const exhibitor of exhibitors) {
      const match = matchesIcp({ name: exhibitor.name, website: exhibitor.website ?? null, country: exhibitor.country, description: exhibitor.description }, (icp?.definition ?? {}) as Record<string, unknown>);
      if (icp && !match.matches) continue;
      await insertCandidate({
        jobId,
        channel: 'trade_fair',
        icpId: icp?.id ?? null,
        name: exhibitor.name,
        website: exhibitor.website ?? null,
        country: exhibitor.country ?? null,
        rawData: { fair_info: { fair_name: params.fair_name ?? null, fair_date: params.fair_date ?? null, booth_number: exhibitor.booth_number ?? null }, exhibitor, match },
        aiSummary: exhibitor.description ?? null,
        leadScore: match.score,
      });
      count += 1;
    }
    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
