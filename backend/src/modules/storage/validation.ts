// src/modules/storage/validation.ts

import { z } from "zod";

/** Query: admin list */
export const storageListQuerySchema = z.object({
  q: z.string().optional(),
  bucket: z.string().min(1).max(64).optional(),
  folder: z.string().max(255).nullish(),
  mime: z.string().max(127).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "name", "size"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
}).strict().passthrough();

export type StorageListQuery = z.infer<typeof storageListQuerySchema>;

/** PATCH/PUT body: admin update */
export const storageUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folder: z.string().max(255).nullable().optional(),
  metadata: z.record(z.string()).nullable().optional(),
}).partial().refine(v => Object.keys(v).length > 0, { message: "no_fields_to_update" });

export type StorageUpdateInput = z.infer<typeof storageUpdateSchema>;

/** Sign bodies */
export const signPutBodySchema = z.object({
  filename: z.string().min(1),
  content_type: z.string().min(1),
  folder: z.string().max(255).optional(),
}).strict();

export type SignPutBody = z.infer<typeof signPutBodySchema>;

export const signMultipartBodySchema = z.object({
  filename: z.string().min(1),
  folder: z.string().max(255).optional(),
  content_type: z.string().min(1).optional(),
}).strict();

export type SignMultipartBody = z.infer<typeof signMultipartBodySchema>;
