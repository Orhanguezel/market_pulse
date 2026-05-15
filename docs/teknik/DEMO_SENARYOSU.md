# MarketPulse Pilot Demo Senaryosu (15-20 Dk)

**Hedef Kitle:** Satış Yöneticileri, Genel Müdür (Karar Alıcı)
**Amaç:** Sistemin değer önerisini net, görsel ve eyleme dökülebilir şekilde hissettirmek.

## 1. Karşılama ve Giriş (2 dk)
- Problemin tanımı: "Müşterilerimizi kaybetmeden önce nasıl anlarız? Yeni pazarlardaki fırsatları nasıl kaçırmayız?"
- MarketPulse'un kısa tanımı: "ERP'nize (Paspas) entegre çalışan, rakipleri ve pazarı dinleyen akıllı istihbarat merkeziniz."

## 2. Dashboard ve Hedefler (Targets) (4 dk)
- **Ekran:** `/admin/market` (MarketPulse Intelligence Dashboard)
- **Gösterim:** 
  - Üst kısımdaki anlık metrikler (Toplam Hedef, Satış Hunisi, Bekleyen Sinyal).
  - Paspas ERP'den otomatik senkronize edilen Müşteri listesi ("ERP'deki tüm aktif müşterileriniz buraya otomatik düştü").
- **Aksiyon:** 
  - Herhangi bir müşteri satırındaki **"Churn Riski"** sütununu göster (Yüksek/Orta/Düşük Risk ve Yüzde).
  - "Yeniden Hesapla" ikonuna bas. Arka planda nasıl verilerin işlenip yeni skorun geldiğini açıkla. ("Bunu manuel yapmak yerine sistem arka planda dijital ayak izi, şikayetler, sektör haberleri ve sipariş verilerinize bakarak hesaplıyor.")

## 3. Pazar Sinyalleri (Signals) (4 dk)
- **Ekran:** Pazar Sinyalleri Paneli (Alt Kısım veya `/admin/market` içindeki ilgili tablo)
- **Gösterim:**
  - "Önem derecesine göre sıralanmış kırmızı (Critical) ve sarı (High) sinyaller."
  - Sinyal örnekleri (Örn: "Rakip firma yeni kampanya başlattı", "Büyük müşteriniz X firması hakkında şikayetler artıyor").
- **Aksiyon:**
  - Bir sinyalin yanındaki **"İncele"** butonuna bas. "Sinyali gördük ve aksiyon alıyoruz" mesajı ver.

## 4. Satış Hunisi (Leads) (3 dk)
- **Ekran:** Lead Pipeline Paneli
- **Gösterim:** 
  - "Sadece mevcut müşteriler değil, sektörel olarak takip ettiğimiz yeni lead adayları."
  - Skorlara göre sıralanmış Leads tablosu.
- **Aksiyon:**
  - Yeni bir lead'in "Scoring" (Lead Score) sistemini göster. "Hangi firmaya öncelik vermemiz gerektiğini sistem bize söylüyor."

## 5. Otomatik Raporlama (Reports) (3 dk)
- **Ekran:** `/admin/market/reports` (İstihbarat Raporları)
- **Gösterim:**
  - "Yöneticilerin her gün bu ekrana girmesine gerek yok."
- **Aksiyon:**
  - **"Haftalık Raporu Önizle"** butonuna bas.
  - Açılan PDF'i göster: "Sistem, tüm bu riskleri, yeni fırsatları ve özetleri her cuma günü sizin e-postanıza bu formatta otomatik gönderir."

## 6. Kapanış ve Sonraki Adımlar (4 dk)
- **Marka Özelleştirme Gösterimi (Ekstra):** "Sistemin rengini sizin kurumsal kimliğinize göre hemen ayarlayabiliyoruz." (`site-settings > Marka Renkleri` kısmından canlı değişiklik gösterilebilir).
- **Kapanış Sorusu:** "Bu raporun her cuma size geldiğini düşünürsek, operasyonlarınızda nasıl bir hız kazanırsınız?"
- **Sonraki Adım:** Pilot teklifinin (TEKLIF_TASLAGI.md) üzerinden geçilmesi ve başlangıç onayı.
