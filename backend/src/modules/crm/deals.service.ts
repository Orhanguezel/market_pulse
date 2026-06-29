import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { DealBody, ListQuery } from './schema';
import { buildPatchSql, jsonOrNull, newId, parseJsonField } from './utils';
import { getDefaultPipelineAndStage } from './pipelines.service';

export async function listDeals(query: ListQuery & { stage_id?: string; account_id?: string }) {
  const tenantKey = getActiveTenantKey();
  const where = ['d.tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (query.status) {
    where.push('d.status = ?');
    values.push(query.status);
  }
  if (query.stage_id) {
    where.push('d.stage_id = ?');
    values.push(query.stage_id);
  }
  if (query.account_id) {
    where.push('d.account_id = ?');
    values.push(query.account_id);
  }
  const [rows] = await pool.execute(
    `SELECT d.*, a.name AS account_name, c.email AS contact_email, s.name AS stage_name, p.name AS pipeline_name
       FROM crm_deals d
       LEFT JOIN crm_accounts a ON a.id = d.account_id AND a.tenant_key = d.tenant_key
       LEFT JOIN crm_contacts c ON c.id = d.contact_id AND c.tenant_key = d.tenant_key
       JOIN crm_stages s ON s.id = d.stage_id AND s.tenant_key = d.tenant_key
       JOIN crm_pipelines p ON p.id = d.pipeline_id AND p.tenant_key = d.tenant_key
      WHERE ${where.join(' AND ')}
      ORDER BY d.created_at DESC
      LIMIT ${query.limit} OFFSET ${query.offset}`,
    values as never[],
  );
  return (rows as Array<Record<string, unknown>>).map((row) => parseJsonField(row, 'raw_data'));
}

export async function getDeal(id: string) {
  const tenantKey = getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM crm_deals WHERE tenant_key = ? AND id = ? LIMIT 1', [tenantKey, id]);
  const row = (rows as Array<Record<string, unknown>>)[0];
  return row ? parseJsonField(row, 'raw_data') : null;
}

export async function createDeal(body: DealBody & { source_lead_id?: string | null }) {
  const tenantKey = getActiveTenantKey();
  const id = newId();
  const defaults = await getDefaultPipelineAndStage({ pipelineId: body.pipeline_id, stageId: body.stage_id });
  await pool.execute(
    `INSERT INTO crm_deals
      (id, tenant_key, account_id, contact_id, pipeline_id, stage_id, title, amount, currency, expected_close_date, owner_user_id, status, lost_reason, source_lead_id, raw_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tenantKey,
      body.account_id ?? null,
      body.contact_id ?? null,
      defaults.pipelineId,
      defaults.stageId,
      body.title,
      body.amount ?? null,
      body.currency ?? 'USD',
      body.expected_close_date ?? null,
      body.owner_user_id ?? null,
      body.status ?? 'open',
      body.lost_reason ?? null,
      body.source_lead_id ?? null,
      jsonOrNull(body.raw_data),
    ],
  );
  return getDeal(id);
}

export async function updateDeal(id: string, body: Partial<DealBody>) {
  const patch = {
    ...body,
    raw_data: body.raw_data === undefined ? undefined : jsonOrNull(body.raw_data),
  };
  const { sets, values } = buildPatchSql(patch);
  if (!sets.length) return getDeal(id);
  const tenantKey = getActiveTenantKey();
  values.push(tenantKey, id);
  await pool.execute(`UPDATE crm_deals SET ${sets.join(', ')} WHERE tenant_key = ? AND id = ?`, values as never[]);
  return getDeal(id);
}

export async function moveDealStage(id: string, stageId: string) {
  const tenantKey = getActiveTenantKey();
  const [stageRows] = await pool.execute(
    'SELECT pipeline_id, is_won, is_lost FROM crm_stages WHERE tenant_key = ? AND id = ? LIMIT 1',
    [tenantKey, stageId],
  );
  const stage = (stageRows as Array<{ pipeline_id: string; is_won: number; is_lost: number }>)[0];
  if (!stage) return null;
  const status = stage.is_won ? 'won' : stage.is_lost ? 'lost' : 'open';
  await pool.execute(
    'UPDATE crm_deals SET pipeline_id = ?, stage_id = ?, status = ? WHERE tenant_key = ? AND id = ?',
    [stage.pipeline_id, stageId, status, tenantKey, id],
  );
  return getDeal(id);
}
