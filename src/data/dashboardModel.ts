// Real-data replacement for the former src/data/mockData.ts — every function here computes its
// result from the app's live state (sales, purchases, expenses, stock, HR), the same way
// reportsModel.ts computes the 7 report pages' numbers. reportsModel's own aggregation functions
// are month-grain (ReportPeriod = {year, monthIndex}) and can't express Today/Yesterday/Week/
// Custom-range, so the range-based aggregations below are written directly against a plain
// {start, end} ISO range instead of reusing reportsModel's period type.

import { TimeFilterPeriod, MetricCardData, TopProduct, LowStockProduct, CoffeeAlert, DailyContributionDay } from '../types';
import { SaleTransaction } from './salesTransactions';
import { StockProduct, StockLot, StockLedgerEntry, getTotalQty } from './stockModel';
import { computeStockValue, computeLowStockProducts } from './reportsModel';
import { CatalogArticle } from './manualSalesCatalog';
import { SubRecipe, computeRecipeCost, computeMargin } from './productsModel';
import { Supplier, PurchaseOrder, SupplierInvoice, computeOrderTotal } from './purchasesModel';
import { Expense } from './expensesModel';
import { FinancialRecord } from './hrModel';
import { OperationalAlert, AlertsContext, computeOperationalAlerts } from './alertsModel';
import { normalizeKey } from './textUtils';

