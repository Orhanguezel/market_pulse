# Kullanıcı-Bazlı Gmail / Mail Entegrasyonu Planı

> **Tarih:** 2026-07-05
> **Amaç:** Mail Yönetimi bölümünde her kullanıcı kendi mail hesabını (öncelikle Gmail) bağlayabilsin; gelen kutusunu görebilsin ve mail gönderebilsin.
> **Referans:** isletmeniyonet.com/salecrm (PHP) — Gmail OAuth+API inbox/send zaten yapılmış (session-only, güvenlik açıkları var). market_pulse'a Node/Fastify+Next olarak, kişi-bazlı ve güvenli taşınacak.
> **İlişkili:** [[admin-dashboard-tasima-plani]] (owner-scope işi bu modülle hizalı), `docs/crm/ADMIN_TO_USER_DASHBOARD_PLAN.md` Faz 3.1 (Mail Yönetimi).

> **KARARLAR (2026-07-05, kullanıcı onayı):**
> - **Yol A seçildi:** Tam Gmail API (OAuth), "Testing" modu (≤100 kullanıcı, doğrulamasız; 100+ için CASA süreci sonra). Gönderim + gelen kutusu ikisi de Gmail API üzerinden.
> - **MVP kapsamı:** Gönderim + gelen kutusu **birlikte** (tek sürüm, eksiksiz deneyim).
> - **Sıralama:** Önce owner-scope veri-izolasyon düzeltmeleri commit+deploy (gzltek), **sonra** bu Gmail entegrasyonu başlar.
> - Provider soyutlaması (`gmail_oauth | imap_smtp`) yine de baştan kurulur (Gmail-dışı/kurumsal yedek), ama MVP'nin aktif yolu Gmail OAuth.

> **Kod denetimi (2026-07-11):** Faz 1–4'teki yerel uygulama maddeleri tamamlandı ve testli. Açık kutular Google Cloud Console, credential iptali veya opsiyonel Google Pub/Sub işlemleridir; repository içinden Codex tarafından tamamlanamaz.

---

## 1. Mevcut Durum (iki taraf)

### 1.1 market_pulse (hedef) — ne var, ne yok
**Var (sağlam temel):**
- Merkezi gönderim: `backend/src/modules/mail/index.ts` `sendMailRaw()` + 3 katmanlı ayar fallback'i (kullanıcı SMTP `profiles.sender_*` → site SMTP `site_settings.smtp_*` → env).
- Kullanıcı SMTP UI'ı: `frontend/src/app/[locale]/me/settings/page.tsx` ("Kendi SMTP hesabımı kullan" toggle + host/port/user/pass).
- Şifreli per-user secret emsali: `user_keepa_keys` (AES-256-GCM, `KEEPA_ENCRYPTION_KEY`) — `backend/src/modules/public-api/byok.service.ts`. **Gmail token'ları için birebir bu deseni kullanacağız.**
- OAuth altyapısı (kısmi): `google-auth-library` kurulu ama sadece **login** için (id_token doğrulama). `getGoogleSettings()` client_id/secret sağlıyor. Frontend `@react-oauth/google`.
- Kuyruk + rate limit: `outreach/mail-queue.ts` (BullMQ + Redis) toplu gönderimde hazır.
- Outbound Mail Yönetimi ekranı: `frontend/src/app/[locale]/mail-yonetimi/page.tsx` (kampanya/taslak/toplu — 3 sekme).

**Yok (eklenecek):**
- `googleapis` paketi (Gmail API için şart; mevcut `google-auth-library` yetmez).
- OAuth **offline** akışı (`access_type=offline` + `prompt=consent`), refresh_token değişimi, gmail scope'ları.
- **Token saklama tablosu** (refresh/access token) — hiç yok.
- **Gelen kutusu (inbox) altyapısı** — sıfır (ne IMAP/Gmail-read kodu, ne mesaj/thread tablosu, ne UI).
- `replyTo` plumbing (`sendMailRaw` reply-to geçirmiyor; `outreach_campaigns.sender_email/reply_to` tanımlı ama gönderime bağlı değil).
- "Bağlı hesap durumu" (hangi adres bağlı, token geçerli mi) endpoint/UI.

### 1.2 isletmeniyonet.com (referans) — nasıl yapılmış
- **Gmail = OAuth2 + Gmail API, IMAP DEĞİL.** Scope'lar: `gmail.readonly`, `gmail.send`, `gmail.modify`; `access_type=offline`, `prompt=consent`.
- Inbox: `users.messages.list('me', {q:'in:inbox', maxResults:20})`, detay `messages.get(format=full)`.
- Gönderim: `messages.send` (raw RFC822).
- **Zaafiyetler (taşımada DÜZELTİLECEK):** token yalnız PHP session'ında (her oturumda yeniden bağlan), client_id/secret + SMTP şifresi koda gömülü, SQL injection + IDOR, kullanıcı sahiplik kolonu yok, ekler her biri ayrı mail olarak gidiyor, toplu SMTP scripti test seviyesinde.
- **Aksiyon:** isletmeniyonet'te ifşa olan Google credential + SMTP şifreleri **iptal edilip yeniden üretilmeli** (market_pulse için zaten yeni bir Google Cloud OAuth client açılacak).

