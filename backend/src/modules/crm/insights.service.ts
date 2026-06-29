import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';

interface CountRow {
  cnt: number | string | null;
}

interface TenantProfileRow {
  tenant_key: string;
  name: string | null;
  locale: string | null;
  status: string | null;
  plan: string | null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readCount(sql: string, tenantKey: string): Promise<number> {
  const [rows] = await pool.execute(sql, [tenantKey]);
  return toNumber((rows as CountRow[])[0]?.cnt);
}

export async function getMailSummary() {
  const tenantKey = getActiveTenantKey();
  const [
    campaignsActive,
    draftsTotal,
    draftsReady,
    sent,
    opened,
    replied,
    recipientLists,
    recipientsPending,
  ] = await Promise.all([
    readCount('SELECT COUNT(*) AS cnt FROM outreach_campaigns WHERE tenant_key = ? AND is_active = 1', tenantKey),
    readCount('SELECT COUNT(*) AS cnt FROM lead_outreach_drafts WHERE tenant_key = ?', tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM lead_outreach_drafts WHERE tenant_key = ? AND status = 'draft'", tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM lead_outreach_drafts WHERE tenant_key = ? AND status = 'sent'", tenantKey),
    readCount('SELECT COUNT(*) AS cnt FROM lead_outreach_drafts WHERE tenant_key = ? AND (opened_at IS NOT NULL OR open_count > 0)', tenantKey),
    readCount('SELECT COUNT(*) AS cnt FROM lead_outreach_drafts WHERE tenant_key = ? AND (replied_at IS NOT NULL OR reply_status IS NOT NULL)', tenantKey),
    readCount('SELECT COUNT(*) AS cnt FROM outreach_recipient_lists WHERE tenant_key = ?', tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM outreach_recipients WHERE tenant_key = ? AND status IN ('pending', 'drafted')", tenantKey),
  ]);

  return {
    campaigns_active: campaignsActive,
    drafts_total: draftsTotal,
    drafts_ready: draftsReady,
    sent,
    opened,
    replied,
    recipient_lists: recipientLists,
    recipients_pending: recipientsPending,
    links: {
      drafts: '/lead-machine/outreach/drafts',
      campaigns: '/lead-machine/outreach/campaigns',
      lists: '/lead-machine/outreach/lists',
    },
  };
}

export async function getReportsSummary() {
  const tenantKey = getActiveTenantKey();
  const [
    targetsTotal,
    activeLeads,
    pendingSignals,
    highRiskTargets,
    weeklyHighSignals,
    marketTestRuns,
  ] = await Promise.all([
    readCount('SELECT COUNT(*) AS cnt FROM market_targets WHERE tenant_key = ?', tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM market_leads WHERE tenant_key = ? AND status NOT IN ('converted', 'rejected')", tenantKey),
    readCount('SELECT COUNT(*) AS cnt FROM market_signals WHERE tenant_key = ? AND is_reviewed = 0', tenantKey),
    readCount('SELECT COUNT(*) AS cnt FROM market_targets WHERE tenant_key = ? AND churn_risk_score >= 60', tenantKey),
    readCount(
      `SELECT COUNT(*) AS cnt
         FROM market_signals
        WHERE tenant_key = ?
          AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND severity IN ('critical', 'high')`,
      tenantKey,
    ),
    readCount('SELECT COUNT(*) AS cnt FROM market_test_runs WHERE tenant_key = ?', tenantKey),
  ]);

  return {
    weekly_report: {
      preview_url: '/market/reports/weekly/preview',
      send_url: '/market/reports/weekly/send',
      available: true,
    },
    counts: {
      targets_total: targetsTotal,
      active_leads: activeLeads,
      pending_signals: pendingSignals,
      high_risk_targets: highRiskTargets,
      weekly_high_signals: weeklyHighSignals,
      market_test_runs: marketTestRuns,
    },
  };
}

export async function getUsersSummary() {
  const tenantKey = getActiveTenantKey();
  const [
    usersTotal,
    activeUsers,
    inactiveUsers,
    tenantAdmins,
    tenantEditors,
    verifiedUsers,
  ] = await Promise.all([
    readCount(
      `SELECT COUNT(*) AS cnt
         FROM tenant_user_roles tur
         JOIN users u ON u.id = tur.user_id
        WHERE tur.tenant_key = ?`,
      tenantKey,
    ),
    readCount(
      `SELECT COUNT(*) AS cnt
         FROM tenant_user_roles tur
         JOIN users u ON u.id = tur.user_id
        WHERE tur.tenant_key = ? AND u.is_active = 1`,
      tenantKey,
    ),
    readCount(
      `SELECT COUNT(*) AS cnt
         FROM tenant_user_roles tur
         JOIN users u ON u.id = tur.user_id
        WHERE tur.tenant_key = ? AND u.is_active = 0`,
      tenantKey,
    ),
    readCount("SELECT COUNT(*) AS cnt FROM tenant_user_roles WHERE tenant_key = ? AND role = 'tenant_admin'", tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM tenant_user_roles WHERE tenant_key = ? AND role = 'tenant_editor'", tenantKey),
    readCount(
      `SELECT COUNT(*) AS cnt
         FROM tenant_user_roles tur
         JOIN users u ON u.id = tur.user_id
        WHERE tur.tenant_key = ? AND u.email_verified = 1`,
      tenantKey,
    ),
  ]);

  return {
    tenant_key: tenantKey,
    users_total: usersTotal,
    active_users: activeUsers,
    inactive_users: inactiveUsers,
    tenant_admins: tenantAdmins,
    tenant_editors: tenantEditors,
    verified_users: verifiedUsers,
    links: {
      users: '/users',
    },
  };
}

export async function getBusinessSummary() {
  const tenantKey = getActiveTenantKey();
  const [tenantRows] = await pool.execute(
    'SELECT tenant_key, name, locale, status, plan FROM tenants WHERE tenant_key = ? LIMIT 1',
    [tenantKey],
  );
  const tenant = (tenantRows as TenantProfileRow[])[0] ?? {
    tenant_key: tenantKey,
    name: null,
    locale: null,
    status: null,
    plan: null,
  };

  const [
    tenantSettings,
    activeModules,
    suspendedModules,
  ] = await Promise.all([
    readCount('SELECT COUNT(*) AS cnt FROM tenant_settings WHERE tenant_key = ?', tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM tenant_modules WHERE tenant_key = ? AND status IN ('trial', 'active') AND (expires_at IS NULL OR expires_at > NOW())", tenantKey),
    readCount("SELECT COUNT(*) AS cnt FROM tenant_modules WHERE tenant_key = ? AND status = 'suspended'", tenantKey),
  ]);

  return {
    tenant: {
      tenant_key: tenant.tenant_key,
      name: tenant.name,
      locale: tenant.locale,
      status: tenant.status,
      plan: tenant.plan,
    },
    counts: {
      tenant_settings: tenantSettings,
      active_modules: activeModules,
      suspended_modules: suspendedModules,
    },
    links: {
      settings: '/site-settings',
      modules: '/entitlements/me',
      theme: '/theme',
    },
  };
}
