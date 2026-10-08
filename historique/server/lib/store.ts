import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import {
  DEFAULT_SETTINGS,
  PERM_SUPERVISE,
  computeSummary,
  currentBusinessDate,
  daysBetween,
  formatDateFr,
  userCan,
  type ChiffreAffaires,
  type Comptage,
  type Depense,
  type HistoriqueSettings,
  type Journee,
  type Mouvement,
  type Note,
  type Referentiel,
  type SessionUser,
  type Vente,
} from '../../shared/model.js';
import type { Db } from '../db/connection.js';
import { ApiError } from './http.js';

type Row = Record<string, unknown>;

const s = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));
const n = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

const authored = (r: Row) => ({
  creeParId: String(r.cree_par_id),
  creeParNom: String(r.cree_par_nom),
  creeLe: String(r.cree_le),
  majParNom: s(r.maj_par_nom),
  majLe: s(r.maj_le),
  statut: r.statut as 'active' | 'annulee',
  annulationMotif: s(r.annulation_motif),
  annuleParNom: s(r.annule_par_nom),
  annuleLe: s(r.annule_le),
});

export const mapJournee = (r: Row): Journee => ({
  id: String(r.id),
  date: String(r.date),
  statut: r.statut as Journee['statut'],
  fondOuverture: n(r.fond_ouverture),
  fondOuvertureSource: (r.fond_ouverture_source as Journee['fondOuvertureSource']) ?? null,
  fondLaisse: n(r.fond_laisse),
  montantRemis: n(r.montant_remis),
  remisA: s(r.remis_a),
  noteCloture: s(r.note_cloture),
  ouverteParNom: s(r.ouverte_par_nom),
  ouverteLe: s(r.ouverte_le),
  clotureeParNom: s(r.cloturee_par_nom),
  clotureeLe: s(r.cloturee_le),
  valideeParNom: s(r.validee_par_nom),
  valideeLe: s(r.validee_le),
  reouvertureMotif: s(r.reouverture_motif),
});

export const mapVente = (r: Row): Vente => ({
  id: String(r.id),
  journeeId: String(r.journee_id),
  heure: s(r.heure),
  categorie: String(r.categorie),
  modePaiement: r.mode_paiement as Vente['modePaiement'],
  montant: Number(r.montant),
  client: s(r.client),
  description: s(r.description),
  ...authored(r),
});

export const mapDepense = (r: Row): Depense => ({
  id: String(r.id),
  journeeId: String(r.journee_id),
  heure: s(r.heure),
  categorie: String(r.categorie),
  modePaiement: r.mode_paiement as Depense['modePaiement'],
  montant: Number(r.montant),
  beneficiaire: s(r.beneficiaire),
  description: s(r.description),
  justificatif: r.justificatif as Depense['justificatif'],
  photo: s(r.photo),
  ...authored(r),
});

export const mapMouvement = (r: Row): Mouvement => ({
  id: String(r.id),
  journeeId: String(r.journee_id),
  heure: s(r.heure),
  type: r.type as Mouvement['type'],
  montant: Number(r.montant),
  personne: s(r.personne),
  description: s(r.description),
  ...authored(r),
});

export const mapComptage = (r: Row): Comptage => ({
  id: String(r.id),
  journeeId: String(r.journee_id),
  type: r.type as Comptage['type'],
  moment: r.moment as Comptage['moment'],
  details: JSON.parse(String(r.details || '{}')),
  totalCompte: Number(r.total_compte),
  totalAttendu: Number(r.total_attendu),
  ecart: Number(r.ecart),
  justification: s(r.justification),
  ...authored(r),
});

export const mapCa = (r: Row): ChiffreAffaires => ({
  journeeId: String(r.journee_id),
  total: Number(r.total),
  especes: Number(r.especes),
  tpe: Number(r.tpe),
  ticketsResto: Number(r.tickets_resto),
  credit: Number(r.credit),
  cheque: Number(r.cheque),
  autre: Number(r.autre),
  remises: Number(r.remises),
  annulations: Number(r.annulations),
  offerts: Number(r.offerts),
  nbTickets: n(r.nb_tickets),
  nbCouverts: n(r.nb_couverts),
  note: s(r.note),
  saisiParNom: String(r.saisi_par_nom),
  majLe: String(r.maj_le),
});

