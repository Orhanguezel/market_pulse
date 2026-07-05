import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

// Bulk-list send tenant-scoped repo. Her sorgu WHERE tenant_key = ? ile çalışır.
// Tablolar: outreach_recipient_lists, outreach_recipients (028 schema).
// lead_outreach_drafts'a draft üretimi service katmanında yapılır.

export interface RecipientListRow {
  id: string;
  tenant_key: string;
  owner_user_id: string | null;
  campaign_id: string | null;
  name: string;
  source: string;
  status: string;
  total_count: number;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

export interface RecipientRow {
  id: string;
  tenant_key: string;
  owner_user_id: string | null;
  list_id: string;
  email: string;
  name: string | null;
  company: string | null;
  country: string | null;
  custom_fields: Record<string, unknown> | null;
  status: string;
  draft_id: string | null;
  created_at: string;
}

export interface RecipientInput {
  email: string;
  name?: string | null;
  company?: string | null;
  country?: string | null;
  custom_fields?: Record<string, unknown> | null;
}

export interface CreateListInput {
  campaignId?: string | null;
  ownerUserId?: string | null;
  name: string;
  source?: string;
}

function parseRecipientRow(row: RecipientRow): RecipientRow {
  if (typeof row.custom_fields === 'string') {
    try {
      return { ...row, custom_fields: JSON.parse(row.custom_fields) as Record<string, unknown> };
    } catch {
      return { ...row, custom_fields: null };
    }
  }
  return row;
}

export async function createList(tenantKey: string, input: CreateListInput): Promise<RecipientListRow> {
  const id = randomUUID();
  await pool.execute(
    `INSERT INTO outreach_recipient_lists (id, tenant_key, owner_user_id, campaign_id, name, source, status, total_count, sent_count)
     VALUES (?, ?, ?, ?, ?, ?, 'ready', 0, 0)`,
    [id, tenantKey, input.ownerUserId ?? null, input.campaignId ?? null, input.name, input.source ?? 'excel'],
  );
  const list = await getList(tenantKey, id, input.ownerUserId ?? null);
  if (!list) throw new Error('LIST_CREATE_FAILED');
  return list;
}

/** Chunked bulk insert (500/batch) into outreach_recipients. Tenant-scoped via explicit tenant_key column. */
export async function addRecipients(tenantKey: string, listId: string, rows: RecipientInput[], ownerUserId?: string | null): Promise<number> {
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    if (!batch.length) continue;
    const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const values: unknown[] = [];
    for (const r of batch) {
      values.push(
        randomUUID(),
        tenantKey,
        ownerUserId ?? null,
        listId,
        r.email,
        r.name ?? null,
        r.company ?? null,
        r.country ?? null,
        r.custom_fields ? JSON.stringify(r.custom_fields) : null,
        'pending',
      );
    }
    await pool.query(
      `INSERT INTO outreach_recipients
        (id, tenant_key, owner_user_id, list_id, email, name, company, country, custom_fields, status)
       VALUES ${placeholders}`,
      values as never[],
    );
    inserted += batch.length;
  }
  return inserted;
}

function appendOwnerFilter(where: string[], values: unknown[], ownerUserId?: string | null) {
  if (!ownerUserId) return;
  where.push('owner_user_id = ?');
  values.push(ownerUserId);
}

export async function listLists(tenantKey: string, ownerUserId?: string | null): Promise<RecipientListRow[]> {
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  appendOwnerFilter(where, values, ownerUserId);
  const [rows] = await pool.execute(
    `SELECT * FROM outreach_recipient_lists WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 200`,
    values as never[],
  );
  return rows as RecipientListRow[];
}

export async function getList(tenantKey: string, id: string, ownerUserId?: string | null): Promise<RecipientListRow | null> {
  const where = ['tenant_key = ?', 'id = ?'];
  const values: unknown[] = [tenantKey, id];
  appendOwnerFilter(where, values, ownerUserId);
  const [rows] = await pool.execute(
    `SELECT * FROM outreach_recipient_lists WHERE ${where.join(' AND ')} LIMIT 1`,
    values as never[],
  );
  return (rows as RecipientListRow[])[0] ?? null;
}

