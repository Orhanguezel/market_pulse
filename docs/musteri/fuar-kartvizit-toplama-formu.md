# Fuar Walk-in Kartvizit Toplama — Form + Akış

> **Tarih:** 2026-05-21
> **Sahibi:** 🧠 Claude (Sprint 5 — fuar haftası operasyon)
> **Hedef okuyucu:** Avrasya stand çalışanları + ⚙️ Codex (import scripti)
> **Bağlı:** [AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md) Sprint 5 + Sprint 6
> **İlke:** Over-engineering yok — Google Form yeterli, sonradan import.

---

## Senaryo

Avrasya standına **4 günde ~80 walk-in** beklenir (önceden randevu almamış, merak edip uğrayan). Stand çalışanı bunların kartvizitini toplar, **mümkün olduğunca hızlı** kimliğini kaydeder. Detaylı sohbet de stand brifing kartı yerine bu **kısa form** olur.

Akış:
```
Walk-in ziyaretçi standa geldi
        ↓
Stand çalışanı 30 sn ayırt eder (aday mı turist mi)
        ↓
Aday ise → kısa görüşme (5-10 dk) + form doldur
        ↓
Akşam: tüm formlar → fotoğraf → admin panel'e yükle
        ↓
Sprint 6 (post-show): ⚙️ Codex import scripti çalıştırır → lead_candidates'a `channel='trade_fair_in_person'` ile düşer
```

---

## Form — Tek Sayfa A5

Stand'da 200-300 kopya basılı. Her ziyaretçi için 1 sayfa. Yazıcı kağıdı tasarrufu için A5 (yarım A4) yeter.

### Form içeriği (basılı şablon)

```
┌────────────────────────────────────────────────┐
│  AVRASYA / PROMATS — Automechanika 2026 Stand │
│                                                │
│  Tarih: __/09/2026     Stand çalışanı: _______│
│  Saat: ____:____                               │
│                                                │
│  ──────────────────────────────────────────   │
│  FİRMA BİLGİSİ (KARTVİZİTLE BİRLİKTE)         │
│                                                │
│  Şirket:   ________________________________    │
│  Ülke:     ________________________________    │
│  Kişi adı: ________________________________    │
│  Pozisyon: ________________________________    │
│  Email:    ________________________________    │
│  Tel/WhatsApp: ____________________________   │
│                                                │
│  ──────────────────────────────────────────   │
│  İŞ BİLGİSİ                                    │
│                                                │
│  ☐ Distribütör  ☐ İthalatçı  ☐ Toptancı       │
│  ☐ E-com seller ☐ Üretici   ☐ Diğer          │
│                                                │
│  Mevcut paspas tedarikçisi (varsa): _________  │
│                                                │
│  İlgi alanı (birden fazla işaretle):           │
│  ☐ Universal paspas ☐ Vehicle-specific         │
│  ☐ TPE   ☐ PVC   ☐ Premium                   │
│  ☐ Boot liner ☐ Bagaj örtüsü                  │
│  ☐ Private label   ☐ ODM                       │
│  ☐ Numune isterim                              │
│                                                │
│  ──────────────────────────────────────────   │
│  STAND ÇALIŞAN NOTU (max 2 satır)             │
│                                                │
│  ____________________________________________ │
│  ____________________________________________ │
│                                                │
│  Sıcaklık:  ⚪ Soğuk  ⚪ Sıcak  ⚪ Kapanış yakın│
│                                                │
│  Takip:                                        │
│  ⚪ Mail at  ⚪ Numune gönder                   │
│  ⚪ Telkonferans  ⚪ Takip yok                  │
│                                                │
│  📎 KARTVİZİT BURAYA ZIMBALA                  │
│                                                │
└────────────────────────────────────────────────┘
```

### Niye basılı + zımba?

