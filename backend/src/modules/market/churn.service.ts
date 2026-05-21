import type { RowDataPacket } from 'mysql2/promise';
import { pool } from '@/db/client';
import { getCustomerOrders } from './external/paspas.repository';

type TargetRow = RowDataPacket & {
  id: string;
  last_seen_at: string | Date | null;
};

type SignalCountRow = RowDataPacket & {
  severity: string;
  count: number;
};

function daysSince(value: string | Date | null): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  return Math.floor((Date.now() - time) / 86_400_000);
}

async function getSignalScore(targetId: string) {
  const [rows] = await pool.query<SignalCountRow[]>(
    `SELECT severity, COUNT(*) AS count
     FROM market_signals
     WHERE target_id = ? AND is_reviewed = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
     GROUP BY severity`,
    [targetId],
  );

  let score = 0;
  for (const row of rows) {
    const count = Number(row.count || 0);
    if (row.severity === 'critical') score += count * 20;
    else if (row.severity === 'high') score += count * 10;
    else if (row.severity === 'medium') score += count * 5;
  }
  return score;
}

async function getPaspasOrderScore(targetId: string) {
  try {
    const orders = await getCustomerOrders(targetId);
    if (!orders.length) return 15;

    const now = Date.now();
    const last90 = orders.filter((order) => now - new Date(order.siparisTarihi).getTime() <= 90 * 86_400_000);
    if (!last90.length) return 15;

    const previous90 = orders.filter((order) => {
      const age = now - new Date(order.siparisTarihi).getTime();
      return age > 90 * 86_400_000 && age <= 180 * 86_400_000;
    });

    if (previous90.length >= 2 && last90.length < previous90.length / 2) return 10;
    return 0;
  } catch {
    return 0;
  }
}

export interface ChurnBreakdown {
  total: number;
  signal_score: number;
  age_score: number;
  age_days: number | null;
  paspas_score: number;
}

export async function computeChurnBreakdown(targetId: string): Promise<ChurnBreakdown> {
  const [targets] = await pool.query<TargetRow[]>(
    'SELECT id, last_seen_at FROM market_targets WHERE id = ? LIMIT 1',
    [targetId],
  );
  const target = targets[0];
  if (!target) {
    const err = new Error('target_not_found');
    Object.assign(err, { statusCode: 404 });
    throw err;
  }
  const signalScore = await getSignalScore(target.id);
  const age = daysSince(target.last_seen_at);
  let ageScore = 0;
  if (age === null) ageScore = 15;
  else if (age >= 90) ageScore = 30;
  else if (age >= 60) ageScore = 20;
  else if (age >= 30) ageScore = 10;
  const paspasScore = await getPaspasOrderScore(target.id);
  const total = Math.min(100, Math.max(0, signalScore + ageScore + paspasScore));
  return { total, signal_score: signalScore, age_score: ageScore, age_days: age, paspas_score: paspasScore };
}

export async function recalculateChurnScore(targetId: string): Promise<number> {
  const breakdown = await computeChurnBreakdown(targetId);
  await pool.query(
    'UPDATE market_targets SET churn_risk_score = ?, updated_at = NOW() WHERE id = ?',
    [breakdown.total, targetId],
  );
  return breakdown.total;
}

export async function recalculateAllChurnScores(): Promise<void> {
  const [targets] = await pool.query<TargetRow[]>(
    "SELECT id, last_seen_at FROM market_targets WHERE status IN ('active', 'paused')",
  );
  for (const target of targets) {
    await recalculateChurnScore(target.id);
  }
}
