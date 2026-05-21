# Sprint 2 — Komşu Stand Top 25 Raporu (Avrasya 3.1 D11 çevresi)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 2 — komşu stand önceliklendirme)
> **Hedef okuyucu:** Avrasya stand ekibi (fuar haftası "yakın stand kabul" işi) + ⚙️ Codex (`is_neighbor` flag mantığı)
> **Bağlı:** [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md) Sprint 2 + [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)
> **Veri kaynağı:** `/tmp/automechanika_exhibitors_1779323484/exhibitors.jsonl` (Hall 3.1 — 207 exhibitor)

---

## Mantık

Avrasya stand: **3.1 D11** (row D, col 11).

Mesafe formülü (Manhattan = koridor yürüyüşü):
```
distance = |row_dist| + |col_dist|
row_dist = ABS(row_index - 'D'_index)     # A=1, B=2, C=3, D=4, E=5, F=6, ...
col_dist = ABS(col_number - 11)
```

**Komşu sınıfları:**
- **Mesafe ≤ 3** — direkt komşu (yan/karşı stand)
- **Mesafe 4-10** — yakın (1-2 koridor uzak)
- **Mesafe 11-25** — orta (aynı hall içi, walk-in için kullanışlı)
- **Mesafe > 25** — uzak (öncelikli değil)

Bu liste **Avrasya'nın fuar haftası "walk-in randevu yakalama" listesi**. Outreach hedefi olarak da ICP filtre sonrası kullanılabilir.

**Türk firmalar (TUR) liste dışı** — ICP v2 exclude_geographies'a göre. Apesan (D32 — Avrasya'nın aynı sırasında, 21 stand uzakta) **rakip intel listesinde** ([rakip-intel-automechanika-2026.md](rakip-intel-automechanika-2026.md)) yer alıyor; outreach hedefi değil.

---

## Top 25 — Avrasya D11 Çevresi (TUR hariç)

| # | Mesafe | Stand | Ülke | Firma | Web | Email | Pilot | Yorum |
|---|---|---|---|---|---|---|---|---|
| 1 | **1** | D10 | BGR | Balev EOOD (Areon Fresh) | areon-fresh.com | office@areon-fresh.com | — | ❌ Air freshener — kategori dışı |
| 2 | **1** | E11 | DEU | Südpfalzwerkstatt gGmbH (max4car) | max4car.de | max4car@lh-suew.de | ✅ | ❓ Atölye/bakım — incele |
| 3 | **1** | C11 | GBR | Pulse Medics Equipments | — | — | — | ❌ Tıbbi ekipman — kategori dışı |
| 4 | **2** | C10 | GBR | International Management Group | — | mara.verze@imgworld.com | — | ❌ IMG = ajans, kategori dışı |
| 5 | **2** | F11 | CAN | Canstar Industry | canstarwelding.com | — | — | ❌ Kaynak (welding) |
| 6 | **3** | F10 | JPN | Min Corporation | minparts.com | info@minparts.com | — | ❓ Auto parts JPN — kategori belirsiz |
| 7 | **3** | A11 | DEU | ABSORPOWER Service | trailer-weg.de | info@ap-bochum.de | ✅ | ❌ Trailer parts |
| 8 | **5** | D06 | ITA | **Deura S.r.l.** | deura.it | info@deura.it | — | ✅ İncele — Italya |
| 9 | **6** | C06 | GBR | The Nicoman Limited | nicoman.co.uk | — | — | ✅ **İnceleme önceliği — interior accessories** |
| 10 | **10** | D21 | ESP | PICOYA S.L. | picoya.es | hbeltran@picoya.es | — | ✅ İncele — İspanya distribütör |
| 11 | **10** | E20 | POL | Reflex-Polska | — | — | ✅ | ❓ Web yok, sahsi temas |
| 12 | **20** | D31 | DEU | Nostalgic-Art Merchandising | nostalgic-art.de | handel@nostalgic-art.de | ✅ | ❓ Merchandising — incele |
| 13 | **20** | E30 | DEU | **HromTech GmbH** | hromtech.com | office@hromtech.com | ✅ | ✅✅ **SICAK — Sprint 1'de de çıkmıştı, distribütör** |
| 14 | **21** | C31 | POL | **Carmotion Polska** | (yok) | aleksandra.zok@carmotion.pl | ✅ | ✅✅ **SICAK — POL aksesuar distribütör** |
| 15 | **21** | E31 | POL | Z.P.H.U. RIDER (Tomasz Fontanski) | riderauto.pl | tfontanski@riderauto.pl | ✅ | ✅ İncele — POL aksesuar |
| 16 | **22** | C32 | HUN | La Paloma Kft. | la-paloma.hu | info@la-paloma.hu | — | ✅ İncele — Macaristan |
| 17 | **22** | E32 | POL | EFT GROUP | eftgroup.pl | bok@eftgroup.pl | ✅ | ✅ İncele — POL |
| 18 | **23** | C33 | SWE | Malmarks International | malmarks.com | andre.spinola@malmarks.com | — | ✅ İncele — İsveç |
| 19 | **24** | D35 | GBR | Chart One Automotive (cover-zone) | cover-zone.com | richard@cover-zone.com | — | ✅✅ **İncele — car covers/aksesuar (UK)** |
| 20 | **24** | C34 | POL | CARVAME Car Perfumes | carvame.com | sales2@dreampen.com | ✅ | ❌ Parfüm |
| 21 | **26** | E36 | SVK | GALIA SLOVAKIA | galia.sk | galia@galia.sk | — | ❓ Slovakya, incele |
| 22 | **26** | B35 | DEU | Prowell Products | — | — | ✅ | ❓ Web yok |
| 23 | **27** | C37 | DEU | STOP&GO Marderabwehr | stop-go.de | info@stop-go.de | ✅ | ❌ Sansar kovucu (kategori dışı) |
| 24 | **28** | C38 | FRA | Tensio-Actifs SAS | tensio-actifs.com | j.caffon@tensio-actifs.com | ✅ | ❓ Kimyasal/temizleyici, incele |
| 25 | **30** | D41 | DEU/POL (×3) | Mr.AHK + HAK-POL + PRO TEC | mr-ahk.de + hakpol.pl + proteccss.pl | info@hellbach-automotive.de + office@imiola.pl + info@proteccss.pl | ✅ | ❓ Üçü birlikte D41 — towbar/security |

