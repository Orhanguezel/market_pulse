# Market Pulse — Tam SaaS / Multi-Tenant Dönüşüm Raporu

**Tarih:** 2026-06-02
**Hazırlayan:** Claude Code (mimar)
**Amaç:** market_pulse'ı tek-org uygulamadan **gerçek çok-kiracılı (multi-tenant) SaaS**'a dönüştürmek; aynı kod tabanını **Avrasya Paspas** ve **VistaSeeds/Tarım** için (her iki sunucuda) güvenle kullanmak; riskleri elimine etmek; **tarım'ı yeni tenant** olarak eklemek.
**Kapsam notu:** Bu rapor BLUEPRINT'tir. Uygulama ayrı oturumda market_pulse repo'sunda yapılacak.
**Repo:** https://github.com/Orhanguezel/market_pulse.git → vps-vistainsaat'a çekilecek.

**Uygulama durumu (2026-06-02):** Bu rapordaki tam SaaS modeli, `MARKET_PULSE_TENANT_CEKLIST_PLANI.md` ile deploy-başına tek aktif tenant kararına indirgenerek uygulanıyor. Faz 1 tenant config çekirdeği (`026_tenancy_schema.sql`, `TENANT_KEY`, `core/tenant.ts`, tenant testleri) tamamlandı ve GitHub'a pushlandı. Faz 2'de iş tablo seed'lerine `tenant_key`, additive `db:migrate` runner ve market/lead/public/amazon repo scoping büyük ölçüde eklendi; cross-tenant izolasyon testi ve test expectation bakımı hâlâ açık.

---

## 1. Yönetici Özeti

