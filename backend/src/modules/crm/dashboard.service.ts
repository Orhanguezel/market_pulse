import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

interface CountRow {
  cnt: number | string | null;
}

interface SalesSummaryRow {
  month: string | null;
  amount: number | string | null;
}

interface ActivityDoneRow {
  done: number | string | boolean | null;
  count: number | string | null;
}

type SqlValue = string | number | boolean | Date | null;

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readCount(sql: string, values: SqlValue[]): Promise<number> {
  const [rows] = await pool.execute(sql, values);
  return toNumber((rows as CountRow[])[0]?.cnt);
}

export async function getDashboardSummary(ownerUserId?: string | null) {
  const tenantKey = getActiveTenantKey();
  // Kisi-bazli izolasyon: owner_user_id kolonu olan tablolarda kullanici yolunda
  // owner filtresi uygulanir. crm_quotes/crm_orders'ta owner kolonu YOK (035 semasi),
  // bu iki sayac tenant-geneli kalir (owner kolonlari ayri sema degisikligiyle gelecek).
  const ownerAnd = ownerUserId ? ' AND owner_user_id = ?' : '';
  const ownerVal: SqlValue[] = ownerUserId ? [ownerUserId] : [];
  const scoped = (base: string, ...extra: SqlValue[]): [string, SqlValue[]] => [
    base + ownerAnd,
    [tenantKey, ...extra, ...ownerVal],
  ];

  const [
    accounts,
    contacts,
    dealsOpen,
    dealsWon,
    activitiesPending,
    leads,
    quotes,
    orders,
    remindersScheduled,
  ] = await Promise.all([
    readCount(...scoped('SELECT COUNT(*) AS cnt FROM crm_accounts WHERE tenant_key = ?')),
    readCount(...scoped('SELECT COUNT(*) AS cnt FROM crm_contacts WHERE tenant_key = ?')),
    readCount(...scoped("SELECT COUNT(*) AS cnt FROM crm_deals WHERE tenant_key = ? AND status = 'open'")),
    readCount(...scoped("SELECT COUNT(*) AS cnt FROM crm_deals WHERE tenant_key = ? AND status = 'won'")),
    readCount(...scoped('SELECT COUNT(*) AS cnt FROM crm_activities WHERE tenant_key = ? AND done = 0')),
    readCount(...scoped('SELECT COUNT(*) AS cnt FROM lead_candidates WHERE tenant_key = ?')),
    // crm_quotes/crm_orders: owner kolonu yok → tenant-geneli
    readCount("SELECT COUNT(*) AS cnt FROM crm_quotes WHERE tenant_key = ? AND status IN ('draft', 'sent')", [tenantKey]),
    readCount("SELECT COUNT(*) AS cnt FROM crm_orders WHERE tenant_key = ? AND status <> 'cancelled'", [tenantKey]),
    readCount(...scoped("SELECT COUNT(*) AS cnt FROM crm_reminders WHERE tenant_key = ? AND status = 'scheduled'")),
  ]);

  const [salesRows] = await pool.execute(
    `SELECT DATE_FORMAT(COALESCE(expected_close_date, created_at), '%Y-%m') AS month,
            COALESCE(SUM(amount), 0) AS amount
       FROM crm_deals
      WHERE tenant_key = ?
        AND status = 'won'
        AND COALESCE(expected_close_date, DATE(created_at)) >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)${ownerAnd}
      GROUP BY month
      ORDER BY month ASC`,
    [tenantKey, ...ownerVal],
  );

  const [activityRows] = await pool.execute(
    `SELECT done, COUNT(*) AS count
       FROM crm_activities
      WHERE tenant_key = ?${ownerAnd}
      GROUP BY done`,
    [tenantKey, ...ownerVal],
  );

  const teamCounts = (activityRows as ActivityDoneRow[]).reduce(
    (acc, row) => {
      const key = toNumber(row.done) === 1 ? 'done' : 'pending';
      acc[key] += toNumber(row.count);
      return acc;
    },
    { pending: 0, done: 0 },
  );

  const counts = {
    accounts,
    contacts,
    deals_open: dealsOpen,
    deals_won: dealsWon,
    activities_pending: activitiesPending,
    quotes,
    orders,
    leads,
    reminders_scheduled: remindersScheduled,
  };

  return {
    counts,
    pending: {
      quotes,
      open_deals: dealsOpen,
    },
    sales_summary: (salesRows as SalesSummaryRow[])
      .filter((row) => row.month)
      .map((row) => ({ month: row.month as string, amount: toNumber(row.amount) })),
    status_breakdown: [
      { label: 'Müşteri', count: accounts },
      { label: 'Kontak', count: contacts },
      { label: 'Açık Fırsat', count: dealsOpen },
      { label: 'Bekleyen Aktivite', count: activitiesPending },
      { label: 'Planlı Hatırlatma', count: remindersScheduled },
    ],
    team_breakdown: [
      { label: 'Açık Aktivite', count: teamCounts.pending },
      { label: 'Tamamlanan Aktivite', count: teamCounts.done },
    ],
    totals: {
      records: accounts + contacts + dealsOpen + dealsWon + activitiesPending + leads + quotes + orders + remindersScheduled,
    },
  };
}
