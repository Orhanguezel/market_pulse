import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import {
  addRecipients,
  bumpListCounts,
  createList,
  getList,
  listRecipients,
  markRecipient,
  type RecipientRow,
  type RecipientListRow,
} from './bulk-list.repository';
import { parseRecipientFile } from './bulk-list.parser';
import { assertMailQueueAvailable, enqueueBulkRecipientEmails } from './mail-queue';

// Outreach bulk-list servisi: ince katman. Mevcut gönderim/tracking AYNEN kullanılır.
// lead_outreach_drafts'a candidate_id/market_lead_id NULL, recipient_* set ile draft yazar.

export interface UploadResult {
  list: RecipientListRow;
  inserted: number;
  invalid: number;
  duplicates: number;
}

export interface GenerateResult {
  listId: string;
  generated: number;
  skipped: number;
  draftIds: string[];
}

export interface SendResult {
  listId: string;
  queued: boolean;
  queuedCount: number;
  bounced: number;
  total: number;
  ratePerMinute: number;
}

/** {{name}} / {{company}} / {{country}} + custom_fields anahtarlarını değerle değiştirir. */
export function substitutePlaceholders(
  template: string,
  vars: Record<string, string | null | undefined>,
): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => {
    const v = vars[key];
    return v === null || v === undefined ? '' : String(v);
  });
}

export async function uploadList(
  tenantKey: string,
  opts: { campaignId?: string | null; ownerUserId?: string | null; name: string; fileBuffer: Buffer; filename: string },
): Promise<UploadResult> {
  const parsed = parseRecipientFile(opts.fileBuffer, opts.filename);
  const ext = opts.filename.toLowerCase().split('.').pop() ?? '';
  const source = ext === 'xlsx' || ext === 'xlsm' ? 'excel' : 'csv';

  const list = await createList(tenantKey, {
    campaignId: opts.campaignId ?? null,
    ownerUserId: opts.ownerUserId ?? null,
    name: opts.name,
    source,
  });

  let inserted = 0;
  if (parsed.rows.length) {
    inserted = await addRecipients(tenantKey, list.id, parsed.rows, opts.ownerUserId ?? null);
  }
  await bumpListCounts(tenantKey, list.id, { totalCount: inserted }, opts.ownerUserId ?? null);
  const refreshed = (await getList(tenantKey, list.id, opts.ownerUserId ?? null)) ?? list;

  return { list: refreshed, inserted, invalid: parsed.invalid, duplicates: parsed.duplicates };
}

export async function generateDraftsFromList(
  tenantKey: string,
  listId: string,
  opts: { subjectTemplate: string; bodyTemplate: string; ownerUserId?: string | null },
): Promise<GenerateResult> {
  const list = await getList(tenantKey, listId, opts.ownerUserId ?? null);
  if (!list) throw new Error('LIST_NOT_FOUND');

  const recipients = await listRecipients(tenantKey, listId, 'pending', opts.ownerUserId ?? null);
  const draftIds: string[] = [];
  let generated = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    if (!recipient.email) { skipped += 1; continue; }
    const vars: Record<string, string | null | undefined> = {
      name: recipient.name,
      company: recipient.company,
      country: recipient.country,
      email: recipient.email,
      ...(recipient.custom_fields ?? {}) as Record<string, string>,
    };

    const subject = substitutePlaceholders(opts.subjectTemplate, vars);
    const body = substitutePlaceholders(opts.bodyTemplate, vars);

    const draftId = randomUUID();
    // Pipeline'sız (candidate_id/market_lead_id NULL) bulk draft. recipient_* set.
    await pool.execute(
      `INSERT INTO lead_outreach_drafts
        (id, tenant_key, owner_user_id, candidate_id, market_lead_id, campaign_id,
         recipient_list_id, recipient_email, recipient_name, subject, body, status)
       VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        draftId,
        tenantKey,
        opts.ownerUserId ?? null,
        list.campaign_id ?? null,
        listId,
        recipient.email,
        recipient.name ?? null,
        subject,
        body,
      ],
    );

    await markRecipient(tenantKey, recipient.id, { status: 'drafted', draftId }, opts.ownerUserId ?? null);
    draftIds.push(draftId);
    generated += 1;
  }

  return { listId, generated, skipped, draftIds };
}

/**
 * drafted alıcıları kalıcı BullMQ kuyruğuna yazar.
 * Throttle: worker job delay'i 60000/ratePerMinute hesabıyla uygulanır.
 * Açılma takibi otomatik (mevcut pixel, draft id ile).
 */
export async function sendList(
  tenantKey: string,
  listId: string,
  opts: { ratePerMinute?: number; ownerUserId?: string | null } = {},
): Promise<SendResult> {
  const list = await getList(tenantKey, listId, opts.ownerUserId ?? null);
  if (!list) throw new Error('LIST_NOT_FOUND');
  assertMailQueueAvailable();

  const ratePerMinute = opts.ratePerMinute && opts.ratePerMinute > 0 ? opts.ratePerMinute : 30;

  const recipients = await listRecipients(tenantKey, listId, 'drafted', opts.ownerUserId ?? null);
  await bumpListCounts(tenantKey, listId, { status: 'sending' }, opts.ownerUserId ?? null);

  let bounced = 0;
  const queueable: RecipientRow[] = [];

  for (const recipient of recipients) {
    if (!recipient.draft_id || !recipient.email) {
      await markRecipient(tenantKey, recipient.id, { status: 'bounced' }, opts.ownerUserId ?? null);
      bounced += 1;
      continue;
    }
    await markRecipient(tenantKey, recipient.id, { status: 'queued' }, opts.ownerUserId ?? null);
    queueable.push(recipient);
  }

  let queued: { queued: number };
  try {
    queued = await enqueueBulkRecipientEmails(tenantKey, listId, queueable, { ownerUserId: opts.ownerUserId ?? null, ratePerMinute });
  } catch (error) {
    await Promise.all(queueable.map((recipient) => markRecipient(tenantKey, recipient.id, { status: 'drafted' }, opts.ownerUserId ?? null)));
    await bumpListCounts(tenantKey, listId, { status: 'ready' }, opts.ownerUserId ?? null);
    throw error;
  }
  if (!queued.queued && bounced === recipients.length) await bumpListCounts(tenantKey, listId, { status: 'sent' }, opts.ownerUserId ?? null);
  return { listId, queued: queued.queued > 0, queuedCount: queued.queued, bounced, total: recipients.length, ratePerMinute };
}
