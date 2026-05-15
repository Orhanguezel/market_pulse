# E3 Antigravity Prompt (Tek Komut)

Asagidaki metni Antigravity ajanina aynen ver:

```md
E3 UI dogrulama turunu baslat.

Proje: MarketPulse
Ortam:
- Base URL: http://localhost:3094
- Backend API root: /api/v1
- Admin login aktif

Referans dokumanlar:
1) docs/E3_ANTIGRAVITY_HANDOFF.md
2) docs/E3_UI_QA_RUNBOOK.md
3) docs/E3_BUG_TRIAGE_TEMPLATE.md
4) REFACTOR_CHECKLIST.md (E3 bolumu)

Gorev:
- E3 kapsamindaki tum sayfa/akislar icin PASS/FAIL sonucu uret.
- Ozellikle su alanlari test et:
  - /admin/market
  - /admin/market/targets
  - /admin/market/leads
  - /admin/market/signals
  - /admin/market/reports
  - /admin/site-settings (Marka Renkleri sekmesi)
  - Sidebar temizlik kontrolu
  - Dark mode okunabilirlik
  - Paspas'tan Ice Aktar akislari (targets + leads)

Kurallar:
- Bulgu onceligi: P0 > P1 > P2 > P3
- "API hazir degil" notunu sadece gercek endpoint/runtime blokajinda kullan.
- API blokajli issue varsa `blocked-by-api` etiketi ile isaretle.
- Her FAIL icin reproduksiyon adimlari ve kanit (screenshot/video) ekle.

Cikti formati (zorunlu):
1) Madde bazli PASS/FAIL ozeti
2) Oncelik sirasina gore bug listesi (P0-P3)
3) Her bug icin:
   - URL
   - Beklenen davranis
   - Mevcut davranis
   - Repro adimlari
   - Kanit
   - Etiket (varsa blocked-by-api)
4) Kapanis:
   - Kapatilan E3 maddeleri
   - Acik kalan E3 maddeleri + blok nedeni
```
