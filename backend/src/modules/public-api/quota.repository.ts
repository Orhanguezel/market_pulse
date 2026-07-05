import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

export type PlanCode = 'free' | 'starter' | 'pro' | 'agency';

const PLAN_DAILY_LIMITS: Record<PlanCode, number> = {
  free:    5,
  starter: 30,
  pro:     -1, // unlimited
  agency:  -1, // unlimited
};

export type DailyUsageType = 'lead_job' | 'email_send' | 'bulk_email_send' | 'weekly_report_send';

const PLAN_DAILY_USAGE_LIMITS: Record<PlanCode, Record<DailyUsageType, number>> = {
  free: {
    lead_job: 5,
    email_send: 10,
    bulk_email_send: 1,
    weekly_report_send: 2,
  },
  starter: {
    lead_job: 30,
    email_send: 100,
    bulk_email_send: 10,
    weekly_report_send: 10,
  },
  pro: {
    lead_job: -1,
    email_send: 500,
    bulk_email_send: 50,
    weekly_report_send: 30,
  },
  agency: {
    lead_job: -1,
    email_send: -1,
    bulk_email_send: -1,
    weekly_report_send: -1,
  },
};

export async function getUserPlan(userId: string): Promise<PlanCode> {
  const tenantKey = await getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT plan_code FROM user_plans WHERE tenant_key = ? AND user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`,
    [tenantKey, userId],
  );
  const row = (rows as { plan_code: PlanCode }[])[0];
  return row?.plan_code ?? 'free';
}

export async function ensureUserPlan(userId: string): Promise<PlanCode> {
  const plan = await getUserPlan(userId);
  if (!plan) {
    const tenantKey = await getActiveTenantKey();
    await pool.execute(
      `INSERT INTO user_plans (id, tenant_key, user_id, plan_code) VALUES (?, ?, ?, 'free')`,
      [randomUUID(), tenantKey, userId],
    );
    return 'free';
  }
  return plan;
}

export async function getTodayScanCount(userId: string): Promise<number> {
  const tenantKey = await getActiveTenantKey();
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await pool.execute(
    `SELECT scan_count FROM user_scan_usage WHERE tenant_key = ? AND user_id = ? AND scan_date = ? LIMIT 1`,
    [tenantKey, userId, today],
  );
  const row = (rows as { scan_count: number }[])[0];
  return row?.scan_count ?? 0;
}

export async function incrementScanCount(userId: string): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  const today = new Date().toISOString().slice(0, 10);
  await pool.execute(
    `INSERT INTO user_scan_usage (id, tenant_key, user_id, scan_date, scan_count)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE scan_count = scan_count + 1`,
    [randomUUID(), tenantKey, userId, today],
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

export async function getTodayDailyUsageCount(userId: string, usageType: DailyUsageType): Promise<number> {
  const tenantKey = await getActiveTenantKey();
  const today = new Date().toISOString().slice(0, 10);
  const [rows] = await pool.execute(
    `SELECT usage_count FROM user_daily_usage
     WHERE tenant_key = ? AND user_id = ? AND usage_type = ? AND usage_date = ? LIMIT 1`,
    [tenantKey, userId, usageType, today],
  );
  const row = (rows as { usage_count: number }[])[0];
  return row?.usage_count ?? 0;
}

export async function incrementDailyUsage(userId: string, usageType: DailyUsageType, amount = 1): Promise<void> {
  const tenantKey = await getActiveTenantKey();
  const today = new Date().toISOString().slice(0, 10);
  await pool.execute(
    `INSERT INTO user_daily_usage (id, tenant_key, user_id, usage_type, usage_date, usage_count)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE usage_count = usage_count + VALUES(usage_count)`,
    [randomUUID(), tenantKey, userId, usageType, today, amount],
  );
}

export async function getDailyUsageStatus(userId: string, usageType: DailyUsageType): Promise<QuotaStatus> {
  const plan = await ensureUserPlan(userId);
  const limit = PLAN_DAILY_USAGE_LIMITS[plan][usageType];
  const used = await getTodayDailyUsageCount(userId, usageType);
  const unlimited = limit === -1;
  return {
    plan,
    daily_limit: limit,
    used_today: used,
    remaining: unlimited ? 9999 : Math.max(0, limit - used),
    unlimited,
  };
}

export async function checkAndConsumeDailyUsage(
  userId: string,
  usageType: DailyUsageType,
  amount = 1,
): Promise<{ allowed: boolean; quota: QuotaStatus; usage_type: DailyUsageType }> {
  const quota = await getDailyUsageStatus(userId, usageType);
  if (!quota.unlimited && quota.used_today + amount > quota.daily_limit) {
    return { allowed: false, quota, usage_type: usageType };
  }
  await incrementDailyUsage(userId, usageType, amount);
  return {
    allowed: true,
    usage_type: usageType,
    quota: {
      ...quota,
      used_today: quota.used_today + amount,
      remaining: quota.unlimited ? 9999 : Math.max(0, quota.remaining - amount),
    },
  };
}
