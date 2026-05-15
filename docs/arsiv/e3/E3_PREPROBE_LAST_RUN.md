# E3 Preprobe Last Run

## Run Info

- Komut: `bash ./e3_preprobe.sh`
- Komut: `bash ./e3_preprobe_and_record.sh`
- Zaman: `2026-05-07 17:17 (CEST)`
- ISO: `2026-05-07T17:17:55+02:00`
- Sonuc: `PASS`

## Ham Cikti

```text
== E3 Preprobe ==
ADMIN_BASE_URL=http://localhost:3096
API_BASE_URL=http://localhost:8086

-- Core Health --
backend /api/health                                     200 (ok)
backend /api/v1/public/brand-config                     200 (ok)
admin /auth/login                                       200 (ok)

-- Kept Routes (expect 200) --
/admin/notifications                                    200 (ok)
/admin/users                                            200 (ok)
/admin/user-roles                                       200 (ok)
/admin/site-settings                                    200 (ok)
/admin/storage                                          200 (ok)
/admin/audit                                            200 (ok)
/admin/cache                                            200 (ok)
/admin/db                                               200 (ok)
/admin/profile                                          200 (ok)
/admin/external-db                                      200 (ok)
/admin/market                                           200 (ok)
/admin/market/targets                                   200 (ok)
/admin/market/leads                                     200 (ok)
/admin/market/signals                                   200 (ok)
/admin/market/reports                                   200 (ok)

-- Removed Routes (expect 404) --
/admin/availability                                     404 (ok)
/admin/banners                                          404 (ok)
/admin/campaigns                                        404 (ok)
/admin/chat                                             404 (ok)
/admin/email-templates                                  404 (ok)
/admin/home-layout                                      404 (ok)
/admin/llm-prompts                                      404 (ok)
/admin/orders                                           404 (ok)
/admin/reports                                          404 (ok)
/admin/reviews                                          404 (ok)
/admin/subscription-plans                               404 (ok)
/admin/subscriptions                                    404 (ok)
/admin/telegram                                         404 (ok)
/admin/wallet                                           404 (ok)
/admin/announcements                                    404 (ok)

-- Lead Machine Routes (expect 200) --
/admin/market/lead-machine/candidates                   200 (ok)
/admin/market/lead-machine/amazon                       200 (ok)
/admin/market/lead-machine/b2b                          200 (ok)
/admin/market/lead-machine/icp                          200 (ok)

-- Admin Market API (expect 401 without auth) --
/api/v1/admin/market/external/paspas/customers          401 (ok)
/api/v1/admin/market/reports/weekly/preview             401 (ok)
/api/v1/admin/market/targets/:id/recalculate-churn      401 (ok)

E3 preprobe result: PASS
```

## Not

Bu dosya `e3_preprobe_and_record.sh` tarafindan otomatik guncellendi.
