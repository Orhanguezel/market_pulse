Zoho'yu araştırdım, bu senin için aslında çok stratejik bir karşılaştırma çünkü Zoho **aynı oyunu farklı bir vertikalde 20 yıldır oynuyor**. BAZ Export "Türk ihracatçısı için operasyon işletim sistemi" diyor; Zoho 2005'ten beri "tüm SMB'ler için operasyon işletim sistemi" diyor. Konsept birebir aynı, hedef kitle farklı.

## Zoho aslında ne (rakamlarla)

- **250.000+ işletme, 180 ülke** kullanıyor
- **50+ entegre uygulama** tek faturada (Zoho One paketinde)
- **Zoho One bundle**: $37/kullanıcı/ay (All Employee modeli) — $90 (Flexible User)
- **Zoho CRM tek başına**: $14 (Standard) → $52 (Ultimate) /kullanıcı/ay
- **Zoho Bigin** (SMB için light CRM): $7/kullanıcı/ay — bu fiyat senin için referans noktası
- HubSpot Pro yıllık ~$9.000, Zoho One ~$4.500-7.200 — Zoho **%50 daha ucuz** aynı işlevsellik için

## BAZ Export'un her modülünün Zoho'da karşılığı var

Bu kritik. Senin oluşturmayı düşündüğün her şeyin Zoho'da hazır karşılığı var:

| BAZ Export modülü | Zoho karşılığı |
|---|---|
| Hesap yönetimi + CRM çekirdek | **Zoho CRM** / **Bigin** |
| E-posta sequence (tanışma/takip/toplantı) | **Zoho Campaigns** + **Marketing Automation** + **Cadences** (CRM içinde 60 cadence, 70 follow-up, email/task/call/WhatsApp) |
| Lead scoring + davranış takibi | **Zoho SalesIQ** (ziyaretçi davranışı, profil enrichment, Zia ile şirket bilgisi) |
| 7 adımlı süreç yönetimi | **Zoho Blueprint** — stage-gating, zorunlu alanlar, webhook tetikleme |
| AI öneri/skor | **Zia** (deal prediction, next-step recommendations) |
| Landing page / form | **Zoho LandingPage** + **Forms** |
| Raporlama | **Zoho Analytics** |
| WhatsApp entegrasyonu | **LeadChain** (WhatsApp Lead Ads ↔ Bigin) |

Yani teknik olarak BAZ Export'un %80'i Zoho One'ın hali hazırda yaptığı şey.

## Peki BAZ Export niye var? (Senin için en önemli kısım)

Zoho **iki kritik şeyi yapmıyor**, BAZ bunlara odaklanıyor:

1. **İhracata özel veri katmanı yok** — Zoho'da GTİP kodu, hedef pazar analizi, ithalat hacmi, gümrük vergisi, Türkiye'den ihracat verisi yok. Zoho boş bir CRM verir, içini sen doldurursun.
2. **Türk ihracatçısına özel onboarding yok** — Zoho global ürün. "Web sitemi yükle → AI ürünlerimi analiz etsin → bana hangi ülkeye gireceğimi söylesin" yok. Sen bunu kendin kuracaksın.
3. **Yerel dil + yerel destek + yerel ödeme + yerel mevzuat** — Zoho Türkçe'yi destekliyor ama "Türk KOBİ'nin ihracat operasyonu" bilmiyor.

Bu üç şey BAZ Export'un **moat'ı** (savunma hendeği). Zoho hiçbir zaman bunu sunmayacak çünkü vertical değil.

## Bu sana ne demek — 3 stratejik yol

**Yol 1: Zoho'yu rakip olarak görüp sıfırdan kur**
BAZ Export bunu yapıyor. Yıllarca sürer, milyonlarca dolar mühendislik yatırımı gerekir. CRM'i, sequence engine'i, analytics'i, mail infra'yı baştan yazıyorsun. Avantajı: tam kontrol, marka senin. Dezavantajı: Zoho 20 yıllık ürün, sen 6 ay sonra hala MVP'desin.

**Yol 2: Zoho'yu backend olarak kullan, üstüne vertical layer ekle**
Bu çok az konuşulan ama **çok mantıklı** seçenek. Sen sadece:
- İhracat veri katmanını (GTİP analizi, pazar zekası, alıcı veritabanı)
- Türkçe onboarding ve UX'i
- AI ürün analizi + ülke önerisi modülünü
yazarsın. Geri kalanı (CRM, e-posta, formlar, analytics) **Zoho API'leri** ile yapar. Sonuç: 3-4 ayda canlıya çıkarsın, müşterilerin Zoho One alır (sen affiliate komisyon da alırsın, Zoho'nun partner programı var).

**Yol 3: Vertical olarak agnostik kal, kullanıcı Zoho'su olanlara entegrasyon ver**
Hem kendi minimal CRM'ini yaz, hem Zoho/HubSpot/Pipedrive entegrasyonu koy. Müşteri zaten Zoho kullanıyorsa veri oraya akar.

## Zoho'dan öğreneceğin somut şeyler

Senin projeye direkt aktarabileceğin tasarım kararları:

- **Bundle pricing modeli**: 50 uygulama tek faturada → kullanıcı "ucuz" diye algılar. Sen 8 modülü tek pakette sat, $30-50/kullanıcı/ay sweet spot.
- **Free tier**: Zoho 3 kullanıcıya kadar ücretsiz CRM veriyor → adoption motor. Sen de "ilk 50 lead ücretsiz" gibi bir kanca koy.
- **Blueprint (stage-gating)**: BAZ'ın "7 adım"ı aslında bir Blueprint. Sen bunu daha katı kur — kullanıcı bir adımı atlayamasın, çünkü vertical SaaS'ın gücü "doğru yolu zorlamak".
- **Zia (AI assistant)**: Bir tane "İhracat Asistanı" karakteri yarat. Her ekranda "şimdi ne yapmalıyım?" diye sorabilsin. LLM çağrısı arkada.
- **Marketplace + entegrasyonlar**: Zoho'nun 5000+ entegrasyonu var. Sen Trendyol, e-Fatura, Ticaret Bakanlığı Kolay İhracat, KOSGEB API'leriyle başla.
- **Adoption metriği**: CRM kurulumlarının **%58'i kullanıcı benimsememesi yüzünden başarısız** (US Tech Automations raporu). Bu yüzden BAZ "kurulum karmaşası yok" diye bağırıyor. Senin onboarding'in 15 dakikadan uzun olmamalı.

## Net soru

Sana yol haritası çıkarmadan önce bir karar gerekiyor: **Zoho'yu rakip olarak mı, backend olarak mı görüyorsun?** Çünkü:

- Rakip ise: kendi CRM'ini, sequence engine'ini, analytics'ini yazman gerekecek (12-18 ay roadmap)
- Backend ise: Zoho API + Vapi (AI arama) + kendi vertical katmanın → 3-4 ayda canlı (bu rotayı kimse konuşmuyor ama bence en zekice olanı)

Hangisini düşünüyorsun? Bir de önemli bir veri: hedef müşterinin Zoho/HubSpot kullanma oranı ne tahmin ediyorsun? Çünkü Türk KOBİ'lerinin çoğu hâlâ Excel'de — bu da seninle BAZ'ın asıl rekabet ettiği şeyin **CRM yazılımı değil, Excel + Gmail** olduğu anlamına geliyor.