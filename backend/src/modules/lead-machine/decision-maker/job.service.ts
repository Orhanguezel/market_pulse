import { getSearchJob, updateSearchJob, type LeadSearchJob } from '../_shared/db';
import { runDecisionMakerFinder, type FinderParams } from './finder.service';
import { saveCompanyPool, saveDecisionMakers } from './persist.service';

type DecisionMakerJobParams = Partial<FinderParams> & {
  sector?: string;
};

function normalizeParams(params: unknown): DecisionMakerJobParams {
  return params && typeof params === 'object' ? params as DecisionMakerJobParams : {};
}

export async function runDecisionMakerJob(jobId: string) {
  const job = await getSearchJob(jobId);
  if (!job) throw new Error('JOB_NOT_FOUND');
  const params = normalizeParams(job.params);
  await updateSearchJob(jobId, { status: 'running', started: true, errorMsg: null });
  try {
    if (!Array.isArray(params.cities) || params.cities.length === 0) {
      throw new Error('cities_required');
    }
    const result = await runDecisionMakerFinder({
      sector: params.sector,
      businessTypes: params.businessTypes,
      cities: params.cities.slice(0, 20),
      country: params.country,
      titles: params.titles,
      excludeKeywords: params.excludeKeywords,
      apolloFallback: params.apolloFallback,
      perCityLimit: params.perCityLimit,
      targetCount: params.targetCount,
    });
    await saveCompanyPool(result.companyPool, params.sector, jobId);
    await saveDecisionMakers(result.rows, params.sector, jobId);
    await updateSearchJob(jobId, { status: 'done', resultCount: result.rows.length, finished: true });
    return { job_id: jobId, ...result };
  } catch (error) {
    await updateSearchJob(jobId, {
      status: 'failed',
      errorMsg: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      finished: true,
    });
    throw error;
  }
}

export function isDecisionMakerJob(job: LeadSearchJob | null) {
  return job?.channel === 'decision_maker';
}
