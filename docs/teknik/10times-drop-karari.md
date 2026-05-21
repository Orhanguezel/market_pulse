# 10times Entegrasyonu — Drop Kararı

> **Tarih:** 2026-05-21
> **Karar veren:** Orhan + Claude (gerçeklik kontrolü)
> **Durum:** ❌ **DROP** — 10times entegrasyonu Sprint 2'den çıkarıldı
> **Bağlı:** [docs/teknik/10times-event-id-kesfi-notu.md](10times-event-id-kesfi-notu.md) (artık tarihsel referans)

---

## Neden drop edildi

### 1. Public/self-serve API yok
- 10times.com'da `developer.10times.com` veya benzeri geliştirici portalı **mevcut değil**
- "Free tier API key başvurusu" diye bir self-serve akış **yok**
- Önceki belgelerde geçen "10times free tier" bilgisi **doğrulanmadı** — LLM halüsinasyonu veya eski/güncel olmayan kaynaktan
- Resmi B2B API: `business@10times.com` ile satış görüşmesi → haftalar süren süreç → ücretli kontrat
- Apify resmî 10times actor **DEPRECATED** olarak işaretli

### 2. İhtiyacımız yok
Avrasya için gerçek hedef: *"Automechanika'ya katılan distribütör/ithalatçı firmaları bul, outreach gönder."*

Bu listeyi **Messe Frankfurt'un kendi public API'sından** zaten çıkardık:
- 429 exhibitor (Hall 3.0/3.1/4.0)
- 166 K-1 pilot pazarda (DE/POL/AT/NL/FR)
- **Mail %88, website %90** coverage (liste seviyesinde)
- ICP filtre sonrası 70-90 onaylı aday bekleniyor

**10times'ın iddia ettiği değer** ("ziyaretçi intent verisi") bizim için yararsız çünkü:
1. Ziyaretçilerin %95'i tüketici / öğrenci / gazeteci — B2B alıcı azınlığı
2. Anlamlı B2B alıcılar zaten **exhibitor olarak** kayıtlı (kendi standları veya katalog firmaları üzerinden)
3. Distribütör'ün satınalma müdürü "interested" işaretlese bile büyük olasılıkla zaten o firma Messe API'sinde

### 3. Alternatifler bizim use case'imize uymaz
Genel event API'lar (PredictHQ, Eventbrite, Ticketmaster, SerpAPI Google Events) **etkinlik metadatası** verir (tarih, lokasyon, başlık) — **katılımcı firma listesi vermez**. Bizim ihtiyacımız zaten katılımcı listesi.

---

## Karar Çıktıları

### Sprint 2 sadeleştirildi

| Önceki Sprint 2 | Yeni Sprint 2 |
|---|---|
| ❌ 10times event_id keşfi | (kaldırıldı) |
| ❌ 10times API key başvurusu | (kaldırıldı) |
| ❌ TENTIMES_API_KEY env | (kaldırıldı) |
| ❌ Intent firma dedupe | (kaldırıldı) |
| ✅ Komşu stand hesabı | ✅ Kalır (Codex `isNeighborBooth` yazdı) |
| ✅ Komşu stand top 25 raporu | ✅ Kalır ([sprint-2-komsu-stand-top25.md](sprint-2-komsu-stand-top25.md)) |

### Kod tarafı

- **`backend/src/modules/lead-machine/fair/tentimes.client.ts`** — **dead code** olarak kalır, **silinmez** (silmek değişiklik kapsamını genişletir, gereksiz risk). `fair.job.ts` bunu çağırmıyor; Codex kullanmaz.
- Dosyanın başına şu yorum eklenmeli (Codex işi):
  ```typescript
  /**
   * @deprecated 2026-05-21 — 10times entegrasyonu drop edildi.
   * Detay: docs/teknik/10times-drop-karari.md
   * Public/free tier API yok; ziyaretçi intent verisi ihtiyacımız değil.
   * Messe Frankfurt public API exhibitor listesi yeterli.
   * Bu dosya tarihsel referans olarak korunur, çağrılmaz.
   */
  ```

### Doküman tarafı

- [docs/teknik/LEAD_MACHINE_RAPOR.md](LEAD_MACHINE_RAPOR.md) — "10times API" satırlarına "⚠️ doğrulanmadı, drop edildi" notu
- [docs/strateji/MARKET_PULSE_SAAS_PLANI.md](../strateji/MARKET_PULSE_SAAS_PLANI.md) — Bölüm 5'te "10times API" geçen yerler işaretlenir
- [docs/strateji/AUTOMECHANIKA_2026_PLANI.md](../strateji/AUTOMECHANIKA_2026_PLANI.md) Bölüm 3 — "Katman 2 — 10times intent" başlığı **DROP** notuyla işaretlenir
- [docs/teknik/10times-event-id-kesfi-notu.md](10times-event-id-kesfi-notu.md) — tarihsel referans olarak kalır, başına "DROP" işareti
- [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 2 — 10times satırları **silinir veya `~~strikethrough~~`**

---

## Ders Çıkarımı

Bu drop'un **niye bu noktaya kadar sürdüğü** önemli:

1. **Master plan'a temel doküman olarak girmişti** — orijinal "Fuar Visitor Kazıma.docx" (paspas repo'sundan) "10times API" diye yazmıştı. Bu varsayım baştan beri yanlıştı.
2. **Codex `tentimes.client.ts` kodu yazdı** — `env.TENTIMES_API_KEY` bekleyen bir fonksiyon. Kod yazıldıktan sonra "var olduğunu" varsaymak kolaylaştı.
3. **Sprint 0/1/2'de gerçeklik kontrolü yapılmadı** — anonim WebFetch 403 verdiğinde "bot bloklu, Avrasya hesabı ile çözülür" diye geçildi. **10times'ın gerçekten public API'ı olup olmadığı sorgulanmadı.**

### Önlem (gelecek için)

Yeni 3. taraf entegrasyon önerisi geldiğinde, planlamadan önce **5 dakikalık gerçeklik kontrolü**:
- 3. tarafın **kendi developer dokümantasyon sayfası** var mı?
- **Self-serve API key** alma akışı dokümante mi?
- En az **2 bağımsız tutorial** (StackOverflow / GitHub repo) var mı?
- Resmi npm/pip package var mı, son güncelleme tarihi?

Bu 4 sorudan **3'ü yes değilse**, entegrasyon kararına geçmeden önce **5 dakikalık WebFetch + npm search** yapılır.

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🔧 Fair modülü çeklist: [FAIR_MODULU_CEKLISTI.md](FAIR_MODULU_CEKLISTI.md)
- 🗺️ Komşu stand raporu (Sprint 2'nin gerçek değerli kısmı): [sprint-2-komsu-stand-top25.md](sprint-2-komsu-stand-top25.md)
- 📊 Sprint 1 precision (havuz analizi — 429 exhibitor zaten yeterli): [sprint-1-precision-raporu.md](sprint-1-precision-raporu.md)
- 📜 10times keşif notu (artık DROP — tarihsel): [10times-event-id-kesfi-notu.md](10times-event-id-kesfi-notu.md)
