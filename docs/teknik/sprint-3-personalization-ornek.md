# Sprint 3 — Kişiselleştirme Cümleleri (5 Gerçek Aday Örneği)

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (manuel kalite kontrolü — Codex GPT entegrasyonundan önce baseline)
> **Hedef:** GPT-4o-mini'nin üreteceği kişiselleştirme cümlesinin gerçek aday verisiyle nasıl görüneceğini kanıtla. Codex draft.service.ts'i yazarken bu örnekler **golden test set** olarak kullanır.
> **Bağlı:** [outreach-personalization-prompt.md](outreach-personalization-prompt.md) + [SPRINT_3_SADE_PLAN.md](SPRINT_3_SADE_PLAN.md)

---

## Aday 1 — HromTech GmbH (Almanya, Hall 3.1 E30)

### Veri (Messe API + WebFetch)
- Country: DEU, City: Langelsheim
- Web: hromtech.com → ELEMENT (Autofamily) markası paspas **distribütörü**
- 40+ ülkede, 450+ paspas modeli katalog
- Email: `office@hromtech.com` (generic — Hunter ile karar verici aranmalı)
- Mesafe Avrasya'ya: 20 (Hall 3.1 E sıra)

### ⚠️ ICP Değerlendirme — kritik

HromTech zaten paspas distribütörü ama **ELEMENT (Autofamily)** markasının sözleşmeli partneri. Avrasya için:
- **Yeni distribütör müşteri OLAMAZ** (bağımlı tedarik kontratı var)
- **İkincil bir paspas hattı için açık olabilir** — alternatifin görüşmesi için fuar standı uygun
- **Önerim:** "🟡 İncele" — outreach gönder, yanıt gelirse fırsat. Yanıt gelmezse normal.

### Kişiselleştirme cümlesi (EN — HromTech İngilizce iş yapar)

```
Your 450+ floor mat range with Autofamily/ELEMENT covering 40+ markets shows
you know this category at depth — we'd value 10 minutes to compare notes on
the EU aftermarket trend, no sales pitch required.
```

**Not:** Bilinçli olarak satış mesajı yok — HromTech'in mevcut hattını rakip görmüyoruz, ortak sektör konuşması davet ediyoruz. Yanıt gelirse Avrasya **alternatif tedarik** olarak sunulur (fuarda).

---

## Aday 2 — Carmotion Polska (Polonya, Hall 3.1 C31)

