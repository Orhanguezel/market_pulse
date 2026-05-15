// src/components/ui/utils.ts

import { clsx, type ClassValue } from "clsx";

/**
 * Tailwind veya tailwind-merge YOK.
 * Sadece clsx ile class birleştiriyoruz.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}
