# E3 Antigravity Handoff (Ready-to-Run)

Bu dokuman, E3 UI dogrulamasini tek turda calistirmak icin net gorev metnidir.

## Scope

- Kaynak: `docs/E3_UI_QA_RUNBOOK.md`
- Triage formati: `docs/E3_BUG_TRIAGE_TEMPLATE.md`
- Hedef: `REFACTOR_CHECKLIST.md` icindeki tum E3 maddelerini pass/fail ile kapatmak

## Test Ortami

- Base URL: `http://localhost:3094`
- Login: admin kullanicisi ile giris zorunlu
- Backend endpoint root: `/api/v1`

## Kritik Notlar

- `D2/F1/G1/D3` API tarafi checklist'te tamamlandi.
- "API hazir degil" notu sadece gercek endpoint/runtime hatasinda kullanilsin.
- Tum bulgular once davranis/regresyon olarak degerlendirilsin, sonra kozmetik.

## Test Matrisi (E3)

1. `/admin/market`
   - Dashboard aciliyor, stat kartlari gorunuyor
2. `/admin/market/targets`
   - Tablo aciliyor
   - "Yeni Hedef" dialogu aciliyor ve submit akisi calisiyor
   - Churn badge (`churn-low/medium/high`) gorunuyor
   - "Hesapla" butonu calisiyor
3. `/admin/market/leads`
   - Tablo aciliyor
   - "Yeni Lead" dialogu + submit akisi calisiyor
4. `/admin/market/signals`
   - Liste aciliyor
   - Manuel sinyal ekleme akisi calisiyor
5. `/admin/site-settings`
   - "Marka Renkleri" sekmesi aciliyor
   - Renk alanlari ve kaydet aksiyonu calisiyor
6. Sidebar
   - Silinen moduller gorunmuyor
   - Beklenen moduller + `market/reports` linki gorunuyor
7. Dark mode
   - Churn/severity badge okunakli
   - Kontrast kabul edilebilir
8. Paspas import
   - `/admin/market/targets` ve `/admin/market/leads` icinde "Paspas'tan Ice Aktar" akisi calisiyor
   - Musteri seciminde alanlar otomatik doluyor
9. Reports
   - `/admin/market/reports` aciliyor
   - PDF onizle aksiyonu tetikleniyor
   - E-posta gonder aksiyonu UI seviyesinde calisiyor

## Cikti Formati (Zorunlu)

1. Madde bazli `PASS/FAIL` tablo/ozet
2. Bulgu listesi (P0 -> P3 oncelik sirali)
3. Her bug icin:
   - URL
   - Beklenen / mevcut
   - Repro adimlari
   - Kanit (screenshot/video)
   - Etiket (`blocked-by-api` gerekiyorsa)
4. Final:
   - "Kapatilan E3 maddeleri"
   - "Acik kalan maddeler + blok nedeni"

## Triage Sonrasi Beklenen Is Akisi

1. P0/P1 bulgulari ayni turda fix backlog'una alin
2. P2/P3 ikinci tur polish olarak ayrilsin
3. Fix turu sonrasi yeniden build:
   - `backend: bun run build`
   - `admin_panel: bun run build`
