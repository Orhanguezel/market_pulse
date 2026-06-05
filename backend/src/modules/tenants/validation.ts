import { z } from 'zod';

export const tenantKeySchema = z.string().trim().min(1).max(64).regex(/^[a-z0-9_-]+$/i);

export const tenantOnboardSchema = z.object({
  tenant_key: tenantKeySchema,
  name: z.string().trim().min(1).max(255),
  locale: z.string().trim().min(2).max(8).default('tr'),
  plan: z.string().trim().max(64).default('agency'),
  branding: z.record(z.unknown()).default({}),
  external_db: z.record(z.unknown()).optional(),
  external_erp: z.record(z.unknown()).optional(),
});

export const tenantProfilePatchSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  locale: z.string().trim().min(2).max(8).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  plan: z.string().trim().max(64).optional(),
  branding: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const tenantRoleCreateSchema = z.object({
  user_id: z.string().trim().min(1).max(36),
  role: z.enum(['tenant_admin', 'tenant_editor']).default('tenant_editor'),
});
