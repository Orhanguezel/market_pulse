import { AsyncLocalStorage } from 'node:async_hooks';

const tenantStorage = new AsyncLocalStorage<string>();

export function runWithTenant<T>(tenantKey: string, fn: () => T): T {
  return tenantStorage.run(tenantKey, fn);
}

/**
 * Aktif tenant'ı geçerli async context'e (ve sonraki tüm devamlarına) yazar.
 * Fastify onRequest hook'unda kullanılır: her request kendi async resource'unda
 * çalıştığı için `enterWith` request boyunca doğru tenant'ı korur. `run(key, done)`
 * ile done() sonrası lifecycle context dışına çıktığından kullanılmaz (cross-tenant sızıntı).
 */
export function enterTenant(tenantKey: string): void {
  tenantStorage.enterWith(tenantKey);
}

export function getRequestTenantKey(): string | undefined {
  return tenantStorage.getStore();
}
