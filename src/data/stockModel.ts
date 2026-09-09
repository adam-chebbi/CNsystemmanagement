// Shared manual stock-management model: catalog, zones, lots and the append-only audit ledger.
// Every page (Stock, Mouvements, Inventaires, Pertes & ajustements, Lots & péremptions, Unités,
// Import Excel/CSV) reads and mutates this SAME model so quantities, valuation and history never
// diverge between pages.
//
// V1 rule: exactly two known zones. No CRUD to create/rename/delete zones is ever exposed.

import { normalizeKey } from './textUtils';

export type StockZone = 'Réserve principale' | 'Dépôt';
export const STOCK_ZONES: StockZone[] = ['Réserve principale', 'Dépôt'];

export type StockCategory =
  | 'Café & Boissons'
  | 'Produits laitiers'
  | 'Pâtisserie & Boulangerie'
  | 'Emballages & Consommables'
  | 'Sirops & Additifs'
  | 'Épicerie';

export const STOCK_CATEGORIES: StockCategory[] = [
  'Café & Boissons',
  'Produits laitiers',
  'Pâtisserie & Boulangerie',
  'Emballages & Consommables',
  'Sirops & Additifs',
  'Épicerie',
];

export type StockStatus = 'Normal' | 'Sous seuil' | 'Stock négatif' | 'Expiré' | 'Expiration proche';
export const STOCK_STATUSES: StockStatus[] = ['Normal', 'Sous seuil', 'Stock négatif', 'Expiré', 'Expiration proche'];

export interface StockProduct {
  id: string;
  name: string;
  sku: string;
  category: StockCategory;
  unit: string;
  minThreshold: number;
  targetStock: number;
  lotTracked: boolean;
  averageCost: number; // Coût Moyen Pondéré (CMP), DT / unité — used for every valuation
  reserveQty: number;
  depotQty: number;
}

export interface StockLot {
  id: string;
  productId: string;
  lotNumber: string;
  zone: StockZone;
  quantity: number;
  expiryDate: string; // ISO date
  receivedAt: string; // ISO date
}

// The unit catalog referenced by StockProduct.unit (matched by name, case/space-insensitively).
// Renaming a unit here cascades to every product currently using its old name so the two never
// drift apart — see renameStockUnit below.
export interface StockUnit {
  id: string;
  name: string;
  createdAt: string; // ISO date
}

export type StockOperationType = 'Entrée' | 'Sortie' | 'Transfert' | 'Inventaire' | 'Perte' | 'Ajustement';

export type LossReason =
  | 'Perte'
  | 'Casse'
  | 'Péremption'
  | 'Consommation interne'
  | 'Produit offert'
  | 'Erreur de préparation'
  | "Ajustement d'inventaire"
  | 'Autre';

export const LOSS_REASONS: LossReason[] = [
  'Perte',
  'Casse',
  'Péremption',
  'Consommation interne',
  'Produit offert',
  'Erreur de préparation',
  "Ajustement d'inventaire",
  'Autre',
];

export type InventoryScopeType = 'Complet' | 'Catégorie' | 'Zone';

// Every quantity change in the whole Stock module — of any kind — is recorded here, and only here.
// A transfer is stored as two linked rows (same groupId) so every row keeps the simple, uniform
// "one zone, one signed delta" shape used to update StockProduct quantities.
export interface StockLedgerEntry {
  id: string;
  groupId?: string;
  timestamp: string; // ISO datetime
  type: StockOperationType;
  productId: string;
  zone: StockZone;
  relatedZone?: StockZone; // Transfert only — the other side of the same transfer
  quantityBefore: number;
  quantityDelta: number; // signed
  quantityAfter: number;
  reason: string;
  comment?: string;
  lotId?: string;
  lotNumber?: string;
  expiryDate?: string;
  performedBy: string;
  status: 'Confirmé' | 'Annulé';
  cancelledAt?: string;
  cancelledBy?: string;
  cancelReason?: string;
  valueImpact: number; // quantityDelta * averageCost at the time of posting
  // Inventaire-only fields — always kept, whichever choice the user made, per spec §21
  theoreticalQty?: number;
  realQty?: number;
  discrepancyQty?: number;
  discrepancyValue?: number;
  inventoryChoice?: 'Ajusté' | 'Conservé';
  inventoryScope?: string;
}

