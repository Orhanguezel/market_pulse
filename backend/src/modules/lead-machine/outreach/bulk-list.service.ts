import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import { sendOutreachDraft } from './outreach.service';
import {
  addRecipients,
  bumpListCounts,
  createList,
  getList,
  listRecipients,
  markRecipient,
  type RecipientListRow,
} from './bulk-list.repository';
import { parseRecipientFile } from './bulk-list.parser';

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
  sent: number;
  bounced: number;
  total: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
  opts: { campaignId?: string | null; name: string; fileBuffer: Buffer; filename: string },
): Promise<UploadResult> {
  const parsed = parseRecipientFile(opts.fileBuffer, opts.filename);
  const ext = opts.filename.toLowerCase().split('.').pop() ?? '';
  const source = ext === 'xlsx' || ext === 'xlsm' ? 'excel' : 'csv';

  const list = await createList(tenantKey, {
    campaignId: opts.campaignId ?? null,
    name: opts.name,
    source,
  });

  let inserted = 0;
  if (parsed.rows.length) {
    inserted = await addRecipients(tenantKey, list.id, parsed.rows);
  }
  await bumpListCounts(tenantKey, list.id, { totalCount: inserted });
  const refreshed = (await getList(tenantKey, list.id)) ?? list;

  return { list: refreshed, inserted, invalid: parsed.invalid, duplicates: parsed.duplicates };
}

export async function generateDraftsFromList(
  tenantKey: string,
  listId: string,
  opts: { subjectTemplate: string; bodyTemplate: string },
): Promise<GenerateResult> {
  const list = await getList(tenantKey, listId);
  if (!list) throw new Error('LIST_NOT_FOUND');

  const recipients = await listRecipients(tenantKey, listId, 'pending');
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
        (id, tenant_key, candidate_id, market_lead_id, campaign_id,
         recipient_list_id, recipient_email, recipient_name, subject, body, status)
       VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        draftId,
        tenantKey,
        list.campaign_id ?? null,
        listId,
        recipient.email,
        recipient.name ?? null,
        subject,
        body,
      ],
    );

    await markRecipient(tenantKey, recipient.id, { status: 'drafted', draftId });
    draftIds.push(draftId);
    generated += 1;
  }

  return { listId, generated, skipped, draftIds };
}

/**
 * drafted alıcıları rate-limit ile gönderir. Her biri mevcut sendOutreachDraft(draftId, recipient_email).
 * Throttle: 60000/ratePerMinute ms bekleme. Başarısız → recipient.status='bounced', devam eder (durmaz).
 * Açılma takibi otomatik (mevcut pixel, draft id ile).
 */
export async function sendList(
  tenantKey: string,
  listId: string,
  opts: { ratePerMinute?: number } = {},
): Promise<SendResult> {
  const list = await getList(tenantKey, listId);
  if (!list) throw new Error('LIST_NOT_FOUND');

  const ratePerMinute = opts.ratePerMinute && opts.ratePerMinute > 0 ? opts.ratePerMinute : 30;
  const delayMs = Math.floor(60000 / ratePerMinute);

  const recipients = await listRecipients(tenantKey, listId, 'drafted');
  await bumpListCounts(tenantKey, listId, { status: 'sending' });

  let sent = 0;
  let bounced = 0;

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    if (!recipient.draft_id || !recipient.email) {
      await markRecipient(tenantKey, recipient.id, { status: 'bounced' });
      bounced += 1;
      continue;
    }
    try {
      await sendOutreachDraft(recipient.draft_id, recipient.email);
      await markRecipient(tenantKey, recipient.id, { status: 'sent' });
      await bumpListCounts(tenantKey, listId, { sentDelta: 1 });
      sent += 1;
    } catch {
      await markRecipient(tenantKey, recipient.id, { status: 'bounced' });
      bounced += 1;
    }
    if (i < recipients.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  await bumpListCounts(tenantKey, listId, { status: 'sent' });
  return { listId, sent, bounced, total: recipients.length };
}
