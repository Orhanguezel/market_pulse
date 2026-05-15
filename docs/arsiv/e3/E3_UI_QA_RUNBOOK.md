# E3 UI QA Runbook (Antigravity)

Bu runbook, `REFACTOR_CHECKLIST.md` icindeki E3 dogrulamalarini tek seferde ve tekrarlanabilir sekilde calistirmak icin hazirlandi.

## On Kosullar

- `backend` calisiyor (`/api/v1` cevap veriyor)
- `admin_panel` calisiyor
- Admin kullanicisi ile giris yapilabiliyor
- Test ortami URL'i biliniyor (ornegin `http://localhost:3094`)

## Test Akisi

### 1) Market dashboard

- URL: `/admin/market`
- Beklenen:
  - Sayfa acilir, JS/runtime error yok
  - Stat kartlari gorunur
  - Header ve sidebar render edilir

### 2) Targets ekrani

- URL: `/admin/market/targets`
- Beklenen:
  - Tablo yuklenir
  - "Yeni Hedef" dialogu acilir
  - Form submit akisi calisir (validasyon mesaji veya basari toast)
  - Churn badge gorunur (`churn-low`, `churn-medium`, `churn-high`)
  - "Hesapla" butonu tiklandiginda islem mesaji gelir

### 3) Leads ekrani

- URL: `/admin/market/leads`
- Beklenen:
  - Tablo yuklenir
  - "Yeni Lead" dialogu acilir
  - Form submit akisi calisir

### 4) Signals ekrani

- URL: `/admin/market/signals`
- Beklenen:
  - Liste yuklenir
  - Manuel sinyal ekleme dialog/formu acilir
  - Kaydet aksiyonu mesaji gorunur

### 5) Site settings / Marka Renkleri

- URL: `/admin/site-settings`
- Beklenen:
  - "Marka Renkleri" sekmesi gorunur
  - Sekme acilinca color alanlari render edilir
  - Kaydet aksiyonu mesaji gorunur

### 6) Sidebar temizlik kontrolu

- Beklenen:
  - Silinen moduller sidebar'da gorunmez:
    - `availability`, `banners`, `campaigns`, `chat`, `email-templates`, `home-layout`, `llm-prompts`, `orders`, `reports`, `reviews`, `subscription-plans`, `subscriptions`, `telegram`, `wallet`, `announcements`
  - Kalan moduller gorunur:
    - `market`, `site-settings`, `users`, `user-roles`, `notifications`, `storage`, `db`, `audit`, `cache`, `profile`, `external-db`
  - `market/reports` linki gorunur

### 7) Dark mode gorunurluk

- Beklenen:
  - Dark mode'a geciste churn badge ve severity renkleri okunur kalir
  - Text/background kontrasti bozulmaz

### 8) Paspas import dialogu

- URL: `/admin/market/targets` ve `/admin/market/leads`
- Beklenen:
  - "Paspas'tan Ice Aktar" bolumu/dialogu acilir
  - Musteri listesi gelir veya endpoint hazir degilse kullaniciya anlamli mesaj gorunur
  - Musteri seciminde form alanlari otomatik dolar

## Hata Siniflandirma

- **Kritik:** Sayfa acilmiyor, runtime exception, form tamamen calismiyor
- **Yuksek:** Ana aksiyon calismiyor (kaydet/sil/guncelle)
- **Orta:** Gorunurluk/UX problemi (badge kontrasti, label bozuklugu)
- **Dusuk:** Kopya/metin/padding gibi kozmetik farklar

## Cikti Formati

Antigravity raporu asagidaki formatta donsun:

1. `Pass/Fail` ozeti (madde bazli)
2. Hata listesi (oncelik sirali)
3. Her hata icin:
   - URL
   - Kisa aciklama
   - Ekran goruntusu (mumkunse)
   - Repro adimi
4. "API hazir degil" nedeniyle bloklu kalanlar ayri listelensin