let idCounter = 0;
export const generateStockId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
};

// --- Read helpers -----------------------------------------------------------------

export const getZoneQty = (product: StockProduct, zone: StockZone): number =>
  zone === 'Réserve principale' ? product.reserveQty : product.depotQty;

export const getTotalQty = (product: StockProduct): number => product.reserveQty + product.depotQty;

export const getProductQtyForZoneFilter = (product: StockProduct, zoneFilter: StockZone | 'Tous'): number =>
  zoneFilter === 'Tous' ? getTotalQty(product) : getZoneQty(product, zoneFilter);

export const getProductValue = (product: StockProduct, zoneFilter: StockZone | 'Tous' = 'Tous'): number =>
  getProductQtyForZoneFilter(product, zoneFilter) * product.averageCost;

export const daysUntil = (isoDate: string): number => {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
};

// --- Case/accent/whitespace tolerant resolution against existing canonical entities ----------
// Used by both the Unités page (duplicate detection) and Stock → Import Excel/CSV (row
// validation). A match always returns the real stored entity — never creates a new one.

export const resolveStockUnitByName = (raw: string, units: StockUnit[]): StockUnit | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return units.find((u) => normalizeKey(u.name) === key);
};

export const resolveStockZoneByName = (raw: string): StockZone | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return STOCK_ZONES.find((z) => normalizeKey(z) === key);
};

export const resolveStockCategoryByName = (raw: string): StockCategory | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return STOCK_CATEGORIES.find((c) => normalizeKey(c) === key);
};

export const resolveStockProductByName = (raw: string, products: StockProduct[]): StockProduct | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return products.find((p) => normalizeKey(p.name) === key);
};

export const getUnitUsageCount = (unit: StockUnit, products: StockProduct[]): number =>
  products.filter((p) => normalizeKey(p.unit) === normalizeKey(unit.name)).length;

// Renaming a unit cascades to every product currently referencing its old name (by value, since
// StockProduct.unit stores the unit's name rather than its id) so the catalog and products can
// never fall out of sync after an edit.
export const renameStockUnitAcrossProducts = (
  products: StockProduct[],
  oldName: string,
  newName: string
): StockProduct[] => {
  const key = normalizeKey(oldName);
  return products.map((p) => (normalizeKey(p.unit) === key ? { ...p, unit: newName } : p));
};

export type LotStatus = 'Expiré' | 'Expiration proche' | 'Valide';

export const getLotStatus = (lot: StockLot, alertDays: number): LotStatus => {
  const days = daysUntil(lot.expiryDate);
  if (days < 0) return 'Expiré';
  if (days <= alertDays) return 'Expiration proche';
  return 'Valide';
};

export interface ProductStockFlags {
  belowThreshold: boolean;
  negative: boolean;
  hasExpired: boolean;
  hasExpiringSoon: boolean;
}

export const computeProductFlags = (
  product: StockProduct,
  lots: StockLot[],
  alertDays: number,
  zoneFilter: StockZone | 'Tous' = 'Tous'
): ProductStockFlags => {
  const qty = getProductQtyForZoneFilter(product, zoneFilter);
  const relevantLots = lots.filter((l) => l.productId === product.id && (zoneFilter === 'Tous' || l.zone === zoneFilter));
  return {
    belowThreshold: qty < product.minThreshold,
    negative: qty < 0,
    hasExpired: relevantLots.some((l) => getLotStatus(l, alertDays) === 'Expiré'),
    hasExpiringSoon: relevantLots.some((l) => getLotStatus(l, alertDays) === 'Expiration proche'),
  };
};

// Single, prioritized status shown in the table (a product can match several flags at once).
export const getProductStatus = (flags: ProductStockFlags): StockStatus => {
  if (flags.negative) return 'Stock négatif';
  if (flags.hasExpired) return 'Expiré';
  if (flags.belowThreshold) return 'Sous seuil';
  if (flags.hasExpiringSoon) return 'Expiration proche';
  return 'Normal';
};

