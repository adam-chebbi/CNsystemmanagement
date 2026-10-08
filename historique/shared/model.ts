// Historique & Comptage — domain model shared by the server (historique/server) and the client
// (historique/src). Pure data/types/functions only: no React, DOM or Express imports.
//
// Every amount is an INTEGER number of millimes (1 DT = 1000 millimes). The Tunisian dinar has
// three decimals, and summing floats like 0.1 + 0.2 over a full day of entries drifts — integers
// never do. Conversion to/from "12,500 DT" happens only at the UI edge (see formatDT / dtToMillimes).

// --- Permissions (catalog lives in the main app: src/data/rbacModel.ts) ------------------------

export const PERM_ACCESS = 'historique:access';
export const PERM_SUPERVISE = 'historique:supervise';
export const PERM_SETTINGS = 'historique:settings';

export interface SessionUser {
  id: string;
  fullName: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: string[];
  mustChangePassword: boolean;
}

export const userCan = (user: Pick<SessionUser, 'isSuperAdmin' | 'permissions'> | null | undefined, key: string): boolean =>
  Boolean(user) && (user!.isSuperAdmin || user!.permissions.includes(key));

// --- Money ---------------------------------------------------------------------------------------

export const dtToMillimes = (dt: number): number => Math.round(dt * 1000);
export const millimesToDt = (m: number): number => m / 1000;

export const formatDT = (millimes: number, opts: { sign?: boolean } = {}): string => {
  const dt = millimes / 1000;
  const s = dt.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return `${opts.sign && millimes > 0 ? '+' : ''}${s} DT`;
};

// --- Business day ---------------------------------------------------------------------------------

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, '0');
export const toIsoDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
};

