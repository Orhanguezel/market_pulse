# E3 Operation Board

Bu dosya E3 surecinin tek sayfalik operasyon panosudur.

Master akis: `docs/E3_MASTER_RUN_SEQUENCE.md`
Canli takip: `docs/E3_EXECUTION_LOG.md`
Durum ozeti: `docs/E3_STATUS_SNAPSHOT.md`
Hemen baslat: `docs/E3_READY_NOW.md`
Son teknik probe kaydi: `docs/E3_PREPROBE_LAST_RUN.md`
Tek komut probe+kayit: `./e3_preprobe_and_record.sh`

## Adim 1 - QA Turu Baslat

- Prompt: `docs/E3_ANTIGRAVITY_PROMPT.md`
- Handoff: `docs/E3_ANTIGRAVITY_HANDOFF.md`
- Runbook: `docs/E3_UI_QA_RUNBOOK.md`
- Teknik gate: `bash ./e3_preprobe_and_record.sh` sonucu `PASS`

Beklenen cikti:
- PASS/FAIL raporu
- P0-P3 bug listesi
- Kanitlar (screenshot/video)

## Adim 2 - Triage

- Triage sablonu: `docs/E3_TRIAGE_REPORT_READY.md`
- Bug politikasi: `docs/E3_BUG_TRIAGE_TEMPLATE.md`
- Queue: `docs/E3_FIX_QUEUE.md`

Kural:
- P0/P1 fixleri ayni turda ele al
- `blocked-by-api` etiketlerini ayri takip et

## Adim 3 - Fix ve Dogrulama

- Smoke komutlari: `docs/E3_SMOKE_TEST_COMMANDS.md`
- Build kontrol:
  - `cd backend && bun run build`
  - `cd admin_panel && bun run build`

Kapanis:
- E3 maddeleri net durumda (pass/fail/blocked)
- P0/P1 acik bug yok

## Adim 4 - Pilot Teslim Hazirligi

- Teslim paketi: `docs/PILOT_DELIVERY_PACKAGE_CHECKLIST.md`

Kapanis:
- Demo + teklif/fatura ciktilari hazir
- Takip tarihi net

## Hizli Calistirma Mesajlari

- Adim 1 (QA): `docs/E3_STEP1_RUN_MESSAGE.md`
- Adim 2 (Triage/Fix): `docs/E3_STEP2_TRIAGE_RUN_MESSAGE.md`
- Adim 3 (Kapanis): `docs/E3_STEP3_CLOSURE_RUN_MESSAGE.md`
- Adim 4 (Pilot Handoff): `docs/E3_STEP4_PILOT_HANDOFF_MESSAGE.md`
