import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { INCIDENT_CATEGORY_LABELS, ISO_DATE, NOTE_STATUT_LABELS, NOTE_TYPE_LABELS, PERM_SUPERVISE, userCan, type Note } from '../../shared/model.js';
import { ApiError, asyncHandler, notFound } from '../lib/http.js';
import { mapNote, nowIso, type Store } from '../lib/store.js';

const noteFields = z.object({
  date: z.string().regex(ISO_DATE).nullable().optional().default(null),
  type: z.enum(['note', 'incident', 'consigne', 'passation']),
  categorie: z.string().max(40).nullable().optional().default(null),
  priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).default('normale'),
  titre: z.string().trim().min(2, 'Titre requis.').max(160),
  contenu: z
    .string()
    .trim()
    .max(4000)
    .nullable()
    .optional()
    .transform((v) => v || null),
});

// Notes are team communication (incidents, consignes, passation) — unlike accounting entries they
// stay writable after the day is closed, and anyone with access may move an incident forward
// (the evening Gérant resolves what the morning one reported).
export const notesRouter = (store: Store): Router => {
  const router = Router();
  const { db } = store;
  const getNote = (id: string): Note | null => {
    const r = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return r ? mapNote(r) : null;
  };

  router.get(
    '/notes',
    asyncHandler((req, res) => {
      const q = z
        .object({
          statut: z.enum(['ouvert', 'en_cours', 'resolu', 'non_resolu']).optional(),
          type: z.enum(['note', 'incident', 'consigne', 'passation']).optional(),
          priorite: z.enum(['basse', 'normale', 'haute', 'urgente']).optional(),
          categorie: z.string().max(40).optional(),
          date: z.string().regex(ISO_DATE).optional(),
          from: z.string().regex(ISO_DATE).optional(),
          to: z.string().regex(ISO_DATE).optional(),
          q: z.string().max(100).optional(),
          limit: z.coerce.number().int().min(1).max(500).default(100),
        })
        .parse(req.query);
      const where: string[] = [];
      const p: unknown[] = [];
      if (q.statut === 'non_resolu') where.push("statut != 'resolu'");
      else if (q.statut) (where.push('statut = ?'), p.push(q.statut));
      if (q.type) (where.push('type = ?'), p.push(q.type));
      if (q.priorite) (where.push('priorite = ?'), p.push(q.priorite));
      if (q.categorie) (where.push('categorie = ?'), p.push(q.categorie));
      if (q.date) (where.push('journee_date = ?'), p.push(q.date));
      if (q.from) (where.push('substr(cree_le, 1, 10) >= ?'), p.push(q.from));
      if (q.to) (where.push('substr(cree_le, 1, 10) <= ?'), p.push(q.to));
      if (q.q) {
        where.push('(titre LIKE ? OR contenu LIKE ? OR resolution LIKE ?)');
        const like = `%${q.q}%`;
        p.push(like, like, like);
      }
      const rows = db
        .prepare(
          `SELECT * FROM notes ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
           ORDER BY epingle DESC, CASE WHEN statut = 'resolu' THEN 1 ELSE 0 END,
             CASE priorite WHEN 'urgente' THEN 0 WHEN 'haute' THEN 1 WHEN 'normale' THEN 2 ELSE 3 END, cree_le DESC
           LIMIT ?`
        )
        .all(...p, q.limit) as Record<string, unknown>[];
      res.json({ items: rows.map(mapNote) });
    })
  );

  router.post(
    '/notes',
    asyncHandler((req, res) => {
      const id = z.string().uuid().optional().parse(req.body?.id);
      const v = noteFields.parse(req.body);
      if (id) {
        const existing = getNote(id);
        if (existing) {
          res.json({ item: existing, duplicate: true });
          return;
        }
      }
      if (v.type === 'incident' && !v.categorie) throw new ApiError(400, "Choisissez le type d'incident.");
      const newId = id ?? randomUUID();
      const date = v.date ?? store.businessToday();
      db.prepare(
        `INSERT INTO notes (id, journee_date, type, categorie, priorite, titre, contenu, statut, cree_par_id, cree_par_nom, cree_le)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'ouvert', ?, ?, ?)`
      ).run(newId, date, v.type, v.type === 'incident' ? v.categorie : null, v.priorite, v.titre, v.contenu, req.user!.id, req.user!.fullName, nowIso());
      store.log(req, {
        module: 'note',
        action: 'creation',
        description: `${NOTE_TYPE_LABELS[v.type]}${v.categorie ? ` (${INCIDENT_CATEGORY_LABELS[v.categorie] ?? v.categorie})` : ''} : ${v.titre}`,
        journeeDate: date,
        entityId: newId,
        details: v,
      });
      res.status(201).json({ item: getNote(newId) });
    })
  );

  router.put(
    '/notes/:id',
    asyncHandler((req, res) => {
      const v = noteFields.parse(req.body);
      const before = getNote(req.params.id);
      if (!before) throw notFound('Note');
      if (before.creeParId !== req.user!.id && !userCan(req.user, PERM_SUPERVISE)) {
        throw new ApiError(403, "Seul l'auteur ou un superviseur peut modifier cette note.");
      }
      db.prepare('UPDATE notes SET type = ?, categorie = ?, priorite = ?, titre = ?, contenu = ?, maj_le = ? WHERE id = ?').run(
        v.type,
        v.type === 'incident' ? v.categorie : null,
        v.priorite,
        v.titre,
        v.contenu,
        nowIso(),
        before.id
      );
      const after = getNote(before.id)!;
      store.log(req, { module: 'note', action: 'modification', description: `Note modifiée : ${v.titre}`, journeeDate: before.journeeDate, entityId: before.id, details: { avant: before, apres: after } });
      res.json({ item: after });
    })
  );

  router.post(
    '/notes/:id/statut',
    asyncHandler((req, res) => {
      const v = z
        .object({
          statut: z.enum(['ouvert', 'en_cours', 'resolu']),
          resolution: z.string().trim().max(2000).optional(),
        })
        .parse(req.body);
      const before = getNote(req.params.id);
      if (!before) throw notFound('Note');
      if (v.statut === 'resolu' && before.type === 'incident' && !v.resolution) {
        throw new ApiError(400, 'Expliquez comment l’incident a été résolu.');
      }
      const resolved = v.statut === 'resolu';
      db.prepare('UPDATE notes SET statut = ?, resolution = ?, resolu_par_nom = ?, resolu_le = ?, maj_le = ? WHERE id = ?').run(
        v.statut,
        resolved ? v.resolution || null : before.resolution,
        resolved ? req.user!.fullName : null,
        resolved ? nowIso() : null,
        nowIso(),
        before.id
      );
      store.log(req, {
        module: 'note',
        action: resolved ? 'resolution' : 'modification',
        description: `« ${before.titre} » : ${NOTE_STATUT_LABELS[before.statut]} → ${NOTE_STATUT_LABELS[v.statut]}${v.resolution ? ` — ${v.resolution}` : ''}`,
        journeeDate: before.journeeDate,
        entityId: before.id,
      });
      res.json({ item: getNote(before.id) });
    })
  );

  router.post(
    '/notes/:id/epingle',
    asyncHandler((req, res) => {
      const { epingle } = z.object({ epingle: z.boolean() }).parse(req.body);
      const before = getNote(req.params.id);
      if (!before) throw notFound('Note');
      db.prepare('UPDATE notes SET epingle = ? WHERE id = ?').run(epingle ? 1 : 0, before.id);
      res.json({ item: getNote(before.id) });
    })
  );

  return router;
};