export const daysBetween = (fromIso: string, toIso: string): number => {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

// A café closes after midnight: until `cutoffHour` (default 5h) the service still belongs to the
// previous calendar day, so a 1 a.m. closing count lands on the right journée by default.
export const currentBusinessDate = (now: Date = new Date(), cutoffHour = 5): string => {
  const d = new Date(now);
  if (d.getHours() < cutoffHour) d.setDate(d.getDate() - 1);
  return toIsoDate(d);
};

export const formatDateFr = (iso: string, withWeekday = true): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    ...(withWeekday ? { weekday: 'long' as const } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// --- Enumerations ---------------------------------------------------------------------------------

export type JourneeStatut = 'ouverte' | 'cloturee' | 'validee';
export const JOURNEE_STATUT_LABELS: Record<JourneeStatut, string> = {
  ouverte: 'Ouverte',
  cloturee: 'Clôturée',
  validee: 'Validée',
};

export type ModePaiement = 'especes' | 'tpe' | 'ticket_resto' | 'credit' | 'cheque' | 'autre';
export const MODES_PAIEMENT: { id: ModePaiement; label: string }[] = [
  { id: 'especes', label: 'Espèces' },
  { id: 'tpe', label: 'Carte (TPE)' },
  { id: 'ticket_resto', label: 'Ticket resto' },
  { id: 'credit', label: 'Crédit client' },
  { id: 'cheque', label: 'Chèque' },
  { id: 'autre', label: 'Autre' },
];
export const MODE_PAIEMENT_LABELS = Object.fromEntries(MODES_PAIEMENT.map((m) => [m.id, m.label])) as Record<ModePaiement, string>;

// How a dépense was paid — only "especes_caisse" takes money out of the till and therefore lowers
// the expected cash at the count; the others are recorded for the history but don't touch the till.
export type ModeDepense = 'especes_caisse' | 'tpe' | 'cheque' | 'virement' | 'poche' | 'autre';
export const MODES_DEPENSE: { id: ModeDepense; label: string; hint?: string }[] = [
  { id: 'especes_caisse', label: 'Espèces (caisse)', hint: 'Sortie de la caisse — réduit les espèces attendues' },
  { id: 'poche', label: 'Avancé de ma poche', hint: 'À rembourser au gérant — ne touche pas la caisse' },
  { id: 'tpe', label: 'Carte bancaire' },
  { id: 'cheque', label: 'Chèque' },
  { id: 'virement', label: 'Virement' },
  { id: 'autre', label: 'Autre' },
];
export const MODE_DEPENSE_LABELS = Object.fromEntries(MODES_DEPENSE.map((m) => [m.id, m.label])) as Record<ModeDepense, string>;

export type Justificatif = 'oui' | 'non' | 'a_fournir';
export const JUSTIFICATIF_LABELS: Record<Justificatif, string> = {
  oui: 'Reçu / facture fourni',
  a_fournir: 'Reçu à fournir plus tard',
  non: 'Pas de reçu',
};

// Cash movements that are neither a sale nor a dépense — the real-life "the owner took 200 DT",
// "I added change to the till", "a customer paid back his tab", "deposit at the bank".
export type MouvementType =
  | 'apport_fond'
  | 'encaissement_credit'
  | 'autre_entree'
  | 'retrait_proprietaire'
  | 'versement_banque'
  | 'remise_coffre'
  | 'remboursement_client'
  | 'autre_sortie';

export const MOUVEMENT_TYPES: { id: MouvementType; label: string; sens: 1 | -1; needsPerson?: 'client' | 'beneficiaire' }[] = [
  { id: 'apport_fond', label: 'Apport de monnaie / fond', sens: 1 },
  { id: 'encaissement_credit', label: 'Remboursement d’un crédit client', sens: 1, needsPerson: 'client' },
  { id: 'autre_entree', label: 'Autre entrée d’argent', sens: 1 },
  { id: 'retrait_proprietaire', label: 'Retrait du propriétaire', sens: -1, needsPerson: 'beneficiaire' },
  { id: 'versement_banque', label: 'Versement en banque', sens: -1 },
  { id: 'remise_coffre', label: 'Remise au coffre / responsable', sens: -1, needsPerson: 'beneficiaire' },
  { id: 'remboursement_client', label: 'Remboursement à un client', sens: -1, needsPerson: 'client' },
  { id: 'autre_sortie', label: 'Autre sortie d’argent', sens: -1 },
];
export const MOUVEMENT_BY_ID = Object.fromEntries(MOUVEMENT_TYPES.map((m) => [m.id, m])) as Record<MouvementType, (typeof MOUVEMENT_TYPES)[number]>;

export type ComptageType = 'especes' | 'tickets_resto' | 'tpe';
export const COMPTAGE_TYPE_LABELS: Record<ComptageType, string> = {
  especes: 'Espèces',
  tickets_resto: 'Tickets resto',
  tpe: 'TPE (carte)',
};

export type ComptageMoment = 'ouverture' | 'intermediaire' | 'passation' | 'cloture';
export const COMPTAGE_MOMENT_LABELS: Record<ComptageMoment, string> = {
  ouverture: 'Ouverture',
  intermediaire: 'Contrôle en cours de journée',
  passation: 'Passation entre gérants',
  cloture: 'Clôture',
};

// Billets et pièces en circulation en Tunisie (valeurs en millimes).
export const DENOMINATIONS: { key: string; value: number; label: string; kind: 'billet' | 'piece' }[] = [
  { key: 'b50', value: 50000, label: '50 DT', kind: 'billet' },
  { key: 'b20', value: 20000, label: '20 DT', kind: 'billet' },
  { key: 'b10', value: 10000, label: '10 DT', kind: 'billet' },
  { key: 'b5', value: 5000, label: '5 DT', kind: 'billet' },
  { key: 'p5', value: 5000, label: '5 DT', kind: 'piece' },
  { key: 'p2', value: 2000, label: '2 DT', kind: 'piece' },
  { key: 'p1', value: 1000, label: '1 DT', kind: 'piece' },
  { key: 'm500', value: 500, label: '500 m', kind: 'piece' },
  { key: 'm200', value: 200, label: '200 m', kind: 'piece' },
  { key: 'm100', value: 100, label: '100 m', kind: 'piece' },
  { key: 'm50', value: 50, label: '50 m', kind: 'piece' },
  { key: 'm20', value: 20, label: '20 m', kind: 'piece' },
  { key: 'm10', value: 10, label: '10 m', kind: 'piece' },
];

export type NoteType = 'note' | 'incident' | 'consigne' | 'passation';
export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  note: 'Note',
  incident: 'Incident / problème',
  consigne: 'Consigne',
  passation: 'Passation de service',
};

// The concrete things that go wrong in a café day — picked so the owner can later filter
// "how many TPE outages this month" instead of reading free text.
export const INCIDENT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'panne_tpe', label: 'Panne / refus TPE' },
  { id: 'panne_caisse', label: 'Panne caisse / imprimante' },
  { id: 'coupure_courant', label: 'Coupure d’électricité' },
  { id: 'coupure_internet', label: 'Coupure internet' },
  { id: 'coupure_eau_gaz', label: 'Coupure d’eau / gaz' },
  { id: 'panne_materiel', label: 'Panne machine / matériel' },
  { id: 'rupture_stock', label: 'Rupture de stock' },
  { id: 'livraison', label: 'Problème de livraison fournisseur' },
  { id: 'casse', label: 'Casse (vaisselle, verre…)' },
  { id: 'perte_vol', label: 'Perte / vol' },
  { id: 'erreur_caisse', label: 'Erreur de caisse / de rendu' },
  { id: 'faux_billet', label: 'Faux billet' },
  { id: 'litige_client', label: 'Litige / réclamation client' },
  { id: 'impaye', label: 'Client parti sans payer' },
  { id: 'personnel', label: 'Absence / retard du personnel' },
  { id: 'hygiene_securite', label: 'Hygiène / sécurité' },
  { id: 'controle', label: 'Contrôle (police, municipalité, fisc…)' },
  { id: 'autre', label: 'Autre' },
];
export const INCIDENT_CATEGORY_LABELS = Object.fromEntries(INCIDENT_CATEGORIES.map((c) => [c.id, c.label])) as Record<string, string>;

