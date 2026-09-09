import {
  MetricCardData,
  ReturnItem,
  TopProduct,
  LowStockProduct,
  CoffeeAlert,
  ClientItem,
  VendorItem,
  HourlyPurchasePoint,
  DailyContributionDay,
  HeatmapCell,
} from '../types';

export const METRIC_CARDS: MetricCardData[] = [
  {
    id: 'total-sales',
    title: 'Ventes totales',
    amount: '155,739.80 DT',
    subtitle: 'ventes à tout moment',
    accentColor: 'emerald',
    iconType: 'receipt',
  },
  {
    id: 'total-purchases',
    title: 'Achat total des biens et services',
    amount: '163,439.75 DT',
    subtitle: 'achats de tout le temps',
    accentColor: 'blue',
    iconType: 'cart',
  },
  {
    id: 'total-expenses',
    title: 'Total des dépenses',
    amount: '14,080.00 DT',
    subtitle: 'dépenses approuvées',
    accentColor: 'rose',
    iconType: 'wallet',
  },
  {
    id: 'monthly-sales',
    title: 'Ventes mensuelles',
    amount: '24,750.00 DT',
    subtitle: '+89% par rapport au mois précédent',
    accentColor: 'purple',
    iconType: 'trending',
  },
  {
    id: 'monthly-purchases',
    title: 'Achats mensuels',
    amount: '18,500.00 DT',
    subtitle: 'ce mois-ci',
    accentColor: 'sky',
    iconType: 'coins',
  },
];

