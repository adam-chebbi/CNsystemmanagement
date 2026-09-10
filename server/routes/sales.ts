import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { fromJson, toJson } from '../db/json.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../lib/activity.js';
import type { SaleItem, SaleTransaction } from '../../src/data/salesTransactions.js';

interface SaleRow {
  id: number; sale_number: string; service_type: string; table_or_area: string; items: string;
  items_count: number; items_summary: string; payment_method: string; barista: string; total_amount: number;
  date: string; time: string; month: string; year: number; status: string;
}
const rowToSale = (r: SaleRow): SaleTransaction => ({
  id: r.id, saleNumber: r.sale_number, serviceType: r.service_type as SaleTransaction['serviceType'],
  tableOrArea: r.table_or_area, items: fromJson<SaleItem[]>(r.items, []), itemsCount: r.items_count,
  itemsSummary: r.items_summary, paymentMethod: r.payment_method as SaleTransaction['paymentMethod'],
  barista: r.barista, totalAmount: r.total_amount, date: r.date, time: r.time, month: r.month, year: r.year,
  status: r.status as SaleTransaction['status'],
});

const saleItemSchema = z.object({ name: z.string(), qty: z.number(), price: z.number(), category: z.string() });

const saleSchema = z.object({
  saleNumber: z.string().min(1),
  serviceType: z.enum(['Sur place', 'À emporter']),
  tableOrArea: z.string().min(1),
  items: z.array(saleItemSchema).min(1),
  itemsCount: z.number(),
  itemsSummary: z.string(),
  paymentMethod: z.enum(['Espèces', 'Carte bancaire', 'Ticket resto']),
  barista: z.string().min(1),
  totalAmount: z.number(),
  date: z.string(),
  time: z.string(),
  month: z.string(),
  year: z.number(),
  status: z.enum(['Payé', 'Remboursé']).default('Payé'),
});

export const salesRouter = Router();
salesRouter.use(requireAuth);

salesRouter.get('/transactions', asyncHandler((_req, res) => {
  const rows = db.prepare('SELECT * FROM sales_transactions ORDER BY id DESC').all() as SaleRow[];
  res.json(rows.map(rowToSale));
}));

salesRouter.post('/transactions', asyncHandler((req, res) => {
  const body = z.object({ tickets: z.array(saleSchema).min(1) }).parse(req.body);
  const tx = db.transaction(() => {
    const maxRow = db.prepare('SELECT MAX(id) as maxId FROM sales_transactions').get() as { maxId: number | null };
    let nextId = (maxRow.maxId ?? 0) + 1;
    const created: SaleTransaction[] = [];
    for (const t of body.tickets) {
      const id = nextId++;
      db.prepare(
        `INSERT INTO sales_transactions (id, sale_number, service_type, table_or_area, items, items_count, items_summary,
         payment_method, barista, total_amount, date, time, month, year, status)
         VALUES (@id, @sale_number, @service_type, @table_or_area, @items, @items_count, @items_summary,
         @payment_method, @barista, @total_amount, @date, @time, @month, @year, @status)`
      ).run({
        id, sale_number: t.saleNumber, service_type: t.serviceType, table_or_area: t.tableOrArea, items: toJson(t.items),
        items_count: t.itemsCount, items_summary: t.itemsSummary, payment_method: t.paymentMethod, barista: t.barista,
        total_amount: t.totalAmount, date: t.date, time: t.time, month: t.month, year: t.year, status: t.status,
      });
      created.push({ ...t, id });
    }
    return created;
  });
  const created = tx();
  recordActivity('Ventes', 'Création', `${created.length} vente(s) enregistrée(s)`, req.user!.fullName);
  res.status(201).json(created);
}));
