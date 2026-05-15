# E3 Master Run Sequence

Bu dosya E3 operasyonunu tek akista yurutmek icin kisa komut dizisidir.

## 0) Hazirlik

- `docs/E3_OPERATION_BOARD.md` dosyasini ac
- `docs/E3_PREFLIGHT_CHECKLIST.md` kontrollerini tamamla
- Test ortaminin ayakta oldugunu dogrula
- `bash ./e3_preprobe_and_record.sh` calistir (PASS degilse devam etme)
- `docs/E3_PREPROBE_LAST_RUN.md` kaydinin guncellendigini dogrula
- `docs/E3_EXECUTION_LOG.md` dosyasinda baslangic durumunu guncelle

## 1) QA Baslat (Antigravity)

- Mesaj dosyasi: `docs/E3_STEP1_RUN_MESSAGE.md`
- Beklenen cikti:
  - PASS/FAIL ozeti
  - P0-P3 bug listesi
  - Kanitlar

## 2) Triage + Fix Baslat

- Mesaj dosyasi: `docs/E3_STEP2_TRIAGE_RUN_MESSAGE.md`
- Guncellenecek dosyalar:
  - `docs/E3_REPORT_INTAKE.md`
  - `docs/E3_TRIAGE_MAPPING_GUIDE.md`
  - `docs/E3_TRIAGE_REPORT_READY.md`
  - `docs/E3_FIX_QUEUE.md`

## 3) Smoke + Build

- Komut referansi: `docs/E3_SMOKE_TEST_COMMANDS.md`
- Zorunlu:
  - `backend bun run build`
  - `admin_panel bun run build`

## 4) Kapanis Ozeti

- Mesaj dosyasi: `docs/E3_STEP3_CLOSURE_RUN_MESSAGE.md`
- Son kontrol:
  - P0/P1 acik bug yok
  - E3 maddeleri PASS/FAIL/BLOCKED net
- `docs/E3_EXECUTION_LOG.md` icine ozet sonucu isle

## 5) Pilot Teslime Gecis

- Kontrol listesi: `docs/PILOT_DELIVERY_PACKAGE_CHECKLIST.md`
- Cikti:
  - Demo hazirlik durumu
  - Teklif/fatura hazirlik durumu