market_pulse mimari olarak olgun (Fastify+Bun+MySQL+Drizzle, lead-machine: fair/b2b/competitor/amazon/enrichment/outreach/icp, ayrı Python scraper-service). Fuar (Automechanika'da Messe Frankfurt API: 429 exhibitor, %88 mail) ve rakip/B2B keşfi **çalışıyor**.

**Ama gerçek multi-tenancy YOK.** Bugün:
- Veri izolasyonu yok — iş tabloları (lead_candidates, icp_profiles, market…) `tenant_id` taşımıyor.
- `user_plans`/`user_scan_usage` var ama **user-bazlı** (org/tenant değil).
- Config tek-tenant: `EXTERNAL_DB_PASPAS` sabit, global API key'leri (Scraper/Keepa/Apollo).
- Seed paspas'a özgü (`019_promat_initial_market_targets`).

→ İki müşteriyi (Avrasya + Tarım) **aynı kurulumda izole** çalıştırmak için **tenant katmanı eklenmeli.** Bu rapor onu + risk eliminasyonunu + deploy topolojisini tanımlar.

---

## 2. Mevcut Durum (delillerle)

| Alan | Durum | Kanıt |
|---|---|---|
| Tenant modeli | YOK | Sadece `storage/schema.ts`'te tenant izi; `user_roles` rolleri global (admin/editor/…), tenant üyeliği yok |
| İş tabloları izolasyonu | YOK | `018_lead_machine_schema`: icp_profiles, lead_search_jobs, lead_candidates, lead_enrichment, lead_outreach_drafts, lead_rejection_patterns, lead_scan_rules → hiçbirinde tenant_id |
| SaaS plan/kota | Kısmi (user-level) | `022_public_saas_schema`: user_plans (free/starter/pro/agency), user_scan_usage |
| Config | Tek-tenant | env.ts: EXTERNAL_DB_PASPAS sabit; SCRAPER/KEEPA/APOLLO global key |
| Scraper auth | Düz key listesi | scraper-service `.env`: `API_KEYS=scraper-geoserra-change-me` (tenant-kota yok) |
| Seed | Paspas'a özgü | `019_promat_initial_market_targets.sql` |
| BYOK | Var (Keepa) | `023_byok_keepa_schema` — per-müşteri anahtar fikri mevcut, genişletilebilir |

**Sonuç:** İskelet var, izolasyon yok. Dönüşüm "sıfırdan yazma" değil, **tenant katmanı + scoping + config'i tenant'a taşıma** işi.

---

## 3. Hedef Mimari (true multi-tenant)

**Model: tek kod + tek DB + satır-seviyesi tenant izolasyonu (shared schema, row-level).**
(Alternatif "DB-per-tenant" daha izole ama operasyon yükü ağır; KOBİ SaaS için row-level + sıkı scoping yeterli ve ekosistem standardıyla — ekosistem-sosyal-medya'daki `tenant_key` pattern'i — uyumlu.)

```
tenants (id, key, name, plan, status, settings_json)
  └─ tenant_members (tenant_id, user_id, role)   ← kullanıcı ↔ tenant ↔ rol
  └─ TÜM iş tabloları: + tenant_id (FK, index, her sorguda zorunlu filtre)
  └─ tenant_settings / tenant_secrets            ← ICP defaultları, external DB, BYOK key, scraper token
  └─ tenant_plans + tenant_usage                 ← user_plans'in tenant'a taşınmış hali (kota)
```

**Kilit prensip:** Hiçbir iş sorgusu `tenant_id` filtresi olmadan çalışmaz. Bunu **repo-helper + middleware** ile zorunlu kıl (geliştiricinin unutması imkansız olsun).

---

## 4. Multi-Tenancy Uygulama Planı (somut)

### 4.1 Şema (yeni seed dosyaları — ALTER YASAK, CREATE TABLE)
- `0XX_tenancy_schema.sql`: `tenants`, `tenant_members`, `tenant_settings`, `tenant_secrets`, `tenant_plans`, `tenant_usage`
- Mevcut iş tablolarına `tenant_id` eklemek = **ilgili CREATE TABLE seed'lerini güncelle** (018, 016/020 market, 021 amazon, 025 outreach, 017 external_db). ALTER değil — seed'de tanıma ekle, `db:seed:fresh`.
- Her tabloya: `tenant_id VARCHAR/BIGINT NOT NULL`, `INDEX(tenant_id)`, gerektiğinde `UNIQUE(tenant_id, …)`.

### 4.2 Auth & bağlam
- JWT'ye **aktif tenant** + tenant rolü ekle (veya `X-Tenant` header + üyelik doğrulaması).
- Middleware: `requireTenant` → istekteki tenant'a kullanıcının üyeliğini doğrular, `req.tenantId` set eder.
- `user_roles` (global) → **tenant_members.role** (tenant başına rol). Global süper-admin ayrı tutulur.

### 4.3 Sorgu izolasyonu (en kritik — risk eliminasyonu)
- **Repo-helper zorunluluğu:** tüm read/write `repoX(tenantId, …)` imzası alır; `tenant_id` filtresi helper içinde eklenir.
- Drizzle için ortak `withTenant(qb, tenantId)` sarmalayıcı; lint/review kuralı: çıplak `db.select().from(businessTable)` yasak.
- Test: tenant-izolasyon testi (A tenant'ı B'nin verisini ASLA görmez) — `__tests__` altına eklenir.

### 4.4 Config'i tenant'a taşı
- `EXTERNAL_DB_PASPAS` (env) → `tenant_settings.external_db` (her tenant kendi ERP/DB bağlantısı; tarım'ın paspas ERP'si yok, olmayabilir).
- ICP defaultları, fuar/dizin kaynakları, dil/locale → `tenant_settings`.
- API anahtarları: **BYOK** (Keepa zaten var) modelini genişlet → `tenant_secrets` (Apollo, scraper token, mail SMTP) şifreli sakla. Global fallback opsiyonel.

### 4.5 Kota & plan
- `user_plans` → `tenant_plans` (free/starter/pro/agency tenant başına). `user_scan_usage` → `tenant_usage` (günlük tarama/lead kotası tenant başına).
- Kota guard: scan/lead/outreach işlemleri tenant kotasına bakar.

### 4.6 scraper-service tarafı
- Düz `API_KEYS` → **tenant başına token** + tenant başına rate-limit/kota.
- Her scrape isteğinde `tenant_id` (veya tenant token) iletilir; loglar tenant'a yazılır.
- Callback webhook imzası (SCRAPER_CALLBACK_SECRET) tenant bağlamı taşır.

---

## 5. Risk Eliminasyon Planı

| Risk | Önlem |
|---|---|
| **Veri sızıntısı (cross-tenant)** | Row-level tenant_id + zorunlu repo-helper + izolasyon testi + review kuralı. EN ÖNCELİKLİ. |
| **Scraping ToS / yasal** | Mümkünse resmi API (Messe Frankfurt fuar API gibi) tercih et. ToS'a saygılı rate-limit, robots kontrolü, public-data sınırı. Riskli kaynakları tenant'ın kendi onayına/sorumluluğuna bağla. |
| **KVKK / GDPR (kişisel veri)** | Scrape edilen kişi/mail verisi = kişisel veri. Tenant başına veri işleme amacı, saklama süresi, silme/opt-out akışı; aydınlatma metni. Mail outreach'te onay/abonelikten çıkma. |
| **Sır yönetimi** | tenant_secrets şifreli (at-rest encryption / KMS). Env'de müşteri sırrı tutma. BYOK varsayılan. |
| **Anti-bot kırılganlığı** | scraper-service (Scrapling) + retry/circuit-breaker + kaynak başına sağlık izleme; bir kaynak düşerse diğerleri etkilenmez. |
| **Kota suistimali / maliyet** | tenant_usage + plan limitleri + Keepa/Apollo token bütçesi tenant başına. |
| **Tek-org seed kalıntısı** | `019_promat_*` paspas seed'ini tenant-bağımlı yap veya tenant onboarding script'ine taşı; default seed nötr olsun. |
| **İki-sunucu split-brain** | DB tek kaynak olmalı (aşağıya bak). Aynı tenant iki ayrı DB'de tutulmaz. |

---

## 6. Tarım Tenant'ı Onboarding

1. `tenants` → key `tarim` (veya `vistaseeds`), plan, locale `tr`.
2. `tenant_settings`: agri ICP (tohum/fide sektörü), **agri fuar kaynakları** (Growtech Antalya, Fruit Logistica Berlin, EIMA), dizinler (Eurofruit, agri Europages kategorileri).
3. `tenant_members`: Orhan = owner/admin.
4. External DB: tarım'ın ERP'si yoksa boş; varsa vistaseeds DB bağlanır.
5. İlk PoC: bir agri fuarı exhibitor taraması + Yüksel/MAY web/ihracat ayak izi → tek rapor.
6. **Sosyal sinyalle köprü:** rakip handle'ları (@yukseltohum, @MAY_Tohum) ekosistem-sosyal-medya'dan; market_pulse fuar/B2B tarafını ekler. (Sınır: sosyal=ekosistem-sosyal-medya, fuar/B2B/lead=market_pulse — kod tekrarı yok.)

---

## 7. Deployment Topolojisi (KARAR GEREKLİ)

İstek: "her iki sunucuda da Avrasya ve VistaSeeds için kullanalım." Üç seçenek:

- **A) Tek merkezi SaaS (ÖNERİLEN):** market.tarvista.com (187.124.166.65) = tek backend + tek DB, **tüm tenant'lar burada** (Avrasya + Tarım). vps-vistainsaat sadece agri ekosistem (sosyal/site) kalır; gerekirse market_pulse'a oradan API ile bağlanır. → En temiz, split-brain yok, SaaS ruhuna uygun.
- **B) İki bağımsız kurulum:** Her sunucuda ayrı market_pulse + ayrı DB; Avrasya 187'de, Tarım vps-vistainsaat'ta. Multi-tenant yine şart (her kurulum çok tenant alabilsin) ama **veri bölünür**. Yedeklilik artar, operasyon/maliyet de.
- **C) Aktif-aktif aynı DB:** İki sunucu aynı DB'ye → split-brain riski, dikkat ister. Önerilmez.

