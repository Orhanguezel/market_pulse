# 10 — Başarı Kriterleri ve KPI

Bu doküman MatPortal'ın **ne zaman başarılı olduğunu**, **nasıl ölçüleceğini**, **kim sorumlu** ve **hangi sıklıkla raporlanacağını** tanımlar. Felsefe: **ölçülemeyen başarı, başarı değildir**.

## 1. Üst Düzey Başarı Tanımı

MatPortal aşağıdaki 4 noktada başarılıdır:

| # | Boyut | Ölçü |
|---|-------|------|
| 1 | **Bayi tarafı** | Bayinin sipariş alma kanalı portal oluyor (>%70 portal) |
| 2 | **Tahmin doğruluğu** | Üretim planlama hatası yarıdan az oluyor (MAPE < %20) |
| 3 | **Operasyonel verimlilik** | Satış ekibi sipariş alma zamanı yarıdan az |
| 4 | **Stratejik avantaj** | Bayi churn'dan korunma, pazar zekası, yeni keşif |

Bu 4 boyut için 30+ KPI tanımlıdır. Her ay raporlanır, her çeyrek değerlendirilir.

## 2. Ana KPI Kategorileri

### Kategori A — Bayi Adopt (Faz 6)
### Kategori B — Tahmin Doğruluğu (Faz 2 + 7)
### Kategori C — Operasyonel Verimlilik (Tüm fazlar)
### Kategori D — Churn & Retention (Faz 5)
### Kategori E — Lead & Büyüme (Faz 3)
### Kategori F — Sistem Sağlığı (Tüm fazlar)
### Kategori G — Mali (operasyonel)

## 3. Kategori A — Bayi Adopt

### A-1: Portal aktif kullanıcı sayısı
- **Tanım:** Son 30 gün içinde en az 1 kez giriş yapan bayi user
- **Veri:** `portal_audit` (login event)
- **Hedef ay 3:** 5 (pilot)
- **Hedef ay 6:** 25
- **Hedef ay 12:** 50+
- **Yön:** Yüksek iyi
- **Sahibi:** Satış sorumlusu

### A-2: Portal'dan gelen sipariş oranı
- **Tanım:** (portal sipariş / toplam sipariş) %
- **Veri:** `satis_siparisleri.kaynak`
- **Hedef ay 6:** %30
- **Hedef ay 12:** %70
- **Hedef ay 18:** %85
- **Yön:** Yüksek iyi

### A-3: Bayi başına aylık sipariş sayısı
- **Tanım:** Aktif bayilerin ortalama sipariş frekansı
- **Veri:** `satis_siparisleri` GROUP BY bayi
- **Baseline:** ~2-4 sipariş/ay
- **Hedef ay 12:** %30-40 artış (3-5 sipariş/ay)
- **Yön:** Yüksek iyi

### A-4: Ortalama sepet büyüklüğü
- **Tanım:** Sipariş başına ortalama tutar
- **Veri:** `satis_siparisleri.toplam_tutar` ortalama
- **Baseline:** ~40K TL
- **Hedef ay 12:** %15-25 artış (50K TL)
- **Yön:** Yüksek iyi

### A-5: Sepet terk oranı
- **Tanım:** Sepete eklenip onaylanmayan / toplam sepet
- **Veri:** `portal_sepet.durum = 'terk'`
- **Hedef:** <%30
- **Yön:** Düşük iyi

### A-6: Tek tıkla yeniden sipariş kullanımı
- **Tanım:** "Yeniden sipariş" butonu kullanım sıklığı
- **Veri:** `portal_audit.aksiyon = 'yeniden_siparis'`
- **Hedef ay 6:** Aktif bayilerin %40'ı kullanıyor
- **Yön:** Yüksek iyi

### A-7: Bayi memnuniyet skoru (NPS)
- **Tanım:** Net Promoter Score, 0-10 ölçeği
- **Veri:** Anket (3 ayda bir)
- **Hedef:** >40 (iyi sektör)
- **Yön:** Yüksek iyi
- **Not:** Faz 6 sonu pilot anket, sonra çeyreklik

