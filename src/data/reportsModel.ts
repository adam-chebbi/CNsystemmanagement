// Shared analytics engine for "Rapports et analyses". Every report page reads from this ONE
// place rather than re-deriving metrics from raw transactions — so figures never disagree
// between the Ventes report, the Rapport financier, and the Rapport mensuel de gestion.
//
// Nothing here mutates state; every function is a pure read over the app's existing domain
// state (sales, stock, expenses, purchases/suppliers/invoices, HR) that was already built for
// the Ventes / Stock / Achats / Dépenses / Personnel modules — this file never duplicates that
// data, only aggregates it.

import { normalizeKey } from './textUtils';
import { SaleTransaction, MONTHS_LIST } from './salesTransactions';
import { CatalogArticle } from './manualSalesCatalog';
import { ProductCategory, SubRecipe, computeRecipeCost, computeMargin, DEFAULT_TARGET_MARGIN_RATE } from './productsModel';
import { StockProduct, StockLedgerEntry, getTotalQty } from './stockModel';
import { Expense, ExpenseCategory } from './expensesModel';
import {
  Supplier,
  PurchaseOrder,
  PurchaseReception,
  SupplierInvoice,
  computeOrderTotal,
  computeInvoiceStatus,
  isInvoiceDueSoon,
  isInvoiceOverdue,
} from './purchasesModel';
import { Employee, FinancialRecord, computeNetDue, getEmployeeFullName } from './hrModel';

// --- Period model (calendar month, matching the "monthly management indicators" framing) ------