**Öneri: A.** "İki sunucuda da çalışsın" ihtiyacı genelde *erişim* (her iki ekip de panele girebilsin) demek — bu zaten tek merkezi SaaS ile karşılanır. Eğer ayrı veri/yedeklilik şartsa B.

> Karar netleşmeden multi-tenancy işi başlar (A da B de aynı tenant katmanını gerektirir); topoloji sadece deploy adımını değiştirir.

---

## 8. Faz Planı (ayrı oturum checklist'i)

**Faz 0 — Hazırlık**
- [ ] Repo'yu vps-vistainsaat'a klonla (deploy değil, kod hazırlığı)
- [x] Bu rapor + master plan gözden geçirildi; güncel karar `MARKET_PULSE_TENANT_CEKLIST_PLANI.md` içindeki deploy-başına tek aktif tenant modeli.

**Faz 1 — Tenant çekirdeği**
- [x] `026_tenancy_schema.sql` (`tenants`, `tenant_settings`, `tenant_secrets`) eklendi.
- [x] Deploy-başına tek aktif tenant için `TENANT_KEY` + `getActiveTenant()` eklendi; request-scoped middleware bu mimaride bilinçli olarak yapılmadı.
- [ ] `user_roles` → `tenant_members.role` geçişi bu mimaride kapsam dışı; ihtiyaç tekrar doğarsa ayrı SaaS fazı olarak ele alınacak.

