# Stand Ekibi Eğitim Oturumu — Gündem

> **Tarih:** 2026-05-21 (taslak, oturum T-3 günü yapılacak: 2026-09-05)
> **Sahibi:** 🧠 Claude (Orhan ile Avrasya stand ekibine sunum)
> **Süre:** 1 saat 30 dakika (60 dk içerik + 30 dk soru/uygulama)
> **Format:** Yüz yüze veya Zoom — Avrasya'nın tercihi
> **Katılımcılar:** Avrasya stand ekibinden 3 kişi (export müdürü + 2 walk-in karşılayıcı)
> **Bağlı:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 5

---

## Bu eğitimin amacı

Stand ekibi 4 günlük fuar boyunca:
- Önceden hazırlanmış brifing kartlarını kullanabilsin
- Walk-in adaylarını 30 saniyede ayırt edebilsin
- Doğru formu doğru zamanda doldursun
- Akşam veriyi market_pulse panel'ine yükleyebilsin
- Acil durumlarda ne yapacağını bilsin

Eğitim sonunda 3 kişi de **aynı standartta** çalışıyor olmalı.

---

## Dakika Dakika Gündem

### 00:00 — 00:10 (10 dk) — Tanışma + Bağlam

- "Niye buradayız": 4 ay önce başladığımız sistem 60-90 mail gönderdi, ~30 randevu çıktı
- Stand ekibinin **fuar haftası operasyonel görevleri** — bu eğitim onların pratiği
- Soru: Geçen yıl/önceki fuarlarda en çok hangi konuda zorlandınız? (kısa not — son 5 dk'da geri bakılacak)

### 00:10 — 00:25 (15 dk) — Brifing Kart Anatomisi

**Material:** Önceden basılmış 5 örnek brifing kartı (PDF — Codex endpoint'inden indirildi)

İçerik:
- Kart bölümleri tek tek anlatılır:
  - Üst kısım: firma + ülke + ICP skoru + stand bilgisi
  - Randevu varsa: tarih + saat + karar verici
  - Firma özeti + ürün kategorileri
  - Web sinyalleri (B2B, Çin import, private label)
  - ICP eşleşme nedeni — "niye bu aday"
  - Alt kısım: görüşme sonrası doldurma — sıcaklık, istek, sonraki adım
- **Pratik:** her stand ekibi üyesi 1 örnek kartı 60 saniyede özümsüyor — okuduktan sonra "bu firma kim, niye geldi" özetliyor

Kaynak belge: [docs/teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md)

### 00:25 — 00:40 (15 dk) — 45 Dakikalık Randevu Paketi

Stand operasyon SOP'undan [§3 Randevu Akışı](fuar-stand-operasyon-sop.md):

| Faz | Süre | Ne yapılır |
|---|---|---|
| Pre-meeting | 5 dk | Brifing kart oku, "niye buradalar" tahmin, ilk 3 soruyu hazırla |
| Açılış | 3-5 dk | Hoş geldin, ilk soruyu sor, bağlam topla |
| Vaat | 10-15 dk | Avrasya hikayesi (35+ ülke, 8 ürün serisi, 2017'den), 2 kritik argüman, numune göster |
| Soru-cevap | 10 dk | Soru cevapla, "kritik nokta hangisi" sor |
| Kapanış | 5 dk | **Net bir sonraki adım** belirle, kartvizit değiş |
| Post-meeting | 5 dk | Kartın alt kısmını DOLDUR (kritik!), fotoğrafla, panel'e yükle |

**Rol oyna:** 1 ekip üyesi "alıcı" rolü, 1 üye "Avrasya export". 5 dakikalık kısa açılış-vaat-kapanış canlandırması. Diğer kişi gözlemler, geri bildirir.

### 00:40 — 00:55 (15 dk) — Walk-in Karşılama

**Material:** [docs/musteri/fuar-kartvizit-toplama-formu.md](fuar-kartvizit-toplama-formu.md) — A5 form + zımba

#### 30 saniyede aday/turist ayırt etme

Turist sinyalleri (kibarca geç):
- Sadece elinde harita, kataloglara bakıyor ama soru yok
- Öğrenci yaşta, defter alıyor
- Ürünleri dokunup gidiyor

Aday sinyalleri (yakala):
- Kartvizit göstermek için cüzdana uzanıyor
- Tablet/telefonla fiyat soruyor
- "Catalog?" / "Distributor?" / "OEM?" gibi kelimeler

#### Walk-in akışı (5-10 dk)

1. **Yaklaş:** "Welcome! Looking for floor mats?" (EN varsayılan)
2. **Bağlam topla (1 dk):**
   - "Where are you based?"
   - "Do you currently source from China or somewhere else?"
   - "Are you a distributor or have your own store?"
3. **Aday ise → kartvizit al + formu doldur (5-10 dk):**
   - Form üzerinde işaretle (yukarıdaki bölümler)
   - Kartvizitini forma zımbala
   - Sıcaklık + sonraki adım işaretle
4. **Aday değilse → katalog ver + kart al + gönder:**
   - "Here's our catalog, feel free to flip through"

#### Pratik

Ekip üyelerine **3 farklı senaryo** kart oku:
1. Genç delikanlı, sadece kataloga bakıyor → "soğuk turist"
2. 50 yaş, takım elbiseli, kartvizitini gösteriyor → "sıcak aday"
3. Belirsiz — "interested in your products" diyor → soru sor, ayırt et

### 00:55 — 01:05 (10 dk) — Mobile Stand Paneli (Codex endpoint)

**Material:** Stand çalışanın telefonu + Wi-Fi

URL: `https://market-pulse.{domain}/admin/market/lead-machine/fair-day` — bu Codex Sprint 5'te yaptı.

İçerik:
- Günün randevu listesi (saat sıralı)
- Her aday için brifing kartı erişim butonu
- Onaylı/favori filtre
- PDF indir (yedek)

**Pratik:** stand ekibi telefonu açar, paneli login eder, ilk randevu kartını yükler. 90 saniyede tüm akışı görmeli.

### 01:05 — 01:15 (10 dk) — Akşam Review + Veri Toplama

Stand SOP §5'ten:

| 18:00-18:15 | Tüm kartları + walk-in formları topla |
| 18:15-18:30 | Her birini fotoğrafla → Google Drive klasörüne yükle |
| 18:30-18:40 | Brifing kartlarındaki yazılı notları admin panel'e gir |
| 18:40-18:50 | Numune talepleri Avrasya Türkiye ofisine WhatsApp |
| 18:50-19:00 | Günlük metrikler WhatsApp gruba |

**Günlük metrik şablonu:**
```
GÜN N ÖZET (Eylül DD, 2026)
Randevu: planlanan / gerçek
Walk-in aday: N
Numune isteyen: N
Sıcak aday: N
Yarın notlar: ...
```

### 01:15 — 01:25 (10 dk) — Acil Durumlar + Soru-Cevap

[Stand operasyon SOP §6](fuar-stand-operasyon-sop.md)'dan acil durum tablosu:

- Wi-Fi/4G çökerse → form manuel, akşam yükle
- Stand görevlisi hastalanırsa → Avrasya'dan yedek
- Numune kaybolursa → Türkiye'den 24 saat kargo
- VIP/önemli ziyaretçi → rol 1 (export müdürü) öncelik
- Rakip standa yaklaşırsa → nezaket, datalarımızı verme
- Gazeteci → Avrasya pazarlama koordinasyon

Açık soru cevap (10 dk) — eğitim başında yazılan endişelere geri dön.

### 01:25 — 01:30 (5 dk) — Kapanış + Hatırlatma

- T-1 günü (7 Eylül akşamı) son kontrol toplantısı
- Numune sandığı + form kopyaları + iş kartı zaten stand'da
- Acil iletişim: Avrasya Türkiye + Orhan WhatsApp grubu

---

## Eğitim Sonrası Aksiyon Listesi

Eğitim çıkışında her ekip üyesi:

- [ ] Brifing kart örneğini 60 sn'de okuyabiliyor
- [ ] Walk-in formu 1 örnek üzerinde doldurmuş
- [ ] Mobile panel telefonundan açıyor, login ediyor
- [ ] Akşam review akışını biliyor
- [ ] Acil durum kartını (acil iletişim numaraları) cebinde

---

## Materyal Kontrol Listesi (T-3 gün, eğitim öncesi)

- [ ] 5 örnek brifing kartı PDF basılı
- [ ] Walk-in form A5 (10 boş kopya)
- [ ] Zımba + makas + kalem
- [ ] Mobile panel test login bilgileri
- [ ] Acil iletişim kartı (Orhan + Türkiye ofis + Claude WhatsApp)
- [ ] Stand operasyon SOP'u PDF (tek sayfa özeti)

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🛠️ Stand operasyon SOP: [fuar-stand-operasyon-sop.md](fuar-stand-operasyon-sop.md)
- 🃏 Brifing kart şablonu: [../teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md)
- 📝 Walk-in form: [fuar-kartvizit-toplama-formu.md](fuar-kartvizit-toplama-formu.md)
- 📅 Calendly kurulum (randevular bu sistemden): [calendly-kurulum-rehberi.md](calendly-kurulum-rehberi.md)
- ⚔️ Rakip intel (fuar haftası referans): [../teknik/rakip-intel-automechanika-2026.md](../teknik/rakip-intel-automechanika-2026.md)
