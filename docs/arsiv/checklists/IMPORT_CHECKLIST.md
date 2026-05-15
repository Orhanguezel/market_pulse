# Market Pulse — Hedef İçe Aktarma Ceklist

**Amaç:** Mevcut Paspas ERP müşteri/bayi listesini Market Pulse hedef tablosuna çekmek + dışarıdan CSV/JSON liste yükleyebilmek.

**Durum:** Planlama — Uygulanmadı

---

## Mevcut Altyapı (Zaten Var)

- [x] `POST /market/sync-paspas` → `syncPaspasCustomersToTargets()` — Paspas müşterilerini `musteri` kategorisiyle çeker
- [x] `GET /market/external/paspas/customers` — Paspas müşteri arama endpoint'i
- [x] `import-paspas-customer-dialog.tsx` — Tek müşteri seçip import etme dialog'u (mevcut)

---

## Backend

### 1. Paspas Sync Genişletme

- [ ] `paspas.repository.ts`'e `getAllPaspasDealers()` fonksiyonu ekle
  - Paspas ERP DB'de bayi/distribütör tablosu veya flag'i var mı kontrol et
  - Varsa: ayrı query; yoksa: tüm müşterileri tek sorguyla çekip kategori mantığı uygula
- [ ] `paspas.sync.ts`'te `syncPaspasCustomersToTargets()` işlevini genişlet:
  - Parametre: `mode: 'all' | 'customers' | 'dealers'` (default: `'all'`)
  - Müşteri → `category: 'musteri'`, bayi/distribütör flag'i olanlar → `category: 'dealer'`
  - Mevcut davranış (sadece `musteri`) korunuyor — yeni parametre opsiyonel

### 2. Bulk Import Endpoint

- [ ] `POST /market/targets/bulk-import` endpoint'i ekle (`router.ts`)
- [ ] `controller.ts`'e `bulkImportTargets` handler yaz:
  ```
  Body: {
    rows: Array<{
      name: string;
      category?: 'musteri' | 'dealer' | 'prospect';
      website?: string;
      phone?: string;
      email?: string;
      contact_name?: string;
      city?: string;
      district?: string;
      notes?: string;
    }>;
    dry_run?: boolean;   // true → kaydetme, sadece preview döndür
    on_conflict?: 'skip' | 'update';  // default: 'skip'
  }
  ```
