-- =============================================================
-- 034 — İhracat Radarı menu_items seed
-- IY pazarlama yuzeyi DB'ye baglanirken header/footer icin
-- idempotent baslangic menusu. Sabit UUID'ler sayesinde live seed
-- tekrar calistirilabilir.
-- =============================================================

SET NAMES utf8mb4;

INSERT INTO menu_items
  (id, parent_id, type, page_id, location, section_id, icon, order_num, is_active, site_id)
VALUES
  ('03400000-0000-4000-8000-000000000001', NULL, 'custom', NULL, 'header', NULL, NULL, 10, 1, NULL),
  ('03400000-0000-4000-8000-000000000002', NULL, 'custom', NULL, 'header', NULL, NULL, 20, 1, NULL),
  ('03400000-0000-4000-8000-000000000003', NULL, 'custom', NULL, 'header', NULL, NULL, 30, 1, NULL),
  ('03400000-0000-4000-8000-000000000004', NULL, 'custom', NULL, 'header', NULL, NULL, 40, 1, NULL),
  ('03400000-0000-4000-8000-000000000005', NULL, 'custom', NULL, 'header', NULL, NULL, 50, 1, NULL),
  ('03400000-0000-4000-8000-000000000006', NULL, 'custom', NULL, 'header', NULL, NULL, 60, 1, NULL),
  ('03400000-0000-4000-8000-000000000007', NULL, 'custom', NULL, 'header', NULL, NULL, 70, 1, NULL),
  ('03400000-0000-4000-8000-000000000008', NULL, 'custom', NULL, 'header', NULL, NULL, 80, 1, NULL),
  ('03400000-0000-4000-8000-000000000009', NULL, 'custom', NULL, 'header', NULL, NULL, 90, 1, NULL),
  ('03400000-0000-4000-8000-000000000101', NULL, 'custom', NULL, 'footer', NULL, NULL, 10, 1, NULL),
  ('03400000-0000-4000-8000-000000000102', NULL, 'custom', NULL, 'footer', NULL, NULL, 20, 1, NULL),
  ('03400000-0000-4000-8000-000000000103', NULL, 'custom', NULL, 'footer', NULL, NULL, 30, 1, NULL),
  ('03400000-0000-4000-8000-000000000104', NULL, 'custom', NULL, 'footer', NULL, NULL, 40, 1, NULL),
  ('03400000-0000-4000-8000-000000000105', NULL, 'custom', NULL, 'footer', NULL, NULL, 50, 1, NULL),
  ('03400000-0000-4000-8000-000000000106', NULL, 'custom', NULL, 'footer', NULL, NULL, 60, 1, NULL)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  type = VALUES(type),
  page_id = VALUES(page_id),
  location = VALUES(location),
  section_id = VALUES(section_id),
  icon = VALUES(icon),
  order_num = VALUES(order_num),
  is_active = VALUES(is_active),
  site_id = VALUES(site_id);

INSERT INTO menu_items_i18n
  (id, menu_item_id, locale, title, url)
VALUES
  ('03410000-0000-4000-8000-000000000001', '03400000-0000-4000-8000-000000000001', 'tr', 'Ana Sayfa', '/tr'),
  ('03410000-0000-4000-8000-000000000002', '03400000-0000-4000-8000-000000000002', 'tr', 'Hizmetler', '/tr/hizmetler'),
  ('03410000-0000-4000-8000-000000000003', '03400000-0000-4000-8000-000000000003', 'tr', 'CRM', '/tr/hizmetler/crm-yazilimi'),
  ('03410000-0000-4000-8000-000000000004', '03400000-0000-4000-8000-000000000004', 'tr', 'İhracat', '/tr/hizmetler/uctan-uca-ihracat-yonetimi'),
  ('03410000-0000-4000-8000-000000000005', '03400000-0000-4000-8000-000000000005', 'tr', 'E-Ticaret', '/tr/hizmetler/e-ticaret-ve-pazaryeri-paketi'),
  ('03410000-0000-4000-8000-000000000006', '03400000-0000-4000-8000-000000000006', 'tr', 'Eğitimler', '/tr/hizmetler/kurumsal-egitim-paketi'),
  ('03410000-0000-4000-8000-000000000007', '03400000-0000-4000-8000-000000000007', 'tr', 'Paketler', '/tr/hizmetler/b2b-musteri-bulma-paketi'),
  ('03410000-0000-4000-8000-000000000008', '03400000-0000-4000-8000-000000000008', 'tr', 'Kurumsal', '/tr/hizmetler/kurumsal-hakkimizda'),
  ('03410000-0000-4000-8000-000000000009', '03400000-0000-4000-8000-000000000009', 'tr', 'Teklif Al', '/tr/teklif-al'),
  ('03410000-0000-4000-8000-000000000101', '03400000-0000-4000-8000-000000000101', 'tr', 'Hizmetler', '/tr/hizmetler'),
  ('03410000-0000-4000-8000-000000000102', '03400000-0000-4000-8000-000000000102', 'tr', 'CRM ve B2B', '/tr/hizmetler/crm-yazilimi'),
  ('03410000-0000-4000-8000-000000000103', '03400000-0000-4000-8000-000000000103', 'tr', 'E-Ticaret ve Eğitim', '/tr/hizmetler/e-ticaret-ve-pazaryeri-paketi'),
  ('03410000-0000-4000-8000-000000000104', '03400000-0000-4000-8000-000000000104', 'tr', 'Paketler ve Kurumsal', '/tr/hizmetler/ihracata-hazirlik-paketi'),
  ('03410000-0000-4000-8000-000000000105', '03400000-0000-4000-8000-000000000105', 'tr', 'Blog', '/tr/blog'),
  ('03410000-0000-4000-8000-000000000106', '03400000-0000-4000-8000-000000000106', 'tr', 'İletişim', '/tr/contact')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  url = VALUES(url);

