# AGENTS.md — MarketPulse Admin Panel (Codex için)

Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + RTK Query projesi.

---

## Teknoloji Kararları (Değiştirme)

- **Framework:** Next.js 16 App Router, React 19
- **UI:** shadcn/ui (Radix UI), Tailwind v4
- **State/API:** RTK Query — `src/integrations/baseApi.ts` üzerinden
- **Hooks barrel:** `src/integrations/hooks.ts` — tüm RTK Query hook'ları buradan export edilir
- **i18n:** `src/i18n/` + `src/locale/tr.json` / `en.json` — `useAdminT()` hook'u
- **Para birimi:** TRY (₺) — `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })`
- **Tarih formatı:** tr-TR locale — `new Date().toLocaleString('tr-TR')`
- **Port:** 3094

## Dosya Yapısı Kuralı

Her admin sayfası şu paterni izler:

```
src/app/(main)/admin/(admin)/<sayfa>/
├── page.tsx                   ← Server component, sadece import
└── _components/
    └── admin-<sayfa>-client.tsx   ← 'use client', asıl içerik
```

Yeni RTK endpoint eklendiğinde:
1. `src/integrations/endpoints/admin/<sayfa>_admin.endpoints.ts` oluştur
2. `src/integrations/hooks.ts`'e `export * from '...'` ekle

## API Base URL

```ts
import { BASE_URL } from '@/integrations/apiBase';
// Otomatik: NEXT_PUBLIC_API_URL env veya localhost:8094/api/v1
```

Admin endpoint'leri `/admin/` prefix'i taşır ve Bearer token gerektirir.

---

## GÖREV LİSTESİ (T2-7 → T2-12)

### T2-7: Sipariş/Ödeme Listesi

**Mevcut durum:** `orders/` sayfası var ama EUR para birimi ve de-DE tarih formatı kullanıyor.

**Yapılacak — `orders/_components/admin-orders-client.tsx`:**
1. `fmtMoney` fonksiyonunu TRY'ye çevir:
   ```ts
   new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)
   ```
2. `fmtDate` fonksiyonunu tr-TR'ye çevir:
   ```ts
   d.toLocaleString('tr-TR')
   ```
3. Sütun ekle: `booking_id` (varsa, linki `/admin/bookings/[id]`)
4. Sipariş durumu badge'leri Türkçe: `pending → Bekliyor`, `completed → Tamamlandı`, `cancelled → İptal`, `refunded → İade`
5. Payment method kolonuna `iyzipay` badge'i ekle

**Backend endpoint:** `GET /admin/orders?page=&limit=&status=&payment_status=`
**RTK hook:** `useListOrdersAdminQuery` (zaten var, `orders_admin.endpoints.ts`)

---

### T2-8: Değerlendirme Moderasyonu

**Mevcut durum:** `reviews/` sayfası var, approve/reject hook'ları kontrol et.

