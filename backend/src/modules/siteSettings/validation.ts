// src/modules/siteSettings/validation.ts

import { z } from "zod";
import { jsonLike } from '../_shared';

export const siteSettingUpsertSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.lazy(() => jsonLike),
});

export const siteSettingBulkUpsertSchema = z.object({
  items: z.array(siteSettingUpsertSchema).min(1),
});

export type SiteSettingUpsertInput = z.infer<typeof siteSettingUpsertSchema>;
export type SiteSettingBulkUpsertInput = z.infer<
  typeof siteSettingBulkUpsertSchema
>;
