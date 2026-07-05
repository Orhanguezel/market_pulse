# Platform Admin — Çok-Kiracılı Yönetim + Ödeme-Bazlı Modül Yetkilendirme Çeklisti

> **Tarih:** 2026-07-05
> **Amaç:** Platform süper-admini (Orhan) TÜM tenant'ları ve üyelerini görebilsin; her tenant'ın **ödeme/abonelik durumuna** göre modüllere otomatik yetki verilsin (ödeme yoksa modül askıya alınsın). Kişi-bazlı modül matrisi (mail/takvim default) üzerine kurulur.
> **İlişkili:** `.claude/.../auth-onboarding-modul-matrisi` (Faz A/B), `docs/crm/ADMIN_TO_USER_DASHBOARD_PLAN.md`, `docs/crm/GMAIL_MAIL_ENTEGRASYONU_PLAN.md`.
> **Not:** Bu çeklist yeni bir büyük iş kalemidir; ödeme sağlayıcı seçimi (Bölüm C kararı) netleşmeden Faz 2'ye geçilmez.
>
> **KARARLAR (2026-07-05, kullanıcı):** Ödeme = **C1 Manuel** (admin işaretler; gateway sonra). **Faz 1 (cross-tenant) başlatıldı** — A4 tamamlandı ve deploy edildi.

---

## 0. Mevcut Durum (ne var / ne yok)

**Var:**
- [x] Çok-kiracılı temel: `tenants`, `tenant_user_roles` (user↔tenant, rol tenant_admin/tenant_editor), `tenant_modules` (tenant×modül).
- [x] `GET /tenants` (listTenants) + `POST /tenants/admin/onboard` (yeni tenant açma) — admin.
- [x] Admin kullanıcı listesi (`/admin/users`) **global** (tenant-scoped değil) — süper-admin tüm kullanıcıları görüyor.
- [x] Tenant-bazlı modül yönetimi: `/admin/modules` (tenant seçicili, activate/suspend, status, expires_at).
- [x] Kişi-bazlı modül matrisi (Faz B): `user_modules` tablosu, `entitlements/me` kişi-bazlı, `/admin/users/:id` Modül Erişimi kartı, mail/takvim default-açık.
- [x] `tenant_modules` billing alanları: `base_price`, `billing_period` (monthly/yearly), `price_snapshot`, `currency`, `status` (trial/active/suspended/cancelled), `expires_at`.

**Yok (bu çeklistin konusu):**
- [ ] Admin kullanıcı listesinde **her kullanıcının hangi tenant(lar)a ait olduğu** görünmüyor; tenant'a göre filtre yok.
- [ ] `/admin/users/:id` modül kartı **tek seçili tenant** varsayıyor — kullanıcının birden çok tenant'ı varsa yönetilemez.
- [ ] **Tenant genel görünümü** (her tenant: kaç üye, hangi modüller, ödeme durumu, bitiş) yok.
- [ ] **Gerçek ödeme/abonelik altyapısı YOK** — payment provider, subscription lifecycle, fatura, ödeme durumu → otomatik entitlement bağı yok.
- [ ] Ödeme süresi dolunca modülleri **otomatik askıya alma** (job) yok (`expires_at` alanı var ama kullanan job yok).

---

## Bölüm A — Çok-Kiracılı Admin Yönetimi (cross-tenant görünürlük)

Süper-admin tüm tenant'ları ve üyelerini görüp yönetebilsin.

- [ ] **A1. Tenant genel liste ekranı** (`/admin/tenants` genişlet): her tenant için ad, üye sayısı, aktif modül sayısı, ödeme/abonelik durumu, `expires_at`, hızlı "yönet" linki.
  - [ ] Backend: `GET /tenants` yanıtına özet alanlar ekle (üye sayısı, aktif modül sayısı, plan/ödeme durumu).
- [ ] **A2. Tenant detay ekranı** (`/admin/tenants/:key`): o tenant'ın üyeleri (tenant_user_roles JOIN users), her üyenin rolü + modül erişimi; tenant modül aç/kapa (mevcut `/admin/modules`'u bu ekrana taşı/bağla).
  - [ ] Backend: `GET /tenants/:key/members` (users + tenant rol + user_modules özeti).
