# Modüler SaaS — Entitlement (Modül Yetkilendirme) Mimarisi

> **Karar:** market_pulse, **modül modül** satılan çok-kiracılı bir SaaS olur.
> Her tenant'ta farklı modüller bağımsız aktif olur; fiyatlandırma modül bazlıdır.
> Odoo klonlanmaz; modüller aşama aşama eklenir.
> Rol: Bu doküman mimari karar (Claude). İmplementasyon Codex.
> İlgili: [crm/MVP_PLAN.md](../crm/MVP_PLAN.md)

---

## 1. Çekirdek fikir

Sistem bir **modül kataloğu** + tenant başına **aktif modül seti** üzerine kurulur.
- Müşteri sadece istediği modüllere abone olur (à la carte).
- Her modül kendi route'larını ve admin menüsünü **entitlement guard** ile kapatır.
- Faturalama, aktif modüllerden türetilir.
- İsteğe bağlı "paket (bundle)" tanımları, bir grup modülü tek seferde açan ön ayardır
  (zorunlu değil — saf à la carte da çalışır).

**Mevcut repo durumu:** `tenants.plan` (tek string) ve `user_plans`
(free/starter/pro/agency kademe) = kademe-bazlı model. Bunlar **kullanım kotası**
için kalır (örn. leads modülünde günlük tarama limiti), ama erişim kararının
kaynağı artık **tenant_modules** olur.

## 2. Veri modeli — `032_module_entitlements_schema.sql`

> Konvansiyon: char(36) id, idx_ prefix, utf8mb4_unicode_ci, datetime, **ALTER yok**.

```sql
-- module_catalog : platform seviyesi modül kataloğu (tenant'a bağlı DEĞİL)
--   module_key   varchar(64) PK   -- 'leads','crm','email-marketing','social',...
--   name         varchar(120)
--   description  text
--   category     varchar(64)      -- 'sales','marketing','ops'
--   base_price   decimal(10,2)
--   currency     varchar(3) DEFAULT 'USD'
--   billing_period enum('monthly','yearly') DEFAULT 'monthly'
--   is_active    tinyint DEFAULT 1   -- katalogda satışta mı
--   sort         int
--   created_at, updated_at

-- tenant_modules : tenant başına aktif modüller (entitlement kaynağı)
--   id           char(36) PK
--   tenant_key   varchar(64) NOT NULL
--   module_key   varchar(64) NOT NULL
--   status       enum('trial','active','suspended','cancelled') DEFAULT 'trial'
--   price_snapshot decimal(10,2)   -- aktivasyon anındaki fiyat (katalog değişse de sabit)
--   currency     varchar(3) DEFAULT 'USD'
--   activated_at datetime
--   expires_at   datetime DEFAULT NULL   -- trial/abonelik bitişi
--   config       json DEFAULT NULL       -- modüle özel tenant ayarı (kota vb.)
--   created_at, updated_at
--   UNIQUE (tenant_key, module_key)
--   idx: tenant, module, status
```

`module_catalog` tek doğruluk kaynağı; `tenant_modules` o katalogdan satın alınanlar.
`price_snapshot` sayesinde katalog fiyatı değişse de mevcut tenant'ın fiyatı sabit kalır.

## 3. Entitlement guard (erişim kapısı)

Fastify preHandler/dekoratör:
```
requireModule('leads')   // route guard
hasModule(tenantKey, moduleKey): boolean   // servis içi kontrol
```
- `tenant_modules`'ta `status IN ('trial','active')` ve (expires_at IS NULL OR > now()) ise geçer.
- Aksi halde `402 MODULE_NOT_ENTITLED` döner (admin panel "bu modülü aç" CTA'sı gösterir).
- `tenant_key` **JWT'den** gelir (Faz 0 izolasyon bloğuyla aynı kaynak) — istemciye güvenilmez.

Her backend modülü router'ında kendi `requireModule(...)` çağrısını yapar.
Admin panel menüsü, tenant'ın aktif modüllerine göre filtrelenir (kapalı modül menüde yok).

## 4. Modül kataloğu (başlangıç)

| module_key | Ad | Durum | Not |
|---|---|---|---|
| `leads` | **Müşteri Bulma** | 🟢 büyük ölçüde VAR | customs + lead-machine + enrichment + outreach. **İlk satılan modül.** |
| `crm` | CRM | 🔴 planlı | pipeline/deal/aktivite — [MVP_PLAN.md](../crm/MVP_PLAN.md) |
| `email-marketing` | E-posta Pazarlama | 🟡 outreach var | leads'ten ayrılıp bağımsız modül olabilir |
| `social` | Sosyal Medya | ⚪ harici | Kullanıcının mevcut sistemi entegre edilir (talep olunca) |
| `whatsapp` / `sms` | Mesajlaşma | ⚪ sonra | plumbing kısmen |
| `documents` / `calendar` | Belgeler / Takvim | ⚪ sonra | storage var |

Yeni modül = kataloğa satır + backend modülü + `requireModule` + admin menü girdisi.
Çekirdek (auth, tenants, settings, billing) her tenant'ta **her zaman açık**, satılmaz.

## 5. Öncelik sırası (kullanıcı yönü: önce lead)

1. **Faz 0** — tenant JWT izolasyonu (bloker, hâlâ ön koşul).
2. **Entitlement katmanı** — `032_*` şema + `module_catalog` seed + `requireModule` guard
   + admin "Modüller" sayfası (aç/kapat, durum). Bu, para kazanmanın temeli.
3. **`leads` modülünü paketle** — mevcut lead-machine/customs/enrichment/outreach'i
   `requireModule('leads')` arkasına al, DITCO + diğer tenant'lara satılabilir hale getir.
   (Kademe/kota: `user_plans` bu modülün içinde tarama limiti olarak kullanılır.)
4. **CRM modülü** — [MVP_PLAN.md](../crm/MVP_PLAN.md) sırasıyla, ayrı satılan modül olarak.
5. Sonraki modüller talep geldikçe (social, whatsapp, calendar...).

## 6. Faturalama notu (sonraki faz)

Aktif `tenant_modules` × `price_snapshot` = aylık/yıllık tutar. İlk sürümde
manuel/Iyzipay-Stripe dışı (faturayı sen kesersin) yeterli; otomatik tahsilat
sonraki faza bırakılır. Entitlement katmanı bunu hazır besler.
