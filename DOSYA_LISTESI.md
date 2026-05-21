# Market Pulse — Dosya Envanteri

> **Son güncelleme:** 2026-05-21
> **Amaç:** Avrasya / Automechanika 2026 pilotu için üretilen tüm belge, veri ve script'in tek bakışta envanteri. İleride proje dokümantasyonu yazılırken bu dosya referans alınır.

---

## 1. Kök Dizin — Stratejik Kontrol Dosyaları

| Dosya | İçerik | Durum |
|---|---|---|
| [README.md](README.md) | Proje girişi, repo yapısı, kurulum, 4-araç orkestrasyonu | Aktif |
| [AUTOMECHANIKA_2026_CEKLIST.md](AUTOMECHANIKA_2026_CEKLIST.md) | Fuar pilotu ana çeklist (Codex + Claude iş bölümlü, 6 sprint) | Aktif — %84 tamam |
| [PROJE_DURUM_PANOSU.md](PROJE_DURUM_PANOSU.md) | 3 çeklistin tek bakışta progress'i + K-tablosu + risk izleme | Aktif |
| [DOSYA_LISTESI.md](DOSYA_LISTESI.md) | Bu envanter | Aktif |

---

## 2. Stratejik Belgeler — `docs/strateji/`

| Dosya | İçerik |
|---|---|
| [MARKET_PULSE_SAAS_PLANI.md](docs/strateji/MARKET_PULSE_SAAS_PLANI.md) | Genel SaaS master planı — modüler mimari, fiyatlandırma, 6 ay roadmap |
| [AUTOMECHANIKA_2026_PLANI.md](docs/strateji/AUTOMECHANIKA_2026_PLANI.md) | Fuar stratejisi — sinyal katmanları, zaman çizelgesi |
| [sonraki-fuarlar-karar-belgesi.md](docs/strateji/sonraki-fuarlar-karar-belgesi.md) | Reifen Essen / Equip Auto Paris / Automechanika Istanbul karşılaştırma + Türk KOBİ pazar paketi |
| [GENISLEME_PLANI.md](docs/strateji/GENISLEME_PLANI.md) | Eski Amazon-only plan (arşiv referansı) |

---

## 3. Müşteri Dosyaları — `docs/musteri/`

### Avrasya Pilotu

| Dosya | İçerik | Türü |
|---|---|---|
| [avrasya-paspas-automechanika.md](docs/musteri/avrasya-paspas-automechanika.md) | Müşteri ana dosyası — Avrasya public bilgisi, örnek aday şeması | Bilgi |
| [AVRASYA_SORULAR.md](docs/musteri/AVRASYA_SORULAR.md) + [.pdf](docs/musteri/AVRASYA_SORULAR.pdf) | **5 soru onay dosyası** — 15-20 dk telefon (sadeleştirilmiş) | Aksiyon |
| [avrasya-gorusme-soru-listesi.md](docs/musteri/avrasya-gorusme-soru-listesi.md) | Eski uzun versiyon (60-90 dk, over-engineered) | Tarihsel |
| [avrasya-statikleri-konsolide.md](docs/musteri/avrasya-statikleri-konsolide.md) | promats.com.tr + Paspas ERP'den toplanmış statik veri (sade sürüm) | Bilgi |
| [promats-email-auth-durumu.md](docs/musteri/promats-email-auth-durumu.md) | SPF/DKIM/DMARC kontrol raporu — `info@promats.com.tr` (v1) | Aksiyon — Avrasya BT |
| [promats-avrasyaotomotiv-mail-auth-v2.md](docs/musteri/promats-avrasyaotomotiv-mail-auth-v2.md) | `info@avrasyaotomotiv.net` v2 — K-2 hibrit karar | Aksiyon — Avrasya BT |
| [lead-onay-paneli-kullanim-rehberi.md](docs/musteri/lead-onay-paneli-kullanim-rehberi.md) | Avrasya export ekibi için 3 dk/aday akış rehberi | Eğitim |
| [stand-ekibi-egitim-gundemi.md](docs/musteri/stand-ekibi-egitim-gundemi.md) | T-3 günü 1.5 saatlik oturum gündemi | Eğitim |
| [fuar-stand-operasyon-sop.md](docs/musteri/fuar-stand-operasyon-sop.md) | Fuar haftası operasyon SOP'u | Operasyon |
| [fuar-kartvizit-toplama-formu.md](docs/musteri/fuar-kartvizit-toplama-formu.md) | Walk-in A5 form + akşam akışı | Operasyon |
| [calendly-kurulum-rehberi.md](docs/musteri/calendly-kurulum-rehberi.md) | Calendly Free Basic kurulum (10-15 dk) | Eğitim |
| [automechanika-2026-kpi-rapor-sablonu.md](docs/musteri/automechanika-2026-kpi-rapor-sablonu.md) | Post-show KPI raporu boş şablon (14 bölüm) | Şablon |

