import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'modules');
const strict = process.argv.includes('--strict');

const ownerScopedTables = [
  'market_targets',
  'market_leads',
  'market_signals',
  'icp_profiles',
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
  'crm_tasks',
  'crm_reminders',
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
  const touchedTables = ownerScopedTables.filter(table => source.includes(table));
  if (!touchedTables.length) continue;

  const isAdminOnly =
    file.includes('/admin.') ||
    source.includes('requireAdmin') ||
    source.includes('registerCrmAdmin') ||
    source.includes('/admin/');

  if (isAdminOnly) continue;

  const hasOwnerScope =
    source.includes('owner_user_id') ||
    source.includes('getActiveUserId') ||
    source.includes('getRequiredUserId');

  if (!hasOwnerScope) {
    offenders.push(`${relative(process.cwd(), file)}: ${touchedTables.join(', ')}`);
  }
}

if (offenders.length) {
  console.error('Owner scope guard found user-facing business table access without owner scoping marker:');
  for (const offender of offenders) console.error(`- ${offender}`);
  if (strict) process.exit(1);
  console.error('Run with --strict to fail CI once Faz 1 owner filters are complete.');
} else {
  console.log('Owner scope guard passed.');
}
