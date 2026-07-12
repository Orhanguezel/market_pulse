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
  sourceRowNumber?: number | null;
}

export interface AggregatedBuyer {
  buyer_name: string;
  buyer_country: string | null;
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
  productQuery?: string;
  buyerCountry?: string;
  minValue?: number;
  limit?: number;
}

/**
 * Konsimento aciklamalari INGILIZCE'dir; kullanici ise Turkce arar ("paspas").
 * Duz LIKE bu yuzden hicbir sey bulamiyordu. Urun sorgusunu esanlamlarina genisletiyoruz.
 */
// DIKKAT: tek basina 'mat' gibi kisa terim KOYMAYIN — LIKE '%mat%' "MATERIAL",
// "AUTOMATIC" gibi kelimeleri de yakalayip alakasiz devleri (Norilsk Nickel, Bosch)
// sonuca tasiyor. Terimler ayirt edici olmali.
const PRODUCT_SYNONYMS: Record<string, string[]> = {
  paspas: ['car mat', 'floor mat', 'floor mats', 'car mats', 'auto mat', 'rubber mat', 'carpet mat'],
  hali: ['carpet', 'rug'],
  halı: ['carpet', 'rug'],
  kilim: ['rug', 'kilim'],
  tekstil: ['textile'],
  deri: ['leather'],
  aksesuar: ['accessor'],           // accessory / accessories
  'yedek parca': ['spare part', 'auto part'],
  'yedek parça': ['spare part', 'auto part'],
  lastik: ['tyre', 'tire', 'rubber'],
  ambalaj: ['packaging', 'package'],
  mobilya: ['furniture'],
  gida: ['food'],
  gıda: ['food'],
  biber: ['pepper'],
};

/** Urun sorgusunu, varsa Turkce esanlamlariyla birlikte arama terimlerine cevirir. */
export function productSearchTerms(query: string): string[] {
  const q = query.trim();
  if (!q) return [];
  const synonyms = PRODUCT_SYNONYMS[q.toLowerCase()] ?? [];
  return [...new Set([q, ...synonyms])];
}

/**
 * Buyer (ithalatci firma = LEAD) bazinda gumruk kayitlarini gruplar ve toplar.
 * customs_records paylasimli reference lake'tir; tenant filtresi kullanilmaz.
 * GROUP_CONCAT ile distinct HS kodu ve ihracatci listesi (uzunlugu sinirli) doner.
 */
export async function aggregateBuyers(
  opts: AggregateBuyersOptions = {},
): Promise<AggregatedBuyer[]> {
  const where: string[] = ["buyer_name IS NOT NULL", "buyer_name <> ''"];
  const values: unknown[] = [];

  if (opts.hsCodes && opts.hsCodes.length) {
    where.push(`hs_code IN (${opts.hsCodes.map(() => '?').join(', ')})`);
    values.push(...opts.hsCodes);
  } else if (opts.hsPrefix) {
    where.push('hs_code LIKE ?');
    values.push(`${opts.hsPrefix}%`);
  }

  if (opts.productQuery?.trim()) {
    const terms = productSearchTerms(opts.productQuery);
    const clauses = terms.map(() => '(hs_description LIKE ? OR exporter_name LIKE ?)');
    where.push(`(${clauses.join(' OR ')})`);
    for (const term of terms) values.push(`%${term}%`, `%${term}%`);
  }

  if (opts.buyerCountry?.trim()) {
    where.push('buyer_country = ?');
    values.push(opts.buyerCountry.trim());
  }

  if (opts.minValue !== undefined) {
    where.push('total_value >= ?');
    values.push(opts.minValue);
  }

  const limit = Math.floor(opts.limit && opts.limit > 0 ? opts.limit : 200);

  const [rows] = await pool.execute(
     `SELECT
        buyer_name,
        SUBSTRING(GROUP_CONCAT(DISTINCT buyer_country ORDER BY buyer_country SEPARATOR ', '), 1, 100) AS buyer_country,
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
 * Chunked bulk insert into global customs_records lake. tenant_key is provenance
 * only; lead_candidates remain tenant-scoped at job write time.
 */
export async function bulkInsertRecords(
  rows: CustomsRecordInput[],
  sourceFile: string,
): Promise<number> {
  const CHUNK = 5000;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    if (!batch.length) continue;
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values: unknown[] = [];
    for (const r of batch) {
      values.push(
        'global',
        r.hsCode,
        r.hsDescription,
        r.buyerName,
        r.exporterName,
        r.buyerCountry,
        r.totalValue,
        r.totalQuantity,
        r.monthYear,
        sourceFile,
        r.sourceRowNumber ?? null,
      );
    }
    await pool.query(
      `INSERT IGNORE INTO customs_records
        (tenant_key, hs_code, hs_description, buyer_name, exporter_name, buyer_country, total_value, total_quantity, month_year, source_file, source_row_number)
       VALUES ${placeholders}`,
      values as never[],
    );
    inserted += batch.length;
  }
  return inserted;
}
