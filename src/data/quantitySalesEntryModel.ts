import { SaleItem, SaleTransaction, PaymentMethod, MONTHS_LIST } from './salesTransactions';
import { CatalogArticle, getArticleById, getArticleVatRate, getArticleTtcPrice } from './manualSalesCatalog';
import { SalesCatalogContext } from './salesEntryModel';
import { roundToPayableCash } from './currencyRounding';

// Second way to enter "Ajout manuel des ventes", for businesses that don't work with individual
// tickets/tables: a short, dynamic list of "how many of this product sold today" lines — built the
// same way tickets build their item list (one line, a "+" to add another, no duplicate product
// across lines) — plus a single whole-entry payment breakdown (Espèces / Carte bancaire / Tickets
// restaurant) used both to reconcile against the computed total and to split the generated sales
// across payment methods. Kept as its own model (rather than bolted onto DraftTicket) because the
// two entry styles have almost nothing in common beyond the shared date/shift/employee header and
// the final SaleTransaction output shape.

export interface DraftQuantityRow {
  rowId: string;
  articleId: string;
  qty: number;
}

export interface QuantitySalesFormState {
  date: string;
  shift: string;
  employee: string;
  rows: DraftQuantityRow[];
  paidCash: number;
  paidCard: number;
  paidRestoTicket: number;
}

let idCounter = 0;
const generateRowId = (): string => {
  idCounter += 1;
  return `qrow-${idCounter}`;
};

export const createEmptyQuantityRow = (): DraftQuantityRow => ({ rowId: generateRowId(), articleId: '', qty: 1 });

export const createEmptyQuantityForm = (): QuantitySalesFormState => ({
  date: new Date().toISOString().slice(0, 10),
  shift: '',
  employee: '',
  rows: [createEmptyQuantityRow()],
  paidCash: 0,
  paidCard: 0,
  paidRestoTicket: 0,
});

// --- Per-row pricing ---

export const computeRowTotal = (row: DraftQuantityRow, article: CatalogArticle | undefined): number =>
  article ? row.qty * getArticleTtcPrice(article) : 0;

// --- Form-wide totals (recomputed live as the user types) ---

export interface QuantitySalesTotals {
  activeProductsCount: number;
  totalQty: number;
  totalNet: number;
  paidTotal: number;
  remaining: number; // totalNet - paidTotal ; 0 once the payment breakdown matches the computed total
}

export const computeQuantitySalesTotals = (
  form: QuantitySalesFormState,
  catalog: Pick<SalesCatalogContext, 'articles'>
): QuantitySalesTotals => {
  let activeProductsCount = 0;
  let totalQty = 0;
  let totalNet = 0;

  form.rows.forEach((row) => {
    if (!row.articleId || row.qty <= 0) return;
    const article = getArticleById(row.articleId, catalog.articles);
    if (!article) return;
    activeProductsCount += 1;
    totalQty += row.qty;
    totalNet += computeRowTotal(row, article);
  });

  const paidTotal = form.paidCash + form.paidCard + form.paidRestoTicket;
  return { activeProductsCount, totalQty, totalNet, paidTotal, remaining: totalNet - paidTotal };
};

// --- Validation ---

export interface QuantityValidationIssue {
  fieldKey: string;
  message: string;
}

const PAYMENT_EPSILON = 0.01;

export const validateQuantitySalesForm = (
  form: QuantitySalesFormState,
  articles: CatalogArticle[]
): QuantityValidationIssue[] => {
  const issues: QuantityValidationIssue[] = [];
  if (!form.date) issues.push({ fieldKey: 'qgeneral:date', message: 'La date est obligatoire.' });
  if (!form.shift) issues.push({ fieldKey: 'qgeneral:shift', message: 'Le shift est obligatoire.' });
  if (!form.employee) issues.push({ fieldKey: 'qgeneral:employee', message: "L'employé est obligatoire." });

  const filledRows = form.rows.filter((r) => r.articleId);
  if (filledRows.length === 0) {
    issues.push({ fieldKey: 'qgeneral:rows', message: 'Ajoutez au moins un produit vendu.' });
  }

  const seen = new Set<string>();
  form.rows.forEach((row, idx) => {
    if (!row.articleId) {
      issues.push({ fieldKey: `qrow:${row.rowId}:article`, message: `Produit ${idx + 1} : veuillez choisir un produit.` });
      return;
    }
    if (seen.has(row.articleId)) {
      issues.push({ fieldKey: `qrow:${row.rowId}:duplicate`, message: `Produit ${idx + 1} : ce produit est déjà présent dans une autre ligne.` });
    }
    seen.add(row.articleId);
    if (row.qty < 1) {
      issues.push({ fieldKey: `qrow:${row.rowId}:qty`, message: `Produit ${idx + 1} : la quantité doit être d'au moins 1.` });
    }
  });

  const totals = computeQuantitySalesTotals(form, { articles });
  if (filledRows.length > 0 && Math.abs(totals.remaining) > PAYMENT_EPSILON) {
    issues.push({
      fieldKey: 'qgeneral:payment',
      message: `La répartition du règlement (${totals.paidTotal.toFixed(2)} DT) doit correspondre au total des ventes (${totals.totalNet.toFixed(2)} DT).`,
    });
  }

  return issues;
};