### Mail Şablonları (sade — Sprint 3 düzeltmesi sonrası)

| Dosya | İçerik |
|---|---|
| [automechanika-2026-outreach-templates.md](docs/musteri/automechanika-2026-outreach-templates.md) | İlk outreach — 3 dil × 1 sade şablon (Hall 3.1 D11 davet) |
| [automechanika-2026-randevu-hatirlatma-templates.md](docs/musteri/automechanika-2026-randevu-hatirlatma-templates.md) | Calendly sonrası T-14/T-7/T-1 hatırlatma (3 dil × 3 zaman = 9) |
| [automechanika-2026-followup-templates.md](docs/musteri/automechanika-2026-followup-templates.md) | Yanıt yok sequence T+3/T+10/T+30 (3 dil × 3 = 9) |

### Arşiv (Bionluk Amazon Projesi)

| Dosya | İçerik |
|---|---|
| [amazon-proje-taahhut-listesi.md](docs/musteri/amazon-proje-taahhut-listesi.md) | Bionluk müşteri teslim listesi (Amazon Scoring) |
| [amozon-pilot-konusmalari.md](docs/musteri/amozon-pilot-konusmalari.md) | amozon repo'sundan taşınan müşteri mesajları (703 satır tarihsel referans) |
| [PILOT_DELIVERY_PACKAGE_CHECKLIST.md](docs/musteri/PILOT_DELIVERY_PACKAGE_CHECKLIST.md) | Eski pilot teslim çeklistı |
| [TEKLIF_TASLAGI.md](docs/musteri/TEKLIF_TASLAGI.md) + [FATURA_TASLAGI.md](docs/musteri/FATURA_TASLAGI.md) | Bionluk teslim sözleşme/fatura |

---

## 4. Teknik Belgeler — `docs/teknik/`

### Sprint Çıktıları

| Dosya | İçerik | Sprint |
|---|---|---|
| [SPRINT_1_TAM_TARAMA_IS_PAKETI.md](docs/teknik/SPRINT_1_TAM_TARAMA_IS_PAKETI.md) | Codex iş paketi: tam tarama akış (K-1/K-2 düzeltmeleri dahil) | Sprint 1 |
| [poc-kalite-kontrol-raporu.md](docs/teknik/poc-kalite-kontrol-raporu.md) | PoC çıktı analizi — 30 firma → kalibrasyon önerileri | Sprint 0 |
| [sprint-1-precision-raporu.md](docs/teknik/sprint-1-precision-raporu.md) | 429 firma analizi, ICP v2 önerileri (POL hakimiyeti) | Sprint 1 |
| [sprint-2-komsu-stand-top25.md](docs/teknik/sprint-2-komsu-stand-top25.md) | Avrasya D11'in 25 fiziksel komşusu (Manhattan mesafe) | Sprint 2 |
| [SPRINT_3_SADE_PLAN.md](docs/teknik/SPRINT_3_SADE_PLAN.md) | Apollo drop, Hunter free yeterli — sadeleştirilmiş plan | Sprint 3 |
| [sprint-3-personalization-ornek.md](docs/teknik/sprint-3-personalization-ornek.md) | 5 gerçek aday için golden test set | Sprint 3 |

### Stratejik Kararlar

| Dosya | İçerik |
|---|---|
| [icp-automechanika-final.md](docs/teknik/icp-automechanika-final.md) | ICP v1 + v2 SQL — DB seed için hazır |
| [10times-drop-karari.md](docs/teknik/10times-drop-karari.md) | 10times entegrasyonu drop kararı + ders çıkarımı |
| [10times-event-id-kesfi-notu.md](docs/teknik/10times-event-id-kesfi-notu.md) | Event ID 2930629 keşfi (tarihsel — drop edildi) |
| [byok-keepa-politikasi.md](docs/teknik/byok-keepa-politikasi.md) | Multi-tenant Keepa anahtarı stratejisi |
| [risk-modulu-musteri-taahhutleri.md](docs/teknik/risk-modulu-musteri-taahhutleri.md) | Bionluk korunum manifestosu (Risk modülü aktarımı için) |
| [risk-modulu-faz4-isleri.md](docs/teknik/risk-modulu-faz4-isleri.md) | amozon Phase 4 özet + Phase 5 roadmap |
| [risk-modulu-ia-karari.md](docs/teknik/risk-modulu-ia-karari.md) | Risk sidebar grup yapısı (5 alt menü) |

