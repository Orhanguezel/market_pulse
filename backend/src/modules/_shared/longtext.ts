// src/modules/_shared/longtext.ts


import {
  customType,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/** LONGTEXT (raw) */
export const longtext = customType<{ data: string | null; driverData: string | null }>({
  dataType() {
    return 'longtext';
  },
});

/**
 * LONGTEXT JSON string[] with safe defaults.
 * - DB: LONGTEXT DEFAULT '[]'
 * - App: string[]
 */
export const longtextJsonStringArray = (name: string) =>
  customType<{ data: string[]; driverData: string }>({
    dataType() {
      return 'longtext';
    },
    toDriver(value: string[]) {
      const arr = Array.isArray(value) ? value : [];
      return JSON.stringify(arr);
    },
    fromDriver(value: string) {
      const s = String(value ?? '').trim();
      if (!s) return [];
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed.map((x) => String(x ?? '')).filter(Boolean) : [];
      } catch {
        return [];
      }
    },
  })(name)
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`);