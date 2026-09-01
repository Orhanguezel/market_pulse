import { randomUUID } from 'node:crypto';
import { pool } from '@/db/client';
import type { RowDataPacket } from 'mysql2/promise';

export type CustomsEntityType = 'own' | 'competitor';
export type CustomsAliasMatchType = 'exact' | 'prefix';

export interface CustomsEntityAlias {
  id: string;
  alias: string;
  match_type: CustomsAliasMatchType;
}

export interface CustomsTrackedEntity {
  id: string;
  entity_type: CustomsEntityType;
  name: string;
  country: string | null;
  is_active: boolean;
  aliases: CustomsEntityAlias[];
}

export interface CustomsIntelligenceFilters {
  hsPrefix?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomsEntitySummary extends CustomsTrackedEntity {
  shipment_count: number;
  total_value_usd: number;
  total_quantity: number;
  net_weight: number;
  buyer_count: number;
  first_shipment_date: string | null;
  latest_shipment_date: string | null;
  observed_share_pct: number;
  trends: Array<{ period: string; shipment_count: number; total_value_usd: number }>;
  destinations: Array<{ country: string; shipment_count: number; total_value_usd: number }>;
}

type EntityRow = RowDataPacket & {
  id: string;
  entity_type: CustomsEntityType;
  name: string;
  country: string | null;
  is_active: number;
};

type AliasRow = RowDataPacket & CustomsEntityAlias & { entity_id: string };

function numberOf(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function listCustomsEntities(tenantKey: string): Promise<CustomsTrackedEntity[]> {
  const [entityRows] = await pool.execute<EntityRow[]>(
    `SELECT id, entity_type, name, country, is_active
       FROM customs_tracked_entities
      WHERE tenant_key = ?
      ORDER BY entity_type = 'own' DESC, name`,
    [tenantKey],
  );
  if (!entityRows.length) return [];

  const ids = entityRows.map((row) => row.id);
  const [aliasRows] = await pool.execute<AliasRow[]>(
    `SELECT id, entity_id, alias, match_type
       FROM customs_entity_aliases
      WHERE entity_id IN (${ids.map(() => '?').join(', ')})
      ORDER BY alias`,
    ids,
  );
  const aliasesByEntity = new Map<string, CustomsEntityAlias[]>();
  for (const alias of aliasRows) {
    const aliases = aliasesByEntity.get(alias.entity_id) ?? [];
    aliases.push({ id: alias.id, alias: alias.alias, match_type: alias.match_type });
    aliasesByEntity.set(alias.entity_id, aliases);
  }

  return entityRows.map((row) => ({
    id: row.id,
    entity_type: row.entity_type,
    name: row.name,
    country: row.country,
    is_active: Boolean(row.is_active),
    aliases: aliasesByEntity.get(row.id) ?? [],
  }));
}

export async function createCustomsEntity(
  tenantKey: string,
  input: {
    entityType: CustomsEntityType;
    name: string;
    country?: string | null;
    aliases: Array<{ alias: string; matchType?: CustomsAliasMatchType }>;
  },
): Promise<CustomsTrackedEntity> {
  const id = randomUUID();
  const cleanAliases = input.aliases
    .map((item) => ({ alias: item.alias.trim(), matchType: item.matchType ?? 'exact' }))
    .filter((item, index, all) => item.alias && all.findIndex((other) => other.alias.toLocaleUpperCase('tr-TR') === item.alias.toLocaleUpperCase('tr-TR')) === index)
    .slice(0, 30);
  if (!cleanAliases.length) cleanAliases.push({ alias: input.name.trim(), matchType: 'exact' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO customs_tracked_entities (id, tenant_key, entity_type, name, country)
       VALUES (?, ?, ?, ?, ?)`,
      [id, tenantKey, input.entityType, input.name.trim(), input.country?.trim() || null],
    );
    for (const item of cleanAliases) {
      await connection.execute(
        `INSERT INTO customs_entity_aliases (id, tenant_key, entity_id, alias, match_type)
         VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), tenantKey, id, item.alias, item.matchType],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return {
    id,
    entity_type: input.entityType,
    name: input.name.trim(),
    country: input.country?.trim() || null,
    is_active: true,
    aliases: cleanAliases.map((item) => ({ id: '', alias: item.alias, match_type: item.matchType })),
  };
}

export async function deleteCustomsEntity(tenantKey: string, id: string): Promise<boolean> {
  const [result] = await pool.execute(
    'DELETE FROM customs_tracked_entities WHERE tenant_key = ? AND id = ?',
    [tenantKey, id],
  );
  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}

function entityWhere(
  entity: CustomsTrackedEntity,
  filters: CustomsIntelligenceFilters,
): { sql: string; values: unknown[] } {
  const aliases = entity.aliases.length
    ? entity.aliases
    : [{ id: '', alias: entity.name, match_type: 'exact' as const }];
  const aliasParts: string[] = [];
  const values: unknown[] = [];
  for (const item of aliases) {
    aliasParts.push(item.match_type === 'prefix' ? 'exporter_name LIKE ?' : 'exporter_name = ?');
    values.push(item.match_type === 'prefix' ? `${item.alias}%` : item.alias);
  }
  const where = [`(${aliasParts.join(' OR ')})`];
  if (filters.hsPrefix?.trim()) {
    where.push('hs_code LIKE ?');
    values.push(`${filters.hsPrefix.trim()}%`);
  }
  if (filters.dateFrom) {
    where.push("COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d')) >= ?");
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.push("COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d')) <= ?");
    values.push(filters.dateTo);
  }
  return { sql: where.join(' AND '), values };
}

export async function getCustomsIntelligenceSummary(
  tenantKey: string,
  filters: CustomsIntelligenceFilters = {},
): Promise<{ entities: CustomsEntitySummary[]; observed_total_value_usd: number; observed_shipment_count: number }> {
  const entities = (await listCustomsEntities(tenantKey)).filter((entity) => entity.is_active);
  const summaries: CustomsEntitySummary[] = [];

  for (const entity of entities) {
    const where = entityWhere(entity, filters);
    const [totals] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS shipment_count,
              COALESCE(SUM(total_value), 0) AS total_value_usd,
              COALESCE(SUM(total_quantity), 0) AS total_quantity,
              COALESCE(SUM(net_weight), 0) AS net_weight,
              COUNT(DISTINCT buyer_name) AS buyer_count,
              MIN(COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d'))) AS first_shipment_date,
              MAX(COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d'))) AS latest_shipment_date
         FROM customs_records
        WHERE ${where.sql}`,
      where.values as never[],
    );
    const [trendRows] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE_FORMAT(COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d')), '%Y-%m') AS period,
              COUNT(*) AS shipment_count,
              COALESCE(SUM(total_value), 0) AS total_value_usd
         FROM customs_records
        WHERE ${where.sql}
        GROUP BY period
        HAVING period IS NOT NULL
        ORDER BY period`,
      where.values as never[],
    );
    const [destinationRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COALESCE(NULLIF(buyer_country, ''), 'Bilinmiyor') AS country,
              COUNT(*) AS shipment_count,
              COALESCE(SUM(total_value), 0) AS total_value_usd
         FROM customs_records
        WHERE ${where.sql}
        GROUP BY country
        ORDER BY total_value_usd DESC, shipment_count DESC
        LIMIT 10`,
      where.values as never[],
    );
    const total = totals[0] ?? {};
    summaries.push({
      ...entity,
      shipment_count: numberOf(total.shipment_count),
      total_value_usd: numberOf(total.total_value_usd),
      total_quantity: numberOf(total.total_quantity),
      net_weight: numberOf(total.net_weight),
      buyer_count: numberOf(total.buyer_count),
      first_shipment_date: total.first_shipment_date ? String(total.first_shipment_date) : null,
      latest_shipment_date: total.latest_shipment_date ? String(total.latest_shipment_date) : null,
      observed_share_pct: 0,
      trends: trendRows.map((row) => ({
        period: String(row.period),
        shipment_count: numberOf(row.shipment_count),
        total_value_usd: numberOf(row.total_value_usd),
      })),
      destinations: destinationRows.map((row) => ({
        country: String(row.country),
        shipment_count: numberOf(row.shipment_count),
        total_value_usd: numberOf(row.total_value_usd),
      })),
    });
  }

  const observedTotalValue = summaries.reduce((sum, item) => sum + item.total_value_usd, 0);
  const observedShipmentCount = summaries.reduce((sum, item) => sum + item.shipment_count, 0);
  for (const summary of summaries) {
    const denominator = observedTotalValue > 0 ? observedTotalValue : observedShipmentCount;
    const numerator = observedTotalValue > 0 ? summary.total_value_usd : summary.shipment_count;
    summary.observed_share_pct = denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
  }

  return {
    entities: summaries,
    observed_total_value_usd: observedTotalValue,
    observed_shipment_count: observedShipmentCount,
  };
}

export async function listCustomsEvidence(
  tenantKey: string,
  entityId: string,
  filters: CustomsIntelligenceFilters & { limit?: number; offset?: number } = {},
) {
  const entity = (await listCustomsEntities(tenantKey)).find((item) => item.id === entityId);
  if (!entity) return null;
  const where = entityWhere(entity, filters);
  const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 25)));
  const offset = Math.max(0, Math.floor(filters.offset ?? 0));
  const [countRows] = await pool.execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS count FROM customs_records WHERE ${where.sql}`,
    where.values as never[],
  );
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, shipment_date, month_year, exporter_name, buyer_name, origin_country,
            buyer_country, hs_code, hs_description, total_value, total_quantity,
            net_weight, source_provider, source_file, source_row_number
       FROM customs_records
      WHERE ${where.sql}
      ORDER BY COALESCE(shipment_date, STR_TO_DATE(CONCAT(month_year, ' 01'), '%b %Y %d')) DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}`,
    where.values as never[],
  );
  return { entity, count: numberOf(countRows[0]?.count), rows };
}
