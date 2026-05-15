import { z } from 'zod';

const avatarUrlSchema = z
  .string()
  .max(2048)
  .refine((v) => {
    if (v.startsWith('/')) return true; // local/public relative paths: /uploads/...
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  }, 'Geçerli bir URL veya / ile başlayan path girin');

export const profileUpsertSchema = z.object({
  full_name: z.string().min(1).max(191).optional(),
  phone: z.string().max(64).optional(),
  avatar_url: avatarUrlSchema.optional(),
  address_line1: z.string().max(255).optional(),
  address_line2: z.string().max(255).optional(),
  city: z.string().max(128).optional(),
  country: z.string().max(128).optional(),
  postal_code: z.string().max(32).optional(),
});

export type ProfileUpsertInput = z.infer<typeof profileUpsertSchema>;
