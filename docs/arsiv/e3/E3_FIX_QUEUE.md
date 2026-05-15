# E3 Fix Queue

E3 raporu sonrasi fix islerini oncelik ve durum bazli takip etmek icin kullanilir.

## Queue

| ID | Oncelik | Alan | Kisa Baslik | Sorumlu | Durum | Not |
| --- | --- | --- | --- | --- | --- | --- |
| E3-001 | P0 | - | - | Cursor | todo | - |
| E3-002 | P1 | - | - | Cursor | todo | - |
| E3-003 | P1 | - | - | Codex | todo | - |
| E3-004 | P2 | - | - | Cursor | todo | - |
| E3-005 | P3 | - | - | Cursor | todo | - |

Durum alanlari:
- `todo`
- `in_progress`
- `blocked-by-api`
- `done`

## Kural

1. P0/P1 kapanmadan P2/P3 polish'e gecilmez.
2. Her `done` kaydi icin kisa dogrulama notu yazilir.
3. Her fix turu sonunda build calistirilir:
   - `cd backend && bun run build`
   - `cd admin_panel && bun run build`
