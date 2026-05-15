# E3 UI QA Triage Report (Ready Template)

Bu dosya, Antigravity E3 raporu geldikten sonra hizli triage ve kapanis takibi icin hazir sablondur.

## 1) Pass/Fail Ozeti

- [ ] `/admin/market`
- [ ] `/admin/market/targets`
- [ ] `/admin/market/leads`
- [ ] `/admin/market/signals`
- [ ] `/admin/market/reports`
- [ ] `/admin/site-settings` (Marka Renkleri)
- [ ] Sidebar temizlik kontrolu
- [ ] Dark mode okunabilirlik
- [ ] Paspas'tan Ice Aktar (targets/leads)

## 2) Bug Listesi (Oncelik Sirali)

### P0 (Kritik)

_Bulgu yoksa "Yok" yazin._

### P1 (Yuksek)

_Bulgu yoksa "Yok" yazin._

### P2 (Orta)

_Bulgu yoksa "Yok" yazin._

### P3 (Dusuk)

_Bulgu yoksa "Yok" yazin._

## 3) Ticketlar

Asagidaki sablonu her FAIL bulgusu icin kopyalayin:

```md
### [P?] <Kisa Baslik>
- URL: `<sayfa>`
- Etki: `<kullaniciyi nasil etkiliyor>`
- Beklenen: `<dogru davranis>`
- Mevcut: `<gozlenen davranis>`
- Repro:
  1. ...
  2. ...
  3. ...
- Kanit: `<screenshot / video / log>`
- Etiket: `<blocked-by-api | yok>`
- Not: `<ek bilgi>`
```

## 4) Bloklu Isler (`blocked-by-api`)

API hazir olmadigi icin kapanamayan bulgular:

| Bug | Beklenen Endpoint | Simdiki Davranis | API Gelince Son Test Adimi |
| --- | --- | --- | --- |
| - | - | - | - |

## 5) Fix Sprint Plani

- Tur 1: P0 + P1
- Tur 2: P2 + P3
- Her tur sonrasi:
  - `cd backend && bun run build`
  - `cd admin_panel && bun run build`

## 6) Kapanis

- Kapatilan E3 maddeleri:
  - ...
- Acik kalan E3 maddeleri:
  - ...
- Acik maddeler icin blok nedeni:
  - ...
