import { getTenantSetting } from '@/core/tenant';
import { PromatErpProvider } from './promat.provider';
import type { ErpProvider } from './erp.types';

type ExternalErpConfig = {
  enabled?: boolean;
  provider?: string;
  connectionKey?: string;
};

export async function getErpProvider(): Promise<ErpProvider | null> {
  const config = await getTenantSetting<ExternalErpConfig>('external_erp');
  if (config?.enabled !== true) return null;

  const provider = config.provider?.toLowerCase();
  if (provider === 'promat') {
    return new PromatErpProvider(config.connectionKey || 'promat');
  }

  return null;
}

export type { ErpCustomer, ErpOrder, ErpProduct, ErpProvider } from './erp.types';
