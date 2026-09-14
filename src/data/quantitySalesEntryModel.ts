import { SaleItem, SaleTransaction, ServiceType, PaymentMethod, MONTHS_LIST } from './salesTransactions';
import { CatalogArticle, getArticleById } from './manualSalesCatalog';
import { SalesCatalogContext } from './salesEntryModel';

// Second way to enter "Ajout manuel des ventes", for businesses that don't work with individual
// tickets/tables: one row per catalog product, the user only fills in what actually sold that day
// (quantity, an optional reduction, how many were takeaway, and how the quantity was paid for).
// Kept as its own model (rather than bolted onto DraftTicket) because the two entry styles have
// almost nothing in common beyond the shared date/shift/employee header and the final
// SaleTransaction output shape.

export interface DraftQuantityRow {
  articleId: string;
  qty: number;
  discountPerUnit: number; // DT, per unit
  discountScope: 'all' | 'partial'; // whether the reduction covers every sold unit or a chosen count
  discountQty: number; // used only when discountScope === 'partial', clamped to [0, qty]
  takeawayQty: number; // subset of qty that was "à emporter" rather than consommé sur place
  paidCash: number;
  paidCard: number;
  paidRestoTicket: number;
}

export interface RestoTicketCounts {
  count5: number;
  count7: number;
  count10: number;
}

export const RESTO_TICKET_DENOMINATIONS: { id: keyof RestoTicketCounts; value: number; label: string }[] = [
  { id: 'count5', value: 5, label: '5 DT' },
  { id: 'count7', value: 7, label: '7 DT' },
  { id: 'count10', value: 10, label: '10 DT' },
];

export interface QuantitySalesFormState {
  date: string;
  shift: string;
  employee: string;
  rows: DraftQuantityRow[];
  restoTickets: RestoTicketCounts;
}

export const createEmptyQuantityRow = (articleId: string): DraftQuantityRow => ({
  articleId,
  qty: 0,
  discountPerUnit: 0,
  discountScope: 'all',
  discountQty: 0,
  takeawayQty: 0,
  paidCash: 0,
  paidCard: 0,
  paidRestoTicket: 0,
});

export const createEmptyQuantityForm = (articles: CatalogArticle[]): QuantitySalesFormState => ({
  date: new Date().toISOString().slice(0, 10),
  shift: '',
  employee: '',
  rows: articles.map((a) => createEmptyQuantityRow(a.id)),
  restoTickets: { count5: 0, count7: 0, count10: 0 },
});

export const clampInt = (value: number, min: number, max: number): number => {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  return Math.min(Math.max(n, min), max);
};

// --- Per-row pricing ---

export const effectiveDiscountQty = (row: DraftQuantityRow): number =>
  row.discountScope === 'all' ? row.qty : Math.min(row.discountQty, row.qty);

export const computeRowDiscountTotal = (row: DraftQuantityRow): number =>
  row.discountPerUnit > 0 ? row.discountPerUnit * effectiveDiscountQty(row) : 0;

export const computeRowGrossTotal = (row: DraftQuantityRow, article: CatalogArticle | undefined): number =>
  article ? row.qty * article.price : 0;

export const computeRowNetTotal = (row: DraftQuantityRow, article: CatalogArticle | undefined): number =>
  Math.max(0, computeRowGrossTotal(row, article) - computeRowDiscountTotal(row));

// A single blended unit price for the day's sales of this product (after its reduction) — used
// both for display and to price the SaleTransaction items built from this row.
export const computeRowUnitPriceAfterDiscount = (row: DraftQuantityRow, article: CatalogArticle | undefined): number =>
  row.qty > 0 ? computeRowNetTotal(row, article) / row.qty : (article?.price ?? 0);

export const computeRowPaymentAllocated = (row: DraftQuantityRow): number => row.paidCash + row.paidCard + row.paidRestoTicket;
export const computeRowPaymentRemaining = (row: DraftQuantityRow): number => row.qty - computeRowPaymentAllocated(row);

export const computeRestoTicketsCollected = (counts: RestoTicketCounts): number =>
  RESTO_TICKET_DENOMINATIONS.reduce((sum, d) => sum + counts[d.id] * d.value, 0);