// --- Building SaleTransactions ---
//
// Payment is entered once for the whole entry (three amounts, not per product), so it's applied by
// splitting every product line's quantity across the three payment methods in proportion to those
// amounts — using the largest-remainder method so each line's units always sum back exactly to the
// quantity sold, the same technique the (now-removed) per-row split used to use per row.
const PAYMENT_METHODS: PaymentMethod[] = ['Espèces', 'Carte bancaire', 'Ticket resto'];

const apportionByWeights = (qty: number, weights: number[]): number[] => {
  const raw = weights.map((w) => qty * w);
  const floors = raw.map((v) => Math.floor(v));
  const allocated = floors.reduce((a, b) => a + b, 0);
  const remaining = qty - allocated;
  const fracs = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remaining && k < fracs.length; k += 1) {
    floors[fracs[k].i] += 1;
  }
  return floors;
};

export const buildSaleTransactionsFromQuantityForm = (
  form: QuantitySalesFormState,
  catalog: Pick<SalesCatalogContext, 'articles'>
): SaleTransaction[] => {
  const totals = computeQuantitySalesTotals(form, catalog);
  const amounts = [form.paidCash, form.paidCard, form.paidRestoTicket];
  const weights = totals.totalNet > 0 ? amounts.map((a) => a / totals.totalNet) : [1, 0, 0];

  const buckets: SaleItem[][] = [[], [], []];

  form.rows.forEach((row) => {
    if (!row.articleId || row.qty <= 0) return;
    const article = getArticleById(row.articleId, catalog.articles);
    if (!article) return;

    const unitPrice = getArticleTtcPrice(article);
    const vatRate = getArticleVatRate(article);
    const split = apportionByWeights(row.qty, weights);

    split.forEach((qty, idx) => {
      if (qty <= 0) return;
      const lineTtc = unitPrice * qty;
      const lineNet = lineTtc / (1 + vatRate);
      buckets[idx].push({
        name: article.name,
        qty,
        price: unitPrice,
        category: article.category,
        vatRate,
        netAmount: lineNet,
        taxAmount: lineTtc - lineNet,
      });
    });
  });

  const dateObj = new Date(`${form.date}T00:00:00`);
  const monthLabel = MONTHS_LIST[dateObj.getMonth()]?.label ?? 'Sep';
  const now = new Date();
  const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const datePrefix = form.date.replace(/-/g, '');
  const baseId = Date.now();

  const transactions: SaleTransaction[] = [];
  let seq = 0;
  PAYMENT_METHODS.forEach((paymentMethod, idx) => {
    const items = buckets[idx];
    if (items.length === 0) return;
    seq += 1;
    const itemsCount = items.reduce((sum, it) => sum + it.qty, 0);
    const preciseAmount = items.reduce((sum, it) => sum + it.qty * it.price, 0);
    const totalAmount = paymentMethod === 'Espèces' ? roundToPayableCash(preciseAmount) : preciseAmount;
    transactions.push({
      id: baseId + seq,
      saleNumber: `QTE-${datePrefix}-${seq.toString().padStart(3, '0')}`,
      serviceType: 'Sur place',
      tableOrArea: 'Vente du jour',
      items,
      itemsCount,
      itemsSummary: items.map((it) => `${it.qty}x ${it.name}`).join(', '),
      paymentMethod,
      barista: form.employee,
      totalAmount,
      preciseAmount,
      date: form.date,
      time: timeLabel,
      month: monthLabel,
      year: dateObj.getFullYear(),
      status: 'Payé',
    });
  });
  return transactions;
};