export interface DateRange {
  start: string; // ISO yyyy-mm-dd, inclusive
  end: string; // ISO yyyy-mm-dd, inclusive
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const inRange = (dateIso: string, range: DateRange): boolean => dateIso >= range.start && dateIso <= range.end;
const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (start: string, end: string): number => Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1;
const startOfMonth = (iso: string): string => `${iso.slice(0, 7)}-01`;

// --- Range resolution (mirrors AnalysisFilterBar's Today/Yesterday/Week/Month/Custom choices) ---

export const resolveDashboardRange = (period: TimeFilterPeriod, customRange?: { start: string; end: string }): DateRange => {
  const today = todayIso();
  switch (period) {
    case 'yesterday': {
      const y = addDays(today, -1);
      return { start: y, end: y };
    }
    case 'week':
      return { start: addDays(today, -6), end: today };
    case 'month':
      return { start: startOfMonth(today), end: today };
    case 'custom':
      return customRange ?? { start: today, end: today };
    case 'today':
    default:
      return { start: today, end: today };
  }
};

// The equivalent-length period immediately preceding `range`, used for "vs période précédente".
export const getPreviousRange = (range: DateRange): DateRange => {
  const length = daysBetween(range.start, range.end);
  return { start: addDays(range.start, -length), end: addDays(range.start, -1) };
};

const formatDT = (value: number): string => `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
const formatPercentChange = (current: number, previous: number): string => {
  if (previous <= 0) return current > 0 ? '+100%' : '+0%';
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
};

// --- Sales / purchases / expenses / margin aggregation over a date range -----------------------

const sumSales = (transactions: SaleTransaction[], range: DateRange): { revenue: number; ticketCount: number; itemsCount: number } => {
  let revenue = 0;
  let ticketCount = 0;
  let itemsCount = 0;
  transactions.forEach((t) => {
    if (t.status !== 'Payé' || !inRange(t.date, range)) return;
    revenue += t.totalAmount;
    ticketCount += 1;
    itemsCount += t.itemsCount;
  });
  return { revenue, ticketCount, itemsCount };
};

const sumPurchases = (orders: PurchaseOrder[], range: DateRange): number =>
  orders.filter((o) => inRange(o.orderDate, range)).reduce((sum, o) => sum + computeOrderTotal(o), 0);

const sumExpenses = (expenses: Expense[], range: DateRange): number =>
  expenses.filter((e) => inRange(e.date, range)).reduce((sum, e) => sum + e.amount, 0);

// Recipe-cost-based COGS estimate for the transactions in range: items whose name matches a
// CatalogArticle with a recipe cost that recipe (converted through sub-recipes); anything without
// a resolvable recipe is treated as zero-cost (its full price counts as margin), matching the
// conservative "never invent a cost we can't derive" approach used across the app.
const estimateMargin = (
  transactions: SaleTransaction[],
  range: DateRange,
  articles: CatalogArticle[],
  stockProducts: StockProduct[],
  subRecipes: SubRecipe[]
): { revenue: number; margin: number } => {
  let revenue = 0;
  let cost = 0;
  transactions.forEach((t) => {
    if (t.status !== 'Payé' || !inRange(t.date, range)) return;
    t.items.forEach((item) => {
      revenue += item.price * item.qty;
      const article = articles.find((a) => normalizeKey(a.name) === normalizeKey(item.name));
      if (article?.recipe) {
        const { cost: unitCost } = computeRecipeCost(article.recipe, stockProducts, subRecipes);
        cost += unitCost * item.qty;
      }
    });
  });
  return { revenue, margin: revenue - cost };
};

// --- Metric cards (replaces METRIC_CARDS + PERIOD_ANALYSIS_DATA[activePeriod]) -----------------

export interface DashboardPeriodData {
  turnover: string;
  turnoverChange: string;
  purchases: string;
  purchasesChange: string;
  expenses: string;
  expensesChange: string;
  monthlyTurnover: string;
  monthlyTurnoverChange: string;
  monthlyPurchases: string;
  monthlyPurchasesChange: string;
  stockValue: string;
  staffCost: string;
  staffCostChange: string;
  staffCostRatio: string;
  ticketCount: number;
  ticketCountChange: string;
  averageBasket: string;
  itemsPerTicket: string;
  estimatedMargin: string;
  estimatedMarginChange: string;
  marginPercent: string;
}

export interface DashboardDataSources {
  transactions: SaleTransaction[];
  orders: PurchaseOrder[];
  expenses: Expense[];
  stockProducts: StockProduct[];
  financialRecords: FinancialRecord[];
  articles: CatalogArticle[];
  subRecipes: SubRecipe[];
}

export const computeDashboardPeriodData = (range: DateRange, sources: DashboardDataSources): DashboardPeriodData => {
  const prevRange = getPreviousRange(range);
  const { transactions, orders, expenses, stockProducts, financialRecords, articles, subRecipes } = sources;

  const current = sumSales(transactions, range);
  const previous = sumSales(transactions, prevRange);
  const purchases = sumPurchases(orders, range);
  const prevPurchases = sumPurchases(orders, prevRange);
  const expensesTotal = sumExpenses(expenses, range);
  const prevExpensesTotal = sumExpenses(expenses, prevRange);

  const today = todayIso();
  const monthRange = { start: startOfMonth(today), end: today };
  const prevMonthEnd = addDays(monthRange.start, -1);
  const prevMonthRange = { start: startOfMonth(prevMonthEnd), end: prevMonthEnd };
  const monthlySales = sumSales(transactions, monthRange);
  const prevMonthlySales = sumSales(transactions, prevMonthRange);
  const monthlyPurchases = sumPurchases(orders, monthRange);
  const prevMonthlyPurchases = sumPurchases(orders, prevMonthRange);

  const now = new Date();
  const staffCost = financialRecords
    .filter((r) => r.periodMonthIndex === now.getMonth() && r.periodYear === now.getFullYear())
    .reduce((sum, r) => sum + r.baseSalary + r.bonuses - r.deductions, 0);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevStaffCost = financialRecords
    .filter((r) => r.periodMonthIndex === prevMonthDate.getMonth() && r.periodYear === prevMonthDate.getFullYear())
    .reduce((sum, r) => sum + r.baseSalary + r.bonuses - r.deductions, 0);

  const { revenue: marginRevenue, margin } = estimateMargin(transactions, range, articles, stockProducts, subRecipes);
  const { margin: prevMargin } = estimateMargin(transactions, prevRange, articles, stockProducts, subRecipes);

  return {
    turnover: formatDT(current.revenue),
    turnoverChange: formatPercentChange(current.revenue, previous.revenue),
    purchases: formatDT(purchases),
    purchasesChange: formatPercentChange(purchases, prevPurchases),
    expenses: formatDT(expensesTotal),
    expensesChange: formatPercentChange(expensesTotal, prevExpensesTotal),
    monthlyTurnover: formatDT(monthlySales.revenue),
    monthlyTurnoverChange: formatPercentChange(monthlySales.revenue, prevMonthlySales.revenue),
    monthlyPurchases: formatDT(monthlyPurchases),
    monthlyPurchasesChange: formatPercentChange(monthlyPurchases, prevMonthlyPurchases),
    stockValue: formatDT(computeStockValue(stockProducts)),
    staffCost: formatDT(staffCost),
    staffCostChange: formatPercentChange(staffCost, prevStaffCost),
    staffCostRatio: current.revenue > 0 ? `${((staffCost / current.revenue) * 100).toFixed(1)}% du CA` : '—',
    ticketCount: current.ticketCount,
    ticketCountChange: formatPercentChange(current.ticketCount, previous.ticketCount),
    averageBasket: formatDT(current.ticketCount > 0 ? current.revenue / current.ticketCount : 0),
    itemsPerTicket: current.ticketCount > 0 ? `${(current.itemsCount / current.ticketCount).toFixed(1)} art./ticket` : '0 art./ticket',
    estimatedMargin: formatDT(margin),
    estimatedMarginChange: formatPercentChange(margin, prevMargin),
    marginPercent: `${marginRevenue > 0 ? ((margin / marginRevenue) * 100).toFixed(1) : '0.0'}%`,
  };
};

export const buildMetricCards = (data: DashboardPeriodData): MetricCardData[] => [
  { id: 'total-sales', title: 'Ventes totales', amount: data.turnover, subtitle: `${data.turnoverChange} vs période préc.`, accentColor: 'emerald', iconType: 'receipt' },
  { id: 'total-purchases', title: 'Achat total des biens et services', amount: data.purchases, subtitle: `${data.purchasesChange} vs période préc.`, accentColor: 'blue', iconType: 'cart' },
  { id: 'total-expenses', title: 'Total des dépenses', amount: data.expenses, subtitle: `${data.expensesChange} vs période préc.`, accentColor: 'rose', iconType: 'wallet' },
  { id: 'monthly-sales', title: 'Ventes mensuelles', amount: data.monthlyTurnover, subtitle: `${data.monthlyTurnoverChange} vs mois préc.`, accentColor: 'purple', iconType: 'trending' },
  { id: 'monthly-purchases', title: 'Achats mensuels', amount: data.monthlyPurchases, subtitle: `${data.monthlyPurchasesChange} vs mois préc.`, accentColor: 'sky', iconType: 'coins' },
];

// --- Top/least/revenue/margin products + low stock (replaces the 4 TopProduct[] + LOW_STOCK_PRODUCTS) --

const formatPrice = (v: number): string => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;

export const buildProductRankings = (
  transactions: SaleTransaction[],
  articles: CatalogArticle[],
  stockProducts: StockProduct[],
  subRecipes: SubRecipe[]
): { top: TopProduct[]; least: TopProduct[]; topRevenue: TopProduct[]; topMargin: TopProduct[] } => {
  const agg = new Map<string, { name: string; category?: string; qty: number; revenue: number }>();
  transactions.forEach((t) => {
    if (t.status !== 'Payé') return;
    t.items.forEach((item) => {
      const key = normalizeKey(item.name);
      const entry = agg.get(key) ?? { name: item.name, category: item.category, qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.price * item.qty;
      agg.set(key, entry);
    });
  });

  const rows = Array.from(agg.entries()).map(([key, v]) => {
    const article = articles.find((a) => normalizeKey(a.name) === key);
    let marginPercent: number | undefined;
    let costPrice: string | undefined;
    if (article?.recipe) {
      const { cost } = computeRecipeCost(article.recipe, stockProducts, subRecipes);
      const price = article.price || (v.qty > 0 ? v.revenue / v.qty : 0);
      const { marginRate } = computeMargin(price, cost);
      marginPercent = Math.round(marginRate * 100);
      costPrice = formatPrice(cost);
    }
    const price = article?.price ?? (v.qty > 0 ? v.revenue / v.qty : 0);
    return {
      id: article?.id ?? key,
      name: v.name,
      sku: article?.id ?? key,
      price: formatPrice(price),
      soldCount: v.qty,
      soldLabel: `${v.qty} vendu${v.qty > 1 ? 's' : ''}`,
      category: v.category,
      revenue: formatPrice(v.revenue),
      marginPercent,
      costPrice,
    } satisfies TopProduct;
  });

  const bySoldDesc = [...rows].sort((a, b) => b.soldCount - a.soldCount);
  const byRevenueDesc = [...rows].sort((a, b) => parseFloat(b.revenue!) - parseFloat(a.revenue!));
  const byMarginDesc = [...rows].filter((r) => r.marginPercent !== undefined).sort((a, b) => (b.marginPercent ?? 0) - (a.marginPercent ?? 0));

  return {
    top: bySoldDesc.slice(0, 5),
    least: [...bySoldDesc].reverse().slice(0, 5),
    topRevenue: byRevenueDesc.slice(0, 5),
    topMargin: byMarginDesc.slice(0, 5),
  };
};

export const buildLowStockList = (stockProducts: StockProduct[]): LowStockProduct[] =>
  computeLowStockProducts(stockProducts).slice(0, 5).map((p) => {
    const qty = getTotalQty(p);
    const urgency: LowStockProduct['urgency'] = qty <= 0 ? 'Critique' : qty < p.minThreshold * 0.5 ? 'Critique' : qty < p.minThreshold * 0.8 ? 'Faible' : 'Modéré';
    return { id: p.id, name: p.name, sku: p.sku, stock: qty, minThreshold: p.minThreshold, unit: p.unit, urgency };
  });

// --- Operational alerts, mapped to the dashboard's simpler CoffeeAlert shape --------------------

const relativeTimeFromNow = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}j`;
};

