import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pool } from '@/db/client';

type InputRow = Record<string, unknown>;

function argValue(name: string) {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function cell(row: InputRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return null;
}

function parseCsv(text: string): InputRow[] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(current.trim());
      current = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);

  const [headers = [], ...body] = rows;
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ''])));
}

async function loadRows(path: string) {
  const text = await readFile(path, 'utf8');
  if (path.endsWith('.json')) {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) throw new Error('JSON input must be an array');
    return parsed.filter((row): row is InputRow => row !== null && typeof row === 'object');
  }
  return parseCsv(text);
}

async function ensureImportJob(jobId: string, file: string) {
  await pool.execute(
    `INSERT IGNORE INTO lead_search_jobs (id, channel, status, icp_id, params, result_count, created_by)
     VALUES (?, 'trade_fair_in_person', 'done', NULL, ?, 0, NULL)`,
    [jobId, JSON.stringify({ source: 'fair_card_import', file })],
  );
}

async function candidateExists(input: { name: string; email: string | null; website: string | null }) {
  const where: string[] = [];
  const values: unknown[] = [];
  if (input.email) {
    where.push('email = ?');
    values.push(input.email);
  }
  if (input.website) {
    where.push('website = ?');
    values.push(input.website);
  }
  where.push('name = ?');
  values.push(input.name);
  const [rows] = await pool.execute(
    `SELECT id FROM lead_candidates WHERE channel IN ('trade_fair', 'trade_fair_in_person') AND (${where.join(' OR ')}) LIMIT 1`,
    values as never[],
  );
  return (rows as unknown[]).length > 0;
}

async function main() {
  const file = argValue('file');
  if (!file) throw new Error('Usage: bun src/scripts/import-fair-in-person-leads.ts --file=/path/cards.csv [--job-id=uuid]');
  const jobId = argValue('job-id') || randomUUID();
  const rows = await loadRows(file);
  await ensureImportJob(jobId, file);

  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const name = cell(row, 'name', 'company', 'firma', 'firma_adi');
    if (!name) {
      skipped += 1;
      continue;
    }
    const email = cell(row, 'email', 'e_mail', 'mail');
    const website = cell(row, 'website', 'web', 'url');
    if (await candidateExists({ name, email, website })) {
      skipped += 1;
      continue;
    }
    const rawData = {
      source: 'fair_card_import',
      imported_at: new Date().toISOString(),
      card: row,
      fair_info: {
        fair_name: 'Automechanika Frankfurt 2026',
        booth_number: cell(row, 'booth', 'stand', 'hall_booth'),
        qr_url: cell(row, 'qr_url', 'qr', 'form_url'),
      },
    };
    await pool.execute(
      `INSERT INTO lead_candidates
        (id, job_id, channel, icp_id, name, website, country, city, phone, email, contact_name, raw_data, ai_summary, lead_score, decision)
       VALUES (?, ?, 'trade_fair_in_person', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'candidate')`,
      [
        randomUUID(),
        jobId,
        name,
        website,
        cell(row, 'country', 'ulke'),
        cell(row, 'city', 'sehir'),
        cell(row, 'phone', 'telefon', 'tel'),
        email,
        cell(row, 'contact_name', 'contact', 'person', 'ilgili'),
        JSON.stringify(rawData),
        cell(row, 'notes', 'notlar', 'note') || 'Fuar kartvizit/QR import.',
      ],
    );
    inserted += 1;
  }

  await pool.execute('UPDATE lead_search_jobs SET result_count = ? WHERE id = ?', [inserted, jobId]);
  console.log(JSON.stringify({ ok: true, job_id: jobId, inserted, skipped, total: rows.length }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
