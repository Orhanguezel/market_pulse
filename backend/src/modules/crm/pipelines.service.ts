import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { PipelineBody } from './schema';
import { newId } from './utils';

export async function listPipelines() {
  const tenantKey = getActiveTenantKey();
  const [rows] = await pool.execute('SELECT * FROM crm_pipelines WHERE tenant_key = ? ORDER BY sort ASC, created_at ASC', [tenantKey]);
  return rows;
}

export async function listStages(pipelineId?: string) {
  const tenantKey = getActiveTenantKey();
  const [rows] = pipelineId
    ? await pool.execute('SELECT * FROM crm_stages WHERE tenant_key = ? AND pipeline_id = ? ORDER BY sort ASC', [tenantKey, pipelineId])
    : await pool.execute('SELECT * FROM crm_stages WHERE tenant_key = ? ORDER BY pipeline_id ASC, sort ASC', [tenantKey]);
  return rows;
}

export async function getDefaultPipelineAndStage(opts: { pipelineId?: string; stageId?: string } = {}) {
  const tenantKey = getActiveTenantKey();
  let pipelineId = opts.pipelineId;
  if (!pipelineId) {
    const [pipelines] = await pool.execute(
      'SELECT id FROM crm_pipelines WHERE tenant_key = ? ORDER BY is_default DESC, sort ASC LIMIT 1',
      [tenantKey],
    );
    pipelineId = (pipelines as Array<{ id: string }>)[0]?.id;
  }
  if (!pipelineId) throw new Error('CRM_PIPELINE_NOT_FOUND');

  let stageId = opts.stageId;
  if (!stageId) {
    const [stages] = await pool.execute(
      'SELECT id FROM crm_stages WHERE tenant_key = ? AND pipeline_id = ? ORDER BY sort ASC LIMIT 1',
      [tenantKey, pipelineId],
    );
    stageId = (stages as Array<{ id: string }>)[0]?.id;
  }
  if (!stageId) throw new Error('CRM_STAGE_NOT_FOUND');

  return { pipelineId, stageId };
}

export async function createPipeline(body: PipelineBody) {
  const tenantKey = getActiveTenantKey();
  const id = newId();
  if (body.is_default) {
    await pool.execute('UPDATE crm_pipelines SET is_default = 0 WHERE tenant_key = ?', [tenantKey]);
  }
  await pool.execute(
    `INSERT INTO crm_pipelines (id, tenant_key, name, is_default, sort)
     VALUES (?, ?, ?, ?, ?)`,
    [id, tenantKey, body.name, body.is_default ? 1 : 0, body.sort ?? 100],
  );
  return { id, tenant_key: tenantKey, ...body };
}