### Network/Veri Analizi

| Dosya | İçerik |
|---|---|
| [messefrankfurt-network-analizi.md](docs/teknik/messefrankfurt-network-analizi.md) | AEM tabanlı site keşif raporu, API endpoint stratejisi |
| [rakip-intel-automechanika-2026.md](docs/teknik/rakip-intel-automechanika-2026.md) | Frogum, Apesan, ClimAir + 11 Türk rakip listesi |

### Tema / UI

| Dosya | İçerik |
|---|---|
| [TEMA_MIGRASYON_CEKLISTI.md](docs/teknik/TEMA_MIGRASYON_CEKLISTI.md) | Tema migrasyonu çeklist (8 sprint) |
| [tema-dark-mode-ve-preset-karari.md](docs/teknik/tema-dark-mode-ve-preset-karari.md) | Light default, dark altyapı, preset switcher |
| [tema-adminshell-ia-karari.md](docs/teknik/tema-adminshell-ia-karari.md) | AdminShell IA + density + sidebar yapısı |
| [tema-sistem-kurallari.md](docs/teknik/tema-sistem-kurallari.md) | Token kullanım rehberi (PR review checklist) |
| [landing-hero-sade-b2b.md](docs/teknik/landing-hero-sade-b2b.md) | 3 hero varyant × TR/EN/DE + sayfa yapısı + SEO meta |

### Operasyon

| Dosya | İçerik |
|---|---|
| [stand-brifing-kart-sablon.md](docs/teknik/stand-brifing-kart-sablon.md) | Aday başına 1 sayfa kart (sade sürüm) |
| [stand-brifing-pdf-endpoint-spec.md](docs/teknik/stand-brifing-pdf-endpoint-spec.md) | Codex iş paketi: Puppeteer + Handlebars PDF endpoint |
| [outreach-personalization-prompt.md](docs/teknik/outreach-personalization-prompt.md) | GPT-4o-mini kişiselleştirme system prompt + örnekler |
| [apollo-fallback-sop.md](docs/teknik/apollo-fallback-sop.md) | LinkedIn → Hunter pattern → mail-tester manuel akış |

### Çeklistler

| Dosya | İçerik |
|---|---|
| [AMOZON_AKTARIM_CEKLISTI.md](docs/teknik/AMOZON_AKTARIM_CEKLISTI.md) | amozon → Risk modülü aktarım (6 sprint) |
| [FAIR_MODULU_CEKLISTI.md](docs/teknik/FAIR_MODULU_CEKLISTI.md) | Fair modülü detay çeklist |
| [LEAD_MACHINE_RAPOR.md](docs/teknik/LEAD_MACHINE_RAPOR.md) | Lead Machine genel rapor (Amazon/B2B/Fair 3 kanal) |
| [SCORING_LOGIC.md](docs/teknik/SCORING_LOGIC.md) | Amazon scoring engine boyutları |

### Arşiv

| Dosya | Yorum |
|---|---|
| [docs/arsiv/e3/](docs/arsiv/e3/) | amozon E3 Antigravity dönemi belgeleri (21 dosya) |
| [docs/arsiv/checklists/](docs/arsiv/checklists/) | Eski Amazon-only çeklistler (6 dosya) |

### Rakip Analizi

| Dosya | Rakip |
|---|---|
| [docs/rakip-analizi/bazexport.md](docs/rakip-analizi/bazexport.md) | BAZ Export |
| [docs/rakip-analizi/zoho.md](docs/rakip-analizi/zoho.md) | Zoho |
| [docs/rakip-analizi/GLOBAL_RAKIP_ANALIZI_HELIUM10_AGELLIC.md](docs/rakip-analizi/GLOBAL_RAKIP_ANALIZI_HELIUM10_AGELLIC.md) | Helium10, Agellic |
| [docs/rakip-analizi/TURKCE_RAKIP_ANALIZI_SATISANALIZ_APEXSCOUTY.md](docs/rakip-analizi/TURKCE_RAKIP_ANALIZI_SATISANALIZ_APEXSCOUTY.md) | SatışAnaliz, Apexscouty |