export async function listRecipients(tenantKey: string, listId: string, status?: string, ownerUserId?: string | null): Promise<RecipientRow[]> {
  const where = ['tenant_key = ?', 'list_id = ?'];
  const values: unknown[] = [tenantKey, listId];
  appendOwnerFilter(where, values, ownerUserId);
  if (status) {
    where.push('status = ?');
    values.push(status);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM outreach_recipients WHERE ${where.join(' AND ')} ORDER BY created_at ASC LIMIT 5000`,
    values as never[],
  );
  return (rows as RecipientRow[]).map(parseRecipientRow);
}

export async function markRecipient(
  tenantKey: string,
  recipientId: string,
  patch: { status?: string; draftId?: string | null },
  ownerUserId?: string | null,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.status !== undefined) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (patch.draftId !== undefined) {
    sets.push('draft_id = ?');
    values.push(patch.draftId);
  }
  if (!sets.length) return;
  const where = ['tenant_key = ?', 'id = ?'];
  values.push(tenantKey, recipientId);
  appendOwnerFilter(where, values, ownerUserId);
  await pool.execute(
    `UPDATE outreach_recipients SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`,
    values as never[],
  );
}

export async function bumpListCounts(
  tenantKey: string,
  listId: string,
  patch: { totalCount?: number; sentCount?: number; sentDelta?: number; status?: string },
  ownerUserId?: string | null,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (patch.totalCount !== undefined) {
    sets.push('total_count = ?');
    values.push(patch.totalCount);
  }
  if (patch.sentCount !== undefined) {
    sets.push('sent_count = ?');
    values.push(patch.sentCount);
  }
  if (patch.sentDelta !== undefined) {
    sets.push('sent_count = sent_count + ?');
    values.push(patch.sentDelta);
  }
  if (patch.status !== undefined) {
    sets.push('status = ?');
    values.push(patch.status);
  }
  if (!sets.length) return;
  const where = ['tenant_key = ?', 'id = ?'];
  values.push(tenantKey, listId);
  appendOwnerFilter(where, values, ownerUserId);
  await pool.execute(
    `UPDATE outreach_recipient_lists SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`,
    values as never[],
  );
}

export async function reconcileListSendStatus(tenantKey: string, listId: string, ownerUserId?: string | null): Promise<void> {
  const where = ['tenant_key = ?', 'list_id = ?'];
  const values: unknown[] = [tenantKey, listId];
  appendOwnerFilter(where, values, ownerUserId);
  const [rows] = await pool.execute(
    `SELECT status, COUNT(*) AS count
     FROM outreach_recipients
     WHERE ${where.join(' AND ')}
     GROUP BY status`,
    values as never[],
  );
  const active = (rows as Array<{ status: string; count: string | number }>).reduce((sum, row) => {
    if (row.status === 'drafted' || row.status === 'queued') return sum + Number(row.count ?? 0);
    return sum;
  }, 0);
  if (active === 0) await bumpListCounts(tenantKey, listId, { status: 'sent' }, ownerUserId ?? null);
}

export async function deleteList(tenantKey: string, id: string, ownerUserId?: string | null): Promise<void> {
  const recipientWhere = ['tenant_key = ?', 'list_id = ?'];
  const recipientValues: unknown[] = [tenantKey, id];
  appendOwnerFilter(recipientWhere, recipientValues, ownerUserId);
  await pool.execute(`DELETE FROM outreach_recipients WHERE ${recipientWhere.join(' AND ')}`, recipientValues as never[]);
  const listWhere = ['tenant_key = ?', 'id = ?'];
  const listValues: unknown[] = [tenantKey, id];
  appendOwnerFilter(listWhere, listValues, ownerUserId);
  await pool.execute(`DELETE FROM outreach_recipient_lists WHERE ${listWhere.join(' AND ')}`, listValues as never[]);
}
