/**
 * Gümrük veri lake'ine XLSX konşimento dosyası ekler (customs_records).
 *
 * Beklenen kolonlar (EXIMPEDIA "Car Mat World" formatı):
 *   CONSIGNEE_NAME_EN | SHIPPER_NAME_EN | HS_CODE | HS_CODE_DESCRIPTION
 *   ORIGIN_COUNTRY | DESTINATION_COUNTRY | DATE | Total Value USD | Total Quantity | NET_WEIGHT
 *
 * LEAD = CONSIGNEE (ithalatçı firma). DESTINATION_COUNTRY = alıcının ülkesi.
 *
 * HS_CODE_DESCRIPTION bu dosyalarda çoğu satırda boş. Dosya zaten tek bir ürün
 * evreninin (paspas) konşimentoları olduğu için boş açıklamalar --product etiketiyle
 * doldurulur; aksi halde ürün araması bu satırları hiç bulamaz.
 *
 * Idempotent: UNIQUE(source_file, source_row_number) — aynı dosya iki kez çalıştırılırsa
 * satırlar tekrar eklenmez (INSERT IGNORE).
 *
 * Kullanım:
 *   bun src/scripts/import-customs-xlsx.ts "../Car Mat World.xlsx" --product "CAR MAT"
 */
import { basename } from 'node:path';
import xlsx from 'xlsx';
import { pool } from '@/db/client';
import { bulkInsertRecords, rebuildCustomsLookups, type CustomsRecordInput } from '@/modules/lead-machine/customs/customs.repository';

const BATCH = 5000;

function arg(name: string, fallback = ''): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

/** Kolon adı varyasyonlarına dayanıklı hücre okuma. */
function pick(row: Record<string, unknown>, ...names: string[]): unknown {
  const keys = Object.keys(row);
  for (const name of names) {
    const want = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hit = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === want);
    if (hit !== undefined && row[hit] !== null && String(row[hit]).trim() !== '') return row[hit];
  }
  return null;
}

function text(v: unknown, max = 500): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Excel seri tarihi (45444) veya metin tarihi → "Aug 2024". */
function monthYear(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && v > 20000 && v < 60000) {
    // Excel epoch: 1899-12-30
    const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  }
  const d = new Date(String(v));
  if (!Number.isNaN(d.getTime())) return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return text(v, 50);
}

/** Excel seri tarihi veya tarih metni -> MySQL DATE. */
function shipmentDate(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  const d = typeof v === 'number' && v > 20000 && v < 60000
    ? new Date(Date.UTC(1899, 11, 30) + v * 864e5)
    : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** "CN, CHINA" / "USA" → "USA" (ülke adı kısmı). */
function country(v: unknown): string | null {
  const s = text(v, 100);
  if (!s) return null;
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  return (parts[1] ?? parts[0] ?? '').slice(0, 100) || null;
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith('--')) {
    console.error('Kullanim: bun src/scripts/import-customs-xlsx.ts <dosya.xlsx> [--product "CAR MAT"]');
    process.exit(1);
  }
  const productLabel = arg('product', 'CAR MAT');
  const sourceProvider = arg('provider', 'EXIMPEDIA');
  const sourceFile = basename(file);

  console.log(`[customs] okunuyor: ${sourceFile}`);
  const wb = xlsx.readFile(file);
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]!]!, { defval: null });
  console.log(`[customs] ${rows.length} satir | bos aciklamalar "${productLabel}" ile etiketlenecek`);

  let batch: CustomsRecordInput[] = [];
  let inserted = 0;
  let noBuyer = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i]!;
    const buyer = text(pick(r, 'CONSIGNEE_NAME_EN', 'CONSIGNEE_NAME', 'BUYER_NAME', 'IMPORTER'));
    if (!buyer) { noBuyer += 1; continue; } // alıcısı olmayan satır lead üretemez

    batch.push({
      hsCode: text(pick(r, 'HS_CODE', 'HSCODE', 'GTIP'), 20),
      hsDescription: text(pick(r, 'HS_CODE_DESCRIPTION', 'HS_DESCRIPTION', 'DESCRIPTION')) ?? productLabel,
      buyerName: buyer,
      exporterName: text(pick(r, 'SHIPPER_NAME_EN', 'SHIPPER_NAME', 'EXPORTER_NAME', 'EXPORTER')),
      originCountry: country(pick(r, 'ORIGIN_COUNTRY', 'EXPORTER_COUNTRY', 'SHIPPER_COUNTRY')),
      buyerCountry: country(pick(r, 'DESTINATION_COUNTRY', 'BUYER_COUNTRY', 'IMPORTER_COUNTRY')),
      totalValue: num(pick(r, 'Total Value USD', 'TOTAL_VALUE', 'VALUE')),
      totalQuantity: num(pick(r, 'Total Quantity', 'TOTAL_QUANTITY', 'QUANTITY')),
      netWeight: num(pick(r, 'NET_WEIGHT', 'NET WEIGHT', 'WEIGHT')),
      shipmentDate: shipmentDate(pick(r, 'DATE', 'SHIPMENT_DATE', 'PERIOD')),
      monthYear: monthYear(pick(r, 'DATE', 'MONTH_YEAR', 'PERIOD')),
      sourceProvider,
      sourceRowNumber: i + 2, // 1 = başlık satırı
    });

    if (batch.length >= BATCH) {
      inserted += await bulkInsertRecords(batch, sourceFile);
      batch = [];
      console.log(`[customs] ${i + 1}/${rows.length} islendi — eklenen: ${inserted}`);
    }
  }
  if (batch.length) inserted += await bulkInsertRecords(batch, sourceFile);
  console.log(`[customs] TAMAMLANDI — eklenen: ${inserted}, alicisi bos atlanan: ${noBuyer}`);

  // Arama sözlükleri tazelenmezse yeni kayıtlar ürün aramasında görünmez.
  console.log('[customs] arama sozlukleri tazeleniyor…');
  const lookup = await rebuildCustomsLookups();
  console.log(`[customs] sozluk hazir — aciklama: ${lookup.descriptions}, ihracatci: ${lookup.exporters}`);
  process.exit(0);
}

void main();
