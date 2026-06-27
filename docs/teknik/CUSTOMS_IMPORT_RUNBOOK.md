# Customs Import Runbook

Tarih: 2026-06-27

## Model

`customs_records` paylasimli reference lake'tir. Tek kopya import edilir, tum tenant'lar ayni havuzu sorgular. `lead_candidates` ise mevcut lead-machine yazim yolu ile aktif tenant context'ine yazilir.

`customs_records` tenant-scope-guard `businessTables` listesine eklenmemelidir.

## Kaynak

Beklenen kaynak: isletmeniyonet canli DB `isle4509_vt.excel_data` dump'i.

CSV kolonlari:

- `hs_code`
- `buyer_name`
- `exporter_name`
- `hs_code_description`
- `total_value`
- `total_quantity`
- `month_year`
- opsiyonel: `buyer_country`

## Import

CSV dosyasi hazir oldugunda backend dizininden calistir:

```bash
bun src/scripts/import-customs.ts /path/to/excel_data.csv --reload --benchmark
```

`--reload`, global lake'i yeniden yuklemek icin `TRUNCATE TABLE customs_records` calistirir. Incremental/idempotent yukleme icin `--reload` kullanma:

```bash
bun src/scripts/import-customs.ts /path/to/excel_data.csv --benchmark
```

Script satirlari stream ederek okur ve `CUSTOMS_IMPORT_BATCH_SIZE` ile kontrol edilen batch'lerle yazar. Varsayilan batch boyutu `5000`.

```bash
CUSTOMS_IMPORT_BATCH_SIZE=10000 bun src/scripts/import-customs.ts /path/to/excel_data.csv --benchmark
```

## Idempotency

Idempotency stratejisi: `source_file + source_row_number`.

Tabloda `UNIQUE KEY uq_customs_source_row (source_file, source_row_number)` vardir ve import `INSERT IGNORE` kullanir. Ayni dosya tekrar yuklenirse ayni satirlar duplicate uretilmez.

Kaynak dosyanin icerigi degisti ama dosya adi ayni kaldiysa tam yenileme icin `--reload` kullan.

## Sonrasi

Import bittiginde script `ANALYZE TABLE customs_records` calistirir. `--benchmark` tipik bir HS sorgusunu olcer:

```text
hs_prefix=0904 min_value=1000 limit=200
```

Hedef: tipik HS prefix + min value + limit 200 sorgusu 1 saniyenin altinda.

## Demo Job

Importtan sonra test lead uretimi icin:

```bash
TENANT_KEY=avrasya bun src/scripts/import-customs.ts --run
```

Bu komut import yapmaz; `0904` prefix'iyle customs job baslatir ve aday istatistiklerini yazar.