export type Priorite = 'basse' | 'normale' | 'haute' | 'urgente';
export const PRIORITE_LABELS: Record<Priorite, string> = { basse: 'Basse', normale: 'Normale', haute: 'Haute', urgente: 'Urgente' };

export type NoteStatut = 'ouvert' | 'en_cours' | 'resolu';
export const NOTE_STATUT_LABELS: Record<NoteStatut, string> = { ouvert: 'Ouvert', en_cours: 'En cours', resolu: 'Résolu' };

export type EntryStatut = 'active' | 'annulee';

// --- Records --------------------------------------------------------------------------------------

export interface Journee {
  id: string;
  date: string;
  statut: JourneeStatut;
  fondOuverture: number | null; // millimes; null until the opening count (or carried from the previous day)
  fondOuvertureSource: 'comptage' | 'report' | 'defaut' | null;
  fondLaisse: number | null; // cash left in the till for the next day, declared at closing
  montantRemis: number | null; // cash handed over / taken out at closing
  remisA: string | null;
  noteCloture: string | null;
  ouverteParNom: string | null;
  ouverteLe: string | null;
  clotureeParNom: string | null;
  clotureeLe: string | null;
  valideeParNom: string | null;
  valideeLe: string | null;
  reouvertureMotif: string | null;
}

interface Authored {
  creeParId: string;
  creeParNom: string;
  creeLe: string;
  majParNom: string | null;
  majLe: string | null;
  statut: EntryStatut;
  annulationMotif: string | null;
  annuleParNom: string | null;
  annuleLe: string | null;
}

export interface Vente extends Authored {
  id: string;
  journeeId: string;
  heure: string | null;
  categorie: string;
  modePaiement: ModePaiement;
  montant: number;
  client: string | null;
  description: string | null;
}

export interface Depense extends Authored {
  id: string;
  journeeId: string;
  heure: string | null;
  categorie: string;
  modePaiement: ModeDepense;
  montant: number;
  beneficiaire: string | null;
  description: string | null;
  justificatif: Justificatif;
  photo: string | null;
}

export interface Mouvement extends Authored {
  id: string;
  journeeId: string;
  heure: string | null;
  type: MouvementType;
  montant: number; // always positive; direction comes from MOUVEMENT_BY_ID[type].sens
  personne: string | null;
  description: string | null;
}

export interface ChiffreAffaires {
  journeeId: string;
  total: number;
  especes: number;
  tpe: number;
  ticketsResto: number;
  credit: number;
  cheque: number;
  autre: number;
  remises: number;
  annulations: number;
  offerts: number;
  nbTickets: number | null;
  nbCouverts: number | null;
  note: string | null;
  saisiParNom: string;
  majLe: string;
}

export interface DenominationLine { key: string; quantite: number }
export interface TicketLine { emetteur: string; valeur: number; quantite: number }
export interface TpeLine { terminal: string; montant: number; nbTransactions: number | null }

export interface Comptage extends Authored {
  id: string;
  journeeId: string;
  type: ComptageType;
  moment: ComptageMoment;
  details: { denominations?: DenominationLine[]; tickets?: TicketLine[]; tpe?: TpeLine[]; vrac?: number };
  totalCompte: number;
  totalAttendu: number;
  ecart: number; // totalCompte - totalAttendu
  justification: string | null;
}

