import { pool } from '@/db/client';

export interface CustomsRecordInput {
  hsCode: string | null;
  hsDescription: string | null;
  buyerName: string | null;
  exporterName: string | null;
  buyerCountry: string | null;
  totalValue: number | null;
  totalQuantity: number | null;
  monthYear: string | null;
}

export interface AggregatedBuyer {
  buyer_name: string;
  hs_codes: string;
  exporter_names: string;
  total_value: string | number | null;
  total_quantity: string | number | null;
  record_count: string | number;
  latest_month: string | null;
}

export interface AggregateBuyersOptions {
  hsPrefix?: string;
  hsCodes?: string[];
  minValue?: number;
  limit?: number;
}

/**
 * Buyer (ithalatci firma = LEAD) bazinda gumruk kayitlarini gruplar ve toplar.
 * Tenant-scoped (WHERE tenant_key = ?). En yuksek ithalat degerine gore siralar.
 * GROUP_CONCAT ile distinct HS kodu ve ihracatci listesi (uzunlugu sinirli) doner.
 */
export async function aggregateBuyers(
  tenantKey: string,
  opts: AggregateBuyersOptions = {},
): Promise<AggregatedBuyer[]> {
  const where: string[] = ['tenant_key = ?', "buyer_name IS NOT NULL", "buyer_name <> ''"];
  const values: unknown[] = [tenantKey];

  if (opts.hsCodes && opts.hsCodes.length) {
    where.push(`hs_code IN (${opts.hsCodes.map(() => '?').join(', ')})`);
    values.push(...opts.hsCodes);
  } else if (opts.hsPrefix) {
    where.push('hs_code LIKE ?');
    values.push(`${opts.hsPrefix}%`);
  }

  if (opts.minValue !== undefined) {
    where.push('total_value >= ?');
    values.push(opts.minValue);
  }

  const limit = Math.floor(opts.limit && opts.limit > 0 ? opts.limit : 200);

  const [rows] = await pool.execute(
    `SELECT
        buyer_name,
        GROUP_CONCAT(DISTINCT hs_code ORDER BY hs_code SEPARATOR ', ')                       AS hs_codes,
        SUBSTRING(GROUP_CONCAT(DISTINCT exporter_name ORDER BY exporter_name SEPARATOR ', '), 1, 500) AS exporter_names,
        SUM(total_value)                                                                     AS total_value,
        SUM(total_quantity)                                                                  AS total_quantity,
        COUNT(*)                                                                             AS record_count,
        MAX(month_year)                                                                      AS latest_month
     FROM customs_records
     WHERE ${where.join(' AND ')}
     GROUP BY buyer_name
     ORDER BY total_value DESC
     LIMIT ${limit}`,
    values as never[],
  );
  return rows as AggregatedBuyer[];
}

/**
 * Chunked bulk insert (500/batch) into customs_records. Tenant-scoped via
 * explicit tenant_key column on every row.
 */
export async function bulkInsertRecords(
  tenantKey: string,
  rows: CustomsRecordInput[],
  sourceFile: string,
): Promise<number> {
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    if (!batch.length) continue;
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values: unknown[] = [];
    for (const r of batch) {
      values.push(
        tenantKey,
        r.hsCode,
        r.hsDescription,
        r.buyerName,
        r.exporterName,
        r.buyerCountry,
        r.totalValue,
        r.totalQuantity,
        r.monthYear,
        sourceFile,
      );
    }
    await pool.query(
      `INSERT INTO customs_records
        (tenant_key, hs_code, hs_description, buyer_name, exporter_name, buyer_country, total_value, total_quantity, month_year, source_file)
       VALUES ${placeholders}`,
      values as never[],
    );
    inserted += batch.length;
  }
  return inserted;
}