- [ ] **A3. Kullanıcı listesinde tenant sütunu + filtre** (`/admin/users`): her kullanıcının tenant(lar)ı gösterilsin; tenant'a göre filtre.
  - [ ] Backend: admin users listesine `tenants[]` (tenant_user_roles'tan) ekle; `?tenant=` filtresi.
- [x] **A4. Kullanıcı detay modül kartı çok-tenant** (`/admin/users/:id`): ✅ TAMAM — kart artık kullanıcının üye olduğu HER tenant için ayrı modül bölümü gösterir (`GET /entitlements/user/:userId/tenants` + tenant başına matris). `getSelectedTenantKey` bağımlılığı kaldırıldı.
- [ ] **A5. Süper-admin guard netleştir:** cross-tenant uçlar yalnız global-admin (isSuperAdmin) erişebilsin; tenant_admin sadece kendi tenant'ını yönetsin.
  - [ ] `requireSuperAdmin` middleware (varsa kullan, yoksa ekle) cross-tenant admin uçlarına.

---

## Bölüm B — Ödeme-Bazlı Modül Yetkilendirme

Modül erişimi tenant'ın ödeme/abonelik durumuna bağlansın; ödeme yoksa/süresi dolduysa modül askıya alınsın.

- [ ] **B1. Abonelik/ödeme veri modeli** (yeni seed SQL, ALTER değil CREATE):
  - [ ] `tenant_subscriptions` (id, tenant_key, plan_key, status[active/past_due/canceled/trialing], current_period_end, provider, provider_ref, created/updated) — VEYA mevcut `tenant_modules.status/expires_at`'i "ödeme durumu" kaynağı yap.
  - [ ] (Opsiyonel) `payments` / `invoices` tablosu (ödeme geçmişi, tutar, tarih, provider_ref).
  - [ ] (Opsiyonel) `plans` tablosu: plan → hangi modüller (paket). module_catalog ile ilişkilendir.
- [ ] **B2. Ödeme durumu → entitlement bağı:**
  - [ ] `hasModule`/`listActiveTenantModules`'a ödeme durumu kontrolü ekle: tenant modülü ancak abonelik `active/trialing` VE süresi geçmemişse aktif sayılsın.
  - [ ] Ödeme `past_due/canceled` olunca ilgili modüller frontend'de gizlensin + backend guard 402 dönsün.
- [ ] **B3. Otomatik süre dolumu job'u:** günlük cron — `current_period_end`/`expires_at` geçmiş tenant modüllerini `suspended` yap; ödeme gelince geri `active`. (Mevcut `src/jobs/` deseni.)
- [ ] **B4. Admin ödeme yönetimi UI** (`/admin/tenants/:key`): plan seç, ödeme durumunu manuel işaretle (öde/askıya al), dönem bitişini ayarla; ödeme geçmişi.
- [ ] **B5. Manuel-öncelik akışı (MVP):** gerçek payment gateway'den ÖNCE, admin ödeme durumunu **elle** işaretlesin (paid → modüller aktif; unpaid → askıya). Bu, gateway olmadan çalışan minimum çözüm.

---

## Bölüm C — KARAR: Ödeme Sağlayıcı (Faz 2 blokeri)

Otomatik (elle olmayan) ödeme için sağlayıcı seçimi gerekir. Seçenekler:

- **(C1) Sadece manuel (MVP):** Admin ödeme durumunu elle işaretler. Gateway yok. En hızlı; az sayıda müşteri için yeterli. **Önerilen başlangıç.**
- **(C2) Iyzico:** TR pazarı, workspace'te başka projelerde kullanılıyor (CLAUDE.md). Abonelik/tekrarlayan ödeme + webhook ile otomatik entitlement.
- **(C3) Stripe:** Uluslararası, güçlü subscription API + webhook; TR kart kabulü sınırlı olabilir.

> **Öneri:** Faz 1'de **C1 (manuel)** ile başla — Bölüm A (cross-tenant) + B4/B5 (manuel ödeme durumu). Ölçeklenince C2/C3'ten biriyle otomatikleştir (webhook → tenant_subscriptions güncelle → job/guard devreye girer).

---

## Fazlı Uygulama Sırası

1. **Faz 1 — Cross-tenant görünürlük (Bölüm A):** A1→A5. Süper-admin tüm tenant/üyeleri görür, tenant başına modül yönetir. (Ödeme henüz manuel/statik.)
2. **Faz 2 — Manuel ödeme durumu (Bölüm B, C1):** B1 (minimal model) + B2 (durum→entitlement) + B4/B5 (admin manuel işaretleme) + B3 (süre dolum job'u).
3. **Faz 3 — Otomatik ödeme (C2 veya C3):** payment gateway + webhook + fatura; manuel işaretlemeyi otomatiğe çevir.

---

## Riskler / Notlar
- DB değişiklikleri yalnız seed SQL (ALTER yasak — CLAUDE.md); yeni tablolar CREATE + fresh/migrate.
- Cross-tenant uçlar **kesinlikle** yalnız isSuperAdmin erişimli olmalı (veri sızıntısı riski); tenant_admin kendi tenant'ıyla sınırlı.
- Kişi-bazlı `user_modules` (Faz B) + tenant ödeme durumu birlikte değerlendirilecek: kullanıcı modülü görür ancak (tenant modülü ödemeli VE aktif) VE (kişiye grant VEYA default-açık) ise.
- mail/takvim default-açık kuralı ödeme durumundan etkilenmemeli mi, yoksa ödeme yoksa onlar da mı kapansın? → Karar gerek (öneri: mail/takvim her zaman açık kalsın, temel verimlilik).
- Iyzico/Stripe seçilirse: `.env` secret yönetimi + webhook imza doğrulama (scraper-callback deseni gibi).
