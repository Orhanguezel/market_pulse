Şimdi de özellikler ve fiyatlandırma sayfalarına bakalım — tam resmi görmek için.BAZ Export'u inceledim. Sana özet geçeyim, sonra senin tarafta neye odaklanacağına karar verelim.

## Ürün ne yapıyor

BAZ Export, Türkiye'deki B2B ihracatçılar için bir **"İhracat Operasyon İşletim Sistemi"** olarak konumlanmış bir SaaS. Klasik CRM değil — Apollo + Lemlist + bir pazar analiz aracı + AI cold call kombinasyonu gibi düşünebilirsin. Hedef kitle: ürünü olan ama dış pazara çıkmakta zorlanan üretici/KOBİ'ler.

Temel iş akışı 7 adım:

1. **Profil** — Web sitesi/katalog yükleniyor, AI ürünleri analiz edip 6 haneli GTİP kodu + sektör çıkarıyor
2. **Pazar** — Talep, rekabet, ithalat verisi karşılaştırılıp hedef ülke öneriliyor
3. **Hedefler (Lead Discovery)** — Hedef pazardaki firmalar bulunuyor, uygunluk skoru veriliyor, karar vericilerin LinkedIn + e-posta'sı çıkarılıyor
4. **İstatistik (Lead Scoring)** — Kim açtı/tıkladı/cevapladı → sıcak lead işaretleme
5. **Operasyon** — AI arama yapıp CRM'e kaydediyor, arama metinleri üretiyor
6. **Otomasyon** — Tanışma/Takip/Bilgi/Toplantı e-posta sequence'leri
7. **Rapor** — Açılma oranı, dönüşüm, toplantı sayısı vb.

İddia ettikleri sayı: 55.000+ "güvenilir alıcı" veritabanı.

## Site mimarisi (kopyalanabilir referans)

Marketing site şu sayfalardan oluşuyor:

- `/` (Anasayfa) — hero + problem (Excel kaos'u carousel) + 7 adım + çözüm haritası + kimler için + CTA
- `/nasil-calisir` — 7 adımı detaylı anlatan sayfa (senin baktığın)
- `/urun-ozellikleri` — modüller (8 özellik kartı)
- `/urun-hakkinda`
- `/kimler-icin`
- `/fiyatlandirma`
- `/yardim-merkezi`
- `/kaynaklar`, `/basari-hikayeleri`
- Hukuki: `/aydinlatma-metni`, `/gizlilik-politikasi`

## "Nasıl Çalışır" sayfasının yapısı

Hero: kısa slogan ("Hesap aç → Veriyi seç → Sistem çalışsın") + tek cümle vaat.

Sonra **"Kurulum Karmaşası Yok"** bölümü 5 madde halinde (self-servis, CRM entegrasyonu, SPF/DKIM yönlendirmeli, hesap açınca hazır).

Sonra 7 adım — her adım için:
- Adım numarası ("1 — Adım")
- Başlık ("Hesap Aç")
- 3-4 kısa cümle (her cümle ayrı satır, çok kısa — neredeyse haiku formatı)
- Bir screenshot

Sonra "Sistem arka planda çalışır" kapanış paragrafı + CTA ("Demo Randevusu Al").

## Tasarım/copywriting özellikleri

Bu kısım önemli, çünkü siteyi farklı kılan asıl şey burada:

- **Siyah arka plan** (`meta-theme-color: #000000`) — premium/teknik hissi
- **Çok kısa, kesik cümleler** — "Sistem çalışır." "Süreç hızlanır." "Operasyon ilerler." Bilinçli bir tonality, satış yazımı olarak güçlü
- **"Şu biter → Bu başlar" formülü** çok kullanılıyor: "Excel biter + sistem başlar", "Kişiye bağlı yapı biter → Ölçeklenebilir model oluşur"
- Hero'da animasyonlu/parçalı görseller (background.svg + center.png + input/output overlay'leri) — muhtemelen Framer Motion veya GSAP ile birleştirilmiş kompozit görsel
- Anasayfada bir **infinite carousel** var (sorunlar listesi tekrar ediyor)
- Adım kartları muhtemelen scroll-triggered animation ile geliyor

