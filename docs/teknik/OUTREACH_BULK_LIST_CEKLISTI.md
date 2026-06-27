# Outreach Bulk-List Send — Codex İmplementasyon Çeklisti

> **DURUM (2026-06-27): TAMAMLANDI (backend + admin UI).**
> - **Backend** ✅ uçtan uca doğrulandı: `outreach/bulk-list.{repository,parser,service,controller}.ts` + `028_outreach_recipient_lists_schema.sql` + `018`'e 3 alıcı kolonu + 7 route + 15 test. 5 alıcı CSV → 5 taslak (placeholder çözülmüş), 148 test, tenant:guard+tsc temiz. xlsx için bağımsız native parser.
> - **Admin UI (§6)** ✅: `market/_components/bulk-list-panel.tsx` (yükle dialog + liste tablosu + alıcı detay + şablon→taslak + gönder/rate/progress) + route `outreach/lists/page.tsx` + 7 RTK hook (`market_admin.endpoints.ts`, FormData upload) + nav "Toplu Liste". tsc tüm projede temiz.
>
> Tasarım: Claude Code (mimar) · İmplementasyon: alt-ajan · Tarih: 2026-06-27
> Kaynak: isletmeniyonet `mailling/` modülünün modern karşılığı. İlgili: [../strateji/ISLETMENIYONET_BIRLESTIRME.md](../strateji/ISLETMENIYONET_BIRLESTIRME.md)
> İlke: **Yeni tablo + ince servis katmanı.** Mevcut gönderim/tracking/SMTP altyapısını AYNEN kullan; tekerleği yeniden icat etme.

---

## 1. Amaç

Outreach modülüne **lead pipeline'a bağlı olmayan** bir mod ekle: kullanıcı bir **Excel/CSV alıcı listesi yükler** → bir kampanyaya (gönderici/marka kimliği) bağlar → şablon ile **toplu mail gönderir** → açılma takibi mevcut pixel ile çalışır.

İsletmeniyonet'in PHP toplu mailer'ı (queue/tracking yok) yerine MP'nin mevcut `lead_outreach_drafts` + `sendOutreachDraft` + open-pixel altyapısını kullanırız.

## 2. Neden küçük bir ekleme (mevcut altyapı zaten hazır)

- `lead_outreach_drafts.candidate_id` ve `market_lead_id` **zaten nullable** → pipeline'sız draft mümkün.
- `sendOutreachDraft(id, toOverride?)` **zaten serbest adrese** gönderiyor (`outreach.service.ts:221`).
- `trackOutreachOpen` + `GET /lead-machine/outreach/open/:id/pixel.gif` → açılma takibi hazır.
- `outreach_campaigns` → gönderici/marka/SMTP kimliği hazır (multi-tenant).
- Eksik olan tek şey: **alıcı listesi** kavramı + drafts'a alıcı bilgisi.

## 3. DB değişikliği — KURAL: ALTER YASAK

> Schema değişikliği SADECE `src/db/seed/sql/` içindeki `CREATE TABLE` güncellenip `bun run db:seed:fresh` ile. ALTER kullanma.

