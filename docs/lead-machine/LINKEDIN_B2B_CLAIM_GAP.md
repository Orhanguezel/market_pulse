# "LinkedIn ile B2B Müşteri Bulma" İddiası — Karşılama Analizi & Eksik Backend

> Kaynak iddia: isletmeniyonet.com/hizmetler/linkedin-ile-b2b-musteri-bulma.php
> Soru: Bu iddiayı tam yapabiliyor muyuz? Eksik backend var mı?

## İddianın vaatleri
Hedef firma + kişi araştırması · satın alma müdürü / karar verici tespiti (purchasing/procurement/
import/supply chain/category/GM/business dev) · LinkedIn profil + Sales Navigator · bağlantı stratejisi ·
profesyonel mesaj şablonu · takip planı · CRM kayıt yapısı · konşimento + GTİP/HS + mail marketing entegrasyonu.
(NOT: kesin müşteri garantisi YOK — araştırma + iletişim + takip.)

## Vaat → mevcut yetenek haritası

| Vaat | Bizdeki backend | Durum |
|---|---|---|
| Hedef firma araştırması | Places API + customs lake (5.7M) + Europages (scraper) | ✅ |
| GTİP/HS + konşimento ile alıcı bulma | customs lake + lead-machine | ✅ |
| Karar verici/satınalma müdürü tespiti | **Apollo people-search** (yeni decision-maker modülü, domain+unvan) | 🟡 Apollo plan'a bağlı |
| Karar verici (web sitesi /team /about) | enrichment + **scraper-service** (regex isim/unvan) | ✅ (meşru OSINT) |
| LinkedIn profil URL | Apollo people-search döndürür | 🟡 Apollo plan |
| Sales Navigator / Google operatör asistanı | **search-hints** ucu (yeni) — operatör + LinkedIn arama URL | ✅ (yarı-manuel) |
| CRM kayıt yapısı | CRM modülü + lead→account/contact/deal convert | ✅ |
| Mail marketing entegrasyonu | outreach (bulk-list + AI draft) | ✅ |
| Bağlantı stratejisi + mesaj şablonu | outreach draft.service (AI, askBestAvailable) — **email odaklı** | 🟡 LinkedIn modu yok |
| Takip planı (sequence/cadence) | outreach campaigns | 🟡 LinkedIn sequence yok |
| Mevcut customs/GTİP firmasına karar verici ekleme (toplu) | enrichment tekil var; people-search **batch** yok | 🟡 |

## Cevap
**Çekirdeği yapabiliyoruz:** firma bulma (Places + customs/GTİP) + karar verici tespiti (Apollo people-search
+ website OSINT) + CRM kayıt + mail marketing + Google-operatör/LinkedIn arama asistanı. Yani iddianın
"araştırma + liste + CRM" omurgası HAZIR.

**Tam karşılamak için EKSİK backend (yazılacak):**

### ✅ Bu turda eklendi (Claude)
1. **Export/B2B unvan preset'i** (`EXPORT_B2B_TITLES`: purchasing/procurement/import/supply chain/category/
   buyer/foreign trade/GM/BD) — decision-maker finder artık ihracat alıcı firmaları için doğru unvanları arar.
2. **OSINT asistanı** `POST /lead-machine/decision-makers/search-hints` — firma+ülke → Google operatörleri
   (`site:linkedin.com/in "Purchasing Manager" "X"`) + LinkedIn arama URL + Sales Navigator notu (scrape YOK).

### 🔴 Codex'e (sertleştirme — CODEX_GOREV_DECISION_MAKER.md)
3. **Mevcut adaya karar verici ekleme (batch)** — lead_candidates (customs/GTİP firmaları) üzerinde
   Apollo people-search by domain+titles → her firmaya karar verici(ler) iliştir. (Şu an finder Places'tan başlıyor;
   ihracat iddiası için "elimdeki alıcı firmalara kişi bul" akışı gerek.)
4. **LinkedIn bağlantı + mesaj şablonu (AI)** — draft.service'i LinkedIn moduna genişlet: connection request +
   ilk mesaj + 2-3 adım takip metni, lead bazlı (askBestAvailable zaten var).
5. **Takip planı / sequence** — outreach'i çok adımlı LinkedIn cadence ile genişlet (gün-1 bağlantı, gün-3 mesaj…).

## Scraper-service rolü
- ✅ **Kullanıyoruz ve gerekli:** şirket web sitesi /team /about /impressum sayfalarından karar verici isim/unvan
  (enrichment.analyzeCompanyWebsite → scraper-service). Apollo veri veremezse bu OSINT yedeği devreye girer.
- ✅ Europages/dizin tarama (b2b directory).
- ❌ **LinkedIn doğrudan scrape ETMİYORUZ** (ToS + ban riski + kalite). LinkedIn tarafı: Apollo (lisanslı) +
  Google operatör/Sales Navigator (yarı-manuel doğrulama). Bu, iddianın "doğru, temiz, doğrulanmış" vaadiyle uyumlu.
- (Opsiyonel/riskli) Google SERP'i operatörle scraper'dan çekmek mümkün ama Google bot korumalı → manuel asistanı tercih.

## Sonuç
İddianın **araştırma + liste + CRM** kısmını bugün karşılıyoruz. **Tam paket** için kalan 3 backend işi
(batch karar-verici enrichment, LinkedIn AI mesaj şablonu, takip sequence) Codex'e bırakıldı; ikisi (unvan preset +
OSINT asistanı) bu turda eklendi. Apollo people-search plan erişimi netleşmeli (kişi/LinkedIn URL kalitesi ona bağlı).
