Aşağıdaki sayfa, “DB Admin” alanında **tam veritabanı (full DB) yedekleme/içe aktarma** ve **modül bazlı (module) export/import** işlemlerini tek bir yerden yönetmek için tasarlanmış bir yönetim ekranıdır. Amacı, geliştirme–staging–prod arasında veri taşıma, hızlı rollback (snapshot), içerik taşınması (ör. sadece products), ve UI metinlerinin (site_settings ui_*) toplu yönetimini güvenli bir akışla sağlamaktır.

Açıklamayı 3 seviyede yapacağım:

1. Admin panelde kullanıcı gözüyle akış (hangi kart ne yapar)
2. Kod mimarisi: Frontend (RTK Query) ↔ Backend (Fastify routes/controller) ↔ DB (manifest)
3. Kritik dikkat noktaları (truncate, ilişkiler, asset’ler, ortam güvenliği, performans)

---

## 1) Admin panelde bu sayfa nasıl yönetilir?

Bu sayfa 4 ana bölüme ayrılır:

### A) Auth Gate (AdminDbAuthGate)

Bu bir “kapı”dır. Amaç:

* Kullanıcı auth durumu netleşmeden admin endpoint’lerine istek atılmasını engellemek (401 spam kesilir).
* Auth değilse `/login`’e yönlendirmek.
* Auth ise sayfayı render etmek ve alt bileşenlere “admin çağrıları yapılabilir mi?” bilgisini vermek.

**Kritik alan:** `adminSkip`

* `adminSkip=true` iken, “snapshots list” gibi admin sorguları RTK tarafında **skip** edilir.
* Bu sayede auth status stabilize olmadan gereksiz request atılmaz.

### B) Full DB işlemleri (FullDbHeader + FullDbImportPanel + SnapshotsPanel)

#### 1) FullDbHeader (Snapshot oluştur + Export)

Bu üst kart iki şey yapar:

**(i) Snapshot oluşturma**

* Kullanıcı “Snapshot etiketi” ve “Not” girip “Snapshot Oluştur” der.
* Backend `/admin/db/snapshots` endpoint’ine POST gider.
* Backend bir “DB dump” oluşturur ve snapshot listesine ekler.
* UI toast ile sonucu gösterir.

**Ne işe yarar?**

* Büyük riskli işlemler öncesi (import, truncate, modül import) güvenli geri dönüş noktası.
* “Rollback” için en hızlı yöntem.

**(ii) Full DB Export (SQL/JSON)**

* “SQL İndir”: `/admin/db/export` çağrılır → Blob olarak .sql indirilir.
* “JSON İndir”: `/admin/db/export?format=json` çağrılır → Blob olarak .json indirilir.

**Ne işe yarar?**

* Tam veritabanını dışarı alırsın.
* Başka ortama taşımak veya “manuel arşiv” için.

**UI detayları**

* İndirme işlemi `Blob → URL.createObjectURL → <a download>` ile yapılır.
* İsimlendirme `db_backup_YYYYMMDD_HHMM.ext` formatında.

#### 2) FullDbImportPanel (SQL Import)

Bu panelin amacı: tam veritabanına **SQL script uygulamak**.

3 farklı import modu var:

**(i) SQL Metni ile Import**

* Büyük SQL dump’ı textarea’ya yapıştırırsın.
* `truncateBefore` seçeneği: import öncesi tüm tabloları boşaltma
* `dryRun` seçeneği: “prova”; backend destekliyorsa transaction + rollback yaparak deneme

**(ii) URL ile Import**

* Bir `.sql` veya `.sql.gz` linki verirsin.
* Backend indirir ve uygular.
* `truncateBefore` ve `dryRun` burada da var.

**(iii) Dosyadan Import (multipart)**

* `.sql` veya `.gz` dosyası seçersin.
* Backend `/admin/db/import-file` ile dosyayı alır ve uygular.
* Burada “dryRun” yok (senin tiplerde de yok); sadece truncate var.

**Neden confirm var?**

* Bu işlemler geri alınamaz; yanlışlıkla prod DB silinmesin diye `window.confirm` ile son uyarı.