### 3a. `lead_outreach_drafts`'a alıcı alanları ekle (018_lead_machine_schema.sql, CREATE TABLE içine)
Mevcut `CREATE TABLE lead_outreach_drafts` tanımına şu nullable kolonları ekle (candidate_id satırının yanına):
```sql
  `recipient_list_id` char(36)     DEFAULT NULL,   -- bulk liste kaynağı
  `recipient_email`   varchar(255) DEFAULT NULL,   -- pipeline'sız bulk için alıcı
  `recipient_name`    varchar(255) DEFAULT NULL,
```
ve index: `KEY idx_outreach_draft_reclist (recipient_list_id)`.
(NOT: ALTER ekleme; doğrudan CREATE TABLE'a yaz, fresh seed ile gelir.)

### 3b. Yeni schema dosyası: `028_outreach_recipient_lists_schema.sql`
```sql
CREATE TABLE IF NOT EXISTS `outreach_recipient_lists` (
  `id`          char(36)     NOT NULL,
  `tenant_key`  varchar(64)  NOT NULL DEFAULT 'avrasya',
  `campaign_id` char(36)     DEFAULT NULL,           -- gönderici/marka kimliği
  `name`        varchar(200) NOT NULL,
  `source`      varchar(20)  NOT NULL DEFAULT 'excel', -- excel | csv | manual | customs
  `status`      varchar(20)  NOT NULL DEFAULT 'ready', -- ready | sending | sent
  `total_count` int          NOT NULL DEFAULT 0,
  `sent_count`  int          NOT NULL DEFAULT 0,
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reclist_tenant`   (`tenant_key`),
  KEY `idx_reclist_campaign` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `outreach_recipients` (
  `id`           char(36)     NOT NULL,
  `tenant_key`   varchar(64)  NOT NULL DEFAULT 'avrasya',
  `list_id`      char(36)     NOT NULL,
  `email`        varchar(255) NOT NULL,
  `name`         varchar(255) DEFAULT NULL,
  `company`      varchar(255) DEFAULT NULL,
  `country`      varchar(100) DEFAULT NULL,
  `custom_fields` json        DEFAULT NULL,          -- şablon değişkenleri {{...}}
  `status`       varchar(20)  NOT NULL DEFAULT 'pending', -- pending | drafted | sent | bounced | skipped
  `draft_id`     char(36)     DEFAULT NULL,          -- üretilen lead_outreach_drafts.id
  `created_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recipient_tenant` (`tenant_key`),
  KEY `idx_recipient_list`   (`list_id`),
  KEY `idx_recipient_status` (`status`),
  KEY `idx_recipient_email`  (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
(FK koyma — proje deseni logical link kullanıyor. tenant_key her sorguda zorunlu.)

## 4. Backend — yeni dosyalar (`src/modules/lead-machine/outreach/`)

### `bulk-list.repository.ts`
- `createList(tenantKey, {campaignId, name, source})` → list
- `addRecipients(tenantKey, listId, rows[])` → bulk insert (chunked, 500'lük)
- `listLists(tenantKey)`, `getList(tenantKey, id)`, `listRecipients(tenantKey, listId, status?)`
- `markRecipient(tenantKey, recipientId, {status, draftId})`, `bumpListCounts(...)`
- **Her sorgu `getActiveTenantKey()` ile scope** (mevcut desen, `tenant-scope-guard.ts` CI'ı geçmeli).

### `bulk-list.parser.ts`
- `parseRecipientFile(buffer, filename)` → `{email,name,company,country,custom_fields}[]`
- xlsx için mevcut bağımlılığı kullan (`market` modülünde bulk-import var — aynı xlsx lib'i kullan; yeni bağımlılık ekleme). CSV için basit parser.
- Email validasyonu + de-dup (aynı listede tekrar eden email atlanır).

### `bulk-list.service.ts`
- `uploadList(tenantKey, campaignId, name, fileBuffer, filename)` → parse + createList + addRecipients + total_count
- `generateDraftsFromList(tenantKey, listId, {subjectTemplate, bodyTemplate})`:
  - Her `pending` alıcı için `lead_outreach_drafts` satırı oluştur: `candidate_id=null, market_lead_id=null, campaign_id, recipient_list_id, recipient_email, recipient_name`, `subject/body` = şablon + placeholder substitution (`{{name}}`, `{{company}}`, `{{country}}`, custom_fields).
  - recipient.status='drafted', draft_id set.
  - **AI YOK** (MVP template-based; bulk'ta AI maliyeti gereksiz). İleride opsiyonel `draft.generator` reuse.
- `sendList(tenantKey, listId, {ratePerMinute=30})`:
  - `drafted` draftları sırayla **rate-limit ile** gönder: her biri `sendOutreachDraft(draftId, recipient_email)` (mevcut servis).
  - **Throttle zorunlu** (mevcut kodda timeout/retry yok — bu özelliğe basit `await sleep(60000/ratePerMinute)` + try/catch ekle; başarısız → recipient.status='bounced', devam et).
  - list.status: ready→sending→sent; sent_count güncelle.
  - Açılma takibi otomatik (mevcut pixel, draft id ile).

## 5. Routes (`router.ts` → `registerLeadMachineAdmin` içine, mevcut outreach grubunun altına)
```
app.get   ('/lead-machine/outreach/lists',                 listBulkLists);
app.post  ('/lead-machine/outreach/lists',                 uploadBulkList);        // multipart
app.get   ('/lead-machine/outreach/lists/:id',             getBulkList);
app.get   ('/lead-machine/outreach/lists/:id/recipients',  listBulkRecipients);
app.post  ('/lead-machine/outreach/lists/:id/generate',    generateBulkDrafts);    // {subjectTemplate, bodyTemplate}
app.post  ('/lead-machine/outreach/lists/:id/send',        sendBulkList);          // {ratePerMinute?}
app.delete('/lead-machine/outreach/lists/:id',             deleteBulkList);
```
- Multipart upload: `@fastify/multipart` (zaten storage modülünde kullanılıyorsa onu kullan).
- Controller fonksiyonları `outreach/bulk-list.controller.ts`'te; route auth `config.auth=true` + admin.

## 6. Admin panel UI (`admin_panel/.../market/lead-machine/outreach/`)
- Yeni sekme/sayfa: **"Toplu Liste"** (`bulk-lists`).
- `_components/bulk-list-panel.tsx`: liste tablosu + "Yeni Liste Yükle" (xlsx/csv drop) + kampanya seç.
- Liste detay: alıcı tablosu (email/name/company/status), "Şablon Hazırla & Taslak Üret" (subject/body + placeholder yardımı), "Gönder" (rate input) + ilerleme (sent_count/total_count).
- RTK Query hook'larını mevcut `lead-machine` api slice'ına ekle (codegen varsa regenerate).
- Tasarım: mevcut panel desenini izle (thin route → `_components`).

## 7. Reuse (DOKUNMA, çağır)
- `sendOutreachDraft(id, toOverride)` — gönderim
- `trackOutreachOpen` + open pixel route — takip
- `outreach_campaigns` — gönderici/marka/SMTP
- xlsx parser (market bulk-import) — dosya okuma
- `getActiveTenantKey()` / tenant scope deseni

## 8. Test (`outreach/__tests__/`)
- `bulk-list.parser.test.ts`: xlsx + csv parse, email validasyon, de-dup.
- `bulk-list.service.test.ts`: generateDraftsFromList placeholder substitution; sendList rate-limit + bounce handling; tenant isolation (A listesi B'den görünmez).
- `tenant-scope-guard.ts` CI'ı geçmeli (yeni tablolara dokunan her dosya tenant-scope işaretli).

## 9. Kapsam dışı (sonraki faz)
- Sequence/drip (zaten ayrı reminder/followup mekanizması var).
- A/B test, gelişmiş bounce/unsubscribe yönetimi, SPF/DKIM sihirbazı.
- Customs Discover lead'lerini doğrudan listeye aktarma (sonra: `source='customs'` ile köprü — şema bunu zaten destekliyor).

## 10. Kabul kriterleri
1. xlsx/csv yükle → alıcılar `outreach_recipients`'a düşer, total_count doğru.
2. Şablon + placeholder ile taslak üret → her alıcı için `lead_outreach_drafts` (pipeline'sız) oluşur.
3. Gönder → rate-limit'li, mevcut SMTP ile gider; sent_count artar; bounce'ta durmaz.
4. Açılma → mevcut pixel ile `opened_at/open_count` güncellenir.
5. Tenant izolasyonu: başka tenant'ın listesi/alıcısı görünmez/gönderilemez.
6. `bun run db:seed:fresh` temiz kurar (ALTER yok); `bun test` yeşil.
```