export interface Note {
  id: string;
  journeeDate: string | null;
  type: NoteType;
  categorie: string | null;
  priorite: Priorite;
  titre: string;
  contenu: string | null;
  statut: NoteStatut;
  resolution: string | null;
  resoluParNom: string | null;
  resoluLe: string | null;
  epingle: boolean;
  creeParId: string;
  creeParNom: string;
  creeLe: string;
  majLe: string | null;
}

export interface Referentiel {
  id: string;
  type: ReferentielType;
  label: string;
  actif: boolean;
  ordre: number;
  valeur: number | null; // tickets resto: default face value in millimes
}
export type ReferentielType = 'categorie_depense' | 'categorie_vente' | 'tpe' | 'emetteur_ticket';
export const REFERENTIEL_TYPE_LABELS: Record<ReferentielType, string> = {
  categorie_vente: 'Catégories de ventes',
  categorie_depense: 'Catégories de dépenses',
  tpe: 'Terminaux TPE',
  emetteur_ticket: 'Émetteurs de tickets resto',
};

export interface HistoriqueSettings {
  toleranceEcart: number; // millimes — an écart above this (in absolute value) needs a justification
  fondCaisseDefaut: number; // millimes
  joursRattrapage: number; // how many past days a Gérant (without supervise) may still enter data on
  heureBascule: number; // business-day cutoff hour, see currentBusinessDate
  depenseSeuilJustificatif: number; // millimes — a cash dépense above this must say whether there is a receipt photo
}

export const DEFAULT_SETTINGS: HistoriqueSettings = {
  toleranceEcart: 1000,
  fondCaisseDefaut: 100000,
  joursRattrapage: 2,
  heureBascule: 5,
  depenseSeuilJustificatif: 50000,
};

// --- Computation: what should be in the till ------------------------------------------------------

export interface ModeTotals {
  especes: number;
  tpe: number;
  ticketsResto: number;
  credit: number;
  cheque: number;
  autre: number;
  total: number;
}

export const emptyModeTotals = (): ModeTotals => ({ especes: 0, tpe: 0, ticketsResto: 0, credit: 0, cheque: 0, autre: 0, total: 0 });

const MODE_TO_FIELD: Record<ModePaiement, keyof Omit<ModeTotals, 'total'>> = {
  especes: 'especes',
  tpe: 'tpe',
  ticket_resto: 'ticketsResto',
  credit: 'credit',
  cheque: 'cheque',
  autre: 'autre',
};

export const sumVentesByMode = (ventes: Pick<Vente, 'modePaiement' | 'montant' | 'statut'>[]): ModeTotals => {
  const t = emptyModeTotals();
  ventes.forEach((v) => {
    if (v.statut !== 'active') return;
    t[MODE_TO_FIELD[v.modePaiement]] += v.montant;
    t.total += v.montant;
  });
  return t;
};

export const caToModeTotals = (ca: ChiffreAffaires): ModeTotals => ({
  especes: ca.especes,
  tpe: ca.tpe,
  ticketsResto: ca.ticketsResto,
  credit: ca.credit,
  cheque: ca.cheque,
  autre: ca.autre,
  total: ca.total,
});

export const sumModeFields = (t: Omit<ModeTotals, 'total'>): number => t.especes + t.tpe + t.ticketsResto + t.credit + t.cheque + t.autre;

export interface JourneeSummary {
  // Which figures the expectations are based on: the till's own Z report when the Gérant entered
  // it, otherwise the sum of the individual ventes lines.
  source: 'ca' | 'ventes' | 'aucune';
  recettes: ModeTotals;
  ventes: ModeTotals;
  ca: ModeTotals | null;
  ecartCaVentes: number | null; // CA (Z) total − sum of ventes lines, when both exist and ventes > 0
  caIncoherent: boolean; // the CA's per-mode breakdown doesn't add up to its declared total
  depensesTotal: number;
  depensesEspeces: number;
  depensesSansJustificatif: number;
  mouvementsEntrees: number;
  mouvementsSorties: number;
  fondOuverture: number;
  especesAttendues: number;
  ticketsAttendus: number;
  tpeAttendu: number;
  dernierComptage: Partial<Record<ComptageType, Pick<Comptage, 'totalCompte' | 'totalAttendu' | 'ecart' | 'moment' | 'creeLe'>>>;
  ecartTotalCloture: number | null;
}

