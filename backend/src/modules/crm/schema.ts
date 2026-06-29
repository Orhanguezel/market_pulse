import { z } from 'zod';

export const idParamsSchema = z.object({ id: z.string().trim().min(1).max(64) });

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().trim().max(32).optional(),
});

export const accountBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  website: z.string().trim().max(500).nullable().optional(),
  country: z.string().trim().max(100).nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  phone: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().max(255).nullable().optional(),
  industry: z.string().trim().max(120).nullable().optional(),
  owner_user_id: z.string().trim().max(36).nullable().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  raw_data: z.unknown().optional(),
});

export const accountPatchSchema = accountBodySchema.partial();

export const contactBodySchema = z.object({
  account_id: z.string().trim().max(36).nullable().optional(),
  first_name: z.string().trim().max(120).nullable().optional(),
  last_name: z.string().trim().max(120).nullable().optional(),
  title: z.string().trim().max(160).nullable().optional(),
  email: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(100).nullable().optional(),
  linkedin_url: z.string().trim().max(500).nullable().optional(),
  owner_user_id: z.string().trim().max(36).nullable().optional(),
});

export const contactPatchSchema = contactBodySchema.partial();

export const pipelineBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  is_default: z.boolean().optional(),
  sort: z.coerce.number().int().optional(),
});

export const dealBodySchema = z.object({
  account_id: z.string().trim().max(36).nullable().optional(),
  contact_id: z.string().trim().max(36).nullable().optional(),
  pipeline_id: z.string().trim().max(36).optional(),
  stage_id: z.string().trim().max(36).optional(),
  title: z.string().trim().min(1).max(255),
  amount: z.coerce.number().nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  expected_close_date: z.string().trim().max(10).nullable().optional(),
  owner_user_id: z.string().trim().max(36).nullable().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  lost_reason: z.string().trim().max(500).nullable().optional(),
  raw_data: z.unknown().optional(),
});

export const dealPatchSchema = dealBodySchema.partial();

export const dealStageBodySchema = z.object({
  stage_id: z.string().trim().min(1).max(36),
});

export const activityBodySchema = z.object({
  ref_type: z.enum(['deal', 'contact', 'account']),
  ref_id: z.string().trim().min(1).max(36),
  type: z.enum(['call', 'email', 'meeting', 'task', 'note']).default('task'),
  subject: z.string().trim().min(1).max(255),
  body: z.string().trim().nullable().optional(),
  due_at: z.string().trim().nullable().optional(),
  owner_user_id: z.string().trim().max(36).nullable().optional(),
  created_by: z.string().trim().max(36).nullable().optional(),
});

export const activityPatchSchema = activityBodySchema.partial().extend({
  done: z.boolean().optional(),
});

export const convertLeadBodySchema = z.object({
  candidate_id: z.string().trim().min(1).max(36),
  pipeline_id: z.string().trim().max(36).optional(),
  stage_id: z.string().trim().max(36).optional(),
  deal_title: z.string().trim().max(255).optional(),
  amount: z.coerce.number().nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  owner_user_id: z.string().trim().max(36).nullable().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type AccountBody = z.infer<typeof accountBodySchema>;
export type ContactBody = z.infer<typeof contactBodySchema>;
export type PipelineBody = z.infer<typeof pipelineBodySchema>;
export type DealBody = z.infer<typeof dealBodySchema>;
export type ActivityBody = z.infer<typeof activityBodySchema>;
export type ConvertLeadBody = z.infer<typeof convertLeadBodySchema>;
