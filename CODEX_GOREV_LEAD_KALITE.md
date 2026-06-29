# Codex Görevi — Lead Kalitesi (ICP scoring + enrichment + Growtech extractor)

**Tarih:** 2026-06-05
**Bağlam:** Faz 7 SaaS çok-tenant + izole scraper canlıda çalışıyor (market.tarvista.com, tenant `vistaseeds`).
Pipeline mekanik olarak uçtan uca çalışıyor AMA üretilen lead'lerin KALİTESİ düşük. Bu görev onu düzeltir.
**Öncelik:** Sıra önemli değil; 3 bağımsız iş. Branch: `feat/tenant-config-core`.

---

## Bugünkü canlı test bulguları (kanıt)
vistaseeds ICP'siyle (biber/sebze tohumu alıcısı, id `9393730e-...`) B2B taramalar çalıştırıldı:
- **Europages** kaynağı çalışıyor → gerçek firma candidate üretiyor (ama gürültülü: genel agri/gıda).
- **Google Maps** (yerel TR) datacenter IP'ye bot/consent engeli → proxy yok, 0 sonuç. (Oxylabs sonra eklenecek — Codex'in işi DEĞİL, ama enrichment proxy destekli olmalı.)
- **TOBB** kaynağı 0 ayrıştırdı.
- **Growtech fuar** (statik sayfa + widget) → 0; modern JS widget, generic extractor ayrıştıramıyor.
- **ICP skoru DÜZ 7.0** — tüm candidate'lar aynı skoru aldı (ayırt etmiyor). Website'ler gerçek firma sitesi değil `europages.co.uk/...` profil linki; country/description boş.

---

## İŞ 1 — ICP matcher neden düz 7.0 veriyor? (en kritik)
**Belirti:** vistaseeds candidate'larının hepsi `lead_score = 7.0`. ICP ayırt etmiyor.

**Nerede bak:**
- `backend/src/modules/lead-machine/b2b/icp.matcher.ts` — `matchesIcp(lead, icp)`: sector/geography/firm_type eşleşmesi + skor.
- `backend/src/modules/lead-machine/b2b/b2b.job.ts` — candidate'lara skor nasıl yazılıyor, hangi ICP yükleniyor.
- Geçmiş commit `066d1ff`: "directory hits get a 5.0 floor score" → muhtemelen bir **taban/floor** skoru var; candidate'larda veri (country/description/sector) olmadığı için herkes floor/sabit skora düşüyor.

**Yapılacak:**
- [x] Doğrula: scoring sırasında AKTİF tenant'ın ICP'si (vistaseeds, biber sektörleri) gerçekten yükleniyor mu — yoksa default/avrasya mı? (runtime tenant context + getActiveTenantKey ile.)
- [x] Candidate'ın elindeki sinyalleri kullan: en azından **firma adı + (varsa) açıklama** ICP `sectors`/`keywords` (çok dilli) ile eşleştir; eşleşme yoksa skoru DÜŞÜR (floor'a yapışmasın).
- [x] `priority_crop`/`priority_sectors` (biber) ve `priority_geographies` (TR) bonuslarını uygula; `exclude_sectors` (baharat/gıda biberi → culinary) negatif sinyal olsun.
- [x] Skor dağılımı anlamlı olmalı (hepsi 7.0 değil). Test: farklı candidate'lar farklı skor.

**Codex durum (2026-06-29):** `icp.matcher.ts` çok dilli keyword / priority crop-sector / culinary pepper negatif sinyallerini kullanıyor. `b2b.job.ts` directory floor'u düşürüyor ve website analizini ICP gate öncesine alıyor. Odak testleri eklendi/geçti.

**Kabul:** vistaseeds candidate'larında lead_score dağılır; biber/tohum sinyali olanlar yüksek, alakasız (baharat/genel ticaret) düşük.

---

## İŞ 2 — Enrichment: gerçek firma sitesini çöz + analiz et + skoru besle
**Belirti:** Europages candidate'larının `website`'i gerçek firma sitesi değil, `europages.co.uk/...` profil linki. country/description boş → ICP matcher skorlayamıyor.

**Nerede bak:**
- `backend/src/modules/lead-machine/b2b/directory.scraper.ts` — `searchDirectory`: `c.website` europages profil URL'si dönüyor (gerçek site değil).
- `backend/src/modules/lead-machine/b2b/website.analyzer.ts` + `enrichment/enrichment.service.ts` — firma sitesi analizi (AI summary, sells, pain_points).
- scraper-service extractor'ları: `services/scraper-service/src/engine/extractors.py` (profile `directory-listing`).

**Yapılacak:**
- [x] Europages profil linkinden **gerçek firma web sitesini** çöz (profil sayfasını fetch et → outbound "visit website" linkini al), VEYA `directory-listing` extractor'ı gerçek site + ülke + sektör döndürsün.
- [x] Gerçek siteyi scrape + analiz et (website.analyzer): firma ne satıyor (tohum mu? biber mi? distribütör mü?), ülke, ürün anahtar kelimeleri → candidate alanlarını (country, description/ai_summary, sells) doldur.
- [x] Bu zenginleştirilmiş veriyi **İŞ 1'deki ICP matcher'a** besle → skor anlamlı farklılaşsın.
- [x] Robustluk: proxy desteği (env `OXYLABS_USERNAME/PASSWORD`, scraper `FAIR_PROXY_URL`/`PLACES_PROXY_URL`) varsa kullan; yoksa graceful degrade.

