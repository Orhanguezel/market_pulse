import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'modules');

const businessTables = [
  'market_targets',
  'market_leads',
  'market_signals',
  'market_test_runs',
  'market_developer_notes',
  'icp_profiles',
  'lead_search_jobs',
  'lead_candidates',
  'lead_enrichment',
  'lead_outreach_drafts',
  'lead_rejection_patterns',
  'lead_scan_rules',
  'amazon_scan_jobs',
  'amazon_products',
  'amazon_category_stats',
  'amazon_risk_scores',
  'amazon_keepa_snapshots',
  'amazon_job_error_logs',
  'amazon_keepa_daily_budget',
  'amazon_keepa_queue',
  'amazon_saved_searches',
  'user_plans',
  'user_scan_usage',
  'user_keepa_keys',
  'outreach_campaigns',
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (name === '__tests__') continue;
      out.push(...walk(path));
      continue;
    }
    if (!name.endsWith('.ts')) continue;
    if (name.includes('.sync-conflict-')) continue;
    if (name.endsWith('.schema.ts')) continue;
    out.push(path);
  }
  return out;
}

const offenders: string[] = [];

for (const file of walk(root)) {
  const source = readFileSync(file, 'utf8');
  const touchedTables = businessTables.filter(table => source.includes(table));
  if (!touchedTables.length) continue;

  const hasTenantScope =
    source.includes('tenant_key') ||
    source.includes('getActiveTenantKey') ||
    source.includes('andTenant') ||
    source.includes('tenantValues') ||
    source.includes('tenantWhereSql');

  if (!hasTenantScope) {
    offenders.push(`${relative(process.cwd(), file)}: ${touchedTables.join(', ')}`);
  }
}

if (offenders.length) {
  console.error('Tenant scope guard failed. Business table access without tenant scoping marker:');
  for (const offender of offenders) console.error(`- ${offender}`);
  process.exit(1);
}

console.log('Tenant scope guard passed.');
