# E3 Report Intake (Paste Area)

Antigravity raporu gelir gelmez bu dosyaya ham ciktiyi yapistir.

## 1) Ham Rapor

```md
<!-- Antigravity ciktiyi buraya yapistir -->
```

## 2) Hizli Cikarim

- Toplam PASS:
- Toplam FAIL:
- Toplam BLOCKED:

- P0:
- P1:
- P2:
- P3:

## 2.1) Cursor Pre-Probe (2026-05-07 16:37 UTC+2)

Bu bolum tam UI QA yerine yalnizca route erisilebilirligini dogrular.

- `GET /admin/market` -> `200`
- `GET /admin/market/targets` -> `200`
- `GET /admin/market/leads` -> `200`
- `GET /admin/market/signals` -> `200`
- `GET /admin/market/reports` -> `200`
- `GET /admin/site-settings` -> `200`

Not: Bu sonuclar Antigravity E3 raporunun yerini tutmaz; sadece Adim 1 oncesi teknik erisim kontroludur.

## 2.2) Removed Route Probe (2026-05-07 16:45 UTC+2)

Silinen admin modullerinin route seviyesinde geri donmedigi dogrulandi:

- `GET /admin/availability` -> `404`
- `GET /admin/wallet` -> `404`
- `GET /admin/subscriptions` -> `404`
- `GET /admin/telegram` -> `404`

Not: Sidebar gorunurlugu yine de UI seviyesinde Antigravity tarafindan dogrulanmalidir.

### 2.2.1) Full Removed List Probe (2026-05-07 16:50 UTC+2)

Checklist'te silinen tum admin moduller icin route probe sonuclari:

- `availability` -> `404`
- `banners` -> `404`
- `campaigns` -> `404`
- `chat` -> `404`
- `email-templates` -> `404`
- `home-layout` -> `404`
- `llm-prompts` -> `404`
- `orders` -> `404`
- `reports` -> `404`
- `reviews` -> `404`
- `subscription-plans` -> `404`
- `subscriptions` -> `404`
- `telegram` -> `404`
- `wallet` -> `404`
- `announcements` -> `404`

## 2.3) Sidebar Config Static Probe (2026-05-07 16:47 UTC+2)

`admin_panel/src/navigation/sidebar/sidebar-items.ts` icinde:

- Silinen modul anahtarlarina ait eslesme bulunmadi (statik arama temiz).
- Beklenen aktif anahtarlar dogrulandi:
  - `external_db`
  - `market_pulse`
  - `market_targets`
  - `market_leads`
  - `market_signals`
  - `market_reports`

Not: Bu kontrol statik konfigurasyon seviyesindedir; son gorunurluk onayi Antigravity UI turunda alinacak.

## 2.4) Market Admin API Probe (2026-05-07 16:48 UTC+2)

Ilk denemede `/api/v1/market/*` probe'lari `404` dondu. Route yapisi kontrol edilince bu endpoint'lerin `admin` altinda oldugu teyit edildi:

- `GET /api/v1/admin/market/external/paspas/customers?limit=1` -> `401`
- `GET /api/v1/admin/market/reports/weekly/preview` -> `401`
- `POST /api/v1/admin/market/targets/:id/recalculate-churn` -> `401`

Yorum:
- `401` sonucu route'un mevcut oldugunu ve admin auth bekledigini gosterir.
- E3 UI turunda loginli oturumla bu akislarin fonksiyonel dogrulamasi yapilmalidir.

## 2.5) Lead-Machine Route Probe (2026-05-07 16:49 UTC+2)

Market lead-machine alt rotalarinin erisimi dogrulandi:

- `GET /admin/market/lead-machine/candidates` -> `200`
- `GET /admin/market/lead-machine/amazon` -> `200`
- `GET /admin/market/lead-machine/b2b` -> `200`
- `GET /admin/market/lead-machine/icp` -> `200`

Not: Bu adim route erisim kontroludur; fonksiyonel akislari Antigravity UI turu dogrulayacak.

## 2.6) Kept Route Probe (2026-05-07 16:51 UTC+2)

Checklist'e gore tutulacak admin moduller icin route probe sonuclari:

