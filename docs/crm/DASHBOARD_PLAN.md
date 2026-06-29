# CRM Dashboard Checklist — Tenant Uygulama Ana Ekranı

> **Karar:** `/{locale}/dashboard` Amazon aracı olmaktan çıkar; CRM/işletme yönetim ana ekranı olur. Referans: isletmeniyonet.com salecrm dashboard. Amazon analiz aracı ayrı modül/alt sayfa olarak korunur.
>
> **Rol ayrımı:** Claude frontend mimarıdır; `frontend/` uygulama kabuğu ve dashboard UI onundur. Codex backend/API/admin entegrasyon tarafını üstlenir.
>
> **Mevcut varsayım:** Şimdilik tam abone görünümü. İleride `tenant_modules` entitlement sonucuna göre sidebar filtre/kilit uygulanır.

---

## 0. Mevcut Durum

- [x] Backend CRM çekirdeği var: `/crm/accounts`, `/crm/contacts`, `/crm/pipelines`, `/crm/deals`, `/crm/activities`, `/crm/convert/lead-candidate`.
- [x] CRM route'ları `requireModule('crm')` arkasında ve tenant-scoped.
- [x] Entitlement altyapısı var: `module_catalog`, `tenant_modules`, admin catalog/tenant endpointleri.
- [x] Admin CRM pipeline/accounts/contacts ekranları var.
- [x] `/dashboard` şu an Amazon keyword risk analiz aracı.
- [x] CRM dashboard summary endpoint yok. → `GET /api/v1/admin/crm/dashboard/summary` eklendi.
- [x] Tenant kullanıcısı için `/entitlements/me` yok. → `GET /api/v1/admin/entitlements/me` eklendi.
- [ ] Frontend app shell yok; marketing chrome çoğu sayfayı sarıyor.
- [ ] Chart kütüphanesi yok.
- [x] Teklifler/Siparişler/Ürünler/Belgeler/Görevler tabloları yok. → `035_crm_business_records_schema.sql` eklendi.
- [x] Hatırlatma tabloları yok. → `crm_reminders` eklendi.

---

## 1. Hedef Dashboard

### 1.1 Uygulama Kabuğu

- [ ] Marketing `IyHeader/IyFooter` dashboard/app sayfalarında görünmez.
- [ ] Sol sidebar vardır.
- [ ] Üst bar vardır: logo, hızlı ekle, profil menüsü.
- [ ] Auth guard vardır; giriş yoksa login'e yönlendirir.
- [ ] IY mavi tema + Poppins korunur.

### 1.2 Sidebar Modülleri

- [ ] Haber Akışı
- [ ] Potansiyel Müşteriler
- [ ] Müşteriler
- [ ] Satış Fırsatları
- [ ] Teklifler
- [ ] Siparişler
- [ ] Ürünler
- [ ] Belgeler
- [ ] Aktiviteler
- [ ] Görevler
- [ ] Hatırlatma Yönetimi
- [ ] Mail Yönetimi
- [ ] Leads
- [ ] Amazon Analizi
- [ ] İşletme Yönetimi
- [ ] Kullanıcılar
- [ ] Raporlar
- [ ] Sipariş Arşivi
- [ ] Çıkış

**İlke:** Var olan modüller gerçek veriyle gösterilir. Henüz tablo/CRUD'u olmayan modüller gizlenmez; "yakında" rozetiyle görünür.

### 1.3 Ana Dashboard Alanı

- [ ] Welcome kartı: avatar, "Hoş geldin {ad}", email, tarih.
- [ ] Welcome metrikleri: `{quotes} bekleyen teklif`, `{open_deals} açık satış fırsatı`.
- [ ] Welcome aksiyonları: `Aktivite Ekle`, `Takvim Ekle`.
- [ ] 6 istatistik kartı:
  - [ ] Potansiyel Müşteriler
  - [ ] Satış Fırsatları
  - [ ] Siparişler
  - [ ] Müşteriler
  - [ ] Teklifler
  - [ ] Aktiviteler