**Önemli:** Confirm SSR-safe yazılmış:

* `typeof window === 'undefined'` ise false döndürür.
* Böylece SSR’da patlamaz.

#### 3) SnapshotsPanel (Snapshot listesi + geri yükle + sil)

Bu panel snapshot’ları listeler:

* `/admin/db/snapshots` → GET
* Her satırda:

  * Etiket / not
  * Dosya adı
  * Oluşturulma tarihi
  * Boyut
  * “Geri Yükle” ve “Sil”

**Geri Yükle**:

* `/admin/db/snapshots/:id/restore` → POST
* Parametreler: `truncateBefore=true`, `dryRun=false`
* DB içeriği snapshot’taki dump ile **ezilir**.

**Sil**:

* `/admin/db/snapshots/:id` → DELETE

**Responsive davranış**

* XL+ ekranda tablo, küçük ekranlarda card layout.
* Sabit sütun genişlikleri ile “butonlar kırpılmasın” diye düzenlenmiş.

---

### C) ModuleTabs (Modül bazlı export/import)

Bu bölüm “Full DB yerine sadece bir modülün tablolarını” taşımaya yarar.

Örnek kullanım:

* Sadece `products` modülünü staging’den prod’a taşımak
* Sadece `site_settings`’i export edip UI metinlerini yönetmek
* Sadece `library` içeriklerini taşımak

Bu sistemin temeli: **moduleManifest.ts**
Orada her modül için `tablesInOrder` ve `truncateInOrder` tanımlarsın.

---

## 2) Kod mimarisi: RTK Query ↔ Fastify Routes ↔ DB Manifest

### A) Backend routes (admin.routes.ts)

Senin route dosyanda şu endpoint grupları var:

#### Full DB

* `GET  /admin/db/export`
* `POST /admin/db/import-sql`
* `POST /admin/db/import-url`
* `POST /admin/db/import-file`

#### Module export/import

* `GET  /admin/db/export-module`
* `POST /admin/db/import-module`

#### Site settings UI özel

* `GET  /admin/db/site-settings/ui-export`
* `POST /admin/db/site-settings/ui-bootstrap`

#### Manifest doğrulama

* `GET /admin/db/modules/validate`

#### Snapshot

* `GET    /admin/db/snapshots`
* `POST   /admin/db/snapshots`
* `POST   /admin/db/snapshots/:id/restore`
* `DELETE /admin/db/snapshots/:id`

Hepsinde `requireAuth` var; yani **admin giriş şart**.

### B) RTK Query endpoints (db_admin.endpoints.ts)

RTK dosyan bu endpoint’leri frontend’e “hook” olarak çıkarır:

**Full DB**

* `useExportSqlMutation()`
* `useExportJsonMutation()`
* `useImportSqlTextMutation()`
* `useImportSqlUrlMutation()`
* `useImportSqlFileMutation()`

**Snapshot**

* `useListDbSnapshotsQuery()`
* `useCreateDbSnapshotMutation()`
* `useRestoreDbSnapshotMutation()`
* `useDeleteDbSnapshotMutation()`

**Module**

* `useExportModuleMutation()`
* `useImportModuleMutation()`

**UI**

* `useExportSiteSettingsUiJsonQuery()`
* `useBootstrapSiteSettingsUiLocaleMutation()`

**Manifest validation**

* `useValidateModuleManifestQuery()`

#### Blob handling neden önemli?

Normal RTK Query JSON bekler. SQL dump ve JSON dump “dosya” olduğu için:

* `responseHandler: resp.arrayBuffer()`
* `transformResponse: new Blob([ab], {type: ...})`

Bu sayede indirme işlemi güvenli olur.

### C) moduleManifest.ts (DB allowlist ve sıra)

Manifest’in rolü:

* “Export/import edilebilir tablolar listesi” (allowlist)
* “Tablo sırası” (FK’ler yüzünden önemli)
* “Truncate sırası” (child → parent)

Örnek (library):

* Export order: `library` → `library_i18n` → `library_images` → `library_images_i18n` → `library_files`
* Truncate order: ters (önce child sil)

Bu sayede FK constraint’leri bozulmaz.