---

## 2. KRİTİK KARAR: Gmail izin kapsamı ve Google doğrulaması

Bu, mimariyi baştan belirleyen konu. Gmail scope'ları Google tarafından üç sınıfa ayrılır:

| Özellik | Gereken scope | Google sınıfı | Doğrulama maliyeti |
|---|---|---|---|
| **Mail gönderme** | `gmail.send` | **Sensitive** | OAuth consent screen doğrulaması (marka/logo/domain), CASA gerekmez. Görece hafif. |
| **Gelen kutusu okuma** | `gmail.readonly` | **Restricted** | Doğrulama **+ yıllık üçüncü-taraf CASA güvenlik denetimi** (haftalar sürer, ücretli). Ağır. |

**Sonuç:** "Gelen mailleri görmek" restricted scope gerektirir. Üç yol var:

- **Yol A — Tam Gmail API (OAuth):** send + readonly. En iyi UX (tek tık bağlan, hem oku hem gönder). Fakat >100 kullanıcı için Google doğrulaması + CASA denetimi şart. "Testing" modunda **max 100 test kullanıcısı** ile doğrulamasız çalışır (iç kullanım / pilot için ideal).
- **Yol B — Hibrit:** Gönderim OAuth `gmail.send` (hafif doğrulama), gelen kutusu **IMAP + Gmail App Password** (Google doğrulaması YOK; kullanıcı 2FA açıp uygulama şifresi üretir). Doğrulama yükünü hafifletir ama kullanıcı kurulumu biraz sürtünmeli.
- **Yol C — Sadece IMAP/SMTP + App Password:** OAuth yok. Kullanıcı Gmail uygulama şifresi girer; gönderim SMTP, okuma IMAP. Google doğrulaması hiç gerekmez, bugün çalışır. En az "havalı" ama en pragmatik. (Gmail dışı sağlayıcılar — Outlook, kurumsal — için de çalışır.)

> **Öneri:** **Faz 1'de Yol A'yı "Testing" modunda kur** (pilot kullanıcılar, ≤100 hesap — DITCO gibi ilk müşteriler için yeterli). Aynı zamanda **provider soyutlaması** (`gmail_oauth | imap_smtp`) ile Yol C'yi de destekle (kurumsal/Gmail-dışı kullanıcılar + doğrulama beklerken yedek). Kullanıcı sayısı 100'ü aşınca Google doğrulama/CASA sürecini başlat.

---

## 3. Mimari Tasarım

### 3.1 Veri modeli (yeni tablo — owner-scoped, şifreli)
`user_keepa_keys` desenini örnek alarak yeni seed SQL (ör. `037_user_mail_accounts_schema.sql`):

```
user_mail_accounts
  id            char(36) PK
  tenant_key    varchar(64)
  owner_user_id char(36)  NOT NULL   -- kişi-bazlı (yeni owner-scope işiyle hizalı)
  provider      enum('gmail_oauth','imap_smtp')
  email         varchar(255)          -- bağlı hesap adresi
  display_name  varchar(255)
  -- OAuth (gmail_oauth):
  enc_access_token   text             -- AES-256-GCM
  enc_refresh_token  text             -- AES-256-GCM
  token_expiry       datetime(3)
  scopes             text
  -- IMAP/SMTP (imap_smtp):
  imap_host/imap_port/smtp_host/smtp_port varchar/int
  enc_password       text             -- AES-256-GCM (profiles.sender_smtp_password düz-metin DEĞİL)
  -- durum:
  status        enum('connected','expired','error','disconnected')
  last_synced_at datetime(3)
  created_at/updated_at
  UNIQUE (tenant_key, owner_user_id, email)
  FK owner_user_id -> users(id) ON DELETE CASCADE
```
Şifreleme env: `MAIL_ENCRYPTION_KEY` (32 byte hex), `byok.service.ts`'teki `encrypt()/decrypt()` yardımcılarını ortak modüle çıkar (`_shared/crypto.ts`) ve hem Keepa hem mail kullansın.

> Not: mevcut `profiles.sender_*` düz-metin SMTP alanları **deprecate** edilip bu tabloya (şifreli) migrate edilecek; `me/settings`'teki SMTP bölümü bu modüle taşınır.