const alertCategoryFor = (alert: OperationalAlert): CoffeeAlert['category'] => {
  if (alert.type === 'invoice_due' || alert.type === 'invoice_ocr_review') return 'Fournisseur';
  return 'Stock';
};

const alertLevelFor = (severity: OperationalAlert['severity']): CoffeeAlert['level'] => {
  if (severity === 'Critique') return 'danger';
  if (severity === 'Information') return 'info';
  return 'warning';
};

export const buildDashboardAlerts = (ctx: AlertsContext): CoffeeAlert[] =>
  computeOperationalAlerts(ctx)
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.message,
      level: alertLevelFor(a.severity),
      category: alertCategoryFor(a),
      timeAgo: relativeTimeFromNow(a.detectedAt),
      actionLabel: a.actionLabel,
    }));

// --- Daily sales heatmap (replaces generateDailyContributionData) -------------------------------

export interface DailyHeatmapData {
  weeks: DailyContributionDay[][];
  monthLabels: { label: string; weekIndex: number }[];
  totalSales: number;
  totalTickets: number;
  averageSales: number;
  maxDay: { date: string; amount: number; tickets: number };
}

const MONTH_LABELS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export const buildDailyHeatmap = (transactions: SaleTransaction[], weekCount = 22): DailyHeatmapData => {
  const byDate = new Map<string, { amount: number; tickets: number }>();
  transactions.forEach((t) => {
    if (t.status !== 'Payé') return;
    const entry = byDate.get(t.date) ?? { amount: 0, tickets: 0 };
    entry.amount += t.totalAmount;
    entry.tickets += 1;
    byDate.set(t.date, entry);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = (today.getDay() + 6) % 7; // 0=Mon
  const gridEnd = new Date(today);
  gridEnd.setDate(gridEnd.getDate() + (6 - todayDow)); // end of this week (Sunday)
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - (weekCount * 7 - 1));

  const weeks: DailyContributionDay[][] = [];
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let totalSales = 0;
  let totalTickets = 0;
  let maxDay = { date: '', amount: -1, tickets: 0 };
  let lastMonth = -1;

  for (let w = 0; w < weekCount; w += 1) {
    const week: DailyContributionDay[] = [];
    for (let d = 0; d < 7; d += 1) {
      const cursor = new Date(gridStart);
      cursor.setDate(cursor.getDate() + w * 7 + d);
      const iso = cursor.toISOString().slice(0, 10);
      const stats = byDate.get(iso) ?? { amount: 0, tickets: 0 };
      const intensity = stats.amount === 0 ? 0 : stats.amount < 850 ? 1 : stats.amount < 1400 ? 2 : stats.amount < 2100 ? 3 : 4;
      const label = cursor.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      week.push({ date: label, dayOfWeek: d, weekIndex: w, amount: stats.amount, tickets: stats.tickets, intensity });
      if (cursor.getMonth() !== lastMonth && d === 0) {
        lastMonth = cursor.getMonth();
        monthLabels.push({ label: MONTH_LABELS_FR[lastMonth], weekIndex: w });
      }
      if (stats.amount > maxDay.amount) maxDay = { date: label, amount: stats.amount, tickets: stats.tickets };
      totalSales += stats.amount;
      totalTickets += stats.tickets;
    }
    weeks.push(week);
  }

  if (maxDay.amount < 0) maxDay = { date: '', amount: 0, tickets: 0 };
  const daysWithSales = Array.from(byDate.values()).filter((v) => v.amount > 0).length;
  return { weeks, monthLabels, totalSales, totalTickets, averageSales: daysWithSales > 0 ? totalSales / daysWithSales : 0, maxDay };
};

// --- Sales / purchases by day/month/year series (replaces SALES_BY_PERIOD / PURCHASES_BY_PERIOD) --

export interface SeriesPoint {
  label: string;
  current: number;
  previous: number;
  tickets: number;
}

export interface PurchaseSeriesPoint {
  label: string;
  current: number;
  previous: number;
  labelDetail: string;
}

const WEEKDAY_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const buildSalesByPeriod = (transactions: SaleTransaction[]): { days: SeriesPoint[]; months: SeriesPoint[]; years: SeriesPoint[] } => {
  const paid = transactions.filter((t) => t.status === 'Payé');
  const today = new Date();

  const days: SeriesPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const prevIso = new Date(d.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const dayTx = paid.filter((t) => t.date === iso);
    const prevTx = paid.filter((t) => t.date === prevIso);
    return {
      label: `${WEEKDAY_SHORT_FR[(d.getDay() + 6) % 7]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
      current: dayTx.reduce((s, t) => s + t.totalAmount, 0),
      previous: prevTx.reduce((s, t) => s + t.totalAmount, 0),
      tickets: dayTx.length,
    };
  });

  const months: SeriesPoint[] = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (8 - i), 1);
    const prevD = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const monthTx = paid.filter((t) => t.date.slice(0, 7) === d.toISOString().slice(0, 7));
    const prevTx = paid.filter((t) => t.date.slice(0, 7) === prevD.toISOString().slice(0, 7));
    return {
      label: MONTH_LABELS_FR[d.getMonth()].replace('.', ''),
      current: monthTx.reduce((s, t) => s + t.totalAmount, 0),
      previous: prevTx.reduce((s, t) => s + t.totalAmount, 0),
      tickets: monthTx.length,
    };
  });

  const years: SeriesPoint[] = Array.from({ length: 4 }, (_, i) => {
    const y = today.getFullYear() - (3 - i);
    const yearTx = paid.filter((t) => t.year === y);
    const prevTx = paid.filter((t) => t.year === y - 1);
    return { label: String(y), current: yearTx.reduce((s, t) => s + t.totalAmount, 0), previous: prevTx.reduce((s, t) => s + t.totalAmount, 0), tickets: yearTx.length };
  });

  return { days, months, years };
};

export const buildPurchasesByPeriod = (orders: PurchaseOrder[]): { days: PurchaseSeriesPoint[]; months: PurchaseSeriesPoint[]; years: PurchaseSeriesPoint[] } => {
  const today = new Date();

  const days: PurchaseSeriesPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const prevIso = new Date(d.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const label = `${WEEKDAY_SHORT_FR[(d.getDay() + 6) % 7]} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      label,
      current: orders.filter((o) => o.orderDate === iso).reduce((s, o) => s + computeOrderTotal(o), 0),
      previous: orders.filter((o) => o.orderDate === prevIso).reduce((s, o) => s + computeOrderTotal(o), 0),
      labelDetail: label,
    };
  });

  const months: PurchaseSeriesPoint[] = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (8 - i), 1);
    const prevD = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const monthKey = d.toISOString().slice(0, 7);
    const prevKey = prevD.toISOString().slice(0, 7);
    const label = MONTH_LABELS_FR[d.getMonth()].replace('.', '');
    return {
      label,
      current: orders.filter((o) => o.orderDate.slice(0, 7) === monthKey).reduce((s, o) => s + computeOrderTotal(o), 0),
      previous: orders.filter((o) => o.orderDate.slice(0, 7) === prevKey).reduce((s, o) => s + computeOrderTotal(o), 0),
      labelDetail: `Achats ${label}`,
    };
  });

  const years: PurchaseSeriesPoint[] = Array.from({ length: 4 }, (_, i) => {
    const y = today.getFullYear() - (3 - i);
    return {
      label: String(y),
      current: orders.filter((o) => o.orderDate.startsWith(String(y))).reduce((s, o) => s + computeOrderTotal(o), 0),
      previous: orders.filter((o) => o.orderDate.startsWith(String(y - 1))).reduce((s, o) => s + computeOrderTotal(o), 0),
      labelDetail: String(y),
    };
  });

  return { days, months, years };
};