// Coffee shop key operational analysis indicators for each filter period
export const PERIOD_ANALYSIS_DATA = {
  today: {
    periodLabel: "Aujourd'hui (07 Septembre 2026)",
    prevPeriodLabel: "Hier (06 Septembre 2026)",
    turnover: '3,250.00 DT',
    turnoverPrev: '2,845.00 DT',
    turnoverChange: '+14.2%',
    monthlyTurnover: '24,750.00 DT',
    monthlyTurnoverPrev: '21,800.00 DT',
    monthlyTurnoverChange: '+13.5%',
    purchases: '1,280.00 DT',
    purchasesPrev: '1,450.00 DT',
    purchasesChange: '-11.7%',
    expenses: '420.00 DT',
    expensesPrev: '390.00 DT',
    expensesChange: '+7.7%',
    stockValue: '18,420.50 DT',
    stockValuePrev: '17,980.00 DT',
    stockValueChange: '+2.4%',
    staffCost: '680.00 DT',
    staffCostPrev: '650.00 DT',
    staffCostChange: '+4.6%',
    staffCostRatio: '20.9% du CA',
    ticketCount: 684,
    ticketCountPrev: 596,
    ticketCountChange: '+14.8%',
    averageBasket: '4.75 DT',
    averageBasketPrev: '4.51 DT',
    averageBasketChange: '+5.3%',
    itemsPerTicket: '2.4 articles/ticket',
    estimatedMargin: '2,340.00 DT',
    estimatedMarginPrev: '2,020.00 DT',
    estimatedMarginChange: '+15.8%',
    marginPercent: '72.0%',
  },
  yesterday: {
    periodLabel: "Hier (06 Septembre 2026)",
    prevPeriodLabel: "Avant-hier (05 Septembre 2026)",
    turnover: '2,845.00 DT',
    turnoverPrev: '3,120.00 DT',
    turnoverChange: '-8.8%',
    monthlyTurnover: '21,500.00 DT',
    monthlyTurnoverPrev: '19,800.00 DT',
    monthlyTurnoverChange: '+8.6%',
    purchases: '1,450.00 DT',
    purchasesPrev: '1,200.00 DT',
    purchasesChange: '+20.8%',
    expenses: '390.00 DT',
    expensesPrev: '410.00 DT',
    expensesChange: '-4.9%',
    stockValue: '17,980.00 DT',
    stockValuePrev: '18,300.00 DT',
    stockValueChange: '-1.7%',
    staffCost: '650.00 DT',
    staffCostPrev: '650.00 DT',
    staffCostChange: '0.0%',
    staffCostRatio: '22.8% du CA',
    ticketCount: 596,
    ticketCountPrev: 642,
    ticketCountChange: '-7.2%',
    averageBasket: '4.51 DT',
    averageBasketPrev: '4.62 DT',
    averageBasketChange: '-2.4%',
    itemsPerTicket: '2.2 articles/ticket',
    estimatedMargin: '2,020.00 DT',
    estimatedMarginPrev: '2,215.00 DT',
    estimatedMarginChange: '-8.8%',
    marginPercent: '71.0%',
  },
  week: {
    periodLabel: "Cette semaine (Semaine 36)",
    prevPeriodLabel: "Semaine dernière (Semaine 35)",
    turnover: '19,840.00 DT',
    turnoverPrev: '17,650.00 DT',
    turnoverChange: '+12.4%',
    monthlyTurnover: '24,750.00 DT',
    monthlyTurnoverPrev: '21,800.00 DT',
    monthlyTurnoverChange: '+13.5%',
    purchases: '6,450.00 DT',
    purchasesPrev: '6,800.00 DT',
    purchasesChange: '-5.1%',
    expenses: '2,150.00 DT',
    expensesPrev: '2,080.00 DT',
    expensesChange: '+3.4%',
    stockValue: '18,420.50 DT',
    stockValuePrev: '17,500.00 DT',
    stockValueChange: '+5.3%',
    staffCost: '4,100.00 DT',
    staffCostPrev: '3,950.00 DT',
    staffCostChange: '+3.8%',
    staffCostRatio: '20.7% du CA',
    ticketCount: 4210,
    ticketCountPrev: 3820,
    ticketCountChange: '+10.2%',
    averageBasket: '4.71 DT',
    averageBasketPrev: '4.62 DT',
    averageBasketChange: '+1.9%',
    itemsPerTicket: '2.3 articles/ticket',
    estimatedMargin: '14,285.00 DT',
    estimatedMarginPrev: '12,530.00 DT',
    estimatedMarginChange: '+14.0%',
    marginPercent: '72.0%',
  },
  month: {
    periodLabel: "Ce mois (Septembre 2026)",
    prevPeriodLabel: "Mois précédent (Août 2026)",
    turnover: '24,750.00 DT',
    turnoverPrev: '22,400.00 DT',
    turnoverChange: '+10.5%',
    monthlyTurnover: '24,750.00 DT',
    monthlyTurnoverPrev: '22,400.00 DT',
    monthlyTurnoverChange: '+10.5%',
    purchases: '18,500.00 DT',
    purchasesPrev: '17,200.00 DT',
    purchasesChange: '+7.6%',
    expenses: '14,080.00 DT',
    expensesPrev: '13,650.00 DT',
    expensesChange: '+3.1%',
    stockValue: '18,420.50 DT',
    stockValuePrev: '17,100.00 DT',
    stockValueChange: '+7.7%',
    staffCost: '4,850.00 DT',
    staffCostPrev: '4,700.00 DT',
    staffCostChange: '+3.2%',
    staffCostRatio: '19.6% du CA',
    ticketCount: 5240,
    ticketCountPrev: 4890,
    ticketCountChange: '+7.2%',
    averageBasket: '4.72 DT',
    averageBasketPrev: '4.58 DT',
    averageBasketChange: '+3.1%',
    itemsPerTicket: '2.4 articles/ticket',
    estimatedMargin: '17,325.00 DT',
    estimatedMarginPrev: '15,450.00 DT',
    estimatedMarginChange: '+12.1%',
    marginPercent: '70.0%',
  },
  custom: {
    periodLabel: "Période personnalisée (01/09/2026 — 07/09/2026)",
    prevPeriodLabel: "Période précédente (25/08/2026 — 31/08/2026)",
    turnover: '22,140.00 DT',
    turnoverPrev: '19,780.00 DT',
    turnoverChange: '+11.9%',
    monthlyTurnover: '24,750.00 DT',
    monthlyTurnoverPrev: '22,400.00 DT',
    monthlyTurnoverChange: '+10.5%',
    purchases: '7,250.00 DT',
    purchasesPrev: '7,800.00 DT',
    purchasesChange: '-7.1%',
    expenses: '2,480.00 DT',
    expensesPrev: '2,350.00 DT',
    expensesChange: '+5.5%',
    stockValue: '18,420.50 DT',
    stockValuePrev: '17,650.00 DT',
    stockValueChange: '+4.4%',
    staffCost: '4,350.00 DT',
    staffCostPrev: '4,200.00 DT',
    staffCostChange: '+3.6%',
    staffCostRatio: '19.6% du CA',
    ticketCount: 4690,
    ticketCountPrev: 4250,
    ticketCountChange: '+10.4%',
    averageBasket: '4.72 DT',
    averageBasketPrev: '4.65 DT',
    averageBasketChange: '+1.5%',
    itemsPerTicket: '2.3 articles/ticket',
    estimatedMargin: '15,820.00 DT',
    estimatedMarginPrev: '13,950.00 DT',
    estimatedMarginChange: '+13.4%',
    marginPercent: '71.5%',
  },
};

