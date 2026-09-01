import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

export interface CustomsRecordInput {
  hsCode: string | null;
  hsDescription: string | null;
  buyerName: string | null;
  exporterName: string | null;
  originCountry?: string | null;
  buyerCountry: string | null;
  totalValue: number | null;
  totalQuantity: number | null;
  netWeight?: number | null;
  shipmentDate?: string | null;
  monthYear: string | null;
  sourceProvider?: string | null;
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
  rulman: ['bearing', 'ball bearing', 'roller bearing'],
  conta: ['gasket', 'seal'],
  fren: ['brake'],
  motor: ['engine'],
  filtre: ['filter'],
  kayis: ['belt'],
  kayış: ['belt'],
  sanziman: ['transmission', 'gearbox'],
  şanzıman: ['transmission', 'gearbox'],
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

// ─── Arama sozlukleri ────────────────────────────────────────────────────────
// customs_records'ta 16.3M satir ama sadece ~20k farkli aciklama var. Urun aramasini
// once bu kucuk sozlukte yapip ana tabloyu `IN (...)` ile suzuyoruz: 10 dakika → saniyeler.

const MAX_DESC_MATCHES = 5000;
const MAX_EXPORTER_MATCHES = 2000;

/** Sozlukleri customs_records'tan yeniden uretir (import sonrasi calistirilir). */
export async function rebuildCustomsLookups(): Promise<{ descriptions: number; exporters: number }> {
  await pool.query('TRUNCATE TABLE customs_descriptions');
  await pool.query(
    `INSERT INTO customs_descriptions (hs_description, record_count)
     SELECT hs_description, COUNT(*) FROM customs_records
      WHERE hs_description IS NOT NULL AND hs_description <> ''
      GROUP BY hs_description
     ON DUPLICATE KEY UPDATE record_count = VALUES(record_count)`,
  );
  await pool.query('TRUNCATE TABLE customs_exporters');
  await pool.query(
    `INSERT INTO customs_exporters (exporter_name, record_count)
     SELECT exporter_name, COUNT(*) FROM customs_records
      WHERE exporter_name IS NOT NULL AND exporter_name <> ''
      GROUP BY exporter_name
     ON DUPLICATE KEY UPDATE record_count = VALUES(record_count)`,
  );
  const [d] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM customs_descriptions');
  const [e] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) AS n FROM customs_exporters');
  return { descriptions: Number(d[0]?.n ?? 0), exporters: Number(e[0]?.n ?? 0) };
}

/** Urun sorgusunu, ana tabloda indeksle kullanilabilir IN listelerine cevirir. */
async function resolveProductFilters(query: string): Promise<{ descriptions: string[]; exporters: string[] }> {
  const terms = productSearchTerms(query);
  if (!terms.length) return { descriptions: [], exporters: [] };
  const likes = terms.map(() => '?');

  const [descRows] = await pool.execute<RowDataPacket[]>(
    `SELECT hs_description FROM customs_descriptions
      WHERE ${likes.map(() => 'hs_description LIKE ?').join(' OR ')}
      ORDER BY record_count DESC LIMIT ${MAX_DESC_MATCHES}`,
    terms.map((t) => `%${t}%`),
  );
  const [expRows] = await pool.execute<RowDataPacket[]>(
    `SELECT exporter_name FROM customs_exporters
      WHERE ${likes.map(() => 'exporter_name LIKE ?').join(' OR ')}
      ORDER BY record_count DESC LIMIT ${MAX_EXPORTER_MATCHES}`,
    terms.map((t) => `%${t}%`),
  );

  return {
    descriptions: descRows.map((r) => String(r.hs_description)),
    exporters: expRows.map((r) => String(r.exporter_name)),
  };
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
    // ICP'ler HS kodunu 4-6 haneli ON EK olarak tutar (8482 = rulman), gumruk golunde ise
    // kodlar tam uzunluktadir (848210, 8482100000). `IN (...)` tam esitlik aradigi icin
    // hicbiri tutmuyor ve tarama 0 sonuc donuyordu. Her kodu ON EK olarak esliyoruz.
    where.push(`(${opts.hsCodes.map(() => 'hs_code LIKE ?').join(' OR ')})`);
    values.push(...opts.hsCodes.map((code) => `${code}%`));
  } else if (opts.hsPrefix) {
    where.push('hs_code LIKE ?');
    values.push(`${opts.hsPrefix}%`);
  }

  if (opts.productQuery?.trim()) {
    const { descriptions, exporters } = await resolveProductFilters(opts.productQuery);
    if (!descriptions.length && !exporters.length) return []; // hicbir aciklama/ihracatci eslesmedi

    const parts: string[] = [];
    if (descriptions.length) {
      parts.push(`hs_description IN (${descriptions.map(() => '?').join(', ')})`);
      values.push(...descriptions);
    }
    if (exporters.length) {
      parts.push(`exporter_name IN (${exporters.map(() => '?').join(', ')})`);
      values.push(...exporters);
    }
    where.push(`(${parts.join(' OR ')})`);
  }

  if (opts.buyerCountry?.trim()) {
    where.push('buyer_country = ?');
    values.push(opts.buyerCountry.trim());
  }

  if (opts.minValue !== undefined) {
    // ABD konşimento verisinde DEĞER YOK: 5.1M kaydın yalnızca 308'inde total_value dolu
    // (Rusya/Ukrayna'da %100). Düz `total_value >= ?` filtresi bu yüzden ABD'yi komple
    // eliyordu ve "min. değer" giren her tarama 0 sonuç dönüyordu. Değeri BİLİNMEYEN
    // kaydı elemiyoruz; filtre yalnızca değeri bilinen kayıtlara uygulanır.
    where.push('(total_value >= ? OR total_value IS NULL OR total_value = 0)');
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
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values: unknown[] = [];
    for (const r of batch) {
      values.push(
        'global',
        r.hsCode,
        r.hsDescription,
        r.buyerName,
        r.exporterName,
        r.originCountry ?? null,
        r.buyerCountry,
        r.totalValue,
        r.totalQuantity,
        r.netWeight ?? null,
        r.shipmentDate ?? null,
        r.monthYear,
        r.sourceProvider ?? null,
        sourceFile,
        r.sourceRowNumber ?? null,
      );
    }
    await pool.query(
      `INSERT IGNORE INTO customs_records
        (tenant_key, hs_code, hs_description, buyer_name, exporter_name, origin_country, buyer_country, total_value, total_quantity, net_weight, shipment_date, month_year, source_provider, source_file, source_row_number)
       VALUES ${placeholders}`,
      values as never[],
    );
    inserted += batch.length;
  }
  return inserted;
}