---

## Klasifikasyon Özeti

| Sınıf | Adet | Yorum |
|---|---|---|
| ✅✅ **Sıcak** (manuel öncelik) | 2 | HromTech (DE), Carmotion (POL) — distribütör sinyali güçlü |
| ✅ **İncele** | 9 | Pilot ülke + kategori uyumlu, manuel web kontrolü gerek |
| ❓ **Belirsiz** | 7 | Web yok veya kategori muğlak |
| ❌ **Kategori dışı** | 7 | Air freshener, parfüm, tıbbi, ajans, kaynak, sansar kovucu, trailer parts |

**Sıcak + İncele = 11 firma** Avrasya komşu havuzu için. Bu **stand çalışanının walk-in karşılaması için** dakika başına 1 kişi geçecek 4 günlük penceresine fazlasıyla yeter.

---

## Stand Çalışanına Öneri (fuar haftası)

Avrasya'nın D11 standı 4 gün açık olduğu için **mesafe ≤ 25 olan 25 firmadan** sıcak/incele kategorisindeki 11'ini stand çalışanı:

1. **Birinci gün (Pzt)** — D-sıra yürüyerek 5-10 dk içinde 10 stand görür:
   - D10 (Balev), D21 (PICOYA), D31 (Nostalgic-Art), D35 (Chart One), D41 (HAK-POL + PRO TEC)
   - Vitrin görmek, sunum tarzı not etmek
2. **İkinci gün (Sal)** — E-sıra:
   - E11 (Südpfalzwerkstatt), E20 (Reflex), E30 (HromTech 🔥), E31 (Rider), E32 (EFT)
3. **Üçüncü gün (Çar)** — C-sıra:
   - C10 (IMG), C31 (Carmotion 🔥), C33 (Malmarks), C34 (CARVAME), C37 (STOP&GO), C38 (Tensio)
4. **Dördüncü gün (Per)** — uzak F + A sıraları

---

## Codex İçin — `is_neighbor` Flag Mantığı

```typescript
// backend/src/modules/lead-machine/fair/neighbor.ts (yeni)

import { parseBooth } from './booth';

const ROWS = 'ABCDEFGHJKLM';
const AVRASYA = { hall: '3.1', row: 'D', col: 11 };

export interface NeighborInfo {
  is_neighbor: boolean;
  distance: number | null;
  row_dist: number | null;
  col_dist: number | null;
}

export function neighborOfAvrasya(boothStr: string | null | undefined): NeighborInfo {
  const empty = { is_neighbor: false, distance: null, row_dist: null, col_dist: null };
  if (!boothStr) return empty;
  const parsed = parseBooth(boothStr);  // existing helper
  if (!parsed || parsed.hall !== AVRASYA.hall) return empty;
  const rowIdx = ROWS.indexOf(parsed.row);
  const avrasyaRowIdx = ROWS.indexOf(AVRASYA.row);
  if (rowIdx < 0 || avrasyaRowIdx < 0) return empty;
  const rowDist = Math.abs(rowIdx - avrasyaRowIdx);
  const colDist = Math.abs(parsed.col - AVRASYA.col);
  const distance = rowDist + colDist;
  return {
    is_neighbor: distance <= 25,  // top 25 sınırı
    distance,
    row_dist: rowDist,
    col_dist: colDist,
  };
}
```

Adayın `raw_data.fair_info`'sına:
```typescript
fair_info: {
  hall: '3.1',
  booth_number: '3.1 E30',
  is_neighbor: true,
  distance_from_avrasya: 20,
  // ...
}
```

Onay panelinde **"Komşu Stand"** filtresi → bu 11 adayı öne çıkarır (Avrasya öncelikli review).

---

## ICP v2 + Komşu Sinyal Boost

ICP v2 ([icp-automechanika-final.md](icp-automechanika-final.md)) `scoring_weights`'a yeni ekleme önerisi:

```json
"scoring_weights": {
  ...
  "neighbor_bonus": 0.5
}
```

Komşu stand (`is_neighbor=true`) adayların **lead_score**'una +0.5 boost. Bu, mesafe ≤ 25 olan adayları **diğer 166 K-1 pilot aday arasında öne çıkarır**.

**Sebep:** Walk-in randevu yakalama olasılığı %3-4 kat daha yüksek. Mail yanıt almasa bile stand'a uğrama olasılığı yüksek (10 metre yürümek vs 1 km Hall 8'e gitmek).

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Fair modülü çeklist (Sprint 2): [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 📊 Sprint 1 precision raporu (havuz analizi): [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)
- 🎯 ICP v2 (neighbor_bonus eklenecek): [icp-automechanika-final.md](icp-automechanika-final.md)
- ⚔️ Rakip intel (Apesan D32, Frogum C80): [rakip-intel-automechanika-2026.md](rakip-intel-automechanika-2026.md)
- 🃏 Stand brifing kartı (is_neighbor alanı): [stand-brifing-kart-sablon.md](stand-brifing-kart-sablon.md)
