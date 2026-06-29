import { randomUUID } from 'crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { DecisionMakerRow } from './finder.service';

/**
 * Karar verici sonuçlarını kalıcı kaydet (UPSERT, tenant-scoped).
 * (tenant_key, company_name, city) tekil → tekrar aramada birikir; daha iyi skor gelirse güncellenir.
 */
export async function saveDecisionMakers(rows: DecisionMakerRow[], sector?: string | null): Promise<number> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey || !rows.length) return 0;
  let saved = 0;
  for (const r of rows) {
    await pool.execute(
      `INSERT INTO lead_decision_makers
         (id, tenant_key, company_name, city, business_type, decision_maker_name, title,
          linkedin_profile_url, company_website, social_url, source_url, fit_note,
          confidence_score, sector, last_verified_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         business_type=VALUES(business_type),
         decision_maker_name=VALUES(decision_maker_name),
         title=VALUES(title),
         linkedin_profile_url=VALUES(linkedin_profile_url),
         company_website=VALUES(company_website),
         social_url=VALUES(social_url),
         source_url=VALUES(source_url),
         fit_note=VALUES(fit_note),
         confidence_score=VALUES(confidence_score),
         sector=VALUES(sector),
         last_verified_at=VALUES(last_verified_at)`,
      [
        randomUUID(), tenantKey, r.company_name, r.city ?? null, r.business_type ?? null,
        r.decision_maker_name ?? null, r.title ?? null, r.linkedin_profile_url ?? null,
        r.company_website ?? null, r.social_url ?? null, r.source_url ?? null, r.fit_note ?? null,
        r.confidence_score, sector ?? null, r.last_verified_at ?? null,
      ] as never[],
    );
    saved++;
  }
  return saved;
}

/** Kayıtlı karar vericileri getir (A>B>C, en yeni önce). */
export async function listSavedDecisionMakers(limit = 500): Promise<DecisionMakerRow[]> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey) return [];
  const [rows] = await pool.execute(
    `SELECT company_name, city, business_type, decision_maker_name, title, linkedin_profile_url,
            company_website, social_url, source_url, fit_note, confidence_score,
            DATE_FORMAT(last_verified_at, '%Y-%m-%d') AS last_verified_at
       FROM lead_decision_makers
      WHERE tenant_key = ?
      ORDER BY FIELD(confidence_score,'A','B','C'), updated_at DESC
      LIMIT ${Number(limit)}`,
    [tenantKey] as never[],
  );
  return rows as DecisionMakerRow[];
}