export interface JourneeDataset {
  journee: Pick<Journee, 'fondOuverture'>;
  fondParDefaut: number;
  ventes: Vente[];
  depenses: Depense[];
  mouvements: Mouvement[];
  ca: ChiffreAffaires | null;
  comptages: Comptage[];
}

export const computeSummary = (d: JourneeDataset): JourneeSummary => {
  const ventes = sumVentesByMode(d.ventes);
  const ca = d.ca ? caToModeTotals(d.ca) : null;
  const source: JourneeSummary['source'] = ca ? 'ca' : ventes.total > 0 ? 'ventes' : 'aucune';
  const recettes = ca ?? ventes;

  const activeDepenses = d.depenses.filter((x) => x.statut === 'active');
  const depensesTotal = activeDepenses.reduce((s, x) => s + x.montant, 0);
  const depensesEspeces = activeDepenses.filter((x) => x.modePaiement === 'especes_caisse').reduce((s, x) => s + x.montant, 0);
  const depensesSansJustificatif = activeDepenses.filter((x) => x.justificatif !== 'oui').length;

  let mouvementsEntrees = 0;
  let mouvementsSorties = 0;
  d.mouvements
    .filter((m) => m.statut === 'active')
    .forEach((m) => {
      if (MOUVEMENT_BY_ID[m.type].sens === 1) mouvementsEntrees += m.montant;
      else mouvementsSorties += m.montant;
    });

  const fondOuverture = d.journee.fondOuverture ?? d.fondParDefaut;
  const especesAttendues = fondOuverture + recettes.especes + mouvementsEntrees - mouvementsSorties - depensesEspeces;

  const dernierComptage: JourneeSummary['dernierComptage'] = {};
  [...d.comptages]
    .filter((c) => c.statut === 'active')
    .sort((a, b) => (a.creeLe < b.creeLe ? -1 : 1))
    .forEach((c) => {
      dernierComptage[c.type] = { totalCompte: c.totalCompte, totalAttendu: c.totalAttendu, ecart: c.ecart, moment: c.moment, creeLe: c.creeLe };
    });

  const clotures = d.comptages.filter((c) => c.statut === 'active' && c.moment === 'cloture');
  const latestCloture = new Map<ComptageType, Comptage>();
  clotures.forEach((c) => {
    const prev = latestCloture.get(c.type);
    if (!prev || prev.creeLe < c.creeLe) latestCloture.set(c.type, c);
  });
  const ecartTotalCloture = latestCloture.size > 0 ? [...latestCloture.values()].reduce((s, c) => s + c.ecart, 0) : null;

  return {
    source,
    recettes,
    ventes,
    ca,
    ecartCaVentes: ca && ventes.total > 0 ? ca.total - ventes.total : null,
    caIncoherent: Boolean(d.ca) && sumModeFields(caToModeTotals(d.ca!)) !== d.ca!.total,
    depensesTotal,
    depensesEspeces,
    depensesSansJustificatif,
    mouvementsEntrees,
    mouvementsSorties,
    fondOuverture,
    especesAttendues,
    ticketsAttendus: recettes.ticketsResto,
    tpeAttendu: recettes.tpe,
    dernierComptage,
    ecartTotalCloture,
  };
};

// What the count is compared against, per type and moment. An opening count checks that the
// cash left last night is still there; every later count checks the running expectation.
export const expectedForComptage = (
  type: ComptageType,
  moment: ComptageMoment,
  summary: JourneeSummary,
  fondReporte: number | null
): number => {
  if (moment === 'ouverture') return type === 'especes' ? fondReporte ?? summary.fondOuverture : 0;
  if (type === 'especes') return summary.especesAttendues;
  if (type === 'tickets_resto') return summary.ticketsAttendus;
  return summary.tpeAttendu;
};

export const computeComptageTotal = (type: ComptageType, details: Comptage['details']): number => {
  if (type === 'especes') {
    const byKey = new Map(DENOMINATIONS.map((d) => [d.key, d.value]));
    const counted = (details.denominations ?? []).reduce((s, l) => s + (byKey.get(l.key) ?? 0) * Math.max(0, Math.floor(l.quantite || 0)), 0);
    return counted + Math.max(0, Math.round(details.vrac ?? 0));
  }
  if (type === 'tickets_resto') {
    return (details.tickets ?? []).reduce((s, l) => s + Math.max(0, Math.round(l.valeur)) * Math.max(0, Math.floor(l.quantite || 0)), 0);
  }
  return (details.tpe ?? []).reduce((s, l) => s + Math.max(0, Math.round(l.montant)), 0);
};

