import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

export interface OutreachCampaign {
  id: string;
  slug: string;
  name: string;
  is_active: number;

  brand_name: string;
  brand_short: string;
  brand_legal: string | null;
  sender_label: string;
  sender_name: string | null;
  sender_title: string | null;
  sender_email: string;
  reply_to_email: string | null;
  sender_phone: string | null;
  sender_office: string | null;
  sender_website: string | null;
  sender_address: string | null;

  product_en: string;
  product_de: string | null;
  product_tr: string | null;

  fair_name: string | null;
  fair_edition: string | null;
  fair_dates_en: string | null;
  fair_dates_de: string | null;
  fair_dates_tr: string | null;
  fair_hall: string | null;
  fair_booth: string | null;
  fair_url: string | null;

  calendly_link: string | null;
  calendly_placeholder: string | null;

  icp_id: string | null;
  default_lang: string;
  country_to_lang: unknown;

  created_at: string;
  updated_at: string;
}

export type OutreachCampaignInput = Partial<Omit<OutreachCampaign, 'id' | 'created_at' | 'updated_at'>>;

function parseRow(row: OutreachCampaign): OutreachCampaign {
  if (typeof row.country_to_lang === 'string') {
    try {
      return { ...row, country_to_lang: JSON.parse(row.country_to_lang) };
    } catch {
      return row;
    }
  }
  return row;
}

export async function listCampaigns() {
  const [rows] = await pool.execute(
    'SELECT * FROM outreach_campaigns ORDER BY is_active DESC, updated_at DESC',
  );
  return (rows as OutreachCampaign[]).map(parseRow);
}

export async function getCampaign(id: string) {
  const [rows] = await pool.execute(
    'SELECT * FROM outreach_campaigns WHERE id = ? LIMIT 1',
    [id],
  );
  const row = (rows as OutreachCampaign[])[0];
  return row ? parseRow(row) : null;
}

export async function getCampaignBySlug(slug: string) {
  const [rows] = await pool.execute(
    'SELECT * FROM outreach_campaigns WHERE slug = ? LIMIT 1',
    [slug],
  );
  const row = (rows as OutreachCampaign[])[0];
  return row ? parseRow(row) : null;
}

type ColumnKey = keyof OutreachCampaignInput;

const COLUMNS: ColumnKey[] = [
  'slug', 'name', 'is_active',
  'brand_name', 'brand_short', 'brand_legal',
  'sender_label', 'sender_name', 'sender_title',
  'sender_email', 'reply_to_email', 'sender_phone', 'sender_office',
  'sender_website', 'sender_address',
  'product_en', 'product_de', 'product_tr',
  'fair_name', 'fair_edition',
  'fair_dates_en', 'fair_dates_de', 'fair_dates_tr',
  'fair_hall', 'fair_booth', 'fair_url',
  'calendly_link', 'calendly_placeholder',
  'icp_id', 'default_lang', 'country_to_lang',
];

function serializeValue(key: ColumnKey, value: unknown): unknown {
  if (key === 'country_to_lang') {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }
  if (key === 'is_active') {
    return value ? 1 : 0;
  }
  return value ?? null;
}

export async function createCampaign(input: OutreachCampaignInput) {
  const id = randomUUID();
  const cols: string[] = ['id'];
  const placeholders: string[] = ['?'];
  const values: unknown[] = [id];

  for (const col of COLUMNS) {
    if (input[col] !== undefined) {
      cols.push(col);
      placeholders.push('?');
      values.push(serializeValue(col, input[col]));
    }
  }

  await pool.execute(
    `INSERT INTO outreach_campaigns (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values as never[],
  );
  return getCampaign(id);
}

export async function updateCampaign(id: string, input: OutreachCampaignInput) {
  const sets: string[] = [];
  const values: unknown[] = [];

  for (const col of COLUMNS) {
    if (input[col] !== undefined) {
      sets.push(`${col} = ?`);
      values.push(serializeValue(col, input[col]));
    }
  }

  if (sets.length === 0) return getCampaign(id);
  values.push(id);
  await pool.execute(
    `UPDATE outreach_campaigns SET ${sets.join(', ')} WHERE id = ?`,
    values as never[],
  );
  return getCampaign(id);
}

export async function deleteCampaign(id: string) {
  await pool.execute('DELETE FROM outreach_campaigns WHERE id = ?', [id]);
}
