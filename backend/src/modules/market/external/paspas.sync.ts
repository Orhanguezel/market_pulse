import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { marketTargets } from '../schema';
import { getAllPaspasActiveCustomers, type PaspasCustomer } from './paspas.repository';

export type PaspasSyncMode = 'all' | 'customers' | 'dealers';

export type PaspasSyncResult = {
  inserted: number;
  updated:  number;
  total:    number;
};

function turToCategory(tur: string): string {
  const t = (tur || '').toLowerCase().trim();
  if (t === 'distribütör' || t === 'distributor') return 'distributor';
  // Avrasya's universe has no 'musteri' bucket in Market Pulse — every paspas
  // customer record is treated as a dealer ('bayi') unless explicitly tagged
  // as a distributor. Paspas ERP keeps its own tur='musteri' label; we just
  // normalize on this side.
  return 'dealer';
}

function filterByMode(customers: PaspasCustomer[], mode: PaspasSyncMode): PaspasCustomer[] {
  if (mode === 'customers') return [];           // legacy mode — no longer meaningful
  if (mode === 'dealers')   return customers;    // everything is a dealer now
  return customers;
}

export async function syncPaspasCustomersToTargets(mode: PaspasSyncMode = 'all'): Promise<PaspasSyncResult> {
  const all      = await getAllPaspasActiveCustomers();
  const filtered = filterByMode(all, mode);
  let inserted   = 0;
  let updated    = 0;

  for (const c of filtered) {
    const [existing] = await db
      .select({ id: marketTargets.id })
      .from(marketTargets)
      .where(eq(marketTargets.paspas_customer_id, c.id))
      .limit(1);

    const category = turToCategory(c.tur);

    if (!existing) {
      await db.insert(marketTargets).values({
        id:                 randomUUID(),
        paspas_customer_id: c.id,
        name:               c.name,
        phone:              c.phone ?? null,
        notes:              c.address ?? null,
        category,
        status:             'active',
        email:              c.email ?? null,
        website:            c.website_url ?? null,
        google_maps_url:    c.google_maps_url ?? null,
        instagram_url:      c.instagram_url ?? null,
        contact_name:       c.contact_name ?? null,
      });
      inserted++;
    } else {
      // Paspas ERP single source of truth: sync writes every field every time.
      // If you want to keep a manual override, edit the row directly in Paspas
      // and the next sync will mirror it.
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
        })
        .where(eq(marketTargets.paspas_customer_id, c.id));
      updated++;
    }
  }

  return { inserted, updated, total: filtered.length };
}
