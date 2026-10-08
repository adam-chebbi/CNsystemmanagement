import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import {
  ISO_DATE,
  MODE_DEPENSE_LABELS,
  MODE_PAIEMENT_LABELS,
  MOUVEMENT_BY_ID,
  MOUVEMENT_TYPES,
  MODES_DEPENSE,
  MODES_PAIEMENT,
  formatDT,
  type Depense,
  type Mouvement,
  type Vente,
} from '../../shared/model.js';
import { ApiError, asyncHandler, notFound } from '../lib/http.js';
import { mapDepense, mapMouvement, mapVente, nowIso, type Store } from '../lib/store.js';

// Ventes, dépenses and mouvements de caisse share one lifecycle, so one factory serves all three:
//   POST   /<kind>              create — idempotent on a client-generated id, so a request replayed
//                               by the offline queue after a dropped connection never doubles an entry
//   PUT    /<kind>/:id          edit   — author or supervisor, journée still open
//   POST   /<kind>/:id/annuler  cancel — with a mandatory reason; nothing is ever hard-deleted

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const heure = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Heure invalide (HH:MM).')
  .optional()
  .nullable()
  .transform((v) => v ?? null);

const montant = z.number({ error: 'Montant requis.' }).int('Montant invalide.').positive('Le montant doit être supérieur à 0.').max(100_000_000, 'Montant trop élevé.');

const venteFields = z
  .object({
    heure,
    categorie: z.string().trim().min(1, 'Catégorie requise.').max(80),
    modePaiement: z.enum(MODES_PAIEMENT.map((m) => m.id) as [string, ...string[]]),
    montant,
    client: optionalText(80),
    description: optionalText(500),
  })
  .superRefine((v, ctx) => {
    if (v.modePaiement === 'credit' && !v.client) ctx.addIssue({ code: 'custom', path: ['client'], message: 'Nom du client obligatoire pour une vente à crédit.' });
  });

const depenseFields = z.object({
  heure,
  categorie: z.string().trim().min(1, 'Catégorie requise.').max(80),
  modePaiement: z.enum(MODES_DEPENSE.map((m) => m.id) as [string, ...string[]]),
  montant,
  beneficiaire: optionalText(120),
  description: optionalText(500),
  justificatif: z.enum(['oui', 'non', 'a_fournir']),
  photo: z
    .string()
    .regex(/^[a-f0-9-]{36}\.(jpg|png|webp)$/, 'Photo invalide.')
    .optional()
    .nullable()
    .transform((v) => v ?? null),
});

const mouvementFields = z
  .object({
    heure,
    type: z.enum(MOUVEMENT_TYPES.map((m) => m.id) as [string, ...string[]]),
    montant,
    personne: optionalText(120),
    description: optionalText(500),
  })
  .superRefine((v, ctx) => {
    const def = MOUVEMENT_BY_ID[v.type as Mouvement['type']];
    if (def.needsPerson && !v.personne) {
      ctx.addIssue({ code: 'custom', path: ['personne'], message: def.needsPerson === 'client' ? 'Nom du client obligatoire.' : 'Indiquez à qui l’argent a été remis.' });
    }
    if ((v.type === 'autre_entree' || v.type === 'autre_sortie') && !v.description) {
      ctx.addIssue({ code: 'custom', path: ['description'], message: 'Précisez le motif de ce mouvement.' });
    }
  });

const createEnvelope = z.object({
  id: z.string().uuid().optional(),
  date: z.string().regex(ISO_DATE, 'Date invalide.'),
});

const annulerSchema = z.object({ motif: z.string().trim().min(3, 'Indiquez le motif de l’annulation (3 caractères minimum).').max(300) });

interface KindConfig<T extends { id: string; journeeId: string; creeParId: string; statut: string }> {
  path: string;
  table: string;
  module: string;
  label: string;
  schema: z.ZodType<Record<string, unknown>>;
  columns: Record<string, string>; // field -> column
  map: (r: Record<string, unknown>) => T;
  describe: (v: Record<string, unknown>) => string;
  validate?: (v: Record<string, unknown>, store: Store) => void;
}