**Yapılacak — `reviews/_components/admin-reviews-client.tsx`:**
1. Filtreler: `is_approved` (hepsi/onaylı/bekleyen), `rating` (1-5), `target_type=consultant`
2. Her satırda:
   - Danışman adı (consultant → users.full_name — backend join ile gelmeli)
   - Kullanıcı adı (user → users.full_name)
   - Puan (⭐ renk: gold `#D4AF37`)
   - Yorum (kırpılmış, hover'da tam)
   - `is_approved` toggle (PATCH `/admin/reviews/:id` ile)
   - Sil butonu (DELETE `/admin/reviews/:id`)
3. Onaylanmamış yorumlar kırmızı arka planlı satır

**Backend endpoint'leri:**
```
GET  /admin/reviews?is_approved=&target_type=consultant&rating=
PATCH /admin/reviews/:id   { is_approved: boolean, is_active: boolean }
DELETE /admin/reviews/:id
```

**RTK dosyası:** `src/integrations/endpoints/admin/reviews_admin.endpoints.ts` (zaten var)
**Kontrol:** `useListReviewsAdminQuery`, `useUpdateReviewAdminMutation`, `useDeleteReviewAdminMutation` hook'ları export edilmiş mi?

---

### T2-9: Destek Talepleri

**Mevcut durum:** `support/` sayfası var (tek `page.tsx`). İçerik yazılmamışsa sıfırdan yaz.

**Dosya:** `support/_components/admin-support-client.tsx`

```
Liste görünümü:
- Tablo: ticket_number, subject, status badge, priority badge, kullanıcı adı, created_at
- Filtreler: status (open/in_progress/resolved/closed), priority (low/medium/high/urgent)
- Satıra tıkla → /admin/support/[id] detay sayfası

Detay sayfası (_components/admin-support-detail-client.tsx):
- Ticket bilgileri (subject, description, status, priority)
- Status değiştir (PATCH /admin/support/:id { status })
- Mesaj geçmişi (GET /admin/support/:id/messages)
- Yeni mesaj gönder (POST /admin/support/:id/messages { content })
```

**Backend endpoint'leri:**
```
GET    /admin/support?page=&status=&priority=
GET    /admin/support/:id
PATCH  /admin/support/:id       { status, priority, assigned_to }
DELETE /admin/support/:id
GET    /admin/support/:id/messages
POST   /admin/support/:id/messages   { content }
DELETE /admin/support/messages/:id
```

**RTK dosyası:** `src/integrations/endpoints/admin/support_admin.endpoints.ts` oluştur, `hooks.ts`'e ekle.

---

### T2-10: Duyuru Yönetimi

**Mevcut durum:** `announcements/` sayfası var. İçerik kontrol et, eksikse yaz.

**Dosya:** `announcements/_components/admin-announcements-client.tsx`

```
Liste:
- Tablo: title, type badge, is_active toggle, starts_at / ends_at, created_at
- "Yeni Duyuru" butonu → modal veya /admin/announcements/new
- Düzenle (PATCH) + Sil (DELETE)

Form alanları (yeni/düzenle):
- title (string)
- content (textarea)
- type: info | warning | success | error (Select)
- is_active (Switch)
- starts_at / ends_at (datetime-local input)
- target_roles: [] (multi-select: user, consultant, admin) — opsiyonel
```

**Backend endpoint'leri:**
```
GET    /admin/announcements?page=&is_active=
GET    /admin/announcements/:id
POST   /admin/announcements   { title, content, type, is_active, starts_at, ends_at }
PATCH  /admin/announcements/:id
DELETE /admin/announcements/:id
PATCH  /admin/announcements/:id/toggle   { is_active: boolean }
```

**RTK dosyası:** `src/integrations/endpoints/admin/announcements_admin.endpoints.ts` oluştur, `hooks.ts`'e ekle.

---

### T2-11: Email Şablonları

**Mevcut durum:** `email-templates/` sayfası var.

**Yapılacak:** Sayfanın çalıştığını doğrula. Eksikse şu şablonların listede göründüğünü kontrol et:

| Şablon key | Açıklama |
|-----------|---------|
| `booking_confirmed` | Randevu onaylandı |
| `booking_cancelled` | Randevu iptal |
| `booking_reminder` | Hatırlatma (24h/2h/15dk) |
| `payment_received` | Ödeme alındı |
| `welcome` | Hoş geldiniz |
| `password_reset` | Şifre sıfırlama |

**`email-templates/` seed'i:** `backend/src/db/sql/150_email_templates_seed.sql` dosyasına bu şablonları ekle (Codex T0-3'te yazmamışsa).

**Backend endpoint'leri:**
```
GET    /admin/email-templates?page=&locale=
GET    /admin/email-templates/:id
POST   /admin/email-templates
PATCH  /admin/email-templates/:id
DELETE /admin/email-templates/:id
```

