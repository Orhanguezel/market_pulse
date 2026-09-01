import type { FastifyReply, FastifyRequest, RouteHandler } from 'fastify';
import type { MultipartFile, MultipartValue } from '@fastify/multipart';
import { getActiveTenantKey, getActiveUserId } from '@/modules/_shared';
import { checkAndConsumeDailyUsage } from '@/modules/public-api/quota.repository';
import {
  deleteList,
  getList,
  listLists,
  listRecipients,
} from './bulk-list.repository';
import {
  generateDraftsFromList,
  sendList,
  uploadList,
} from './bulk-list.service';

type FileRequest = FastifyRequest & {
  file?: () => Promise<MultipartFile | undefined>;
};

function fieldStr(fields: Record<string, MultipartValue> | undefined, key: string): string | undefined {
  if (!fields || !fields[key]) return undefined;
  const v = String(fields[key].value).trim();
  return v.length ? v : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function ownerForRequest(req: FastifyRequest): string | null {
  return req.url && !req.url.includes('/admin/') ? getActiveUserId() ?? null : null;
}

/** GET /lead-machine/outreach/lists */
export const listBulkLists: RouteHandler = async (req) => {
  const tenantKey = getActiveTenantKey();
  return listLists(tenantKey, ownerForRequest(req));
};

/** POST /lead-machine/outreach/lists — multipart (file + name + campaignId) */
export const uploadBulkList = async (req: FastifyRequest, reply: FastifyReply) => {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = ownerForRequest(req);
  const mp = await (req as FileRequest).file?.();
  if (!mp) return reply.code(400).send({ error: { message: 'file_required' } });

  const buf = await mp.toBuffer();
  const fields = mp.fields as Record<string, MultipartValue>;
  const name = fieldStr(fields, 'name') ?? mp.filename ?? 'Liste';
  const campaignId = fieldStr(fields, 'campaignId') ?? fieldStr(fields, 'campaign_id') ?? null;
  const filename = mp.filename || 'upload.csv';

  try {
    const result = await uploadList(tenantKey, { campaignId, ownerUserId, name, fileBuffer: buf, filename });
    return reply.code(201).send(result);
  } catch (e) {
    return reply.code(400).send({ error: { message: e instanceof Error ? e.message : 'upload_failed' } });
  }
};

/** GET /lead-machine/outreach/lists/:id */
export const getBulkList = async (req: FastifyRequest, reply: FastifyReply) => {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = ownerForRequest(req);
  const { id } = req.params as { id: string };
  const list = await getList(tenantKey, id, ownerUserId);
  if (!list) return reply.code(404).send({ error: { message: 'not_found' } });
  return list;
};

/** GET /lead-machine/outreach/lists/:id/recipients?status= */
export const listBulkRecipients = async (req: FastifyRequest) => {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = ownerForRequest(req);
  const { id } = req.params as { id: string };
  const { status } = (req.query ?? {}) as { status?: string };
  return listRecipients(tenantKey, id, status, ownerUserId);
};

/** POST /lead-machine/outreach/lists/:id/generate — { subjectTemplate, bodyTemplate } */
export const generateBulkDrafts = async (req: FastifyRequest, reply: FastifyReply) => {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = ownerForRequest(req);
  const { id } = req.params as { id: string };
  const body = asRecord(req.body);
  const subjectTemplate = typeof body.subjectTemplate === 'string' ? body.subjectTemplate : '';
  const bodyTemplate = typeof body.bodyTemplate === 'string' ? body.bodyTemplate : '';
  if (!subjectTemplate || !bodyTemplate) {
    return reply.code(400).send({ error: { message: 'subjectTemplate_and_bodyTemplate_required' } });
  }
  try {
    return await generateDraftsFromList(tenantKey, id, { subjectTemplate, bodyTemplate, ownerUserId });
  } catch (e) {
    return reply.code(400).send({ error: { message: e instanceof Error ? e.message : 'generate_failed' } });
  }
};

/** POST /lead-machine/outreach/lists/:id/send — { ratePerMinute? } */
export const sendBulkList = async (req: FastifyRequest, reply: FastifyReply) => {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = ownerForRequest(req);
  const { id } = req.params as { id: string };
  const body = asRecord(req.body);
  const ratePerMinute = typeof body.ratePerMinute === 'number' ? body.ratePerMinute : undefined;
  try {
    if (ownerUserId) {
      const recipients = await listRecipients(tenantKey, id, 'drafted', ownerUserId);
      const amount = Math.max(1, recipients.filter((recipient) => recipient.draft_id && recipient.email).length);
      const quota = await checkAndConsumeDailyUsage(ownerUserId, 'bulk_email_send', amount);
      if (!quota.allowed) {
        return reply.code(429).send({
          error: { message: 'daily_limit_reached', usage_type: quota.usage_type, plan: quota.quota.plan, daily_limit: quota.quota.daily_limit },
        });
      }
    }
    const result = await sendList(tenantKey, id, { ratePerMinute, ownerUserId });
    return {
      queued: result.queued,
      list_id: result.listId,
      rate_per_minute: result.ratePerMinute,
      queued_count: result.queuedCount,
      bounced: result.bounced,
      total: result.total,
    };
  } catch (e) {
    return reply.code(400).send({ error: { message: e instanceof Error ? e.message : 'send_failed' } });
  }
};

/** DELETE /lead-machine/outreach/lists/:id */
export const deleteBulkList = async (req: FastifyRequest, reply: FastifyReply) => {
  const tenantKey = getActiveTenantKey();
  const ownerUserId = ownerForRequest(req);
  const { id } = req.params as { id: string };
  const list = await getList(tenantKey, id, ownerUserId);
  if (!list) return reply.code(404).send({ error: { message: 'not_found' } });
  await deleteList(tenantKey, id, ownerUserId);
  return reply.code(204).send();
};
