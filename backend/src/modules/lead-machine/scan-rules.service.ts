import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';

export interface ScanRule {
  id: string;
  icp_id: string | null;
  channel: string | null;
  rule_type: string;
  value: string;
  label: string | null;
  created_at: string;
}

export async function listScanRules(icpId?: string | null): Promise<ScanRule[]> {
  if (icpId !== undefined) {
    const [rows] = await pool.execute(
      'SELECT * FROM lead_scan_rules WHERE (icp_id = ? OR icp_id IS NULL) ORDER BY created_at DESC',
      [icpId],
    );
    return rows as ScanRule[];
  }
  const [rows] = await pool.execute('SELECT * FROM lead_scan_rules ORDER BY created_at DESC');
  return rows as ScanRule[];
}

export async function createScanRule(input: {
  icp_id?: string | null;
  channel?: string | null;
  rule_type?: string;
  value: string;
  label?: string | null;
}): Promise<ScanRule> {
  const id = randomUUID();
  await pool.execute(
    'INSERT IGNORE INTO lead_scan_rules (id, icp_id, channel, rule_type, value, label) VALUES (?, ?, ?, ?, ?, ?)',
    [id, input.icp_id ?? null, input.channel ?? null, input.rule_type ?? 'exclude_reject_tag', input.value, input.label ?? null],
  );
  const [rows] = await pool.execute('SELECT * FROM lead_scan_rules WHERE id = ?', [id]);
  const row = (rows as ScanRule[])[0];
  if (!row) {
    // Duplicate (IGNORE) — return existing
    const [existing] = await pool.execute(
      'SELECT * FROM lead_scan_rules WHERE COALESCE(icp_id, \'\') = COALESCE(?, \'\') AND COALESCE(channel, \'\') = COALESCE(?, \'\') AND value = ?',
      [input.icp_id ?? null, input.channel ?? null, input.value],
    );
    return (existing as ScanRule[])[0]!;
  }
  return row;
}

export async function deleteScanRule(id: string): Promise<void> {
  await pool.execute('DELETE FROM lead_scan_rules WHERE id = ?', [id]);
}

export async function getRulesForJob(icpId: string | null, channel: string): Promise<ScanRule[]> {
  const [rows] = await pool.execute(
    'SELECT * FROM lead_scan_rules WHERE (icp_id = ? OR icp_id IS NULL) AND (channel = ? OR channel IS NULL)',
    [icpId, channel],
  );
  return rows as ScanRule[];
}

export interface RejectionTagStat {
  tag: string;
  channel: string;
  icp_id: string | null;
  count: number;
}

export async function getRejectionStats(): Promise<RejectionTagStat[]> {
  // Aggregate reject_tags JSON array from lead_candidates (MySQL JSON_TABLE)
  const [rows] = await pool.execute(`
    SELECT jt.tag, lc.channel, lc.icp_id, COUNT(*) AS count
    FROM lead_candidates lc
    JOIN JSON_TABLE(
      COALESCE(lc.reject_tags, '[]'),
      '$[*]' COLUMNS (tag VARCHAR(200) PATH '$')
    ) AS jt
    WHERE lc.status = 'rejected' AND lc.reject_tags IS NOT NULL
    GROUP BY jt.tag, lc.channel, lc.icp_id
    ORDER BY count DESC
    LIMIT 50
  `);
  return (rows as Array<Record<string, unknown>>).map((r) => ({
    tag: String(r.tag ?? ''),
    channel: String(r.channel ?? ''),
    icp_id: r.icp_id ? String(r.icp_id) : null,
    count: Number(r.count),
  }));
}

export interface RejectionPatternAggregateResult {
  patterns: number;
}

