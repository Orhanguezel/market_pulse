import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

export type PlanCode = 'free' | 'starter' | 'pro' | 'agency';

const PLAN_DAILY_LIMITS: Record<PlanCode, number> = {
  free:    5,
  starter: 30,
  pro:     -1, // unlimited
  agency:  -1, // unlimited
};

export async function getUserPlan(userId: string): Promise<PlanCode> {
  const [rows] = await pool.execute(
    `SELECT plan_code FROM user_plans WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  const row = (rows as { plan_code: PlanCode }[])[0];
  return row?.plan_code ?? 'free';
}

export async function ensureUserPlan(userId: string): Promise<PlanCode> {
  const plan = await getUserPlan(userId);
  if (!plan) {
    await pool.execute(
      `INSERT INTO user_plans (id, user_id, plan_code) VALUES (?, ?, 'free')`,
      [randomUUID(), userId],
    );
    return 'free';
  }
  return plan;
}

export async function getTodayScanCount(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await pool.execute(
    `SELECT scan_count FROM user_scan_usage WHERE user_id = ? AND scan_date = ? LIMIT 1`,
    [userId, today],
  );
  const row = (rows as { scan_count: number }[])[0];
  return row?.scan_count ?? 0;
}

export async function incrementScanCount(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await pool.execute(
    `INSERT INTO user_scan_usage (id, user_id, scan_date, scan_count)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE scan_count = scan_count + 1`,
    [randomUUID(), userId, today],
  );
}

export interface QuotaStatus {
  plan: PlanCode;
  daily_limit: number;
  used_today: number;
  remaining: number;
  unlimited: boolean;
}

export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const plan = await ensureUserPlan(userId);
  const limit = PLAN_DAILY_LIMITS[plan];
  const used = await getTodayScanCount(userId);
  const unlimited = limit === -1;
  return {
    plan,
    daily_limit: limit,
    used_today: used,
    remaining: unlimited ? 9999 : Math.max(0, limit - used),
    unlimited,
  };
}

export async function checkAndConsumeQuota(userId: string): Promise<{ allowed: boolean; quota: QuotaStatus }> {
  const quota = await getQuotaStatus(userId);
  if (!quota.unlimited && quota.used_today >= quota.daily_limit) {
    return { allowed: false, quota };
  }
  await incrementScanCount(userId);
  return { allowed: true, quota: { ...quota, used_today: quota.used_today + 1, remaining: Math.max(0, quota.remaining - 1) } };
}
