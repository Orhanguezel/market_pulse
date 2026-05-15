# MarketPulse — Kurulum Ceklistı

> Proje: `/home/orhan/Documents/Projeler/paspas/market_pulse/`
> Oluşturulma: 2026-05-07
> Amaç: Paspas ERP'den taşıma + market modülü kurulumu

---

## Paspas ERP Temizliği

- [x] `backend/src/modules/market/` silindi
- [x] `backend/src/db/seed/sql/199_v1_market_pulse.sql` silindi
- [x] `backend/src/app.ts`'den market import ve `api.register` satırları kaldırıldı
- [x] `admin_panel/src/integrations/tags.ts`'den Market* etiketleri kaldırıldı
- [x] `admin_panel/src/integrations/hooks.ts`'den market endpoint export'u kaldırıldı
- [x] `admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts` silindi
- [x] `admin_panel/src/navigation/sidebar/sidebar-items.ts`'den market grubu ve Radar import'u kaldırıldı
- [x] `admin_panel/src/navigation/permissions.ts`'den market_pulse/targets/leads/signals keyleri kaldırıldı
- [x] `admin_panel/src/app/(main)/admin/(admin)/market/` dizini silindi

---

## market_pulse Backend

- [x] `backend/src/modules/market/schema.ts` oluşturuldu (`market_targets`, `market_leads`, `market_signals` Drizzle tanımları + DTO dönüşümleri)
- [x] `backend/src/modules/market/validation.ts` oluşturuldu (Zod şemaları: list/create/patch sorgular)
- [x] `backend/src/modules/market/controller.ts` oluşturuldu (tüm CRUD + stats handler'ları)
- [x] `backend/src/modules/market/router.ts` oluşturuldu (`registerMarketAdmin` fonksiyonu)
- [x] `backend/src/db/seed/sql/016_market_pulse_schema.sql` oluşturuldu (3 tablo CREATE)
- [x] `backend/src/routes/project.ts`'e `registerMarketAdmin` import ve çağrısı eklendi

---

## market_pulse Admin Panel

- [x] `admin_panel/src/integrations/tags.ts`'e Market* etiketleri eklendi
- [x] `admin_panel/src/integrations/endpoints/admin/market_admin.endpoints.ts` oluşturuldu (RTK Query API: tüm hook'lar + TypeScript tipleri)
- [x] `admin_panel/src/integrations/hooks.ts`'e market endpoint barrel export'u eklendi
- [x] `admin_panel/src/app/(main)/admin/(admin)/market/page.tsx` oluşturuldu
- [x] `admin_panel/src/app/(main)/admin/(admin)/market/targets/page.tsx` oluşturuldu
- [x] `admin_panel/src/app/(main)/admin/(admin)/market/leads/page.tsx` oluşturuldu
- [x] `admin_panel/src/app/(main)/admin/(admin)/market/signals/page.tsx` oluşturuldu
- [x] `market/_components/market-dashboard.tsx` oluşturuldu (stats kartları + navigasyon)
- [x] `market/_components/targets-panel.tsx` oluşturuldu (tablo + filtreler + sil/düzenle)
- [x] `market/_components/add-target-dialog.tsx` oluşturuldu (create/update dialog)
- [x] `market/_components/leads-panel.tsx` oluşturuldu (pipeline tablosu)
- [x] `market/_components/add-lead-dialog.tsx` oluşturuldu (create/update dialog)
- [x] `market/_components/signals-panel.tsx` oluşturuldu (sinyal listesi + incelendi akışı)
- [x] `market/_components/add-signal-dialog.tsx` oluşturuldu (manuel sinyal ekleme)
- [x] `admin_panel/src/navigation/sidebar/sidebar-items.ts`'e market grubu (id:4) eklendi

---

## Proje Adı / Metadata

- [x] `project.portfolio.json` "MarketPulse" olarak güncellendi (slug: `market-pulse`, clientName: Promat)

---

## Sonraki Adımlar

- [x] `bun run db:seed` — market_pulse DB'ye tabloları oluştur
- [x] Admin paneli dev ortamında test et (`/admin/market`)
- [ ] İlk müşteri verisi (Promat bayileri) manuel olarak gir
- [x] Scraper-service sinyallerini market_signals tablosuna bağla (`competitor.signal.ts`, `/scan-competitor`, `/scan-all-competitors`)
- [x] VPS'e deploy — https://panel.avrasyaotomotiv.net/market (mp-api:8086, mp-panel:3096)
