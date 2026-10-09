# Historique & Comptage — Café Noir

A separate app for the café's managers (gérants), at **historique.cafenoir.tn**. A gérant
records the day and counts the till:

- **Ventes** by category and payment method (espèces, carte, ticket resto, crédit client, chèque).
- **Dépenses**, with a photo of the receipt, or "reçu à fournir" to attach later (allowed even after the day is closed).
- **Chiffre d'affaires (ticket Z)**: the till's end-of-day report. Once entered, it is the reference figure.
- **Comptage physique**, done blind. The gérant counts the espèces note by note and coin by coin, the tickets resto by issuer and face value, and the TPE terminal totals. The expected amount appears only after the count. Any écart above the tolerance needs a written justification.
- **Mouvements de caisse**: cash put in, owner withdrawals, bank deposits, cash handed over, customer credit paid back, refunds.
- **Notes & incidents**: TPE or till failure, power, internet or water cut, stock-out, breakage, theft or loss, counterfeit note, customer dispute, customer who left without paying, staff absence, inspection, and more. Each has a priority and is tracked through ouvert → en cours → résolu. The closing message becomes a "passation" note for the next shift.
- **Clôture**: a checklist (Z entered, counts done, écarts justified…), then the split between the float left for tomorrow and the cash handed over. The day becomes read-only. A supervisor can reopen it (with a reason) or validate it.
- **Historique**: past days with filters and totals, CSV export, and a printable day sheet.
- **Crédits clients**: customer balances.
- **Journal d'activité**: every action, with before/after values. Filter by date, user, module, action or text, and export to CSV. A gérant sees only their own actions; a supervisor sees everyone's.
- **Installable PWA** "Historique et Comptage Café Noir", with the same logo as the main app. Entries made offline are queued on the phone and sent automatically when the connection returns, without creating duplicates.

## What is shared with the main app: login only

- **Own database**: `server/data/historique.sqlite3` (or `HISTORIQUE_DB_PATH`). This app never opens `cafenoir.sqlite3`.
- **Accounts and access are managed in the main app**, under Rôles & permissions:
  - `historique:access`: log in and enter data for the day. This is the seeded **"Gérant"** role.
  - `historique:supervise`: reopen or validate a day, correct anyone's entries, enter on any past date, see the whole journal.
  - `historique:settings`: tolerance, default float, catch-up days, categories, TPE terminals, ticket issuers.
  - Super Admin has all three.
- Login, logout and password changes go through the main app's `/api/auth/*`. Every API request is checked against the main app's `GET /api/auth/me`, with a 15 s cache. Deactivating an account or revoking its session in the main app therefore locks the person out here too. If a valid account without `historique:access` logs in, its new session is revoked immediately.

## Development

```bash
# 1. main app API (port 4000), from the repo root
npm run server:dev
# 2. this app, from historique/
npm install
npm run dev:full        # vite on :3100 + API on :4100 (MAIN_APP_URL defaults to http://127.0.0.1:4000)
npm test                # unit tests + end-to-end API tests (throwaway DB, fake main-app auth)
npm run build           # typecheck + production build (dist/ + service worker + manifest)
```

Amounts are stored as integer **millimes**. Business rules shared by server and client live in `shared/model.ts`.

## Production

Deployed on the VM alongside the main app:

- pm2 app **`historique`** (in the VM's untracked `/var/www/CNsystemmanagement/ecosystem.config.cjs`): `PORT=3012`, `MAIN_APP_URL=http://127.0.0.1:3011`, `NODE_ENV=production`, `TZ=Africa/Tunis`.
- The Cloudflare tunnel routes `historique.cafenoir.tn` **directly to `http://localhost:3012`** (no nginx hop). `deploy/historique.cafenoir.tn.nginx.conf` is kept in case you prefer to route through nginx (`localhost:80`) like the other sites.
- DNS: a proxied CNAME `historique` → `a84d343d-c53e-4ae6-be88-77768a90d97c.cfargotunnel.com`.
- Update: `cd /var/www/CNsystemmanagement && git pull --ff-only origin main && cd historique && npm ci && npm run build && pm2 restart historique`.
- Back up `historique/server/data/` (database and `uploads/` receipt photos) alongside the main database.
