-- =============================================================
-- 033 — İhracat Radarı mavi tema (design_tokens override)
-- İşletmeniyönet pazarlama yüzeyiyle tüm site tutarlı olsun diye
-- aktif design_tokens + branding mavi (#1e40af) + Poppins yapılır.
-- IDEMPOTENT (ON DUPLICATE KEY UPDATE) — canlıda fresh seed GEREKMEZ,
-- veri silmeden çalıştırılabilir. 013'ün coral temasını override eder.
-- =============================================================

SET NAMES utf8mb4;

INSERT INTO site_settings (id, `key`, locale, value) VALUES
('01000000-0000-4000-8000-000000000030', 'active_theme_preset', '*', 'isletmeniyonet-blue'),
('01000000-0000-4000-8000-000000000032', 'design_tokens', '*', '{"version":"2","colors":{"brand_primary":"#1e40af","brand_primary_dark":"#15317f","brand_primary_light":"#3b5bd9","brand_secondary":"#2563eb","brand_secondary_dim":"#1e40af","brand_secondary_light":"#60a5fa","brand_accent":"#0f172a","gold_50":"#eff6ff","gold_100":"#dbeafe","gold_200":"#bfdbfe","gold_300":"#93c5fd","gold_400":"#60a5fa","gold_500":"#3b82f6","gold_600":"#2563eb","gold_700":"#1d4ed8","gold_800":"#1e40af","gold_900":"#1e3a8a","sand_50":"#f8fafc","sand_100":"#f1f5f9","sand_200":"#e2e8f0","sand_300":"#cbd5e1","sand_400":"#94a3b8","sand_500":"#64748b","sand_600":"#475569","sand_700":"#334155","sand_800":"#1e293b","sand_900":"#0f172a","bg_base":"#f8fafc","bg_deep":"#eef2f7","bg_surface":"#ffffff","bg_surface_high":"#eff6ff","text_primary":"#0f172a","text_secondary":"#334155","text_muted":"#64748b","text_muted_soft":"#94a3b8","border":"rgba(15,23,42,0.16)","border_soft":"rgba(15,23,42,0.08)","success":"#16a34a","warning":"#d97706","error":"#dc2626","info":"#2563eb","bg_base_dark":"#0f172a","bg_deep_dark":"#020617","bg_surface_dark":"#111827","bg_surface_high_dark":"#1f2937","text_primary_dark":"#f8fafc","text_secondary_dark":"#cbd5e1","text_muted_dark":"#94a3b8"},"typography":{"font_display":"var(--font-poppins), system-ui, sans-serif","font_serif":"var(--font-source-serif), Georgia, serif","font_sans":"var(--font-poppins), system-ui, sans-serif","font_mono":"var(--font-ibm-mono), ui-monospace, monospace","base_size":"16px"},"radius":{"xs":"4px","sm":"8px","md":"12px","lg":"16px","xl":"24px","pill":"9999px"},"shadows":{"soft":"0 2px 20px rgba(15,23,42,0.06)","card":"0 8px 40px rgba(15,23,42,0.10)","glow_primary":"0 0 50px rgba(30,64,175,0.20)","glow_gold":"0 0 30px rgba(37,99,235,0.14)"},"branding":{"app_name":"İhracat Radarı","tagline":"İhracat ve İş Geliştirme Platformu","tagline_en":"Export and business growth platform.","logo_url":"/ihracat-radari-logo.svg","favicon_url":"","theme_color":"#1e40af","theme_color_dark":"#0f172a","og_image_url":"/img/og-default.jpg"}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