export const getStatusBadgeClass = (status: StockStatus): string => {
  switch (status) {
    case 'Normal':
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
    case 'Sous seuil':
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70';
    case 'Stock négatif':
      return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/70';
    case 'Expiré':
      return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/70';
    case 'Expiration proche':
      return 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/70';
  }
};

export const DEFAULT_EXPIRY_ALERT_DAYS = 7;

export const getLotStatusBadgeClass = (status: LotStatus): string => {
  switch (status) {
    case 'Valide':
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70';
    case 'Expiration proche':
      return 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/70';
    case 'Expiré':
      return 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/70';
  }
};

// --- Ledger application (the ONLY place StockProduct quantities are ever changed) --------

export const applyLedgerEntry = (products: StockProduct[], entry: StockLedgerEntry): StockProduct[] => {
  if (entry.status === 'Annulé') return products;
  return products.map((p) => {
    if (p.id !== entry.productId) return p;
    return entry.zone === 'Réserve principale'
      ? { ...p, reserveQty: p.reserveQty + entry.quantityDelta }
      : { ...p, depotQty: p.depotQty + entry.quantityDelta };
  });
};

export const applyLedgerEntries = (products: StockProduct[], entries: StockLedgerEntry[]): StockProduct[] =>
  entries.reduce((acc, e) => applyLedgerEntry(acc, e), products);

export const reverseLedgerEntry = (products: StockProduct[], entry: StockLedgerEntry): StockProduct[] =>
  products.map((p) => {
    if (p.id !== entry.productId) return p;
    return entry.zone === 'Réserve principale'
      ? { ...p, reserveQty: p.reserveQty - entry.quantityDelta }
      : { ...p, depotQty: p.depotQty - entry.quantityDelta };
  });

// --- Seed catalog -------------------------------------------------------------------

