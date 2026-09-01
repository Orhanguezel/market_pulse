import { pool } from '@/db/client';
import { getActiveTenantKey, getRequiredUserId } from '@/modules/_shared';
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
  products: ['id', 'tenant_key', 'sku', 'name', 'description', 'unit_price', 'currency', 'status', 'owner_user_id', 'raw_data'],
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
    'owner_user_id',
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
    'owner_user_id',
    'raw_data',
  ],
  documents: ['id', 'tenant_key', 'ref_type', 'ref_id', 'title', 'file_url', 'mime_type', 'status', 'owner_user_id', 'raw_data'],
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

// tasks/reminders ek olarak `created_by` de yazar; tum kaynaklar `owner_user_id` alir.
function withOwner(resource: CrmResource, body: Record<string, unknown>): Record<string, unknown> {
  const ownerUserId = getRequiredUserId();
  if (resource === 'tasks' || resource === 'reminders') {
    return { ...body, owner_user_id: ownerUserId, created_by: ownerUserId };
  }
  return { ...body, owner_user_id: ownerUserId };
}

export async function listBusinessRecords(resource: CrmResource, query: ListQuery) {
  const tenantKey = getActiveTenantKey();
  const table = tableByResource[resource];
  // TUM is kayitlari owner-scoped: products/quotes/orders/documents dahil kullaniciya ozel.
  const where = ['tenant_key = ?', 'owner_user_id = ?'];
  const values: unknown[] = [tenantKey, getRequiredUserId()];
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
  const where = ['tenant_key = ?', 'id = ?', 'owner_user_id = ?'];
  const values: unknown[] = [tenantKey, id, getRequiredUserId()];
  const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE ${where.join(' AND ')} LIMIT 1`, values as never[]);
  const row = (rows as Array<Record<string, unknown>>)[0];
  return row ? parseJsonField(row, 'raw_data') : null;
}

export async function createBusinessRecord<T extends CrmResource>(resource: T, body: BodyByResource[T]) {
  const tenantKey = getActiveTenantKey();
  const id = newId();
  const table = tableByResource[resource];
  const columns = insertColumns[resource];
  const normalized: Record<string, unknown> = withOwner(
    resource,
    normalizeBody(resource, body as BodyByResource[CrmResource], true) as Record<string, unknown>,
  );
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

export async function deleteBusinessRecord<T extends CrmResource>(resource: T, id: string) {
  const tenantKey = getActiveTenantKey();
  const table = tableByResource[resource];
  // owner_user_id filtresi ZORUNLU: baskasinin kaydini silmeyi engeller (UNSCOPED-WRITE fixi).
  const where = ['tenant_key = ?', 'id = ?', 'owner_user_id = ?'];
  const values: unknown[] = [tenantKey, id, getRequiredUserId()];
  await pool.execute(`DELETE FROM ${table} WHERE ${where.join(' AND ')}`, values as never[]);
}

export async function updateBusinessRecord<T extends CrmResource>(
  resource: T,
  id: string,
  body: Partial<BodyByResource[T]>,
) {
  const normalized = normalizeBody(resource, body as Partial<BodyByResource[CrmResource]>, false) as Record<string, unknown>;
  // owner_user_id ve created_by ASLA guncellenemez (sahiplik yeniden atama engeli).
  const allowed = new Set(
    insertColumns[resource].filter((column) => column !== 'id' && column !== 'tenant_key' && column !== 'owner_user_id' && column !== 'created_by'),
  );
  const patch = Object.fromEntries(Object.entries(normalized).filter(([key]) => allowed.has(key)));
  const { sets, values } = buildPatchSql(patch);
  if (!sets.length) return getBusinessRecord(resource, id);

  const tenantKey = getActiveTenantKey();
  // owner_user_id filtresi ZORUNLU: baskasinin kaydini guncellemeyi engeller.
  const where = ['tenant_key = ?', 'id = ?', 'owner_user_id = ?'];
  values.push(tenantKey, id, getRequiredUserId());
  const table = tableByResource[resource];
  await pool.execute(`UPDATE ${table} SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`, values as never[]);
  return getBusinessRecord(resource, id);
}
