import type { RowDataPacket } from 'mysql2/promise';
import { getExternalPool } from '@/db/external';
import type { ErpCustomer, ErpOrder, ErpProduct, ErpProvider } from './erp.types';

function toNumber(v: string | number | null | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export class PromatErpProvider implements ErpProvider {
  constructor(private readonly connectionKey: string) {}

  private async requirePool() {
    const pool = await getExternalPool(this.connectionKey);
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
    let where = 'WHERE is_active = 1';

    if (q?.trim()) {
      where += ' AND (ad LIKE ? OR telefon LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term);
    }

    type Row = RowDataPacket & {
      id: string; tur: string; ad: string;
      telefon: string | null; adres: string | null; iskonto: string | null;
      email: string | null; website_url: string | null;
      google_maps_url: string | null; instagram_url: string | null; facebook_url: string | null;
      ilgili_kisi: string | null; bayi_segment: string | null;
      hepsiburada_url: string | null; trendyol_url: string | null; amazon_url: string | null;
    };
    const [rows] = await pool.query<Row[]>(
      `SELECT id, tur, ad, telefon, adres, iskonto,
              email, website_url, google_maps_url, instagram_url, facebook_url,
              ilgili_kisi, bayi_segment,
              hepsiburada_url, trendyol_url, amazon_url
       FROM musteriler
       ${where}
       ORDER BY ad ASC
       LIMIT ?`,
      [...params, cap],
    );

    return rows.map((r) => ({
      id:              r.id,
      tur:             r.tur,
      name:            r.ad,
      phone:           r.telefon,
      address:         r.adres,
      discount:        r.iskonto != null ? toNumber(r.iskonto) : null,
      email:           r.email,
      website_url:     r.website_url,
      google_maps_url: r.google_maps_url,
      instagram_url:   r.instagram_url,
      facebook_url:    r.facebook_url,
      contact_name:    r.ilgili_kisi,
      bayi_segment:    r.bayi_segment,
      hepsiburada_url: r.hepsiburada_url,
      trendyol_url:    r.trendyol_url,
      amazon_url:      r.amazon_url,
    }));
  }

  async getAllActiveCustomers(): Promise<ErpCustomer[]> {
    const pool = await this.requirePool();
    type Row = RowDataPacket & {
      id: string; tur: string; ad: string;
      telefon: string | null; adres: string | null; iskonto: string | null;
      email: string | null; website_url: string | null;
      google_maps_url: string | null; instagram_url: string | null; facebook_url: string | null;
      ilgili_kisi: string | null; bayi_segment: string | null;
      hepsiburada_url: string | null; trendyol_url: string | null; amazon_url: string | null;
    };
    const [rows] = await pool.query<Row[]>(
      `SELECT id, tur, ad, telefon, adres, iskonto,
              email, website_url, google_maps_url, instagram_url, facebook_url,
              ilgili_kisi, bayi_segment,
              hepsiburada_url, trendyol_url, amazon_url
       FROM musteriler
       WHERE is_active = 1
       ORDER BY ad ASC
       LIMIT 2000`,
    );
    return rows.map((r) => ({
      id:              r.id,
      tur:             r.tur,
      name:            r.ad,
      phone:           r.telefon,
      address:         r.adres,
      discount:        r.iskonto != null ? toNumber(r.iskonto) : null,
      email:           r.email,
      website_url:     r.website_url,
      google_maps_url: r.google_maps_url,
      instagram_url:   r.instagram_url,
      facebook_url:    r.facebook_url,
      contact_name:    r.ilgili_kisi,
      bayi_segment:    r.bayi_segment,
      hepsiburada_url: r.hepsiburada_url,
      trendyol_url:    r.trendyol_url,
      amazon_url:      r.amazon_url,
    }));
  }

  async getProducts(q?: string, limit = 50): Promise<ErpProduct[]> {
    const pool = await this.requirePool();
    const cap = Math.min(Math.max(limit, 1), 200);
    const params: unknown[] = [];
    let where = "WHERE is_active = 1 AND kategori IN ('urun', 'yarimamul')";

    if (q?.trim()) {
      where += ' AND (ad LIKE ? OR kod LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term);
    }

    type Row = RowDataPacket & {
      id: string; kategori: string; kod: string; ad: string; birim: string;
      stok: string; rezerve_stok: string; kritik_stok: string; birim_fiyat: string | null;
    };
    const [rows] = await pool.query<Row[]>(
      `SELECT id, kategori, kod, ad, birim, stok, rezerve_stok, kritik_stok, birim_fiyat
       FROM urunler
       ${where}
       ORDER BY ad ASC
       LIMIT ?`,
      [...params, cap],
    );

    return rows.map((r) => ({
      id:            r.id,
      kategori:      r.kategori,
      kod:           r.kod,
      name:          r.ad,
      birim:         r.birim,
      stock:         toNumber(r.stok),
      reservedStock: toNumber(r.rezerve_stok),
      criticalStock: toNumber(r.kritik_stok),
      unitPrice:     r.birim_fiyat != null ? toNumber(r.birim_fiyat) : null,
    }));
  }

  async getCustomerOrders(customerId: string): Promise<ErpOrder[]> {
    const pool = await this.requirePool();

    type Row = RowDataPacket & {
      id: string; siparis_no: string; musteri_id: string;
      siparis_tarihi: string; termin_tarihi: string | null; durum: string;
      toplam_tutar: string;
    };

    const [rows] = await pool.query<Row[]>(
      `SELECT
         s.id,
         s.siparis_no,
         s.musteri_id,
         s.siparis_tarihi,
         s.termin_tarihi,
         s.durum,
         COALESCE(SUM(k.miktar * k.birim_fiyat), 0) AS toplam_tutar
       FROM satis_siparisleri s
       LEFT JOIN siparis_kalemleri k ON k.siparis_id = s.id
       WHERE s.musteri_id = ? AND s.is_active = 1
       GROUP BY s.id
       ORDER BY s.siparis_tarihi DESC
       LIMIT 100`,
      [customerId],
    );

    return rows.map((r) => ({
      id:            r.id,
      siparisNo:     r.siparis_no,
      customerId:    r.musteri_id,
      siparisTarihi: r.siparis_tarihi,
      terminTarihi:  r.termin_tarihi,
      durum:         r.durum,
      toplamTutar:   toNumber(r.toplam_tutar),
    }));
  }
}