export const initialStockProducts: StockProduct[] = [
  { id: 'sp-1', name: "Grains Éthiopie Yirgacheffe Bio", sku: 'ST-ETH-02', category: 'Café & Boissons', unit: 'kg', minThreshold: 10, targetStock: 30, lotTracked: true, averageCost: 32.5, reserveQty: 8, depotQty: 2 },
  { id: 'sp-2', name: 'Grains Colombie Supremo', sku: 'ST-COL-06', category: 'Café & Boissons', unit: 'kg', minThreshold: 8, targetStock: 25, lotTracked: true, averageCost: 28.0, reserveQty: 14, depotQty: 6 },
  { id: 'sp-3', name: 'Café Décaféiné Grains', sku: 'ST-DEC-07', category: 'Café & Boissons', unit: 'kg', minThreshold: 4, targetStock: 12, lotTracked: true, averageCost: 34.0, reserveQty: 3, depotQty: 0 },
  { id: 'sp-4', name: 'Thé Vert Matcha Cérémonial', sku: 'ST-MAT-08', category: 'Café & Boissons', unit: 'kg', minThreshold: 2, targetStock: 6, lotTracked: false, averageCost: 65.0, reserveQty: 4, depotQty: 1 },
  { id: 'sp-5', name: "Lait d'Avoine Barista Oatly", sku: 'ST-OAT-01', category: 'Produits laitiers', unit: 'briques', minThreshold: 24, targetStock: 80, lotTracked: true, averageCost: 3.2, reserveQty: 4, depotQty: 0 },
  { id: 'sp-6', name: 'Lait Entier UHT', sku: 'ST-MLK-09', category: 'Produits laitiers', unit: 'litres', minThreshold: 30, targetStock: 100, lotTracked: true, averageCost: 1.8, reserveQty: 18, depotQty: 40 },
  { id: 'sp-7', name: 'Crème Fraîche Liquide', sku: 'ST-CRM-10', category: 'Produits laitiers', unit: 'litres', minThreshold: 8, targetStock: 20, lotTracked: true, averageCost: 4.5, reserveQty: -2, depotQty: 3 },
  { id: 'sp-8', name: 'Beurre AOP Charentes-Poitou', sku: 'ST-BTR-05', category: 'Produits laitiers', unit: 'kg', minThreshold: 12, targetStock: 30, lotTracked: true, averageCost: 9.8, reserveQty: 3, depotQty: 5 },
  { id: 'sp-9', name: 'Croissants Surgelés Pur Beurre', sku: 'ST-CRO-11', category: 'Pâtisserie & Boulangerie', unit: 'unités', minThreshold: 100, targetStock: 400, lotTracked: true, averageCost: 0.65, reserveQty: 120, depotQty: 260 },
  { id: 'sp-10', name: 'Farine T55', sku: 'ST-FAR-12', category: 'Pâtisserie & Boulangerie', unit: 'kg', minThreshold: 20, targetStock: 60, lotTracked: false, averageCost: 1.1, reserveQty: 35, depotQty: 15 },
  { id: 'sp-11', name: 'Sucre en Poudre', sku: 'ST-SUC-13', category: 'Épicerie', unit: 'kg', minThreshold: 15, targetStock: 50, lotTracked: false, averageCost: 1.4, reserveQty: 22, depotQty: 18 },
  { id: 'sp-12', name: 'Chocolat en Poudre', sku: 'ST-CHO-14', category: 'Épicerie', unit: 'kg', minThreshold: 6, targetStock: 20, lotTracked: false, averageCost: 8.2, reserveQty: 5, depotQty: 2 },
  { id: 'sp-13', name: 'Sirop Vanille Bourbon Maison', sku: 'ST-SYR-04', category: 'Sirops & Additifs', unit: 'bouteilles', minThreshold: 6, targetStock: 20, lotTracked: false, averageCost: 6.5, reserveQty: 1, depotQty: 2 },
  { id: 'sp-14', name: 'Sirop Caramel Beurre Salé', sku: 'ST-SYR-15', category: 'Sirops & Additifs', unit: 'bouteilles', minThreshold: 6, targetStock: 20, lotTracked: false, averageCost: 6.5, reserveQty: 9, depotQty: 4 },
  { id: 'sp-15', name: 'Gobelets Carton Recyclé 350ml', sku: 'ST-CUP-03', category: 'Emballages & Consommables', unit: 'unités', minThreshold: 250, targetStock: 1000, lotTracked: false, averageCost: 0.08, reserveQty: 45, depotQty: 300 },
  { id: 'sp-16', name: 'Couvercles Gobelets 350ml', sku: 'ST-LID-16', category: 'Emballages & Consommables', unit: 'unités', minThreshold: 250, targetStock: 1000, lotTracked: false, averageCost: 0.03, reserveQty: 400, depotQty: 500 },
  { id: 'sp-17', name: 'Filtres à Café Papier', sku: 'ST-FLT-17', category: 'Emballages & Consommables', unit: 'unités', minThreshold: 100, targetStock: 500, lotTracked: false, averageCost: 0.02, reserveQty: 80, depotQty: 120 },
  { id: 'sp-18', name: 'Serviettes en Papier', sku: 'ST-NAP-18', category: 'Emballages & Consommables', unit: 'paquets', minThreshold: 20, targetStock: 80, lotTracked: false, averageCost: 1.9, reserveQty: 30, depotQty: 25 },
];

const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// Seeded from the units actually referenced by initialStockProducts above — not invented values —
// so the Unités catalog starts in sync with real usage instead of duplicating anything.
export const initialStockUnits: StockUnit[] = [
  { id: 'unit-1', name: 'kg', createdAt: isoDaysFromNow(-180) },
  { id: 'unit-2', name: 'briques', createdAt: isoDaysFromNow(-180) },
  { id: 'unit-3', name: 'litres', createdAt: isoDaysFromNow(-180) },
  { id: 'unit-4', name: 'unités', createdAt: isoDaysFromNow(-180) },
  { id: 'unit-5', name: 'bouteilles', createdAt: isoDaysFromNow(-180) },
  { id: 'unit-6', name: 'paquets', createdAt: isoDaysFromNow(-180) },
  // Added for recipe-level precision (fiche technique quantities like "80 g" of coffee) — same
  // catalog, not a second unit list; convertQuantity below handles kg↔g and litres↔ml.
  { id: 'unit-7', name: 'g', createdAt: isoDaysFromNow(-1) },
  { id: 'unit-8', name: 'ml', createdAt: isoDaysFromNow(-1) },
];