## 4. Kategori B — Tahmin Doğruluğu

### B-1: MAPE (genel)
- **Tanım:** Mean Absolute Percentage Error tüm tahminler ortalaması
- **Veri:** `tahmin_dogruluk.mape`
- **Hedef ay 3:** <%50
- **Hedef ay 6:** <%35
- **Hedef ay 12:** <%25
- **Hedef ay 24:** <%20
- **Yön:** Düşük iyi
- **Sahibi:** ML Engineer

### B-2: MAPE (bayi-ürün özel)
- **Tanım:** Bayi-ürün modellerinin ayrı ortalaması
- **Hedef ay 12:** %15-20 (az hata)
- **Yön:** Düşük iyi

### B-3: Coverage (güven aralığı doğruluğu)
- **Tanım:** %95 güven aralığı içine düşen gerçek değer oranı
- **Hedef:** >%90
- **Yön:** Yüksek iyi

### B-4: Bias (sistematik sapma)
- **Tanım:** Tahminlerin gerçek değerden ortalama sapması (yön belli)
- **Hedef:** ±%5
- **Yön:** Sıfıra yakın iyi

### B-5: Naive baseline iyilik oranı
- **Tanım:** Model MAPE'si ne kadar naive'den iyi?
- **Formula:** `(naive_mape - model_mape) / naive_mape`
- **Hedef:** >%10
- **Yön:** Yüksek iyi
- **Not:** %10'dan az iyilik → naive yeter, modele gerek yok