## Fullstack tarafında benim sana sorum

Bu site iki katmanlı bir iş aslında:

1. **Marketing/landing site** (statik, SEO, animasyon ağırlıklı) — Next.js + Tailwind + Framer Motion ile 1-2 haftada bitirilebilir
2. **Asıl SaaS platform** (hesap, ürün analizi AI'ı, lead discovery, e-posta sequence engine, CRM, raporlama) — bu çok daha büyük bir iş, aylar sürer

Sen hangisini yapacaksın — sadece tanıtım sitesi mi, yoksa platformun kendisi de mi? Bilirsem stack önerisi, sayfa şablonu ve hangi modülden başlanır onu çıkarayım.

Tamam, sana hem teknik olarak ne yapıldığını hem de pazardaki boşlukları geniş bir çerçevede özetleyeyim.

## BAZ Export aslında ne yapıyor (kategorik olarak)

Tek bir SaaS değil bu — **5 farklı SaaS kategorisini birleştiren bir "bundle"**. Her birinin global karşılığı var:

1. **B2B Contact Database / Prospecting** → Apollo.io (275M kişi), Cognism, ZoomInfo, Lusha. Karar verici + e-posta + LinkedIn bulma motoru.
2. **Cold Email Sequencer + Warmup** → Lemlist, Instantly, Saleshandy, Smartlead. Sequence builder, A/B test, SPF/DKIM yönetimi, inbox warmup.
3. **AI SDR / AI Voice Agent** → Retell AI, Vapi, Bland AI, Air.ai. Outbound aramalar yapan, CRM'e kayıt düşen ses ajanları. Bu pazar 2026'da **$4.12B**, 2030'da $15B+ olacak diyor sektör (Auto Interview AI raporu).
4. **Market Intelligence / Trade Data** → ITC TradeMap, TradeInt, Eximpedia, S&P Panjiva. Hangi ülke ne kadar ithal ediyor, GTİP bazında rekabet analizi.
5. **CRM / Pipeline Management** → HubSpot, Pipedrive. Lead'in soğuk→sıcak→toplantı→satış akışı.

BAZ'ın yaptığı şey bu beşini Türkiye ihracatçısına özel paketleyip "operasyon sistemi" olarak satmak. **Türkiye'deki KOBİ'nin Apollo + Lemlist + Vapi + TradeMap'i ayrı ayrı satın alıp entegre etmesi zaten gerçekçi değil** — hem fiyat, hem dil, hem teknik bilgi engeli var. Bu yüzden bundling yapan bir vertical SaaS mantıklı bir pozisyon.

## Türkiye'de rekabet manzarası

Birkaç farklı oyuncu var ama hiçbiri tam üst üste değil:

- **Kolay İhracat Platformu** (T.C. Ticaret Bakanlığı, ücretsiz) — Akıllı İhracat Robotu var, pazar analizi var, potansiyel ithalatçı bilgileri var. Ama **devlet ürünü**: outreach yok, sequence yok, AI arama yok. Sadece veri tarafı.
- **TurkishExporter, Alibaba Türkiye, MagnaDijital** — bunlar marketplace/listing yaklaşımı. Pasif: alıcı seni bulur.
- **BAZ Export gibi outbound-otomasyon yaklaşımı** — sen alıcıya saldıran, automated outbound makinesi kuran yerel oyuncu sayısı çok az. Asıl boşluk burada.

## Pazarın gerçek ihtiyaçları (araştırmadan çıkan)

Bunlar tek tek raporlanmış şeyler, hayali değil:

**Maliyet baskısı**: Bir insan SDR'ı Türkiye'de bile aylık $3K-10K maliyet, ramp-up süresi 5.7 ay. AI SDR aylık $500'dan başlıyor — **%83 düşüş**. Bu rakam KOBİ'ler için ciddi bir lever.

**Sinyal bazlı outreach**: Sektörün gittiği yön artık "10.000 cold email atalım" değil. Açtı/tıkladı/siteyi gezdi → 5 dakika içinde AI arama yapsın. Bu "signal-based outreach" %15-25 reply rate getiriyor, klasik cold email %3-5'te kalıyor.

**Deliverability**: SPF/DKIM/DMARC, inbox warmup, sender reputation — KOBİ'ler bunu bilmiyor. Lemlist'in Lemwarm'ı bunun üzerine kurulu bir feature. BAZ'ın sayfasında "SPF & DKIM ayarları yönlendirmeli yapılır" diye yazması tesadüf değil; bu en büyük teknik engel.

**Veri kalitesi**: Apollo'nun bile bounce rate problemi var. Türkiye → AB/Orta Doğu/Afrika ekseninde "doğru karar verici e-postası" bulmak için **waterfall enrichment** (Hunter + Apollo + LinkedIn Sales Nav + Dropcontact gibi çoklu kaynak) kullanmak gerekiyor.

**Türk KOBİ'sinin spesifik durumu**: TL volatilitesi var, USD-bazlı borç var, uzun vadeli finansmana ulaşım zor (Trade.gov raporu). Bu yüzden ihracat hayati önemde ama içeride dijital olgunluk düşük. KOSGEB, Türk Eximbank, Ticaret Bakanlığı destekleri var — entegrasyon noktası olabilir.

## Bu projede teknik olarak inşa edilen modüller

Eğer BAZ'ın yaptığını sıfırdan kuracaksan, mimari olarak şu alt sistemleri yazman gerekecek:

1. **Web scraper + product analyzer** — Müşterinin sitesini crawl et, ürün kataloğunu çıkar, LLM ile GTİP/HS kodu sınıflandır.
2. **Market intelligence engine** — UN Comtrade / TradeMap API'leri ile ülke-sektör eşleştirmesi.
3. **Lead discovery pipeline** — LinkedIn Sales Navigator scraping, Apollo/Hunter API'leri, e-posta enrichment waterfall'u.
4. **Email infra** — Multiple sending domains, warmup pool, SPF/DKIM otomatik kurulum (DNS API'leri), bounce/spam tracking, sequence engine.
5. **AI voice agent** — Vapi veya Retell üzerine bina edilir genellikle. Türkçe/İngilizce TTS+STT (ElevenLabs, Deepgram), Twilio/Vonage telefon hattı.
6. **CRM çekirdeği** — pipeline, notlar, görev atama, lead scoring (davranışsal: açma/tıklama/cevap).
7. **Analytics & reporting** — kohort analizi, dönüşüm hunisi, channel ROI.
8. **Marketing site** (kopyaladığın BAZ tarzı) — Next.js + animasyonlu hero.

## Senin için en kritik soru

Bu işin asıl maliyeti **veri** ve **e-posta altyapısı**. Yazılımı yazmak 3-6 ay, ama:

- Apollo seviyesinde global karar verici veritabanı kuramazsın → 3rd party API'lere bağımlı olursun (maliyet: lead başına $0.10-0.50)
- E-posta deliverability için sending domain'ler + IP warming → aylar süren ısıtma süreci
- AI arama dakika başına $0.13-0.31 maliyet (Vapi/Retell üstünden)

Yani **gerçek soru**: sen bu projeyi
- (a) Sıfırdan kendi yazılımını yazıp altyapıyı kuracak mısın (1+ yıl, ciddi sermaye),
- (b) Mevcut API'leri orkestre eden bir "wrapper SaaS" mi kuracaksın (3-6 ay, daha az risk),
- (c) Yoksa sadece BAZ tarzı bir marketing site + waitlist + manuel servis mi başlatacaksın (1 ay, MVP)?

Bunlardan hangisi seninkine yakın? Ona göre stack önereyim ve hangi modülden başlanır onu çıkaralım. Bir de varsa: hedef sektör (textil, makine, gıda, mobilya) ve hedef coğrafya (AB, Körfez, Afrika, ABD) — BAZ "her sektör" diyor ama sen başlangıçta odaklanırsan çok daha hızlı yol alırsın.

