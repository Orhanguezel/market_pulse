# E3 Antigravity Nihai Mesaj (Kopyala-Gonder)

```text
E3 UI QA turunu simdi baslat.

Proje: MarketPulse
Ortam:
- Base URL: http://localhost:3094
- Backend API root: /api/v1
- Admin login aktif

Bu dosyalari referans al:
1) docs/E3_MASTER_RUN_SEQUENCE.md
2) docs/E3_OPERATION_BOARD.md
3) docs/E3_ANTIGRAVITY_PROMPT.md
4) docs/E3_ANTIGRAVITY_HANDOFF.md
5) docs/E3_UI_QA_RUNBOOK.md
6) docs/E3_BUG_TRIAGE_TEMPLATE.md

Gorev:
- E3 kapsamindaki tum sayfa/akislar icin PASS/FAIL sonucu uret.
- Ozellikle test et:
  - /admin/market
  - /admin/market/targets
  - /admin/market/leads
  - /admin/market/signals
  - /admin/market/reports
  - /admin/site-settings (Marka Renkleri)
  - Sidebar temizlik kontrolu
  - Dark mode okunabilirlik
  - Paspas'tan Ice Aktar akislari (targets + leads)

Kurallar:
- Bulgu onceligi: P0 > P1 > P2 > P3
- "API hazir degil" notunu sadece gercek endpoint/runtime blokajinda kullan.
- API blokajli issue varsa `blocked-by-api` etiketi ile isaretle.
- Her FAIL icin reproduksiyon adimlari ve kanit (screenshot/video) ekle.

Zorunlu cikti:
1) Madde bazli PASS/FAIL ozeti
2) Oncelik sirasina gore bug listesi (P0-P3)
3) Her bug icin: URL, beklenen, mevcut, repro, kanit, etiket
4) Kapanis: Kapatilan E3 maddeleri + acik kalan E3 maddeleri + blok nedenleri

Tamamlayinca sonucu triage'a hazir formatta ver.
```
