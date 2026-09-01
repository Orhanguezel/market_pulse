import { inflateRawSync } from 'node:zlib';
import type { RecipientInput } from './bulk-list.repository';

// Outreach bulk-list dosya ayrıştırıcı.
// - CSV: native RFC4180-ish parser (import-customs.ts deseni).
// - XLSX: native ZIP (stored/deflate) + sharedStrings/worksheet XML okuyucu —
//   projede ek xlsx bağımlılığı YOK (market modülü bulk-import'u JSON satır alıyor,
//   dosya parse etmiyor). Yeni npm bağımlılığı eklemeden minimal okuyucu.
// Email validasyonu + aynı liste içinde de-dup (ilk görülen kazanır).

export interface ParseResult {
  rows: RecipientInput[];
  total: number;       // dosyadaki geçerli email içeren ham satır sayısı
  invalid: number;     // email'i geçersiz/boş atlanan satır
  duplicates: number;  // tekrar eden email (atlanan)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_RE.test(value.trim());
}

// Bilinen başlık eşlemeleri (büyük/küçük harf + boşluk duyarsız).
const FIELD_ALIASES: Record<string, keyof RecipientInput | 'custom'> = {
  email: 'email',
  'e-mail': 'email',
  mail: 'email',
  'e mail': 'email',
  eposta: 'email',
  'e-posta': 'email',
  name: 'name',
  ad: 'name',
  isim: 'name',
  'ad soyad': 'name',
  'full name': 'name',
  'contact name': 'name',
  company: 'company',
  firma: 'company',
  sirket: 'company',
  'şirket': 'company',
  'company name': 'company',
  country: 'country',
  ulke: 'country',
  'ülke': 'country',
};

/** Minimal RFC4180-ish CSV parser (quoted fields with commas/newlines). */
export function parseCsv(text: string): string[][] {
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
    } else if (c === ',' || c === ';') {
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

// -------------------- XLSX (native ZIP + XML) --------------------

interface ZipEntry { name: string; data: Buffer }

/** Read entries from a ZIP buffer. Supports stored (0) and deflate (8) only. */
function readZip(buffer: Buffer): ZipEntry[] {
  const entries: ZipEntry[] = [];
  // Local file header signature: PK\x03\x04
  let i = 0;
  const SIG = 0x04034b50;
  while (i + 4 <= buffer.length) {
    if (buffer.readUInt32LE(i) !== SIG) {
      // Reached central directory or other section
      break;
    }
    const method = buffer.readUInt16LE(i + 8);
    let compSize = buffer.readUInt32LE(i + 18);
    let uncompSize = buffer.readUInt32LE(i + 22);
    const nameLen = buffer.readUInt16LE(i + 26);
    const extraLen = buffer.readUInt16LE(i + 28);
    const flags = buffer.readUInt16LE(i + 6);
    const nameStart = i + 30;
    const name = buffer.toString('utf8', nameStart, nameStart + nameLen);
    let dataStart = nameStart + nameLen + extraLen;

    // Data descriptor (bit 3): sizes are 0 in header — fall back to central dir scan.
    if ((flags & 0x08) !== 0 && compSize === 0) {
      const dd = findDataDescriptor(buffer, dataStart);
      compSize = dd.compSize;
      uncompSize = dd.uncompSize;
    }

    const compData = buffer.subarray(dataStart, dataStart + compSize);
    let data: Buffer;
    if (method === 0) data = Buffer.from(compData);
    else if (method === 8) data = inflateRawSync(compData);
    else { i = dataStart + compSize; continue; }
    entries.push({ name, data });
    i = dataStart + compSize;
    if ((flags & 0x08) !== 0) i += 16; // skip data descriptor
    void uncompSize;
  }
  return entries;
}

function findDataDescriptor(buffer: Buffer, from: number): { compSize: number; uncompSize: number } {
  // Search for data descriptor signature PK\x07\x08
  const DD = 0x08074b50;
  for (let j = from; j + 16 <= buffer.length; j++) {
    if (buffer.readUInt32LE(j) === DD) {
      return { compSize: buffer.readUInt32LE(j + 8), uncompSize: buffer.readUInt32LE(j + 12) };
    }
  }
  return { compSize: buffer.length - from, uncompSize: 0 };
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m: RegExpExecArray | null;
  while ((m = siRe.exec(xml)) !== null) {
    const inner = m[1];
    // Concatenate all <t> runs (handles rich text <r><t>..</t></r>).
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let text = '';
    let t: RegExpExecArray | null;
    let found = false;
    while ((t = tRe.exec(inner)) !== null) { text += decodeXmlEntities(t[1]); found = true; }
    out.push(found ? text : '');
  }
  return out;
}

function colToIndex(ref: string): number {
  // e.g. "C5" -> 2 (0-based col index)
  const letters = ref.replace(/[0-9]+/g, '');
  let n = 0;
  for (let k = 0; k < letters.length; k++) {
    n = n * 26 + (letters.charCodeAt(k) - 64);
  }
  return n - 1;
}

function parseWorksheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(xml)) !== null) {
    const rowXml = rm[1];
    const cells: string[] = [];
    const cellRe = /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cm: RegExpExecArray | null;
    while ((cm = cellRe.exec(rowXml)) !== null) {
      const attrs = cm[1];
      const body = cm[2] ?? '';
      const refMatch = /r="([A-Z]+\d+)"/.exec(attrs);
      const typeMatch = /t="([^"]+)"/.exec(attrs);
      const colIdx = refMatch ? colToIndex(refMatch[1]) : cells.length;
      const type = typeMatch ? typeMatch[1] : '';
      let value = '';
      if (type === 's') {
        const vm = /<v>([\s\S]*?)<\/v>/.exec(body);
        if (vm) value = shared[Number(vm[1])] ?? '';
      } else if (type === 'inlineStr') {
        const im = /<t[^>]*>([\s\S]*?)<\/t>/.exec(body);
        if (im) value = decodeXmlEntities(im[1]);
      } else {
        const vm = /<v>([\s\S]*?)<\/v>/.exec(body);
        if (vm) value = decodeXmlEntities(vm[1]);
      }
      while (cells.length < colIdx) cells.push('');
      cells[colIdx] = value;
    }
    rows.push(cells);
  }
  return rows;
}