---

## 3) Bu sayfa ne işe yarar? (Pratik senaryolar)

### Senaryo 1: Riskli bir import öncesi güvenli alan

* Snapshot oluştur
* Import yap (truncate açık/kapalı)
* Sorun olursa snapshot restore

### Senaryo 2: Staging’den prod’a sadece “products” taşı

* Module export `products` al
* Prod’da module import uygula
* Bu şekilde `users`, `support`, vb. etkilenmez.

### Senaryo 3: UI text yönetimi (site_settings ui_*)

* UI export ile tüm locale’lerde ui_* key’lerini JSON olarak çek
* Bootstrap ile bir locale’i diğerinden çoğalt (örn. de → en)

---

## 4) Tüm alanlar ve dikkat edilmesi gerekenler

### A) TruncateBefore (en kritik bayrak)

**Ne yapar?**

* Import öncesi tabloları boşaltır.

**Risk**

* Prod’da yanlışlıkla açılırsa tüm DB sıfırlanır.

**Öneri**

* Prod ortamında “truncateBefore” varsayılanını backend’de ekstra kontrolle sınırla:

  * “ENV=production ise ikinci bir onay token’ı gereksin”
  * veya “sadece superadmin rolü” gibi

### B) DryRun

**Ne yapar?**

* SQL’i deneme amaçlı çalıştırıp rollback yapar (backend destekliyorsa).

**Dikkat**

* Büyük dump’larda transaction maliyeti çok yüksek olabilir.
* MySQL’de bazı DDL işlemleri implicit commit yapar; dryRun her şeyi kapsamayabilir.

### C) Snapshots restore (tam overwrite)

* Restore, mevcut DB içeriğini ezdiği için:

  * Önce mevcut state için de snapshot al (çift yönlü güvenlik).
* Snapshot dosyalarının disk alanı büyür:

  * retention politikası: örn. son 20 snapshot sakla

### D) Assets / storage bağımlılıkları

Modül import/export yaparken şu problem çıkar:

* `products` import edersin ama `storage_assets` yoksa:

  * `storage_asset_id`’ler boşa düşer
  * image_url çalışsa bile asset registry eksik kalır

**Çözüm stratejisi**

* Ya “storage” modülünü de birlikte taşı
* Ya da import sırasında “asset id’leri null’a çek / reconcile et” gibi bir mekanizma ekle

### E) Locale ve i18n bütünlüğü

* `product_i18n` gibi tablolar eksik locale ile taşınırsa frontend fallback çalışsa bile içerik eksik görünür.
* Manifest order doğru olmalı: parent → i18n → gallery → gallery_i18n

### F) Güvenlik

Bu endpoint’ler çok güçlü.
Öneriler:

* `requireAuth` yanında `requireRole('admin')` gibi rol kontrolü
* Audit log: kim export aldı, kim import yaptı, ne zaman snapshot restore etti
* Rate limit / CSRF önlemleri (özellikle admin panel cookie auth ise)

### G) Performans

* SQL export/import büyük payload üretir.
* Sunucu timeout ve body limit ayarları (Fastify / reverse proxy) önemli:

  * `client_max_body_size` (nginx)
  * Fastify bodyLimit
  * gzip/streaming

---

## Sonuç: Bu sayfanın “kıymeti”

* **Full DB**: sistemin tamamı için yedek/restore/import
* **Snapshots**: hızlı rollback, riskli işlemlerden önce güvence
* **Modules**: kontrollü veri taşıma (sadece products, sadece library vb.)
* **site_settings UI ops**: i18n UI metinlerini yönetmek için “özel araç”

---

İstersen bir sonraki adımda şu iki şeyi de netleştirip uygulayalım:

1. **Modül bazlı yönetim ekranı**: her modül için (products/services/library…) “listele / export / import / truncate / validate” butonları ve durum panelleri
2. **Prod güvenlik kilidi**: truncate/restore/import için ikinci bir “admin confirm phrase” (ör. `TYPE: RESTORE-PROD`) ya da “2FA token” gibi

Hangisinden başlayalım: UI (modül kartları) mı, yoksa backend güvenlik kilidi mi?