export async function aggregateRejectionPatterns(): Promise<RejectionPatternAggregateResult> {
  await pool.execute(`
    INSERT INTO lead_rejection_patterns (id, channel, pattern, count, last_seen)
    SELECT
      UUID(),
      channel,
      pattern,
      COUNT(*) AS count,
      MAX(reviewed_at) AS last_seen
    FROM (
      SELECT
        lc.channel,
        TRIM(jt.tag) AS pattern,
        lc.reviewed_at
      FROM lead_candidates lc
      JOIN JSON_TABLE(
        COALESCE(lc.reject_tags, '[]'),
        '$[*]' COLUMNS (tag VARCHAR(200) PATH '$')
      ) AS jt
      WHERE lc.status = 'rejected'
        AND lc.reject_tags IS NOT NULL
        AND TRIM(jt.tag) <> ''

      UNION ALL

      SELECT
        lc.channel,
        LOWER(TRIM(lc.reject_reason)) AS pattern,
        lc.reviewed_at
      FROM lead_candidates lc
      WHERE lc.status = 'rejected'
        AND (lc.reject_tags IS NULL OR JSON_LENGTH(lc.reject_tags) = 0)
        AND lc.reject_reason IS NOT NULL
        AND TRIM(lc.reject_reason) <> ''
    ) AS source
    GROUP BY channel, pattern
    ON DUPLICATE KEY UPDATE
      count = VALUES(count),
      last_seen = GREATEST(lead_rejection_patterns.last_seen, VALUES(last_seen))
  `);

  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS count FROM lead_rejection_patterns',
  );
  const row = (rows as Array<Record<string, unknown>>)[0] ?? {};
  return { patterns: Number(row.count ?? 0) };
}

export interface ApprovedStats {
  total_approved: number;
  total_favorite: number;
  avg_lead_score: number | null;
  by_channel: Array<{ channel: string; count: number }>;
  by_country: Array<{ country: string; count: number }>;
  top_pain_points: Array<{ pain_point: string; count: number }>;
}

export async function getApprovedStats(): Promise<ApprovedStats> {
  const [totals] = await pool.execute(`
    SELECT
      SUM(status = 'approved') AS total_approved,
      SUM(status = 'favorite') AS total_favorite,
      ROUND(AVG(CAST(lead_score AS DECIMAL(4,1))), 1) AS avg_lead_score
    FROM lead_candidates WHERE status IN ('approved', 'favorite')
  `);
  const row = (totals as Array<Record<string, unknown>>)[0] ?? {};

  const [byChannel] = await pool.execute(`
    SELECT channel, COUNT(*) AS count
    FROM lead_candidates WHERE status IN ('approved', 'favorite')
    GROUP BY channel ORDER BY count DESC
  `);

  const [byCountry] = await pool.execute(`
    SELECT country, COUNT(*) AS count
    FROM lead_candidates WHERE status IN ('approved', 'favorite') AND country IS NOT NULL
    GROUP BY country ORDER BY count DESC LIMIT 10
  `);

  const [painPointRows] = await pool.execute(`
    SELECT jt.pain_point, COUNT(*) AS count
    FROM lead_candidates lc
    JOIN JSON_TABLE(
      COALESCE(JSON_EXTRACT(lc.raw_data, '$.analysis.pain_points'), '[]'),
      '$[*]' COLUMNS (pain_point VARCHAR(200) PATH '$')
    ) AS jt
    WHERE lc.status IN ('approved', 'favorite') AND lc.channel = 'b2b_directory'
    GROUP BY jt.pain_point ORDER BY count DESC LIMIT 10
  `);

  return {
    total_approved: Number(row.total_approved ?? 0),
    total_favorite: Number(row.total_favorite ?? 0),
    avg_lead_score: row.avg_lead_score !== null ? Number(row.avg_lead_score) : null,
    by_channel: (byChannel as Array<Record<string, unknown>>).map((r) => ({
      channel: String(r.channel ?? ''),
      count: Number(r.count),
    })),
    by_country: (byCountry as Array<Record<string, unknown>>).map((r) => ({
      country: String(r.country ?? ''),
      count: Number(r.count),
    })),
    top_pain_points: (painPointRows as Array<Record<string, unknown>>).map((r) => ({
      pain_point: String(r.pain_point ?? ''),
      count: Number(r.count),
    })),
  };
}
