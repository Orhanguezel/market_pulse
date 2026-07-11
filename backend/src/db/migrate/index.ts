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

const OWNER_TABLES: MigrationTable[] = [
  { name: 'market_targets', indexes: [{ name: 'idx_market_targets_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'market_leads', indexes: [{ name: 'idx_market_leads_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'market_signals', indexes: [{ name: 'idx_market_signals_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'icp_profiles', indexes: [{ name: 'idx_icp_profiles_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_search_jobs', indexes: [{ name: 'idx_jobs_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_candidates', indexes: [{ name: 'idx_lead_candidates_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_enrichment', indexes: [{ name: 'idx_lead_enrichment_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_outreach_drafts', indexes: [{ name: 'idx_lead_outreach_drafts_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_scan_rules', indexes: [{ name: 'idx_lead_scan_rules_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_decision_makers', indexes: [{ name: 'idx_ldm_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'lead_company_pool', indexes: [{ name: 'idx_lcp_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'outreach_campaigns', indexes: [{ name: 'idx_outreach_campaign_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'outreach_recipient_lists', indexes: [{ name: 'idx_reclist_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'outreach_recipients', indexes: [{ name: 'idx_recipient_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_accounts', indexes: [{ name: 'idx_crm_accounts_owner_tenant', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_contacts', indexes: [{ name: 'idx_crm_contacts_owner_tenant', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_deals', indexes: [{ name: 'idx_crm_deals_owner_tenant', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_activities', indexes: [{ name: 'idx_crm_activities_owner_tenant', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_tasks', indexes: [{ name: 'idx_crm_tasks_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_reminders', indexes: [{ name: 'idx_crm_reminders_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_products', indexes: [{ name: 'idx_crm_products_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_quotes', indexes: [{ name: 'idx_crm_quotes_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_orders', indexes: [{ name: 'idx_crm_orders_owner', columns: ['tenant_key', 'owner_user_id'] }] },
  { name: 'crm_documents', indexes: [{ name: 'idx_crm_documents_owner', columns: ['tenant_key', 'owner_user_id'] }] },
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

async function ensureOwnerColumn(conn: mysql.Connection, tableName: string): Promise<void> {
  if (await columnExists(conn, tableName, 'owner_user_id')) return;

  await query(
    conn,
    `ALTER TABLE ${quoteIdent(tableName)}
     ADD COLUMN ${quoteIdent('owner_user_id')} CHAR(36) DEFAULT NULL`,
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

async function ensureExternalCustomerColumn(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, 'market_targets'))) return;

  const legacyExternalCustomerColumn = ['pas', 'pas_customer_id'].join('');
  const hasOld = await columnExists(conn, 'market_targets', legacyExternalCustomerColumn);
  const hasNew = await columnExists(conn, 'market_targets', 'external_customer_id');

  if (hasOld && !hasNew) {
    await query(
      conn,
      `ALTER TABLE \`market_targets\` CHANGE \`${legacyExternalCustomerColumn}\` \`external_customer_id\` CHAR(36) DEFAULT NULL`,
    );
  } else if (!hasNew) {
    await query(
      conn,
      'ALTER TABLE `market_targets` ADD COLUMN `external_customer_id` CHAR(36) DEFAULT NULL',
    );
  }

  if (!(await indexExists(conn, 'market_targets', 'uq_market_targets_external_customer_id'))) {
    await query(
      conn,
      'ALTER TABLE `market_targets` ADD UNIQUE INDEX `uq_market_targets_external_customer_id` (`tenant_key`, `external_customer_id`)',
    );
  }
}

async function ensureSaasMultitenantTables(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, 'tenant_user_roles'))) {
    await query(
      conn,
      `CREATE TABLE ${quoteIdent('tenant_user_roles')} (
        ${quoteIdent('id')} CHAR(36) NOT NULL,
        ${quoteIdent('user_id')} CHAR(36) NOT NULL,
        ${quoteIdent('tenant_key')} VARCHAR(64) NOT NULL,
        ${quoteIdent('role')} ENUM('tenant_admin','tenant_editor') NOT NULL DEFAULT 'tenant_editor',
        ${quoteIdent('created_at')} TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (${quoteIdent('id')}),
        UNIQUE KEY ${quoteIdent('uq_tenant_user_roles_user_tenant')} (${quoteIdent('user_id')}, ${quoteIdent('tenant_key')}),
        KEY ${quoteIdent('idx_tenant_user_roles_tenant')} (${quoteIdent('tenant_key')})
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
  }

  if (!(await tableExists(conn, 'platform_settings'))) {
    await query(
      conn,
      `CREATE TABLE ${quoteIdent('platform_settings')} (
        ${quoteIdent('id')} CHAR(36) NOT NULL,
        ${quoteIdent('key')} VARCHAR(128) NOT NULL,
        ${quoteIdent('locale')} VARCHAR(8) NOT NULL DEFAULT '*',
        ${quoteIdent('value')} JSON DEFAULT NULL,
        ${quoteIdent('created_at')} TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ${quoteIdent('updated_at')} TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (${quoteIdent('id')}),
        UNIQUE KEY ${quoteIdent('uq_platform_settings_key_locale')} (${quoteIdent('key')}, ${quoteIdent('locale')})
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
  }
}

async function ensureProfileSenderColumns(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, 'profiles'))) return;
  const columns: Array<{ name: string; ddl: string }> = [
    { name: 'sender_enabled', ddl: '`sender_enabled` TINYINT(1) NOT NULL DEFAULT 0' },
    { name: 'sender_name', ddl: '`sender_name` VARCHAR(191) DEFAULT NULL' },
    { name: 'sender_email', ddl: '`sender_email` VARCHAR(255) DEFAULT NULL' },
    { name: 'sender_smtp_host', ddl: '`sender_smtp_host` VARCHAR(255) DEFAULT NULL' },
    { name: 'sender_smtp_port', ddl: '`sender_smtp_port` INT DEFAULT NULL' },
    { name: 'sender_smtp_username', ddl: '`sender_smtp_username` VARCHAR(255) DEFAULT NULL' },
    { name: 'sender_smtp_password', ddl: '`sender_smtp_password` TEXT DEFAULT NULL' },
    { name: 'sender_smtp_secure', ddl: '`sender_smtp_secure` TINYINT(1) DEFAULT NULL' },
  ];
  for (const column of columns) {
    if (await columnExists(conn, 'profiles', column.name)) continue;
    await query(conn, `ALTER TABLE \`profiles\` ADD COLUMN ${column.ddl}`);
  }
}

async function ensureUserMailAccountsTable(conn: mysql.Connection): Promise<void> {
  if (await tableExists(conn, 'user_mail_accounts')) return;
  await query(
    conn,
    `CREATE TABLE ${quoteIdent('user_mail_accounts')} (
      ${quoteIdent('id')} CHAR(36) NOT NULL,
      ${quoteIdent('tenant_key')} VARCHAR(64) NOT NULL DEFAULT 'avrasya',
      ${quoteIdent('owner_user_id')} CHAR(36) NOT NULL,
      ${quoteIdent('provider')} ENUM('gmail_oauth','imap_smtp') NOT NULL DEFAULT 'gmail_oauth',
      ${quoteIdent('email')} VARCHAR(255) NOT NULL,
      ${quoteIdent('display_name')} VARCHAR(255) DEFAULT NULL,
      ${quoteIdent('enc_access_token')} TEXT DEFAULT NULL,
      ${quoteIdent('enc_refresh_token')} TEXT DEFAULT NULL,
      ${quoteIdent('token_expiry')} DATETIME(3) DEFAULT NULL,
      ${quoteIdent('scopes')} TEXT DEFAULT NULL,
      ${quoteIdent('imap_host')} VARCHAR(255) DEFAULT NULL,
      ${quoteIdent('imap_port')} INT DEFAULT NULL,
      ${quoteIdent('smtp_host')} VARCHAR(255) DEFAULT NULL,
      ${quoteIdent('smtp_port')} INT DEFAULT NULL,
      ${quoteIdent('smtp_secure')} TINYINT(1) DEFAULT NULL,
      ${quoteIdent('smtp_username')} VARCHAR(255) DEFAULT NULL,
      ${quoteIdent('enc_password')} TEXT DEFAULT NULL,
      ${quoteIdent('status')} ENUM('connected','expired','error','disconnected') NOT NULL DEFAULT 'connected',
      ${quoteIdent('last_error')} VARCHAR(500) DEFAULT NULL,
      ${quoteIdent('last_synced_at')} DATETIME(3) DEFAULT NULL,
      ${quoteIdent('created_at')} DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      ${quoteIdent('updated_at')} DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (${quoteIdent('id')}),
      UNIQUE KEY ${quoteIdent('uq_user_mail_account_email')} (${quoteIdent('tenant_key')}, ${quoteIdent('owner_user_id')}, ${quoteIdent('email')}),
      KEY ${quoteIdent('idx_user_mail_accounts_owner')} (${quoteIdent('tenant_key')}, ${quoteIdent('owner_user_id')}),
      KEY ${quoteIdent('idx_user_mail_accounts_provider')} (${quoteIdent('tenant_key')}, ${quoteIdent('provider')}, ${quoteIdent('status')})
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
}

async function ensureCrmActivityPlanningColumns(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, 'crm_activities'))) return;
  if (!(await columnExists(conn, 'crm_activities', 'planned_start_at'))) {
    await query(
      conn,
      'ALTER TABLE `crm_activities` ADD COLUMN `planned_start_at` DATETIME DEFAULT NULL AFTER `body`',
    );
  }
  if (!(await indexExists(conn, 'crm_activities', 'idx_crm_activities_planned_start'))) {
    await query(
      conn,
      'ALTER TABLE `crm_activities` ADD INDEX `idx_crm_activities_planned_start` (`tenant_key`, `planned_start_at`)',
    );
  }
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

async function migrateOwnerColumns(conn: mysql.Connection): Promise<void> {
  for (const table of OWNER_TABLES) {
    if (!(await tableExists(conn, table.name))) {
      console.warn(`[migrate] skipped missing owner table: ${table.name}`);
      continue;
    }

    await ensureTenantColumn(conn, table.name);
    await ensureOwnerColumn(conn, table.name);
    for (const index of table.indexes ?? []) {
      await ensureIndex(conn, table.name, index);
    }
    console.log(`[migrate] owner ready: ${table.name}`);
  }
}

async function main(): Promise<void> {
  const conn = await createConn();
  try {
    await query(conn, 'SET NAMES utf8mb4');
    await migrateTenantColumns(conn);
    await migrateOwnerColumns(conn);
    await ensureExternalCustomerColumn(conn);
    await ensureSaasMultitenantTables(conn);
    await ensureProfileSenderColumns(conn);
    await ensureUserMailAccountsTable(conn);
    await ensureCrmActivityPlanningColumns(conn);
    console.log('[migrate] completed');
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