**Codex durum (2026-06-29):** `directory-listing` Europages kartlarında profil linkini `source_url`, Europages dışı outbound domaini `website` yapıyor; email/description korunuyor. B2B job gerçek `lead.website` için `website.analyzer` sonucunu ICP matcher'a besliyor. `PLACES_PROXY_URL` zaten Google Maps route/worker akışında kullanılıyor; `FAIR_PROXY_URL` artık fair scrape profillerinde env boşsa no-op, doluysa proxy olarak uygulanıyor. Oxylabs hesap/env kurulumu Orhan bağımlılığı.

**Kabul:** Europages candidate'larında `website` gerçek domain, `country`/`ai_summary` dolu; ICP skoru bu veriyle hesaplanıyor.

---

## İŞ 3 — Growtech / Informa widget exhibitor extractor
**Belirti:** Growtech katılımcı listesi Informa'nın `visit.growtech.com.tr` JS widget'ında (infinite-scroll). Statik sayfa ve widget URL'i ile fuar taraması 0 döndü; generic `fair-exhibitor` extractor ayrıştıramıyor.

**Referans URL'ler:**
- Statik (iframe): `https://www.growtech.com.tr/en/visitor/exhibitor-list.html`
- Widget: `https://visit.growtech.com.tr/widget/event/growtech-antalya-2025/exhibitors/RXZlbnRWaWV3XzEyMDk1Mjk=?paginationMode=infinite&lng=tr-TR`

**Nerede bak:**
- `backend/src/modules/lead-machine/fair/fair.scraper.ts` — `scrapeOfficialExhibitorList`: `isMesseFrankfurtUrl` → Messe API; else generic `scrape(profile:'fair-exhibitor')`.
- scraper-service `fair-exhibitor` extractor.

**Yapılacak:**
- [x] Widget'ın **altındaki JSON API'sini** bul (infinite-scroll exhibitor'ları XHR ile yüklüyor — network inspect / widget'ın `/api/.../exhibitors?page=` endpoint'i). Informa "visit" platformu genelde JSON döner.
- [x] `fair.scraper.ts`'e `isInformaVisitWidgetUrl()` branch ekle → JSON API'yi sayfalayarak çek (name, website, country, booth, description, product_groups).
- [x] Generic JS fuarlar için fallback: scraper-service'te 'fair-exhibitor' extractor'ı infinite-scroll + render destekli yap (scroll-to-load), VEYA Informa widget'ına özel handler.

**Codex durum (2026-06-29):** Growtech widget HTML'inde `__NEXT_DATA__` / Apollo state içinde `Core_Exhibitor` kayıtları bulundu. `fair.scraper.ts` özel Informa/Swapcard branch'i bu embedded state'i okuyup name, website, country/city, booth, description, product_groups alanlarına normalize ediyor.
Canlı smoke: Growtech widget URL'i `maxExhibitors=3` ile 3 kayıt döndürdü; booth ve açıklamadan çıkarılan `product_groups` dolu (`2MBIO CO.,LTD` → `Plant nutrition`, `Crop protection`; `A.O. SMITH...` → `Water technologies`; `ABAXTON` → `Plant nutrition`, `Agronutrition`).

**Kabul:** Growtech widget URL'i ile fuar taraması exhibitor (tohum/sera/agri firmaları) döndürüyor; candidate'lar oluşuyor.

---

## Doğrulama (genel)
- [x] `cd backend && bun run build && bun run tenant:guard && bun test`
- [x] `cd services/scraper-service && python -m pytest` (varsa)
- [ ] Canlı kanıt: vistaseeds taramasında skor dağılımı + zengin candidate + Growtech exhibitor.

**Codex durum (2026-06-29):** Backend tam doğrulama geçti: `bun run build && bun run tenant:guard && bun test` (229 test). Scraper-service için izole `.venv` kuruldu ve `.venv/bin/python -m pytest` geçti (40 test). Odak backend Lead Quality testleri tekrar geçti (35 test).
Canlı Growtech read-only smoke geçti; vistaseeds DB job koşusu için canlı backend/login ve tenant verisi gerekiyor.

## Bağımlılık (Codex'in işi DEĞİL — Orhan)
- **Oxylabs proxy** hesabı → yerel TR Google Maps + sağlam enrichment için. Eklenince env'e girilecek (`OXYLABS_USERNAME/PASSWORD`, scraper `PLACES_PROXY_URL`/`FAIR_PROXY_URL`).

## Canlı ortam notları
- Scraper: vps-vistainsaat, izole Docker (`/var/www/market_pulse/services/scraper-service`, `docker-compose.vistainsaat.yml`, RAM-sınırlı). Backend `SCRAPER_SERVICE_URL=http://127.0.0.1:8200`.
- Test için: `POST /api/v1/admin/lead-machine/b2b/jobs` ve `/fair/jobs`, header `X-Tenant: vistaseeds`, login `orhanguzell@gmail.com`.
