# CRM Doküman Durumu

Son çapraz kontrol: 2026-07-11

| Belge | Durum | Not |
|---|---|---|
| `MVP_PLAN.md` | Uygulandı | CRM çekirdeği, tenant/owner izolasyonu ve lead dönüşümü mevcut. Tarihsel mimari karar belgesi olarak korunur. |
| `DASHBOARD_PLAN.md` | Tamamlandı | Güncel kabul checklistine dönüştürüldü; açık yerel madde yok. |
| `ADMIN_TO_USER_DASHBOARD_PLAN.md` | Tamamlandı | Faz 0–4 maddeleri işaretli; job owner alanı güncel `owner_user_id` adıyla düzeltildi. |
| `DEPLOY_FRESH_SEED_OWNER_BACKFILL.md` | Güncel | Owner backfill ve paylaşımlı gümrük veri gölü preflight'ı içerir. |
| `FIRMA_BULUCU_CAPRAZ_KONTROL_CEKLIST.md` | Bir yerel madde açık | Yalnız F8: Firma Bulucu'nun İngilizce/Almanca i18n kapsamı. |
| `GMAIL_MAIL_ENTEGRASYONU_PLAN.md` | Yerel kod tamamlandı | Açık maddeler Google Cloud/credential/CASA dış operasyonları ve opsiyonel Pub/Sub'dır. |

## Yerel olarak tamamlanan son açıklar

- Generic `/fair/run` route ve kullanılmayan RTK mutation'ları kaldırıldı.
- Duplicate outreach sayfası canonical `/outreach/drafts` adresine yönlendirildi.
- Aday kanal filtreleri admin/frontend kontratına hizalandı.
- `lead_search_jobs.owner_user_id` fresh-seed şeması ve uygulama kontratına taşındı.
- `customs:lake:check` deploy preflight'ı eklendi; paylaşımlı lake stratejisi deploy planına işlendi.
- Eski dashboard planı gerçek uygulama durumuyla senkronlandı.

## Açık işler

1. Firma Bulucu'nun beş ekranı için TR/EN/DE metin kataloğu ve locale-duyarlı tarih/arama dönüşümleri.
2. Google Cloud Console operasyonları: proje/consent/API/OAuth client/test kullanıcıları ve eski credential iptali.
3. 100 kullanıcı öncesi Google doğrulama/CASA; Gmail Pub/Sub ise MVP dışı opsiyoneldir.
