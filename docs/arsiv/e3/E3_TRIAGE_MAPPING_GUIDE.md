# E3 Triage Mapping Guide

Bu rehber, Antigravity raporunu hizli sekilde ilgili dosyalara dagitmak icin kullanilir.

## Kaynak ve Hedefler

- Kaynak: `docs/E3_REPORT_INTAKE.md` (ham rapor + hizli cikarim)
- Hedef 1: `docs/E3_TRIAGE_REPORT_READY.md`
- Hedef 2: `docs/E3_FIX_QUEUE.md`
- Hedef 3: `docs/E3_EXECUTION_LOG.md`

## Mapping Kurali

1. `PASS/FAIL/BLOCKED` ozetini `E3_TRIAGE_REPORT_READY.md` -> "Pass/Fail Ozeti" altina isleyin.
2. Her FAIL bulgu icin ticket acin:
   - Baslik
   - URL
   - Beklenen / mevcut
   - Repro
   - Kanit
   - Etiket (`blocked-by-api` veya `yok`)
3. P0/P1 maddeleri `E3_FIX_QUEUE.md` dosyasinda en ustte ve `in_progress` olacak.
4. P2/P3 maddeleri `todo` kalabilir.
5. Adim durumu:
   - QA raporu geldiyse `E3_EXECUTION_LOG.md` Adim 1 -> `done`
   - Triage basladiysa Adim 2 -> `in_progress`

## Hata Onceligi Donusumu

- "Sayfa acilmiyor / crash / runtime exception" -> P0
- "Kaydet, guncelle, sil gibi ana aksiyon bozuk" -> P1
- "Kontrast, okunabilirlik, tooltip, fallback metni" -> P2
- "Spacing, icon, metin duzeltmesi" -> P3

## Kapanis Kontrolu

- P0/P1 kapali degilse Adim 3'e gecilmez.
- Her fix turundan sonra:
  - `cd backend && bun run build`
  - `cd admin_panel && bun run build`
