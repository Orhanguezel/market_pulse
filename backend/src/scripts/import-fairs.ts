/**
 * Fuar takvimi içe aktarma (paylaşımlı katalog).
 *
 *   bun src/scripts/import-fairs.ts "Türkiye Fuar Takvimi 2026.xlsx" tr_takvim 2026
 *   bun src/scripts/import-fairs.ts "Dünya Fuar Takvimi 2024.xlsx"   dunya_takvim 2024
 *
 * İki kaynak farklı şemada; kolonlar başlık adına göre eşlenir.
 * Idempotent: (name, start_date) benzersiz → yeniden çalıştırmak kayıt çoğaltmaz.
 */
import { randomUUID } from 'node:crypto';
import * as XLSX from 'xlsx';
import { pool } from '@/db/client';

type Row = Record<string, unknown>;

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  ocak: 1, şubat: 2, subat: 2, mart: 3, nisan: 4, mayıs: 5, mayis: 5, haziran: 6,
  temmuz: 7, ağustos: 8, agustos: 8, eylül: 9, eylul: 9, ekim: 10, kasım: 11, kasim: 11, aralık: 12, aralik: 12,
};

/** "06.01.2026" | "1 January 2024" | Date → "YYYY-MM-DD" */
function parseDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  if (!s) return null;

  let m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/); // 06.01.2026
  if (m) return `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;

  m = s.match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})$/); // 1 January 2024
  if (m) {
    const mon = MONTHS[m[2]!.toLowerCase()];
    if (mon) return `${m[3]}-${String(mon).padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  }

  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

function txt(v: unknown, max = 500): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, ' ').trim();
  return s ? s.slice(0, max) : null;
}

function pick(row: Row, ...keys: string[]): unknown {
  for (const k of keys) {
    const hit = Object.keys(row).find((c) => c.trim().toLowerCase() === k.trim().toLowerCase());
    if (hit && row[hit] !== null && row[hit] !== undefined && String(row[hit]).trim() !== '') return row[hit];
  }
  return null;
}

async function main() {
  const file = process.argv[2];
  const source = process.argv[3] ?? 'tr_takvim';
  const year = Number(process.argv[4] ?? 0) || null;
  if (!file) { console.error('kullanim: bun src/scripts/import-fairs.ts <dosya.xlsx> <source> <yil>'); process.exit(1); }

  const wb = XLSX.readFile(file);
  const ws = wb.Sheets[wb.SheetNames[0]!]!;
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null });
  console.log(`\n${file}: ${rows.length} satir okundu (source=${source})`);

  let inserted = 0;
  let skipped = 0;
  const CHUNK = 200;
  const buf: unknown[][] = [];

  const flush = async () => {
    if (!buf.length) return;
    const placeholders = buf.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
    const values = buf.flat();
    // Idempotent: aynı fuar (ad + başlangıç) varsa alanları tazele, çoğaltma.
    const [res] = await pool.query(
      `INSERT INTO fairs
         (id, name, name_en, sector, products, fair_type, country, city, venue, organizer,
          start_date, end_date, date_text, date_status, website, exhibitor_url, email, source, source_year)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         name_en = COALESCE(VALUES(name_en), name_en),
         sector = COALESCE(VALUES(sector), sector),
         products = COALESCE(VALUES(products), products),
         country = COALESCE(VALUES(country), country),
         city = COALESCE(VALUES(city), city),
         venue = COALESCE(VALUES(venue), venue),
         organizer = COALESCE(VALUES(organizer), organizer),
         end_date = COALESCE(VALUES(end_date), end_date),
         date_text = COALESCE(VALUES(date_text), date_text),
         date_status = COALESCE(VALUES(date_status), date_status),
         website = COALESCE(VALUES(website), website),
         email = COALESCE(VALUES(email), email)`,
      values as never[],
    );
    inserted += (res as { affectedRows?: number }).affectedRows ?? 0;
    buf.length = 0;
  };

  for (const row of rows) {
    const name = txt(pick(row, 'ADI', 'Fuar Adı', 'NAME'));
    if (!name) { skipped++; continue; }

    const start = parseDate(pick(row, 'BAŞLAMA', 'Fuar Tarihi'));
    const end = parseDate(pick(row, 'BİTİŞ')) ?? start;

    buf.push([
      randomUUID(),
      name,
      txt(pick(row, 'NAME')),
      txt(pick(row, 'KONUSU', 'Sektör'), 300),
      txt(pick(row, 'BAŞLICA ÜRÜN HİZMET GRUPLARI', 'MAIN PRODUCTS / SERVICE GROUPS'), 2000),
      txt(pick(row, 'TÜRÜ', 'TYPE'), 120),
      txt(pick(row, 'Ülke'), 120) ?? (source === 'tr_takvim' ? 'Türkiye' : null),
      txt(pick(row, 'ŞEHİR', 'Şehir'), 120),
      txt(pick(row, 'YER'), 300),
      txt(pick(row, 'DÜZENLEYİCİ'), 300),
      start,
      end,
      txt(pick(row, 'Fuar Tarihi', 'BAŞLAMA'), 160),
      txt(pick(row, 'Fuar Durumu'), 80),
      txt(pick(row, 'WEB'), 500),
      null,                                   // exhibitor_url — sonradan aranır
      txt(pick(row, 'E-MAIL'), 255),
      source,
      year,
    ]);

    if (buf.length >= CHUNK) await flush();
  }
  await flush();

  const [[stat]] = (await pool.query(
    `SELECT COUNT(*) total, SUM(start_date IS NOT NULL) tarihli, SUM(exhibitor_url IS NOT NULL) katilimci_linkli
       FROM fairs WHERE source = ?`,
    [source],
  )) as unknown as [Array<Record<string, unknown>>];

  console.log(`  yazildi/guncellendi: ${inserted}   atlanan (adsiz): ${skipped}`);
  console.log(`  [${source}] toplam=${stat?.total} tarihli=${stat?.tarihli} katilimci-linkli=${stat?.katilimci_linkli}`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