- [x] Tüm iş tablolarına `tenant_key` (seed güncelle, `db:seed`)
- [ ] `tenant-scope` repo-helper + repo'ları tenant scope'a geçir _(ana akışlar tamamlandı, test/guard kapanışı sürüyor)_
- [ ] Cross-tenant izolasyon testi (zorunlu, CI'da)

**Faz 3 — Config & kota tenant'a**
- [ ] EXTERNAL_DB / ICP / kaynaklar → tenant_settings
- [ ] BYOK genişlet → tenant_secrets (şifreli)
- [ ] tenant_plans + tenant_usage + kota guard
- [ ] scraper-service: tenant token + per-tenant rate-limit

**Faz 4 — Tarım tenant + PoC**
- [ ] `tarim` tenant + agri ICP + agri fuar kaynakları
- [ ] Agri fuar exhibitor PoC + Yüksel/MAY ayak izi raporu

**Faz 5 — Risk & uyum**
- [ ] KVKK/GDPR: veri işleme, saklama, silme/opt-out, aydınlatma
- [ ] Scraping ToS/rate-limit/circuit-breaker sağlamlaştırma
- [ ] Sır şifreleme (at-rest)

**Faz 6 — Deploy**
- [ ] Seçilen topolojiye göre market.tarvista.com (+ gerekiyorsa vps-vistainsaat) kurulum: backend + scraper-service (Docker) + MySQL + Next.js + Nginx + SSL
- [ ] DNS: market.tarvista.com → 187.124.166.65 (mevcut A kaydı)

---

## 9. Açık Kararlar (senden)
1. **Deploy topolojisi:** A (tek merkezi SaaS, önerilen) mi, B (iki ayrı kurulum) mi?
2. **Tenant anahtarı:** tarım için `tarim` mi `vistaseeds` mi? (Bereketfide vb. ayrı tenant mı, yoksa tek `tarim` çatısı mı?)
3. **Agri fuar/kaynak önceliği:** Growtech Antalya / Fruit Logistica / EIMA — hangisi ilk?
4. **Kota/plan:** Avrasya ve Tarım hangi planda başlasın (iç kullanım = pro/agency)?

---

## 10. Özet
İskelet güçlü; eksik olan **tenant izolasyon katmanı**. Sıra: tenant çekirdeği → satır-seviye izolasyon (en kritik risk) → config/kota tenant'a → tarım tenant + PoC → uyum/risk → deploy. Doğru yapılırsa hem Avrasya hem Tarım tek kod tabanında, izole ve güvenli çalışır; ekosistemden satılabilir lead/rakip-izleme ürünü somutlaşır.
