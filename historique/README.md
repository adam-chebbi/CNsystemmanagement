# Historique & Comptage — Café Noir

A one-screen **cash terminal** for the café staff, at **historique.cafenoir.tn**. It is built for people who are not comfortable with computers: there is no menu, just one screen.

1. Pick the **date** (header: from the app's first day up to today) and the **service** (Matin / Soir).
2. Enter the **chiffre d'affaires**.
3. Add the **dépenses du jour** paid with the till's cash (what for + amount).
4. The screen shows what **must be in the till**: chiffre d'affaires − dépenses.
5. **Comptage**: enter the **TPE** total and the **ticket resto** total; the **espèces** are calculated automatically (the rest).
6. **Enregistrer**. Saving again corrects the same service. Every save keeps the previous values in an audit trail (`activity_log` table).

The **Historique** button opens a fullscreen view of past services with totals (CA, dépenses, caisse, TPE, ticket resto, espèces), period filters and CSV export.

A save made without network is kept on the phone and sent automatically when the connection returns. The app installs as the PWA "Historique et Comptage Café Noir".

Staff can correct today and the previous 2 days. Older days can only be changed by accounts with `historique:supervise`.

## What is shared with the main app: login only

- **Own database**: `server/data/historique.sqlite3` (or `HISTORIQUE_DB_PATH`). This app never opens `cafenoir.sqlite3`.
- **Accounts and access are managed in the main app**, under Rôles & permissions:
  - `historique:access`: log in and use the terminal. This is the seeded **"Gérant"** role.
  - `historique:supervise`: correct any past date.
  - Super Admin has both.
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
