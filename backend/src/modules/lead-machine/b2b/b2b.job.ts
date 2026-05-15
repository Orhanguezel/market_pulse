import { getIcpProfile } from '../icp/icp.repository';
import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { getRulesForJob } from '../scan-rules.service';
import { searchDirectory } from './directory.scraper';
import { matchesIcp } from './icp.matcher';
import { analyzeCompanyWebsite } from './website.analyzer';

interface B2bJobParams {
  icp_id?: string;
  source?: string;
  search_query?: string;
  country?: string;
  limit?: number;
}

export async function runB2bJob(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = job.params as B2bJobParams;
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    const icp = params.icp_id ? await getIcpProfile(params.icp_id) : null;
    const leads = await searchDirectory(params.source ?? 'google_maps', icp, params);
    const icpDefinition = (icp?.definition ?? {}) as Record<string, unknown>;
    // Load scan rules for this ICP+channel to apply score penalty
    const rules = await getRulesForJob(icp?.id ?? null, 'b2b_directory');
    const rulePenalty = rules.length;
    let count = 0;
    for (const lead of leads) {
      if (!lead.name) continue;
      const match = matchesIcp({ ...lead, country: params.country }, icpDefinition);
      if (!match.matches) continue;
      const analysis = lead.website ? await analyzeCompanyWebsite(lead.website) : null;
      const baseScore = analysis?.is_b2b ? Math.min(10, match.score + 2) : match.score;
      // Each active scan rule lowers the bar — candidates must score higher to pass
      const adjustedScore = Math.max(0, baseScore - rulePenalty);
      if (adjustedScore < 3) continue; // filtered out by learning feedback
      await insertCandidate({
        jobId,
        channel: 'b2b_directory',
        icpId: icp?.id ?? null,
        name: lead.name!,
        website: lead.website ?? null,
        country: params.country ?? null,
        phone: lead.phone ?? null,
        rawData: { directory_source: params.source ?? 'google_maps', lead, match, analysis },
        aiSummary: analysis?.summary ?? match.reasons.join(', '),
        leadScore: adjustedScore,
      });
      count += 1;
    }
    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
