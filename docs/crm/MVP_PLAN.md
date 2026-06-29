# CRM SaaS — MVP Mimari Planı (Faz 1)

> **Karar:** market_pulse, "Odak CRM + lead motoru" olarak konumlandırılır.
> Odoo'nun tamamı klonlanmaz; CRM çekirdeği + bizim farkımız olan customs/lead
> bulma motoru birleştirilir. İlk müşteri: **DITCO** (şu an Odoo kullanıyor).
> Teslim stratejisi: **dar MVP → kullanımdan öğren → büyüt.**
> Rol dağılımı: Bu doküman = mimari karar (Claude). İmplementasyon = Codex.

---

## 1. Konumlandırma (neden bu kapsam)

Odoo 20 yıllık full ERP'dir; feature-feature kovalanamaz. Kazanan strateji
**"Odoo gibi ol" değil, "Odoo'nun yapamadığını yap"**:

> **Türk ihracatçısı için, gümrük verisinden gerçek alıcı bulan + lead'i deal'e
> çeviren B2B CRM.**

Odoo müşteri *bulmaz*; biz `customs_records` (738K kayıt) + lead-machine +
enrichment (Apollo) ile buluyoruz. CRM bu huninin alt ucunu (ilişki → satış)
kapatır. ERP modülleri (muhasebe, İK, POS, kiralama, website builder) **kapsam
dışı** — müşteri onları Odoo'da tutabilir.

## 2. MVP kapsamı (Faz 1) — IN / OUT

**IN (4-6 hafta hedefi):**
- **Hesaplar (Accounts)** — firma kartı. `lead_candidates`'ten dönüştürülebilir.
- **Kontaklar (Contacts)** — kişi kartı, bir hesaba bağlı.
- **Pipeline + Stage** — tenant başına yapılandırılabilir satış hattı.
- **Deal (Fırsat)** — hesap + stage + sahip + tutar/para birimi + kapanış tahmini.
- **Aktiviteler** — arama/e-posta/toplantı/görev/not; vade tarihli; deal/contact/account'a bağlı.
- **E-posta gönderimi** — mevcut `outreach` + `mail` modülü yeniden kullanılır.
- **Lead → CRM dönüşümü** — onaylı `lead_candidates` tek tıkla account+contact+deal olur.

