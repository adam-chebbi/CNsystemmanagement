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
