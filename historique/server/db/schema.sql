-- Historique & Comptage — this app's OWN database (historique.sqlite3). Nothing here is shared
-- with the main app's cafenoir.sqlite3: users are referenced by the main app's user id + a copy of
-- their name at the time of the action (so the history stays readable even if the account is
-- later renamed or removed there).
--
-- Every amount is INTEGER millimes (see shared/model.ts). Entries are never hard-deleted: they are
-- "annulée" with a reason, so the history and the journal always tell the full story.

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referentiels (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  actif INTEGER NOT NULL DEFAULT 1,
  ordre INTEGER NOT NULL DEFAULT 0,
  valeur INTEGER
);
CREATE INDEX IF NOT EXISTS idx_referentiels_type ON referentiels(type, ordre);

CREATE TABLE IF NOT EXISTS journees (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  statut TEXT NOT NULL DEFAULT 'ouverte',
  fond_ouverture INTEGER,
  fond_ouverture_source TEXT,
  fond_laisse INTEGER,
  montant_remis INTEGER,
  remis_a TEXT,
  note_cloture TEXT,
  ouverte_par_id TEXT,
  ouverte_par_nom TEXT,
  ouverte_le TEXT,
  cloturee_par_id TEXT,
  cloturee_par_nom TEXT,
  cloturee_le TEXT,
  validee_par_id TEXT,
  validee_par_nom TEXT,
  validee_le TEXT,
  reouverture_motif TEXT
);

CREATE TABLE IF NOT EXISTS ventes (
  id TEXT PRIMARY KEY,
  journee_id TEXT NOT NULL REFERENCES journees(id),
  heure TEXT,
  categorie TEXT NOT NULL,
  mode_paiement TEXT NOT NULL,
  montant INTEGER NOT NULL CHECK (montant > 0),
  client TEXT,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'active',
  annulation_motif TEXT,
  annule_par_nom TEXT,
  annule_le TEXT,
  cree_par_id TEXT NOT NULL,
  cree_par_nom TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  maj_par_nom TEXT,
  maj_le TEXT
);
CREATE INDEX IF NOT EXISTS idx_ventes_journee ON ventes(journee_id);

CREATE TABLE IF NOT EXISTS depenses (
  id TEXT PRIMARY KEY,
  journee_id TEXT NOT NULL REFERENCES journees(id),
  heure TEXT,
  categorie TEXT NOT NULL,
  mode_paiement TEXT NOT NULL,
  montant INTEGER NOT NULL CHECK (montant > 0),
  beneficiaire TEXT,
  description TEXT,
  justificatif TEXT NOT NULL DEFAULT 'non',
  photo TEXT,
  statut TEXT NOT NULL DEFAULT 'active',
  annulation_motif TEXT,
  annule_par_nom TEXT,
  annule_le TEXT,
  cree_par_id TEXT NOT NULL,
  cree_par_nom TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  maj_par_nom TEXT,
  maj_le TEXT
);
CREATE INDEX IF NOT EXISTS idx_depenses_journee ON depenses(journee_id);

CREATE TABLE IF NOT EXISTS mouvements (
  id TEXT PRIMARY KEY,
  journee_id TEXT NOT NULL REFERENCES journees(id),
  heure TEXT,
  type TEXT NOT NULL,
  montant INTEGER NOT NULL CHECK (montant > 0),
  personne TEXT,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'active',
  annulation_motif TEXT,
  annule_par_nom TEXT,
  annule_le TEXT,
  cree_par_id TEXT NOT NULL,
  cree_par_nom TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  maj_par_nom TEXT,
  maj_le TEXT
);
CREATE INDEX IF NOT EXISTS idx_mouvements_journee ON mouvements(journee_id);

-- One "ticket Z" per journée (the till's end-of-day report), overwritten when corrected — every
-- correction is kept in activity_log with its before/after values.
CREATE TABLE IF NOT EXISTS chiffres_affaires (
  journee_id TEXT PRIMARY KEY REFERENCES journees(id),
  total INTEGER NOT NULL,
  especes INTEGER NOT NULL DEFAULT 0,
  tpe INTEGER NOT NULL DEFAULT 0,
  tickets_resto INTEGER NOT NULL DEFAULT 0,
  credit INTEGER NOT NULL DEFAULT 0,
  cheque INTEGER NOT NULL DEFAULT 0,
  autre INTEGER NOT NULL DEFAULT 0,
  remises INTEGER NOT NULL DEFAULT 0,
  annulations INTEGER NOT NULL DEFAULT 0,
  offerts INTEGER NOT NULL DEFAULT 0,
  nb_tickets INTEGER,
  nb_couverts INTEGER,
  note TEXT,
  saisi_par_id TEXT NOT NULL,
  saisi_par_nom TEXT NOT NULL,
  maj_le TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comptages (
  id TEXT PRIMARY KEY,
  journee_id TEXT NOT NULL REFERENCES journees(id),
  type TEXT NOT NULL,
  moment TEXT NOT NULL,
  details TEXT NOT NULL,
  total_compte INTEGER NOT NULL,
  total_attendu INTEGER NOT NULL,
  ecart INTEGER NOT NULL,
  justification TEXT,
  statut TEXT NOT NULL DEFAULT 'active',
  annulation_motif TEXT,
  annule_par_nom TEXT,
  annule_le TEXT,
  cree_par_id TEXT NOT NULL,
  cree_par_nom TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  maj_par_nom TEXT,
  maj_le TEXT
);
CREATE INDEX IF NOT EXISTS idx_comptages_journee ON comptages(journee_id);

-- Notes reference the business date directly (not a journée row): they are team communication
-- (incidents, consignes, passation), so they can be written and resolved even once the day is closed.
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  journee_date TEXT,
  type TEXT NOT NULL,
  categorie TEXT,
  priorite TEXT NOT NULL DEFAULT 'normale',
  titre TEXT NOT NULL,
  contenu TEXT,
  statut TEXT NOT NULL DEFAULT 'ouvert',
  resolution TEXT,
  resolu_par_nom TEXT,
  resolu_le TEXT,
  epingle INTEGER NOT NULL DEFAULT 0,
  cree_par_id TEXT NOT NULL,
  cree_par_nom TEXT NOT NULL,
  cree_le TEXT NOT NULL,
  maj_le TEXT
);
CREATE INDEX IF NOT EXISTS idx_notes_statut ON notes(statut, priorite);
CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(journee_date);

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
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
