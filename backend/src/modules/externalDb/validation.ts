import { z } from 'zod';

export const externalDbBodySchema = z.object({
  key: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  host: z.string().trim().min(1).max(255),
  port: z.coerce.number().int().min(1).max(65535).default(3306),
  db_name: z.string().trim().min(1).max(100),
  username: z.string().trim().min(1).max(100),
  password: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const externalDbQueryBodySchema = z.object({
  sql: z.string().trim().min(1).max(10_000),
});
