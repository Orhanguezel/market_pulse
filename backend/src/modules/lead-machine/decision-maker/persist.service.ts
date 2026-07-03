import { randomUUID } from 'crypto';
import { pool } from '@/db/client';
import { getActiveTenantKey } from '@/modules/_shared';
import type { CompanyPoolRow, CompanyQualityStatus, DecisionMakerReviewStatus, DecisionMakerRow } from './finder.service';

/**
 * Karar verici sonuçlarını kalıcı kaydet (UPSERT, tenant-scoped).
 * (tenant_key, company_name, city) tekil → tekrar aramada birikir; daha iyi skor gelirse güncellenir.
 */
export type DecisionMakerListFilters = {
  jobId?: string | null;
  confidence?: 'A' | 'B' | 'C' | null;
  sector?: string | null;
  includeRejected?: boolean;
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
  // Reddedilen satırlar varsayılan listede/export'ta gözükmez (checklist: excluded/rejected default dışında).
  if (!opts.includeRejected) {
    where.push("review_status <> 'rejected'");
  }
  const limit = Math.min(Math.max(Number(opts.limit ?? 500), 1), 1000);
  const [rows] = await pool.execute(
    `SELECT id, company_name, city, business_type, decision_maker_name, title, linkedin_profile_url,
            company_website, social_url, source_url, fit_note, confidence_score, review_status,
            email, email_source,
            DATE_FORMAT(last_verified_at, '%Y-%m-%d') AS last_verified_at
       FROM lead_decision_makers
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(confidence_score,'A','B','C'), updated_at DESC
      LIMIT ${limit}`,
    values as never[],
  );
  return rows as DecisionMakerRow[];
}

type DecisionMakerSelector = { jobId?: string | null; ids?: string[]; confidence?: 'A' | 'B' | 'C' | null; limit?: number };

function buildSelectorWhere(tenantKey: string, sel: DecisionMakerSelector) {
  const where = ['tenant_key = ?'];
  const values: unknown[] = [tenantKey];
  if (sel.ids && sel.ids.length) {
    where.push(`id IN (${sel.ids.map(() => '?').join(', ')})`);
    values.push(...sel.ids.slice(0, 500));
  } else if (sel.jobId) {
    where.push('job_id = ?');
    values.push(sel.jobId);
  }
  if (sel.confidence) {
    where.push('confidence_score = ?');
    values.push(sel.confidence);
  }
  where.push("review_status <> 'rejected'");
  return { where, values };
}

export type EmailTargetRow = { id: string; company_name: string; decision_maker_name: string | null; company_website: string | null; email: string | null };

/** Email bulma hedefleri (website'i olan satirlar). */
export async function listDecisionMakerEmailTargets(sel: DecisionMakerSelector): Promise<EmailTargetRow[]> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey) return [];
  const { where, values } = buildSelectorWhere(tenantKey, sel);
  const limit = Math.min(Math.max(Number(sel.limit ?? 200), 1), 500);
  const [rows] = await pool.execute(
    `SELECT id, company_name, decision_maker_name, company_website, email
       FROM lead_decision_makers
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(confidence_score,'A','B','C'), updated_at DESC
      LIMIT ${limit}`,
    values as never[],
  );
  return rows as EmailTargetRow[];
}

export type DecisionMakerRecipient = { id: string; email: string; decision_maker_name: string | null; company_name: string; city: string | null };

/** Email'i OLAN karar vericiler → outreach alicilari. */
export async function listDecisionMakerRecipients(sel: DecisionMakerSelector): Promise<DecisionMakerRecipient[]> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey) return [];
  const { where, values } = buildSelectorWhere(tenantKey, sel);
  where.push("email IS NOT NULL", "email <> ''");
  const limit = Math.min(Math.max(Number(sel.limit ?? 500), 1), 1000);
  const [rows] = await pool.execute(
    `SELECT id, email, decision_maker_name, company_name, city
       FROM lead_decision_makers
      WHERE ${where.join(' AND ')}
      ORDER BY FIELD(confidence_score,'A','B','C'), updated_at DESC
      LIMIT ${limit}`,
    values as never[],
  );
  return rows as DecisionMakerRecipient[];
}

/** Karar verici satırının manuel inceleme durumunu güncelle (tenant-scoped). */
export async function updateDecisionMakerReview(id: string, status: DecisionMakerReviewStatus): Promise<boolean> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey || !id) return false;
  const [result] = await pool.execute(
    'UPDATE lead_decision_makers SET review_status = ? WHERE id = ? AND tenant_key = ?',
    [status, id, tenantKey] as never[],
  );
  return (result as { affectedRows?: number }).affectedRows ? true : false;
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
    `SELECT id, company_name, city, business_type, website, phone, google_maps_url, address,
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

/** Şirket havuzu satırının kalite durumunu manuel güncelle (tenant-scoped). */
export async function updateCompanyPoolStatus(
  id: string,
  status: CompanyQualityStatus,
  excludeReason?: string | null,
): Promise<boolean> {
  const tenantKey = getActiveTenantKey();
  if (!tenantKey || !id) return false;
  const reason = status === 'excluded' ? (excludeReason ?? 'Manuel olarak hariç tutuldu') : null;
  const [result] = await pool.execute(
    'UPDATE lead_company_pool SET quality_status = ?, exclude_reason = ? WHERE id = ? AND tenant_key = ?',
    [status, reason, id, tenantKey] as never[],
  );
  return (result as { affectedRows?: number }).affectedRows ? true : false;
}