// Top 5 best selling coffee shop products
export const TOP_PRODUCTS: TopProduct[] = [
  {
    id: 'top-1',
    name: 'Espresso Double Bio',
    sku: 'CF-ESP-01',
    price: '3.20 DT',
    soldCount: 412,
    soldLabel: '412 vendus',
    category: 'Café Signature',
    revenue: '1,318.40 DT',
    marginPercent: 84,
    costPrice: '0.51 DT',
    trend: '+18%',
  },
  {
    id: 'top-2',
    name: 'Cappuccino Lait d\'Avoine',
    sku: 'CF-CAP-02',
    price: '4.80 DT',
    soldCount: 348,
    soldLabel: '348 vendus',
    category: 'Spécialités Laitières',
    revenue: '1,670.40 DT',
    marginPercent: 78,
    costPrice: '1.05 DT',
    trend: '+24%',
  },
  {
    id: 'top-3',
    name: 'Flat White Signature',
    sku: 'CF-FLW-03',
    price: '4.50 DT',
    soldCount: 285,
    soldLabel: '285 vendus',
    category: 'Café Signature',
    revenue: '1,282.50 DT',
    marginPercent: 81,
    costPrice: '0.85 DT',
    trend: '+12%',
  },
  {
    id: 'top-4',
    name: 'Croissant Artisanal Beurre AOP',
    sku: 'BK-CRS-01',
    price: '2.40 DT',
    soldCount: 264,
    soldLabel: '264 vendus',
    category: 'Viennoiserie',
    revenue: '633.60 DT',
    marginPercent: 68,
    costPrice: '0.76 DT',
    trend: '+9%',
  },
  {
    id: 'top-5',
    name: 'Iced Latte Caramel Beurre Salé',
    sku: 'CF-ICL-04',
    price: '5.40 DT',
    soldCount: 230,
    soldLabel: '230 vendus',
    category: 'Boissons Fraîches',
    revenue: '1,242.00 DT',
    marginPercent: 74,
    costPrice: '1.40 DT',
    trend: '+31%',
  },
];