INSERT INTO site_settings (id, `key`, locale, value) VALUES
  (
    '03420000-0000-4000-8000-000000000001',
    'homepage_hero',
    'tr',
    '{"eyebrow":"İhracat Radarı","title":"Firmanız için ihtiyaç duyduğunuz tüm çözümler tek platformda","description":"İhracat, CRM, B2B müşteri bulma, e-ticaret, pazaryeri yönetimi, eğitim ve dijital dönüşüm süreçleri için uygulanabilir iş geliştirme sistemi.","primaryCta":{"label":"Teklif al","href":"/tr/teklif-al"},"secondaryCta":{"label":"Hizmetleri incele","href":"/tr#iy-hizmetler"},"image":"/iy/homeBg.png"}'
  ),
  (
    '03420000-0000-4000-8000-000000000002',
    'homepage_sections',
    'tr',
    '[{"id":"iy-hizmetler","type":"service_grid","title":"Şirketinizin büyüme sürecini birlikte planlayalım","description":"İhracat, CRM, B2B müşteri bulma, e-ticaret, kurumsal eğitim, DYS ve dijital dönüşüm hizmetlerini şirketinizin genel büyüme sistemi içinde birlikte değerlendiriyoruz.","items":[{"title":"İhracata Hazırlık","text":"İngilizce firma profili, ürün açıklamaları, web sitesi yapısı, teklif formatı ve ihracat başlangıç süreci.","href":"/tr/hizmetler/ihracata-hazirlik-paketi"},{"title":"B2B Müşteri Bulma","text":"GTİP / HS kodu, ürün adı, konşimento verileri, LinkedIn ve karar verici kişi araştırması.","href":"/tr/hizmetler/b2b-musteri-bulma-paketi"},{"title":"CRM Kurulumu","text":"Müşteri adayı, teklif, satış aşaması, görev, takip tarihi ve raporlama yapısını düzenli hale getirme.","href":"/tr/hizmetler/crm-kurulum-paketi"},{"title":"Dış Ticaret Departmanı","text":"Müşteri bulma, teklif, proforma, ödeme, nakliye, evrak ve sevkiyat süreçlerinde dışarıdan operasyonel destek.","href":"/tr/hizmetler/dis-ticaret-departmani-paketi"}]},{"id":"iy-surec","type":"steps","title":"Önce ihtiyacı belirliyor, sonra uygulanabilir plan hazırlıyoruz","items":[{"title":"Ön Değerlendirme","text":"Şirketinizin mevcut durumu, ürünleri, satış yapısı, ihracat hedefi ve dijital ihtiyaçları değerlendirilir."},{"title":"Hizmet Planı","text":"İhracat, CRM, müşteri bulma, e-ticaret veya eğitim ihtiyacınıza göre uygun hizmet kapsamı belirlenir."},{"title":"Uygulama","text":"Belirlenen çalışma kapsamında içerik, CRM yapısı, müşteri araştırması, eğitim veya operasyon süreci başlatılır."},{"title":"Takip ve Raporlama","text":"Yapılan çalışmalar müşteri listesi, CRM, rapor, takip tarihi veya süreç notlarıyla ölçülebilir hale getirilir."}]},{"id":"iy-paketler","type":"package_grid","title":"İhtiyacınıza göre planlanan hizmet paketleri","items":[{"title":"İhracata Hazırlık Paketi","href":"/tr/hizmetler/ihracata-hazirlik-paketi"},{"title":"B2B Müşteri Bulma Paketi","href":"/tr/hizmetler/b2b-musteri-bulma-paketi"},{"title":"CRM Kurulum Paketi","href":"/tr/hizmetler/crm-kurulum-paketi"},{"title":"Kurumsal Eğitim Paketi","href":"/tr/hizmetler/kurumsal-egitim-paketi"}]}]'
  ),
  (
    '03420000-0000-4000-8000-000000000003',
    'homepage_banners',
    'tr',
    '[{"id":"iy-final-cta","title":"Şirketiniz için doğru hizmet kapsamını birlikte belirleyelim","description":"İhtiyacınızı anlatın, size uygun hizmet veya paket yapısını birlikte oluşturalım.","primaryCta":{"label":"Teklif al","href":"/tr/teklif-al"},"secondaryCta":{"label":"Bizi arayın","href":"tel:+905386164880"}}]'
  )
ON DUPLICATE KEY UPDATE
  value = VALUES(value);
