# E3 Bug Triage Template

Bu dokuman, Antigravity E3 raporu geldikten sonra buglari hizli siniflandirip kapatmak icin kullanilir.

## 1) Hizli Triage Kurali

- **Kritik (P0):** Sayfa acilmiyor, runtime crash, ana akis blok
- **Yuksek (P1):** Kaydet / guncelle / sil gibi temel aksiyon bozuk
- **Orta (P2):** UX/okunabilirlik/kontrast sorunu, fallback mesaji yetersiz
- **Dusuk (P3):** Metin, spacing, ikon, ufak kozmetik

## 2) Ticket Sablonu

Her bulgu icin asagidaki format kullanilsin:

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
- Not: `<API hazir degilse acikca yaz>`
```

## 3) Fix Sirası

1. P0 -> P1 -> P2 -> P3
2. Ilk tur sadece davranis/regresyon fix
3. Ikinci tur UI polish
4. Her fix turundan sonra:
   - `backend bun run build`
   - `admin_panel bun run build`

## 4) API Blokaj Etiketi

Endpoint hazir olmadigi icin kapanamayan buglar:

- Etiket: `blocked-by-api`
- Zorunlu not:
  - Beklenen endpoint
  - Simdiki fallback davranisi
  - API gelince test edilecek son adim

## 5) Kapanis Kriteri

Bir bug "closed" olmadan once:

- Repro adimlariyla tekrar denendi
- Beklenen davranis gerceklesti
- Ekran goruntusu eklendi (once/sonra tavsiye)
- Ilgili checklist maddesi guncellendi