- [ ] 3 grafik:
  - [ ] Satış Özeti
  - [ ] Ekip Durumu
  - [ ] İş Durumu Özeti
- [ ] Toplam kayıt sayısı görünür.

---

## 2. Backend Checklist — Codex

### 2.1 `GET /crm/dashboard/summary`

Route:

```text
GET /api/v1/admin/crm/dashboard/summary
```

Not: Mevcut CRM route grubu admin API altında kayıtlı. Tenant kullanıcı public app endpointi ayrıca açılacaksa aynı service kullanılmalı; ilk fazda kontrat sabit tutulur.

Güvenlik:

- [x] `requireModule('crm')` arkasında.
- [x] Tüm sorgular aktif tenant context/JWT ile `tenant_key` scoped.
- [x] Client'tan gelen `tenant_key` kullanılmaz.

Response kontratı:

```jsonc
{
  "counts": {
    "accounts": 25,
    "contacts": 71,
    "deals_open": 7,
    "deals_won": 7,
    "activities_pending": 0,
    "quotes": 1,
    "orders": 7,
    "leads": 71
  },
  "pending": {
    "quotes": 1,
    "open_deals": 7
  },
  "sales_summary": [
    { "month": "2026-01", "amount": 14000 }
  ],
  "status_breakdown": [
    { "label": "Müşteri", "count": 25 }
  ],
  "team_breakdown": [
    { "label": "Açık Aktivite", "count": 4 }
  ],
  "totals": {
    "records": 110
  }
}
```

Sorgu kaynakları:

- [x] `accounts`: `crm_accounts`
- [x] `contacts`: `crm_contacts`
- [x] `deals_open`: `crm_deals.status = 'open'`
- [x] `deals_won`: `crm_deals.status = 'won'`
- [x] `activities_pending`: `crm_activities.done = 0`
- [x] `leads`: `lead_candidates`
- [x] `quotes`: `crm_quotes.status IN ('draft', 'sent')`
- [x] `orders`: `crm_orders.status <> 'cancelled'`
- [x] `sales_summary`: son 6 ay won deal amount toplamı.
- [x] `status_breakdown`: accounts/contacts/open deals/pending activities.
- [x] `team_breakdown`: done/pending activities veya owner bazlı aktivite dağılımı.

### 2.2 `GET /entitlements/me`

Route:

```text
GET /api/v1/admin/entitlements/me
```

İlk fazda admin API altında kullanılabilir; public tenant app route ayrışırsa service aynı kalır.

- [x] Aktif tenant'ı JWT/tenant context'ten alır.
- [x] Super-admin selected tenant ile çalışır.
- [x] Aktif/trial süresi geçmemiş modülleri döndürür.
- [x] Response sidebar filtreye uygun sade formdadır:

```jsonc
{
  "tenant_key": "vistaseeds",
  "modules": [
    { "module_key": "leads", "status": "active" },
    { "module_key": "crm", "status": "active" }
  ]
}
```

### 2.3 Backend Testleri

- [x] CRM summary counts tenant-scoped çalışır.
- [x] Summary başka tenant verisini toplamaz.
- [x] `requireModule('crm')` yetkisiz tenant için 402 döndürür.
- [x] `entitlements/me` aktif tenant modüllerini döndürür.
- [x] `entitlements/me` expired trial modülü aktif saymaz.

---

## 3. Frontend Checklist — Claude

### 3.1 App Shell

- [ ] Route group oluştur: `src/app/[locale]/(app)/...`
- [ ] Dashboard `(app)` altında render edilir.
- [ ] Marketing chrome dashboard/app sayfalarında yoktur.
- [ ] Sidebar/topbar responsive çalışır.
- [ ] Auth guard `(app)` layout'tadır.
- [ ] Aktif menü vurgusu vardır.

### 3.2 Dashboard UI

