# Pilot Delivery Package Checklist

Bu kontrol listesi, ilk pilot musteriye teklif + fatura + demo ciktilarini eksiksiz teslim etmek icin kullanilir.

## 1) Ticari Cikti

- [ ] Teklif dokumani guncel (paket kapsam + fiyat + sure)
- [ ] Ilk fatura taslagi hazir
- [ ] Odeme kosullari net (vade, para birimi, IBAN/vergi bilgisi)
- [ ] Pilot baslangic ve degerlendirme tarihi yazili

## 2) Demo Cikti

- [ ] `admin/market` dashboard demo senaryosu hazir
- [ ] `targets/leads/signals` temel akislar demo adimlari yazili
- [ ] `reports` sayfasinda haftalik rapor onizleme gosterim adimi hazir
- [ ] `site-settings > Marka Renkleri` canli degisiklik gosterim adimi hazir

## 3) Teknik Guven

- [ ] `backend bun run build` yesil
- [ ] `admin_panel bun run build` yesil
- [ ] E3 kritik maddeleri (P0/P1) kapali
- [ ] Smoke test notlari kayitli (`docs/E3_SMOKE_TEST_COMMANDS.md`)

## 4) Toplanti Hazirligi

- [ ] 15-20 dakikalik demo akisi (gir->deger->kapanis) hazir
- [ ] Muhtemel sorular icin kisa cevap listesi hazir
- [ ] Sonraki adim/aksiyonlar toplanti sonunda istenecek sekilde net

## 5) Kapanis

- [ ] Teslim edilen dokumanlar listesi paylasildi
- [ ] Takip tarihi takvime islendi
- [ ] Durum notu `REFACTOR_CHECKLIST.md` veya ilgili is dokumanina islendi
