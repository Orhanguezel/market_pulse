# E3 Adim 2 - Triage/Fix Baslatma Mesaji

Asagidaki mesaji E3 raporu geldikten hemen sonra kullan:

```text
E3 raporunu triage edip fix turunu baslat.

Kullanilacak dosyalar:
- docs/E3_TRIAGE_REPORT_READY.md
- docs/E3_BUG_TRIAGE_TEMPLATE.md
- docs/E3_FIX_QUEUE.md
- docs/E3_SMOKE_TEST_COMMANDS.md

Yapilacaklar:
1) E3 raporundaki tum bulgulari P0-P3 olarak siniflandir.
2) Her FAIL icin ticket ac (URL, beklenen, mevcut, repro, kanit).
3) API kaynakli kapanamayanlari blocked-by-api etiketle.
4) E3_FIX_QUEUE tablosunu doldurup P0/P1 maddelerini in_progress yap.
5) P0/P1 fixlerinden sonra smoke + build dogrulamasi calistir.

Beklenen cikti:
- Guncellenmis triage raporu
- Guncellenmis fix queue
- Kapatilan buglar + acik kalan buglar ozeti
```