// --- Unit conversion (kg↔g, litres↔ml only — other units must match exactly) ------------------

type UnitDimension = 'mass' | 'volume';

const UNIT_CONVERSION_TABLE: Record<string, { dimension: UnitDimension; toBaseFactor: number }> = {
  g: { dimension: 'mass', toBaseFactor: 1 },
  kg: { dimension: 'mass', toBaseFactor: 1000 },
  ml: { dimension: 'volume', toBaseFactor: 1 },
  litres: { dimension: 'volume', toBaseFactor: 1000 },
};

// Converts a quantity from one unit name to another. Returns null when the two units are not
// compatible (different dimensions, e.g. kg → litres) or aren't part of the conversion table at
// all (e.g. "unités", "briques") — those must match exactly, never silently coerced.
export const convertQuantity = (quantity: number, fromUnit: string, toUnit: string): number | null => {
  const fromKey = normalizeKey(fromUnit);
  const toKey = normalizeKey(toUnit);
  if (fromKey === toKey) return quantity;
  const from = UNIT_CONVERSION_TABLE[fromKey];
  const to = UNIT_CONVERSION_TABLE[toKey];
  if (!from || !to || from.dimension !== to.dimension) return null;
  return (quantity * from.toBaseFactor) / to.toBaseFactor;
};

export const areUnitsCompatible = (unitA: string, unitB: string): boolean => convertQuantity(1, unitA, unitB) !== null;

export const initialStockLots: StockLot[] = [
  { id: 'lot-1', productId: 'sp-1', lotNumber: 'ETH-2026-014', zone: 'Réserve principale', quantity: 8, expiryDate: isoDaysFromNow(120), receivedAt: isoDaysFromNow(-30) },
  { id: 'lot-2', productId: 'sp-1', lotNumber: 'ETH-2026-015', zone: 'Dépôt', quantity: 2, expiryDate: isoDaysFromNow(5), receivedAt: isoDaysFromNow(-10) },
  { id: 'lot-3', productId: 'sp-2', lotNumber: 'COL-2026-021', zone: 'Réserve principale', quantity: 14, expiryDate: isoDaysFromNow(150), receivedAt: isoDaysFromNow(-15) },
  { id: 'lot-4', productId: 'sp-2', lotNumber: 'COL-2026-022', zone: 'Dépôt', quantity: 6, expiryDate: isoDaysFromNow(150), receivedAt: isoDaysFromNow(-15) },
  { id: 'lot-5', productId: 'sp-3', lotNumber: 'DEC-2026-003', zone: 'Réserve principale', quantity: 3, expiryDate: isoDaysFromNow(90), receivedAt: isoDaysFromNow(-20) },
  { id: 'lot-6', productId: 'sp-5', lotNumber: 'OAT-2026-102', zone: 'Réserve principale', quantity: 4, expiryDate: isoDaysFromNow(45), receivedAt: isoDaysFromNow(-5) },
  { id: 'lot-7', productId: 'sp-6', lotNumber: 'MLK-2026-201', zone: 'Réserve principale', quantity: 18, expiryDate: isoDaysFromNow(10), receivedAt: isoDaysFromNow(-4) },
  { id: 'lot-8', productId: 'sp-6', lotNumber: 'MLK-2026-202', zone: 'Dépôt', quantity: 40, expiryDate: isoDaysFromNow(18), receivedAt: isoDaysFromNow(-2) },
  { id: 'lot-9', productId: 'sp-7', lotNumber: 'CRM-2026-055', zone: 'Dépôt', quantity: 3, expiryDate: isoDaysFromNow(3), receivedAt: isoDaysFromNow(-6) },
  { id: 'lot-10', productId: 'sp-7', lotNumber: 'CRM-2026-054', zone: 'Réserve principale', quantity: -2, expiryDate: isoDaysFromNow(-2), receivedAt: isoDaysFromNow(-12) },
  { id: 'lot-11', productId: 'sp-8', lotNumber: 'BTR-2026-033', zone: 'Réserve principale', quantity: 3, expiryDate: isoDaysFromNow(60), receivedAt: isoDaysFromNow(-8) },
  { id: 'lot-12', productId: 'sp-8', lotNumber: 'BTR-2026-034', zone: 'Dépôt', quantity: 5, expiryDate: isoDaysFromNow(60), receivedAt: isoDaysFromNow(-8) },
  { id: 'lot-13', productId: 'sp-9', lotNumber: 'CRO-2026-401', zone: 'Réserve principale', quantity: 120, expiryDate: isoDaysFromNow(75), receivedAt: isoDaysFromNow(-9) },
  { id: 'lot-14', productId: 'sp-9', lotNumber: 'CRO-2026-402', zone: 'Dépôt', quantity: 260, expiryDate: isoDaysFromNow(80), receivedAt: isoDaysFromNow(-3) },
];

