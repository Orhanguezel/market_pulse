/**
 * Tarvista tenant onboarding (Faz 6 — minimal).
 *
 * Idempotent: tarvista tenant satırını ve başlangıç agri ICP profilini garanti eder.
 * `bun src/scripts/onboard-tarvista.ts` ile çalıştırılır (db:seed sonrası).
 *
 * NOT: tenants/tenant_settings satırları zaten 026_tenancy_schema.sql seed'inde var.
 * Bu script paneli boş bırakmamak için bir agri ICP iskeleti ekler.
 */
import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

const TENANT = 'tarvista';

const AGRI_ICP = {
  name: 'Tarım / Tohum-Fide ICP (başlangıç)',
  definition: {
    sector: 'agri',
    locale: 'tr',
    keywords: ['tohum', 'fide', 'sera', 'fidan', 'seed', 'seedling', 'greenhouse'],
    fairs: ['Growtech Antalya', 'Fruit Logistica Berlin', 'EIMA'],
    directories: ['Europages (agri)', 'Eurofruit'],
    note: 'Panelden detaylandırılacak başlangıç şablonu.',
  },
};

async function ensureTenantRow() {
  await pool.execute(
    `INSERT INTO tenants (tenant_key, name, locale, status, plan)
     VALUES (?, 'TarVista', 'tr', 'active', 'agency')
     ON DUPLICATE KEY UPDATE status = VALUES(status)`,
    [TENANT],
  );
}

async function ensureStarterIcp() {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS c FROM icp_profiles WHERE tenant_key = ?',
    [TENANT],
  );
  const count = Number((rows as Array<{ c: number }>)[0]?.c ?? 0);
  if (count > 0) {
    console.log(`[onboard] tarvista zaten ${count} ICP içeriyor — atlanıyor.`);
    return;
  }
  const id = randomUUID();
  await pool.execute(
    'INSERT INTO icp_profiles (id, tenant_key, name, is_active, definition) VALUES (?, ?, ?, 1, ?)',
    [id, TENANT, AGRI_ICP.name, JSON.stringify(AGRI_ICP.definition)],
  );
  console.log(`[onboard] tarvista başlangıç ICP eklendi: ${id}`);
}

async function main() {
  await ensureTenantRow();
  await ensureStarterIcp();
  console.log('[onboard] tarvista onboarding tamam.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
