# Avrasya Görüşmesi — Soru Listesi & Statik Veri Toplama Formu

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 0 hazırlık — ilk Avrasya görüşmesi)
> **Hedef okuyucu:** Orhan / Claude (görüşmeyi yapan) + Avrasya export ekibi (cevaplayan)
> **Bağlı çeklist:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 0 ICP onaylama + tüm template placeholder'ları
> **Tahmini görüşme süresi:** 60-90 dk (ya tek seferde, ya iki ayrı oturumda)

---

## Görüşme niye gerekli

Sistem büyük ölçüde **Claude'un varsayımları + master plan + Avrasya public datası + Paspas ERP verisi** ile kuruldu. Ama 4 belge **Avrasya statikleri** ile dolu olmadan yayına gidemez:

1. [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md) — 6 mail şablonu
2. [automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md) — 5 sequence × 3 dil
3. [../teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md) — her aday için kart
4. [../teknik/icp-automechanika-final.md](../teknik/icp-automechanika-final.md) — v2 onayı

Bu görüşme bu **dört belgeye gerçek veri akıtır**. Tek oturumla bitsin diye soru listesi 9 başlık altında gruplandı.

---

## 🔄 GÜNCELLEME — 2026-05-21

Web sitesi (promats.com.tr) + Paspas ERP'den **birçok statik önceden çıkarıldı**. Konsolide tablo: **[avrasya-statikleri-konsolide.md](avrasya-statikleri-konsolide.md)**.

