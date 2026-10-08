import { randomUUID } from 'node:crypto';
import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  COMPTAGE_MOMENT_LABELS,
  COMPTAGE_TYPE_LABELS,
  ISO_DATE,
  PERM_SUPERVISE,
  computeClotureChecks,
  computeComptageTotal,
  computeSummary,
  daysBetween,
  expectedForComptage,
  formatDT,
  formatDateFr,
  needsJustification,
  sumModeFields,
  userCan,
  type ChiffreAffaires,
  type Comptage,
  type Journee,
} from '../../shared/model.js';
import { ApiError, asyncHandler, notFound } from '../lib/http.js';
import { requirePerm } from '../lib/mainAuth.js';
import { mapCa, mapComptage, mapJournee, nowIso, type Store } from '../lib/store.js';

const dateParam = (req: Request): string => {
  const date = String(req.params.date);
  if (!ISO_DATE.test(date)) throw new ApiError(400, 'Date invalide.');
  return date;
};

const amount = z.number().int('Montant invalide.').min(0, 'Montant négatif interdit.').max(100_000_000);
const optionalAmount = amount.optional().default(0);

const caSchema = z.object({
  total: amount,
  especes: optionalAmount,
  tpe: optionalAmount,
  ticketsResto: optionalAmount,
  credit: optionalAmount,
  cheque: optionalAmount,
  autre: optionalAmount,
  remises: optionalAmount,
  annulations: optionalAmount,
  offerts: optionalAmount,
  nbTickets: z.number().int().min(0).nullable().optional().default(null),
  nbCouverts: z.number().int().min(0).nullable().optional().default(null),
  note: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional()
    .transform((v) => v || null),
});

const qty = z.number().int().min(0).max(100_000);
const comptageSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().regex(ISO_DATE, 'Date invalide.'),
  type: z.enum(['especes', 'tickets_resto', 'tpe']),
  moment: z.enum(['ouverture', 'intermediaire', 'passation', 'cloture']),
  details: z.object({
    denominations: z.array(z.object({ key: z.string().max(10), quantite: qty })).max(30).optional(),
    vrac: z.number().int().min(0).max(10_000_000).optional(),
    tickets: z.array(z.object({ emetteur: z.string().trim().min(1).max(80), valeur: z.number().int().min(0).max(1_000_000), quantite: qty })).max(30).optional(),
    tpe: z
      .array(z.object({ terminal: z.string().trim().min(1).max(80), montant: z.number().int().min(0).max(100_000_000), nbTransactions: z.number().int().min(0).nullable().optional().default(null) }))
      .max(10)
      .optional(),
  }),
  justification: z
    .string()
    .trim()
    .max(1000)
    .nullable()
    .optional()
    .transform((v) => v || null),
});

const clotureSchema = z.object({
  fondLaisse: amount,
  montantRemis: optionalAmount,
  remisA: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .transform((v) => v || null),
  noteCloture: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => v || null),
  forcer: z.boolean().optional().default(false),
  motifForcage: z.string().trim().max(500).optional(),
});

const motifSchema = z.object({ motif: z.string().trim().min(3, 'Indiquez un motif (3 caractères minimum).').max(500) });

