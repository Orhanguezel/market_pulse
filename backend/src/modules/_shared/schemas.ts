// src/modules/_shared/schemas.ts
// Ortak Zod şemaları

import { z } from 'zod';
import { safeTrim } from './parse';

export type Id36 = string;
export type LocaleCode = string;
export type Ymd = string; // YYYY-MM-DD
export type Hm = string; // HH:mm
export type safeText = (v: unknown) => string;

export const uuid36Schema = z
  .string()
  .trim()
  .length(36, 'id must be 36 chars')
  .transform((v) => safeTrim(v));

export const hmSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:mm')
  .transform((v) => safeTrim(v));

export const ymdSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .transform((v) => safeTrim(v));

export const dowSchema = z.coerce.number().int().min(1).max(7);