// Top 5 least selling products (Produits les moins vendus)
export const LEAST_SELLING_PRODUCTS: TopProduct[] = [
  {
    id: 'flop-1',
    name: 'Thé Sencha Décaféiné Bio',
    sku: 'TH-SNC-09',
    price: '4.20 DT',
    soldCount: 14,
    soldLabel: '14 vendus',
    category: 'Infusions',
    revenue: '58.80 DT',
    marginPercent: 62,
    costPrice: '1.60 DT',
    trend: '-35%',
  },
  {
    id: 'flop-2',
    name: 'Cookie Vegan Sésame Noir',
    sku: 'BK-CKS-05',
    price: '3.80 DT',
    soldCount: 18,
    soldLabel: '18 vendus',
    category: 'Pâtisserie',
    revenue: '68.40 DT',
    marginPercent: 55,
    costPrice: '1.71 DT',
    trend: '-22%',
  },
  {
    id: 'flop-3',
    name: 'Cold Brew Nitro Pamplemousse',
    sku: 'CF-CLD-07',
    price: '5.80 DT',
    soldCount: 21,
    soldLabel: '21 vendus',
    category: 'Édition Limitée',
    revenue: '121.80 DT',
    marginPercent: 69,
    costPrice: '1.80 DT',
    trend: '-14%',
  },
  {
    id: 'flop-4',
    name: 'Muffin Myrtilles Sans Gluten',
    sku: 'BK-MUF-03',
    price: '4.10 DT',
    soldCount: 25,
    soldLabel: '25 vendus',
    category: 'Sans Gluten',
    revenue: '102.50 DT',
    marginPercent: 58,
    costPrice: '1.72 DT',
    trend: '-8%',
  },
  {
    id: 'flop-5',
    name: 'Chaï Latte Épicé Sans Sucre',
    sku: 'TH-CHI-04',
    price: '4.60 DT',
    soldCount: 29,
    soldLabel: '29 vendus',
    category: 'Boissons Chaudes',
    revenue: '133.40 DT',
    marginPercent: 65,
    costPrice: '1.61 DT',
    trend: '-4%',
  },
];

// Top 5 products generating the most revenue (CA)
export const TOP_REVENUE_PRODUCTS: TopProduct[] = [
  {
    id: 'rev-1',
    name: 'Cappuccino Lait d\'Avoine',
    sku: 'CF-CAP-02',
    price: '4.80 DT',
    soldCount: 348,
    soldLabel: '348 vendus',
    category: 'Spécialités Laitières',
    revenue: '1,670.40 DT',
    marginPercent: 78,
    trend: '+24%',
  },
  {
    id: 'rev-2',
    name: 'Espresso Double Bio',
    sku: 'CF-ESP-01',
    price: '3.20 DT',
    soldCount: 412,
    soldLabel: '412 vendus',
    category: 'Café Signature',
    revenue: '1,318.40 DT',
    marginPercent: 84,
    trend: '+18%',
  },
  {
    id: 'rev-3',
    name: 'Flat White Signature',
    sku: 'CF-FLW-03',
    price: '4.50 DT',
    soldCount: 285,
    soldLabel: '285 vendus',
    category: 'Café Signature',
    revenue: '1,282.50 DT',
    marginPercent: 81,
    trend: '+12%',
  },
  {
    id: 'rev-4',
    name: 'Iced Latte Caramel Beurre Salé',
    sku: 'CF-ICL-04',
    price: '5.40 DT',
    soldCount: 230,
    soldLabel: '230 vendus',
    category: 'Boissons Fraîches',
    revenue: '1,242.00 DT',
    marginPercent: 74,
    trend: '+31%',
  },
  {
    id: 'rev-5',
    name: 'Grains Café Éthiopie Yirgacheffe 250g',
    sku: 'GR-ETH-250',
    price: '18.50 DT',
    soldCount: 62,
    soldLabel: '62 vendus',
    category: 'Épicerie Café',
    revenue: '1,147.00 DT',
    marginPercent: 64,
    trend: '+15%',
  },
];

