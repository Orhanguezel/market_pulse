import { pool } from '@/db/client';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

type Args = {
  tenant: string;
  ownerUserId?: string;
  dryRun: boolean;
};

type CountRow = RowDataPacket & { count: number };
type UserRow = RowDataPacket & { id: string };

const OWNER_SCOPED_TABLES = [
  'market_targets',
  'market_leads',
  'market_signals',
  'icp_profiles',
  'lead_search_jobs',
  'lead_candidates',
  'lead_enrichment',
  'lead_outreach_drafts',
  'lead_scan_rules',
  'lead_decision_makers',
  'lead_company_pool',
  'outreach_campaigns',
  'outreach_recipient_lists',
  'outreach_recipients',
  'crm_accounts',
  'crm_contacts',
  'crm_deals',
  'crm_activities',
  'crm_products',
  'crm_quotes',
  'crm_orders',
  'crm_documents',
  'crm_tasks',
  'crm_reminders',
] as const;

function parseArgs(argv: string[]): Args {
  const args: Args = {
    tenant: process.env.TENANT_KEY || 'avrasya',
    ownerUserId: process.env.OWNER_USER_ID || process.env.ADMIN_ID,
    dryRun: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--tenant=')) args.tenant = arg.replace('--tenant=', '').trim();
    else if (arg.startsWith('--owner-user-id=')) args.ownerUserId = arg.replace('--owner-user-id=', '').trim();
  }

  if (!args.tenant) throw new Error('tenant bos olamaz. Ornek: --tenant=avrasya');
  return args;
}

function quoteIdent(name: string): string {
  return `\`${name.replaceAll('`', '``')}\``;
}

async function tableHasColumns(table: string, columns: string[]): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME IN (${columns.map(() => '?').join(', ')})`,
    [table, ...columns],
  );
  const found = new Set(rows.map((row) => String(row.COLUMN_NAME)));
  return columns.every((column) => found.has(column));
}

async function tableExists(table: string): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT 1
       FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function userExists(userId: string): Promise<boolean> {
  const [rows] = await pool.execute<UserRow[]>('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
  return rows.length > 0;
}

async function resolveOwnerUserId(args: Args): Promise<string> {
  if (args.ownerUserId && await userExists(args.ownerUserId)) return args.ownerUserId;

  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail) {
    const [rows] = await pool.execute<UserRow[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);
    if (rows[0]?.id) return rows[0].id;
  }

  if (await tableExists('tenant_user_roles')) {
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT user_id AS id
         FROM tenant_user_roles
        WHERE tenant_key = ? AND role = 'tenant_admin'
        ORDER BY created_at ASC
        LIMIT 1`,
      [args.tenant],
    );
    if (rows[0]?.id) return rows[0].id;
  }

  const [admins] = await pool.execute<UserRow[]>(
    `SELECT u.id
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
      WHERE ur.role = 'admin'
      ORDER BY u.created_at ASC
      LIMIT 1`,
  );
  if (admins[0]?.id) return admins[0].id;

  throw new Error('Owner kullanici bulunamadi. OWNER_USER_ID veya ADMIN_ID verin.');
}

async function ensureTenantAdminRole(tenant: string, ownerUserId: string, dryRun: boolean): Promise<void> {
  if (!(await tableExists('tenant_user_roles'))) {
    console.warn('[owner-backfill] tenant_user_roles yok; rol garantisi atlandi.');
    return;
  }

  if (dryRun) {
    console.log(`[owner-backfill] dry-run: ${ownerUserId} kullanicisi ${tenant} tenant_admin yapilacak.`);
    return;
  }

  await pool.execute(
    `INSERT INTO tenant_user_roles (id, user_id, tenant_key, role, created_at)
     VALUES (UUID(), ?, ?, 'tenant_admin', CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE role = 'tenant_admin'`,
    [ownerUserId, tenant],
  );
}

async function countMissingOwner(table: string, tenant: string): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) AS count
       FROM ${quoteIdent(table)}
      WHERE tenant_key = ?
        AND owner_user_id IS NULL`,
    [tenant],
  );
  return Number(rows[0]?.count ?? 0);
}

async function backfillTable(table: string, tenant: string, ownerUserId: string, dryRun: boolean): Promise<void> {
  const hasColumns = await tableHasColumns(table, ['tenant_key', 'owner_user_id']);
  if (!hasColumns) {
    console.log(`[owner-backfill] ${table}: uyumlu sema yok, atlandi.`);
    return;
  }

  const missing = await countMissingOwner(table, tenant);
  if (missing === 0) {
    console.log(`[owner-backfill] ${table}: eksik owner yok.`);
    return;
  }

  if (dryRun) {
    console.log(`[owner-backfill] ${table}: ${missing} kayit guncellenecek.`);
    return;
  }

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE ${quoteIdent(table)}
        SET owner_user_id = ?
      WHERE tenant_key = ?
        AND owner_user_id IS NULL`,
    [ownerUserId, tenant],
  );
  console.log(`[owner-backfill] ${table}: ${result.affectedRows} kayit guncellendi.`);
}

async function main() {
  const args = parseArgs(process.argv);
  const ownerUserId = await resolveOwnerUserId(args);

  console.log(`[owner-backfill] tenant=${args.tenant} owner_user_id=${ownerUserId} dryRun=${args.dryRun}`);
  await ensureTenantAdminRole(args.tenant, ownerUserId, args.dryRun);

  for (const table of OWNER_SCOPED_TABLES) {
    await backfillTable(table, args.tenant, ownerUserId, args.dryRun);
  }

  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