### B-6: Champion değişim sıklığı
- **Tanım:** Haftalık champion model güncelleme sayısı
- **Hedef:** İlk 3 ay sık (modeller olgunlaşıyor), sonra stabil
- **Yön:** Stabil iyi (yıl 2'de değişiklik az)

### B-7: A/B test başarı oranı
- **Tanım:** Challenger → champion'a yükselen oran
- **Hedef:** %20-40 (ne çok ne az değişim)
- **Yön:** Sağlıklı bant

### B-8: Tahmin "açıklama" kalitesi
- **Tanım:** Yöneticinin "açıklama anlamlı mıydı?" puanı
- **Veri:** Aksiyon onay UI'da feedback
- **Hedef:** 4/5 ortalama
- **Yön:** Yüksek iyi

## 5. Kategori C — Operasyonel Verimlilik

### C-1: Satış ekibi sipariş alma zamanı
- **Tanım:** Günlük ortalama sipariş kabul süresi (saat)
- **Baseline:** 3-4 saat/gün/kişi
- **Hedef ay 12:** <1.5 saat/gün/kişi
- **Yön:** Düşük iyi
- **Veri:** Manuel anket + portal sipariş sayısından çıkarsama

### C-2: Sipariş hatası sayısı
- **Tanım:** Aylık yanlış fiyat/miktar/SKU sipariş sayısı
- **Baseline:** 8-12/ay
- **Hedef ay 6:** <3/ay
- **Hedef ay 12:** <2/ay
- **Yön:** Düşük iyi

### C-3: Cari sorgu sayısı (bayinin muhasebeyi araması)
- **Tanım:** Telefon/email cari soru sayısı
- **Baseline:** ~50/ay
- **Hedef ay 12:** <%20'sine düşer
- **Yön:** Düşük iyi
- **Veri:** Manuel kayıt + portal cari sayfa view'dan çıkarsama

### C-4: Stok-out olayı sayısı
- **Tanım:** Aylık ürün stoksuz kalma vakası
- **Baseline:** ~5-10/ay
- **Hedef ay 12:** -%50
- **Yön:** Düşük iyi
- **Veri:** `stoklar` historical + sipariş ret

### C-5: Aşırı stok kalemi
- **Tanım:** 3 ay tüketim üstünde duran ürün sayısı
- **Hedef:** -%30 (ay 12)
- **Yön:** Düşük iyi

### C-6: PO taslağı onay süresi
- **Tanım:** Otomatik PO taslağı oluşturulup yönetici onaylanana kadar
- **Hedef:** <24 saat
- **Yön:** Düşük iyi

### C-7: Üretim planı ile gerçekleşen sapma
- **Tanım:** Planlanan üretim - gerçekleşen
- **Baseline:** ~%15
- **Hedef ay 12:** <%8
- **Yön:** Düşük iyi

### C-8: Email/bildirim teslim oranı
- **Tanım:** Gönderilen / başarıyla teslim edilen
- **Hedef:** >%95
- **Yön:** Yüksek iyi

## 6. Kategori D — Churn & Retention

### D-1: Aylık bayi churn oranı
- **Tanım:** (Son 90 gün siparişsiz bayi / aktif bayi) %
- **Baseline:** Bilinmiyor (Faz 5 sonrası ölçülecek)
- **Hedef yıl 1:** <%5/yıl
- **Yön:** Düşük iyi

### D-2: Churn radarı erken sinyal precision
- **Tanım:** Yüksek risk işaretledik, gerçekten churn etti mi?
- **Hedef:** >%70
- **Yön:** Yüksek iyi

### D-3: Churn radarı recall
- **Tanım:** Churn etti, biz önceden işaretleyebildik mi?
- **Hedef:** >%50 (manuel sinyalle birlikte)
- **Yön:** Yüksek iyi

### D-4: Churn'dan kurtarma oranı
- **Tanım:** Yüksek riskli bayi → aksiyon → düşük risk
- **Hedef:** %30+ kurtarma
- **Yön:** Yüksek iyi

### D-5: Aksiyon ROI
- **Tanım:** Aksiyon maliyeti vs kurtarılan ciro
- **Hedef:** ROI > 5x
- **Yön:** Yüksek iyi

### D-6: Bayi Lifetime Value (LTV)
- **Tanım:** Bayi başına ömür boyu beklenen ciro
- **Hesap:** Ortalama yıllık ciro × ortalama ömür
- **Hedef yıl 1:** %20+ artış (churn azaldıkça)
- **Yön:** Yüksek iyi

## 7. Kategori E — Lead & Büyüme

### E-1: Yeni lead/ay (yurt içi)
- **Tanım:** Kalite filtreden geçen lead sayısı
- **Hedef ay 6:** 200+/ay
- **Yön:** Yüksek iyi

### E-2: Yeni lead/ay (yurt dışı)
- **Tanım:** Apollo/Hunter ile çıkarılan
- **Hedef ay 12:** 100+/ay
- **Yön:** Yüksek iyi

### E-3: Lead → bayi dönüşüm oranı
- **Tanım:** Lead'lerden ne kadarı müşteriye dönüşüyor
- **Hedef:** %5-10 (sektör ortalaması)
- **Yön:** Yüksek iyi

### E-4: Aktif bayi sayısı (toplam)
- **Tanım:** Son 90 gün siparişli bayi
- **Baseline:** 35
- **Hedef ay 12:** 50-65
- **Hedef ay 24:** 100+
- **Yön:** Yüksek iyi

### E-5: Outreach email açma oranı
- **Tanım:** Gönderilen / açılan
- **Hedef:** >%20
- **Yön:** Yüksek iyi

### E-6: Outreach yanıt oranı
- **Tanım:** Email gönderilen / yanıt alınan
- **Hedef:** >%5
- **Yön:** Yüksek iyi

## 8. Kategori F — Sistem Sağlığı

### F-1: API uptime
- **Tanım:** %
- **Hedef:** %99.5 (downtime <4.4 saat/ay)
- **Yön:** Yüksek iyi

### F-2: API latency p95
- **Tanım:** 95. percentile yanıt süresi
- **Hedef:** <500ms
- **Yön:** Düşük iyi

### F-3: API hata oranı
- **Tanım:** HTTP 5xx /toplam
- **Hedef:** <%0.5
- **Yön:** Düşük iyi

### F-4: Crawler başarı oranı
- **Tanım:** Başarılı crawl / toplam
- **Hedef:** >%90
- **Yön:** Yüksek iyi

### F-5: ML servis tahmin latency
- **Tanım:** Ortalama tahmin süresi (cache miss)
- **Hedef:** <500ms
- **Yön:** Düşük iyi

### F-6: LLM token harcama
- **Tanım:** Aylık token / dolar
- **Hedef:** Bütçe içinde (kategori G ile birlikte)
- **Yön:** Bütçe içi

### F-7: Test coverage
- **Tanım:** Backend kod coverage %
- **Hedef:** >%70 (kritik fonk %90+)
- **Yön:** Yüksek iyi

### F-8: Deploy frekansı
- **Tanım:** Aylık production deploy sayısı
- **Hedef:** 4-8/ay (haftalık 1-2)
- **Yön:** Sağlıklı bant

### F-9: MTTR (Mean Time To Recovery)
- **Tanım:** Hatadan toparlanma ortalama süresi
- **Hedef:** <30 dk (kritik), <2 saat (yüksek)
- **Yön:** Düşük iyi

### F-10: Audit log eksiksizliği
- **Tanım:** Risk 7+ aksiyonların audit'lendiği oran
- **Hedef:** %100
- **Yön:** Yüksek iyi

## 9. Kategori G — Mali (Operasyonel)

### G-1: Aylık operasyonel maliyet (toplam)
- **Tanım:** Tüm SaaS + cloud + LLM
- **Hedef:** Bütçe içinde (Senaryo A/B/C — Doc 08)
- **Yön:** Bütçe içi

### G-2: ROI (operasyonel)
- **Tanım:** Aylık tasarruf / aylık maliyet
- **Hedef yıl 1:** >10x
- **Yön:** Yüksek iyi

### G-3: LLM maliyet/sorgu
- **Tanım:** Ortalama LLM çağrı maliyeti
- **Hedef:** Cache + provider mix ile <$0.01/sorgu
- **Yön:** Düşük iyi

### G-4: Kullanıcı başına aylık maliyet
- **Tanım:** Aylık operasyonel / aktif user
- **Hedef:** <$5/user
- **Yön:** Düşük iyi

## 10. KPI Dashboard

### 10.1 Yönetici dashboard'u

```
[Ekran: /admin/kpi-dashboard]

  ÜST DÜZEY (4 boyut)
  ┌──────────────┬──────────────┬─────────────┬──────────────┐
  │ Bayi adopt   │ Tahmin       │ Operasyonel │ Stratejik    │
  │              │              │             │              │
  │ Portal: 65%  │ MAPE: %22    │ Sipariş     │ Churn: %3.2  │
  │ ↑ +12% MoM   │ ↓ -3 puan    │ hatası: 2/ay│ ↓ %50 azaldı │
  │              │              │ Sipariş     │ Yeni bayi:   │
  │ Hedef: 70%   │ Hedef: %20   │ alma: 1.2hr │ 12/ay        │
  └──────────────┴──────────────┴─────────────┴──────────────┘

  Trend (son 12 ay): [GRAFİK]

  Risk uyarıları (3): bkz risk dashboard
  KPI sapma (2): A-2 (%65 vs hedef %70), B-1 (%22 vs hedef %20)
```

### 10.2 Detay dashboard

Her kategori için ayrı dashboard:
- /admin/kpi/bayi-adopt
- /admin/kpi/tahmin
- /admin/kpi/operasyonel
- /admin/kpi/churn
- /admin/kpi/lead
- /admin/kpi/sistem
- /admin/kpi/mali

Her dashboard'da: trend grafiği + hedef çizgisi + son değer + sahip + son güncelleme.

## 11. Raporlama Sıklığı

| Sıklık | Hedef | İçerik |
|--------|-------|--------|
| Anlık | Yönetici dashboard | F-* sistem sağlığı |
| Günlük | Tech Lead | F-3 hata, F-1 uptime, A-1 aktivite |
| Haftalık | Sales lead + ML eng | A-* adopt, B-* tahmin, D-* churn |
| Aylık | Promats yönetimi | Tüm KPI'lar PDF özet |
| Çeyreklik | Üst yönetim + yatırımcı | Stratejik review + roadmap güncelleme |
| Yıllık | Yıllık review | ROI, hedef revizyonu |

## 12. KPI Ownership Matrisi

| KPI Kategori | Sahibi | Yedekleyen |
|--------------|--------|------------|
| A — Bayi adopt | Satış sorumlusu | Yönetici |
| B — Tahmin | ML Engineer | Tech Lead |
| C — Operasyonel | Üretim planlama | Tech Lead |
| D — Churn | Satış sorumlusu | Saha ekibi |
| E — Lead | Satış sorumlusu | Pazarlama |
| F — Sistem | Tech Lead | DevOps |
| G — Mali | CFO/Yönetici | Tech Lead |

## 13. KPI Hedef Revizyonu

KPI hedefleri **canlı** belge:
- Faz tamamlanmasıyla baseline ölçülür
- Hedefler revize edilir
- Promats yönetimi onayı

Örnek revizyon:
> Faz 6 sonu: Pilot 5 bayide portal adopt %85. Hedef ay 12 %70 idi → %85'e güncelle.

## 14. Başarısızlık Senaryoları

### "Faz 2 sonunda MAPE %50, hedef %35" — ne yapılır?
1. Root cause: veri yetersiz mi, model yanlış mı?
2. Aksiyonlar:
   - Excel ile geçmiş veri yükleme acil
   - Multivariate (kur+tatil) feature'lar Faz 7'den öne çekilebilir
   - Naive baseline kullanılır, model yan üretilir
3. Promats yönetimi rapor: "%50, hedefe ulaşmak için 4 hafta ek + Excel veri"

### "Faz 6 sonunda 3 pilot bayi de portal'ı kullanmıyor"
1. Root cause: UX, eğitim yeterli mi, bayinin gerçek ihtiyacı bu mu?
2. Aksiyonlar:
   - Bireysel görüşme: ne gerekiyor?
   - UI revizyonu (3 alternatif tasarım test)
   - Onboarding canlı eğitim (saha ziyaret)
   - "Portal'da %3 ek iskonto" teşviki
3. Yaygın canlıya **geçmez**, pilot süresi uzar

### "Yıl 1 sonunda hiçbir bayi churn radarına göre kurtarılmadı"
1. Root cause: Sinyaller doğru mu, aksiyonlar etkili mi?
2. Aksiyonlar:
   - Sinyal validasyonu (kim doğru kim yanlış pozitif)
   - Aksiyon türleri çeşitlendirme
   - Saha ekibi geri besleme: "ne işe yaradı"
3. Faz 5 v2 öne çek: ML model iyileştirme

## 15. Açık karar noktaları (KPI)

1. **NPS anketi:** Çeyreklik mi, yarıyıllık mı? (Önerim: çeyreklik pilot 6 ay sonra)
2. **KPI dashboard erişim:** Tüm yöneticiler mi, sadece üst yönetim mi? (Önerim: tüm yöneticiler — şeffaflık)
3. **Faz 6 başarı eşiği:** Pilot %80 mi yeterli, %50 mi? (Önerim: %80 — düşükse rollback)
4. **MAPE hedefi:** %20 (yıl 1) gerçekçi mi? (Önerim: kademeli — %35→25→20)
5. **Lead → bayi dönüşüm:** %5 düşük mü? (Önerim: sektörle revize, ilk 6 ay %3-5 hedefle başla)
6. **Çeyreklik review katılımcılar:** Kim? (Promats karar)
7. **Başarısızlık eşiği:** Faz red kriteri? (Önerim: Hedeflerin %50'sine ulaşılmıyorsa kapsam revizyonu)
8. **Haftalık report otomatik mu, manuel mı?** (Önerim: otomatik PDF + Slack/email)
9. **KPI hedef revizyonu sıklığı:** Çeyreklik mi yıllık mı? (Önerim: çeyreklik — esneklik için)
10. **Yatırımcı raporu:** Yıllık mı, çeyreklik mi? (Promats karar)