// Top 5 products generating the highest margin (%)
export const TOP_MARGIN_PRODUCTS: TopProduct[] = [
  {
    id: 'mar-1',
    name: 'Espresso Double Bio',
    sku: 'CF-ESP-01',
    price: '3.20 DT',
    soldCount: 412,
    soldLabel: '412 vendus',
    category: 'Café Signature',
    costPrice: '0.51 DT',
    revenue: '1,318.40 DT',
    marginPercent: 84,
    trend: '84% de marge',
  },
  {
    id: 'mar-2',
    name: 'Café Filtre V60 Pur Origine',
    sku: 'CF-V60-01',
    price: '3.80 DT',
    soldCount: 195,
    soldLabel: '195 vendus',
    category: 'Slow Coffee',
    costPrice: '0.68 DT',
    revenue: '741.00 DT',
    marginPercent: 82,
    trend: '82% de marge',
  },
  {
    id: 'mar-3',
    name: 'Flat White Signature',
    sku: 'CF-FLW-03',
    price: '4.50 DT',
    soldCount: 285,
    soldLabel: '285 vendus',
    category: 'Café Signature',
    costPrice: '0.85 DT',
    revenue: '1,282.50 DT',
    marginPercent: 81,
    trend: '81% de marge',
  },
  {
    id: 'mar-4',
    name: 'Cappuccino Lait d\'Avoine',
    sku: 'CF-CAP-02',
    price: '4.80 DT',
    soldCount: 348,
    soldLabel: '348 vendus',
    category: 'Spécialités Laitières',
    costPrice: '1.05 DT',
    revenue: '1,670.40 DT',
    marginPercent: 78,
    trend: '78% de marge',
  },
  {
    id: 'mar-5',
    name: 'Thé Matcha Cérémonial Bio',
    sku: 'TH-MAT-01',
    price: '5.20 DT',
    soldCount: 142,
    soldLabel: '142 vendus',
    category: 'Superfood',
    costPrice: '1.22 DT',
    revenue: '738.40 DT',
    marginPercent: 76,
    trend: '76% de marge',
  },
];

// Top 5 low stock products (Faible stock alertes Café Noir)
export const LOW_STOCK_PRODUCTS: LowStockProduct[] = [
  {
    id: 'low-1',
    name: 'Lait d\'Avoine Barista Oatly',
    sku: 'ST-OAT-01',
    stock: 4,
    minThreshold: 24,
    unit: 'briques',
    urgency: 'Critique',
  },
  {
    id: 'low-2',
    name: 'Grains Éthiopie Yirgacheffe Bio',
    sku: 'ST-ETH-02',
    stock: 2,
    minThreshold: 10,
    unit: 'kg',
    urgency: 'Critique',
  },
  {
    id: 'low-3',
    name: 'Gobelets Carton Recyclé 350ml',
    sku: 'ST-CUP-03',
    stock: 45,
    minThreshold: 250,
    unit: 'unités',
    urgency: 'Faible',
  },
  {
    id: 'low-4',
    name: 'Sirop Vanille Bourbon Maison',
    sku: 'ST-SYR-04',
    stock: 1,
    minThreshold: 6,
    unit: 'bouteilles',
    urgency: 'Critique',
  },
  {
    id: 'low-5',
    name: 'Beurre AOP Charentes-Poitou',
    sku: 'ST-BTR-05',
    stock: 3,
    minThreshold: 12,
    unit: 'kg',
    urgency: 'Faible',
  },
];