export const journeesRouter = (store: Store): Router => {
  const router = Router();
  const { db } = store;

  // What the journée's opening count is compared with: the cash declared as left in the till at the
  // previous closing (the passation between the evening and the next morning).
  const fondReporte = (date: string): number | null => store.previousJournee(date)?.fondLaisse ?? null;

  const writeInfo = (req: Request, journee: Journee | null, date: string): { canWrite: boolean; reason: string | null } => {
    try {
      if (journee) store.assertJourneeWritable(req.user!, journee);
      else store.assertDateWritable(req.user!, date);
      return { canWrite: true, reason: null };
    } catch (e) {
      return { canWrite: false, reason: e instanceof ApiError ? e.message : 'Lecture seule.' };
    }
  };

  const fullDay = (req: Request, date: string) => {
    const journee = store.getJourneeByDate(date);
    const settings = store.getSettings();
    const reporte = fondReporte(date);
    const openUrgent = store.countOpenUrgentIncidents();
    if (!journee) {
      const virtual = { fondOuverture: reporte };
      const summary = computeSummary({ journee: virtual, fondParDefaut: settings.fondCaisseDefaut, ventes: [], depenses: [], mouvements: [], ca: null, comptages: [] });
      return {
        date,
        journee: null,
        ventes: [],
        depenses: [],
        mouvements: [],
        comptages: [],
        ca: null,
        summary,
        fondReporte: reporte,
        checks: computeClotureChecks({ summary, comptages: [], hasCa: false, openUrgentIncidents: openUrgent, tolerance: settings.toleranceEcart }),
        ...writeInfo(req, null, date),
      };
    }
    const data = store.loadDataset(journee);
    return {
      date,
      ...data,
      settings: undefined,
      fondReporte: reporte,
      checks: computeClotureChecks({ summary: data.summary, comptages: data.comptages, hasCa: Boolean(data.ca), openUrgentIncidents: openUrgent, tolerance: settings.toleranceEcart }),
      ...writeInfo(req, journee, date),
    };
  };

  // --- Liste / historique ----------------------------------------------------------------------
  router.get(
    '/journees',
    asyncHandler((req, res) => {
      const q = z
        .object({
          from: z.string().regex(ISO_DATE).optional(),
          to: z.string().regex(ISO_DATE).optional(),
          statut: z.enum(['ouverte', 'cloturee', 'validee']).optional(),
          ecart: z.enum(['1']).optional(),
          limit: z.coerce.number().int().min(1).max(366).default(31),
          offset: z.coerce.number().int().min(0).default(0),
        })
        .parse(req.query);
      const where: string[] = [];
      const params: unknown[] = [];
      if (q.from) (where.push('date >= ?'), params.push(q.from));
      if (q.to) (where.push('date <= ?'), params.push(q.to));
      if (q.statut) (where.push('statut = ?'), params.push(q.statut));
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const rows = db.prepare(`SELECT * FROM journees ${whereSql} ORDER BY date DESC`).all(...params) as Record<string, unknown>[];
      const tolerance = store.getSettings().toleranceEcart;

      let items = rows.map((r) => {
        const j = mapJournee(r);
        const { summary, comptages } = store.loadDataset(j);
        return {
          journee: j,
          recettes: summary.recettes.total,
          source: summary.source,
          depenses: summary.depensesTotal,
          especesAttendues: summary.especesAttendues,
          ecartCloture: summary.ecartTotalCloture,
          ecartsNonJustifies: comptages.filter((c) => c.statut === 'active' && needsJustification(c.ecart, tolerance) && !c.justification).length,
          aEcart: comptages.some((c) => c.statut === 'active' && needsJustification(c.ecart, tolerance)),
        };
      });
      if (q.ecart) items = items.filter((i) => i.aEcart);

      const totals = items.reduce(
        (t, i) => ({ recettes: t.recettes + i.recettes, depenses: t.depenses + i.depenses, ecarts: t.ecarts + (i.ecartCloture ?? 0) }),
        { recettes: 0, depenses: 0, ecarts: 0 }
      );
      res.json({ items: items.slice(q.offset, q.offset + q.limit), total: items.length, totals });
    })
  );

  router.get(
    '/journees/:date',
    asyncHandler((req, res) => {
      res.json(fullDay(req, dateParam(req)));
    })
  );

  // --- Chiffre d'affaires (ticket Z) ------------------------------------------------------------
  router.put(
    '/journees/:date/ca',
    asyncHandler((req, res) => {
      const date = dateParam(req);
      const v = caSchema.parse(req.body);
      const breakdown = sumModeFields(v);
      if (breakdown !== v.total && !v.note) {
        throw new ApiError(
          400,
          `La répartition (${formatDT(breakdown)}) ne correspond pas au total du Z (${formatDT(v.total)}). Corrigez-la ou expliquez l'écart dans la note.`,
          'CA_INCOHERENT'
        );
      }
      db.transaction(() => {
        const journee = store.getOrCreateJournee(req, date);
        store.assertJourneeWritable(req.user!, journee);
        const beforeRow = db.prepare('SELECT * FROM chiffres_affaires WHERE journee_id = ?').get(journee.id) as Record<string, unknown> | undefined;
        const before: ChiffreAffaires | null = beforeRow ? mapCa(beforeRow) : null;
        db.prepare(
          `INSERT INTO chiffres_affaires (journee_id, total, especes, tpe, tickets_resto, credit, cheque, autre, remises, annulations, offerts, nb_tickets, nb_couverts, note, saisi_par_id, saisi_par_nom, maj_le)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(journee_id) DO UPDATE SET total = excluded.total, especes = excluded.especes, tpe = excluded.tpe, tickets_resto = excluded.tickets_resto,
             credit = excluded.credit, cheque = excluded.cheque, autre = excluded.autre, remises = excluded.remises, annulations = excluded.annulations,
             offerts = excluded.offerts, nb_tickets = excluded.nb_tickets, nb_couverts = excluded.nb_couverts, note = excluded.note,
             saisi_par_id = excluded.saisi_par_id, saisi_par_nom = excluded.saisi_par_nom, maj_le = excluded.maj_le`
        ).run(
          journee.id,
          v.total,
          v.especes,
          v.tpe,
          v.ticketsResto,
          v.credit,
          v.cheque,
          v.autre,
          v.remises,
          v.annulations,
          v.offerts,
          v.nbTickets,
          v.nbCouverts,
          v.note,
          req.user!.id,
          req.user!.fullName,
          nowIso()
        );
        store.log(req, {
          module: 'ca',
          action: before ? 'modification' : 'creation',
          description: before
            ? `Chiffre d'affaires corrigé : ${formatDT(before.total)} → ${formatDT(v.total)}`
            : `Chiffre d'affaires saisi : ${formatDT(v.total)}`,
          journeeDate: date,
          entityId: journee.id,
          details: { avant: before, apres: v },
        });
      })();
      res.json(fullDay(req, date));
    })
  );

  // --- Comptages ---------------------------------------------------------------------------------
  // The count is "blind": the client sends what was physically counted and only THEN learns what
  // was expected (via /preview, nothing saved) — a Gérant can't adjust the count to the target.
  // The expected amount is always computed here, server-side, never trusted from the client.
  const evaluateComptage = (date: string, body: z.infer<typeof comptageSchema>) => {
    const journee = store.getJourneeByDate(date);
    const settings = store.getSettings();
    const reporte = fondReporte(date);
    const summary = journee
      ? store.loadDataset(journee).summary
      : computeSummary({ journee: { fondOuverture: reporte }, fondParDefaut: settings.fondCaisseDefaut, ventes: [], depenses: [], mouvements: [], ca: null, comptages: [] });
    const totalCompte = computeComptageTotal(body.type, body.details);
    const totalAttendu = expectedForComptage(body.type, body.moment, summary, reporte);
    const ecart = totalCompte - totalAttendu;
    return { totalCompte, totalAttendu, ecart, justificationRequise: needsJustification(ecart, settings.toleranceEcart), tolerance: settings.toleranceEcart };
  };

  router.post(
    '/comptages/preview',
    asyncHandler((req, res) => {
      const body = comptageSchema.parse(req.body);
      res.json(evaluateComptage(body.date, body));
    })
  );

  router.post(
    '/comptages',
    asyncHandler((req, res) => {
      const body = comptageSchema.parse(req.body);
      if (body.id) {
        const existing = db.prepare('SELECT * FROM comptages WHERE id = ?').get(body.id) as Record<string, unknown> | undefined;
        if (existing) {
          res.json({ item: mapComptage(existing), duplicate: true });
          return;
        }
      }
      const item = db.transaction(() => {
        const journee = store.getOrCreateJournee(req, body.date);
        store.assertJourneeWritable(req.user!, journee);
        const evaluation = evaluateComptage(body.date, body);
        if (evaluation.justificationRequise && !body.justification) {
          throw new ApiError(
            400,
            `Écart de ${formatDT(evaluation.ecart, { sign: true })} au-delà de la tolérance (${formatDT(evaluation.tolerance)}) : une justification est obligatoire.`,
            'JUSTIFICATION_REQUISE'
          );
        }
        const id = body.id ?? randomUUID();
        db.prepare(
          `INSERT INTO comptages (id, journee_id, type, moment, details, total_compte, total_attendu, ecart, justification, cree_par_id, cree_par_nom, cree_le)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id,
          journee.id,
          body.type,
          body.moment,
          JSON.stringify(body.details),
          evaluation.totalCompte,
          evaluation.totalAttendu,
          evaluation.ecart,
          body.justification,
          req.user!.id,
          req.user!.fullName,
          nowIso()
        );
        // The physically counted opening cash becomes the day's real starting float.
        if (body.type === 'especes' && body.moment === 'ouverture') {
          db.prepare("UPDATE journees SET fond_ouverture = ?, fond_ouverture_source = 'comptage' WHERE id = ?").run(evaluation.totalCompte, journee.id);
        }
        store.log(req, {
          module: 'comptage',
          action: 'creation',
          description: `Comptage ${COMPTAGE_TYPE_LABELS[body.type].toLowerCase()} (${COMPTAGE_MOMENT_LABELS[body.moment].toLowerCase()}) : compté ${formatDT(evaluation.totalCompte)}, attendu ${formatDT(evaluation.totalAttendu)}, écart ${formatDT(evaluation.ecart, { sign: true })}`,
          journeeDate: journee.date,
          entityId: id,
          details: { ...evaluation, details: body.details, justification: body.justification },
        });
        return mapComptage(db.prepare('SELECT * FROM comptages WHERE id = ?').get(id) as Record<string, unknown>);
      })();
      res.status(201).json({ item });
    })
  );

  router.post(
    '/comptages/:id/annuler',
    asyncHandler((req, res) => {
      const { motif } = motifSchema.parse(req.body);
      const item = db.transaction(() => {
        const row = db.prepare('SELECT * FROM comptages WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
        if (!row) throw notFound('Comptage');
        const before: Comptage = mapComptage(row);
        const journee = store.getJourneeById(before.journeeId)!;
        store.assertJourneeWritable(req.user!, journee);
        store.assertCanTouchEntry(req.user!, before);
        db.prepare("UPDATE comptages SET statut = 'annulee', annulation_motif = ?, annule_par_nom = ?, annule_le = ? WHERE id = ?").run(
          motif,
          req.user!.fullName,
          nowIso(),
          before.id
        );
        if (before.type === 'especes' && before.moment === 'ouverture') {
          // Fall back to the latest remaining opening count, else to the float carried from the day before.
          const remaining = db
            .prepare("SELECT total_compte FROM comptages WHERE journee_id = ? AND type = 'especes' AND moment = 'ouverture' AND statut = 'active' ORDER BY cree_le DESC LIMIT 1")
            .get(journee.id) as { total_compte: number } | undefined;
          const reporte = fondReporte(journee.date);
          db.prepare('UPDATE journees SET fond_ouverture = ?, fond_ouverture_source = ? WHERE id = ?').run(
            remaining?.total_compte ?? reporte,
            remaining ? 'comptage' : reporte === null ? null : 'report',
            journee.id
          );
        }
        store.log(req, {
          module: 'comptage',
          action: 'annulation',
          description: `Comptage ${COMPTAGE_TYPE_LABELS[before.type].toLowerCase()} annulé (${formatDT(before.totalCompte)}) — motif : ${motif}`,
          journeeDate: journee.date,
          entityId: before.id,
          details: { motif, avant: before },
        });
        return mapComptage(db.prepare('SELECT * FROM comptages WHERE id = ?').get(before.id) as Record<string, unknown>);
      })();
      res.json({ item });
    })
  );

  // --- Clôture / réouverture / validation ------------------------------------------------------
  router.post(
    '/journees/:date/cloture',
    asyncHandler((req, res) => {
      const date = dateParam(req);
      const v = clotureSchema.parse(req.body);
      db.transaction(() => {
        const journee = store.getJourneeByDate(date);
        if (!journee) throw new ApiError(400, 'Rien n’a encore été saisi pour cette journée.');
        store.assertJourneeWritable(req.user!, journee);
        const data = store.loadDataset(journee);
        const checks = computeClotureChecks({
          summary: data.summary,
          comptages: data.comptages,
          hasCa: Boolean(data.ca),
          openUrgentIncidents: store.countOpenUrgentIncidents(),
          tolerance: data.settings.toleranceEcart,
        });
        const blocking = checks.filter((c) => c.bloquant && !c.ok);
        if (blocking.length > 0) {
          const canForce = userCan(req.user, PERM_SUPERVISE);
          if (!v.forcer || !canForce) {
            throw new ApiError(400, `Clôture impossible : ${blocking.map((c) => c.label.toLowerCase()).join(', ')}.`, 'CLOTURE_INCOMPLETE');
          }
          if (!v.motifForcage || v.motifForcage.length < 3) throw new ApiError(400, 'Motif obligatoire pour forcer la clôture.');
        }
        // The cash physically counted at closing must be fully accounted for: what stays in the
        // till for tomorrow plus what was handed over.
        const comptageEspeces = data.summary.dernierComptage.especes;
        if (comptageEspeces && comptageEspeces.moment === 'cloture' && v.fondLaisse + v.montantRemis !== comptageEspeces.totalCompte && !v.noteCloture) {
          throw new ApiError(
            400,
            `Fond laissé (${formatDT(v.fondLaisse)}) + montant remis (${formatDT(v.montantRemis)}) ≠ espèces comptées (${formatDT(comptageEspeces.totalCompte)}). Corrigez ou expliquez dans la note de clôture.`,
            'REPARTITION_ESPECES'
          );
        }
        if (v.montantRemis > 0 && !v.remisA) throw new ApiError(400, 'Indiquez à qui le montant a été remis.');
        db.prepare(
          `UPDATE journees SET statut = 'cloturee', fond_laisse = ?, montant_remis = ?, remis_a = ?, note_cloture = ?,
             cloturee_par_id = ?, cloturee_par_nom = ?, cloturee_le = ? WHERE id = ?`
        ).run(v.fondLaisse, v.montantRemis, v.remisA, v.noteCloture, req.user!.id, req.user!.fullName, nowIso(), journee.id);
        // The next journée (if it already exists, e.g. after a late closing) inherits the float
        // unless it was already physically counted.
        const next = db.prepare('SELECT * FROM journees WHERE date > ? ORDER BY date ASC LIMIT 1').get(date) as Record<string, unknown> | undefined;
        if (next && next.fond_ouverture_source !== 'comptage') {
          db.prepare("UPDATE journees SET fond_ouverture = ?, fond_ouverture_source = 'report' WHERE id = ?").run(v.fondLaisse, next.id);
        }
        store.log(req, {
          module: 'journee',
          action: 'cloture',
          description: `Clôture de la journée du ${formatDateFr(date, false)} — recettes ${formatDT(data.summary.recettes.total)}, fond laissé ${formatDT(v.fondLaisse)}${v.montantRemis ? `, remis ${formatDT(v.montantRemis)} à ${v.remisA}` : ''}${blocking.length ? ` (FORCÉE : ${v.motifForcage})` : ''}`,
          journeeDate: date,
          entityId: journee.id,
          details: { ...v, checks, ecartTotal: data.summary.ecartTotalCloture },
        });
      })();
      res.json(fullDay(req, date));
    })
  );

  router.post(
    '/journees/:date/reouvrir',
    requirePerm(PERM_SUPERVISE),
    asyncHandler((req, res) => {
      const date = dateParam(req);
      const { motif } = motifSchema.parse(req.body);
      const journee = store.getJourneeByDate(date);
      if (!journee) throw notFound('Journée');
      if (journee.statut === 'ouverte') throw new ApiError(409, 'Cette journée est déjà ouverte.');
      db.prepare("UPDATE journees SET statut = 'ouverte', reouverture_motif = ?, validee_par_id = NULL, validee_par_nom = NULL, validee_le = NULL WHERE id = ?").run(
        motif,
        journee.id
      );
      store.log(req, {
        module: 'journee',
        action: 'reouverture',
        description: `Réouverture de la journée du ${formatDateFr(date, false)} — motif : ${motif}`,
        journeeDate: date,
        entityId: journee.id,
        details: { motif, statutPrecedent: journee.statut },
      });
      res.json(fullDay(req, date));
    })
  );

  router.post(
    '/journees/:date/valider',
    requirePerm(PERM_SUPERVISE),
    asyncHandler((req, res) => {
      const date = dateParam(req);
      const journee = store.getJourneeByDate(date);
      if (!journee) throw notFound('Journée');
      if (journee.statut !== 'cloturee') throw new ApiError(409, 'Seule une journée clôturée peut être validée.');
      db.prepare("UPDATE journees SET statut = 'validee', validee_par_id = ?, validee_par_nom = ?, validee_le = ? WHERE id = ?").run(
        req.user!.id,
        req.user!.fullName,
        nowIso(),
        journee.id
      );
      store.log(req, { module: 'journee', action: 'validation', description: `Validation de la journée du ${formatDateFr(date, false)}`, journeeDate: date, entityId: journee.id });
      res.json(fullDay(req, date));
    })
  );

  // Days that should have been closed but weren't — the dashboard nags about these so a forgotten
  // closing is noticed the next morning, not at the end of the month.
  router.get(
    '/alertes',
    asyncHandler((_req, res) => {
      const today = store.businessToday();
      const nonCloturees = (db.prepare("SELECT date FROM journees WHERE statut = 'ouverte' AND date < ? ORDER BY date DESC LIMIT 30").all(today) as { date: string }[]).map(
        (r) => ({ date: r.date, jours: daysBetween(r.date, today) })
      );
      const tolerance = store.getSettings().toleranceEcart;
      const ecartsNonJustifies = db
        .prepare(
          `SELECT c.id, j.date, c.type, c.ecart FROM comptages c JOIN journees j ON j.id = c.journee_id
           WHERE c.statut = 'active' AND ABS(c.ecart) > ? AND (c.justification IS NULL OR c.justification = '') ORDER BY j.date DESC LIMIT 20`
        )
        .all(tolerance);
      const recusAFournir = (db.prepare("SELECT COUNT(*) AS n FROM depenses WHERE statut = 'active' AND justificatif = 'a_fournir'").get() as { n: number }).n;
      const incidentsOuverts = (db.prepare("SELECT COUNT(*) AS n FROM notes WHERE type = 'incident' AND statut != 'resolu'").get() as { n: number }).n;
      res.json({ today, nonCloturees, ecartsNonJustifies, recusAFournir, incidentsOuverts });
    })
  );

  return router;
};
