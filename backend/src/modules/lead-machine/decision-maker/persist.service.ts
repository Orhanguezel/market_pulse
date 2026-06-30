import { randomUUID } from 'crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { CompanyPoolRow, CompanyQualityStatus, DecisionMakerRow } from './finder.service';

/**
 * Karar verici sonuçlarını kalıcı kaydet (UPSERT, tenant-scoped).
 * (tenant_key, company_name, city) tekil → tekrar aramada birikir; daha iyi skor gelirse güncellenir.
 */
export type DecisionMakerListFilters = {
  jobId?: string | null;
  confidence?: 'A' | 'B' | 'C' | null;
  sector?: string | null;
  limit?: number;
};

export type CompanyPoolListFilters = {
  jobId?: string | null;
  status?: CompanyQualityStatus | 'all' | null;
  includeExcluded?: boolean;
  limit?: number;
};

export async function saveDecisionMakers(rows: DecisionMakerRow[], sector?: string | null, jobId?: string | null): Promise<number> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey || !rows.length) return 0;
  let saved = 0;
  for (const r of rows) {
    await pool.execute(
      `INSERT INTO lead_decision_makers
         (id, tenant_key, job_id, company_name, city, business_type, decision_maker_name, title,
          linkedin_profile_url, company_website, social_url, source_url, fit_note,
          confidence_score, sector, last_verified_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         job_id=VALUES(job_id),
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
        randomUUID(), tenantKey, jobId ?? null, r.company_name, r.city ?? null, r.business_type ?? null,
        r.decision_maker_name ?? null, r.title ?? null, r.linkedin_profile_url ?? null,
        r.company_website ?? null, r.social_url ?? null, r.source_url ?? null, r.fit_note ?? null,
        r.confidence_score, sector ?? null, r.last_verified_at ?? null,
      ] as never[],
    );
    saved++;
  }
  return saved;
}

export async function saveCompanyPool(rows: CompanyPoolRow[], sector?: string | null, jobId?: string | null): Promise<number> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey || !rows.length) return 0;
  let saved = 0;
  for (const r of rows) {
    await pool.execute(
      `INSERT INTO lead_company_pool
         (id, tenant_key, job_id, company_name, city, business_type, website, phone,
          google_maps_url, address, quality_score, quality_status, exclude_reason,
          source, sector, last_verified_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         job_id=VALUES(job_id),
         business_type=VALUES(business_type),
         website=VALUES(website),
         phone=VALUES(phone),
         google_maps_url=VALUES(google_maps_url),
         address=VALUES(address),
         quality_score=VALUES(quality_score),
         quality_status=VALUES(quality_status),
         exclude_reason=VALUES(exclude_reason),
         source=VALUES(source),
         sector=VALUES(sector),
         last_verified_at=VALUES(last_verified_at)`,
      [
        randomUUID(), tenantKey, jobId ?? null, r.company_name, r.city ?? null, r.business_type ?? null,
        r.website ?? null, r.phone ?? null, r.google_maps_url ?? null, r.address ?? null,
        r.quality_score, r.quality_status, r.exclude_reason ?? null, r.source, sector ?? null,
        r.last_verified_at ?? null,
      ] as never[],
    );
    saved++;
  }
  return saved;
}

/** Kayıtlı karar vericileri getir (A>B>C, en yeni önce). */
export async function listSavedDecisionMakers(filters: number | DecisionMakerListFilters = 500): Promise<DecisionMakerRow[]> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey) return [];
  const opts: DecisionMakerListFilters = typeof filters === 'number' ? { limit: filters } : filters;
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (opts.jobId) {
    where.push('job_id = ?');
    values.push(opts.jobId);
  }
  if (opts.confidence) {
    where.push('confidence_score = ?');
    values.push(opts.confidence);
  }
  if (opts.sector) {
    where.push('sector = ?');
    values.push(opts.sector);
  }
  const limit = Math.min(Math.max(Number(opts.limit ?? 500), 1), 1000);
  const [rows] = await pool.execute(
    `SELECT company_name, city, business_type, decision_maker_name, title, linkedin_profile_url,
            company_website, social_url, source_url, fit_note, confidence_score,
            DATE_FORMAT(last_verified_at, '%Y-%m-%d') AS last_verified_at
       FROM lead_decision_makers
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(confidence_score,'A','B','C'), updated_at DESC
      LIMIT ${limit}`,
    values as never[],
  );
  return rows as DecisionMakerRow[];
}

function parsePoolStatus(value: unknown): CompanyQualityStatus | null {
  return value === 'qualified' || value === 'possible' || value === 'manual_review' || value === 'excluded' ? value : null;
}

export async function listCompanyPool(filters: CompanyPoolListFilters = {}): Promise<CompanyPoolRow[]> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey) return [];
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (filters.jobId) {
    where.push('job_id = ?');
    values.push(filters.jobId);
  }
  const status = parsePoolStatus(filters.status);
  if (status) {
    where.push('quality_status = ?');
    values.push(status);
  } else if (!filters.includeExcluded) {
    where.push("quality_status <> 'excluded'");
  }
  const limit = Math.min(Math.max(Number(filters.limit ?? 500), 1), 1000);
  const [rows] = await pool.execute(
    `SELECT company_name, city, business_type, website, phone, google_maps_url, address,
            quality_score, quality_status, exclude_reason, source,
            DATE_FORMAT(last_verified_at, '%Y-%m-%d') AS last_verified_at
       FROM lead_company_pool
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(quality_status,'qualified','possible','manual_review','excluded'), quality_score DESC, updated_at DESC
      LIMIT ${limit}`,
    values as never[],
  );
  return rows as CompanyPoolRow[];
}
