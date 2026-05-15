// src/modules/theme/helpers/repository.ts
import { DEFAULT_THEME } from "../defaults";
import type { ThemeConfig, ThemeUpdateInput } from "../types";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeRecord<T extends object>(base: T, patch?: Partial<T>): T {
  if (!patch) {
    return { ...base };
  }

  return {
    ...base,
    ...patch,
  };
}

export function deepMergeThemeConfig(base: ThemeConfig, patch: ThemeUpdateInput): ThemeConfig {
  return {
    ...base,
    colors: mergeRecord(base.colors, patch.colors),
    typography: mergeRecord(base.typography, patch.typography),
    radius: patch.radius ?? base.radius,
    darkMode: patch.darkMode ?? base.darkMode,
    sectionBackgrounds: patch.sectionBackgrounds ?? base.sectionBackgrounds,
  };
}

export function parseStoredThemeConfig(raw: string | null | undefined): ThemeConfig {
  if (!raw) {
    return { ...DEFAULT_THEME };
  }

  try {
    const stored = JSON.parse(raw) as unknown;

    if (!isPlainObject(stored)) {
      return { ...DEFAULT_THEME };
    }

    return deepMergeThemeConfig(DEFAULT_THEME, stored as ThemeUpdateInput);
  } catch {
    return { ...DEFAULT_THEME };
  }
}