const buildKindRouter = <T extends { id: string; journeeId: string; creeParId: string; statut: string }>(store: Store, cfg: KindConfig<T>): Router => {
  const router = Router();
  const { db } = store;
  const fields = Object.keys(cfg.columns);
  const getById = (id: string): T | null => {
    const r = db.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
    return r ? cfg.map(r) : null;
  };

  router.post(
    `/${cfg.path}`,
    asyncHandler((req, res) => {
      const env = createEnvelope.parse(req.body);
      const values = cfg.schema.parse(req.body);
      cfg.validate?.(values, store);

      if (env.id) {
        const existing = getById(env.id);
        if (existing) {
          if (existing.creeParId !== req.user!.id) throw new ApiError(409, 'Identifiant déjà utilisé.');
          res.status(200).json({ item: existing, duplicate: true });
          return;
        }
      }

      const item = db.transaction(() => {
        const journee = store.getOrCreateJournee(req, env.date);
        store.assertJourneeWritable(req.user!, journee);
        const id = env.id ?? randomUUID();
        const cols = ['id', 'journee_id', ...fields.map((f) => cfg.columns[f]), 'cree_par_id', 'cree_par_nom', 'cree_le'];
        db.prepare(`INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(
          id,
          journee.id,
          ...fields.map((f) => values[f] ?? null),
          req.user!.id,
          req.user!.fullName,
          nowIso()
        );
        store.log(req, {
          module: cfg.module,
          action: 'creation',
          description: `${cfg.label} : ${cfg.describe(values)}`,
          journeeDate: journee.date,
          entityId: id,
          details: values,
        });
        return getById(id)!;
      })();
      res.status(201).json({ item });
    })
  );

  router.put(
    `/${cfg.path}/:id`,
    asyncHandler((req, res) => {
      const values = cfg.schema.parse(req.body);
      cfg.validate?.(values, store);
      const item = db.transaction(() => {
        const before = getById(req.params.id);
        if (!before) throw notFound(cfg.label);
        const journee = store.getJourneeById(before.journeeId)!;
        store.assertJourneeWritable(req.user!, journee);
        store.assertCanTouchEntry(req.user!, before);
        db.prepare(
          `UPDATE ${cfg.table} SET ${fields.map((f) => `${cfg.columns[f]} = ?`).join(', ')}, maj_par_nom = ?, maj_le = ? WHERE id = ?`
        ).run(...fields.map((f) => values[f] ?? null), req.user!.fullName, nowIso(), before.id);
        const after = getById(before.id)!;
        store.log(req, {
          module: cfg.module,
          action: 'modification',
          description: `${cfg.label} modifiée : ${cfg.describe(values)}`,
          journeeDate: journee.date,
          entityId: before.id,
          details: { avant: before, apres: after },
        });
        return after;
      })();
      res.json({ item });
    })
  );

  router.post(
    `/${cfg.path}/:id/annuler`,
    asyncHandler((req, res) => {
      const { motif } = annulerSchema.parse(req.body);
      const item = db.transaction(() => {
        const before = getById(req.params.id);
        if (!before) throw notFound(cfg.label);
        const journee = store.getJourneeById(before.journeeId)!;
        store.assertJourneeWritable(req.user!, journee);
        store.assertCanTouchEntry(req.user!, before);
        db.prepare(`UPDATE ${cfg.table} SET statut = 'annulee', annulation_motif = ?, annule_par_nom = ?, annule_le = ? WHERE id = ?`).run(
          motif,
          req.user!.fullName,
          nowIso(),
          before.id
        );
        store.log(req, {
          module: cfg.module,
          action: 'annulation',
          description: `${cfg.label} annulée (${cfg.describe(before as unknown as Record<string, unknown>)}) — motif : ${motif}`,
          journeeDate: journee.date,
          entityId: before.id,
          details: { motif, avant: before },
        });
        return getById(before.id)!;
      })();
      res.json({ item });
    })
  );

  return router;
};

export const entriesRouter = (store: Store): Router => {
  const router = Router();

  router.use(
    buildKindRouter<Vente>(store, {
      path: 'ventes',
      table: 'ventes',
      module: 'vente',
      label: 'Vente',
      schema: venteFields as unknown as z.ZodType<Record<string, unknown>>,
      columns: { heure: 'heure', categorie: 'categorie', modePaiement: 'mode_paiement', montant: 'montant', client: 'client', description: 'description' },
      map: mapVente,
      describe: (v) =>
        `${formatDT(Number(v.montant))} — ${v.categorie} (${MODE_PAIEMENT_LABELS[v.modePaiement as Vente['modePaiement']]}${v.client ? `, ${v.client}` : ''})`,
    })
  );

  router.use(
    buildKindRouter<Depense>(store, {
      path: 'depenses',
      table: 'depenses',
      module: 'depense',
      label: 'Dépense',
      schema: depenseFields as unknown as z.ZodType<Record<string, unknown>>,
      columns: {
        heure: 'heure',
        categorie: 'categorie',
        modePaiement: 'mode_paiement',
        montant: 'montant',
        beneficiaire: 'beneficiaire',
        description: 'description',
        justificatif: 'justificatif',
        photo: 'photo',
      },
      map: mapDepense,
      describe: (v) =>
        `${formatDT(Number(v.montant))} — ${v.categorie}${v.beneficiaire ? ` (${v.beneficiaire})` : ''}, ${MODE_DEPENSE_LABELS[v.modePaiement as Depense['modePaiement']]}`,
      // A large cash expense without a receipt is exactly the line an owner questions later — the
      // Gérant must at least say what it was for, in writing, at the moment it happened.
      validate: (v, s) => {
        const { depenseSeuilJustificatif } = s.getSettings();
        if (Number(v.montant) > depenseSeuilJustificatif && v.justificatif !== 'oui' && !v.description) {
          throw new ApiError(400, `Au-delà de ${formatDT(depenseSeuilJustificatif)} sans reçu, une description de la dépense est obligatoire.`);
        }
      },
    })
  );

  router.use(
    buildKindRouter<Mouvement>(store, {
      path: 'mouvements',
      table: 'mouvements',
      module: 'mouvement',
      label: 'Mouvement de caisse',
      schema: mouvementFields as unknown as z.ZodType<Record<string, unknown>>,
      columns: { heure: 'heure', type: 'type', montant: 'montant', personne: 'personne', description: 'description' },
      map: mapMouvement,
      describe: (v) => {
        const def = MOUVEMENT_BY_ID[v.type as Mouvement['type']];
        return `${def.label} ${def.sens === 1 ? '+' : '−'}${formatDT(Number(v.montant))}${v.personne ? ` (${v.personne})` : ''}`;
      },
    })
  );

  return router;
};

