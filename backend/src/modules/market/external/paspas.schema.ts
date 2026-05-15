/**
 * Paspas ERP — Okuma amaçlı minimal Drizzle şeması.
 * Kaynak: paspas/backend/src/db/seed/sql/104-107_*.sql
 *
 * Bu tablolar Paspas ERP DB'sindedir, market_pulse DB'sinde YOK.
 * Sadece getExternalPool('PASPAS') ile elde edilen pool üzerinden sorgulanır.
 */

import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  date,
  decimal,
  tinyint,
  int,
} from 'drizzle-orm/mysql-core';

// musteriler — gerçek kolonlar: id, tur, ad, telefon, adres, iskonto, is_active
// NOT: email ve city kolonu YOKTUR
export const paspasCustomers = mysqlTable('musteriler', {
  id:         char('id', { length: 36 }).primaryKey().notNull(),
  tur:        varchar('tur', { length: 32 }).notNull().default('musteri'),
  ad:         varchar('ad', { length: 255 }).notNull(),
  telefon:    varchar('telefon', { length: 32 }),
  adres:      varchar('adres', { length: 500 }),
  iskonto:    decimal('iskonto', { precision: 5, scale: 2 }),
  is_active:  tinyint('is_active').notNull().default(1),
  created_at: datetime('created_at').notNull(),
});

// urunler — stok/fiyat + kategori
export const paspasProducts = mysqlTable('urunler', {
  id:           char('id', { length: 36 }).primaryKey().notNull(),
  kategori:     varchar('kategori', { length: 32 }).notNull().default('urun'),
  kod:          varchar('kod', { length: 64 }).notNull(),
  ad:           varchar('ad', { length: 255 }).notNull(),
  birim:        varchar('birim', { length: 16 }).notNull().default('kg'),
  stok:         decimal('stok', { precision: 12, scale: 4 }).notNull().default('0'),
  rezerve_stok: decimal('rezerve_stok', { precision: 12, scale: 4 }).notNull().default('0'),
  kritik_stok:  decimal('kritik_stok', { precision: 12, scale: 4 }).notNull().default('0'),
  birim_fiyat:  decimal('birim_fiyat', { precision: 12, scale: 2 }),
  is_active:    tinyint('is_active').notNull().default(1),
});

// satis_siparisleri — NOT: toplam kolonu yok, tarih -> siparis_tarihi
export const paspasOrders = mysqlTable('satis_siparisleri', {
  id:             char('id', { length: 36 }).primaryKey().notNull(),
  siparis_no:     varchar('siparis_no', { length: 64 }).notNull(),
  musteri_id:     char('musteri_id', { length: 36 }).notNull(),
  siparis_tarihi: date('siparis_tarihi').notNull(),
  termin_tarihi:  date('termin_tarihi'),
  durum:          varchar('durum', { length: 32 }).notNull().default('taslak'),
  is_active:      tinyint('is_active').notNull().default(1),
  created_at:     datetime('created_at').notNull(),
});

// siparis_kalemleri — toplam hesaplamak için (miktar * birim_fiyat)
export const pasPasSiparisKalemleri = mysqlTable('siparis_kalemleri', {
  id:          char('id', { length: 36 }).primaryKey().notNull(),
  siparis_id:  char('siparis_id', { length: 36 }).notNull(),
  urun_id:     char('urun_id', { length: 36 }).notNull(),
  miktar:      decimal('miktar', { precision: 12, scale: 4 }).notNull(),
  birim_fiyat: decimal('birim_fiyat', { precision: 12, scale: 2 }).notNull(),
  sira:        int('sira').notNull().default(0),
});

export type PaspasCustomerRow = typeof paspasCustomers.$inferSelect;
export type PaspasProductRow  = typeof paspasProducts.$inferSelect;
export type PaspasOrderRow    = typeof paspasOrders.$inferSelect;
export type PaspasKalemRow    = typeof pasPasSiparisKalemleri.$inferSelect;
