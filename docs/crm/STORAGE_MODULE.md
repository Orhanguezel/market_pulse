# Dashboard Dosya Deposu

`/{locale}/belgeler` artık `crm_documents` URL kayıtlarını değil, ortak Storage motorunu kullanır.

## Yetki ve izolasyon

- User API: `/api/v1/storage/my/*`
- Guard: `requireAuth + requireModule('crm')`
- Her dosya hem `user_id` hem tenant+kullanıcıdan türetilen özel bucket ile filtrelenir.
- Kullanıcı bucket adı veya başka kullanıcı ID'si gönderemez.
- Admin `/admin/storage` ekranı bütün storage varlıklarını yönetmeye devam eder.

## Özellikler

- Çoklu sürükle-bırak yükleme, dosya başına 50 MB sınırı
- Resim, PDF, Word, Excel/CSV, video, ZIP ve genel binary dosyalar
- Arama, MIME türü ve klasör filtresi
- Mantıksal klasörleme ve yeniden adlandırma
- Resim/PDF önizleme; diğer türlerde açma/indirme
- Kalıcı silme ve onay dialog'u
- Local veya Cloudinary storage driver desteği

## Endpoint'ler

- `GET /storage/my/assets`
- `GET /storage/my/assets/:id`
- `GET /storage/my/assets/:id/content` (owner kontrollü önizleme/indirme)
- `POST /storage/my/assets` (multipart)
- `PATCH /storage/my/assets/:id`
- `DELETE /storage/my/assets/:id`
- `GET /storage/my/folders`

Fresh seed şeması: `backend/src/db/seed/sql/040_storage_schema.sql`.
