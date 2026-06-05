import { z } from 'zod';

export const platformSettingsQuerySchema = z.object({
  locale: z.string().trim().max(8).default('*'),
});

export const platformSettingsUpsertSchema = z.object({
  key: z.string().trim().min(1).max(128),
  locale: z.string().trim().max(8).default('*'),
  value: z.unknown().nullable().default(null),
});