// --- Form-wide totals (recomputed live as the user types) ---

export interface QuantitySalesTotals {
  activeProductsCount: number;
  totalQty: number;
  totalTakeawayQty: number;
  totalOnSiteQty: number;
  totalGross: number;
  totalDiscount: number;
  totalNet: number;
  totalCashQty: number;
  totalCardQty: number;
  totalRestoQty: number;
  totalCashAmount: number;
  totalCardAmount: number;
  totalRestoAmountTheoretical: number;
  restoTicketsCollected: number;
}

export const computeQuantitySalesTotals = (
  form: QuantitySalesFormState,
  catalog: Pick<SalesCatalogContext, 'articles'>
): QuantitySalesTotals => {
  const totals: QuantitySalesTotals = {
    activeProductsCount: 0,
    totalQty: 0,
    totalTakeawayQty: 0,
    totalOnSiteQty: 0,
    totalGross: 0,
    totalDiscount: 0,
    totalNet: 0,
    totalCashQty: 0,
    totalCardQty: 0,
    totalRestoQty: 0,
    totalCashAmount: 0,
    totalCardAmount: 0,
    totalRestoAmountTheoretical: 0,
    restoTicketsCollected: computeRestoTicketsCollected(form.restoTickets),
  };

  form.rows.forEach((row) => {
    if (row.qty <= 0) return;
    const article = getArticleById(row.articleId, catalog.articles);
    const takeaway = Math.min(row.takeawayQty, row.qty);
    const unitPrice = computeRowUnitPriceAfterDiscount(row, article);

    totals.activeProductsCount += 1;
    totals.totalQty += row.qty;
    totals.totalTakeawayQty += takeaway;
    totals.totalOnSiteQty += row.qty - takeaway;
    totals.totalGross += computeRowGrossTotal(row, article);
    totals.totalDiscount += computeRowDiscountTotal(row);
    totals.totalNet += computeRowNetTotal(row, article);
    totals.totalCashQty += row.paidCash;
    totals.totalCardQty += row.paidCard;
    totals.totalRestoQty += row.paidRestoTicket;
    totals.totalCashAmount += row.paidCash * unitPrice;
    totals.totalCardAmount += row.paidCard * unitPrice;
    totals.totalRestoAmountTheoretical += row.paidRestoTicket * unitPrice;
  });

  return totals;
};

// --- Validation ---

export interface QuantityValidationIssue {
  fieldKey: string;
  message: string;
}

export const validateQuantitySalesForm = (
  form: QuantitySalesFormState,
  articles: CatalogArticle[]
): QuantityValidationIssue[] => {
  const issues: QuantityValidationIssue[] = [];
  if (!form.date) issues.push({ fieldKey: 'qgeneral:date', message: 'La date est obligatoire.' });
  if (!form.shift) issues.push({ fieldKey: 'qgeneral:shift', message: 'Le shift est obligatoire.' });
  if (!form.employee) issues.push({ fieldKey: 'qgeneral:employee', message: "L'employé est obligatoire." });

  const activeRows = form.rows.filter((r) => r.qty > 0);
  if (activeRows.length === 0) {
    issues.push({ fieldKey: 'qgeneral:rows', message: 'Saisissez au moins une quantité vendue pour un produit.' });
  }

  activeRows.forEach((row) => {
    const article = getArticleById(row.articleId, articles);
    const label = article?.name ?? row.articleId;

    if (row.takeawayQty > row.qty) {
      issues.push({
        fieldKey: `qrow:${row.articleId}:takeaway`,
        message: `${label} — La quantité « à emporter » ne peut pas dépasser la quantité vendue.`,
      });
    }

    if (row.discountScope === 'partial' && row.discountQty > row.qty) {
      issues.push({
        fieldKey: `qrow:${row.articleId}:discount`,
        message: `${label} — Le nombre d'unités concernées par la réduction ne peut pas dépasser la quantité vendue.`,
      });
    }

    const allocated = computeRowPaymentAllocated(row);
    if (allocated !== row.qty) {
      issues.push({
        fieldKey: `qrow:${row.articleId}:payment`,
        message: `${label} — La répartition du règlement (${allocated}) doit être égale à la quantité vendue (${row.qty}).`,
      });
    }
  });

  return issues;
};

