export const MARKET_TENANT_KEY = 'market-tenant-key';

export function getSelectedTenantKey(): string {
  try {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(MARKET_TENANT_KEY) || '';
  } catch {
    return '';
  }
}

export function setSelectedTenantKey(value: string) {
  try {
    if (typeof window === 'undefined') return;
    if (value) localStorage.setItem(MARKET_TENANT_KEY, value);
    else localStorage.removeItem(MARKET_TENANT_KEY);
  } catch {
    // ignore
  }
}