---

## 5. Üretilen Veri & Sonuçlar — `output/`

| Dosya | İçerik | Boyut |
|---|---|---|
| [REHBER.md](output/REHBER.md) + [REHBER.pdf](output/REHBER.pdf) | Aday değerlendirme rehberi (örneklerle) | 10 KB + 96 KB |
| [automechanika-mail-listesi-v2.csv](output/automechanika-mail-listesi-v2.csv) | 129 firma — tüm aday listesi (skor sıralı) | — |
| [automechanika-mail-listesi.csv](output/automechanika-mail-listesi.csv) | İlk sürüm (137 firma) — tarihsel | — |
| [aday-APPROVE_FAVORITE.csv](output/aday-APPROVE_FAVORITE.csv) | 1 firma — ⭐ Onayla + Favori | — |
| [aday-APPROVE_DIRECT.csv](output/aday-APPROVE_DIRECT.csv) | 20 firma — ✅ Doğrudan onayla | — |
| [aday-APPROVE_WITH_REVIEW.csv](output/aday-APPROVE_WITH_REVIEW.csv) | 28 firma — 🟡 Kontrol et, onayla | — |
| [aday-RESEARCH.csv](output/aday-RESEARCH.csv) | 2 firma — 🔍 Önce araştır | — |
| [aday-LOW_PRIORITY.csv](output/aday-LOW_PRIORITY.csv) | 69 firma — 📭 Düşük öncelik | — |
| [aday-REJECT.csv](output/aday-REJECT.csv) | Boş — sistem 0 reddet önerdi (filtremiz iyi çalıştı) | — |

---

## 6. Script'ler — `scripts/`

### Aktif

| Dosya | İçerik |
|---|---|
| [import-automechanika-to-db.py](scripts/import-automechanika-to-db.py) | JSONL → ICP filtre + classifier + recommendation engine → DB INSERT (127 firma) |
| [poc-automechanika-fair-scrape.sh](scripts/poc-automechanika-fair-scrape.sh) | scraper-service ile fair-exhibitor + detail PoC test |
| [automechanika-export-exhibitor-urls.sh](scripts/automechanika-export-exhibitor-urls.sh) | Codex: Messe API'sinden tüm exhibitor URL'lerini çek (Hall filtreli/all) |
| [automechanika-rate-limit-check.sh](scripts/automechanika-rate-limit-check.sh) | Codex: 100 ardışık URL anti-bot testi |

### Arşiv

| Dosya | İçerik |
|---|---|
| [scripts/arsiv-e3/](scripts/arsiv-e3/) | Eski Amazon E3 runner scriptleri (7 dosya) |

---

## 7. Geçici / Ham Veri — `/tmp/`

> Bu dosyalar **geçicidir** — kalıcı yedek almak istiyorsan `output/`'a kopyala.

| Yol | İçerik |
|---|---|
| `/tmp/automechanika_exhibitors_1779323484/exhibitors.jsonl` | Hall 3.0/3.1/4.0 — **429 exhibitor** ham veri (Codex çıktısı) |
| `/tmp/automechanika_exhibitors_1779323574/exhibitors.jsonl` | Tüm fuar — **2325 exhibitor** ham veri |
| `/tmp/automechanika_429.jsonl` | Pretty JSON → JSONL dönüşümlü (Python import için) |
| `/tmp/automechanika-import.sql` | Son üretilen INSERT SQL (debug) |
| `/tmp/automechanika_list_*.json` | PoC liste sayfası test çıktıları |
| `/tmp/automechanika_detail_*.json` | PoC detail sayfası test çıktıları |
| `/tmp/automechanika_rate_limit_*/summary.tsv` | Anti-bot test özeti |

---

## 8. Veritabanı — Kalıcı

`market_pulse_db` lokal DB'de:

| Tablo | İçerik | Adet |
|---|---|---|
| `icp_profiles` | ICP v1 + v2 | 3 satır |
| `lead_search_jobs` | Job kayıtları (trade_fair, b2b, vs.) | 3+ |
| `lead_candidates` | Mevcut adaylar (channel='trade_fair') | **120 satır** |
| `lead_enrichment` | Hunter sonuçları | 0 (Sprint 3'te dolacak) |
| `lead_outreach_drafts` | Mail taslakları | 0 (Sprint 3'te dolacak) |
| `lead_rejection_patterns` | Red sebepleri agregat | 0 (onaylar başladığında dolacak) |
| `lead_scan_rules` | Kullanıcı tanımlı dışlama kuralları | 0 |
| `lead_appointments` | Calendly randevuları | 0 (kurulum sonrası) |
| `appointment_reminders` | T-14/T-7/T-1 gönderim tracking | 0 |

---

## 9. Kod — Backend & Admin Panel

### Backend (port 8086)

| Yol | İçerik |
|---|---|
| `backend/src/modules/lead-machine/fair/` | fair.scraper.ts + fair.job.ts + booth.ts + tentimes.client.ts (deprecated) |
| `backend/src/modules/lead-machine/b2b/` | icp.matcher.ts (Automechanika kategori taksonomisi) |
| `backend/src/modules/lead-machine/enrichment/` | enrichment.service.ts (Hunter adapter Codex'ten bekliyor) |
| `backend/src/modules/lead-machine/outreach/` | draft.service.ts (Sprint 3 — Codex'ten bekliyor) |
| `backend/src/db/seed/sql/018_lead_machine_schema.sql` | Lead Machine tüm tablolar |
| `backend/src/jobs/` | follow-up + reminder cron'ları (Codex Sprint 4/6'da yazdı) |

### Admin Panel (port 3096)

| Yol | İçerik |
|---|---|
| `admin_panel/src/app/(main)/admin/(admin)/market/lead-machine/candidates/` | Onay paneli ana sayfa |
| `admin_panel/src/app/(main)/admin/(admin)/market/lead-machine/fair-day/` | Mobile stand paneli |
| `admin_panel/src/app/(main)/admin/(admin)/market/lead-machine/fair/review/` | Fair review filtreli |
| `admin_panel/src/app/(main)/admin/(admin)/market/_components/lead-candidates-panel.tsx` | Aday kartı render (formatFairInfo, formatMailType, recommendation badge) |
| `admin_panel/src/app/(main)/admin/(admin)/market/_components/fair-day-panel.tsx` | Mobile randevu listesi |

---

## 10. Sistem Bağımlılıkları

| Servis | Durum |
|---|---|
| **scraper-service** (Codex prod) | ✅ https://scraper.guezelwebdesign.com/health — ayakta |
| **MySQL** (lokal) | ✅ 127.0.0.1:3306 — market_pulse_db |
| **Backend Bun** | ✅ localhost:8086 (PID 3747468) |
| **Admin Panel Next** | ✅ localhost:3096 (PID 3419403) |
| **Messe Frankfurt API** | ✅ public endpoint çalışıyor |
| **Hunter.io** | ⏳ API key alınmadı (free 50/ay yeter) |
| **Postmark** | ⏳ Verified sender setup gerekli |
| **GPT-4o-mini** | ⏳ OpenAI API key |
| **Calendly** | ⏳ Avrasya hesabı açılacak |
| **Apollo.io** | ❌ DROP (gereksiz, Hunter free yeter) |
| **10times API** | ❌ DROP (public API yok) |

---

## 11. Sonraki Adımlar (Önceliği Yüksek)

1. **Admin panel'de adayları gözden geçir** (~25 dk) — onayla/reddet → `lead_rejection_patterns` dolar
2. **Hunter API key başvurusu** (1 dk) — `HUNTER_API_KEY` env'e gir
3. **Codex draft.service.ts** üretsin — mail taslakları DB'ye düşer
4. **Avrasya 5 K-* sorusu** onayla — gönderim için son onay
5. **Postmark setup** — DKIM/SPF DNS ekle

Detay sonraki adım için: [PROJE_DURUM_PANOSU.md](PROJE_DURUM_PANOSU.md)

---

## Toplam Sayım

- 📁 **150+ dosya** üretildi/taşındı/güncellendi
- 📝 **~30** aktif Markdown (kök + docs/musteri + docs/teknik + docs/strateji)
- 📊 **8 CSV** çıktı dosyası
- 🐍 **1 Python import** scripti + 4 shell script
- 💾 **120 aday** + 9 DB tablosu kalıcı veride
- 🎯 **5 öneri kategorisi** otomatik aksiyon engine'i
