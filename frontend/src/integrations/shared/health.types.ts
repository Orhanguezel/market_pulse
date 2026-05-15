// =============================================================
// FILE: src/integrations/shared/health.types.ts
// — Health check types
// =============================================================

export type HealthStatus =
  | { ok: true; version?: string; time?: string }
  | { ok: false; error: string };
