import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_MODULES,
  ISO_DATE,
  PERM_SETTINGS,
  PERM_SUPERVISE,
  REFERENTIEL_TYPE_LABELS,
  formatDT,
  userCan,
  type ActivityEntry,
} from '../../shared/model.js';
import { ApiError, asyncHandler, notFound } from '../lib/http.js';
import { requirePerm } from '../lib/mainAuth.js';
import { mapDepense, mapReferentiel, nowIso, type Store } from '../lib/store.js';

const normalizeClient = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');

export const miscRouter = (store: Store, uploadsDir: string): Router => {
  const router = Router();
  const { db } = store;

  // --- Crédits clients (ardoise) --------------------------------------------------------------
  // Derived, never stored: every vente "Crédit client" adds to a customer's tab, every
  // "Remboursement d'un crédit client" movement takes from it. Names are matched loosely (case,
  // accents, spaces) since they're typed by hand at the counter.
  router.get(
    '/credits',
    asyncHandler((_req, res) => {
      const ventes = db
        .prepare(
          `SELECT v.client AS personne, v.montant, j.date, v.description, v.cree_par_nom FROM ventes v JOIN journees j ON j.id = v.journee_id
           WHERE v.statut = 'active' AND v.mode_paiement = 'credit' AND v.client IS NOT NULL`
        )
        .all() as { personne: string; montant: number; date: string; description: string | null; cree_par_nom: string }[];
      const remboursements = db
        .prepare(
          `SELECT m.personne, m.montant, j.date, m.description, m.cree_par_nom FROM mouvements m JOIN journees j ON j.id = m.journee_id
           WHERE m.statut = 'active' AND m.type = 'encaissement_credit' AND m.personne IS NOT NULL`
        )
        .all() as typeof ventes;

      const byClient = new Map<string, { client: string; du: number; rembourse: number; derniere: string; operations: { date: string; type: 'credit' | 'remboursement'; montant: number; description: string | null; par: string }[] }>();
      const add = (r: (typeof ventes)[number], type: 'credit' | 'remboursement') => {
        const key = normalizeClient(r.personne);
        const entry = byClient.get(key) ?? { client: r.personne.trim(), du: 0, rembourse: 0, derniere: r.date, operations: [] };
        if (type === 'credit') entry.du += r.montant;
        else entry.rembourse += r.montant;
        if (r.date > entry.derniere) entry.derniere = r.date;
        entry.operations.push({ date: r.date, type, montant: r.montant, description: r.description, par: r.cree_par_nom });
        byClient.set(key, entry);
      };
      ventes.forEach((r) => add(r, 'credit'));
      remboursements.forEach((r) => add(r, 'remboursement'));
      const items = [...byClient.values()]
        .map((c) => ({ ...c, solde: c.du - c.rembourse, operations: c.operations.sort((a, b) => (a.date < b.date ? 1 : -1)) }))
        .sort((a, b) => b.solde - a.solde);
      res.json({ items, totalDu: items.reduce((s, c) => s + Math.max(0, c.solde), 0) });
    })
  );

  // --- Journal d'activité ---------------------------------------------------------------------
  const journalQuery = z.object({
    from: z.string().regex(ISO_DATE).optional(),
    to: z.string().regex(ISO_DATE).optional(),
    userId: z.string().max(64).optional(),
    module: z.string().max(30).optional(),
    action: z.string().max(30).optional(),
    journeeDate: z.string().regex(ISO_DATE).optional(),
    q: z.string().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  });

  // A Gérant sees their own actions; the supervisor (owner) sees everyone's.
  const buildJournalWhere = (req: Request, q: z.infer<typeof journalQuery>) => {
    const where: string[] = [];
    const p: unknown[] = [];
    const seeAll = userCan(req.user, PERM_SUPERVISE);
    if (!seeAll) (where.push('user_id = ?'), p.push(req.user!.id));
    else if (q.userId) (where.push('user_id = ?'), p.push(q.userId));
    if (q.from) (where.push('timestamp >= ?'), p.push(new Date(`${q.from}T00:00:00`).toISOString()));
    if (q.to) (where.push('timestamp < ?'), p.push(new Date(new Date(`${q.to}T00:00:00`).getTime() + 86400000).toISOString()));
    if (q.module) (where.push('module = ?'), p.push(q.module));
    if (q.action) (where.push('action = ?'), p.push(q.action));
    if (q.journeeDate) (where.push('journee_date = ?'), p.push(q.journeeDate));
    if (q.q) {
      where.push('(description LIKE ? OR user_name LIKE ?)');
      p.push(`%${q.q}%`, `%${q.q}%`);
    }
    return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params: p, seeAll };
  };

  const mapActivity = (r: Record<string, unknown>): ActivityEntry => ({
    id: String(r.id),
    timestamp: String(r.timestamp),
    userId: (r.user_id as string) ?? null,
    userName: String(r.user_name),
    module: String(r.module),
    action: String(r.action),
    description: String(r.description),
    journeeDate: (r.journee_date as string) ?? null,
    entityId: (r.entity_id as string) ?? null,
    details: r.details ? JSON.parse(String(r.details)) : null,
    ip: (r.ip as string) ?? null,
  });

  router.get(
    '/journal',
    asyncHandler((req, res) => {
      const q = journalQuery.parse(req.query);
      const w = buildJournalWhere(req, q);
      const total = (db.prepare(`SELECT COUNT(*) AS n FROM activity_log ${w.sql}`).get(...w.params) as { n: number }).n;
      const rows = db.prepare(`SELECT * FROM activity_log ${w.sql} ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(...w.params, q.limit, q.offset) as Record<string, unknown>[];
      const users = w.seeAll
        ? (db.prepare('SELECT user_id AS id, MAX(user_name) AS name FROM activity_log WHERE user_id IS NOT NULL GROUP BY user_id ORDER BY name').all() as { id: string; name: string }[])
        : [{ id: req.user!.id, name: req.user!.fullName }];
      res.json({ items: rows.map(mapActivity), total, users, seeAll: w.seeAll });
    })
  );

  router.get(
    '/journal/export.csv',
    asyncHandler((req, res) => {
      const q = journalQuery.parse({ ...req.query, limit: 200, offset: 0 });
      const w = buildJournalWhere(req, q);
      const rows = (db.prepare(`SELECT * FROM activity_log ${w.sql} ORDER BY timestamp DESC LIMIT 20000`).all(...w.params) as Record<string, unknown>[]).map(mapActivity);
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = [
        ['Date et heure', 'Utilisateur', 'Module', 'Action', 'Journée', 'Description', 'Adresse IP'].map(esc).join(';'),
        ...rows.map((r) =>
          [
            new Date(r.timestamp).toLocaleString('fr-FR', { timeZone: process.env.TZ || 'Africa/Tunis' }),
            r.userName,
            ACTIVITY_MODULES[r.module] ?? r.module,
            ACTIVITY_ACTIONS[r.action] ?? r.action,
            r.journeeDate ?? '',
            r.description,
            r.ip ?? '',
          ]
            .map(esc)
            .join(';')
        ),
      ];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="journal-historique-${store.businessToday()}.csv"`);
      res.send(`﻿${lines.join('\r\n')}`);
    })
  );

  // --- Paramètres & référentiels --------------------------------------------------------------
  router.get(
    '/parametres',
    asyncHandler((_req, res) => {
      const referentiels = (db.prepare('SELECT * FROM referentiels ORDER BY type, ordre, label').all() as Record<string, unknown>[]).map(mapReferentiel);
      res.json({ settings: store.getSettings(), referentiels });
    })
  );

  router.put(
    '/parametres',
    requirePerm(PERM_SETTINGS),
    asyncHandler((req, res) => {
      const next = z
        .object({
          toleranceEcart: z.number().int().min(0).max(1_000_000),
          fondCaisseDefaut: z.number().int().min(0).max(100_000_000),
          joursRattrapage: z.number().int().min(0).max(31),
          heureBascule: z.number().int().min(0).max(12),
          depenseSeuilJustificatif: z.number().int().min(0).max(100_000_000),
        })
        .parse(req.body);
      const before = store.getSettings();
      store.saveSettings(next);
      store.log(req, {
        module: 'parametres',
        action: 'modification',
        description: `Paramètres modifiés (tolérance ${formatDT(next.toleranceEcart)}, fond par défaut ${formatDT(next.fondCaisseDefaut)}, rattrapage ${next.joursRattrapage} j)`,
        details: { avant: before, apres: next },
      });
      res.json({ settings: store.getSettings() });
    })
  );

  const refSchema = z.object({
    type: z.enum(['categorie_depense', 'categorie_vente', 'tpe', 'emetteur_ticket']),
    label: z.string().trim().min(1, 'Libellé requis.').max(80),
    actif: z.boolean().default(true),
    ordre: z.number().int().min(0).max(999).default(0),
    valeur: z.number().int().min(0).max(1_000_000).nullable().optional().default(null),
  });

  router.post(
    '/referentiels',
    requirePerm(PERM_SETTINGS),
    asyncHandler((req, res) => {
      const v = refSchema.parse(req.body);
      const dup = db.prepare('SELECT 1 FROM referentiels WHERE type = ? AND LOWER(label) = LOWER(?)').get(v.type, v.label);
      if (dup) throw new ApiError(409, 'Ce libellé existe déjà.');
      const id = randomUUID();
      db.prepare('INSERT INTO referentiels (id, type, label, actif, ordre, valeur) VALUES (?, ?, ?, ?, ?, ?)').run(id, v.type, v.label, v.actif ? 1 : 0, v.ordre, v.valeur);
      store.log(req, { module: 'parametres', action: 'creation', description: `${REFERENTIEL_TYPE_LABELS[v.type]} : ajout de « ${v.label} »` });
      res.status(201).json({ item: mapReferentiel(db.prepare('SELECT * FROM referentiels WHERE id = ?').get(id) as Record<string, unknown>) });
    })
  );

  // No delete: past entries keep their label as plain text anyway, and deactivating keeps the list
  // history intact while removing the choice from the forms.
  router.put(
    '/referentiels/:id',
    requirePerm(PERM_SETTINGS),
    asyncHandler((req, res) => {
      const v = refSchema.omit({ type: true }).parse(req.body);
      const before = db.prepare('SELECT * FROM referentiels WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
      if (!before) throw notFound('Élément');
      db.prepare('UPDATE referentiels SET label = ?, actif = ?, ordre = ?, valeur = ? WHERE id = ?').run(v.label, v.actif ? 1 : 0, v.ordre, v.valeur, req.params.id);
      store.log(req, {
        module: 'parametres',
        action: 'modification',
        description: `${REFERENTIEL_TYPE_LABELS[before.type as keyof typeof REFERENTIEL_TYPE_LABELS]} : « ${before.label} » → « ${v.label} »${v.actif ? '' : ' (désactivé)'}`,
      });
      res.json({ item: mapReferentiel(db.prepare('SELECT * FROM referentiels WHERE id = ?').get(req.params.id) as Record<string, unknown>) });
    })
  );

  // --- Photos de reçus ------------------------------------------------------------------------
  const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
  const MIME_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const EXT_MIME = Object.fromEntries(Object.entries(MIME_EXT).map(([m, e]) => [e, m]));

  router.post(
    '/fichiers',
    asyncHandler((req, res) => {
      const { dataUrl } = z.object({ dataUrl: z.string().max(7_000_000) }).parse(req.body);
      const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!m) throw new ApiError(400, 'Format de photo non supporté (JPEG, PNG ou WebP).');
      const buffer = Buffer.from(m[2], 'base64');
      if (buffer.length > MAX_PHOTO_BYTES) throw new ApiError(413, 'Photo trop volumineuse (4 Mo maximum).');
      const name = `${randomUUID()}.${MIME_EXT[m[1]]}`;
      fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, name), buffer);
      res.status(201).json({ name });
    })
  );

  router.get(
    '/fichiers/:name',
    asyncHandler((req, res) => {
      const name = String(req.params.name);
      if (!/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(name)) throw notFound('Fichier');
      const file = path.join(uploadsDir, name);
      if (!fs.existsSync(file)) throw notFound('Fichier');
      res.setHeader('Content-Type', EXT_MIME[name.split('.').pop()!]);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      fs.createReadStream(file).pipe(res);
    })
  );

  router.get(
    '/depenses/a-fournir',
    asyncHandler((_req, res) => {
      const rows = db
        .prepare(
          `SELECT d.*, j.date AS journee_date FROM depenses d JOIN journees j ON j.id = d.journee_id
           WHERE d.statut = 'active' AND d.justificatif = 'a_fournir' ORDER BY j.date DESC, d.cree_le DESC LIMIT 200`
        )
        .all() as Record<string, unknown>[];
      res.json({ items: rows.map((r) => ({ ...mapDepense(r), date: String(r.journee_date) })) });
    })
  );

  // A receipt often arrives the next day: attaching it stays possible on a closed (not validated)
  // journée — it adds proof, it changes no amount.
  router.post(
    '/depenses/:id/justificatif',
    asyncHandler((req, res) => {
      const { photo } = z.object({ photo: z.string().regex(/^[a-f0-9-]{36}\.(jpg|png|webp)$/, 'Photo invalide.') }).parse(req.body);
      const row = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
      if (!row) throw notFound('Dépense');
      const dep = mapDepense(row);
      if (dep.statut !== 'active') throw new ApiError(409, 'Cette dépense est annulée.');
      const journee = store.getJourneeById(dep.journeeId)!;
      if (journee.statut === 'validee') throw new ApiError(423, 'Journée validée : demandez au superviseur de la rouvrir.');
      db.prepare("UPDATE depenses SET photo = ?, justificatif = 'oui', maj_par_nom = ?, maj_le = ? WHERE id = ?").run(photo, req.user!.fullName, nowIso(), dep.id);
      store.log(req, {
        module: 'depense',
        action: 'modification',
        description: `Reçu ajouté à la dépense ${dep.categorie} (${formatDT(dep.montant)})`,
        journeeDate: journee.date,
        entityId: dep.id,
      });
      res.json({ item: mapDepense(db.prepare('SELECT * FROM depenses WHERE id = ?').get(dep.id) as Record<string, unknown>) });
    })
  );

  return router;
};