- [ ] `/{locale}/dashboard` CRM ana ekranı olur.
- [ ] Welcome kartı API veya mock veriyle çalışır.
- [ ] 6 istatistik kartı API verisine bağlanır.
- [ ] Grafikler `recharts` ile yapılır.
- [ ] Boş veri state'i profesyonel görünür.
- [ ] Loading/error state'leri vardır.

### 3.3 Amazon Aracı

- [ ] Eski dashboard Amazon analiz aracı korunur.
- [ ] Yeni route: `/{locale}/amazon` veya `/{locale}/leads/amazon`.
- [ ] Sidebar'dan erişilir.
- [ ] Eski `/dashboard` linkleri gerekirse yeni dashboard'a yönlenir.

### 3.4 Tenant CRM Liste Sayfaları — Faz 2

- [ ] Müşteriler listesi
- [ ] Kontaklar listesi
- [ ] Satış fırsatları listesi/kanban
- [ ] Aktiviteler listesi
- [ ] Detay sayfaları

---

## 4. Modül Haritası

| Sidebar modülü | Backend durumu | Faz 1 davranışı |
|---|---|---|
| Haber Akışı | summary endpoint yeni | Gerçek veri |
| Potansiyel Müşteriler | `lead_candidates` var | Gerçek sayı |
| Müşteriler | `crm_accounts` var | Gerçek sayı |
| Satış Fırsatları | `crm_deals` var | Gerçek sayı |
| Aktiviteler | `crm_activities` var | Gerçek sayı |
| Leads | lead-machine/customs var | Gerçek link |
| Amazon Analizi | mevcut araç var | Ayrı modül |
| Teklifler | `crm_quotes` var | Gerçek veri |
| Siparişler | `crm_orders` var | Gerçek veri |
| Ürünler | `crm_products` var | Gerçek veri |
| Belgeler | `crm_documents` var | Gerçek veri |
| Görevler | `crm_tasks` + aktiviteler var | Gerçek veri |
| Hatırlatma Yönetimi | `crm_reminders` var | Gerçek veri |
| Mail Yönetimi | outreach + `/crm/mail/summary` var | Gerçek veri |
| İşletme Yönetimi | tenant/settings/modules + `/crm/business/summary` var | Gerçek veri |
| Kullanıcılar | auth/tenant roles + `/crm/users/summary` var | Gerçek veri |
| Raporlar | market reports + `/crm/reports/summary` var | Gerçek veri |

---

## 5. Fazlama

### Faz 1 — Dashboard Temeli

- [x] Codex: `/crm/dashboard/summary`
- [x] Codex: `/entitlements/me`
- [x] Codex: testler
- [ ] Claude: `(app)` shell
- [ ] Claude: CRM dashboard UI
- [ ] Claude: Amazon aracını alt modüle taşıma
- [ ] Kabul: Backend build/test yeşil, frontend typecheck/build yeşil, dashboard gerçek tenant verisiyle açılır.

### Faz 2 — Tenant CRM Ekranları

- [ ] Müşteriler/contacts/deals/activities tenant tarafı liste ve detay.
- [ ] Sidebar entitlement filtre/kilit.
- [x] Teklifler/Siparişler ayrı modele hazırlık yapılır.
- [x] Ürünler/Belgeler/Görevler ayrı modele hazırlık yapılır.
- [x] Hatırlatma Yönetimi ayrı modeli yapılır.

### Faz 3 — Eksik Modüller

- [x] Ürünler
- [x] Belgeler
- [x] Görevler
- [x] Hatırlatma Yönetimi
- [x] Mail Yönetimi
- [x] Raporlar

---

## 6. Koordinasyon Notları

- Claude frontend mimarıdır; Codex `frontend/` tarafına dokunmaz.
- Codex backend kontratını bu dokümandaki JSON'a göre sabit tutar.
- Claude endpoint hazır olmadan mock veriyle başlayabilir.
- Yeni backend tabloları gerekirse yeni `0XX_*.sql` seed dosyasıyla eklenir; `ALTER TABLE` yok.
- Mevcut CRM tabloları tenant-scoped kalır.
