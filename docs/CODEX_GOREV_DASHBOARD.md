# CODEX GÖREVİ — CRM Dashboard Backend (summary + entitlements/me)

> **Rol:** Codex (backend). Tasarım: `docs/crm/DASHBOARD_PLAN.md` (bağlayıcı).
> **Sınır:** Sadece `backend/`. Frontend dashboard (app shell + UI + recharts) Claude'da.
> **Konvansiyon:** tenant_key JWT'den; tüm sorgular tenant-scoped; `bun run build` + `bun test` yeşil.

## Bağlam
`/{locale}/dashboard` CRM ana ekranına dönüşüyor (referans: işletmeniyönet salecrm). Frontend
welcome kartı + 6 istatistik kartı + 3 grafik için TEK bir özet endpoint'ine ihtiyaç duyuyor.
"Tam abone" — şimdilik tüm modüller görünür; entitlements/me ileride sidebar filtresi için.

## A. `GET /crm/dashboard/summary`
- Guard: `requireModule('crm')` + tenant scope (customer erişebilir, admin-only DEĞİL).
- Tek sorgu setiyle (COUNT'lar) döndür — N+1 yok. Tüm WHERE'lerde `tenant_key = ?`.
- Yanıt kontratı (SABİT — frontend buna bağlanacak):
```jsonc
{
  "counts": {
    "accounts": 0,            // COUNT crm_accounts
    "contacts": 0,            // COUNT crm_contacts
    "leads": 0,               // COUNT lead_candidates (status<>'rejected')
    "deals_open": 0,          // crm_deals status='open'
    "deals_won": 0,           // crm_deals status='won'
    "activities_pending": 0,  // crm_activities done=0
    "quotes": 0               // şimdilik 0 (Teklifler tablosu yok) — ileride deal stage='quote'
  },
  "pending": { "quotes": 0, "open_deals": 0 },   // welcome kartı: "X Bekleyen Teklif & Y Açık Satış Fırsatı"
  "sales_summary": [ { "month": "2026-01", "amount": 0 } ],  // son 6 ay crm_deals won SUM(amount) GROUP BY ay
  "status_breakdown": [ { "label": "Müşteri", "count": 0 }, { "label": "Potansiyel", "count": 0 },
                        { "label": "Satış Fırsatı", "count": 0 }, { "label": "Sipariş", "count": 0 } ],
  "totals": { "records": 0 }   // accounts+contacts+leads+deals toplamı
}
```
- Modül: `backend/src/modules/crm/` içine `dashboard.service.ts` + router'a `app.get('/crm/dashboard/summary', ...)`.
- Tablo eksikse (quotes/orders) 0 döndür — kırma. Mevcut: crm_accounts/contacts/deals/activities, lead_candidates.

## B. `GET /entitlements/me`
- tenant'ı JWT/ALS'den çöz (getActiveTenantKey) → o tenant'ın `tenant_modules` aktif (status IN trial,active
  & expires geçmemiş) module_key listesi + catalog adları. super-admin/yoksa tümünü döndürebilir.
- Yanıt: `{ "modules": ["leads","crm","email-marketing"], "tenant_key": "gzltek" }`
- Frontend faz 2'de sidebar filtresi için kullanacak (faz 1'de tüm modüller gösterilecek).

## Kabul kriterleri
- [ ] `/crm/dashboard/summary` tenant-scoped, requireModule('crm'), §A kontratına birebir uyuyor, eksik tablolarda 0.
- [ ] `/entitlements/me` aktif modülleri döndürüyor.
- [ ] `bun run build` + `bun test` + `bun run tenant:guard` yeşil.
- [ ] Yeni tablo eklenmedi (sadece okuma/aggregate). Şema değişikliği YOK.

## Koordinasyon
- Frontend (Claude) §5.1 JSON kontratına göre mock'la başlar; sen endpoint'i bu kontratla teslim et.
- `frontend/`'e dokunma.
