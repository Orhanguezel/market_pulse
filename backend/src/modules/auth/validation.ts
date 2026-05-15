import { z } from 'zod';

export const signupBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),

  // Top-level opsiyonel alanlar:
  full_name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(6).max(50).optional(),
  rules_accepted: z.literal(true, { errorMap: () => ({ message: 'rules_accepted_required' }) }),

  // Supabase benzeri payload uyumu:
  options: z
    .object({
      emailRedirectTo: z.string().url().optional(),
      data: z
        .object({
          full_name: z.string().trim().min(2).max(100).optional(),
          phone: z.string().trim().min(6).max(50).optional(),
          role: z.enum(['editor']).optional(),
        })
        .partial()
        .optional(),
    })
    .optional(),
});

export const tokenBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  grant_type: z.literal("password").optional(),
});

export const updateBody = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const googleBody = z.object({
  id_token: z.string().min(10),
});

export const passwordResetRequestBody = z.object({
  email: z.string().trim().email(),
});

export const passwordResetConfirmBody = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});