export const initialStockLedger: StockLedgerEntry[] = [
  {
    id: 'led-1',
    timestamp: `${isoDaysFromNow(-9)}T09:15:00`,
    type: 'Entrée',
    productId: 'sp-9',
    zone: 'Dépôt',
    quantityBefore: 0,
    quantityDelta: 260,
    quantityAfter: 260,
    reason: 'Réception fournisseur',
    comment: 'Livraison hebdomadaire boulangerie surgelée',
    lotId: 'lot-14',
    lotNumber: 'CRO-2026-402',
    expiryDate: isoDaysFromNow(80),
    performedBy: 'Karim',
    status: 'Confirmé',
    valueImpact: 260 * 0.65,
  },
  {
    id: 'led-2',
    timestamp: `${isoDaysFromNow(-4)}T14:30:00`,
    type: 'Transfert',
    groupId: 'trf-1',
    productId: 'sp-6',
    zone: 'Réserve principale',
    relatedZone: 'Dépôt',
    quantityBefore: 38,
    quantityDelta: -20,
    quantityAfter: 18,
    reason: 'Réassort comptoir',
    comment: 'Transfert vers le dépôt pour rotation des lots',
    performedBy: 'Leila',
    status: 'Confirmé',
    valueImpact: -20 * 1.8,
  },
  {
    id: 'led-3',
    timestamp: `${isoDaysFromNow(-4)}T14:30:00`,
    type: 'Transfert',
    groupId: 'trf-1',
    productId: 'sp-6',
    zone: 'Dépôt',
    relatedZone: 'Réserve principale',
    quantityBefore: 20,
    quantityDelta: 20,
    quantityAfter: 40,
    reason: 'Réassort comptoir',
    comment: 'Transfert vers le dépôt pour rotation des lots',
    performedBy: 'Leila',
    status: 'Confirmé',
    valueImpact: 20 * 1.8,
  },
  {
    id: 'led-4',
    timestamp: `${isoDaysFromNow(-2)}T11:05:00`,
    type: 'Perte',
    productId: 'sp-8',
    zone: 'Réserve principale',
    quantityBefore: 5,
    quantityDelta: -2,
    quantityAfter: 3,
    reason: 'Casse',
    comment: 'Plaquette tombée en chambre froide',
    performedBy: 'Samira',
    status: 'Confirmé',
    valueImpact: -2 * 9.8,
  },
  {
    id: 'led-5',
    timestamp: `${isoDaysFromNow(-6)}T08:40:00`,
    type: 'Inventaire',
    productId: 'sp-13',
    zone: 'Réserve principale',
    quantityBefore: 3,
    quantityDelta: -2,
    quantityAfter: 1,
    reason: "Ajustement d'inventaire",
    comment: 'Inventaire complet mensuel',
    performedBy: 'Mehdi',
    status: 'Confirmé',
    valueImpact: -2 * 6.5,
    theoreticalQty: 3,
    realQty: 1,
    discrepancyQty: -2,
    discrepancyValue: -2 * 6.5,
    inventoryChoice: 'Ajusté',
    inventoryScope: 'Complet',
  },
];
