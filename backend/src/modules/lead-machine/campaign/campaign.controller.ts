import type { RouteHandler } from 'fastify';
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
  type OutreachCampaignInput,
} from './campaign.repository';
import { generateDraftsForCampaign } from './draft.generator';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function sanitizeInput(body: unknown): OutreachCampaignInput {
  const rec = asRecord(body);
  const out: OutreachCampaignInput = {};
  const stringFields: Array<keyof OutreachCampaignInput> = [
    'slug', 'name', 'brand_name', 'brand_short', 'brand_legal',
    'sender_label', 'sender_name', 'sender_title',
    'sender_email', 'reply_to_email', 'sender_phone', 'sender_office',
    'sender_website', 'sender_address',
    'product_en', 'product_de', 'product_tr',
    'fair_name', 'fair_edition',
    'fair_dates_en', 'fair_dates_de', 'fair_dates_tr',
    'fair_hall', 'fair_booth', 'fair_url',
    'calendly_link', 'calendly_placeholder',
    'icp_id', 'default_lang',
  ];
  for (const f of stringFields) {
    const v = rec[f];
    if (v === null) {
      (out as Record<string, unknown>)[f] = null;
    } else if (typeof v === 'string') {
      (out as Record<string, unknown>)[f] = v.trim() || null;
    }
  }
  if (typeof rec.is_active === 'boolean' || typeof rec.is_active === 'number') {
    out.is_active = rec.is_active ? 1 : 0;
  }
  if (rec.country_to_lang !== undefined) {
    if (rec.country_to_lang === null) {
      (out as Record<string, unknown>).country_to_lang = null;
    } else if (typeof rec.country_to_lang === 'object') {
      (out as Record<string, unknown>).country_to_lang = rec.country_to_lang;
    } else if (typeof rec.country_to_lang === 'string') {
      try {
        (out as Record<string, unknown>).country_to_lang = JSON.parse(rec.country_to_lang);
      } catch {
        // ignore parse error
      }
    }
  }
  return out;
}

export const listOutreachCampaigns: RouteHandler = async () => listCampaigns();

export const getOutreachCampaign: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const row = await getCampaign(req.params.id);
  if (!row) {
    reply.code(404);
    return { error: 'NOT_FOUND' };
  }
  return row;
};

export const createOutreachCampaign: RouteHandler<{ Body: unknown }> = async (req, reply) => {
  const input = sanitizeInput(req.body);
  if (!input.slug || !input.name || !input.brand_name || !input.sender_email || !input.product_en) {
    reply.code(400);
    return { error: 'VALIDATION', message: 'slug, name, brand_name, sender_email, product_en zorunlu' };
  }
  const row = await createCampaign(input);
  reply.code(201);
  return row;
};

export const updateOutreachCampaign: RouteHandler<{ Params: { id: string }; Body: unknown }> = async (req, reply) => {
  const input = sanitizeInput(req.body);
  const existing = await getCampaign(req.params.id);
  if (!existing) {
    reply.code(404);
    return { error: 'NOT_FOUND' };
  }
  const row = await updateCampaign(req.params.id, input);
  return row;
};

export const deleteOutreachCampaign: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  await deleteCampaign(req.params.id);
  reply.code(204);
  return null;
};

export const generateOutreachDrafts: RouteHandler<{ Params: { id: string } }> = async (req, reply) => {
  const existing = await getCampaign(req.params.id);
  if (!existing) {
    reply.code(404);
    return { error: 'NOT_FOUND' };
  }
  const result = await generateDraftsForCampaign(req.params.id);
  reply.code(201);
  return result;
};
