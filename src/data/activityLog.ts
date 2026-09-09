// Shared audit trail for "Journal d'activité" — every mutating action across the app (Ventes,
// Stock, Produits, Catalogue) appends one entry here through logActivity, so the page has a
// single, real source of truth instead of reconstructing history from scattered module state.

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO datetime
  user: string;
  module: string;
  action: string;
  description: string;
}

export const ACTIVITY_MODULES: string[] = ['Ventes', 'Stock', 'Produits', 'Catalogue'];

let idCounter = 0;
export const generateActivityId = (): string => {
  idCounter += 1;
  return `act-${idCounter}-${Date.now().toString(36)}`;
};

// dd/mm/yyyy hh:mm, as requested — always 2-digit day/month/hour/minute.
export const formatActivityDateTime = (iso: string): string => {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const iso = (daysAgo: number, hh: number, mm: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
};

// A handful of representative historical entries — not a retroactive log of every seeded record
// (those are baseline data, not "actions performed"), just enough so the page isn't empty on
// first load. Everything from here on is captured live via logActivity.
export const initialActivityLog: ActivityLogEntry[] = [
  { id: 'act-seed-1', timestamp: iso(9, 9, 15), user: 'Karim', module: 'Stock', action: 'Entrée', description: 'Entrée — Croissants Surgelés Pur Beurre (+260 Dépôt)', },
  { id: 'act-seed-2', timestamp: iso(6, 8, 40), user: 'Mehdi', module: 'Stock', action: 'Inventaire', description: "Ajustement d'inventaire — Sirop Vanille Bourbon Maison (écart -2)", },
  { id: 'act-seed-3', timestamp: iso(4, 14, 30), user: 'Leila', module: 'Stock', action: 'Transfert', description: 'Transfert — Lait Entier UHT (Réserve principale → Dépôt, 20)', },
  { id: 'act-seed-4', timestamp: iso(2, 11, 5), user: 'Samira', module: 'Stock', action: 'Perte', description: 'Perte — Beurre AOP Charentes-Poitou (Casse, -2 Réserve principale)', },
  { id: 'act-seed-5', timestamp: iso(30, 10, 0), user: 'Company', module: 'Produits', action: 'Création', description: 'Catalogue initial des produits chargé', },
  { id: 'act-seed-6', timestamp: iso(30, 10, 0), user: 'Company', module: 'Catalogue', action: 'Création', description: 'Catégories et sous-catégories initiales créées', },
];
