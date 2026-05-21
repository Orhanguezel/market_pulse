import { getIcpProfile } from '../icp/icp.repository';
import { insertCandidate, updateSearchJob, getSearchJob } from '../_shared/db';
import { getRulesForJob } from '../scan-rules.service';
import { searchDirectory } from './directory.scraper';
import { matchesIcp } from './icp.matcher';
import { analyzeCompanyWebsite } from './website.analyzer';
import {
  buildSummary,
  classifyMail,
  computeKeywordOverlap,
  computeScore,
  recommend,
} from '../fair/enrichment';

function extractHostKeywords(definition: unknown): string[] {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) return [];
  const def = definition as Record<string, unknown>;
  const out: string[] = [];
  const direct = def.keywords;
  if (Array.isArray(direct)) {
    for (const k of direct) if (typeof k === 'string' && k.trim()) out.push(k);
  }
  const fair = def.fair;
  if (fair && typeof fair === 'object' && !Array.isArray(fair)) {
    const host = (fair as Record<string, unknown>).host_exhibitor;
    if (host && typeof host === 'object' && !Array.isArray(host)) {
      const snap = (host as Record<string, unknown>).messe_snapshot;
      if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
        const kws = (snap as Record<string, unknown>).keywords;
        if (Array.isArray(kws)) {
          for (const k of kws) if (typeof k === 'string' && k.trim()) out.push(k);
        }
      }
    }
  }
  const seen = new Set<string>();
  const dedup: string[] = [];
  for (const k of out) {
    const norm = k.toLowerCase().trim();
    if (norm && !seen.has(norm)) { seen.add(norm); dedup.push(k); }
  }
  return dedup;
}

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
    const hostKeywords = extractHostKeywords(icp?.definition);
    const leads = await searchDirectory(params.source ?? 'google_maps', icp, params);
    const icpDefinition = (icp?.definition ?? {}) as Record<string, unknown>;
    // Load scan rules for this ICP+channel to apply score penalty
    const rules = await getRulesForJob(icp?.id ?? null, 'b2b_directory');
    const rulePenalty = rules.length;
    let count = 0;
    // For directory searches, the query keyword is itself the category
    // filter — Europages's /companies/car%20floor%20mats.html only lists
    // floor-mat companies. Skip the matches=false gate in that case.
    const trustQuery = params.source === 'europages' || params.source === 'tobb';
    for (const lead of leads) {
      if (!lead.name) continue;
      const match = matchesIcp({ ...lead, country: params.country }, icpDefinition);
      if (!match.matches && !trustQuery) continue;
      const analysis = lead.website ? await analyzeCompanyWebsite(lead.website) : null;
      const directoryFloor = trustQuery ? 5 : 0;
      const icpScore = analysis?.is_b2b
        ? Math.min(10, Math.max(match.score, directoryFloor) + 2)
        : Math.max(match.score, directoryFloor);
      const icpScoreAfterRules = Math.max(0, icpScore - rulePenalty);
      if (icpScoreAfterRules < 3) continue;

      // Same enrichment pipeline as the fair channel: mail classification,
      // host-keyword overlap, recommendation engine, Turkish summary.
      // For b2b leads, the candidate text blob is built from the analyzer
      // output (sells, firm_type, summary) since we usually don't have
      // an exhibitor description.
      const leadEmail = (lead as { email?: string | null }).email ?? null;
      const mailType = classifyMail(leadEmail);
      const candidateBlob = [
        lead.name,
        analysis?.summary ?? null,
        ...(analysis?.sells ?? []),
        analysis?.firm_type ?? null,
      ].filter((s): s is string => typeof s === 'string' && s.length > 0).join(' ');
      const overlap = computeKeywordOverlap(candidateBlob, hostKeywords);
      const enrichedScore = computeScore(lead.name!, params.country ?? null, mailType, overlap.boost);
      // Final score: take the higher of the ICP-derived score and the
      // mail+keyword score so neither path is wasted. Both are 0-10.
      const finalScore = Math.max(icpScoreAfterRules, enrichedScore);
      const recommendation = recommend({
        name: lead.name!,
        email: leadEmail,
        website: lead.website ?? null,
        countryIso: params.country ?? null,
      }, mailType, finalScore);
      const trSummary = buildSummary({
        name: lead.name!,
        city: null,
        countryIso: params.country ?? null,
        hall: null,
        booth: null,
        fairName: 'B2B Dizin',
        mailType,
        score: finalScore,
      });

      await insertCandidate({
        jobId,
        channel: 'b2b_directory',
        icpId: icp?.id ?? null,
        name: lead.name!,
        website: lead.website ?? null,
        country: params.country ?? null,
        phone: lead.phone ?? null,
        email: leadEmail,
        rawData: {
          directory_source: params.source ?? 'google_maps',
          lead,
          match,
          analysis,
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
        aiSummary: analysis?.summary || trSummary,
        leadScore: finalScore,
      });
      count += 1;
    }
    await updateSearchJob(jobId, { status: 'done', resultCount: count, finished: true });
  } catch (e) {
    await updateSearchJob(jobId, { status: 'failed', errorMsg: e instanceof Error ? e.message : 'UNKNOWN_ERROR', finished: true });
  }
}
