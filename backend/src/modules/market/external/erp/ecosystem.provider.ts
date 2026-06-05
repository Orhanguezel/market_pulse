import type { RowDataPacket } from 'mysql2/promise';
import { getExternalPoolFromConfig, type ExternalPoolConfig } from '@/db/external';
import type { ErpCustomer, ErpOrder, ErpProvider } from './erp.types';

function toNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export class EcosystemSourceProvider implements ErpProvider {
  constructor(
    private readonly connectionKey: string,
    private readonly config: ExternalPoolConfig,
  ) {}

  private async requirePool() {
    const pool = await getExternalPoolFromConfig(this.connectionKey, this.config);
    if (!pool) {
      const err = new Error(`ERP connection is not configured: ${this.connectionKey}`);
      Object.assign(err, { statusCode: 503, code: 'EXTERNAL_DB_NOT_CONFIGURED' });
      throw err;
    }
    return pool;
  }

  async getCustomers(q?: string, limit = 50): Promise<ErpCustomer[]> {
    const pool = await this.requirePool();
    const cap = Math.min(Math.max(limit, 1), 200);
    const params: unknown[] = [];
    let where = 'WHERE COALESCE(is_approved, 1) = 1';

    if (q?.trim()) {
      where += ' AND (company_name LIKE ? OR city LIKE ? OR region LIKE ? OR tax_number LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }

    type Row = RowDataPacket & {
      id: string; user_id: string | null; company_name: string;
      city: string | null; region: string | null; tax_number: string | null; tax_office: string | null;
      credit_limit: string | number | null; current_balance: string | number | null; discount_rate: string | number | null;
      is_approved: number | null; list_public: number | null;
    };

    const [rows] = await pool.query<Row[]>(
      `SELECT id, user_id, company_name, city, region, tax_number, tax_office,
              credit_limit, current_balance, discount_rate, is_approved, list_public
         FROM dealer_profiles
         ${where}
        ORDER BY company_name ASC
        LIMIT ?`,
      [...params, cap],
    );

    return rows.map((r) => this.mapCustomer(r));
  }

  async getAllActiveCustomers(): Promise<ErpCustomer[]> {
    const pool = await this.requirePool();
    type Row = RowDataPacket & {
      id: string; user_id: string | null; company_name: string;
      city: string | null; region: string | null; tax_number: string | null; tax_office: string | null;
      credit_limit: string | number | null; current_balance: string | number | null; discount_rate: string | number | null;
      is_approved: number | null; list_public: number | null;
    };

    const [rows] = await pool.query<Row[]>(
      `SELECT id, user_id, company_name, city, region, tax_number, tax_office,
              credit_limit, current_balance, discount_rate, is_approved, list_public
         FROM dealer_profiles
        WHERE COALESCE(is_approved, 1) = 1
        ORDER BY company_name ASC
        LIMIT 5000`,
    );

    return rows.map((r) => this.mapCustomer(r));
  }

  async getProducts(): Promise<[]> {
    return [];
  }

  async getCustomerOrders(customerId: string): Promise<ErpOrder[]> {
    const pool = await this.requirePool();
    type Row = RowDataPacket & {
      id: string; order_no: string | null; dealer_profile_id: string | null; user_id: string | null;
      created_at: string; status: string | null; total_amount: string | number | null;
      line_total: string | number | null;
    };

    const [rows] = await pool.query<Row[]>(
      `SELECT
         o.id,
         COALESCE(o.order_no, o.id) AS order_no,
         COALESCE(o.dealer_profile_id, dp.id) AS dealer_profile_id,
         o.user_id,
         o.created_at,
         COALESCE(o.status, 'completed') AS status,
         o.total_amount,
         COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS line_total
       FROM orders o
       LEFT JOIN dealer_profiles dp ON dp.user_id = o.user_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE (o.dealer_profile_id = ? OR dp.id = ? OR o.user_id = ?)
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [customerId, customerId, customerId],
    );

    return rows.map((r) => ({
      id: r.id,
      siparisNo: r.order_no ?? r.id,
      customerId: r.dealer_profile_id ?? r.user_id ?? customerId,
      siparisTarihi: r.created_at,
      terminTarihi: null,
      durum: r.status ?? 'completed',
      toplamTutar: toNumber(r.total_amount, toNumber(r.line_total)),
    }));
  }

  private mapCustomer(row: {
    id: string; user_id: string | null; company_name: string;
    city: string | null; region: string | null; tax_number: string | null; tax_office: string | null;
    credit_limit: string | number | null; current_balance: string | number | null; discount_rate: string | number | null;
    is_approved: number | null; list_public: number | null;
  }): ErpCustomer {
    return {
      id: row.id,
      tur: row.list_public === 1 ? 'dealer' : 'customer',
      name: row.company_name,
      phone: null,
      address: [row.city, row.region].filter(Boolean).join(' / ') || null,
      discount: row.discount_rate != null ? toNumber(row.discount_rate) : null,
      email: null,
      website_url: null,
      google_maps_url: null,
      instagram_url: null,
      facebook_url: null,
      contact_name: toStringOrNull(row.tax_office),
      bayi_segment: row.is_approved === 1 ? 'approved' : null,
      hepsiburada_url: null,
      trendyol_url: null,
      amazon_url: null,
    };
  }
}
