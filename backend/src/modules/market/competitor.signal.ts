import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { marketTargets, marketSignals } from './schema';
import { scrape, type CompetitorPageData } from '../lead-machine/_shared/scraper.client';
import { andTenant, getActiveTenantKey, tenantValues } from '@/modules/_shared';

type SignalSeverity = 'critical' | 'high' | 'medium' | 'low';

function severityFor(changedFields: string[]): SignalSeverity {
  if (changedFields.length >= 3)          return 'critical';
  if (changedFields.includes('prices'))   return 'high';
  if (changedFields.includes('products')) return 'medium';
  return 'low';
}

function titleFor(fields: string[], targetName: string): string {
  const labels: Record<string, string> = {
    prices:    'fiyat değişikliği',
    products:  'ürün listesi değişikliği',
    campaigns: 'kampanya değişikliği',
  };
  const readable = fields.map(f => labels[f] ?? f).join(', ');
  return `${targetName}: ${readable} tespit edildi`;
}

export async function scanAndCreateSignals(targetId: string): Promise<{
  target_id: string;
  url: string;
  changed_fields: string[];
  signals_created: number;
  scan_data: CompetitorPageData;
}> {
  const tenantKey = await getActiveTenantKey();
  const [target] = await db
    .select({ id: marketTargets.id, name: marketTargets.name, website: marketTargets.website })
    .from(marketTargets)
    .where(andTenant(marketTargets, tenantKey, [eq(marketTargets.id, targetId)]))
    .limit(1);

  if (!target) throw Object.assign(new Error('TARGET_NOT_FOUND'), { statusCode: 404 });
  if (!target.website) throw Object.assign(new Error('TARGET_HAS_NO_WEBSITE'), { statusCode: 400 });

  const result = await scrape(target.website, {
    profile: 'competitor-page',
    return_text: false,
    mode: 'stealthy',
  });
  const data = result.data as unknown as CompetitorPageData;
  const changedFields: string[] = data.changed_fields ?? [];

  let signalsCreated = 0;

  if (changedFields.length > 0) {
    await db.insert(marketSignals).values(tenantValues(tenantKey, {
      id:          randomUUID(),
      target_id:   targetId,
      signal_type: 'competitor_change',
      severity:    severityFor(changedFields),
      title:       titleFor(changedFields, target.name),
      description: JSON.stringify({
        changed_fields: changedFields,
        prices:    data.prices?.slice(0, 5),
        campaigns: data.campaigns?.slice(0, 3),
        products:  data.products?.slice(0, 5),
      }),
      source_url: target.website,
    }));
    signalsCreated = 1;
  }

  // last_seen_at güncelle
  await db
    .update(marketTargets)
    .set({ last_seen_at: new Date() })
    .where(andTenant(marketTargets, tenantKey, [eq(marketTargets.id, targetId)]));

  return {
    target_id:       targetId,
    url:             target.website,
    changed_fields:  changedFields,
    signals_created: signalsCreated,
    scan_data:       data,
  };
}