export const needsJustification = (ecart: number, tolerance: number): boolean => Math.abs(ecart) > tolerance;

// --- Closing checklist ------------------------------------------------------------------------------

export interface ClotureCheck {
  id: string;
  label: string;
  ok: boolean;
  bloquant: boolean;
  detail?: string;
}

export const computeClotureChecks = (args: {
  summary: JourneeSummary;
  comptages: Comptage[];
  hasCa: boolean;
  openUrgentIncidents: number;
  tolerance: number;
}): ClotureCheck[] => {
  const { summary, comptages, hasCa, openUrgentIncidents, tolerance } = args;
  const lastCloture = (type: ComptageType) =>
    comptages
      .filter((c) => c.statut === 'active' && c.type === type && c.moment === 'cloture')
      .sort((a, b) => (a.creeLe < b.creeLe ? 1 : -1))[0];

  const especes = lastCloture('especes');
  const tickets = lastCloture('tickets_resto');
  const tpe = lastCloture('tpe');
  const unjustified = [especes, tickets, tpe].filter((c) => c && needsJustification(c.ecart, tolerance) && !c.justification?.trim());

  return [
    { id: 'ca', label: "Chiffre d'affaires (ticket Z) saisi", ok: hasCa, bloquant: true },
    {
      id: 'ca_coherent',
      label: 'Répartition du CA égale au total',
      ok: !summary.caIncoherent,
      bloquant: false,
      detail: summary.caIncoherent ? 'La somme espèces + carte + tickets + crédit… ne correspond pas au total du Z.' : undefined,
    },
    { id: 'comptage_especes', label: 'Comptage des espèces de clôture', ok: Boolean(especes), bloquant: true },
    {
      id: 'comptage_tickets',
      label: 'Comptage des tickets resto de clôture',
      ok: Boolean(tickets) || summary.ticketsAttendus === 0,
      bloquant: summary.ticketsAttendus > 0,
      detail: summary.ticketsAttendus === 0 && !tickets ? 'Aucun ticket resto attendu.' : undefined,
    },
    {
      id: 'comptage_tpe',
      label: 'Total TPE de clôture relevé',
      ok: Boolean(tpe) || summary.tpeAttendu === 0,
      bloquant: summary.tpeAttendu > 0,
      detail: summary.tpeAttendu === 0 && !tpe ? 'Aucun paiement carte attendu.' : undefined,
    },
    { id: 'ecarts', label: 'Tous les écarts sont justifiés', ok: unjustified.length === 0, bloquant: true },
    {
      id: 'justificatifs',
      label: 'Toutes les dépenses ont un reçu',
      ok: summary.depensesSansJustificatif === 0,
      bloquant: false,
      detail: summary.depensesSansJustificatif > 0 ? `${summary.depensesSansJustificatif} dépense(s) sans reçu.` : undefined,
    },
    {
      id: 'incidents',
      label: 'Aucun incident urgent non résolu',
      ok: openUrgentIncidents === 0,
      bloquant: false,
      detail: openUrgentIncidents > 0 ? `${openUrgentIncidents} incident(s) urgent(s) encore ouvert(s).` : undefined,
    },
  ];
};

// --- Activity log ---------------------------------------------------------------------------------

export const ACTIVITY_MODULES: Record<string, string> = {
  auth: 'Connexion',
  journee: 'Journée',
  vente: 'Ventes',
  depense: 'Dépenses',
  ca: "Chiffre d'affaires",
  comptage: 'Comptages',
  mouvement: 'Mouvements de caisse',
  note: 'Notes & incidents',
  parametres: 'Paramètres',
};

export const ACTIVITY_ACTIONS: Record<string, string> = {
  connexion: 'Connexion',
  deconnexion: 'Déconnexion',
  connexion_refusee: 'Accès refusé',
  creation: 'Création',
  modification: 'Modification',
  annulation: 'Annulation',
  ouverture: 'Ouverture',
  cloture: 'Clôture',
  reouverture: 'Réouverture',
  validation: 'Validation',
  resolution: 'Résolution',
};

export interface ActivityEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string;
  module: string;
  action: string;
  description: string;
  journeeDate: string | null;
  entityId: string | null;
  details: unknown;
  ip: string | null;
}