**RTK dosyası:** `src/integrations/endpoints/admin/email_templates_admin.endpoints.ts` (zaten var, `hooks.ts`'te mevcut)

---

### T2-12: Site Ayarları — Agora + Iyzipay Tab'ı

**Mevcut durum:** `site-settings/` sayfası var, tabs: branding, brand-media, cloudinary, smtp, seo, api-settings, general, locales.
**Eksik:** Agora + Iyzipay için dedicated tab yok.

**Yapılacak 1 — Yeni tab:** `site-settings/tabs/payment-agora-tab.tsx`

```tsx
// 2 bölüm: Agora SDK + Iyzipay

// AGORA bölümü (site_settings key'leri)
// key: agora.app_id     — Agora App ID (non-secret, mobilde kullanılır)
// key: agora.enabled    — Aktif mi (boolean)

// IYZIPAY bölümü
// key: iyzipay.base_url  — Sandbox: https://sandbox-api.iyzipay.com | Prod: https://api.iyzipay.com
// key: iyzipay.enabled   — Aktif mi

// NOT: API key/secret .env'de kalır, burada yönetilmez
// Kaydet → PATCH /admin/site-settings/bulk-upsert
//   body: [{ key, locale: '*', value }]
```

**Yapılacak 2 — tab listesine ekle:** `site-settings/tabs/index.ts` dosyasında `payment-agora-tab` export et ve ana `_components/admin-site_settings-client.tsx`'te tab sekme olarak ekle.

**NOT:** Seed zaten tamamlandı — `010_site_settings.sql` içinde `agora.app_id`, `agora.enabled`, `iyzipay.base_url`, `iyzipay.enabled` kayıtları mevcut. Secret'lar (API key, certificate) .env'de kalır, DB'ye girmez.

---

### T2-BONUS: Danışman Kazanç (Wallet) Sayfası

**Durum:** `wallet/` sayfası mevcut ama içerik belirsiz. Doğrula + tamamla.

**`wallet/_components/admin-wallet-client.tsx`:**

```
Liste:
- Tablo: danışman adı, toplam_kazanç (TRY), bekleyen_çekim (TRY), durum badge
- Her satır tıklanabilir → /admin/wallet/[id]

Detay sayfası:
- Danışman bilgileri + bakiye özeti
- İşlem geçmişi tablosu (transactions): type, amount, description, created_at
- "Bakiye Ayarla" butonu → modal: amount + description (POST /admin/wallet/adjust)
```

**Backend endpoint'leri:**
```
GET  /admin/wallet?page=&status=
GET  /admin/wallet/:id
PATCH /admin/wallet/:id/status   { status }
POST  /admin/wallet/adjust       { wallet_id, amount, description }
GET  /admin/wallet/:walletId/transactions?page=
PATCH /admin/wallet/transactions/:id/status   { status }
```

**RTK dosyası:** `src/integrations/endpoints/admin/wallet_admin.endpoints.ts` (zaten var)
**Kontrol:** `hooks.ts`'e export eklenmiş mi? (`export * from '.../wallet_admin.endpoints'`)

---

## Önemli Kurallar

1. **Para birimi:** Her yerde TRY — `₺` sembolü, `tr-TR` locale
2. **Tarih:** `tr-TR` locale, 24 saat formatı
3. **Loading:** `<Loader2 className="animate-spin" />` (lucide-react)
4. **Hata:** `toast.error(...)` (sonner)
5. **Başarı:** `toast.success(...)`
6. **Silme:** Onay dialog'u (`AlertDialog` shadcn) — "Bu işlem geri alınamaz"
7. **Auth:** Tüm admin endpoint'leri Bearer token gerektirir — `baseApi.ts` bunu otomatik ekler
8. **TypeScript:** `any` kullanma — `@/integrations/shared` tiplerini kullan
9. **Yeni tür eklenirse:** `src/integrations/shared/` altına tip dosyası ekle, `src/integrations/shared.ts` barrel'ına export et

## Sidebar Navigasyonu

`src/navigation/sidebar/sidebar-items.ts` — **MarketPulse navigasyonu için kullanılır.**

Mevcut yapı:
- **Genel:** Dashboard, Consultants, Users, Bookings, Orders
- **İletişim:** Reviews, Support, Announcements, Notifications, Email Templates, Chat
- **Sistem:** Site Settings, Availability, Wallet, Payment Settings, Mail, Storage, DB, Audit

Konigsmassage'den gelen slider/services/faqs/resume/projects öğeleri zaten kaldırılmış. Sidebar'a dokunma gerekmiyor.
