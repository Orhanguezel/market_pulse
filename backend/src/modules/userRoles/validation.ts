import { z } from "zod";

export const userRoleListQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  role: z.enum(["admin", "editor"]).optional(),
  order: z.literal("created_at").optional(),
  direction: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const createUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "editor"]),
});

export type UserRoleListQuery = z.infer<typeof userRoleListQuerySchema>;
export type CreateUserRoleInput = z.infer<typeof createUserRoleSchema>;
