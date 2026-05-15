import type { RowDataPacket } from 'mysql2/promise';
import { getExternalPool } from '@/db/external';

export type PaspasCustomer = {
  id: string;
  tur: string;
  name: string;
  phone: string | null;
  address: string | null;
  discount: number | null;
};

export type PaspasProduct = {
  id: string;
  kategori: string;
  kod: string;
  name: string;
  birim: string;
  stock: number;
  reservedStock: number;
  criticalStock: number;
  unitPrice: number | null;
};

export type PaspasOrder = {
  id: string;
  siparisNo: string;
  customerId: string;
  siparisTarihi: string;
  terminTarihi: string | null;
  durum: string;
  // Sipariş kalemleri toplamı (miktar * birim_fiyat) — DB'den hesaplanır
  toplamTutar: number;
};

async function requirePaspasPool() {
  const pool = await getExternalPool('PASPAS');
  if (!pool) {
    const err = new Error('Paspas ERP bağlantısı yapılandırılmamış (EXTERNAL_DB_PASPAS_* env gerekli)');
    Object.assign(err, { statusCode: 503, code: 'EXTERNAL_DB_NOT_CONFIGURED' });
    throw err;
  }
  return pool;
}

function toNumber(v: string | number | null | undefined, fallback = 0): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// -----------------------------------------------------------------------

export async function getPaspasCustomers(q?: string, limit = 50): Promise<PaspasCustomer[]> {
  const pool = await requirePaspasPool();
  const cap = Math.min(Math.max(limit, 1), 200);
  const params: unknown[] = [];
  let where = 'WHERE is_active = 1';

  if (q?.trim()) {
    where += ' AND (ad LIKE ? OR telefon LIKE ?)';
    const term = `%${q.trim()}%`;
    params.push(term, term);
  }

  type Row = RowDataPacket & { id: string; tur: string; ad: string; telefon: string | null; adres: string | null; iskonto: string | null };
  const [rows] = await pool.query<Row[]>(
    `SELECT id, tur, ad, telefon, adres, iskonto
     FROM musteriler
     ${where}
     ORDER BY ad ASC
     LIMIT ?`,
    [...params, cap],
  );

  return rows.map((r) => ({
    id:       r.id,
    tur:      r.tur,
    name:     r.ad,
    phone:    r.telefon,
    address:  r.adres,
    discount: r.iskonto != null ? toNumber(r.iskonto) : null,
  }));
}

// -----------------------------------------------------------------------
// Tüm aktif müşterileri sync için çeker — cap yok (ERP genelde < 2000 müşteri)

export async function getAllPaspasActiveCustomers(): Promise<PaspasCustomer[]> {
  const pool = await requirePaspasPool();
  type Row = RowDataPacket & { id: string; tur: string; ad: string; telefon: string | null; adres: string | null; iskonto: string | null };
  const [rows] = await pool.query<Row[]>(
    `SELECT id, tur, ad, telefon, adres, iskonto
     FROM musteriler
     WHERE is_active = 1
     ORDER BY ad ASC
     LIMIT 2000`,
  );
  return rows.map((r) => ({
    id:       r.id,
    tur:      r.tur,
    name:     r.ad,
    phone:    r.telefon,
    address:  r.adres,
    discount: r.iskonto != null ? toNumber(r.iskonto) : null,
  }));
}

// -----------------------------------------------------------------------

export async function getPaspasProducts(q?: string, limit = 50): Promise<PaspasProduct[]> {
  const pool = await requirePaspasPool();
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

// -----------------------------------------------------------------------

export async function getCustomerOrders(customerId: string): Promise<PaspasOrder[]> {
  const pool = await requirePaspasPool();

  type Row = RowDataPacket & {
    id: string; siparis_no: string; musteri_id: string;
    siparis_tarihi: string; termin_tarihi: string | null; durum: string;
    toplam_tutar: string;
  };

  // Sipariş toplamı kalemlerden hesaplanır (tabloda toplam kolonu yok)
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
