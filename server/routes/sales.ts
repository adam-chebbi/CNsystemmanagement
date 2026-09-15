import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { fromJson, toJson } from '../db/json.js';
import { asyncHandler, ApiError, notFound } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../lib/activity.js';
import type { SaleItem, SaleTransaction } from '../../src/data/salesTransactions.js';
import { DEFAULT_VAT_RATE, type CatalogArticle } from '../../src/data/manualSalesCatalog.js';
import { accumulateRecipeConsumption } from '../../src/data/productsModel.js';
import { normalizeKey } from '../../src/data/textUtils.js';
import { getAllArticlesRaw, getAllSubRecipesRaw } from './productCatalog.js';
import { getAllProducts, postEntries, cancelLedgerEntryById, getLedgerEntryIdsBySource, type LedgerEntryInput } from './stock.js';
import { recordAutoExpense } from '../lib/expenses.js';

interface SaleRow {
  id: number; sale_number: string; service_type: string; table_or_area: string; items: string;
  items_count: number; items_summary: string; payment_method: string; barista: string; total_amount: number;
  date: string; time: string; month: string; year: number; status: string;
}
const rowToSale = (r: SaleRow): SaleTransaction => {
  const items = fromJson<SaleItem[]>(r.items, []);
  return {
    id: r.id, saleNumber: r.sale_number, serviceType: r.service_type as SaleTransaction['serviceType'],
    tableOrArea: r.table_or_area, items, itemsCount: r.items_count,
    itemsSummary: r.items_summary, paymentMethod: r.payment_method as SaleTransaction['paymentMethod'],
    barista: r.barista, totalAmount: r.total_amount,
    // Derived, not stored: the pre-rounding sum of the items is always fully recoverable from
    // their own (full-precision) price/qty, so there's no separate column to keep in sync.
    preciseAmount: items.reduce((s, it) => s + it.qty * it.price, 0),
    date: r.date, time: r.time, month: r.month, year: r.year,
    status: r.status as SaleTransaction['status'],
  };
};

const saleItemSchema = z.object({
  name: z.string(),
  qty: z.number(),
  price: z.number(),
  category: z.string(),
  vatRate: z.number().min(0).max(1).optional(),
  netAmount: z.number().optional(),
  taxAmount: z.number().optional(),
});

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

// A SaleItem only carries its display name (possibly suffixed with a variant/extra label, e.g.
// "Cappuccino (Grand, Chantilly)") — not an articleId — so it's matched back to its CatalogArticle
// the same way computeTheoreticalConsumption already does: exact name match first, then a
// startsWith fallback for suffixed names.
const resolveArticleForSaleItem = (item: SaleItem, articles: CatalogArticle[]): CatalogArticle | undefined =>
  articles.find((a) => normalizeKey(a.name) === normalizeKey(item.name)) ??
  articles.find((a) => normalizeKey(item.name).startsWith(normalizeKey(a.name)));

// Recursively expands every sold item's recipe (ingredients, sub-recipes, and composed products —
// see manualSalesCatalog.RecipeLine) into raw ingredient quantities, then posts a single 'Sortie'
// stock movement per ingredient via the exact same postEntries() the manual Stock module uses.
// Deliberately defensive: a product with no recipe, or an ingredient that no longer exists, is
// silently skipped rather than thrown — a sale must never fail because of a stock/recipe data gap.
const deductStockForSale = (items: SaleItem[], performedBy: string, saleId: number): void => {
  const articles = getAllArticlesRaw();
  const subRecipes = getAllSubRecipesRaw();
  const products = getAllProducts();

  const consumption = new Map<string, number>();
  items.forEach((item) => {
    const article = resolveArticleForSaleItem(item, articles);
    if (!article?.recipe || article.recipe.length === 0) return;
    accumulateRecipeConsumption(article.recipe, item.qty, products, subRecipes, articles, consumption, new Set());
  });
  if (consumption.size === 0) return;

  const inputs: LedgerEntryInput[] = [];
  consumption.forEach((qty, productId) => {
    if (qty <= 0) return;
    if (!products.some((p) => p.id === productId)) return;
    inputs.push({
      type: 'Sortie',
      productId,
      zone: 'Réserve principale',
      quantityDelta: -qty,
      reason: 'Vente',
      performedBy,
      // Tagged so a later refund (see POST /transactions/:id/refund) can find and cancel exactly
      // these entries, instead of string-matching the reason/comment.
      sourceType: 'sale',
      sourceId: String(saleId),
    });
  });
  if (inputs.length > 0) postEntries(inputs);
};