Aşağıdaki sorularda:
- 🟢 = Yanıt **bilinen** (sadece görüşmede teyit/onay)
- 🟡 = Yanıt **kısmen bilinen** (web/ERP'den çıkarıldı ama doğrulanmalı)
- 🔴 = Yanıt **bilinmeyen** (görüşmede ilk kez sorulacak)

Görüşmede odak: 🔴 işaretli sorular + 🟡'ların teyidi. 🟢'lar 5 dk içinde onaylanır.

---

## A — Şirket & Kapasite (15 dk)

### A1. Kuruluş yılı 🟢
> "Avrasya 2017'de kurulmuş — web sitenize göre. Promats markası da aynı yıl mı çıktı?"

Kullanım: `{kurulus_yili}` placeholder — uzun varyant outreach maillerinde.

**Cevap (web'den):** **2017** ✓ (sadece marka tarihi teyidi)

---

### A2. Yıllık üretim kapasitesi 🟡
> "ERP'de 2× 900 ton Haitian Ma plastik enjeksiyon + 1× PVC ekstrüzyon hattı (150/saat) görüyoruz, üçü de 24 saat çalışıyor. Yıllık paspas seti olarak teorik kapasiteniz ne — 1 milyon set civarı doğru mu? Gerçek üretim hangi yüzdede?"

Kullanım: `{uretim_kapasitesi}` placeholder — mail maillerinde "1.000.000+ adet" gibi.

**ERP'den hesaplanan:** ~1.080.000 birim/yıl (PVC ekstrüzyon)
**Görüşmede teyit:**
- **Kurulu kapasite (set):** _____________ adet
- **Gerçek üretim:** _____________ adet
- **Birim ölçüsü:** set mi, parça mı, kg mı?

**Kalibrasyon notu:** Maillerde **kurulu kapasiteyi** kullan (büyük rakam etkili)

---

### A3. SKU sayısı 🟡
> "ERP'den 161 paspas SKU + 8 ürün serisi görüyoruz (Başak Plus, Orbital, Pars, Icon, Star Plus, Maximum, Profesyonel, Tuna). Bu SKU'ların yaklaşık dağılımı ne?"

Kullanım: `{sku_sayisi}` + uzun varyant arguments.

**ERP'den:** 161 paspas SKU (424 toplam aktif ürün, kalan ham madde / ambalaj)
**Görüşmede teyit:**
- Universal: ___ (ana hat — Başak/Orbital/Pars/Icon/Star/Maximum/Profesyonel)
- Vehicle-specific (Renault Clio/Sandero/Duster/Megane): ___
- Premium / TPE varyant: ___

---

### A4. Çalışan sayısı
> "Toplam çalışan + export ekibi büyüklüğü?"

Kullanım: Avrasya hikaye anlatımı (mail veya stand görüşmesinde).

**Toplam çalışan:** _____________
**Export ekibi:** _____________ kişi

---

### A5. Sertifikalar
> "Hangi sertifikalarınız var? (ISO 9001, IATF 16949, TÜV, REACH, REACH SVHC, EuroNCAP, vs.)"

Kullanım: `{sertifikalar}` — uzun varyant + stand brifing § extra arg.

**Sertifikalar (CSV):** _____________________

---

## B — Ürün Detayları (15 dk)

### B1. Popüler araç model kalıpları 🟡
> "ERP'de 42 kalıp tespit ettik, çoğu Renault modeli (Clio, Sandero, Duster Full/Mild, Megane). AB pazarında özellikle hangileri talep görüyor? Henüz kalıp yapmadığınız ama 2027'de eklemek istediğiniz model var mı?"

Kullanım: `{populer_arac_modelleri}` — uzun varyant outreach.

**ERP'den çıkarılan (alfabetik):**
1. Clio (Renault)
2. Sandero (Renault) — Clio kalıbıyla aynı seri
3. Duster Full (Renault)
4. Duster Mild (Renault)
5. Megane (Renault)
6. + Avrasya'nın kendi universal serileri: Başak Plus, Orbital, Pars, Icon, Star Plus, Maximum, Profesyonel, Tuna, Vector, Modern, Premium, Yeni Nesil

**Görüşmede teyit:**
- AB pazarında en çok talep gören: _____
- 2027'de eklenecek model: _____ (Codex'in scoring'inde +sinyal olur)
- VW Golf, BMW 3, Mercedes C ile uyumlu kalıp var mı? (Yoksa fırsat alanı)

---

### B2. Yeni kalıp talep süresi
> "Yeni bir araç modeli için kalıp talebi geldiğinde — örneğin BMW iX5 — siparişten ürüne kaç hafta?"

Kullanım: Stand görüşmesi + e-mail uzun varyant ("8-12 hafta").

**Cevap:** _____________________ hafta

---

### B3. Malzeme çeşitleri 🟡
> "Web sitenizden PVC ana malzeme + 3D/4D bariyerli tasarım görüyoruz (Profesyonel serisi 4.5 cm bariyer). TPE, kauçuk veya halı varyantınız var mı? ERP'de 'PVC Film' yarı mamulü görüyoruz."

Kullanım: ICP `sectors` ile cross-reference + outreach mesajı.

**Web'den onaylı:** PVC, 3D/4D bariyerli
**Görüşmede teyit:**
- TPE seriniz var mı?
- Kauçuk paspas?
- Halı tip (carpet mats)?
- Sadece paspas mı yoksa boot liner (bagaj örtüsü) da var mı?

---

### B4. Private label / ODM kapasitesi
> "Private label nasıl çalışıyor — kendi marka adı + ambalaj + barcode? ODM (Original Design Manufacturing) yapıyor musunuz, yani müşterinin tasarımına göre üretim?"

Kullanım: K-5 onaylama + ICP `positive_signals` doğrulama.

**Private label:**
- [ ] Kendi marka adı
- [ ] Özel ambalaj
- [ ] Özel barcode
- [ ] ASIN-ready imagery (Amazon FBA için)
- [ ] Diğer: _________

**ODM (özel tasarım):**
- [ ] Müşteri kalıbı kabul ediyoruz
- [ ] Sadece mevcut kalıplarda renk/logo değişikliği
- [ ] Yapmıyoruz

---

## C — Fiyatlandırma & MOQ (10 dk)

### C1. MOQ minimum
> "SKU başına minimum sipariş adediniz nedir? Mix SKU yaparak toplamda kaç adetten başlar?"

Kullanım: `{moq_min}` — outreach mailde "MOQ from {moq_min} units per SKU".

**SKU başına MOQ:** _____________ adet
**Mixed toplam MOQ:** _____________ adet
**Customization farkı:** _____________

---

### C2. Volume tier'lar
> "Sipariş hacmine göre kademe ne — örneğin 1K / 5K / 10K SKU başına nasıl bir fiyat farkı çıkar?"

Kullanım: Sequence C teklif maili — `{fiyat_format}` ve attached quote.

**1K SKU başına:** _____________ EUR
**5K SKU başına:** _____________ EUR
**10K SKU başına:** _____________ EUR

(Yaklaşık değerler kabul — gerçek teklif RFQ aşamasında detaylanır)

---

### C3. Para birimi tercihi
> "Müşterilere EUR mu USD mu fiyat veriyorsunuz? AB'deki fiyatlama mantığı?"

Kullanım: Sequence C — `{currency}` placeholder + KDV/IDV uyumu.

**Tercih edilen para:** _____________

---

### C4. Ödeme vadesi
> "İlk siparişler için tipik ödeme şartınız nedir? L/C yapıyor musunuz?"

Kullanım: Sequence C — `{payment_terms}`.

**Standart ödeme:** _____________
**L/C kabul:** [ ] Evet (ilk sipariş için) [ ] Hayır

---

## D — Lojistik (10 dk)

### D1. Teslimat süresi
> "Standart SKU'lar için sipariş onayından sevkiyata kaç gün? Custom kalıp varsa?"

Kullanım: Tüm outreach maillerinde "from 14 days delivery" — bu rakam doğru mu?

**Standart:** _____________ gün
**Custom kalıp:** _____________ hafta

---

### D2. Mevcut referans pazarlar 🟡
> "Web sitenizde 35+ ülke yazıyor, hakkimizda'da ~20 ülke geçiyor. Farkı netleştirir misiniz — direkt sevkiyat vs dolaylı kanal? K-1 pilot pazarımız DE, AT, NL, PL, FR. ERP'de 28 aktif müşteri görüyoruz — kaç tanesi AB'de?"

Kullanım: `{referans_ulkeler}` — outreach mailde "we already supply distributors in {Almanya, Rusya, ABD, Bulgaristan...}".

**Web'den onaylı pazarlar (ana sayfa):** Rusya, Almanya, ABD, Irak, Mısır, Beyaz Rusya, Bolivya, Bulgaristan + 27 ülke daha (toplam 35+)

**Görüşmede teyit:**
- 35+ vs ~20: hangisi direkt sevkiyat?
- Almanya'da aktif bayi var mı (varsa kim, mention edilebilir mi)?
- AT/NL/PL/FR'de bayi/distribütör var mı? Yoksa fırsat alanı
- En büyük 3 müşteriniz (anonim olarak): _____, _____, _____

---

### D3. Incoterms tercihi
> "Genelde hangi Incoterms ile çalışıyorsunuz? FCA Istanbul mı, CIF mi, DAP mı?"

Kullanım: Sequence C — quote sheet'te.

**Standart Incoterms:** _____________
**Esnekliğiniz var mı:** _____________

---

### D4. Lojistik partner
> "AB içine sevkiyat hangi kamyoncu/lojistik firmasıyla? Avantajınız ne (örn. kendi konsolidasyon hub'ı varsa)?"

Kullanım: Stand görüşmesi + uzun varyant.

**Lojistik partner:** _____________

---

## E — Numune & Bedava Paket (5 dk)

### E1. Numune politikası
> "Numune politikanız ne? Ücretsiz veriyor musunuz? Hangi miktara kadar?"

Kullanım: `{numune_kapsam}` + `{free_sample_value}` — Sequence A.

**Ücretsiz numune:**
- [ ] Var, _____ adet/_____ EUR'a kadar
- [ ] Yok, ödenecek
- [ ] İlk sipariş öncesi ücretsiz, sonra ödenir

**Numune kargo:**
- [ ] Avrasya ödüyor
- [ ] Müşteri ödüyor
- [ ] 100 EUR'a kadar Avrasya, sonra müşteri

---

## F — Hedef Müşteri & Pazar (10 dk)

### F1. K-1 onayı — pilot pazarlar
> "Plan 5 ülke: Almanya, Avusturya, Hollanda, Polonya, Fransa. Sizin için bu sıralama doğru mu? Ekleyeceğiniz / çıkaracağınız?"

Kullanım: ICP v2 `priority_geographies` doğrulama.

**Onay:** [ ] 5 ülke doğru
**Değişiklik:** _________________

---

### F2. Hedef revenue tier
> "ICP draft'ta yıllık 500K EUR+ ciro distribütörler dedik. Sizin için bu eşik mantıklı mı, yoksa 1M+ veya 250K+ daha mantıklı?"

Kullanım: ICP v2 `annual_revenue_min_eur`.

**Cevap:** _____________ EUR

---

### F3. Çinli rakip nasıl konumlandırılır?
> "Outreach mailde Çinli üreticilere karşı pozisyonumuzu nasıl koymalı — agresif (kalitesiz) mi, nezaketli (alternatif) mi?"

Kullanım: Tüm template'lerin tone'unu kalibre.

**Tercih:** [ ] Nezaketli  [ ] Direkt karşılaştırma  [ ] Hiç değinme

---

### F4. K-5 — ürün kapsamı onayı
> "Floor mat önceliği doğru. Aday firma boot liner satıyorsa onu da hedef sayalım mı, yoksa sadece paspas mı?"

Kullanım: ICP v2 `sectors` daraltma.

**Cevap:** _________________

---

## G — Onay Paneli & İletişim Hattı (10 dk)

### G1. K-3 — onay paneli kullanıcısı
> "Hangi kişiniz günde 30 dk aday review için panel kullanacak? Tek kişi mi, yedek var mı?"

**Asıl kullanıcı:** _________ (isim) _________ (rol)
**Yedek:** _________

---

### G2. Mail gönderici imza sahibi 🔴
> "Mailleri kim adına gönderelim — `info@promats.com.tr`'den gidecek ama imza altında 'Ahmet Yılmaz, Export Manager' gibi gerçek bir isim olmalı. Reply-to olarak `info@avrasyaotomotiv.net` mi yoksa `info@promats.com.tr` mi tercih edersiniz (Automechanika exhibitor sayfanızda `info@avrasyaotomotiv.net` görünüyor)?"

Kullanım: `{gonderici_ad_soyad}` — tüm outreach + follow-up mailleri.

**Bilinen iletişim noktaları (web + Automechanika):**
- Ofis tel: +90 (212) 485 75 70
- GSM (Automechanika'da): +90 539 860 75 80
- Mail (web): `info@promats.com.tr`
- Mail (Automechanika): `info@avrasyaotomotiv.net`

**Görüşmede netleş:**
- **İsim:** _________ (gerçek kişi adı)
- **Pozisyon:** _________ (Export Manager / İhracat Müdürü?)
- **Reply-to tercihi:** [ ] info@promats.com.tr [ ] info@avrasyaotomotiv.net [ ] Yeni adres
- **LinkedIn URL (varsa):** _________

---

### G3. Mail trafiği günlük limit
> "Günde maksimum kaç mail gönderelim? Spam algoritmaları için 'warmup' sürecimiz gerekli, ilk hafta günde 5-10, sonra 20-30."

Kullanım: Sprint 3 outreach hız ayarı.

**İlk hafta limit:** _________ /gün
**Steady-state:** _________ /gün

---

### G4. Acil iletişim
> "Fuar haftası 7/24 ulaşabileceğimiz kişi? WhatsApp grubu kuralım mı?"

**WhatsApp:** _________
**Acil mail:** _________

---

## H — Bütçe Doğrulama (5 dk)

### H1. K-4 onayı — toplam $300 bütçe
> "Plan: 4 ay × $75 = $300 toplam. Apollo + GPT + Postmark. Fatura kim ödüyor — Paspas mı, Avrasya mı, biz mi?"

**Onay:** [ ] $300 toplam, Paspas ödüyor
**Değişiklik:** _________________

---

### H2. Apollo hesabı kim açıyor
> "Apollo.io hesabı sizin adınıza mı, bizim adımıza mı?"

**Açan:** _________

---

### H3. Postmark hesabı
> "info@promats.com.tr domain'i Postmark'a verified sender olarak eklenecek. Bu Avrasya BT'sinin onayı gerektirir mi?"

**Cevap:** _________

---

## I — Hukuki & Compliance (5 dk)

### I1. GDPR
> "Avrasya'nın hukuk danışmanı outreach kampanyamızda B2B legitimate interest kullanımına onay veriyor mu? Liste içinde Almanya'da bireysel kişi maili olabilir."

**Onay:** [ ] Verildi  [ ] İncelenecek  [ ] Hayır

---

### I2. KVKK
> "Türkiye'den AB'ye outbound mail KVKK Madde 28 dışında (B2B). Avrasya hukukçusu bu yorumla aynı fikirde mi?"

**Cevap:** _____________________

---

### I3. CRM aktarım
> "Onaylanan adaylar ve görüşmeler Avrasya'nın mevcut CRM'sine sonradan aktarılabilir. CRM hangi yazılım?"

**CRM:** _____________________

---

## Görüşme Sonrası Aksiyonlar (Claude yapacak)

Tüm cevaplar toplandıktan sonra Claude şunları günceller:

- [ ] [icp-automechanika-final.md](../teknik/icp-automechanika-final.md) → **v2** sürümü (F1, F2, F3, F4 cevaplarına göre)
- [ ] [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md) → "Placeholder Sözlüğü" tablosuna **kalan 🔴 statikler** (MOQ, sertifika, gönderici adı/pozisyonu, ücretsiz numune politikası, ödeme şartları)
- [ ] [automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md) → Sequence C için fiyat statiklerini yansıt
- [ ] [../teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md) → §4 ekstra argümanlar tablosunu **gerçek verilerle** güncelle (kurulus_yili=2017, populer_arac_modelleri=Renault Clio/Sandero/Duster/Megane vs.)
- [ ] [avrasya-paspas-automechanika.md](avrasya-paspas-automechanika.md) → "Doğrulanacak" tablosundaki tüm kalan satırlar artık doğrulanmış olur
- [ ] [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 0 "Avrasya export sorumlusunun kimliğini netleştir" kapatılır
- [ ] [promats-avrasyaotomotiv-mail-auth-v2.md](promats-avrasyaotomotiv-mail-auth-v2.md) → K-2 hibrit gönderici kararı onaylanır + DMARC ekleme talebi Avrasya BT'sine gönderilir
- [x] [avrasya-statikleri-konsolide.md](avrasya-statikleri-konsolide.md) → **2026-05-21'de oluşturuldu, görüşme öncesi ön referans**

Bunlar ortalama 2 saat sürer. Görüşme + güncelleme = **toplam yarım gün**.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 👤 Müşteri ana dosyası: [avrasya-paspas-automechanika.md](avrasya-paspas-automechanika.md)
- 🎯 ICP: [../teknik/icp-automechanika-final.md](../teknik/icp-automechanika-final.md)
- ✉️ Outreach: [automechanika-2026-outreach-templates.md](automechanika-2026-outreach-templates.md)
- 🔄 Follow-up: [automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md)
- 🃏 Stand brifing: [../teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md)
- 📧 Mail auth: [promats-email-auth-durumu.md](promats-email-auth-durumu.md)
