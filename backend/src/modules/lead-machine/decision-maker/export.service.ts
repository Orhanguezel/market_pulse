import type { DecisionMakerRow } from './finder.service';

const EXPORT_COLUMNS: Array<{ key: keyof DecisionMakerRow; label: string }> = [
  { key: 'company_name', label: 'Company Name' },
  { key: 'city', label: 'City' },
  { key: 'business_type', label: 'Business Type' },
  { key: 'decision_maker_name', label: 'Decision Maker Name' },
  { key: 'title', label: 'Title' },
  { key: 'linkedin_profile_url', label: 'LinkedIn Profile URL' },
  { key: 'company_website', label: 'Company Website / Social URL' },
  { key: 'social_url', label: 'Social URL' },
  { key: 'source_url', label: 'Source / Verification URL' },
  { key: 'fit_note', label: 'Fit Note' },
  { key: 'confidence_score', label: 'Confidence Score' },
  { key: 'last_verified_at', label: 'Last Verified At' },
];

function csvCell(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function decisionMakersToCsv(rows: DecisionMakerRow[]) {
  const header = EXPORT_COLUMNS.map((col) => csvCell(col.label)).join(',');
  const body = rows.map((row) => EXPORT_COLUMNS.map((col) => csvCell(row[col.key])).join(',')).join('\n');
  return `\uFEFF${header}\n${body}`;
}

function xmlCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosStamp(date = new Date()) {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function u16(out: number[], value: number) {
  out.push(value & 0xff, (value >>> 8) & 0xff);
}

function u32(out: number[], value: number) {
  out.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function makeZip(files: Array<{ name: string; data: string }>) {
  const encoder = new TextEncoder();
  const out: number[] = [];
  const central: number[] = [];
  const stamp = dosStamp();

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.data);
    const crc = crc32(data);
    const offset = out.length;

    u32(out, 0x04034b50); u16(out, 20); u16(out, 0); u16(out, 0); u16(out, stamp.time); u16(out, stamp.date);
    u32(out, crc); u32(out, data.length); u32(out, data.length); u16(out, name.length); u16(out, 0);
    out.push(...name, ...data);

    u32(central, 0x02014b50); u16(central, 20); u16(central, 20); u16(central, 0); u16(central, 0); u16(central, stamp.time); u16(central, stamp.date);
    u32(central, crc); u32(central, data.length); u32(central, data.length); u16(central, name.length); u16(central, 0); u16(central, 0);
    u16(central, 0); u16(central, 0); u32(central, 0); u32(central, offset);
    central.push(...name);
  }

  const centralOffset = out.length;
  out.push(...central);
  u32(out, 0x06054b50); u16(out, 0); u16(out, 0); u16(out, files.length); u16(out, files.length);
  u32(out, central.length); u32(out, centralOffset); u16(out, 0);
  return Buffer.from(out);
}

function cellRef(colIndex: number, rowIndex: number) {
  let col = '';
  let n = colIndex + 1;
  while (n > 0) {
    const mod = (n - 1) % 26;
    col = String.fromCharCode(65 + mod) + col;
    n = Math.floor((n - mod) / 26);
  }
  return `${col}${rowIndex + 1}`;
}

function worksheetXml(rows: DecisionMakerRow[]) {
  const matrix = [
    EXPORT_COLUMNS.map((col) => col.label),
    ...rows.map((row) => EXPORT_COLUMNS.map((col) => row[col.key] ?? '')),
  ];
  const body = matrix.map((cells, rowIndex) => {
    const cols = cells.map((value, colIndex) => {
      const ref = cellRef(colIndex, rowIndex);
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlCell(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cols}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${body}</sheetData></worksheet>`;
}

export function decisionMakersToXlsx(rows: DecisionMakerRow[]) {
  return makeZip([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Decision Makers" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>' },
    { name: 'xl/worksheets/sheet1.xml', data: worksheetXml(rows) },
  ]);
}
