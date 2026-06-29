import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { ConvertLeadBody } from './schema';
import { createAccount } from './accounts.service';
import { createContact } from './contacts.service';
import { createDeal } from './deals.service';
import { parseJsonField } from './utils';

type LeadCandidateRow = {
  id: string;
  name: string;
  website: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  raw_data: unknown;
  ai_summary: string | null;
};

function splitContactName(name: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first_name: null, last_name: null };
  if (parts.length === 1) return { first_name: parts[0], last_name: null };
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts.at(-1) ?? null };
}

export async function convertLeadCandidate(body: ConvertLeadBody) {
  const tenantKey = getActiveTenantKey();
  const [rows] = await pool.execute(
    `SELECT *
       FROM lead_candidates
      WHERE tenant_key = ?
        AND id = ?
        AND status IN ('approved', 'favorite')
      LIMIT 1`,
    [tenantKey, body.candidate_id],
  );
  const candidateRaw = (rows as LeadCandidateRow[])[0];
  if (!candidateRaw) return null;
  const candidate = parseJsonField(candidateRaw as unknown as Record<string, unknown>, 'raw_data') as unknown as LeadCandidateRow;

  const account = await createAccount({
    name: candidate.name,
    website: candidate.website,
    country: candidate.country,
    city: candidate.city,
    phone: candidate.phone,
    email: candidate.email,
    source_lead_id: candidate.id,
    owner_user_id: body.owner_user_id ?? null,
    raw_data: {
      candidate: candidate.raw_data ?? null,
      ai_summary: candidate.ai_summary ?? null,
    },
  });

  const accountRow = account as Record<string, unknown> | null;
  const accountId = typeof accountRow?.id === 'string' ? accountRow.id : null;
  const contactName = splitContactName(candidate.contact_name);
  const contact = candidate.email || candidate.phone || candidate.contact_name
    ? await createContact({
        account_id: accountId,
        first_name: contactName.first_name,
        last_name: contactName.last_name,
        email: candidate.email,
        phone: candidate.phone,
        source_lead_id: candidate.id,
        owner_user_id: body.owner_user_id ?? null,
      })
    : null;

  const contactRow = contact as Record<string, unknown> | null;
  const deal = await createDeal({
    account_id: accountId,
    contact_id: typeof contactRow?.id === 'string' ? contactRow.id : null,
    pipeline_id: body.pipeline_id,
    stage_id: body.stage_id,
    title: body.deal_title ?? `${candidate.name} fırsatı`,
    amount: body.amount ?? null,
    currency: body.currency ?? 'USD',
    owner_user_id: body.owner_user_id ?? null,
    source_lead_id: candidate.id,
    raw_data: { candidate_id: candidate.id },
  });

  return { account, contact, deal };
}