// Every paid sale automatically logs its VAT as an expense under a "Taxes et frais" category,
// created on first use if it doesn't already exist (e.g. after a full data wipe that emptied
// expense_categories, or on an install that never seeded the default categories). This mirrors
// the collected-VAT figure already shown in Rapports → Rapport fiscal, but as an actual expense
// row so it shows up in Gestion des dépenses without any manual entry.
const TAXES_ET_FRAIS_CATEGORY_NAME = 'Taxes et frais';

const computeSaleTaxAmount = (items: SaleItem[]): number =>
  items.reduce((sum, item) => {
    const rate = item.vatRate ?? DEFAULT_VAT_RATE;
    const gross = item.qty * item.price;
    const net = item.netAmount ?? gross / (1 + rate);
    const tax = item.taxAmount ?? gross - net;
    return sum + tax;
  }, 0);

// Expense.paymentMethod has no "Ticket resto" option (that one only exists on the sales side) —
// fold it into Espèces, the closest cash-equivalent settlement method.
const mapSalePaymentMethodToExpense = (method: SaleTransaction['paymentMethod']): 'Espèces' | 'Carte bancaire' =>
  method === 'Carte bancaire' ? 'Carte bancaire' : 'Espèces';

const recordTaxExpenseForSale = (
  t: Pick<SaleTransaction, 'saleNumber' | 'date' | 'paymentMethod' | 'items'>,
  performedBy: string,
  saleId: number
): void => {
  const taxAmount = computeSaleTaxAmount(t.items);
  recordAutoExpense({
    title: `TVA collectée — Vente ${t.saleNumber}`,
    amount: taxAmount,
    date: t.date,
    categoryName: TAXES_ET_FRAIS_CATEGORY_NAME,
    paymentMethod: mapSalePaymentMethodToExpense(t.paymentMethod),
    comment: `Généré automatiquement à partir de la vente ${t.saleNumber}.`,
    sourceType: 'sale_vat',
    sourceId: String(saleId),
    performedBy,
  });
};

// Reverses everything a sale's automatic side effects did: cancels every stock ledger entry it
// generated (re-adding the consumed ingredients back to stock) and rejects the auto-created VAT
// expense (kept, not deleted, so the audit trail shows it was reversed rather than never existing).
const reverseSaleSideEffects = (saleId: number, performedBy: string, saleNumber: string): void => {
  getLedgerEntryIdsBySource('sale', String(saleId)).forEach((ledgerId) => {
    cancelLedgerEntryById(ledgerId, performedBy, `Remboursement de la vente ${saleNumber}`);
  });
  const expenseRows = db.prepare(
    "SELECT id, comment FROM expenses WHERE source_type = 'sale_vat' AND source_id = ? AND status != 'Rejeté'"
  ).all(String(saleId)) as { id: string; comment: string | null }[];
  expenseRows.forEach((row) => {
    db.prepare('UPDATE expenses SET status = ?, comment = ? WHERE id = ?').run(
      'Rejeté',
      `${row.comment ?? ''} — Annulée suite au remboursement de la vente ${saleNumber}.`.trim(),
      row.id
    );
  });
};

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
      if (t.status === 'Payé') {
        deductStockForSale(t.items, req.user!.fullName, id);
        recordTaxExpenseForSale(t, req.user!.fullName, id);
      }
      created.push({ ...t, id });
    }
    return created;
  });
  const created = tx();
  recordActivity('Ventes', 'Création', `${created.length} vente(s) enregistrée(s)`, req.user!.fullName);
  res.status(201).json(created);
}));

// Reverses a paid sale: cancels the stock it consumed, rejects the VAT expense it generated, and
// flips its status to Remboursé — the three side effects of a sale (revenue, stock, tax expense)
// are undone together, never piecemeal, so a refunded sale can never leave stock/expenses
// overstated even though the sale itself was reversed.
salesRouter.post('/transactions/:id/refund', asyncHandler((req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw notFound('Vente');
  const row = db.prepare('SELECT * FROM sales_transactions WHERE id = ?').get(id) as SaleRow | undefined;
  if (!row) throw notFound('Vente');
  const sale = rowToSale(row);
  if (sale.status === 'Remboursé') throw new ApiError(409, 'Cette vente est déjà remboursée.');

  const tx = db.transaction(() => {
    reverseSaleSideEffects(id, req.user!.fullName, sale.saleNumber);
    db.prepare('UPDATE sales_transactions SET status = ? WHERE id = ?').run('Remboursé', id);
  });
  tx();
  recordActivity('Ventes', 'Remboursement', `Vente remboursée — ${sale.saleNumber}`, req.user!.fullName);
  res.json(rowToSale({ ...row, status: 'Remboursé' }));
}));