// --- Category breakdown for PlanOverview's donut (replaces its hardcoded categories) ------------

export interface CategoryShare {
  id: string;
  label: string;
  percent: number;
  amount: string;
  color: string;
  strokeOffset: number;
  strokeLength: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Café chaud': '#10b981',
  'Boisson lactée': '#0ea5e9',
  'Boisson glacée': '#6366f1',
  'Pâtisserie': '#f59e0b',
  'Snack': '#f43f5e',
  'Épicerie Café': '#8b5cf6',
};
const FALLBACK_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#a855f7'];

export const buildCategoryShares = (transactions: SaleTransaction[], range: DateRange): { categories: CategoryShare[]; monthlyTarget: number; achievedToDate: number } => {
  const byCategory = new Map<string, number>();
  let total = 0;
  transactions.forEach((t) => {
    if (t.status !== 'Payé' || !inRange(t.date, range)) return;
    t.items.forEach((item) => {
      const amount = item.price * item.qty;
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + amount);
      total += amount;
    });
  });

  let offset = 0;
  const categories: CategoryShare[] = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, amount], i) => {
      const percent = total > 0 ? Math.round((amount / total) * 1000) / 10 : 0;
      const entry: CategoryShare = {
        id: normalizeKey(label),
        label,
        percent,
        amount: formatDT(amount),
        color: CATEGORY_COLORS[label] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        strokeOffset: offset,
        strokeLength: percent,
      };
      offset += percent;
      return entry;
    });

  // No configurable "monthly target" concept exists in the app; the previous calendar month's
  // real revenue is used as an honest, data-driven stand-in rather than a fabricated round number.
  const today = todayIso();
  const monthRange = { start: startOfMonth(today), end: today };
  const prevMonthEnd = addDays(monthRange.start, -1);
  const prevMonthRange = { start: startOfMonth(prevMonthEnd), end: prevMonthEnd };
  const achievedToDate = sumSales(transactions, monthRange).revenue;
  const monthlyTarget = sumSales(transactions, prevMonthRange).revenue;

  return { categories, monthlyTarget, achievedToDate };
};