// Coffee shop primary operational alerts (Principales alertes)
export const COFFEE_ALERTS: CoffeeAlert[] = [
  {
    id: 'alt-1',
    title: 'Rupture imminente : Lait d\'Avoine Barista',
    description: 'Plus que 4 briques en réserve. Autonomie estimée à 3h de rush (consommation : 12 briques/jour).',
    level: 'danger',
    category: 'Stock',
    timeAgo: 'Il y a 15 min',
    actionLabel: 'Commander express',
  },
  {
    id: 'alt-2',
    title: 'Maintenance machine : La Marzocco KB90 Groupe 2',
    description: 'Détartrage et remplacement des joints de groupe recommandés (4 850 extractions enregistrées).',
    level: 'warning',
    category: 'Machine',
    timeAgo: 'Il y a 1 heure',
    actionLabel: 'Planifier entretien',
  },
  {
    id: 'alt-3',
    title: 'Contrôle DLC viennoiseries & sandwichs frais',
    description: '8 focaccias et 6 cookies cuits du matin doivent être consommés ou donnés avant 19h30.',
    level: 'info',
    category: 'Hygiène',
    timeAgo: 'Il y a 2 heures',
    actionLabel: 'Appliquer remise fin de journée',
  },
  {
    id: 'alt-4',
    title: 'Retard livraison grains Colombie Huila',
    description: 'Le torréfacteur partenaire signale un décalage de livraison de 24h (prévue demain 10h au lieu d\'aujourd\'hui).',
    level: 'warning',
    category: 'Fournisseur',
    timeAgo: 'Il y a 3 heures',
    actionLabel: 'Contacter le livreur',
  },
];

// Daily sales heatmap generator matching contribution calendar style (22 weeks x 7 days)
export const generateDailyContributionData = (): {
  weeks: DailyContributionDay[][];
  monthLabels: { label: string; weekIndex: number }[];
  totalSales: number;
  totalTickets: number;
  averageSales: number;
  maxDay: { date: string; amount: number; tickets: number };
} => {
  const weeksCount = 22; // approx 5 months
  const weeks: DailyContributionDay[][] = [];
  const monthNames = ['Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
  const monthLabels: { label: string; weekIndex: number }[] = [];

  // End date: September 7, 2026 (Monday)
  const endDate = new Date(2026, 8, 7); // month index 8 is September
  const totalDays = weeksCount * 7;
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  let totalSales = 0;
  let totalTickets = 0;
  let maxDay = { date: '', amount: 0, tickets: 0 };
  let currentMonth = -1;

  for (let w = 0; w < weeksCount; w++) {
    const weekDays: DailyContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d;
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + dayOffset);

      const dayOfWeek = (curDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
      const monthIdx = curDate.getMonth();

      // If month changed and week is starting, track month label
      if (monthIdx !== currentMonth && d === 0) {
        currentMonth = monthIdx;
        monthLabels.push({ label: monthNames[monthIdx], weekIndex: w });
      }

      // Format date
      const dateStr = curDate.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      // Intensity logic: Weekends and Fridays are busier in a coffee shop
      const isWeekend = dayOfWeek >= 5;
      const isFriday = dayOfWeek === 4;
      const isMonday = dayOfWeek === 0;

      let baseAmount = 900;
      if (isWeekend) baseAmount = 2100;
      else if (isFriday) baseAmount = 1600;
      else if (isMonday) baseAmount = 1100;

      // Realistic variation
      const pseudoRand = ((w * 17 + d * 23) % 41) / 40;
      const amount = Math.round(baseAmount * (0.75 + pseudoRand * 0.55));
      const tickets = Math.round(amount / (4.2 + (pseudoRand * 0.9)));

      totalSales += amount;
      totalTickets += tickets;

      if (amount > maxDay.amount) {
        maxDay = { date: dateStr, amount, tickets };
      }

      // Intensity 0 to 4
      let intensity = 1;
      if (amount === 0) intensity = 0;
      else if (amount < 850) intensity = 1;
      else if (amount < 1400) intensity = 2;
      else if (amount < 2100) intensity = 3;
      else intensity = 4;

      weekDays.push({
        date: dateStr,
        dayOfWeek,
        weekIndex: w,
        amount,
        tickets,
        intensity,
      });
    }
    weeks.push(weekDays);
  }

  const averageSales = Math.round(totalSales / totalDays);

  return {
    weeks,
    monthLabels,
    totalSales,
    totalTickets,
    averageSales,
    maxDay,
  };
};