### Veri
- Country: POL, City: Siedlec
- Web: yok (Messe API'den)
- Email: `aleksandra.zok@carmotion.pl` (👤 **sahsi mail** — Hunter gereksiz)
- Mesafe Avrasya'ya: 21 (komşu — Hall 3.1 C sıra)

### Eksik veri uyarısı

Carmotion'ın websitesi Messe API'de yok. Hızlı bir WebFetch ile carmotion.pl'a bakarsak ek bağlam çıkarabiliriz; Codex bunu otomatik yapabilir. Şimdilik **website-yoksa fallback** kullanılır.

### Kişiselleştirme cümlesi (DE — POL alıcısı için EN/DE karışık, DE daha güvenli)

```
Wir haben Carmotion als aktiven Aftermarket-Distributor im polnischen
Markt notiert und sehen klare Berührungspunkte zu unserer Floor-Mat-Linie.
```

Veya EN versiyon:
```
We've noted Carmotion as an active aftermarket distributor in the Polish market
and see clear overlap with our floor mat line.
```

**Sahsi mail** → "Hi Aleksandra" açılışı + bu cümle = yüksek yanıt oranı potansiyeli.

---

## Aday 3 — Auto France Parts (Fransa, Hall 3.0 B16)

### Veri
- Country: FRA, City: Chanteloup les Vignes
- Web: auto-france-parts.com → 50+ ülke, 80+ marka (Peugeot, Renault, Valeo, Iveco), **yedek parça distribütörü**
- Email: `nizar.ayyad@auto-france-parts.com` (👤 sahsi mail — karar verici muhtemel)
- Mesafe Avrasya'ya: uzak (Hall 3.0)

### ⚠️ ICP Değerlendirme — RED

Auto France Parts **yedek parça** odaklı (Valeo, Iveco, Peugeot OEM parçaları). Paspas/aksesuar **ana iş değil**. ICP v2'de:
- Sektör eşleşmesi zayıf (`weak_match_sectors` olabilir)
- Ana iş kategori dışı

**Önerim:** ICP filtre bunu **lead_score < 5.5** olarak ele almalı, candidate'a düşmemeli. Düşerse manuel review'da reddedilir.

Yine de örnek olarak kişiselleştirme yazsam:

### Kişiselleştirme cümlesi (EN — Fransızca gönderici nizar mail için EN güvenli)

```
Your portfolio across 80+ brands with Peugeot, Renault and Iveco shows
strong reach in the FR aftermarket; if floor mats sit alongside your parts
range, we'd value a 10 min sync.
```

Cümle dikkatli yazılmış: "if floor mats sit alongside" — varsayım yapmıyor, soruyor. Auto France Parts ana iş yedek parça olduğu için kibarca devre dışı bırakma payı bırakıyor.

---

## Aday 4 — Azet Trading BV (Hollanda, Hall 3.1 E80)

### Veri
- Country: NLD, City: Rotterdam
- Web: **yok** (Messe API'de boş)
- Email: `peter.vis@azet.nl` (👤 sahsi mail — Peter, küçük firma/owner muhtemel)
- Mesafe Avrasya'ya: 71 (uzak, E sıra ama col 80)

### ICP Değerlendirme — Pozitif

Adı "Trading BV" — **trading/distribütör** açıkça. Hollanda Rotterdam lojistik hub. Sahsi mail. ICP filtresinde geçer.

Website yok → AI'a vereceğimiz input minimal. Fallback kullanılır.

### Kişiselleştirme cümlesi (EN)

```
A Rotterdam-based trading house at Automechanika is a natural touchpoint
for us — we'd value 10 minutes to see whether our floor mat line could
fit into a multi-product container shipment.
```

"Multi-product container shipment" Rotterdam lojistiğine özel — somut iş çağrısı, sırf "merhaba" değil.

---

## Aday 5 — Auto Partner SA (Polonya, Hall 3.0 C50)

### Veri
- Country: POL, City: Bierun
- Web: auto-partner.pl (WebFetch 422 — manuel kontrol gerek)
- Email: **null** (Messe API mail vermedi) — Hunter zorunlu
- Mesafe Avrasya'ya: uzak (Hall 3.0)

### Bilinen kamuya açık bilgi (sektör bilgisi)

Auto Partner SA Polonya'nın **borsada işlem gören büyük auto parts dağıtım grubu** (ticker: APR). Çok büyük ölçekli, çok markaya hizmet.

### Hunter ile decision_maker bulma

`domain-search?domain=auto-partner.pl` → Hunter listesinden:
- "Director of Purchasing" / "Category Manager — Accessories" pozisyonu ara
- Bulunursa o mail kullanılır
- Bulunmazsa fallback: `office@auto-partner.pl` veya generic

### Kişiselleştirme cümlesi (EN)

Hunter karar vericiyi bulduğunda (örn. "Marek Nowak, Category Manager — Accessories"):
```
With Auto Partner's scale across the Polish aftermarket, even a niche
floor-mat slot in your category mix is meaningful — we'd value 10 minutes
to discuss whether our line could be that slot.
```

Karar verici bulunamazsa fallback:
```
We've noted Auto Partner SA as one of the largest aftermarket distributors
in Poland and see a clear category overlap with our floor mat line.
```

---

## 5 Cümleden Çıkarımlar (Codex prompt kalite kapısı)

| # | Aday | Kategori uyum | Sahsi mail | Kişiselleştirme zorluğu |
|---|---|---|---|---|
| 1 | HromTech | 🟡 İkincil hat | Generic (Hunter) | **Yüksek** — rakip distribütör tonu |
| 2 | Carmotion | ✅ Net | ✅ Sahsi | Kolay — DE/EN net mesaj |
| 3 | Auto France Parts | ❌ ICP dışı | ✅ Sahsi | **Orta** — kibarca soru tonu |
| 4 | Azet Trading | ✅ Net | ✅ Sahsi | Kolay — Rotterdam lojistik açısı |
| 5 | Auto Partner SA | ✅ Net | (Hunter) | Kolay — ölçek vurgu |

### Codex'in dikkat etmesi gereken

1. **HromTech tipi adaylar:** "rakip distribütör" tonu — direkt satış değil sektör sohbeti
2. **Auto France Parts tipi adaylar:** ICP filtresi gerçekten elemeli, eğer geçerse mail tonu **şartlı** ("if floor mats sit alongside")
3. **Website-yok adaylar (Carmotion, Azet):** GPT'ye fallback prompt verilir, halüsinasyon yapmasın

---

## GPT Prompt Kalibrasyonu (Codex için)

[outreach-personalization-prompt.md](outreach-personalization-prompt.md) prompt'una **3 yeni kural** eklenecek:

```
4. If the prospect appears to be a competing distributor (e.g. already distributing
   another floor mat brand), use a "industry peer / category notes exchange" tone,
   NOT a sales pitch. Example: "we'd value 10 minutes to compare notes" instead of
   "we'd love to supply you".

5. If the prospect's PRIMARY business is OEM parts / engine parts / non-mat
   accessories (e.g. only Valeo/Iveco), use a CONDITIONAL tone:
   "if floor mats sit alongside your parts range..."
   This avoids assuming a category fit that doesn't exist.

6. If website is null (Messe API gave no website), focus on the COUNTRY +
   COMPANY TYPE signal only. Don't invent specifics.
```

---

## Codex İçin Golden Test Set

Codex'in `personalize.test.ts` testlerinde bu 5 aday'ı **golden output** olarak kullanmalı:

```typescript
describe('personalizeWithGPT', () => {
  it('HromTech - competing distributor tone', async () => {
    const input = { /* HromTech veri */ };
    const result = await personalizeWithGPT(input);
    expect(result).toMatch(/(compare notes|category|peer)/);
    expect(result).not.toMatch(/(supply you|sales pitch|partnership)/);
  });

  it('Auto France Parts - conditional tone (ICP weak match)', async () => {
    const input = { /* Auto France Parts veri */ };
    const result = await personalizeWithGPT(input);
    expect(result).toMatch(/(if|whether|alongside|next to)/);
  });

  it('Carmotion no-website - country fallback', async () => {
    const input = { website: null, country: 'POL', /* ... */ };
    const result = await personalizeWithGPT(input);
    expect(result).toMatch(/(polish|polnischen|poland)/i);
    expect(result.split(' ').length).toBeLessThan(35);  // ~25 kelime
  });
});
```

---

## Sprint 3 — Claude QA Görevi (Codex bitince)

Codex `draft.service.ts` çalışıp 50+ taslak ürettiğinde, Claude şunu yapacak:

1. **5 golden adayın gerçek output'u manuel review** — yukarıdaki beklenenlere uyuyor mu
2. **20 rastgele ek aday** sample — halüsinasyon var mı, satış pitch'i sızmış mı
3. **3 dil kontrol** — TR/EN/DE eşit kalitede mi
4. Hata oranı > %15 ise prompt'u iyileştir

---

## Bağlantılar

- 📋 Sprint 3 sade plan: [SPRINT_3_SADE_PLAN.md](SPRINT_3_SADE_PLAN.md)
- 🤖 Kişiselleştirme prompt'u: [outreach-personalization-prompt.md](outreach-personalization-prompt.md)
- ✉️ Outreach template'leri (sade): [../musteri/automechanika-2026-outreach-templates.md](../musteri/automechanika-2026-outreach-templates.md)
- 🎯 ICP v2: [icp-automechanika-final.md](icp-automechanika-final.md)
- ⚔️ Rakip intel (HromTech analizi burada da): [rakip-intel-automechanika-2026.md](rakip-intel-automechanika-2026.md)
