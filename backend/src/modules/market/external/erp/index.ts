import { getTenantSetting } from '@/core/tenant';
import type { ExternalPoolConfig } from '@/db/external';
import { EcosystemSourceProvider } from './ecosystem.provider';
import { PromatErpProvider } from './promat.provider';
import type { ErpProvider } from './erp.types';

type ExternalErpConfig = {
  enabled?: boolean;
  provider?: string;
  connectionKey?: string;
};

export function createErpProviderFromSettings(
  erpConfig?: ExternalErpConfig,
  dbConfig?: ExternalErpConfig & ExternalPoolConfig,
): ErpProvider | null {
  const config = erpConfig?.enabled === true ? erpConfig : dbConfig;
  if (config?.enabled !== true) return null;

  const provider = config.provider?.toLowerCase();
  if (provider === 'promat') {
    return new PromatErpProvider(config.connectionKey || 'promat');
  }
  if (provider === 'ecosystem') {
    const connectionKey = config.connectionKey || dbConfig?.connectionKey || 'ecosystem';
    return new EcosystemSourceProvider(connectionKey, dbConfig ?? {});
  }

  return null;
}

export async function getErpProvider(): Promise<ErpProvider | null> {
  const erpConfig = await getTenantSetting<ExternalErpConfig>('external_erp');
  const dbConfig = await getTenantSetting<ExternalErpConfig & ExternalPoolConfig>('external_db');
  return createErpProviderFromSettings(erpConfig, dbConfig);
}

export type { ErpCustomer, ErpOrder, ErpProduct, ErpProvider } from './erp.types';