export function parseXlsx(buffer: Buffer): string[][] {
  const entries = readZip(buffer);
  const byName = new Map(entries.map((e) => [e.name, e.data]));
  const sharedBuf = byName.get('xl/sharedStrings.xml');
  const shared = sharedBuf ? parseSharedStrings(sharedBuf.toString('utf8')) : [];
  // First worksheet (sheet1 by convention).
  let sheetEntry = byName.get('xl/worksheets/sheet1.xml');
  if (!sheetEntry) {
    const firstSheet = entries.find((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name));
    sheetEntry = firstSheet?.data;
  }
  if (!sheetEntry) throw new Error('XLSX_NO_WORKSHEET');
  return parseWorksheet(sheetEntry.toString('utf8'), shared);
}

// -------------------- header mapping + row → recipient --------------------

function buildRowsFromMatrix(matrix: string[][]): ParseResult {
  if (!matrix.length) return { rows: [], total: 0, invalid: 0, duplicates: 0 };
  const header = matrix[0].map((h) => (h ?? '').trim().toLowerCase());

  // Map each column index to a known field or 'custom:<header>'.
  const colMap: Array<{ field: keyof RecipientInput | 'custom'; key: string }> = header.map((h) => {
    const mapped = FIELD_ALIASES[h];
    if (mapped && mapped !== 'custom') return { field: mapped, key: h };
    return { field: 'custom', key: h || '' };
  });

  const seen = new Set<string>();
  const rows: RecipientInput[] = [];
  let total = 0;
  let invalid = 0;
  let duplicates = 0;

  for (let r = 1; r < matrix.length; r++) {
    const cols = matrix[r];
    if (!cols || cols.every((c) => (c ?? '').trim() === '')) continue;

    let email: string | null = null;
    let name: string | null = null;
    let company: string | null = null;
    let country: string | null = null;
    const custom: Record<string, unknown> = {};

    for (let c = 0; c < colMap.length; c++) {
      const raw = (cols[c] ?? '').trim();
      if (!raw) continue;
      const m = colMap[c];
      if (m.field === 'email') email = raw;
      else if (m.field === 'name') name = raw;
      else if (m.field === 'company') company = raw;
      else if (m.field === 'country') country = raw;
      else if (m.field === 'custom' && m.key) custom[m.key] = raw;
    }

    total += 1;
    if (!isValidEmail(email)) { invalid += 1; continue; }
    const normEmail = email!.trim().toLowerCase();
    if (seen.has(normEmail)) { duplicates += 1; continue; }
    seen.add(normEmail);

    rows.push({
      email: email!.trim(),
      name,
      company,
      country,
      custom_fields: Object.keys(custom).length ? custom : null,
    });
  }

  return { rows, total, invalid, duplicates };
}

export function parseRecipientFile(buffer: Buffer, filename: string): ParseResult {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'xlsx' || ext === 'xlsm') {
    return buildRowsFromMatrix(parseXlsx(buffer));
  }
  // CSV / txt fallback.
  return buildRowsFromMatrix(parseCsv(buffer.toString('utf8')));
}
