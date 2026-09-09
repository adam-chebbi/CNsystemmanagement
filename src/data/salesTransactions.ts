export interface SaleItem {
  name: string;
  qty: number;
  price: number;
  // Widened from a fixed union to a plain string so it can reference the dynamic product
  // category catalog managed in "Produits, recettes & marges" (see productsModel.ts) — the
  // original 6 seeded category names are unchanged, new ones can now be added without a type edit.
  category: string;
}

export type ServiceType = 'Sur place' | 'À emporter';
export type PaymentMethod = 'Espèces' | 'Carte bancaire' | 'Ticket resto';

export interface SaleTransaction {
  id: number;
  saleNumber: string;
  serviceType: ServiceType;
  tableOrArea: string;
  items: SaleItem[];
  itemsCount: number;
  itemsSummary: string;
  paymentMethod: PaymentMethod;
  barista: string;
  totalAmount: number;
  date: string;
  time: string;
  month: string; // 'Jan' | 'Fév' | 'Mar' | 'Avr' | 'Mai' | 'Juin' | 'Juil' | 'Août' | 'Sep' | 'Oct' | 'Nov' | 'Déc'
  year: number;
  status: 'Payé' | 'Remboursé';
}

export const MONTHS_LIST = [
  { id: 'Jan', label: 'Jan', fullName: 'Janvier', monthIndex: 0 },
  { id: 'Fév', label: 'Fév', fullName: 'Février', monthIndex: 1 },
  { id: 'Mar', label: 'Mar', fullName: 'Mars', monthIndex: 2 },
  { id: 'Avr', label: 'Avr', fullName: 'Avril', monthIndex: 3 },
  { id: 'Mai', label: 'Mai', fullName: 'Mai', monthIndex: 4 },
  { id: 'Juin', label: 'Juin', fullName: 'Juin', monthIndex: 5 },
  { id: 'Juil', label: 'Juil', fullName: 'Juillet', monthIndex: 6 },
  { id: 'Août', label: 'Août', fullName: 'Août', monthIndex: 7 },
  { id: 'Sep', label: 'Sep', fullName: 'Septembre', monthIndex: 8 },
  { id: 'Oct', label: 'Oct', fullName: 'Octobre', monthIndex: 9 },
  { id: 'Nov', label: 'Nov', fullName: 'Novembre', monthIndex: 10 },
  { id: 'Déc', label: 'Déc', fullName: 'Décembre', monthIndex: 11 },
];