- Kartvizit fiziksel olarak forma takılır → kayıp riski sıfır
- Stand çalışanı tek elinde tüm bilgi
- Akşam fotoğraflarken **her sayfa tek shot** (kartvizit + form)
- Dijital form (tablet) denenmiş ama 2 sorun var:
  1. Stand çalışanın eli dolu — kartvizit + ürün + numune
  2. Wi-Fi/4G stand'da yavaş — beklemek 2 dk kaybettirir

---

## Akşam İşlemi (her gün 18:00 sonrası)

Stand operasyon SOP'undaki [§5 Akşam Review](fuar-stand-operasyon-sop.md)'den:

1. **Tüm doldurulmuş formları topla** (genelde 20-30/gün × 4 gün = 100-120 toplam)
2. **Fotoğrafla** — her sayfa için tek shot, telefon kamerası yeter (1080p)
3. **Google Drive klasörüne yükle:** `Automechanika 2026 / Walk-in formlar / Gün-N/`
4. **WhatsApp gruba haber:** "Bugün 23 walk-in form. Drive yüklendi."

---

## Codex İçin — Import Scripti (Sprint 6 işi)

Fuar bittikten sonra (13-14 Eylül) Codex bu scripti çalıştırır:

```typescript
// scripts/fair-walkin-import.ts (yeni)

import { parseFormWithOCR } from './ocr-helper';  // veya manuel JSON girdi
import { insertCandidate } from '../backend/src/modules/lead-machine/_shared/db';

interface WalkinForm {
  date: string;             // "2026-09-09"
  company: string;
  country: string;
  contact_name: string;
  contact_title: string;
  email: string;
  phone: string;
  firm_type: 'distribütör' | 'ithalatçı' | 'toptancı' | 'ecom' | 'üretici' | 'diğer';
  current_supplier: string | null;
  interests: string[];      // ['universal', 'tpe', 'private_label']
  sample_request: boolean;
  staff_note: string;
  warmth: 'cold' | 'warm' | 'closing';
  follow_up: 'mail' | 'sample' | 'telcall' | 'none';
  staff_member: string;
}

async function importWalkinForm(form: WalkinForm) {
  // Mevcut aday mı kontrol (Sprint 1 taramasından zaten gelmiş olabilir)
  const existing = await findCandidateByDomain(extractDomainFromEmail(form.email));

  if (existing) {
    // Mevcut adayı güncelle — in-person flag + walk-in notları
    await updateCandidate(existing.id, {
      raw_data: {
        ...existing.raw_data,
        walk_in: {
          date: form.date,
          staff_note: form.staff_note,
          warmth: form.warmth,
          follow_up: form.follow_up,
          interests: form.interests,
        },
      },
    });
    return { action: 'updated', candidate_id: existing.id };
  }

  // Yeni walk-in aday
  const candId = await insertCandidate({
    channel: 'trade_fair_in_person',  // Sprint 6 yeni channel
    name: form.company,
    country: countryNameToIso(form.country),
    email: form.email,
    phone: form.phone,
    contactName: form.contact_name,
    rawData: {
      walk_in: {
        date: form.date,
        firm_type: form.firm_type,
        current_supplier: form.current_supplier,
        interests: form.interests,
        sample_request: form.sample_request,
        staff_note: form.staff_note,
        warmth: form.warmth,
        follow_up: form.follow_up,
        staff_member: form.staff_member,
      },
      source: 'walk_in_form_v1',
    },
    aiSummary: `Walk-in @ ${form.date}: ${form.firm_type}. ${form.staff_note}`,
    leadScore: form.warmth === 'closing' ? 8.5 : form.warmth === 'warm' ? 6.5 : 4.0,
    decision: null,
    icpId: null,  // ICP filtre uygulanmaz — stand çalışan zaten sıcaklık verdi
  });

  return { action: 'inserted', candidate_id: candId };
}
```

### `lead_candidates.channel` yeni değer

