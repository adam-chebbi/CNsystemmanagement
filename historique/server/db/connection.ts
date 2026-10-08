import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import type { ReferentielType } from '../../shared/model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type Db = Database.Database;

export const DEFAULT_DATA_DIR = path.join(__dirname, '..', 'data');

const DEFAULT_REFERENTIELS: Record<ReferentielType, { label: string; valeur?: number }[]> = {
  categorie_vente: [
    { label: 'Café & boissons chaudes' },
    { label: 'Boissons fraîches & jus' },
    { label: 'Restauration / cuisine' },
    { label: 'Pâtisserie & viennoiserie' },
    { label: 'Chicha' },
    { label: 'Vente à emporter' },
    { label: 'Autre' },
  ],
  categorie_depense: [
    { label: 'Achat marchandises' },
    { label: 'Fruits & légumes' },
    { label: 'Pain & pâtisserie' },
    { label: 'Lait & produits frais' },
    { label: 'Eau, gaz & électricité' },
    { label: 'Produits d’entretien' },
    { label: 'Entretien & réparation' },
    { label: 'Transport & livraison' },
    { label: 'Avance sur salaire' },
    { label: 'Journalier / extra' },
    { label: 'Divers' },
  ],
  tpe: [{ label: 'TPE principal' }],
  emetteur_ticket: [
    { label: 'Pluxee (Sodexo)', valeur: 5000 },
    { label: 'Edenred (Ticket Restaurant)', valeur: 5000 },
    { label: 'Autre émetteur', valeur: 5000 },
  ],
};

// Opens (and creates/migrates) the Historique database. Taking the path as a parameter lets the
// tests run against a throwaway file without touching the real one.
export const openDatabase = (dbPath: string): Db => {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8'));

  // Seeds the pick-lists once (only when a type has no row at all, so a list an admin emptied on
  // purpose is never refilled behind their back).
  const count = db.prepare('SELECT COUNT(*) AS n FROM referentiels WHERE type = ?');
  const insert = db.prepare('INSERT INTO referentiels (id, type, label, actif, ordre, valeur) VALUES (?, ?, ?, 1, ?, ?)');
  (Object.keys(DEFAULT_REFERENTIELS) as ReferentielType[]).forEach((type) => {
    if ((count.get(type) as { n: number }).n > 0) return;
    DEFAULT_REFERENTIELS[type].forEach((r, i) => insert.run(randomUUID(), type, r.label, i, r.valeur ?? null));
  });

  return db;
};
