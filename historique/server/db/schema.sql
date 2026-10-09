-- Historique & Comptage — this app's OWN database (historique.sqlite3). Nothing here is shared
-- with the main app's cafenoir.sqlite3: users are referenced by the main app's user id + a copy of
-- their name at the time of the action. Every amount is INTEGER millimes (see shared/model.ts).

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- One row per (date, service). `depenses` is a JSON array of {libelle, montant}; the derived
-- totals are stored too so the history list never has to recompute them.
CREATE TABLE IF NOT EXISTS caisses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  ca INTEGER NOT NULL,
  depenses TEXT NOT NULL DEFAULT '[]',
  total_depenses INTEGER NOT NULL,
  attendu_caisse INTEGER NOT NULL,
  tpe INTEGER NOT NULL DEFAULT 0,
  tickets_resto INTEGER NOT NULL DEFAULT 0,
  especes INTEGER NOT NULL,
  cree_par_id TEXT NOT NULL,
  cree_par_nom TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  maj_par_nom TEXT,
  maj_le TEXT,
  UNIQUE (date, shift)
);
CREATE INDEX IF NOT EXISTS idx_caisses_date ON caisses(date);

-- Audit trail: every save keeps the previous values, so a correction never erases what was there.
CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  journee_date TEXT,
  entity_id TEXT,
  details TEXT,
  ip TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_log(timestamp);
