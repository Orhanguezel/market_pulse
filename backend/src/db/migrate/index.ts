import mysql from 'mysql2/promise';
import { env } from '@/core/env';

type MigrationTable = {
  name: string;
  indexes?: Array<{ name: string; columns: string[]; unique?: boolean }>;
};

const TENANT_TABLES: MigrationTable[] = [
  { name: 'market_targets', indexes: [{ name: 'idx_market_targets_tenant', columns: ['tenant_key'] }] },
  { name: 'market_leads', indexes: [{ name: 'idx_market_leads_tenant', columns: ['tenant_key'] }] },
  { name: 'market_signals', indexes: [{ name: 'idx_market_signals_tenant', columns: ['tenant_key'] }] },
  { name: 'market_test_runs', indexes: [{ name: 'idx_market_test_runs_tenant', columns: ['tenant_key'] }] },
  { name: 'market_developer_notes', indexes: [{ name: 'idx_market_developer_notes_tenant', columns: ['tenant_key'] }] },
  { name: 'icp_profiles', indexes: [{ name: 'idx_icp_profiles_tenant', columns: ['tenant_key'] }] },
  { name: 'lead_search_jobs', indexes: [{ name: 'idx_lead_search_jobs_tenant', columns: ['tenant_key'] }] },
  { name: 'lead_candidates', indexes: [{ name: 'idx_lead_candidates_tenant', columns: ['tenant_key'] }] },
  { name: 'lead_enrichment', indexes: [{ name: 'idx_lead_enrichment_tenant', columns: ['tenant_key'] }] },
  { name: 'lead_outreach_drafts', indexes: [{ name: 'idx_lead_outreach_drafts_tenant', columns: ['tenant_key'] }] },
  { name: 'lead_rejection_patterns', indexes: [{ name: 'idx_lead_rejection_patterns_tenant', columns: ['tenant_key'] }] },
  { name: 'lead_scan_rules', indexes: [{ name: 'idx_lead_scan_rules_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_scan_jobs', indexes: [{ name: 'idx_amazon_scan_jobs_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_products', indexes: [{ name: 'idx_amazon_products_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_category_stats', indexes: [{ name: 'idx_amazon_category_stats_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_risk_scores', indexes: [{ name: 'idx_amazon_risk_scores_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_keepa_snapshots', indexes: [{ name: 'idx_amazon_keepa_snapshots_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_job_error_logs', indexes: [{ name: 'idx_amazon_job_error_logs_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_keepa_daily_budget', indexes: [{ name: 'idx_amazon_keepa_daily_budget_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_keepa_queue', indexes: [{ name: 'idx_amazon_keepa_queue_tenant', columns: ['tenant_key'] }] },
  { name: 'amazon_saved_searches', indexes: [{ name: 'idx_amazon_saved_searches_tenant', columns: ['tenant_key'] }] },
  { name: 'user_plans', indexes: [{ name: 'idx_user_plans_tenant', columns: ['tenant_key'] }] },
  { name: 'user_scan_usage', indexes: [{ name: 'idx_user_scan_usage_tenant', columns: ['tenant_key'] }] },
  { name: 'user_keepa_keys', indexes: [{ name: 'idx_user_keepa_keys_tenant', columns: ['tenant_key'] }] },
  { name: 'outreach_campaigns', indexes: [{ name: 'idx_outreach_campaign_tenant', columns: ['tenant_key'] }] },
];

function quoteIdent(value: string): string {
  return `\`${value.replaceAll('`', '``')}\``;
}

function assertSafeSql(sql: string): void {
  if (/\b(drop|truncate)\b/i.test(sql)) {
    throw new Error(`Unsafe migration statement rejected: ${sql}`);
  }
}

async function query(
  conn: mysql.Connection,
  sql: string,
  params: unknown[] = [],
): Promise<void> {
  assertSafeSql(sql);
  await conn.query(sql, params);
}

async function createConn(): Promise<mysql.Connection> {
  return mysql.createConnection({
    host: env.DB.host,
    port: env.DB.port,
    user: env.DB.user,
    password: env.DB.password,
    database: env.DB.name,
    multipleStatements: false,
    charset: 'utf8mb4_unicode_ci',
  });
}

async function tableExists(conn: mysql.Connection, tableName: string): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function columnExists(
  conn: mysql.Connection,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function indexExists(
  conn: mysql.Connection,
  tableName: string,
  indexName: string,
): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS count
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName],
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function ensureTenantColumn(conn: mysql.Connection, tableName: string): Promise<void> {
  if (await columnExists(conn, tableName, 'tenant_key')) return;

  await query(
    conn,
    `ALTER TABLE ${quoteIdent(tableName)}
     ADD COLUMN ${quoteIdent('tenant_key')} VARCHAR(64) NOT NULL DEFAULT 'avrasya'`,
  );
}

async function ensureIndex(
  conn: mysql.Connection,
  tableName: string,
  index: NonNullable<MigrationTable['indexes']>[number],
): Promise<void> {
  if (await indexExists(conn, tableName, index.name)) return;

  const columns = index.columns.map(quoteIdent).join(', ');
  const unique = index.unique ? 'UNIQUE ' : '';
  await query(
    conn,
    `ALTER TABLE ${quoteIdent(tableName)}
     ADD ${unique}INDEX ${quoteIdent(index.name)} (${columns})`,
  );
}

async function migrateTenantColumns(conn: mysql.Connection): Promise<void> {
  for (const table of TENANT_TABLES) {
    if (!(await tableExists(conn, table.name))) {
      console.warn(`[migrate] skipped missing table: ${table.name}`);
      continue;
    }

    await ensureTenantColumn(conn, table.name);
    for (const index of table.indexes ?? []) {
      await ensureIndex(conn, table.name, index);
    }
    console.log(`[migrate] tenant ready: ${table.name}`);
  }
}

async function main(): Promise<void> {
  const conn = await createConn();
  try {
    await query(conn, 'SET NAMES utf8mb4');
    await migrateTenantColumns(conn);
    console.log('[migrate] completed');
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
