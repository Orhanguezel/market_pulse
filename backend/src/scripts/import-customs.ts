import { createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { pool } from '@/db/client';
import { runWithTenant } from '@/core/tenant-context';
import { bulkInsertRecords, aggregateBuyers, type CustomsRecordInput } from '@/modules/lead-machine/customs/customs.repository';
import { createSearchJob } from '@/modules/lead-machine/_shared/db';
import { runCustomsJob } from '@/modules/lead-machine/customs/customs.job';

const JOB_TENANT = process.env.TENANT_KEY || 'avrasya';
const BATCH_SIZE = Math.max(1000, Number(process.env.CUSTOMS_IMPORT_BATCH_SIZE ?? 5000));
const TABLE_NAME_RE = /^[A-Za-z0-9_]+$/;

async function* parseCsvRows(path: string): AsyncGenerator<string[]> {
  const stream = createReadStream(path, { encoding: 'utf8' });
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for await (const chunk of stream) {
    for (let i = 0; i < chunk.length; i += 1) {
      const c = chunk[i];
      if (inQuotes) {
        if (c === '"') {
          if (chunk[i + 1] === '"') {
            field += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        yield row;
        field = '';
        row = [];
      } else if (c !== '\r') {
        field += c;
      }
    }
  }

  if (field.length || row.length) {
    row.push(field);
    yield row;
  }
}

function toDecimal(value: string | undefined): number | null {
  if (value === undefined) return null;
  const normalized = value.includes(',') && !value.includes('.')
    ? value.replace(',', '.')
    : value;
  const cleaned = normalized.replace(/[^0-9.\-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function nz(value: string | undefined): string | null {
  const v = (value ?? '').trim();
  return v.length ? v : null;
}

function headerIndex(header: string[]) {
  const normalized = header.map((h) => h.trim().toLowerCase());
  const idx = (...names: string[]) => {
    for (const name of names) {
      const found = normalized.indexOf(name);
      if (found >= 0) return found;
    }
    return -1;
  };
  return {
    hs: idx('hs_code', 'hscode', 'gtip'),
    buyer: idx('buyer_name', 'buyer', 'importer_name', 'importer'),
    exporter: idx('exporter_name', 'exporter', 'shipper_name', 'shipper'),
    desc: idx('hs_code_description', 'hs_description', 'description', 'product_description'),
    country: idx('buyer_country', 'country', 'importer_country'),
    value: idx('total_value', 'value', 'usd_value'),
    qty: idx('total_quantity', 'quantity', 'qty'),
    month: idx('month_year', 'date', 'period'),
  };
}

function cell(cols: string[], index: number): string | undefined {
  return index >= 0 ? cols[index] : undefined;
}

async function importCsv(csvPath: string, opts: { reload: boolean }): Promise<number> {
  if (opts.reload) {
    await pool.query('TRUNCATE TABLE customs_records');
  }

  const sourceFile = basename(csvPath);
  let indexes: ReturnType<typeof headerIndex> | null = null;
  let sourceRowNumber = 0;
  let inserted = 0;
  let batch: CustomsRecordInput[] = [];

  for await (const cols of parseCsvRows(csvPath)) {
    sourceRowNumber += 1;
    if (!indexes) {
      indexes = headerIndex(cols);
      continue;
    }
    if (!cols || cols.every((c) => c.trim() === '')) continue;

    batch.push({
      hsCode: nz(cell(cols, indexes.hs)),
      hsDescription: nz(cell(cols, indexes.desc)),
      buyerName: nz(cell(cols, indexes.buyer)),
      exporterName: nz(cell(cols, indexes.exporter)),
      buyerCountry: nz(cell(cols, indexes.country)),
      totalValue: toDecimal(cell(cols, indexes.value)),
      totalQuantity: toDecimal(cell(cols, indexes.qty)),
      monthYear: nz(cell(cols, indexes.month)),
      sourceRowNumber,
    });

    if (batch.length >= BATCH_SIZE) {
      inserted += await bulkInsertRecords(batch, sourceFile);
      batch = [];
      if (inserted % 100000 === 0) console.log(`[import-customs] processed ${inserted} rows...`);
    }
  }

  if (batch.length) inserted += await bulkInsertRecords(batch, sourceFile);
  await pool.query('ANALYZE TABLE customs_records');
  return inserted;
}

function parseFlagValue(args: string[], name: string): string | null {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length).trim() || null;
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1]?.trim() || null;
  return null;
}

function safeTableName(name: string): string {
  if (!TABLE_NAME_RE.test(name)) throw new Error(`INVALID_TABLE_NAME_${name}`);
  return `\`${name}\``;
}

async function importFromStagingTable(tableName: string, opts: { reload: boolean }): Promise<void> {
  if (opts.reload) {
    await pool.query('TRUNCATE TABLE customs_records');
  }

  const sourceTable = safeTableName(tableName);
  await pool.query('SET @customs_import_row := 0');
  await pool.query(
    `INSERT IGNORE INTO customs_records
      (tenant_key, hs_code, hs_description, buyer_name, exporter_name, buyer_country, total_value, total_quantity, month_year, source_file, source_row_number)
     SELECT
      'global',
      NULLIF(TRIM(CAST(hs_code AS CHAR)), ''),
      NULLIF(TRIM(CAST(hs_code_description AS CHAR)), ''),
      NULLIF(TRIM(CAST(buyer_name AS CHAR)), ''),
      NULLIF(TRIM(CAST(exporter_name AS CHAR)), ''),
      NULL,
      CAST(NULLIF(REPLACE(CAST(total_value AS CHAR), ',', ''), '') AS DECIMAL(20,2)),
      CAST(NULLIF(REPLACE(CAST(total_quantity AS CHAR), ',', ''), '') AS DECIMAL(20,2)),
      NULLIF(TRIM(CAST(month_year AS CHAR)), ''),
      ?,
      (@customs_import_row := @customs_import_row + 1)
     FROM ${sourceTable}`,
    // NOT: ORDER BY YOK — milyonlarca satirda secilen mediumtext kolonlariyla
    // birlikte filesort tmpdir'i doldurup "No space left on device" veriyordu (5.7M
    // satir testinde patladi). InnoDB tam tarama zaten clustered PK sirasinda doner →
    // source_row_number deterministik kalir; idempotency icin --reload kullanin.
    [tableName],
  );
  await pool.query('ANALYZE TABLE customs_records');
}

async function benchmark() {
  const start = performance.now();
  const rows = await aggregateBuyers({ hsPrefix: '0904', minValue: 1000, limit: 200 });
  const ms = Math.round(performance.now() - start);
  console.log(`[import-customs] benchmark hs_prefix=0904 min_value=1000 limit=200: ${rows.length} buyers in ${ms}ms`);
}

async function main() {
  const args = process.argv.slice(2);
  const runFlag = args.includes('--run');
  const reloadFlag = args.includes('--reload');
  const benchmarkFlag = args.includes('--benchmark');
  const fromTable = parseFlagValue(args, '--from-table');
  const csvPath = args.find(a => !a.startsWith('--'));

  if (fromTable) {
    await importFromStagingTable(fromTable, { reload: reloadFlag });
    console.log(`[import-customs] imported staging table ${fromTable} into customs_records`);
  }

  if (csvPath) {
    const inserted = await importCsv(csvPath, { reload: reloadFlag });
    console.log(`[import-customs] inserted/processed ${inserted} rows from ${csvPath}`);
  }

  if (benchmarkFlag) await benchmark();

  if (runFlag) {
    await runWithTenant(JOB_TENANT, async () => {
      const job = await createSearchJob('customs', { hs_prefix: '0904', limit: 200 });
      if (!job) throw new Error('JOB_CREATE_FAILED');
      console.log(`[import-customs] created job ${job.id}, running...`);
      await runCustomsJob(job.id);

      const [stats] = await pool.execute(
        `SELECT COUNT(*) AS cnt, AVG(lead_score) AS avg_score, MAX(lead_score) AS max_score
         FROM lead_candidates WHERE tenant_key = ? AND channel = 'customs'`,
        [JOB_TENANT],
      );
      console.log('[import-customs] lead_candidates(customs) stats:', (stats as unknown[])[0]);

      const [samples] = await pool.execute(
        `SELECT name, lead_score, JSON_EXTRACT(raw_data, '$.total_value') AS total_value
         FROM lead_candidates WHERE tenant_key = ? AND channel = 'customs'
         ORDER BY lead_score DESC, JSON_EXTRACT(raw_data, '$.total_value') DESC LIMIT 5`,
        [JOB_TENANT],
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