// --- Building SaleTransactions ---
//
// A product row only tracks two independent splits of the same quantity — service (sur
// place/à emporter) and payment method — with no record of which specific units overlap. To turn
// that into SaleTransaction records (which each need one fixed serviceType and paymentMethod), we
// apportion the row's quantity across the 2x3 grid of combinations in proportion to both splits,
// using the largest-remainder method so the six cells always sum back to the exact quantity sold.
const SERVICE_TYPES: ServiceType[] = ['Sur place', 'À emporter'];
const PAYMENT_METHODS: PaymentMethod[] = ['Espèces', 'Carte bancaire', 'Ticket resto'];

const apportionGrid = (rowTotals: [number, number], colTotals: [number, number, number]): number[][] => {
  const total = rowTotals[0] + rowTotals[1];
  if (total <= 0) return [[0, 0, 0], [0, 0, 0]];
  const raw = rowTotals.map((r) => colTotals.map((c) => (r * c) / total));
  const floors = raw.map((row) => row.map((v) => Math.floor(v)));
  const allocated = floors.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
  const remaining = total - allocated;
  const cells: { i: number; j: number; frac: number }[] = [];
  raw.forEach((row, i) => row.forEach((v, j) => cells.push({ i, j, frac: v - Math.floor(v) })));
  cells.sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remaining && k < cells.length; k += 1) {
    floors[cells[k].i][cells[k].j] += 1;
  }
  return floors;
};

export const buildSaleTransactionsFromQuantityForm = (
  form: QuantitySalesFormState,
  catalog: Pick<SalesCatalogContext, 'articles'>
): SaleTransaction[] => {
  const buckets: SaleItem[][][] = SERVICE_TYPES.map(() => PAYMENT_METHODS.map(() => [] as SaleItem[]));

  form.rows.forEach((row) => {
    if (row.qty <= 0) return;
    const article = getArticleById(row.articleId, catalog.articles);
    if (!article) return;

    const unitPrice = computeRowUnitPriceAfterDiscount(row, article);
    const takeaway = Math.min(row.takeawayQty, row.qty);
    const onSite = row.qty - takeaway;
    const paymentAllocated = computeRowPaymentAllocated(row);
    // Keeps the builder total-safe even if called before validation blocks an inconsistent
    // split — any unallocated remainder falls back to Espèces rather than being dropped.
    const payments: [number, number, number] =
      paymentAllocated === row.qty
        ? [row.paidCash, row.paidCard, row.paidRestoTicket]
        : [row.qty - row.paidCard - row.paidRestoTicket, row.paidCard, row.paidRestoTicket];

    const grid = apportionGrid([onSite, takeaway], payments);
    const name = computeRowDiscountTotal(row) > 0 ? `${article.name} (remise)` : article.name;

    SERVICE_TYPES.forEach((_service, sIdx) => {
      PAYMENT_METHODS.forEach((_payment, pIdx) => {
        const qty = grid[sIdx][pIdx];
        if (qty > 0) {
          buckets[sIdx][pIdx].push({ name, qty, price: unitPrice, category: article.category });
        }
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
  SERVICE_TYPES.forEach((serviceType, sIdx) => {
    PAYMENT_METHODS.forEach((paymentMethod, pIdx) => {
      const items = buckets[sIdx][pIdx];
      if (items.length === 0) return;
      seq += 1;
      const itemsCount = items.reduce((sum, it) => sum + it.qty, 0);
      const totalAmount = items.reduce((sum, it) => sum + it.qty * it.price, 0);
      transactions.push({
        id: baseId + seq,
        saleNumber: `QTE-${datePrefix}-${seq.toString().padStart(3, '0')}`,
        serviceType,
        tableOrArea: serviceType === 'À emporter' ? 'À emporter' : 'Vente du jour',
        items,
        itemsCount,
        itemsSummary: items.map((it) => `${it.qty}x ${it.name}`).join(', '),
        paymentMethod,
        barista: form.employee,
        totalAmount,
        date: form.date,
        time: timeLabel,
        month: monthLabel,
        year: dateObj.getFullYear(),
        status: 'Payé',
      });
    });
  });
  return transactions;
};
