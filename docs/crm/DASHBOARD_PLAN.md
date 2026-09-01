# CRM Dashboard — Uygulanan Durum ve Kabul Kontrolü

Son denetim: 2026-07-11

Bu belge ilk geliştirme planının güncel durum kaydıdır. Ayrıntılı kişi-bazlı taşıma geçmişi için `ADMIN_TO_USER_DASHBOARD_PLAN.md` esas alınır.

## Mimari karar

İlk plandaki `src/app/[locale]/(app)` route group'u yerine `ClientLayout` içindeki uygulama-path sınıflandırması ve tek `AppShell` kullanıldı. Sonuç aynıdır: uygulama sayfalarında marketing header/footer render edilmez, auth ve entitlement kontrolü tek kabukta uygulanır.

## Uygulama kabuğu

- [x] Marketing `IyHeader/IyFooter` uygulama sayfalarında görünmez.
- [x] Responsive ve daraltılabilir sol sidebar vardır.
- [x] Üst bar; logo, hızlı ekle, bildirim ve profil menüsünü içerir.
- [x] Tek auth guard girişsiz kullanıcıyı login'e yönlendirir.
- [x] Entitlement'a göre menü ve doğrudan URL erişimi korunur.
- [x] Aktif menü vurgusu vardır.
- [x] IY mavi tema ve Poppins korunur.

## Sidebar ve sayfalar

- [x] Haber Akışı / Dashboard
- [x] Firma Bulucu, Tarama İşleri, Fuar Günü ve ICP
- [x] Potansiyel Müşteriler
- [x] Müşteriler ve detay
- [x] Kontaklar
- [x] Satış Fırsatları ve detay
- [x] Teklifler ve detay
- [x] Siparişler ve detay/arşiv görünümü
- [x] Ürünler ve detay
- [x] Dosya Deposu ve detay (Storage motoru; resim/PDF/Word/Excel/video/genel dosya)
- [x] Aktiviteler
- [x] Görevler
- [x] Takvim ve Hatırlatma Yönetimi
- [x] Mail Yönetimi
- [x] Karar Verici Bulma
- [x] Amazon Analizi
- [x] İşletme Yönetimi ve Sinyaller
- [x] Kullanıcılar
- [x] Raporlar
- [x] Bildirimler ve çıkış akışı

## Dashboard kabul kriterleri

- [x] `/{locale}/dashboard` CRM ana ekranıdır.
- [x] Welcome kartı avatar/ad/email/tarih gösterir.
- [x] Bekleyen teklif ve açık satış fırsatı gerçek summary verisinden gelir.
- [x] Aktivite ve takvim aksiyonları gerçek dialog/mutation akışına bağlıdır.
- [x] Altı istatistik kartı gerçek API verisine bağlıdır.
- [x] Satış, ekip ve iş durumu grafikleri `recharts` kullanır.
- [x] Toplam kayıt sayısı görünür.
- [x] Loading/error ve boş veri durumları vardır.
- [x] Amazon aracı `/[locale]/amazon` altında korunur ve sidebar'dan erişilir.

## Backend kabul kriterleri

- [x] `GET /crm/dashboard/summary` auth + `crm` entitlement arkasındadır.
- [x] Summary sorguları tenant ve owner scope ile çalışır.
- [x] `GET /entitlements/me` aktif/trial modülleri döndürür.
- [x] CRM ve entitlement testleri vardır.

## Doğrulama

```bash
cd frontend && npm run typecheck && npm run build
cd backend && npm run build
```

Dashboard planında açık yerel geliştirme maddesi kalmamıştır.