```sql
ALTER TABLE lead_candidates
  MODIFY COLUMN channel VARCHAR(30) NOT NULL;
-- artık values: 'amazon' | 'b2b_directory' | 'trade_fair' | 'trade_fair_in_person' | 'icp_match'
```

Codex bunu `_shared/db.ts` `LeadChannel` type'ına ekler.

---

## OCR Alternatifi (opsiyonel — Faz 2)

100 form fotoğrafından elle veri girişi ~2 saat sürer. Bunu otomatize etmek için:

**Faz 2 önerisi:** Avrasya export ekibi formları fotoğrafladıktan sonra:
1. Google Cloud Vision OCR ile metin çıkar
2. GPT-4o-mini ile form alanlarını parse et (yapılandırılmış output)
3. Manuel doğrulama UI (admin panel'de tek tek onay)

**Maliyet:**
- Google Vision: 1000 fotoğraf/ay free, sonra $1.50/1000
- GPT-4o-mini: 100 form × $0.0001 = $0.01

Şu an Sprint 5/6'da **gereksiz** — manuel giriş 2 saat. Sonraki fuarlarda hacim artarsa eklenir.

---

## QR Kod Alternatifi (basit, opsiyonel)

Form üst köşesine **QR kod** basıp ziyaretçinin telefonu ile kendi formu doldurduğu Google Form'a yönlendirmek de mümkün:

```
QR kod hedef: https://forms.gle/automechanika-avrasya-2026
Form içeriği: yukarıdaki basılı formun digital eşi
```

Avantaj:
- Stand çalışan elinde kağıt yok
- Veri direkt Google Sheets'e düşer → Codex import otomatik

Dezavantaj:
- Ziyaretçi telefonu ile doldurmak istemeyebilir (yabancı bir stand'da küçük bilgi yazımı zahmetli)
- Wi-Fi/4G yavaş — frustration
- Kartvizit yine de ayrıca toplanır (zımba yerine cüzdana atılır → kaybolma riski)

**Önerim:** İlk fuar (2026) için **basılı + zımba** kullan. Sonraki fuarlar için QR alternatifini değerlendir.

---

## Sprint 5 Çıkış (fuar öncesi)

- [ ] **🧠 Claude veya Orhan** — Form PDF olarak hazırla (Word/Canva, basitçe)
- [ ] **Avrasya** — Form'u 300 kopya bastır (printshop, 50-100 TL)
- [ ] **Avrasya** — Standa götür, klipbord + kalem + zımba teli + makas yanında
- [ ] **🧠 Claude + Avrasya** — Stand çalışan eğitimi: form nasıl doldurulur, sıcaklık nasıl değerlendirilir (T-3 gün)

---

## Sprint 6 (post-show)

- [ ] **Avrasya** — Tüm dolu formlar Google Drive'a yüklendi
- [ ] **🧠 Claude veya Orhan** — Manuel olarak formları okuyup `walkin-import.json` dosyasına aktarım (2 saat iş)
- [ ] **⚙️ Codex** — `scripts/fair-walkin-import.ts` çalıştırır, lead_candidates'a düşer
- [ ] **⚙️ Codex** — `channel='trade_fair_in_person'` adaylar follow-up cron'una dahil ([automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md))

---

## Bağlantılar

- 📋 Ana çeklist: [../../AUTOMECHANIKA_2026_CEKLIST.md](../../AUTOMECHANIKA_2026_CEKLIST.md)
- 🛠️ Stand operasyon SOP (akşam review akışı): [fuar-stand-operasyon-sop.md](fuar-stand-operasyon-sop.md)
- 🃏 Stand brifing kart (randevulu adaylar için, bu form walk-in için): [../teknik/stand-brifing-kart-sablon.md](../teknik/stand-brifing-kart-sablon.md)
- 🔄 Follow-up sequence (walk-in adaylar da bu sequence'a girer): [automechanika-2026-followup-templates.md](automechanika-2026-followup-templates.md)
