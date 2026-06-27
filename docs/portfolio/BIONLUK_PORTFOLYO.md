# Bionluk Portfolyo — MarketPulse

Bu dosya, Bionluk "Yeni Portfolyo Ekle" akışına doğrudan kopyala-yapıştır içindir.
Görseller: `docs/portfolio/assets/` altında (yükleme sırası önerilir).

---

## 1) Kategori (adım: Yetenek/Kategori)

**Yazılım & Teknoloji → Diğer Yazılım Teknoloji**
(Mevcut "Paspas ERP" portfolyonla aynı kategori — tutarlı durur.)

---

## 2) Başlık (max 60 karakter) — **55 karakter**

```
MarketPulse — Bayi, Rakip & Pazar İzleme SaaS Platformu
```

Alternatif başlıklar:
- `MarketPulse — Sanayi İçin Lead & Pazar İstihbaratı SaaS` (54)
- `MarketPulse — Scraper Destekli B2B Lead & Churn SaaS` (52)

---

## 3) Açıklama / Detay (max 250 karakter) — **249 karakter**

```
Türk KOBİ ve sanayi firmaları için scraper destekli B2B intelligence SaaS'ı. Amazon, dizin ve fuar taramasından lead üretimi, otomatik churn risk skoru, rakip & pazar sinyali takibi, AI outreach ve haftalık PDF raporu. Next.js 16 + Fastify + Python.
```

---

## 4) Görseller (assets/ klasöründen yükle — bu sırayla)

| Sıra | Dosya | İçerik |
|---|---|---|
| 1 (kapak) | `assets/00-cover.png` | Markalı hero — başlık + öne çıkanlar + dashboard önizleme |
| 2 | `assets/01-dashboard.png` | Panel — KPI'lar, pazar sinyalleri, churn riski, lead dönüşümü |
| 3 | `assets/02-pipeline.png` | Lead Pipeline — kanban (Yeni → Görüşmede → Teklif → Dönüştürüldü) |
| 4 | `assets/03-scan.png` | Keşif & Tarama — scraper motoru, ICP eşleşen adaylar, kanal dağılımı |

> Kapak (thumbnail) olarak **00-cover.png** kullan — portfolyo kartında en iyi görüneni budur.

---

## 5) (İsteğe bağlı) Uzun açıklama / yorum alanı için metin

> MarketPulse, plastik enjeksiyon, otomotiv yan sanayi ve benzeri sektörlerdeki
> distribütörler için geliştirdiğim modüler bir SaaS platformu. Bir firma; müşterisini,
> rakibini, bayisini ve pazar sinyallerini tek panelden takip ediyor.
>
> **Öne çıkan modüller:**
> - **Lead Machine** — Amazon satıcı tarama (AI yorum analizi), B2B dizin taraması
>   (Europages/Kompass/Google Maps) ve fuar katılımcı taraması (Automechanika / 10times intent).
> - **Enrichment** — Apollo.io ile karar verici e-postası bulma.
> - **Churn Riski** — sinyal + aktivite + ERP verisinden otomatik risk skoru ve renk skalası.
> - **Pazar Sinyalleri** — site değişikliği, fiyat farkı, sosyal aktivite; manuel + scraper kaynaklı.
> - **Outreach** — human-in-the-loop AI e-posta taslağı ve takip.
> - **Raporlar** — haftalık PDF + SMTP e-posta.
>
> Her müşteri için bağımsız "copy-deploy" kurulum; ortak Python scraper motoruyla
> sinyaller otomatik üretiliyor. Pilot uygulama: Avrasya Paspas — Automechanika Frankfurt 2026.
>
> **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Shadcn UI, Fastify, Drizzle ORM,
> MySQL, Bun, Python scraper-service, Docker.

---

### Not
Görseller gerçek ürün arayüzünü temsil eden, B2B teal+navy tema diliyle hazırlanmış
yüksek çözünürlüklü (3200×2000 @2x) mockup'lardır. Kaynak HTML'ler `assets/*.html`,
yeniden üretmek için: `node shot.mjs "<abs-path>.html" "<out>.png"`.

---
---

# Bionluk İLAN (Gig) — Yazılım Geliştirme Hizmeti

> Bu bölüm `panel/ilanlar/yeni` akışı içindir (portfolyo değil, **satılan hizmet ilanı**).
> Kurallar: başlık "Ben, " ile başlar, fiille biter, noktalama yok, max 60 karakter.
> Açıklama min 150 / max 2500 karakter. Aynı görseller (`assets/00–03`) ilan görseli olarak da kullanılır.

## Kategori
**Yazılım & Teknoloji → Web Yazılım / Yazılım** olarak değiştir
(alttaki "İş & Yönetim → Satış & Müşteri Bulma" yazılım hizmetine uymaz).

## Başlık (max 60) — öneri **59 karakter**

```
Ben, scraper destekli lead bulma ve CRM paneli geliştiririm
```