- [ ] Duplicate tespiti: `name` + `website` kombinasyonu (tam eşleşme)
- [ ] Yanıt: `{ inserted, skipped, updated, preview: Row[] }` (dry_run=true'da tümü preview)
- [ ] Validation: Zod şeması — `rows` max 500 kayıt
- [ ] `validation.ts`'e `bulkImportSchema` ekle

### 3. CSV Template Endpoint

- [ ] `GET /market/targets/import-template` — indirilebilir CSV şablonu döndür
  - `Content-Type: text/csv`, `Content-Disposition: attachment; filename="hedef-sablonu.csv"`
  - Kolonlar: `name,category,website,phone,email,contact_name,city,district,notes`
  - Örnek satır içerir

---

## Frontend (Admin Panel)

### 4. RTK Query Endpoint'leri

Dosya: `admin_panel/src/integrations/market/marketApi.ts` (veya mevcut market slice'ı)

- [ ] `syncPaspasTargets` mutation:
  ```ts
  // POST /market/sync-paspas
  // Body: { mode?: 'all' | 'customers' | 'dealers' }
  // Returns: { ok, inserted, updated, total, message }
  ```
- [ ] `bulkImportTargets` mutation:
  ```ts
  // POST /market/targets/bulk-import
  // Body: { rows, dry_run?, on_conflict? }
  // Returns: { inserted, skipped, updated, preview }
  ```
- [ ] `downloadImportTemplate` query (lazy):
  ```ts
  // GET /market/targets/import-template — CSV Blob döndürür
  ```

### 5. targets-panel.tsx Toolbar Butonu

- [ ] Mevcut "Yeni Hedef" butonunun yanına "İçe Aktar" butonu ekle
  - `<Button variant="outline" onClick={() => setImportOpen(true)}>`
  - Ikon: `Upload` (lucide-react)
- [ ] `importOpen` state ekle
- [ ] `<BulkImportDialog open={importOpen} onClose={() => setImportOpen(false)} onSuccess={refetch} />` render et

### 6. BulkImportDialog Bileşeni

Dosya: `admin_panel/src/app/(main)/admin/(admin)/market/_components/bulk-import-dialog.tsx`

- [ ] `<Dialog>` içinde `<Tabs>` ile iki sekme:

**Sekme 1 — Paspas DB'den Çek:**
- [ ] "Paspas ERP'deki tüm aktif müşteri ve bayileri çek" açıklama metni
- [ ] `mode` seçimi: `<RadioGroup>` — Tümü / Sadece Müşteriler / Sadece Bayiler
- [ ] "Senkronize Et" butonu → `syncPaspasTargets()` mutation
- [ ] Loading spinner göster
- [ ] Başarı sonucu: `"{total} kayıt işlendi: {inserted} eklendi, {updated} güncellendi"` toast + özet kutu

**Sekme 2 — Liste Yükle (CSV/JSON):**
- [ ] Şablon indir linki → `downloadImportTemplate` endpoint'i tetikler, CSV indirilir
- [ ] `<input type="file" accept=".csv,.json">` file picker
- [ ] CSV parse: `papaparse` kütüphanesi (zaten bağımlılıkta mı kontrol et; yoksa ekle)
- [ ] JSON parse: `JSON.parse()` — `Array<object>` veya `{ rows: [] }` formatı
- [ ] Parse sonrası `dry_run: true` ile `bulkImportTargets()` çağır
- [ ] **Preview tablosu** göster: `name, category, website, phone, durum (yeni/mevcut/hata)` kolonları
- [ ] Preview'de hata satırları kırmızı, mevcut kayıtlar sarı, yeni kayıtlar yeşil
- [ ] "Onayla ve Yükle" butonu → `dry_run: false` ile tekrar çağır
- [ ] Sonuç: toast + dialog kapat + liste refetch

### 7. Ek UX

- [ ] `on_conflict` seçeneği dialog'a ekle: "Mevcut kayıtları güncelle" checkbox (default: unchecked = skip)
- [ ] Maksimum 500 satır uyarısı (client-side satır sayısı kontrolü)
- [ ] Büyük dosya yüklemede progress feedback (satır sayısını göster)

---

## Sıralama / Öncelik

```
1. Backend: bulkImportTargets endpoint + validation        (önce)
2. Backend: CSV template endpoint                          (önce)
3. Frontend: RTK Query mutations                           (bağımlı: 1)
4. Frontend: BulkImportDialog — Sekme 1 (Paspas sync)     (bağımsız, hızlı)
5. Frontend: BulkImportDialog — Sekme 2 (CSV/JSON)        (bağımlı: 1,2,3)
6. Frontend: targets-panel.tsx buton                       (bağımlı: 5)
7. Backend: Paspas sync genişletme (bayi desteği)          (opsiyonel — Paspas DB'de bayi ayrımı varsa)
```

---

## Notlar

- `syncPaspasCustomersToTargets()` mevcut davranışı KORUNUYOR — sadece genişletiliyor
- Bulk import `dry_run=true` → hiç DB yazısı yok, sadece önizleme döndür
- CSV'den category kolonunda Türkçe alias kabul et: `müşteri → musteri`, `bayi → dealer`, `dağıtıcı/distribütör → distributor`
- Çakışma tespiti `name` üzerinden yapılır; `website` varsa öncelikli kullanılır
- `papaparse` frontend'de CSV parse için — mevcut `package.json` kontrol et
