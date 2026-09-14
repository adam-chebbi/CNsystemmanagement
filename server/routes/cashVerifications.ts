import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { toJson, fromJson } from '../db/json.js';
import { recordActivity } from '../lib/activity.js';

interface CashVerificationRow {
  id: string;
  covered_date: string;
  cash_counts: string;
  cash_system_amount: number;
  cash_counted_amount: number;
  resto_counts: string;
  resto_system_amount: number;
  resto_counted_gross: number;
  resto_counted_net: number;
  card_system_amount: number;
  card_verified_amount: number;
  card_verified_count: number | null;
  total_system: number;
  total_counted: number;
  total_difference: number;
  status: string;
  justifications: string;
  supersedes_id: string | null;
  confirmed_at: string;
  confirmed_by: string;
}

const rowToVerification = (r: CashVerificationRow) => ({
  id: r.id,
  coveredDate: r.covered_date,
  cashCounts: fromJson<Record<string, number>>(r.cash_counts, {}),
  cashSystemAmount: r.cash_system_amount,
  cashCountedAmount: r.cash_counted_amount,
  restoCounts: fromJson(r.resto_counts, { count5: 0, count7: 0, count10: 0 }),
  restoSystemAmount: r.resto_system_amount,
  restoCountedGross: r.resto_counted_gross,
  restoCountedNet: r.resto_counted_net,
  cardSystemAmount: r.card_system_amount,
  cardVerifiedAmount: r.card_verified_amount,
  cardVerifiedCount: r.card_verified_count ?? undefined,
  totalSystem: r.total_system,
  totalCounted: r.total_counted,
  totalDifference: r.total_difference,
  status: r.status,
  justifications: fromJson(r.justifications, []),
  supersedesId: r.supersedes_id ?? undefined,
  confirmedAt: r.confirmed_at,
  confirmedBy: r.confirmed_by,
});

export const cashVerificationsRouter = Router();
cashVerificationsRouter.use(requireAuth);

cashVerificationsRouter.get(
  '/',
  asyncHandler((_req, res) => {
    const rows = db.prepare('SELECT * FROM cash_verifications ORDER BY confirmed_at DESC').all() as CashVerificationRow[];
    res.json(rows.map(rowToVerification));
  })
);

const restoCountsSchema = z.object({
  count5: z.number().int().min(0),
  count7: z.number().int().min(0),
  count10: z.number().int().min(0),
});

const justificationSchema = z.object({
  id: z.string(),
  category: z.enum(['Espèces', 'Ticket resto', 'Carte bancaire']),
  expectedAmount: z.number(),
  actualAmount: z.number(),
  difference: z.number(),
  comment: z.string().trim().min(1),
  createdAt: z.string(),
});

const verificationSchema = z.object({
  coveredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (format attendu : AAAA-MM-JJ).'),
  cashCounts: z.record(z.string(), z.number().int().min(0)),
  cashSystemAmount: z.number(),
  cashCountedAmount: z.number(),
  restoCounts: restoCountsSchema,
  restoSystemAmount: z.number(),
  restoCountedGross: z.number(),
  restoCountedNet: z.number(),
  cardSystemAmount: z.number(),
  cardVerifiedAmount: z.number(),
  cardVerifiedCount: z.number().int().min(0).optional(),
  totalSystem: z.number(),
  totalCounted: z.number(),
  totalDifference: z.number(),
  status: z.enum(['Vérifiée', 'Vérifiée avec écart', 'Vérifiée avec justification']),
  justifications: z.array(justificationSchema),
  supersedesId: z.string().optional(),
});

cashVerificationsRouter.post(
  '/',
  asyncHandler((req, res) => {
    const body = verificationSchema.parse(req.body);
    const id = randomUUID();
    const confirmedAt = new Date().toISOString();
    const confirmedBy = req.user!.fullName;

    db.prepare(
      `INSERT INTO cash_verifications (
        id, covered_date, cash_counts, cash_system_amount, cash_counted_amount,
        resto_counts, resto_system_amount, resto_counted_gross, resto_counted_net,
        card_system_amount, card_verified_amount, card_verified_count,
        total_system, total_counted, total_difference, status, justifications,
        supersedes_id, confirmed_at, confirmed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.coveredDate,
      toJson(body.cashCounts),
      body.cashSystemAmount,
      body.cashCountedAmount,
      toJson(body.restoCounts),
      body.restoSystemAmount,
      body.restoCountedGross,
      body.restoCountedNet,
      body.cardSystemAmount,
      body.cardVerifiedAmount,
      body.cardVerifiedCount ?? null,
      body.totalSystem,
      body.totalCounted,
      body.totalDifference,
      body.status,
      toJson(body.justifications),
      body.supersedesId ?? null,
      confirmedAt,
      confirmedBy
    );

    recordActivity(
      'Ventes',
      'Création',
      `Vérification de caisse confirmée — journée du ${body.coveredDate} : écart de ${body.totalDifference.toFixed(2)} DT`,
      confirmedBy
    );

    const row = db.prepare('SELECT * FROM cash_verifications WHERE id = ?').get(id) as CashVerificationRow;
    res.status(201).json(rowToVerification(row));
  })
);
