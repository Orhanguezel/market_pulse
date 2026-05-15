// src/modules/_shared/time.ts

export type RangeKey = '7d' | '30d' | '90d';
export type TrendBucket = 'day' | 'week';

function addDaysUtc(d: Date, days: number) {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export function toYmdUtc(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function parseRange(raw: unknown): RangeKey {
  const r = String(raw ?? '').trim();
  if (r === '7d' || r === '30d' || r === '90d') return r;
  return '30d';
}

export function computeWindow(range: RangeKey) {
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const from = addDaysUtc(now, -days);
  const toExclusive = addDaysUtc(now, 1);
  const bucket: TrendBucket = range === '90d' ? 'week' : 'day';
  return {
    fromYmd: toYmdUtc(from),
    toYmdExclusive: toYmdUtc(toExclusive),
    bucket,
  };
}
