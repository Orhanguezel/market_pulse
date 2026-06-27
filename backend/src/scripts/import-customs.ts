import { readFileSync } from 'node:fs';
import { pool } from '@/db/client';
import { runWithTenant } from '@/core/tenant-context';
import { basename } from 'node:path';
import { bulkInsertRecords, aggregateBuyers, type CustomsRecordInput } from '@/modules/lead-machine/customs/customs.repository';
import { createSearchJob } from '@/modules/lead-machine/_shared/db';
import { runCustomsJob } from '@/modules/lead-machine/customs/customs.job';

const TENANT = 'avrasya';

/** Minimal RFC4180-ish CSV parser (handles quoted fields with commas/newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); field = ''; row = [];
    } else if (c === '\r') {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toDecimal(value: string | undefined): number | null {
  if (value === undefined) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function nz(value: string | undefined): string | null {
  const v = (value ?? '').trim();
  return v.length ? v : null;
}

async function importCsv(csvPath: string): Promise<number> {
  const text = readFileSync(csvPath, 'utf8');
  const parsed = parseCsv(text);
  if (!parsed.length) return 0;
  const header = parsed[0].map(h => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iHs = idx('hs_code');
  const iBuyer = idx('buyer_name');
  const iExporter = idx('exporter_name');
  const iDesc = idx('hs_code_description');
  const iValue = idx('total_value');
  const iQty = idx('total_quantity');
  const iMonth = idx('month_year');

  const records: CustomsRecordInput[] = [];
  for (let r = 1; r < parsed.length; r++) {
    const cols = parsed[r];
    if (!cols || cols.every(c => c.trim() === '')) continue;
    records.push({
      hsCode: nz(cols[iHs]),
      hsDescription: nz(cols[iDesc]),
      buyerName: nz(cols[iBuyer]),
      exporterName: nz(cols[iExporter]),
      buyerCountry: null,
      totalValue: toDecimal(cols[iValue]),
      totalQuantity: toDecimal(cols[iQty]),
      monthYear: nz(cols[iMonth]),
    });
  }

  return runWithTenant(TENANT, () => bulkInsertRecords(TENANT, records, basename(csvPath)));
}

async function main() {
  const args = process.argv.slice(2);
  const runFlag = args.includes('--run');
  const csvPath = args.find(a => !a.startsWith('--'));

  if (csvPath) {
    const inserted = await importCsv(csvPath);
    console.log(`[import-customs] inserted ${inserted} rows from ${csvPath}`);
  }

  if (runFlag) {
    await runWithTenant(TENANT, async () => {
      const job = await createSearchJob('customs', { hs_prefix: '0904', limit: 200 });
      if (!job) throw new Error('JOB_CREATE_FAILED');
      console.log(`[import-customs] created job ${job.id}, running...`);
      await runCustomsJob(job.id);

      const [stats] = await pool.execute(
        `SELECT COUNT(*) AS cnt, AVG(lead_score) AS avg_score, MAX(lead_score) AS max_score
         FROM lead_candidates WHERE tenant_key = ? AND channel = 'customs'`,
        [TENANT],
      );
      console.log('[import-customs] lead_candidates(customs) stats:', (stats as unknown[])[0]);

      const [samples] = await pool.execute(
        `SELECT name, lead_score, JSON_EXTRACT(raw_data, '$.total_value') AS total_value
         FROM lead_candidates WHERE tenant_key = ? AND channel = 'customs'
         ORDER BY lead_score DESC, JSON_EXTRACT(raw_data, '$.total_value') DESC LIMIT 5`,
        [TENANT],
      );
      console.log('[import-customs] sample leads:');
      for (const row of samples as Array<Record<string, unknown>>) {
        console.log(`  - ${row.name} | score=${row.lead_score} | total_value=${row.total_value}`);
      }
    });
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
