# Customs Import Runbook

Bu runbook, isletmeniyonet canlı DB `isle4509_vt.excel_data` kaynağındaki yaklaşık 10M gümrük kaydını MarketPulse paylaşımlı `customs_records` lake'ine aktarmak için kullanılır.

## Kaynak

Beklenen kolonlar:

- `hs_code`
- `buyer_name`
- `exporter_name`
- `hs_code_description`
- `total_value`
- `total_quantity`
- `month_year`

Opsiyonel kolonlar:

- `buyer_country`
- `country`
- `importer_country`

## Strateji

`customs_records` global reference lake'tir. `tenant_key` sadece provenance için `global` yazılır; üretilen `lead_candidates` aktif tenant'a scoped kalır.

Import iki şekilde yapılabilir:

- CSV stream: dosyayı RAM'e almadan satır satır okur, batch insert yapar.
- Staging table: dump önce MySQL staging tabloya yüklenir, sonra `INSERT IGNORE ... SELECT` ile lake'e aktarılır.

Canlı 10M yükte önerilen yol staging table + `--reload`. Büyük mediumtext/string kolonlarında `ORDER BY` yoktur; temp disk dolmasını önlemek için tam tarama InnoDB doğal sırasıyla yapılır.

## Komutlar

İhracat istihbaratı şeması ve ürün/ihracatçı arama sözlükleri (mevcut gölü silmez):

```bash
cd backend
bun run db:migrate
bun src/db/seed/index.ts --no-drop --only=042,043
```

CSV:

```bash
cd backend
CUSTOMS_IMPORT_BATCH_SIZE=5000 bun src/scripts/import-customs.ts /path/to/excel_data.csv --reload --benchmark
```

Staging table:

```bash
cd backend
bun src/scripts/import-customs.ts --from-table excel_data --reload --benchmark
```

Sadece benchmark:

```bash
cd backend
bun src/scripts/import-customs.ts --benchmark
```

EXIMPEDIA XLSX ve Avrasya pilot eşleştirmeleri:

```bash
cd backend
bun src/scripts/import-customs-xlsx.ts "../Car Mat World.xlsx" --product "CAR MAT" --provider EXIMPEDIA
bun src/scripts/import-customs-xlsx.ts "../Car Mat World 2nd Part.xlsx" --product "CAR MAT" --provider EXIMPEDIA
bun src/scripts/import-customs-xlsx.ts "../Avrasya Paspas.xlsx" --product "CAR MAT" --provider EXIMPEDIA
bun src/scripts/seed-customs-intelligence-avrasya.ts
```

`customs_tracked_entities` ve `customs_entity_aliases` tenant bazlıdır. Ham
`customs_records` global kalır. Panelde gösterilen "gözlemlenen pay", yalnızca
tanımlı kendi firma/rakiplerin bu veri setindeki toplamıdır; resmî pazar payı değildir.

Benchmark override:

```bash
cd backend
CUSTOMS_BENCH_HS_PREFIX_1=0904 \
CUSTOMS_BENCH_HS_PREFIX_2=8708 \
CUSTOMS_BENCH_MIN_VALUE=1000 \
CUSTOMS_BENCH_LIMIT=200 \
bun src/scripts/import-customs.ts --benchmark
```

Örnek customs job smoke:

```bash
cd backend
TENANT_KEY=vistaseeds bun src/scripts/import-customs.ts --run
```

## Kabul Kanıtı

Import sonrası kaydedilecek değerler:

```sql
SELECT COUNT(*) AS rows_total FROM customs_records;
SELECT COUNT(DISTINCT buyer_name) AS buyers_total FROM customs_records WHERE buyer_name IS NOT NULL AND buyer_name <> '';
SELECT hs_code, COUNT(*) AS cnt FROM customs_records GROUP BY hs_code ORDER BY cnt DESC LIMIT 10;
```

Benchmark çıktısında iki tipik sorgu alt-saniye hedeflenir:

- biber/agri: `hs_prefix=0904`, `min_value=1000`, `limit=200`
- otomotiv: `hs_prefix=8708`, `min_value=1000`, `limit=200`

Örnek çıktı:

```text
[import-customs] benchmark pepper hs_prefix=0904 product_query=- min_value=1000 limit=200: 200 buyers in 312ms
[import-customs] benchmark automotive hs_prefix=8708 product_query=- min_value=1000 limit=200: 200 buyers in 428ms
```

## Sorun Giderme

- Sorgular 1 sn üstündeyse önce `ANALYZE TABLE customs_records` tekrar çalıştır.
- HS prefix sorgusu yavaşsa `030_customs_schema.sql` içindeki `idx_customs_hs_value (hs_code, total_value)` indexinin canlı tabloda olduğunu doğrula.
- Product query yavaşsa HS prefix ile birlikte kullan; full text arama eklenene kadar boş ürün adı + HS prefix ana yol kabul edilir.
- Tekrar importta duplikasyon istemiyorsan `--reload` kullan. CSV yolunda `source_file + source_row_number` unique key'i tekrar çalıştırmayı idempotent hale getirir.
