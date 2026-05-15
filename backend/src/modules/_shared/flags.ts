// src/modules/_shared/flags.ts

import type { BooleanLike } from './validation';
import { toBool } from './parse';

export { toBool };

export function to01(v: unknown): 0 | 1 | undefined {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
}

export type BoolLike01 = BooleanLike;