// Data for "Ventes par jours" chart across Jours, Mois, Année
export const SALES_BY_PERIOD = {
  days: [
    { label: 'Lun 01/09', current: 1450, previous: 1320, tickets: 310 },
    { label: 'Mar 02/09', current: 1680, previous: 1490, tickets: 355 },
    { label: 'Mer 03/09', current: 1820, previous: 1610, tickets: 390 },
    { label: 'Jeu 04/09', current: 1940, previous: 1720, tickets: 412 },
    { label: 'Ven 05/09', current: 2450, previous: 2180, tickets: 520 },
    { label: 'Sam 06/09', current: 3120, previous: 2840, tickets: 642 },
    { label: 'Dim 07/09', current: 2845, previous: 2610, tickets: 596 },
  ],
  months: [
    { label: 'Jan', current: 18400, previous: 16200, tickets: 3950 },
    { label: 'Fév', current: 19200, previous: 17100, tickets: 4120 },
    { label: 'Mar', current: 21500, previous: 19000, tickets: 4580 },
    { label: 'Avr', current: 22800, previous: 20200, tickets: 4850 },
    { label: 'Mai', current: 24100, previous: 21600, tickets: 5120 },
    { label: 'Juin', current: 25600, previous: 22800, tickets: 5410 },
    { label: 'Juil', current: 26900, previous: 23900, tickets: 5720 },
    { label: 'Août', current: 23500, previous: 21100, tickets: 5020 },
    { label: 'Sept', current: 24750, previous: 21800, tickets: 5240 },
  ],
  years: [
    { label: '2023', current: 185000, previous: 152000, tickets: 41200 },
    { label: '2024', current: 224000, previous: 185000, tickets: 48900 },
    { label: '2025', current: 268000, previous: 224000, tickets: 57400 },
    { label: '2026', current: 312000, previous: 268000, tickets: 65800 },
  ],
};

// Data for "Achats par jours" chart across Jours, Mois, Année
export const PURCHASES_BY_PERIOD = {
  days: [
    { label: 'Lun 01/09', current: 620, previous: 710, labelDetail: 'Grains & laits' },
    { label: 'Mar 02/09', current: 450, previous: 490, labelDetail: 'Consommables' },
    { label: 'Mer 03/09', current: 890, previous: 820, labelDetail: 'Viennoiseries' },
    { label: 'Jeu 04/09', current: 540, previous: 630, labelDetail: 'Sirops & thés' },
    { label: 'Ven 05/09', current: 1120, previous: 1040, labelDetail: 'Réassort week-end' },
    { label: 'Sam 06/09', current: 780, previous: 850, labelDetail: 'Fraîcheur' },
    { label: 'Dim 07/09', current: 390, previous: 420, labelDetail: 'Dépannage' },
  ],
  months: [
    { label: 'Jan', current: 14200, previous: 13100, labelDetail: 'Achats Jan' },
    { label: 'Fév', current: 15100, previous: 13800, labelDetail: 'Achats Fév' },
    { label: 'Mar', current: 16800, previous: 15200, labelDetail: 'Achats Mar' },
    { label: 'Avr', current: 17400, previous: 15900, labelDetail: 'Achats Avr' },
    { label: 'Mai', current: 18200, previous: 16500, labelDetail: 'Achats Mai' },
    { label: 'Juin', current: 19100, previous: 17300, labelDetail: 'Achats Juin' },
    { label: 'Juil', current: 19800, previous: 18100, labelDetail: 'Achats Juil' },
    { label: 'Août', current: 17600, previous: 16200, labelDetail: 'Achats Août' },
    { label: 'Sept', current: 18500, previous: 17200, labelDetail: 'Achats Sept' },
  ],
  years: [
    { label: '2023', current: 138000, previous: 119000, labelDetail: '2023' },
    { label: '2024', current: 162000, previous: 138000, labelDetail: '2024' },
    { label: '2025', current: 194000, previous: 162000, labelDetail: '2025' },
    { label: '2026', current: 228000, previous: 194000, labelDetail: '2026' },
  ],
};
