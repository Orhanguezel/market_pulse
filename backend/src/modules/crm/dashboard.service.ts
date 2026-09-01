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
  // Kisi-bazli izolasyon: tum is-kaydi tablolari (accounts/contacts/deals/activities/
  // quotes/orders/reminders/lead_candidates) owner_user_id tasir; kullanici yolunda
  // owner filtresi uygulanir. quotes/orders'a owner kolonu 035 semasi + migrate ile eklendi.
  const ownerAnd = ownerUserId ? ' AND owner_user_id = ?' : '';
  const ownerVal: SqlValue[] = ownerUserId ? [ownerUserId] : [];
  const ownerFor = (alias: string) => ownerUserId ? ` AND ${alias}.owner_user_id = ?` : '';
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
    readCount(...scoped("SELECT COUNT(*) AS cnt FROM crm_quotes WHERE tenant_key = ? AND status IN ('draft', 'sent')")),
    readCount(...scoped("SELECT COUNT(*) AS cnt FROM crm_orders WHERE tenant_key = ? AND status <> 'cancelled'")),
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

  const [upcomingActivities] = await pool.execute(
    `SELECT a.id, a.subject, a.type, a.ref_type, a.ref_id, a.due_at,
            CASE a.ref_type
              WHEN 'account' THEN acc.name
              WHEN 'deal' THEN deal.title
              WHEN 'contact' THEN TRIM(CONCAT(COALESCE(contact.first_name, ''), ' ', COALESCE(contact.last_name, '')))
            END AS related_name
       FROM crm_activities a
       LEFT JOIN crm_accounts acc ON a.ref_type = 'account' AND acc.id = a.ref_id AND acc.tenant_key = a.tenant_key
       LEFT JOIN crm_deals deal ON a.ref_type = 'deal' AND deal.id = a.ref_id AND deal.tenant_key = a.tenant_key
       LEFT JOIN crm_contacts contact ON a.ref_type = 'contact' AND contact.id = a.ref_id AND contact.tenant_key = a.tenant_key
      WHERE a.tenant_key = ? AND a.done = 0${ownerFor('a')}
      ORDER BY a.due_at IS NULL, a.due_at ASC, a.created_at DESC
      LIMIT 8`,
    [tenantKey, ...ownerVal],
  );

  const [recentQuotes] = await pool.execute(
    `SELECT q.id, q.quote_no, q.title, q.amount, q.currency, q.status, q.created_at,
            a.name AS account_name
       FROM crm_quotes q
       LEFT JOIN crm_accounts a ON a.id = q.account_id AND a.tenant_key = q.tenant_key
      WHERE q.tenant_key = ?${ownerFor('q')}
      ORDER BY q.created_at DESC LIMIT 5`,
    [tenantKey, ...ownerVal],
  );

  const [recentDeals] = await pool.execute(
    `SELECT d.id, d.title, d.amount, d.currency, d.status, d.created_at,
            a.name AS account_name, s.name AS stage_name
       FROM crm_deals d
       LEFT JOIN crm_accounts a ON a.id = d.account_id AND a.tenant_key = d.tenant_key
       LEFT JOIN crm_stages s ON s.id = d.stage_id AND s.tenant_key = d.tenant_key
      WHERE d.tenant_key = ?${ownerFor('d')}
      ORDER BY d.created_at DESC LIMIT 5`,
    [tenantKey, ...ownerVal],
  );

  const [recentAccounts] = await pool.execute(
    `SELECT a.id, a.name, a.country, a.city, a.status, a.created_at
       FROM crm_accounts a
      WHERE a.tenant_key = ?${ownerFor('a')}
      ORDER BY a.created_at DESC LIMIT 5`,
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
    upcoming_activities: upcomingActivities,
    recent_quotes: recentQuotes,
    recent_deals: recentDeals,
    recent_accounts: recentAccounts,
  };
}