**OUT (sonraki fazlar / kapsam dışı):**
- Satış (teklif→sipariş→fatura), muhasebe, POS, kiralama → **kapsam dışı (Odoo'da kalır)**
- Takvim/Randevu UI, Belgeler, Bilgi Birikimi, Mesajlaşma → Faz 2
- WhatsApp / SMS / Sosyal Medya entegrasyonu → Faz 3
- İK/İzin/Masraf/Çalışma Çizelgeleri → **kapsam dışı**

## 3. ÖN KOŞUL — Faz 0 (bloker, MVP'den ÖNCE)

**Tenant JWT izolasyonu kapatılmadan tek firmaya bile canlı SaaS satılamaz.**
Bir tenant diğerinin verisini görür. Bkz. memory `isletmeniyonet-birlestirme`
("Faz 0 tenant JWT güvenlik bloker") ve `CODEX_GOREV_FAZ0_TENANT_JWT.md`.
Tüm CRM sorguları `tenant_key` ile zorunlu filtrelenmeli; `tenant_key` JWT'den
gelmeli, istemciden gelen değere güvenilmemeli.

## 4. Veri modeli — `031_crm_schema.sql` (yeni seed dosyası)

> Konvansiyon: `id char(36)`, `tenant_key varchar(64) NOT NULL`, `idx_<tablo>_<kolon>`,
> JSON esnek alanlar, utf8mb4_unicode_ci, `created_at/updated_at` datetime.
> **ALTER YASAK** — şema değişikliği CREATE TABLE'a eklenir, `db:seed:*:fresh` ile uygulanır.

```sql
-- crm_accounts : firma kartı
--   id, tenant_key, name, website, country, city, phone, email,
--   industry, source_lead_id (char36, lead_candidates'ten dönüşüm izi),
--   owner_user_id, status enum('active','inactive'), raw_data json,
--   created_at, updated_at
--   idx: tenant, owner, status

-- crm_contacts : kişi kartı (account'a bağlı)
--   id, tenant_key, account_id, first_name, last_name, title,
--   email, phone, linkedin_url, source_lead_id, owner_user_id,
--   created_at, updated_at
--   idx: tenant, account, owner, email

-- crm_pipelines : tenant başına satış hattı
--   id, tenant_key, name, is_default tinyint, sort int, created_at
--   idx: tenant

-- crm_stages : pipeline aşamaları
--   id, tenant_key, pipeline_id, name, sort int, probability decimal(4,1),
--   is_won tinyint, is_lost tinyint, created_at
--   idx: tenant, pipeline

-- crm_deals : fırsat
--   id, tenant_key, account_id, contact_id, pipeline_id, stage_id,
--   title, amount decimal(14,2), currency varchar(3) DEFAULT 'USD',
--   expected_close_date date, owner_user_id,
--   status enum('open','won','lost') DEFAULT 'open',
--   lost_reason varchar(500), source_lead_id, raw_data json,
--   created_at, updated_at
--   idx: tenant, account, stage, owner, status

-- crm_activities : aktivite/görev (polimorfik)
--   id, tenant_key,
--   ref_type enum('deal','contact','account'), ref_id char(36),
--   type enum('call','email','meeting','task','note'),
--   subject varchar(255), body text, due_at datetime,
--   done tinyint DEFAULT 0, done_at datetime,
--   owner_user_id, created_by, created_at, updated_at
--   idx: tenant, (ref_type,ref_id), owner, due_at, done
```

Tüm tablolar `tenant_key`'e index'li; her servis sorgusu `WHERE tenant_key = ?`
ile başlar (Faz 0 izolasyonuyla uyumlu).

## 5. Backend modülü — `backend/src/modules/crm/`

Mevcut modül pattern'i (router/controller/service):
```
crm/
  router.ts        -> /crm/* route kayıtları (Fastify)
  controller.ts    -> request/response, tenant_key resolve
  accounts.service.ts
  contacts.service.ts
  deals.service.ts
  activities.service.ts
  pipelines.service.ts
  convert.service.ts   -> lead_candidates -> account+contact+deal
  schema.ts            -> zod/tipler
```
Yeniden kullanım: `auth` (owner_user_id, roller), `outreach`+`mail` (e-posta),
`notifications` (aktivite hatırlatma), `audit` (değişiklik logu).

## 6. Admin panel — `admin_panel/.../admin/(admin)/crm/`

```
crm/
  pipeline/      -> Kanban (stage sütunları, deal kartları, sürükle-bırak)
  deals/[id]/    -> deal detay + aktivite zaman çizelgesi
  accounts/      -> firma listesi + detay
  contacts/      -> kişi listesi + detay
```
Mevcut admin kabuğu (theme, menuItems, RTK Query baseApi, X-Tenant header)
aynen kullanılır. Menüye "CRM" grubu eklenir.

## 7. MVP iş sırası (Codex handoff)

1. **Faz 0**: tenant JWT izolasyonu (bloker) — ayrı görev.
2. `031_crm_schema.sql` + `db:seed:fresh` ile doğrula.
3. Backend `crm` modülü: accounts → contacts → pipelines/stages → deals → activities.
4. `convert.service.ts`: lead → CRM dönüşümü.
5. Admin: pipeline kanban → deal detay → account/contact listeleri.
6. E-posta: deal/contact üzerinden `outreach`/`mail` ile gönderim.
7. DITCO tenant'ı seed + gerçek veriyle pilot.

## 8. DITCO pilot notu

DITCO'nun Odoo'da fiilen kullandığı modüller büyük olasılıkla
**CRM + Kontaklar + E-posta + Takvim** (gıda dış ticaret firması; muhasebe/POS
muhtemelen muhasebecide). MVP tam bu çekirdeği karşılıyor. Pilotta Odoo'daki
kontak/firma verisi CSV ile import edilir (basit importer Faz 1'e dahil edilebilir).