- `notifications` -> `200`
- `users` -> `200`
- `user-roles` -> `200`
- `site-settings` -> `200`
- `storage` -> `200`
- `audit` -> `200`
- `cache` -> `200`
- `db` -> `200`
- `profile` -> `200`
- `external-db` -> `200`
- `market` -> `200`
- `market/targets` -> `200`
- `market/leads` -> `200`
- `market/signals` -> `200`
- `market/reports` -> `200`

## 2.7) Churn Badge Style Static Probe (2026-05-07 16:53 UTC+2)

`targets-panel.tsx` icinde churn badge gorunum mantigi statik olarak dogrulandi:

- `score >= 60` -> `Yuksek Risk` + `text-gm-error` / `border-gm-error/20`
- `score >= 30` -> `Orta Risk` + `text-gm-warning` / `border-gm-warning/20`
- `score < 30` -> `Dusuk Risk` + `text-gm-success` / `border-gm-success/20`

Not: Renk kontrasti ve dark mode okunabilirligi nihai olarak Antigravity UI turunda goruntu bazli onaylanacak.

## 2.8) Reports Action Wiring Static Probe (2026-05-07 16:54 UTC+2)

`reports-panel.tsx` ve `market_admin.endpoints.ts` uzerinde statik baglanti kontrolu:

- UI aksiyonlari:
  - `PDF Onizle` -> `useLazyPreviewWeeklyReportQuery` -> `window.open(blobUrl)`
  - `Simdi Gonder` -> `useSendWeeklyReportMutation` (body: `{ to }`)
- Endpoint baglantilari:
  - `GET /admin/market/reports/weekly/preview` (blob response)
  - `POST /admin/market/reports/weekly/send`
- Hata/success geri bildirimi:
  - `toast.error('Rapor onizleme alinamadi')`
  - `toast.success('Haftalik rapor e-posta ile gonderildi')`
  - `toast.error('Rapor gonderilemedi')`

Not: Fonksiyonel sonuc (gercek PDF acilmasi / SMTP teslimi) loginli UI ve backend ortaminda Antigravity veya manuel E2E ile dogrulanmalidir.

## 2.9) Paspas Import Wiring Static Probe (2026-05-07 16:55 UTC+2)

`add-target-dialog.tsx` ve `add-lead-dialog.tsx` icinde Paspas import akisi statik olarak dogrulandi:

- Her iki dialogda da:
  - `useListPaspasCustomersQuery` ile arama/listeleme var
  - `Paspas'tan Ice Aktar` bolumu ve arama inputu var
  - Musteri seciminde `importPaspasCustomer(...)` cagrisi var
- Forma aktarilan alanlar:
  - `name`
  - `phone`
  - `notes` icine adres append (`Paspas adres: ...`)
- Target dialogunda ek olarak kategori map'i var:
  - `tur === 'tedarikci'` -> `partner`
  - digerleri -> `dealer`

Not: Musteri seciminden sonra alanlarin gorunur sekilde dolmasi ve submit davranisi Antigravity UI turunda fonksiyonel olarak dogrulanmali.

## 2.10) Brand Colors Tab Wiring Static Probe (2026-05-07 16:56 UTC+2)

`site-settings` tarafinda marka renk sekmesinin wiring'i statik olarak dogrulandi:

- Tab entegrasyonu:
  - `admin-site_settings-client.tsx` icinde `brand_colors` tab key'i var
  - Menu'de "Marka Renkleri" item'i var
  - `tab === 'brand_colors'` iken `<BrandColorsTab />` render ediliyor
- Veri akisi:
  - `useGetSiteSettingAdminByKeyQuery('brand_config')` ile fetch
  - `useUpdateSiteSettingAdminMutation()` ile save
  - Save payload: `{ key: 'brand_config', value: form, locale: '*' }`
- Form alanlari:
  - `primaryHex`, `primaryHexDark`, `accentHex`, `accentHexDark`, `sidebarBgCss`
  - Kaydet butonu ve success/error toast mesajlari mevcut

Not: Kaydet sonrasi gercek CSS override etkisi UI seviyesinde Antigravity turunda goruntuyle dogrulanmali.

## 3) Sonraki Aksiyon

- [ ] `docs/E3_TRIAGE_REPORT_READY.md` dosyasini doldur
- [ ] `docs/E3_FIX_QUEUE.md` kuyrugunu guncelle
- [ ] P0/P1 fix turunu baslat