export const mapNote = (r: Row): Note => ({
  id: String(r.id),
  journeeDate: s(r.journee_date),
  type: r.type as Note['type'],
  categorie: s(r.categorie),
  priorite: r.priorite as Note['priorite'],
  titre: String(r.titre),
  contenu: s(r.contenu),
  statut: r.statut as Note['statut'],
  resolution: s(r.resolution),
  resoluParNom: s(r.resolu_par_nom),
  resoluLe: s(r.resolu_le),
  epingle: Number(r.epingle) === 1,
  creeParId: String(r.cree_par_id),
  creeParNom: String(r.cree_par_nom),
  creeLe: String(r.cree_le),
  majLe: s(r.maj_le),
});

export const mapReferentiel = (r: Row): Referentiel => ({
  id: String(r.id),
  type: r.type as Referentiel['type'],
  label: String(r.label),
  actif: Number(r.actif) === 1,
  ordre: Number(r.ordre),
  valeur: n(r.valeur),
});

export const nowIso = (): string => new Date().toISOString();

export const createStore = (db: Db) => {
  // --- Settings ---------------------------------------------------------------------------------
  const getSettings = (): HistoriqueSettings => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const out: HistoriqueSettings = { ...DEFAULT_SETTINGS };
    rows.forEach((r) => {
      if (r.key in out) (out as unknown as Record<string, number>)[r.key] = Number(JSON.parse(r.value));
    });
    return out;
  };

  const saveSettings = (next: HistoriqueSettings): void => {
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value');
    db.transaction(() => Object.entries(next).forEach(([k, v]) => upsert.run(k, JSON.stringify(v))))();
  };

  const businessToday = (): string => currentBusinessDate(new Date(), getSettings().heureBascule);

  // --- Activity log -----------------------------------------------------------------------------
  const log = (
    req: Request | null,
    entry: { module: string; action: string; description: string; journeeDate?: string | null; entityId?: string | null; details?: unknown; userName?: string; userId?: string | null }
  ): void => {
    db.prepare(
      `INSERT INTO activity_log (id, timestamp, user_id, user_name, module, action, description, journee_date, entity_id, details, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      nowIso(),
      entry.userId !== undefined ? entry.userId : req?.user?.id ?? null,
      entry.userName ?? req?.user?.fullName ?? 'Système',
      entry.module,
      entry.action,
      entry.description,
      entry.journeeDate ?? null,
      entry.entityId ?? null,
      entry.details === undefined ? null : JSON.stringify(entry.details),
      req?.ip ?? null,
      req?.get('user-agent') ?? null
    );
  };

  // --- Journées ---------------------------------------------------------------------------------
  const getJourneeByDate = (date: string): Journee | null => {
    const r = db.prepare('SELECT * FROM journees WHERE date = ?').get(date) as Row | undefined;
    return r ? mapJournee(r) : null;
  };

  const getJourneeById = (id: string): Journee | null => {
    const r = db.prepare('SELECT * FROM journees WHERE id = ?').get(id) as Row | undefined;
    return r ? mapJournee(r) : null;
  };

  const previousJournee = (date: string): Journee | null => {
    const r = db.prepare('SELECT * FROM journees WHERE date < ? ORDER BY date DESC LIMIT 1').get(date) as Row | undefined;
    return r ? mapJournee(r) : null;
  };

  // Rules for writing on a journée — enforced here, server-side, for every kind of entry:
  //   • nothing is ever written on a future date;
  //   • a clôturée or validée journée is read-only for everyone — a supervisor reopens it first
  //     (with a reason, logged), so a closed day can never change silently;
  //   • a Gérant can catch up on the last `joursRattrapage` days; older days need a supervisor.
  const assertDateWritable = (user: SessionUser, date: string): void => {
    const today = businessToday();
    if (date > today) throw new ApiError(400, 'Impossible de saisir sur une date future.');
    const { joursRattrapage } = getSettings();
    if (!userCan(user, PERM_SUPERVISE) && daysBetween(date, today) > joursRattrapage) {
      throw new ApiError(
        403,
        `La saisie sur une journée passée est limitée à ${joursRattrapage} jour(s). Demandez à un superviseur de faire la correction.`,
        'RATTRAPAGE_DEPASSE'
      );
    }
  };

  const assertJourneeWritable = (user: SessionUser, journee: Journee): void => {
    if (journee.statut === 'validee') {
      throw new ApiError(423, `La journée du ${formatDateFr(journee.date, false)} est validée : plus aucune modification n'est possible.`, 'JOURNEE_VERROUILLEE');
    }
    if (journee.statut === 'cloturee') {
      throw new ApiError(
        423,
        `La journée du ${formatDateFr(journee.date, false)} est clôturée. ${userCan(user, PERM_SUPERVISE) ? 'Rouvrez-la pour la modifier.' : 'Demandez à un superviseur de la rouvrir.'}`,
        'JOURNEE_VERROUILLEE'
      );
    }
    assertDateWritable(user, journee.date);
  };

  // A journée exists as soon as anything is entered for its date — the Gérant never has to
  // remember to "open" it first. Its opening float is carried over from the previous closing.
  const getOrCreateJournee = (req: Request, date: string): Journee => {
    const existing = getJourneeByDate(date);
    if (existing) return existing;
    assertDateWritable(req.user!, date);
    const prev = previousJournee(date);
    const carried = prev?.fondLaisse ?? null;
    const id = randomUUID();
    db.prepare(
      `INSERT INTO journees (id, date, statut, fond_ouverture, fond_ouverture_source, ouverte_par_id, ouverte_par_nom, ouverte_le)
       VALUES (?, ?, 'ouverte', ?, ?, ?, ?, ?)`
    ).run(id, date, carried, carried === null ? null : 'report', req.user!.id, req.user!.fullName, nowIso());
    log(req, {
      module: 'journee',
      action: 'ouverture',
      description: `Ouverture de la journée du ${formatDateFr(date, false)}`,
      journeeDate: date,
      entityId: id,
      details: { fondReporte: carried },
    });
    return getJourneeById(id)!;
  };

  const assertCanTouchEntry = (user: SessionUser, entry: { creeParId: string; statut: string }): void => {
    if (entry.statut !== 'active') throw new ApiError(409, 'Cette saisie est déjà annulée.');
    if (entry.creeParId !== user.id && !userCan(user, PERM_SUPERVISE)) {
      throw new ApiError(403, "Seul l'auteur de la saisie ou un superviseur peut la modifier.");
    }
  };

  const loadDataset = (journee: Journee) => {
    const ventes = (db.prepare('SELECT * FROM ventes WHERE journee_id = ? ORDER BY cree_le').all(journee.id) as Row[]).map(mapVente);
    const depenses = (db.prepare('SELECT * FROM depenses WHERE journee_id = ? ORDER BY cree_le').all(journee.id) as Row[]).map(mapDepense);
    const mouvements = (db.prepare('SELECT * FROM mouvements WHERE journee_id = ? ORDER BY cree_le').all(journee.id) as Row[]).map(mapMouvement);
    const comptages = (db.prepare('SELECT * FROM comptages WHERE journee_id = ? ORDER BY cree_le').all(journee.id) as Row[]).map(mapComptage);
    const caRow = db.prepare('SELECT * FROM chiffres_affaires WHERE journee_id = ?').get(journee.id) as Row | undefined;
    const ca = caRow ? mapCa(caRow) : null;
    const settings = getSettings();
    const summary = computeSummary({ journee, fondParDefaut: settings.fondCaisseDefaut, ventes, depenses, mouvements, ca, comptages });
    return { journee, ventes, depenses, mouvements, comptages, ca, summary, settings };
  };

  const countOpenUrgentIncidents = (): number =>
    (db.prepare("SELECT COUNT(*) AS n FROM notes WHERE type = 'incident' AND statut != 'resolu' AND priorite = 'urgente'").get() as { n: number }).n;

  return {
    db,
    getSettings,
    saveSettings,
    businessToday,
    log,
    getJourneeByDate,
    getJourneeById,
    previousJournee,
    assertDateWritable,
    assertJourneeWritable,
    getOrCreateJournee,
    assertCanTouchEntry,
    loadDataset,
    countOpenUrgentIncidents,
  };
};

export type Store = ReturnType<typeof createStore>;
