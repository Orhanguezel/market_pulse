import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { andTenant, getActiveTenantKey, tenantValues } from '@/modules/_shared';
import { marketTargets } from '../../schema';
import { getErpProvider, type ErpCustomer } from './index';

export type ErpSyncMode = 'all' | 'customers' | 'dealers';

export type ErpSyncResult = {
  enabled:  boolean;
  inserted: number;
  updated:  number;
  total:    number;
};

function turToCategory(tur: string): string {
  const t = (tur || '').toLowerCase().trim();
  if (t === 'distribütör' || t === 'distributor') return 'distributor';
  return 'dealer';
}

function filterByMode(customers: ErpCustomer[], mode: ErpSyncMode): ErpCustomer[] {
  if (mode === 'customers') return [];
  if (mode === 'dealers')   return customers;
  return customers;
}

export async function syncErpCustomersToTargets(mode: ErpSyncMode = 'all'): Promise<ErpSyncResult> {
  const provider = await getErpProvider();
  if (!provider) return { enabled: false, inserted: 0, updated: 0, total: 0 };

  const all       = await provider.getAllActiveCustomers();
  const filtered  = filterByMode(all, mode);
  const tenantKey = await getActiveTenantKey();
  let inserted    = 0;
  let updated     = 0;

  for (const c of filtered) {
    const [existing] = await db
      .select({ id: marketTargets.id })
      .from(marketTargets)
      .where(andTenant(marketTargets, tenantKey, [eq(marketTargets.external_customer_id, c.id)]))
      .limit(1);

    const category = turToCategory(c.tur);

    if (!existing) {
      await db.insert(marketTargets).values(tenantValues(tenantKey, {
        id:                   randomUUID(),
        external_customer_id: c.id,
        name:                 c.name,
        phone:                c.phone ?? null,
        notes:                c.address ?? null,
        category,
        status:               'active',
        email:                c.email ?? null,
        website:              c.website_url ?? null,
        google_maps_url:      c.google_maps_url ?? null,
        instagram_url:        c.instagram_url ?? null,
        contact_name:         c.contact_name ?? null,
        hepsiburada_url:      c.hepsiburada_url ?? null,
        trendyol_url:         c.trendyol_url ?? null,
        amazon_url:           c.amazon_url ?? null,
      }));
      inserted++;
    } else {
      await db
        .update(marketTargets)
        .set({
          name:            c.name,
          phone:           c.phone ?? null,
          category,
          email:           c.email ?? null,
          website:         c.website_url ?? null,
          google_maps_url: c.google_maps_url ?? null,
          instagram_url:   c.instagram_url ?? null,
          contact_name:    c.contact_name ?? null,
          hepsiburada_url: c.hepsiburada_url ?? null,
          trendyol_url:    c.trendyol_url ?? null,
          amazon_url:      c.amazon_url ?? null,
        })
        .where(andTenant(marketTargets, tenantKey, [eq(marketTargets.external_customer_id, c.id)]));
      updated++;
    }
  }

  return { enabled: true, inserted, updated, total: filtered.length };
}
