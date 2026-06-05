import { AsyncLocalStorage } from 'node:async_hooks';

const tenantStorage = new AsyncLocalStorage<string>();

export function runWithTenant<T>(tenantKey: string, fn: () => T): T {
  return tenantStorage.run(tenantKey, fn);
}

export function getRequestTenantKey(): string | undefined {
  return tenantStorage.getStore();
}