export const initialSalesTransactions: SaleTransaction[] = [
  // September 2026 (Current active month)
  {
    id: 1,
    saleNumber: 'TKT-2026-0941',
    serviceType: 'Sur place',
    tableOrArea: 'Table 04',
    items: [
      { name: 'Espresso Double Arabica', qty: 2, price: 7.00, category: 'Café chaud' },
      { name: 'Croissant Pur Beurre', qty: 2, price: 4.50, category: 'Pâtisserie' },
      { name: 'Jus d’Orange Pressé', qty: 1, price: 7.50, category: 'Boisson glacée' },
    ],
    itemsCount: 5,
    itemsSummary: '2x Espresso Double, 2x Croissant, 1x Jus Frais',
    paymentMethod: 'Carte bancaire',
    barista: 'Karim',
    totalAmount: 30.50,
    date: '2026-09-08',
    time: '09:42',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 2,
    saleNumber: 'TKT-2026-0940',
    serviceType: 'À emporter',
    tableOrArea: 'Comptoir Express',
    items: [
      { name: 'Latte Vanille Noisette', qty: 1, price: 8.50, category: 'Boisson lactée' },
      { name: 'Cookie Pépites Chocolat Noir', qty: 1, price: 5.50, category: 'Pâtisserie' },
    ],
    itemsCount: 2,
    itemsSummary: '1x Latte Vanille Noisette, 1x Cookie Chocolat',
    paymentMethod: 'Ticket resto',
    barista: 'Leila',
    totalAmount: 14.00,
    date: '2026-09-08',
    time: '09:15',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 3,
    saleNumber: 'TKT-2026-0939',
    serviceType: 'Sur place',
    tableOrArea: 'Table 08',
    items: [
      { name: 'Flat White Double Shot', qty: 2, price: 8.00, category: 'Boisson lactée' },
      { name: 'Pain au Chocolat Feuilleté', qty: 2, price: 5.00, category: 'Pâtisserie' },
      { name: 'Bouteille Eau Minérale 50cl', qty: 1, price: 2.50, category: 'Boisson glacée' },
    ],
    itemsCount: 5,
    itemsSummary: '2x Flat White, 2x Pain au Chocolat, 1x Eau 50cl',
    paymentMethod: 'Espèces',
    barista: 'Samira',
    totalAmount: 28.50,
    date: '2026-09-08',
    time: '08:50',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 4,
    saleNumber: 'TKT-2026-0938',
    serviceType: 'Sur place',
    tableOrArea: 'Table 11',
    items: [
      { name: 'Cold Brew Signature Éthiopie', qty: 2, price: 9.00, category: 'Boisson glacée' },
      { name: 'Cheesecake Spéculoos Maison', qty: 1, price: 11.50, category: 'Pâtisserie' },
      { name: 'Tartelette Citron Meringuée', qty: 1, price: 9.50, category: 'Pâtisserie' },
    ],
    itemsCount: 4,
    itemsSummary: '2x Cold Brew Signature, 1x Cheesecake, 1x Tartelette Citron',
    paymentMethod: 'Ticket resto',
    barista: 'Karim',
    totalAmount: 39.00,
    date: '2026-09-07',
    time: '16:30',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 5,
    saleNumber: 'TKT-2026-0937',
    serviceType: 'À emporter',
    tableOrArea: 'Comptoir Express',
    items: [
      { name: 'Espresso Ristretto Intenso', qty: 1, price: 4.50, category: 'Café chaud' },
    ],
    itemsCount: 1,
    itemsSummary: '1x Espresso Ristretto Intenso',
    paymentMethod: 'Espèces',
    barista: 'Mehdi',
    totalAmount: 4.50,
    date: '2026-09-07',
    time: '15:10',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 6,
    saleNumber: 'TKT-2026-0936',
    serviceType: 'À emporter',
    tableOrArea: 'Comptoir Express',
    items: [
      { name: 'Grains Café Éthiopie Yirgacheffe 250g', qty: 1, price: 26.00, category: 'Épicerie Café' },
      { name: 'Cappuccino Mousse Avoine', qty: 1, price: 8.00, category: 'Boisson lactée' },
    ],
    itemsCount: 2,
    itemsSummary: '1x Grains Yirgacheffe 250g, 1x Cappuccino Avoine',
    paymentMethod: 'Carte bancaire',
    barista: 'Leila',
    totalAmount: 34.00,
    date: '2026-09-07',
    time: '11:20',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 7,
    saleNumber: 'TKT-2026-0935',
    serviceType: 'Sur place',
    tableOrArea: 'Table 06',
    items: [
      { name: 'Formule Brunch Café Noir', qty: 2, price: 26.00, category: 'Snack' },
      { name: 'Café Allongé Colombie', qty: 2, price: 5.50, category: 'Café chaud' },
    ],
    itemsCount: 4,
    itemsSummary: '2x Formule Brunch, 2x Café Allongé Colombie',
    paymentMethod: 'Ticket resto',
    barista: 'Samira',
    totalAmount: 63.00,
    date: '2026-09-06',
    time: '11:45',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 8,
    saleNumber: 'TKT-2026-0934',
    serviceType: 'Sur place',
    tableOrArea: 'Table 02',
    items: [
      { name: 'Matcha Latte Bio Cérémonial', qty: 1, price: 9.50, category: 'Boisson lactée' },
      { name: 'Iced Caramel Macchiato', qty: 1, price: 9.00, category: 'Boisson glacée' },
      { name: 'Muffin Myrtilles Sauvages', qty: 1, price: 6.00, category: 'Pâtisserie' },
    ],
    itemsCount: 3,
    itemsSummary: '1x Matcha Latte, 1x Iced Caramel Macchiato, 1x Muffin Myrtilles',
    paymentMethod: 'Espèces',
    barista: 'Karim',
    totalAmount: 24.50,
    date: '2026-09-05',
    time: '17:15',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 9,
    saleNumber: 'TKT-2026-0933',
    serviceType: 'Sur place',
    tableOrArea: 'Table 03',
    items: [
      { name: 'Espresso Macchiato Onctueux', qty: 2, price: 6.00, category: 'Boisson lactée' },
      { name: 'Toast Avocat & Saumon Fumé', qty: 1, price: 16.50, category: 'Snack' },
    ],
    itemsCount: 3,
    itemsSummary: '2x Espresso Macchiato, 1x Toast Avocat & Saumon',
    paymentMethod: 'Carte bancaire',
    barista: 'Leila',
    totalAmount: 28.50,
    date: '2026-09-04',
    time: '12:30',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 10,
    saleNumber: 'TKT-2026-0932',
    serviceType: 'À emporter',
    tableOrArea: 'Comptoir Express',
    items: [
      { name: 'Americano Grande Taille', qty: 1, price: 6.50, category: 'Café chaud' },
      { name: 'Croissant aux Amandes', qty: 1, price: 6.00, category: 'Pâtisserie' },
    ],
    itemsCount: 2,
    itemsSummary: '1x Americano Grande, 1x Croissant aux Amandes',
    paymentMethod: 'Espèces',
    barista: 'Mehdi',
    totalAmount: 12.50,
    date: '2026-09-03',
    time: '08:15',
    month: 'Sep',
    year: 2026,
    status: 'Payé',
  },

  // August 2026
  {
    id: 11,
    saleNumber: 'TKT-2026-0850',
    serviceType: 'Sur place',
    tableOrArea: 'Table 05',
    items: [
      { name: 'Cold Brew Tonic Agrumes', qty: 2, price: 9.50, category: 'Boisson glacée' },
      { name: 'Glace Artisanale Café Espresso', qty: 2, price: 7.00, category: 'Snack' },
    ],
    itemsCount: 4,
    itemsSummary: '2x Cold Brew Tonic, 2x Glace Artisanale Café',
    paymentMethod: 'Ticket resto',
    barista: 'Samira',
    totalAmount: 33.00,
    date: '2026-08-28',
    time: '16:40',
    month: 'Août',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 12,
    saleNumber: 'TKT-2026-0849',
    serviceType: 'Sur place',
    tableOrArea: 'Table 08',
    items: [
      { name: 'Affogato al Caffè Spécial', qty: 2, price: 8.00, category: 'Boisson glacée' },
      { name: 'Brownie Noix de Pécan Fondant', qty: 1, price: 7.50, category: 'Pâtisserie' },
    ],
    itemsCount: 3,
    itemsSummary: '2x Affogato al Caffè, 1x Brownie Noix de Pécan',
    paymentMethod: 'Carte bancaire',
    barista: 'Karim',
    totalAmount: 23.50,
    date: '2026-08-20',
    time: '15:20',
    month: 'Août',
    year: 2026,
    status: 'Payé',
  },

  // July 2026
  {
    id: 13,
    saleNumber: 'TKT-2026-0740',
    serviceType: 'Sur place',
    tableOrArea: 'Table 01',
    items: [
      { name: 'Iced Latte Lait d’Amande', qty: 2, price: 9.00, category: 'Boisson glacée' },
      { name: 'Club Sandwich Poulet Grillé', qty: 2, price: 13.50, category: 'Snack' },
    ],
    itemsCount: 4,
    itemsSummary: '2x Iced Latte Amande, 2x Club Sandwich Poulet',
    paymentMethod: 'Ticket resto',
    barista: 'Leila',
    totalAmount: 45.00,
    date: '2026-07-22',
    time: '13:10',
    month: 'Juil',
    year: 2026,
    status: 'Payé',
  },
  {
    id: 14,
    saleNumber: 'TKT-2026-0739',
    serviceType: 'À emporter',
    tableOrArea: 'Comptoir Express',
    items: [
      { name: 'Grains Colombie Supremo 500g', qty: 1, price: 42.00, category: 'Épicerie Café' },
      { name: 'Espresso Double Arabica', qty: 1, price: 7.00, category: 'Café chaud' },
    ],
    itemsCount: 2,
    itemsSummary: '1x Grains Colombie 500g, 1x Espresso Double',
    paymentMethod: 'Carte bancaire',
    barista: 'Mehdi',
    totalAmount: 49.00,
    date: '2026-07-15',
    time: '10:05',
    month: 'Juil',
    year: 2026,
    status: 'Payé',
  },

  // June 2026
  {
    id: 15,
    saleNumber: 'TKT-2026-0630',
    serviceType: 'Sur place',
    tableOrArea: 'Table 07',
    items: [
      { name: 'Frappé Moka Chocolat Blanc', qty: 2, price: 9.50, category: 'Boisson glacée' },
      { name: 'Brioche Dorée Fleur d’Oranger', qty: 2, price: 5.50, category: 'Pâtisserie' },
    ],
    itemsCount: 4,
    itemsSummary: '2x Frappé Moka Blanc, 2x Brioche Dorée',
    paymentMethod: 'Espèces',
    barista: 'Samira',
    totalAmount: 30.00,
    date: '2026-06-18',
    time: '16:00',
    month: 'Juin',
    year: 2026,
    status: 'Payé',
  },

  // May 2026
  {
    id: 16,
    saleNumber: 'TKT-2026-0525',
    serviceType: 'Sur place',
    tableOrArea: 'Table 10',
    items: [
      { name: 'Cappuccino Mousse Avoine', qty: 2, price: 8.00, category: 'Boisson lactée' },
      { name: 'Carrot Cake Épices Douces', qty: 1, price: 8.50, category: 'Pâtisserie' },
    ],
    itemsCount: 3,
    itemsSummary: '2x Cappuccino Avoine, 1x Carrot Cake',
    paymentMethod: 'Ticket resto',
    barista: 'Karim',
    totalAmount: 24.50,
    date: '2026-05-12',
    time: '11:15',
    month: 'Mai',
    year: 2026,
    status: 'Payé',
  },

  // April 2026
  {
    id: 17,
    saleNumber: 'TKT-2026-0418',
    serviceType: 'Sur place',
    tableOrArea: 'Table 05',
    items: [
      { name: 'Café Cortado Tradition', qty: 2, price: 6.00, category: 'Boisson lactée' },
      { name: 'Pancakes Sirop d’Érable', qty: 1, price: 14.00, category: 'Snack' },
    ],
    itemsCount: 3,
    itemsSummary: '2x Cortado Tradition, 1x Pancakes Sirop Érable',
    paymentMethod: 'Espèces',
    barista: 'Leila',
    totalAmount: 26.00,
    date: '2026-04-14',
    time: '10:30',
    month: 'Avr',
    year: 2026,
    status: 'Payé',
  },

  // March 2026
  {
    id: 18,
    saleNumber: 'TKT-2026-0312',
    serviceType: 'Sur place',
    tableOrArea: 'Table 04',
    items: [
      { name: 'Café Chemex Dégustation 2 pers', qty: 1, price: 18.00, category: 'Café chaud' },
      { name: 'Financier Amande & Miel', qty: 2, price: 4.50, category: 'Pâtisserie' },
    ],
    itemsCount: 3,
    itemsSummary: '1x Chemex 2 pers, 2x Financier Amande Miel',
    paymentMethod: 'Carte bancaire',
    barista: 'Mehdi',
    totalAmount: 27.00,
    date: '2026-03-22',
    time: '15:45',
    month: 'Mar',
    year: 2026,
    status: 'Payé',
  },

  // February 2026
  {
    id: 19,
    saleNumber: 'TKT-2026-0208',
    serviceType: 'Sur place',
    tableOrArea: 'Table 09',
    items: [
      { name: 'Chocolat Chaud Gourmand Maison', qty: 2, price: 9.00, category: 'Boisson lactée' },
      { name: 'Gaufre Sucre & Chantilly', qty: 2, price: 7.50, category: 'Pâtisserie' },
    ],
    itemsCount: 4,
    itemsSummary: '2x Chocolat Chaud Maison, 2x Gaufre Chantilly',
    paymentMethod: 'Ticket resto',
    barista: 'Samira',
    totalAmount: 33.00,
    date: '2026-02-14',
    time: '16:15',
    month: 'Fév',
    year: 2026,
    status: 'Payé',
  },

  // January 2026
  {
    id: 20,
    saleNumber: 'TKT-2026-0105',
    serviceType: 'À emporter',
    tableOrArea: 'Comptoir Express',
    items: [
      { name: 'Espresso Simple Arabica', qty: 1, price: 4.50, category: 'Café chaud' },
      { name: 'Croissant Pur Beurre', qty: 1, price: 3.50, category: 'Pâtisserie' },
    ],
    itemsCount: 2,
    itemsSummary: '1x Espresso Simple, 1x Croissant Pur Beurre',
    paymentMethod: 'Espèces',
    barista: 'Karim',
    totalAmount: 8.00,
    date: '2026-01-18',
    time: '08:20',
    month: 'Jan',
    year: 2026,
    status: 'Payé',
  },

  // Additional realistic tickets throughout the year (strictly 'Sur place' or 'À emporter', and 'Espèces' | 'Carte bancaire' | 'Ticket resto')
  ...Array.from({ length: 34 }, (_, i) => {
    const serviceTypes: ServiceType[] = ['Sur place', 'À emporter'];
    const tablesSurPlace = ['Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 06', 'Table 07', 'Table 08', 'Table 09', 'Table 10'];
    const paymentMethods: PaymentMethod[] = ['Espèces', 'Carte bancaire', 'Ticket resto'];
    const baristas = ['Karim', 'Leila', 'Samira', 'Mehdi', 'Youssef'];
    const months = ['Sep', 'Août', 'Juil', 'Juin', 'Mai', 'Avr', 'Mar', 'Fév', 'Jan'];
    const sampleItems = [
      { name: 'Espresso Double Arabica', price: 7.00, category: 'Café chaud' as const },
      { name: 'Cappuccino Mousse Avoine', price: 8.00, category: 'Boisson lactée' as const },
      { name: 'Cold Brew Signature', price: 8.50, category: 'Boisson glacée' as const },
      { name: 'Croissant Pur Beurre', price: 3.50, category: 'Pâtisserie' as const },
      { name: 'Latte Caramel Noisette', price: 8.50, category: 'Boisson lactée' as const },
      { name: 'Cheesecake Spéculoos', price: 10.50, category: 'Pâtisserie' as const },
      { name: 'Grains Moka Bio 250g', price: 24.00, category: 'Épicerie Café' as const },
    ];

    const sType = serviceTypes[i % 2];
    const tbl = sType === 'Sur place' ? tablesSurPlace[i % tablesSurPlace.length] : 'Comptoir Express';
    const pMethod = paymentMethods[i % paymentMethods.length];
    const barista = baristas[i % baristas.length];
    const month = months[i % months.length];
    const item1 = sampleItems[i % sampleItems.length];
    const item2 = sampleItems[(i + 2) % sampleItems.length];
    const qty1 = 1 + (i % 2);
    const qty2 = 1 + ((i + 1) % 2);
    const total = Math.round((qty1 * item1.price + qty2 * item2.price) * 100) / 100;
    const ticketId = 21 + i;
    const day = (1 + (i * 2) % 27).toString().padStart(2, '0');
    const hour = (8 + (i % 12)).toString().padStart(2, '0');
    const min = (10 + (i * 7) % 50).toString().padStart(2, '0');

    return {
      id: ticketId,
      saleNumber: `TKT-2026-${(1000 + i).toString()}`,
      serviceType: sType,
      tableOrArea: tbl,
      items: [
        { name: item1.name, qty: qty1, price: item1.price, category: item1.category },
        { name: item2.name, qty: qty2, price: item2.price, category: item2.category },
      ],
      itemsCount: qty1 + qty2,
      itemsSummary: `${qty1}x ${item1.name}, ${qty2}x ${item2.name}`,
      paymentMethod: pMethod,
      barista,
      totalAmount: total,
      date: `2026-09-${day}`,
      time: `${hour}:${min}`,
      month,
      year: 2026,
      status: 'Payé' as const,
    };
  }),
];
