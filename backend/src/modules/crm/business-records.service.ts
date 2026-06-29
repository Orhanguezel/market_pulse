import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { DocumentBody, ListQuery, OrderBody, ProductBody, QuoteBody, ReminderBody, TaskBody } from './schema';
import { buildPatchSql, jsonOrNull, newId, parseJsonField } from './utils';

type CrmResource = 'products' | 'quotes' | 'orders' | 'documents' | 'tasks' | 'reminders';
type BodyByResource = {
  products: ProductBody;
  quotes: QuoteBody;
  orders: OrderBody;
  documents: DocumentBody;
  tasks: TaskBody;
  reminders: ReminderBody;
};

const tableByResource: Record<CrmResource, string> = {
  products: 'crm_products',
  quotes: 'crm_quotes',
  orders: 'crm_orders',
  documents: 'crm_documents',
  tasks: 'crm_tasks',
  reminders: 'crm_reminders',
};

const insertColumns: Record<CrmResource, string[]> = {
  products: ['id', 'tenant_key', 'sku', 'name', 'description', 'unit_price', 'currency', 'status', 'raw_data'],
  quotes: [
    'id',
    'tenant_key',
    'deal_id',
    'account_id',
    'contact_id',
    'quote_no',
    'title',
    'amount',
    'currency',
    'status',
    'valid_until',
    'sent_at',
    'accepted_at',
    'raw_data',
  ],
  orders: [
    'id',
    'tenant_key',
    'quote_id',
    'deal_id',
    'account_id',
    'contact_id',
    'order_no',
    'title',
    'amount',
    'currency',
    'status',
    'ordered_at',
    'raw_data',
  ],
  documents: ['id', 'tenant_key', 'ref_type', 'ref_id', 'title', 'file_url', 'mime_type', 'status', 'raw_data'],
  tasks: [
    'id',
    'tenant_key',
    'ref_type',
    'ref_id',
    'subject',
    'body',
    'due_at',
    'priority',
    'status',
    'owner_user_id',
    'created_by',
    'completed_at',
    'raw_data',
  ],
  reminders: [
    'id',
    'tenant_key',
    'ref_type',
    'ref_id',
    'title',
    'body',
    'remind_at',
    'channel',
    'status',
    'owner_user_id',
    'created_by',
    'sent_at',
    'snoozed_until',
    'raw_data',
  ],
};

function hasOwn(body: object, key: string) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function withJson(body: Record<string, unknown>) {
  return hasOwn(body, 'raw_data') ? { ...body, raw_data: jsonOrNull(body.raw_data) } : body;
}

function normalizeBody(resource: CrmResource, body: Partial<BodyByResource[CrmResource]>, applyDefaults: boolean) {
  if (resource === 'products') {
    const value = withJson(body as Record<string, unknown>);
    return applyDefaults ? { ...value, currency: value.currency ?? 'USD', status: value.status ?? 'active' } : value;
  }
  if (resource === 'quotes') {
    const value = withJson(body as Record<string, unknown>);
    return applyDefaults ? { ...value, currency: value.currency ?? 'USD', status: value.status ?? 'draft' } : value;
  }
  if (resource === 'orders') {
    const value = withJson(body as Record<string, unknown>);
    return applyDefaults ? { ...value, currency: value.currency ?? 'USD', status: value.status ?? 'draft' } : value;
  }
  if (resource === 'documents') {
    const value = withJson(body as Record<string, unknown>);
    return applyDefaults ? { ...value, status: value.status ?? 'active' } : value;
  }
  if (resource === 'reminders') {
    const value = withJson(body as Record<string, unknown>);
    return applyDefaults ? { ...value, channel: value.channel ?? 'in_app', status: value.status ?? 'scheduled' } : value;
  }
  const value = withJson(body as Record<string, unknown>);
  return applyDefaults ? { ...value, priority: value.priority ?? 'normal', status: value.status ?? 'open' } : value;
}

export async function listBusinessRecords(resource: CrmResource, query: ListQuery) {
  const tenantKey = getActiveTenantKey();
  const table = tableByResource[resource];
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (query.status) {
    where.push('status = ?');
    values.push(query.status);
  }

  const [rows] = await pool.execute(
    `SELECT * FROM ${table} WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ${query.limit} OFFSET ${query.offset}`,
    values as never[],
  );
  return (rows as Array<Record<string, unknown>>).map((row) => parseJsonField(row, 'raw_data'));
}

export async function getBusinessRecord(resource: CrmResource, id: string) {
  const tenantKey = getActiveTenantKey();
  const table = tableByResource[resource];
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE tenant_key = ? AND id = ? LIMIT 1`, [tenantKey, id]);
  const row = (rows as Array<Record<string, unknown>>)[0];
  return row ? parseJsonField(row, 'raw_data') : null;
}

export async function createBusinessRecord<T extends CrmResource>(resource: T, body: BodyByResource[T]) {
  const tenantKey = getActiveTenantKey();
  const id = newId();
  const table = tableByResource[resource];
  const columns = insertColumns[resource];
  const normalized = normalizeBody(resource, body as BodyByResource[CrmResource], true) as Record<string, unknown>;
  const values = columns.map((column) => {
    if (column === 'id') return id;
    if (column === 'tenant_key') return tenantKey;
    return normalized[column] ?? null;
  });
  const placeholders = columns.map(() => '?').join(', ');
  await pool.execute(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
    values as never[],
  );

  return getBusinessRecord(resource, id);
}

export async function updateBusinessRecord<T extends CrmResource>(
  resource: T,
  id: string,
  body: Partial<BodyByResource[T]>,
) {
  const normalized = normalizeBody(resource, body as Partial<BodyByResource[CrmResource]>, false) as Record<string, unknown>;
  const allowed = new Set(insertColumns[resource].filter((column) => column !== 'id' && column !== 'tenant_key'));
  const patch = Object.fromEntries(Object.entries(normalized).filter(([key]) => allowed.has(key)));
  const { sets, values } = buildPatchSql(patch);
  if (!sets.length) return getBusinessRecord(resource, id);

  const tenantKey = getActiveTenantKey();
  values.push(tenantKey, id);
  const table = tableByResource[resource];
  await pool.execute(`UPDATE ${table} SET ${sets.join(', ')} WHERE tenant_key = ? AND id = ?`, values as never[]);
  return getBusinessRecord(resource, id);
}
