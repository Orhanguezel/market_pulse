export interface GenericFairRunnerInput {
  fair_url: string;
  icp_id: string;
  fair_name?: string;
  fair_date?: string;
  hall_filters?: string[];
  max_pages?: number;
  max_exhibitors?: number;
  detail_concurrency?: number;
}

function cleanString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cleanStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
    : undefined;
}

function cleanPositiveInt(value: unknown, fallback: number, max: number) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(number, max);
}

function inferFairName(fairUrl: string) {
  try {
    const host = new URL(fairUrl).hostname.replace(/^www\./, '');
    return host.split('.')[0]?.replace(/[-_]+/g, ' ') || 'Trade fair';
  } catch {
    return 'Trade fair';
  }
}

export function buildGenericFairRunnerParams(input: Record<string, unknown>): GenericFairRunnerInput {
  const fairUrl = cleanString(input.fair_url ?? input.url);
  const icpId = cleanString(input.icp_id);
  if (!fairUrl) throw new Error('FAIR_URL_REQUIRED');
  if (!icpId) throw new Error('ICP_ID_REQUIRED');

  return {
    fair_url: fairUrl,
    icp_id: icpId,
    fair_name: cleanString(input.fair_name) ?? inferFairName(fairUrl),
    fair_date: cleanString(input.fair_date) ?? undefined,
    hall_filters: cleanStringArray(input.hall_filters ?? input.halls),
    max_pages: cleanPositiveInt(input.max_pages, 120, 500),
    max_exhibitors: cleanPositiveInt(input.max_exhibitors, 2500, 10000),
    detail_concurrency: cleanPositiveInt(input.detail_concurrency, 5, 5),
  };
}