Alternatifler (hepsi ≤60):
- `Ben, firmanıza özel lead bulma ve rakip takip paneli kurarım` (60)
- `Ben, işletmenize özel B2B lead ve pazar takip paneli kurarım` (60)
- `Ben, firmanıza özel B2B lead ve müşteri bulma paneli kurarım` (60)

## Açıklama (min 150 / max 2500) — **1388 karakter**

```
Merhaba! Firmanıza özel, müşteri ve rakiplerinizi tek panelden takip edebileceğiniz bir B2B lead bulma ve pazar takip yazılımı geliştiriyorum. Sektörünüze (otomotiv yan sanayi, plastik enjeksiyon, makina, ihracat vb.) göre uyarlıyorum.

✅ NELER YAPIYORUM

• Lead Machine — Amazon satıcı, B2B dizin (Europages/Kompass/Google Maps) ve fuar katılımcı taraması ile otomatik potansiyel müşteri üretimi
• ICP (ideal müşteri profili) eşleştirme ve 0–100 puanlama
• Lead pipeline — kanban panel (Yeni → Görüşmede → Teklif → Dönüştürüldü)
• Churn (kayıp) risk skoru — sinyal, aktivite ve sipariş verisinden otomatik hesap
• Pazar sinyalleri — rakip site/fiyat değişikliği, sosyal aktivite takibi (scraper ile otomatik)
• Karar verici e-posta bulma (enrichment) + AI destekli outreach e-posta taslağı
• Haftalık PDF raporu + e-posta bildirimi
• Mevcut ERP/CRM'inizle entegrasyon

🛠️ TEKNOLOJİLER
Next.js 16, React 19, TypeScript, Tailwind, Fastify, MySQL, Python scraper, Docker. Her müşteri için ayrı, bağımsız kurulum (kendi verileriniz size özel).

🚀 NASIL ÇALIŞIYORUZ
1) İhtiyaç görüşmesi ve hedef sektör/ICP belirleme
2) Demo panel ve kapsam onayı
3) Geliştirme + scraper kaynaklarının kurulumu
4) Test, eğitim ve canlıya alma

Portföyümdeki MarketPulse, bu sistemin uçtan uca geliştirdiğim canlı bir örneğidir. Kapsam ve bütçe için lütfen mesaj atın — projenize özel net bir teklif çıkarayım.
```

## Siparişe başlaman için gerekenler (max 500) — **490 karakter**

```
İşe hızlı başlamak için şunları paylaşmanız yeterli:

1) Sektör ve hedef müşteri profili (kime satıyorsunuz, hangi şehir/ülke?)
2) Takip etmek istediğiniz rakipler / firmalar (varsa web siteleri)
3) Lead kaynağı tercihi: Amazon, B2B dizin, fuar (biri veya hepsi)
4) Varsa mevcut müşteri/ERP/CRM verisi (Excel veya erişim)
5) İletişim e-postası ve outreach için gönderen bilgisi
6) Logo, marka rengi ve panel için tercih ettiğiniz dil

Net bilgi yoksa kısa bir görüşmeyle birlikte çıkarırız.
```

## Fiyatlandırma (Adım 4/5 — "3'lü Paket" anahtarını AÇ)

Fiyatlar: **20.000 / 30.000 / 50.000 ₺**

| Alan | TEMEL — 20.000 ₺ | STANDART — 30.000 ₺ | PRO — 50.000 ₺ |
|---|---|---|---|
| Paket adı | Başlangıç Paneli | Profesyonel Sistem | Kurumsal + Otomasyon |
| Teslim süresi | 20 gün | 30 gün | 45 gün* |
| Revizyon | 1 | 2 | 3 |
| Lead (müşteri adayı) sayısı | 100 | 300 | 1000 |
| Çalışma saati | 40 | 80 | 160 |
| Biçimlendirme ve Tasarım | ✅ | ✅ | ✅ |
| Lead listesi / kaynak (alt checkbox) | ☐ | ✅ | ✅ |

\* Teslim dropdown'unda 45 gün yoksa en yüksek değeri (genelde 30) seç, kalanı mesajda netleştir.

### Paket açıklamaları

**TEMEL — Başlangıç Paneli**
```
Tek sektör için lead bulma + takip paneli. Seçtiğiniz 1 kanaldan (Amazon, B2B dizin veya fuar) ICP eşleşmeli 100 aday, kanban lead pipeline ve temel firma takibi. Kendi sunucunuza kurulum.
```

**STANDART — Profesyonel Sistem**
```
TEMEL'in tümü + 2 kaynaktan 300 aday, churn risk skoru, pazar sinyalleri (rakip site/fiyat takibi), karar verici e-posta bulma ve haftalık PDF raporu. ICP'ye göre puanlama dahil.
```

**PRO — Kurumsal + Otomasyon**
```
STANDART'ın tümü + 3 kaynaktan 1000 aday, otomatik scraper sinyalleri, AI outreach e-posta taslağı, ERP/CRM entegrasyonu ve çok kullanıcılı panel. Eğitim + 1 ay destek dahil.
```

## İlan görselleri
Aynı dosyalar: `assets/00-cover.png` (kapak), `01-dashboard.png`, `02-pipeline.png`, `03-scan.png`.