export interface ReportPeriod {
  year: number;
  monthIndex: number; // 0-11, matches MONTHS_LIST
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export const getPeriodRange = (period: ReportPeriod): { start: string; end: string } => {
  const start = `${period.year}-${pad2(period.monthIndex + 1)}-01`;
  const lastDay = new Date(period.year, period.monthIndex + 1, 0).getDate();
  const end = `${period.year}-${pad2(period.monthIndex + 1)}-${pad2(lastDay)}`;
  return { start, end };
};

export const isDateInPeriod = (dateIso: string, period: ReportPeriod): boolean => {
  const { start, end } = getPeriodRange(period);
  const d = (dateIso || '').slice(0, 10);
  return d >= start && d <= end;
};

export const getPreviousPeriod = (period: ReportPeriod): ReportPeriod =>
  period.monthIndex === 0 ? { year: period.year - 1, monthIndex: 11 } : { year: period.year, monthIndex: period.monthIndex - 1 };

export const getMonthlySeries = (period: ReportPeriod, count = 6): ReportPeriod[] => {
  const series: ReportPeriod[] = [];
  let cursor = period;
  for (let i = 0; i < count; i += 1) {
    series.unshift(cursor);
    cursor = getPreviousPeriod(cursor);
  }
  return series;
};

export const formatPeriodLabel = (period: ReportPeriod): string => {
  const m = MONTHS_LIST.find((mm) => mm.monthIndex === period.monthIndex);
  return `${m?.fullName ?? ''} ${period.year}`;
};

export const formatPeriodShort = (period: ReportPeriod): string => {
  const m = MONTHS_LIST.find((mm) => mm.monthIndex === period.monthIndex);
  return `${m?.label ?? ''} ${period.year}`;
};

export const currentPeriod = (): ReportPeriod => {
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
};

// A variation is expressed as a ratio (0.12 = +12%); null when the baseline is zero (no
// meaningful percentage to show) so callers can render "—" instead of a misleading ∞/NaN.
export const computeVariation = (current: number, previous: number): number | null => {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / Math.abs(previous);
};

// --- Ventes --------------------------------------------------------------------------------

export interface SalesMetrics {
  revenue: number;
  ticketCount: number;
  averageTicket: number;
  refundedAmount: number;
  itemsSold: number;
}

export const computeSalesMetrics = (transactions: SaleTransaction[], period: ReportPeriod): SalesMetrics => {
  const paid = transactions.filter((t) => isDateInPeriod(t.date, period) && t.status === 'Payé');
  const revenue = paid.reduce((s, t) => s + t.totalAmount, 0);
  const ticketCount = paid.length;
  const itemsSold = paid.reduce((s, t) => s + t.itemsCount, 0);
  const refundedAmount = transactions
    .filter((t) => isDateInPeriod(t.date, period) && t.status === 'Remboursé')
    .reduce((s, t) => s + t.totalAmount, 0);
  return { revenue, ticketCount, averageTicket: ticketCount > 0 ? revenue / ticketCount : 0, refundedAmount, itemsSold };
};

export interface ProductSalesAgg {
  name: string;
  qty: number;
  revenue: number;
}

export const computeTopProducts = (transactions: SaleTransaction[], period: ReportPeriod, limit = 10): ProductSalesAgg[] => {
  const map = new Map<string, ProductSalesAgg>();
  transactions
    .filter((t) => isDateInPeriod(t.date, period) && t.status === 'Payé')
    .forEach((t) => {
      t.items.forEach((it) => {
        const cur = map.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.qty;
        cur.revenue += it.qty * it.price;
        map.set(it.name, cur);
      });
    });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
};

export const computeSalesByPaymentMethod = (transactions: SaleTransaction[], period: ReportPeriod): { method: string; amount: number; count: number }[] => {
  const map = new Map<string, { method: string; amount: number; count: number }>();
  transactions
    .filter((t) => isDateInPeriod(t.date, period) && t.status === 'Payé')
    .forEach((t) => {
      const cur = map.get(t.paymentMethod) ?? { method: t.paymentMethod, amount: 0, count: 0 };
      cur.amount += t.totalAmount;
      cur.count += 1;
      map.set(t.paymentMethod, cur);
    });
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
};

// Estimated COGS: for every sold item that maps to a CatalogArticle with a defined recipe, the
// recipe's cost (via the SAME computeRecipeCost used by "Gestion des produits") × quantity sold.
// Items without a recipe are excluded and reported separately so the estimate is never silently
// wrong — it is a real, traceable estimate, not a guess.
export interface CogsResult {
  cogs: number;
  itemsWithoutRecipeQty: number;
}

export const estimateCogs = (
  transactions: SaleTransaction[],
  period: ReportPeriod,
  articles: CatalogArticle[],
  stockProducts: StockProduct[],
  subRecipes: SubRecipe[]
): CogsResult => {
  let cogs = 0;
  let itemsWithoutRecipeQty = 0;
  transactions
    .filter((t) => isDateInPeriod(t.date, period) && t.status === 'Payé')
    .forEach((t) => {
      t.items.forEach((it) => {
        const article = articles.find((a) => normalizeKey(a.name) === normalizeKey(it.name));
        if (article?.recipe && article.recipe.length > 0) {
          const result = computeRecipeCost(article.recipe, stockProducts, subRecipes);
          cogs += result.cost * it.qty;
        } else {
          itemsWithoutRecipeQty += it.qty;
        }
      });
    });
  return { cogs, itemsWithoutRecipeQty };
};

export interface LowMarginProduct {
  article: CatalogArticle;
  cost: number;
  grossMargin: number;
  marginRate: number;
  targetRate: number;
}

export const computeLowMarginProducts = (articles: CatalogArticle[], stockProducts: StockProduct[], subRecipes: SubRecipe[], limit = 10): LowMarginProduct[] =>
  articles
    .filter((a) => a.recipe && a.recipe.length > 0 && a.isAvailable !== false)
    .map((a) => {
      const cost = computeRecipeCost(a.recipe!, stockProducts, subRecipes).cost;
      const { grossMargin, marginRate } = computeMargin(a.price, cost);
      return { article: a, cost, grossMargin, marginRate, targetRate: a.targetMarginRate ?? DEFAULT_TARGET_MARGIN_RATE };
    })
    .filter((r) => r.marginRate < r.targetRate)
    .sort((a, b) => a.marginRate - b.marginRate)
    .slice(0, limit);

// --- Achats & fournisseurs -------------------------------------------------------------------

export interface PurchasesMetrics {
  total: number;
  orderCount: number;
  receivedCount: number;
  pendingCount: number;
}

export const computePurchasesMetrics = (orders: PurchaseOrder[], period: ReportPeriod): PurchasesMetrics => {
  const inPeriod = orders.filter((o) => isDateInPeriod(o.orderDate, period) && o.status !== 'Annulée');
  return {
    total: inPeriod.reduce((s, o) => s + computeOrderTotal(o), 0),
    orderCount: inPeriod.length,
    receivedCount: inPeriod.filter((o) => o.status === 'Reçue').length,
    pendingCount: inPeriod.filter((o) => o.status === 'Brouillon' || o.status === 'Commandée' || o.status === 'Partiellement reçue').length,
  };
};

export interface SupplierPerformance {
  supplierId: string;
  name: string;
  orderCount: number;
  totalAmount: number;
  avgReceptionDays: number | null;
  unpaidInvoiceAmount: number;
}

export const computeSupplierPerformance = (
  suppliers: Supplier[],
  orders: PurchaseOrder[],
  receptions: PurchaseReception[],
  invoices: SupplierInvoice[],
  period: ReportPeriod
): SupplierPerformance[] =>
  suppliers
    .map((s) => {
      const supOrders = orders.filter((o) => o.supplierId === s.id && isDateInPeriod(o.orderDate, period));
      const totalAmount = supOrders.reduce((sum, o) => sum + computeOrderTotal(o), 0);
      const days: number[] = [];
      supOrders.forEach((o) => {
        const firstReception = [...receptions]
          .filter((r) => r.purchaseOrderId === o.id)
          .sort((a, b) => (a.receptionDate < b.receptionDate ? -1 : 1))[0];
        if (firstReception) {
          const d = (new Date(firstReception.receptionDate).getTime() - new Date(o.orderDate).getTime()) / 86400000;
          if (d >= 0) days.push(d);
        }
      });
      const unpaidInvoiceAmount = invoices
        .filter((i) => i.supplierId === s.id && computeInvoiceStatus(i) !== 'Payée')
        .reduce((sum, i) => sum + (i.amountTTC - i.amountPaid), 0);
      return {
        supplierId: s.id,
        name: s.name,
        orderCount: supOrders.length,
        totalAmount,
        avgReceptionDays: days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : null,
        unpaidInvoiceAmount,
      };
    })
    .filter((r) => r.orderCount > 0 || r.unpaidInvoiceAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

// --- Dépenses --------------------------------------------------------------------------------

export interface ExpensesMetrics {
  total: number;
  fixed: number;
  variable: number;
  count: number;
  pendingCount: number;
}

export const computeExpensesMetrics = (expenses: Expense[], period: ReportPeriod): ExpensesMetrics => {
  const counted = expenses.filter((e) => isDateInPeriod(e.date, period) && e.status !== 'Rejeté');
  const fixed = counted.filter((e) => e.nature === 'Fixe').reduce((s, e) => s + e.amount, 0);
  const total = counted.reduce((s, e) => s + e.amount, 0);
  return {
    total,
    fixed,
    variable: total - fixed,
    count: counted.length,
    pendingCount: expenses.filter((e) => isDateInPeriod(e.date, period) && e.status === 'En attente').length,
  };
};

export const computeExpensesByCategory = (
  expenses: Expense[],
  categories: ExpenseCategory[],
  period: ReportPeriod
): { category: ExpenseCategory; total: number }[] =>
  categories
    .map((c) => ({
      category: c,
      total: expenses
        .filter((e) => e.categoryId === c.id && isDateInPeriod(e.date, period) && e.status !== 'Rejeté')
        .reduce((s, e) => s + e.amount, 0),
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

// --- Stock -------------------------------------------------------------------------------------

export const computeStockValue = (products: StockProduct[]): number => products.reduce((s, p) => s + getTotalQty(p) * p.averageCost, 0);

export const computeStockLosses = (ledger: StockLedgerEntry[], period: ReportPeriod): number =>
  ledger
    .filter((e) => e.type === 'Perte' && e.status === 'Confirmé' && isDateInPeriod(e.timestamp, period))
    .reduce((s, e) => s + Math.abs(e.valueImpact), 0);

export const computeInventoryDiscrepancies = (ledger: StockLedgerEntry[], period: ReportPeriod): StockLedgerEntry[] =>
  ledger.filter((e) => e.type === 'Inventaire' && isDateInPeriod(e.timestamp, period) && (e.discrepancyQty ?? 0) !== 0);

export const computeLowStockProducts = (products: StockProduct[]): StockProduct[] => products.filter((p) => getTotalQty(p) < p.minThreshold);

export const computeStockMovementsTotal = (ledger: StockLedgerEntry[], period: ReportPeriod, type: StockLedgerEntry['type']): number =>
  ledger
    .filter((e) => e.type === type && e.status === 'Confirmé' && isDateInPeriod(e.timestamp, period))
    .reduce((s, e) => s + Math.abs(e.valueImpact), 0);

// --- Personnel (coût, monitoring only — see Suivi financier) ----------------------------------

export interface PersonnelCostMetrics {
  total: number;
  paid: number;
  recordCount: number;
}

export const computePersonnelCost = (financialRecords: FinancialRecord[], period: ReportPeriod): PersonnelCostMetrics => {
  const inPeriod = financialRecords.filter((r) => r.periodMonthIndex === period.monthIndex && r.periodYear === period.year);
  return {
    total: inPeriod.reduce((s, r) => s + computeNetDue(r), 0),
    paid: inPeriod.reduce((s, r) => s + r.amountPaid, 0),
    recordCount: inPeriod.length,
  };
};

// --- Rapport financier (marge / résultat estimé) ----------------------------------------------

export interface FinancialSummary {
  revenue: number;
  cogs: number;
  grossMargin: number;
  purchases: number;
  expenses: number;
  personnelCost: number;
  estimatedResult: number;
}

export const computeFinancialSummary = (
  transactions: SaleTransaction[],
  articles: CatalogArticle[],
  stockProducts: StockProduct[],
  subRecipes: SubRecipe[],
  orders: PurchaseOrder[],
  expenses: Expense[],
  financialRecords: FinancialRecord[],
  period: ReportPeriod
): FinancialSummary => {
  const sales = computeSalesMetrics(transactions, period);
  const { cogs } = estimateCogs(transactions, period, articles, stockProducts, subRecipes);
  const purchases = computePurchasesMetrics(orders, period).total;
  const expensesTotal = computeExpensesMetrics(expenses, period).total;
  const personnel = computePersonnelCost(financialRecords, period).total;
  const grossMargin = sales.revenue - cogs;
  return {
    revenue: sales.revenue,
    cogs,
    grossMargin,
    purchases,
    expenses: expensesTotal,
    personnelCost: personnel,
    estimatedResult: grossMargin - expensesTotal - personnel,
  };
};

// --- Rapport fiscal (informational only — V1 is not a tax-declaration system) -----------------

// Matches the 10% TVA split already baked into every ticket receipt (see SalesPage's
// getReceiptTotals) — kept as the single constant so every report agrees with the printed
// tickets rather than inventing a second rate.
export const SALES_VAT_RATE = 0.1;

export interface TaxSummary {
  salesHT: number;
  vatCollected: number;
  purchasesHT: number;
  vatDeductible: number;
  netVat: number;
}

export const computeTaxSummary = (transactions: SaleTransaction[], invoices: SupplierInvoice[], period: ReportPeriod): TaxSummary => {
  const sales = computeSalesMetrics(transactions, period);
  const vatCollected = sales.revenue * SALES_VAT_RATE;
  const inPeriodInvoices = invoices.filter((i) => isDateInPeriod(i.invoiceDate, period));
  const vatDeductible = inPeriodInvoices.reduce((s, i) => s + i.vatAmount, 0);
  const purchasesHT = inPeriodInvoices.reduce((s, i) => s + i.amountHT, 0);
  return {
    salesHT: sales.revenue - vatCollected,
    vatCollected,
    purchasesHT,
    vatDeductible,
    netVat: vatCollected - vatDeductible,
  };
};

// --- Alerts (fed into every report's "Alertes" section + the consolidated monthly report) -----

export interface ReportAlert {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
}

export interface AlertContext {
  stockProducts: StockProduct[];
  invoices: SupplierInvoice[];
  expenses: Expense[];
  orders: PurchaseOrder[];
  lowMarginProducts: LowMarginProduct[];
  employees: Employee[];
  period: ReportPeriod;
}

export const computeGlobalAlerts = (ctx: AlertContext): ReportAlert[] => {
  const alerts: ReportAlert[] = [];

  ctx.stockProducts.forEach((p) => {
    const qty = getTotalQty(p);
    if (qty < 0) alerts.push({ severity: 'critical', category: 'Stock', message: `${p.name} — stock négatif (${qty} ${p.unit})` });
    else if (qty < p.minThreshold) alerts.push({ severity: 'warning', category: 'Stock', message: `${p.name} — sous le seuil minimum (${qty}/${p.minThreshold} ${p.unit})` });
  });

  ctx.invoices.forEach((i) => {
    if (isInvoiceOverdue(i)) alerts.push({ severity: 'critical', category: 'Fournisseurs', message: `Facture ${i.invoiceNumber} en retard de paiement` });
    else if (isInvoiceDueSoon(i)) alerts.push({ severity: 'warning', category: 'Fournisseurs', message: `Facture ${i.invoiceNumber} à échéance proche` });
  });

  const overdueOrders = ctx.orders.filter(
    (o) => o.expectedDate && o.expectedDate < getPeriodRange(ctx.period).end && (o.status === 'Commandée' || o.status === 'Partiellement reçue')
  );
  overdueOrders.forEach((o) => alerts.push({ severity: 'warning', category: 'Achats', message: `Commande ${o.orderNumber} — livraison prévue dépassée` }));

  const pendingExpenses = ctx.expenses.filter((e) => isDateInPeriod(e.date, ctx.period) && e.status === 'En attente').length;
  if (pendingExpenses > 0) alerts.push({ severity: 'info', category: 'Dépenses', message: `${pendingExpenses} dépense(s) en attente de validation` });

  if (ctx.lowMarginProducts.length > 0) {
    alerts.push({ severity: 'warning', category: 'Produits', message: `${ctx.lowMarginProducts.length} produit(s) sous leur marge cible` });
  }

  const inactiveEmployees = ctx.employees.filter((e) => e.status === 'Inactif').length;
  if (inactiveEmployees > 0) alerts.push({ severity: 'info', category: 'Personnel', message: `${inactiveEmployees} employé(s) inactif(s) dans la base` });

  const severityRank: Record<ReportAlert['severity'], number> = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
};

export { getEmployeeFullName };