### 3.2 Backend modülü: `backend/src/modules/mail-accounts/`
Paket: **`googleapis`** eklenecek. Yardımcı kütüphane: raw MIME için `nodemailer`'ın `MailComposer`'ı (zaten kurulu) — ekleri doğru multipart üretmek için (isletmeniyonet'teki ek hatası tekrarlanmayacak).

**User-scoped endpoint'ler** (`registerMailAccountsUser`, `requireAuth + requireModule('email-marketing')`, `/api/v1/`):

*Bağlantı yönetimi:*
- `GET /mail/accounts` — kullanıcının bağlı hesapları (email, provider, status). Token değerleri **asla** dönmez (`configured: true` deseni).
- `GET /mail/accounts/gmail/connect` — Google consent URL üretir (offline+consent, scopes: `gmail.send` [+`gmail.readonly` Yol A ise] + `email profile`). `state` = imzalı user/tenant.
- `GET /mail/accounts/gmail/callback` — `code`→token değişimi, şifreli sakla, `mail-yonetimi`'ye redirect. (Public route, `state` imza doğrulaması + CSRF koruması; scraper-callback deseni gibi.)
- `POST /mail/accounts/imap` — IMAP/SMTP hesabı ekle (host/port/user/pass), şifreli sakla, bağlantı testi.
- `DELETE /mail/accounts/:id` — bağlantıyı kes (token revoke + kaydı sil).

*Gelen kutusu (Yol A/B):*
- `GET /mail/inbox?folder=inbox|sent|drafts|trash&page=…` — Gmail API `messages.list` (veya IMAP). Özet liste (from/subject/date/snippet/unread).
- `GET /mail/messages/:id` — `messages.get(format=full)` → parse (text/html gövde, ekler meta).
- `POST /mail/messages/:id/read` — okundu işaretle (opsiyonel, `gmail.modify` gerekir; MVP'de atlanabilir).

*Gönderim:*
- `POST /mail/send` — { to, cc, subject, html, attachments } → bağlı Gmail hesabından `messages.send` (raw MIME) veya SMTP. From = kullanıcının bağlı adresi, replyTo düzgün set edilir.

**Token yenileme:** `getValidAccessToken(account)` — expiry geçmişse refresh_token ile yeniler, yeni token'ı şifreli günceller. Tüm inbox/send çağrıları bundan geçer.

### 3.3 Outreach ile entegrasyon (mevcut modülü bağla)
- `sendMailRaw` / `sendOutreachDraft` gönderim sırasında: kullanıcının **bağlı Gmail hesabı** varsa onu kullan (Gmail API), yoksa profiles SMTP, yoksa site/env. Yani mail hesabı, mevcut fallback zincirinin en üstüne eklenir.
- `replyTo`'yu `sendMailRaw`'a plumb et; `outreach_campaigns.sender_email/reply_to`'yu gönderime bağla (halihazırdaki eksik).
- Toplu gönderim `mail-queue.ts` üzerinden bağlı hesabı kullanır (per-user rate limit + Gmail günlük kota farkındalığı — Gmail API günlük gönderim limiti ~500/2000).

### 3.4 Frontend: Mail Yönetimi genişletme
`mail-yonetimi/page.tsx`'e 2 yeni sekme (mevcut campaigns/drafts/bulk yanına):
- **"Hesap & Ayarlar"** — `GmailConnectCard` (ByokSettings emsali): bağlı hesap durumu, "Gmail Bağla" butonu (OAuth popup/redirect), "Bağlantıyı Kes"; ayrıca IMAP/SMTP manuel form (Gmail-dışı). `me/settings`'teki SMTP bölümü buraya taşınır.
- **"Gelen Kutusu"** — klasör listesi (Gelen/Gönderilen/Taslak/Çöp), mesaj listesi (sonsuz kaydırma/sayfalama), mesaj detay paneli/modalı, "Yeni Mail" compose modalı (bağlı hesaptan gönderir).

RTK: yeni `mail-accounts.endpoints.ts` (connect/list/delete/inbox/message/send) + tipler `shared/mail-account.types.ts`.

---

## 4. Fazlı Uygulama Planı ve Checklist

### FAZ 0 — Google Cloud + Güvenlik hazırlığı (bloker)
- [ ] **[DIŞ OPERASYON]** Yeni Google Cloud projesi / OAuth consent screen (marka, logo, gizlilik politikası URL'i, yetkili domain).
- [ ] **[DIŞ OPERASYON]** Gmail API'yi etkinleştir. Scope'lar: `gmail.send` (+ Yol A ise `gmail.readonly`).
- [ ] **[DIŞ OPERASYON]** OAuth client (Web) oluştur; redirect URI = backend callback (`https://<host>/api/v1/mail/accounts/gmail/callback`). client_id/secret → env/secret, koda gömme.
- [ ] **[DIŞ OPERASYON]** Publishing status: "Testing" + test kullanıcıları ekle (≤100). Prod için doğrulama sürecini not et.
- [x] `MAIL_ENCRYPTION_KEY` üret (32 byte hex), env'e ekle; `_shared/crypto.ts` ortak encrypt/decrypt. (`MAIL_ENCRYPTION_KEY` env desteği eklendi; yoksa `DB_ENCRYPTION_KEY` fallback)
- [ ] **[DIŞ OPERASYON]** isletmeniyonet'te ifşa olan eski Google/SMTP credential'larını **iptal et**.

### FAZ 1 — Backend: Bağlantı + Token (Gmail OAuth)
- [x] `googleapis` paketini ekle.
- [x] `037_user_mail_accounts_schema.sql` (owner-scoped, şifreli) — seed'e ekle + fresh/migrate.
- [x] `mail-accounts` modülü: connect (consent URL) + callback (code→token, şifreli sakla) + list + delete.
- [x] `getValidAccessToken()` refresh mekanizması.
- [x] `registerMailAccountsUser` router'ı (`requireAuth + requireModule('email-marketing')`), `project.ts`'e bağla. Callback için `state` imza + CSRF.
- [x] Owner-scope: tüm sorgular `owner_user_id = req.user.sub` (owner-scope-guard'a uygun).

### FAZ 2 — Backend: Gönderim + Gelen kutusu
- [x] `POST /mail/send` — Gmail API raw MIME (MailComposer ile ekler dahil, düzgün multipart).
- [x] `sendMailRaw` fallback zincirine "bağlı mail hesabı"nı ekle + `replyTo` plumbing.
- [x] `GET /mail/inbox` + `GET /mail/messages/:id` (Yol A) — Gmail API list/get, gövde parse.
- [x] (Yol B/C) IMAP okuma sağlayıcısı — `imapflow` paketi + IMAP inbox okuma. (`POST /mail/accounts/imap` şifreli SMTP fallback hesabı olarak eklendi; inbox/message IMAP okuma eklendi)
- [x] Outreach/kampanya gönderimini bağlı hesap üzerinden çalışacak şekilde güncelle (mail-queue).

### FAZ 3 — Frontend
- [x] `mail-accounts.endpoints.ts` + tipler.
- [x] "Hesap & Ayarlar" sekmesi + `GmailConnectCard` (OAuth redirect/popup, durum, kes) + IMAP/SMTP form.
- [x] "Gelen Kutusu" sekmesi: klasör + liste + detay + compose modal.
- [x] `me/settings`'teki SMTP bölümünü mail-accounts'a taşı (tek yerden yönetim).
- [x] Bağlantı durumu rozetleri, hata/expired durumları için yeniden-bağlan akışı.

### FAZ 4 — Sertleştirme
- [x] Per-user Gmail günlük gönderim kotası farkındalığı + rate limit (mevcut kota altyapısına ekle).
- [x] Token şifreleme + owner-izolasyon E2E testi (iki kullanıcı birbirinin kutusunu göremez). (`mail-accounts.service.test.ts` ile tenant/owner filtreleri ve şifreli secret saklama doğrulandı)
- [ ] **[DIŞ OPERASYON]** Prod için Google OAuth doğrulama + CASA süreci (readonly kullanılıyorsa), >100 kullanıcı öncesi.
- [ ] **[OPSİYONEL / MVP DIŞI]** Gmail `watch` + Pub/Sub ile gerçek-zamanlı gelen mail bildirimi.

---

## 5. Riskler / Notlar
1. **Google doğrulaması** (readonly) en büyük gerçek engel — pilotta "Testing" modu (≤100) ile aşılır, ölçekte süreç başlatılır. Bölüm 2'deki karar netleşmeli.
2. **Token güvenliği:** refresh_token uzun ömürlü ve hassas — mutlaka şifreli (AES-256-GCM), asla API'de dönme, log'lama.
3. **`profiles.sender_smtp_password` düz metin** — bu modülle birlikte şifreli tabloya migrate edilmeli (mevcut güvenlik borcu).
4. **Gmail gönderim limitleri:** ücretsiz Gmail ~500/gün, Workspace ~2000/gün. Toplu kampanyada bu limit SMTP relay'den düşük — kullanıcıya uyarı + kota takibi.
5. **Provider soyutlaması** baştan doğru kurulmalı (gmail_oauth | imap_smtp) — yoksa Gmail-dışı kullanıcılar ve doğrulama-beklerken yedek zorlaşır.
6. **DB şeması** yalnız seed SQL üzerinden (ALTER yasak — CLAUDE.md); owner kolonu + FK ile fresh/migrate.
