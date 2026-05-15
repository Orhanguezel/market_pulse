// src/common/events/bus.ts
// Minimal in-process event bus — audit SSE ve realtime event dağıtımı için.

import { EventEmitter } from "node:events";

export interface AppEvent {
  ts?: string;
  level?: "info" | "warn" | "error" | string;
  topic?: string;
  message?: string | null;
  actor_user_id?: string | null;
  ip?: string | null;
  entity?: { type?: string; id?: string | number | null } | null;
  meta?: Record<string, unknown> | null;
}

class AppEventBus extends EventEmitter {}

export const bus = new AppEventBus();
// Fazla listener uyarısını kapat (SSE stream'ler subscribe olabiliyor)
bus.setMaxListeners(100);

/**
 * Uygulama genelinde event yayınlar.
 * Audit service + stream tarafından kullanılır.
 */
export function emitAppEvent(event: Partial<AppEvent>): void {
  const full: AppEvent = {
    ts: new Date().toISOString(),
    level: "info",
    ...event,
  };
  bus.emit("app.event", full);
}
