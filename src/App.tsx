import React, { useState, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MetricCards } from './components/MetricCards';
import { AnalysisFilterBar } from './components/AnalysisFilterBar';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { PlanOverview } from './components/PlanOverview';
import { SalesChart } from './components/SalesChart';
import { PurchasesChart } from './components/PurchasesChart';
import { ProductsAndStock } from './components/ProductsAndStock';
import { ActionModals } from './components/ActionModals';
import { SalesPage } from './components/SalesPage';
import { ManualSalesEntryPage } from './components/ManualSalesEntryPage';
import { TimeFilterPeriod } from './types';
import { useUrlNavigation } from './hooks/useUrlNavigation';
import { initialSalesTransactions, SaleTransaction } from './data/salesTransactions';
import {
  initialStockProducts,
  initialStockLots,
  initialStockLedger,
  initialStockUnits,
  StockProduct,
  StockLot,
  StockLedgerEntry,
  StockUnit,
  applyLedgerEntries,
  reverseLedgerEntry,
  renameStockUnitAcrossProducts,
} from './data/stockModel';
import { initialCatalogArticles, CatalogArticle } from './data/manualSalesCatalog';
import {
  initialProductCategories,
  initialProductSubCategories,
  initialSubRecipes,
  ProductCategory,
  ProductSubCategory,
  SubRecipe,
} from './data/productsModel';
import { initialActivityLog, ActivityLogEntry, generateActivityId } from './data/activityLog';
import { initialExpenseCategories, initialExpenses, Expense, ExpenseCategory, ExpenseStatus } from './data/expensesModel';
import {
  initialSuppliers,
  initialPurchaseOrders,
  initialPurchaseReceptions,
  initialSupplierInvoices,
  Supplier,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseReception,
  SupplierInvoice,
  buildReceptionLedgerEntries,
  applyReceptionToOrder,
} from './data/purchasesModel';
import { OperationalAlert } from './data/alertsModel';
import {
  initialEmployees,
  initialShifts,
  initialDayRecords,
  initialRecurringPlans,
  initialFinancialRecords,
  Employee,
  Shift,
  DayRecord,
  RecurringPlan,
  FinancialRecord,
  AttendanceStatus,
  WeeklyPattern,
  generateHrId,
  buildDayRecordsFromPattern,
  buildManualDayRecord,
  findDayRecord,
  getEmployeeFullName,
} from './data/hrModel';
import { RotateCw, CheckCircle2, Loader2 } from 'lucide-react';

// Lazy-loaded: pulls in the xlsx/papaparse parsing libraries only when the user
// actually opens the Import Excel/CSV page, keeping the main bundle lean.
const ImportSalesPage = lazy(() =>
  import('./components/ImportSalesPage').then((m) => ({ default: m.ImportSalesPage }))
);

// Lazy-loaded: the Stock module (5 pages) is only fetched when the user opens the Stock section.
const StockPage = lazy(() => import('./components/StockPage').then((m) => ({ default: m.StockPage })));
const StockMovementsPage = lazy(() =>
  import('./components/StockMovementsPage').then((m) => ({ default: m.StockMovementsPage }))
);
const StockInventoryPage = lazy(() =>
  import('./components/StockInventoryPage').then((m) => ({ default: m.StockInventoryPage }))
);
const StockLossesPage = lazy(() =>
  import('./components/StockLossesPage').then((m) => ({ default: m.StockLossesPage }))
);
const StockLotsPage = lazy(() => import('./components/StockLotsPage').then((m) => ({ default: m.StockLotsPage })));
const StockUnitsPage = lazy(() => import('./components/StockUnitsPage').then((m) => ({ default: m.StockUnitsPage })));
const StockImportPage = lazy(() => import('./components/StockImportPage').then((m) => ({ default: m.StockImportPage })));

// Lazy-loaded: the "Produits, recettes & marges" module (4 pages).
const ProductsPage = lazy(() => import('./components/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const ProductFormPage = lazy(() => import('./components/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const ProductCatalogPage = lazy(() => import('./components/ProductCatalogPage').then((m) => ({ default: m.ProductCatalogPage })));
const ProductsImportPage = lazy(() => import('./components/ProductsImportPage').then((m) => ({ default: m.ProductsImportPage })));
const SubRecipesPage = lazy(() => import('./components/SubRecipesPage').then((m) => ({ default: m.SubRecipesPage })));

// Lazy-loaded: Journal d'activité.
const ActivityLogPage = lazy(() => import('./components/ActivityLogPage').then((m) => ({ default: m.ActivityLogPage })));

// Lazy-loaded: the "Achat et dépenses" → Dépenses module (2 pages).
const ExpensesPage = lazy(() => import('./components/ExpensesPage').then((m) => ({ default: m.ExpensesPage })));
const ExpenseCategoriesPage = lazy(() =>
  import('./components/ExpenseCategoriesPage').then((m) => ({ default: m.ExpenseCategoriesPage }))
);

// Lazy-loaded: the "Achat et dépenses" → Achats et acquisitions page.
const PurchasesPage = lazy(() => import('./components/PurchasesPage').then((m) => ({ default: m.PurchasesPage })));
const SuppliersPage = lazy(() => import('./components/SuppliersPage').then((m) => ({ default: m.SuppliersPage })));
const InvoicesPage = lazy(() => import('./components/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));

// Lazy-loaded: "Gestion du personnel" module (3 pages).
const EmployeesPage = lazy(() => import('./components/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const PlanningPage = lazy(() => import('./components/PlanningPage').then((m) => ({ default: m.PlanningPage })));
const FinancialsPage = lazy(() => import('./components/FinancialsPage').then((m) => ({ default: m.FinancialsPage })));

// Lazy-loaded: "Rapports et analyses" module (7 pages) — each pulls in the jsPDF/autotable PDF
// engine only when opened, keeping the main bundle lean.
const SalesReportPage = lazy(() => import('./components/SalesReportPage').then((m) => ({ default: m.SalesReportPage })));
const PurchasesReportPage = lazy(() => import('./components/PurchasesReportPage').then((m) => ({ default: m.PurchasesReportPage })));
const ExpensesReportPage = lazy(() => import('./components/ExpensesReportPage').then((m) => ({ default: m.ExpensesReportPage })));
const StockReportPage = lazy(() => import('./components/StockReportPage').then((m) => ({ default: m.StockReportPage })));
const FinancialReportPage = lazy(() => import('./components/FinancialReportPage').then((m) => ({ default: m.FinancialReportPage })));
const TaxReportPage = lazy(() => import('./components/TaxReportPage').then((m) => ({ default: m.TaxReportPage })));
const MonthlyReportPage = lazy(() => import('./components/MonthlyReportPage').then((m) => ({ default: m.MonthlyReportPage })));
const ExportDataPage = lazy(() => import('./components/ExportDataPage').then((m) => ({ default: m.ExportDataPage })));

// Lazy-loaded: Notifications & Alertes.
const NotificationsPage = lazy(() => import('./components/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));

const StockPageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-500 dark:text-gray-400">
    <Loader2 size={18} className="animate-spin" />
    <span>Chargement du module Stock…</span>
  </div>
);

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Drop-in replacement for two plain useState calls: same external shape (setActiveTab/
  // setActiveSubItem take a plain string), but kept in sync with the URL's ?tab=&sub= — deep
  // links, page refreshes and the browser back/forward buttons all work. 'dashboard' has no
  // subitem, so the default subitem is '' (not a stray leftover like 'sales'), matching how every
  // onNavigateToDashboard handler below already resets it.
  const { activeTab, activeSubItem, setActiveTab, setActiveSubItem } = useUrlNavigation({ tab: 'dashboard', sub: '' });
  // The project handles light mode only — no dark-mode toggle exists in the UI. Kept as a plain
  // constant (rather than removing the prop from every page) so the many existing
  // isDarkMode={isDarkMode} call sites throughout this file don't need to change.
  const isDarkMode = false;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshToast, setShowRefreshToast] = useState(false);
  const [activePeriod, setActivePeriod] = useState<TimeFilterPeriod>('today');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);
  const [customRange, setCustomRange] = useState({ start: '2026-09-01', end: '2026-09-07' });
  const [modalType, setModalType] = useState<
    'upgrade' | 'restock' | 'sales_returns' | 'purchase_returns' | 'products' | 'clients' | 'vendors' | null
  >(null);
  const [salesTransactions, setSalesTransactions] = useState<SaleTransaction[]>(initialSalesTransactions);
  const [stockProducts, setStockProducts] = useState<StockProduct[]>(initialStockProducts);
  const [stockLots, setStockLots] = useState<StockLot[]>(initialStockLots);
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>(initialStockLedger);
  const [stockUnits, setStockUnits] = useState<StockUnit[]>(initialStockUnits);
  const [catalogArticles, setCatalogArticles] = useState<CatalogArticle[]>(initialCatalogArticles);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(initialProductCategories);
  const [productSubCategories, setProductSubCategories] = useState<ProductSubCategory[]>(initialProductSubCategories);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>(initialSubRecipes);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(initialActivityLog);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [purchaseReceptions, setPurchaseReceptions] = useState<PurchaseReception[]>(initialPurchaseReceptions);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(initialSupplierInvoices);
  const [hrEmployees, setHrEmployees] = useState<Employee[]>(initialEmployees);
  const [hrShifts, setHrShifts] = useState<Shift[]>(initialShifts);
  const [hrDayRecords, setHrDayRecords] = useState<DayRecord[]>(initialDayRecords);
  const [hrRecurringPlans, setHrRecurringPlans] = useState<RecurringPlan[]>(initialRecurringPlans);
  const [hrFinancialRecords, setHrFinancialRecords] = useState<FinancialRecord[]>(initialFinancialRecords);
  const [treatedAlerts, setTreatedAlerts] = useState<Record<string, { treatedAt: string; treatedBy: string }>>({});

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setShowRefreshToast(true);
      setTimeout(() => setShowRefreshToast(false), 3000);
    }, 800);
  };

  // Single append point for the whole app's audit trail — every mutating handler below calls
  // this once it has applied its change, so "Journal d'activité" never has to reconstruct
  // history from scattered module state.
  const logActivity = (module: string, action: string, description: string, user: string) => {
    setActivityLog((prev) => [
      { id: generateActivityId(), timestamp: new Date().toISOString(), user, module, action, description },
      ...prev,
    ]);
  };

  // Every manual stock operation (movement, transfer, loss, adjustment, inventory) funnels
  // through this single function, keeping StockProduct quantities and the audit ledger in sync.
  const handlePostStockEntries = (entries: StockLedgerEntry[], lotChanges?: { upsert?: StockLot[] }) => {
    setStockProducts((prev) => applyLedgerEntries(prev, entries));
    setStockLedger((prev) => [...entries, ...prev]);
    if (lotChanges?.upsert) {
      setStockLots((prev) => {
        const map = new Map(prev.map((l) => [l.id, l]));
        lotChanges.upsert!.forEach((l) => map.set(l.id, l));
        return Array.from(map.values());
      });
    }
    entries.forEach((entry) => {
      const product = stockProducts.find((p) => p.id === entry.productId);
      const zoneLabel = entry.relatedZone ? `${entry.zone} → ${entry.relatedZone}` : entry.zone;
      logActivity(
        'Stock',
        entry.type,
        `${entry.type} — ${product?.name ?? entry.productId} (${entry.quantityDelta > 0 ? '+' : ''}${entry.quantityDelta}, ${zoneLabel})`,
        entry.performedBy
      );
    });
  };

  // Cancelling never deletes history: the entry is kept and flagged "Annulé", and its effect on
  // the product quantity is reversed.
  const handleCancelStockEntry = (entryId: string, cancelledBy: string) => {
    setStockLedger((prevLedger) => {
      const entry = prevLedger.find((e) => e.id === entryId);
      if (!entry || entry.status === 'Annulé') return prevLedger;
      setStockProducts((prevProducts) => reverseLedgerEntry(prevProducts, entry));
      const product = stockProducts.find((p) => p.id === entry.productId);
      logActivity('Stock', 'Annulation', `Annulation d'un mouvement — ${product?.name ?? entry.productId} (${entry.type})`, cancelledBy);
      return prevLedger.map((e) =>
        e.id === entryId ? { ...e, status: 'Annulé' as const, cancelledAt: new Date().toISOString(), cancelledBy } : e
      );
    });
  };

  const handleCreateStockUnit = (unit: StockUnit) => {
    setStockUnits((prev) => [...prev, unit]);
    logActivity('Stock', 'Création', `Nouvelle unité : ${unit.name}`, 'Company');
  };

  // Renaming a unit cascades to every product referencing its old name, so the catalog and
  // products never fall out of sync — never touches quantities, only the descriptive label.
  const handleRenameStockUnit = (unitId: string, newName: string) => {
    setStockUnits((prevUnits) => {
      const unit = prevUnits.find((u) => u.id === unitId);
      if (!unit) return prevUnits;
      setStockProducts((prevProducts) => renameStockUnitAcrossProducts(prevProducts, unit.name, newName));
      logActivity('Stock', 'Modification', `Unité renommée : « ${unit.name} » → « ${newName} »`, 'Company');
      return prevUnits.map((u) => (u.id === unitId ? { ...u, name: newName } : u));
    });
  };

  // Stock → Import Excel/CSV posts the same kind of ledger entries as a manual movement, plus
  // optional direct threshold/target updates — both funnel through the existing stock state.
  const handlePostImportedStock = (
    entries: StockLedgerEntry[],
    lotUpserts: StockLot[],
    productUpdates: Array<{ id: string; minThreshold?: number; targetStock?: number }>
  ) => {
    setStockProducts((prev) => {
      const withLedger = applyLedgerEntries(prev, entries);
      if (productUpdates.length === 0) return withLedger;
      const updateMap = new Map(productUpdates.map((u) => [u.id, u]));
      return withLedger.map((p) => {
        const u = updateMap.get(p.id);
        if (!u) return p;
        return {
          ...p,
          minThreshold: u.minThreshold !== undefined ? u.minThreshold : p.minThreshold,
          targetStock: u.targetStock !== undefined ? u.targetStock : p.targetStock,
        };
      });
    });
    setStockLedger((prev) => [...entries, ...prev]);
    if (lotUpserts.length > 0) {
      setStockLots((prev) => {
        const map = new Map(prev.map((l) => [l.id, l]));
        lotUpserts.forEach((l) => map.set(l.id, l));
        return Array.from(map.values());
      });
    }
    logActivity(
      'Stock',
      'Import',
      `Import Excel/CSV — ${entries.length} mouvement(s), ${productUpdates.length} mise(s) à jour de seuil/cible`,
      entries[0]?.performedBy ?? 'Company'
    );
  };

  const handleCreateProduct = (article: CatalogArticle) => {
    setCatalogArticles((prev) => [...prev, article]);
    logActivity('Produits', 'Création', `Produit créé : ${article.name}`, 'Company');
  };

  const handleUpdateProduct = (article: CatalogArticle) => {
    setCatalogArticles((prev) => prev.map((a) => (a.id === article.id ? article : a)));
    logActivity('Produits', 'Modification', `Produit modifié : ${article.name}`, 'Company');
  };

  const handleDeleteProduct = (articleId: string) => {
    const article = catalogArticles.find((a) => a.id === articleId);
    setCatalogArticles((prev) => prev.filter((a) => a.id !== articleId));
    logActivity('Produits', 'Suppression', `Produit supprimé : ${article?.name ?? articleId}`, 'Company');
  };

  const handleToggleProductAvailability = (articleId: string, isAvailable: boolean) => {
    const article = catalogArticles.find((a) => a.id === articleId);
    setCatalogArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, isAvailable } : a)));
    logActivity(
      'Produits',
      'Modification',
      `Disponibilité modifiée : ${article?.name ?? articleId} → ${isAvailable ? 'Disponible' : 'Indisponible'}`,
      'Company'
    );
  };

  const handleImportProducts = (newArticles: CatalogArticle[]) => {
    setCatalogArticles((prev) => [...prev, ...newArticles]);
    logActivity('Produits', 'Import', `Import Excel/CSV — ${newArticles.length} produit(s) ajoutés`, 'Company');
  };

  const handleCreateSubRecipe = (subRecipe: SubRecipe) => {
    setSubRecipes((prev) => [...prev, subRecipe]);
    logActivity('Produits', 'Création', `Sous-recette créée : ${subRecipe.name}`, 'Company');
  };

  const handleUpdateSubRecipe = (subRecipe: SubRecipe) => {
    setSubRecipes((prev) => prev.map((sr) => (sr.id === subRecipe.id ? subRecipe : sr)));
    logActivity('Produits', 'Modification', `Sous-recette modifiée : ${subRecipe.name}`, 'Company');
  };

  const handleDeleteSubRecipe = (subRecipeId: string) => {
    const subRecipe = subRecipes.find((sr) => sr.id === subRecipeId);
    setSubRecipes((prev) => prev.filter((sr) => sr.id !== subRecipeId));
    logActivity('Produits', 'Suppression', `Sous-recette supprimée : ${subRecipe?.name ?? subRecipeId}`, 'Company');
  };

  const handleCreateProductCategory = (category: ProductCategory) => {
    setProductCategories((prev) => [...prev, category]);
    logActivity('Catalogue', 'Création', `Catégorie créée : ${category.name}`, 'Company');
  };

  const handleRenameProductCategory = (categoryId: string, newName: string) => {
    setProductCategories((prevCategories) => {
      const category = prevCategories.find((c) => c.id === categoryId);
      if (!category) return prevCategories;
      setCatalogArticles((prevArticles) =>
        prevArticles.map((a) => (a.category === category.name ? { ...a, category: newName as CatalogArticle['category'] } : a))
      );
      logActivity('Catalogue', 'Modification', `Catégorie renommée : « ${category.name} » → « ${newName} »`, 'Company');
      return prevCategories.map((c) => (c.id === categoryId ? { ...c, name: newName } : c));
    });
  };

  const handleDeleteProductCategory = (categoryId: string) => {
    const category = productCategories.find((c) => c.id === categoryId);
    setProductCategories((prev) => prev.filter((c) => c.id !== categoryId));
    logActivity('Catalogue', 'Suppression', `Catégorie supprimée : ${category?.name ?? categoryId}`, 'Company');
  };

  const handleCreateProductSubCategory = (subCategory: ProductSubCategory) => {
    setProductSubCategories((prev) => [...prev, subCategory]);
    logActivity('Catalogue', 'Création', `Sous-catégorie créée : ${subCategory.name}`, 'Company');
  };

  const handleRenameProductSubCategory = (subCategoryId: string, newName: string, newCategoryId: string) => {
    setProductSubCategories((prevSubCategories) => {
      const subCategory = prevSubCategories.find((s) => s.id === subCategoryId);
      if (!subCategory) return prevSubCategories;
      setCatalogArticles((prevArticles) =>
        prevArticles.map((a) => (a.subCategory === subCategory.name ? { ...a, subCategory: newName } : a))
      );
      logActivity('Catalogue', 'Modification', `Sous-catégorie renommée : « ${subCategory.name} » → « ${newName} »`, 'Company');
      return prevSubCategories.map((s) => (s.id === subCategoryId ? { ...s, name: newName, categoryId: newCategoryId } : s));
    });
  };

  const handleDeleteProductSubCategory = (subCategoryId: string) => {
    const subCategory = productSubCategories.find((s) => s.id === subCategoryId);
    setProductSubCategories((prev) => prev.filter((s) => s.id !== subCategoryId));
    logActivity('Catalogue', 'Suppression', `Sous-catégorie supprimée : ${subCategory?.name ?? subCategoryId}`, 'Company');
  };

  const handleCreateExpense = (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
    logActivity('Dépenses', 'Création', `Dépense enregistrée : ${expense.amount.toFixed(2)} DT (${expense.date})`, 'Company');
  };

  const handleUpdateExpense = (expense: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    logActivity('Dépenses', 'Modification', `Dépense modifiée : ${expense.amount.toFixed(2)} DT (${expense.date})`, 'Company');
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = expenses.find((e) => e.id === expenseId);
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    logActivity('Dépenses', 'Suppression', `Dépense supprimée : ${expense ? `${expense.amount.toFixed(2)} DT (${expense.date})` : expenseId}`, 'Company');
  };

  const handleUpdateExpenseStatus = (expenseId: string, status: ExpenseStatus) => {
    setExpenses((prev) => {
      const expense = prev.find((e) => e.id === expenseId);
      if (!expense || expense.status === status) return prev;
      logActivity('Dépenses', 'Modification', `Statut de « ${expense.title} » changé : ${expense.status} → ${status}`, 'Company');
      return prev.map((e) => (e.id === expenseId ? { ...e, status } : e));
    });
  };

  const handleCreateExpenseCategory = (category: ExpenseCategory) => {
    setExpenseCategories((prev) => [...prev, category]);
    logActivity('Dépenses', 'Création', `Catégorie de dépense créée : ${category.name}`, 'Company');
  };

  const handleRenameExpenseCategory = (categoryId: string, newName: string) => {
    setExpenseCategories((prev) => {
      const category = prev.find((c) => c.id === categoryId);
      if (!category) return prev;
      logActivity('Dépenses', 'Modification', `Catégorie de dépense renommée : « ${category.name} » → « ${newName} »`, 'Company');
      return prev.map((c) => (c.id === categoryId ? { ...c, name: newName } : c));
    });
  };

  const handleDeleteExpenseCategory = (categoryId: string) => {
    const category = expenseCategories.find((c) => c.id === categoryId);
    setExpenseCategories((prev) => prev.filter((c) => c.id !== categoryId));
    logActivity('Dépenses', 'Suppression', `Catégorie de dépense supprimée : ${category?.name ?? categoryId}`, 'Company');
  };

  const handleCreatePurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders((prev) => [...prev, order]);
    logActivity('Achats', 'Création', `Achat créé : ${order.orderNumber}`, order.createdBy);
  };

  const handleUpdatePurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    logActivity('Achats', 'Modification', `Achat modifié : ${order.orderNumber}`, order.createdBy);
  };

  const handleDeletePurchaseOrder = (orderId: string) => {
    const order = purchaseOrders.find((o) => o.id === orderId);
    setPurchaseOrders((prev) => prev.filter((o) => o.id !== orderId));
    logActivity('Achats', 'Suppression', `Achat supprimé : ${order?.orderNumber ?? orderId}`, 'Company');
  };

  const handleUpdatePurchaseOrderStatus = (orderId: string, status: PurchaseOrderStatus) => {
    setPurchaseOrders((prev) => {
      const order = prev.find((o) => o.id === orderId);
      if (!order || order.status === status) return prev;
      logActivity('Achats', 'Modification', `Statut de « ${order.orderNumber} » changé : ${order.status} → ${status}`, 'Company');
      return prev.map((o) => (o.id === orderId ? { ...o, status } : o));
    });
  };

  const handleCreateSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [...prev, supplier]);
    logActivity('Achats', 'Création', `Fournisseur créé : ${supplier.name}`, 'Company');
  };

  const handleUpdateSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
    logActivity('Achats', 'Modification', `Fournisseur modifié : ${supplier.name}`, 'Company');
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    logActivity('Achats', 'Suppression', `Fournisseur supprimé : ${supplier?.name ?? supplierId}`, 'Company');
  };

  // A validated reception posts stock entries through the SAME ledger pipeline as every manual
  // stock movement (handlePostStockEntries), so a purchase reception is not a second way to
  // change stock quantities — just another source feeding the one existing mechanism.
  const handleReceivePurchaseOrder = (order: PurchaseOrder, reception: PurchaseReception) => {
    const entries = buildReceptionLedgerEntries(order, reception, stockProducts);
    if (entries.length > 0) handlePostStockEntries(entries);
    setPurchaseReceptions((prev) => [reception, ...prev]);
    setPurchaseOrders((prev) => prev.map((o) => (o.id === order.id ? applyReceptionToOrder(o, reception) : o)));
    logActivity('Achats', 'Réception', `Réception enregistrée pour ${order.orderNumber} (${entries.length} article(s))`, reception.performedBy);
  };

  const handleCreateInvoice = (invoice: SupplierInvoice) => {
    setSupplierInvoices((prev) => [...prev, invoice]);
    logActivity('Achats', 'Création', `Facture fournisseur créée : ${invoice.invoiceNumber}`, 'Company');
  };

  const handleUpdateInvoice = (invoice: SupplierInvoice) => {
    setSupplierInvoices((prev) => prev.map((i) => (i.id === invoice.id ? invoice : i)));
    logActivity('Achats', 'Modification', `Facture fournisseur modifiée : ${invoice.invoiceNumber}`, 'Company');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const invoice = supplierInvoices.find((i) => i.id === invoiceId);
    setSupplierInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
    logActivity('Achats', 'Suppression', `Facture fournisseur supprimée : ${invoice?.invoiceNumber ?? invoiceId}`, 'Company');
  };

  const handleRecordInvoicePayment = (invoiceId: string, amountAdded: number) => {
    setSupplierInvoices((prev) => {
      const invoice = prev.find((i) => i.id === invoiceId);
      if (!invoice) return prev;
      logActivity('Achats', 'Paiement', `Paiement enregistré sur la facture ${invoice.invoiceNumber} : +${amountAdded.toFixed(2)} DT`, 'Company');
      return prev.map((i) => (i.id === invoiceId ? { ...i, amountPaid: i.amountPaid + amountAdded } : i));
    });
  };

  // --- Gestion du personnel: Employés ---
  const handleCreateEmployee = (employee: Employee) => {
    setHrEmployees((prev) => [...prev, employee]);
    logActivity('RH', 'Création', `Employé ajouté : ${getEmployeeFullName(employee)}`, 'Company');
  };

  const handleUpdateEmployee = (employee: Employee) => {
    setHrEmployees((prev) => prev.map((e) => (e.id === employee.id ? employee : e)));
    logActivity('RH', 'Modification', `Employé modifié : ${getEmployeeFullName(employee)}`, 'Company');
  };

  // Deleting an employee also removes their planning/attendance and financial history so no
  // orphaned record can reference a nonexistent employee elsewhere in the module.
  const handleDeleteEmployee = (employeeId: string) => {
    const employee = hrEmployees.find((e) => e.id === employeeId);
    setHrEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    setHrDayRecords((prev) => prev.filter((r) => r.employeeId !== employeeId));
    setHrRecurringPlans((prev) => prev.filter((p) => p.employeeId !== employeeId));
    setHrFinancialRecords((prev) => prev.filter((r) => r.employeeId !== employeeId));
    logActivity('RH', 'Suppression', `Employé supprimé : ${employee ? getEmployeeFullName(employee) : employeeId}`, 'Company');
  };

  // --- Gestion du personnel: Shifts (exactly 2, enforced in hrModel's validation) ---
  const handleCreateShift = (shift: Shift) => {
    setHrShifts((prev) => [...prev, shift]);
    logActivity('RH', 'Création', `Shift créé : ${shift.name}`, 'Company');
  };

  const handleUpdateShift = (shift: Shift) => {
    setHrShifts((prev) => prev.map((s) => (s.id === shift.id ? shift : s)));
    logActivity('RH', 'Modification', `Shift modifié : ${shift.name}`, 'Company');
  };

  const handleDeleteShift = (shiftId: string) => {
    const shift = hrShifts.find((s) => s.id === shiftId);
    setHrShifts((prev) => prev.filter((s) => s.id !== shiftId));
    logActivity('RH', 'Suppression', `Shift supprimé : ${shift?.name ?? shiftId}`, 'Company');
  };

  // --- Gestion du personnel: Planning & Présence ---
  // Applies a weekly pattern over a period (one-time or recurring) as an upsert onto the existing
  // day records — buildDayRecordsFromPattern preserves the id of any day already recorded so this
  // never creates duplicate rows for the same employee/date.
  const handleSavePlanning = (params: { employeeId: string; startDate: string; endDate: string; weeklyPattern: WeeklyPattern; isRecurring: boolean }) => {
    let recurringPlanId: string | undefined;
    if (params.isRecurring) {
      const plan: RecurringPlan = {
        id: generateHrId('rp'),
        employeeId: params.employeeId,
        startDate: params.startDate,
        endDate: params.endDate,
        weeklyPattern: params.weeklyPattern,
        createdAt: new Date().toISOString(),
        createdBy: 'Company',
      };
      setHrRecurringPlans((prev) => [...prev, plan]);
      recurringPlanId = plan.id;
    }
    setHrDayRecords((prev) => {
      const generated = buildDayRecordsFromPattern(params.employeeId, params.weeklyPattern, params.startDate, params.endDate, 'Company', recurringPlanId, prev);
      const map = new Map(prev.map((r) => [r.id, r]));
      generated.forEach((r) => map.set(r.id, r));
      return Array.from(map.values());
    });
    const employee = hrEmployees.find((e) => e.id === params.employeeId);
    logActivity(
      'RH',
      'Planning',
      `Planning ${params.isRecurring ? 'récurrent' : 'ponctuel'} enregistré pour ${employee ? getEmployeeFullName(employee) : params.employeeId} (${params.startDate} → ${params.endDate})`,
      'Company'
    );
  };

  const handleSetAttendance = (params: { employeeId: string; date: string; status: AttendanceStatus; shiftIds: string[] }) => {
    setHrDayRecords((prev) => {
      const existing = findDayRecord(params.employeeId, params.date, prev);
      const record = buildManualDayRecord(existing, params.employeeId, params.date, params.status, params.shiftIds, 'Company');
      const map = new Map(prev.map((r) => [r.id, r]));
      map.set(record.id, record);
      return Array.from(map.values());
    });
    const employee = hrEmployees.find((e) => e.id === params.employeeId);
    logActivity('RH', 'Présence', `Présence mise à jour : ${employee ? getEmployeeFullName(employee) : params.employeeId} — ${params.date} → ${params.status}`, 'Company');
  };

  const handleDeleteDayRecord = (record: DayRecord, scope: 'day' | 'recurrence') => {
    const employee = hrEmployees.find((e) => e.id === record.employeeId);
    if (scope === 'recurrence' && record.recurringPlanId) {
      const planId = record.recurringPlanId;
      setHrRecurringPlans((prev) => prev.filter((p) => p.id !== planId));
      setHrDayRecords((prev) => prev.filter((r) => r.recurringPlanId !== planId));
      logActivity('RH', 'Suppression', `Récurrence de planning supprimée pour ${employee ? getEmployeeFullName(employee) : record.employeeId}`, 'Company');
    } else {
      setHrDayRecords((prev) => prev.filter((r) => r.id !== record.id));
      logActivity('RH', 'Suppression', `Jour de planning supprimé : ${employee ? getEmployeeFullName(employee) : record.employeeId} — ${record.date}`, 'Company');
    }
  };

  // --- Gestion du personnel: Suivi financier ---
  const handleCreateFinancialRecord = (record: FinancialRecord) => {
    setHrFinancialRecords((prev) => [...prev, record]);
    const employee = hrEmployees.find((e) => e.id === record.employeeId);
    logActivity('RH', 'Création', `Suivi financier ajouté : ${employee ? getEmployeeFullName(employee) : record.employeeId}`, 'Company');
  };

  const handleUpdateFinancialRecord = (record: FinancialRecord) => {
    setHrFinancialRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
    const employee = hrEmployees.find((e) => e.id === record.employeeId);
    logActivity('RH', 'Modification', `Suivi financier modifié : ${employee ? getEmployeeFullName(employee) : record.employeeId}`, 'Company');
  };

  const handleDeleteFinancialRecord = (recordId: string) => {
    const record = hrFinancialRecords.find((r) => r.id === recordId);
    setHrFinancialRecords((prev) => prev.filter((r) => r.id !== recordId));
    const employee = record ? hrEmployees.find((e) => e.id === record.employeeId) : undefined;
    logActivity('RH', 'Suppression', `Suivi financier supprimé : ${employee ? getEmployeeFullName(employee) : recordId}`, 'Company');
  };

  // --- Notifications & Alertes ---
  // Alerts are always recomputed live from real state (see alertsModel.ts); only the "Traité"
  // flag needs its own persisted store, keyed by each alert's deterministic id.
  const handleMarkAlertTreated = (alert: OperationalAlert) => {
    setTreatedAlerts((prev) => ({ ...prev, [alert.id]: { treatedAt: new Date().toISOString(), treatedBy: 'Company' } }));
    logActivity('Alertes', 'Traitement', `Alerte marquée comme traitée : ${alert.title}`, 'Company');
  };

  const handleMarkAlertUnread = (alertId: string) => {
    setTreatedAlerts((prev) => {
      if (!(alertId in prev)) return prev;
      const next = { ...prev };
      delete next[alertId];
      return next;
    });
    logActivity('Alertes', 'Modification', `Alerte remise en non traité : ${alertId}`, 'Company');
  };

  const handleNavigateFromAlert = (tab: string, subItem?: string) => {
    setActiveTab(tab);
    setActiveSubItem(subItem ?? '');
  };

  const handleSaveManualSalesTickets = (newTransactions: SaleTransaction[]) => {
    setSalesTransactions((prev) => [...newTransactions, ...prev]);
    const user = newTransactions[0]?.barista ?? 'Company';
    logActivity('Ventes', 'Ajout manuel', `${newTransactions.length} ticket(s) enregistrés manuellement`, user);
  };

  const handleSaveImportedSalesTickets = (newTransactions: SaleTransaction[]) => {
    setSalesTransactions((prev) => [...newTransactions, ...prev]);
    const distinctBaristas = Array.from(new Set(newTransactions.map((t) => t.barista)));
    const user = distinctBaristas.length === 1 ? distinctBaristas[0] : distinctBaristas.join(', ') || 'Company';
    logActivity('Ventes', 'Import', `Import Excel/CSV — ${newTransactions.length} ticket(s) importés`, user);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'notifications':
        setActiveTab('notifications');
        break;
      case 'pos':
        setActiveTab('pos');
        break;
      case 'products':
        setModalType('products');
        break;
      case 'clients':
        setModalType('clients');
        break;
      case 'reports':
        setActiveTab('reports');
        break;
      default:
        break;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-[#0E1524] text-gray-100' : 'bg-[#F9FAFB] text-gray-800'}`}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeSubItem={activeSubItem}
          setActiveSubItem={setActiveSubItem}
          onUpgradeClick={() => setModalType('upgrade')}
          isDarkMode={isDarkMode}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            activeTab={activeTab}
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab !== 'sales') setActiveSubItem('');
            }}
          />

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1550px] w-full mx-auto">
            {activeTab === 'notifications' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <NotificationsPage
                  isDarkMode={isDarkMode}
                  stockProducts={stockProducts}
                  stockLots={stockLots}
                  stockLedger={stockLedger}
                  articles={catalogArticles}
                  subRecipes={subRecipes}
                  suppliers={suppliers}
                  invoices={supplierInvoices}
                  treatedAlerts={treatedAlerts}
                  onNavigate={handleNavigateFromAlert}
                  onMarkAlertTreated={handleMarkAlertTreated}
                  onMarkAlertUnread={handleMarkAlertUnread}
                />
              </Suspense>
            ) : activeTab === 'sales' ? (
              <SalesPage
                onNavigateToDashboard={() => {
                  setActiveTab('dashboard');
                  setActiveSubItem('');
                }}
                isDarkMode={isDarkMode}
                transactions={salesTransactions}
              />
            ) : activeTab === 'sales_mgmt' && activeSubItem === 'sales_manual_add' ? (
              <ManualSalesEntryPage
                isDarkMode={isDarkMode}
                onNavigateToDashboard={() => {
                  setActiveTab('dashboard');
                  setActiveSubItem('');
                }}
                onNavigateToSalesList={() => {
                  setActiveTab('sales');
                  setActiveSubItem('sales');
                }}
                onSaveTickets={handleSaveManualSalesTickets}
              />
            ) : activeTab === 'sales_mgmt' && activeSubItem === 'sales_import' ? (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Chargement de l'import Excel/CSV…</span>
                  </div>
                }
              >
                <ImportSalesPage
                  isDarkMode={isDarkMode}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToSalesList={() => {
                    setActiveTab('sales');
                    setActiveSubItem('sales');
                  }}
                  onSaveTickets={handleSaveImportedSalesTickets}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_overview' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockPage
                  isDarkMode={isDarkMode}
                  products={stockProducts}
                  lots={stockLots}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMovements={() => setActiveSubItem('stock_movements')}
                  onNavigateToInventory={() => setActiveSubItem('stock_inventory')}
                  onNavigateToLosses={() => setActiveSubItem('stock_losses')}
                  onNavigateToLots={() => setActiveSubItem('stock_lots')}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_movements' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockMovementsPage
                  isDarkMode={isDarkMode}
                  products={stockProducts}
                  lots={stockLots}
                  ledger={stockLedger}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToStock={() => setActiveSubItem('stock_overview')}
                  onPostEntries={handlePostStockEntries}
                  onCancelEntry={handleCancelStockEntry}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_inventory' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockInventoryPage
                  isDarkMode={isDarkMode}
                  products={stockProducts}
                  ledger={stockLedger}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToStock={() => setActiveSubItem('stock_overview')}
                  onPostEntries={handlePostStockEntries}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_losses' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockLossesPage
                  isDarkMode={isDarkMode}
                  products={stockProducts}
                  lots={stockLots}
                  ledger={stockLedger}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToStock={() => setActiveSubItem('stock_overview')}
                  onPostEntries={handlePostStockEntries}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_lots' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockLotsPage
                  isDarkMode={isDarkMode}
                  products={stockProducts}
                  lots={stockLots}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToStock={() => setActiveSubItem('stock_overview')}
                  onNavigateToMovements={() => setActiveSubItem('stock_movements')}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_units' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockUnitsPage
                  isDarkMode={isDarkMode}
                  units={stockUnits}
                  products={stockProducts}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToStock={() => setActiveSubItem('stock_overview')}
                  onCreateUnit={handleCreateStockUnit}
                  onRenameUnit={handleRenameStockUnit}
                />
              </Suspense>
            ) : activeTab === 'stock' && activeSubItem === 'stock_import' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockImportPage
                  isDarkMode={isDarkMode}
                  products={stockProducts}
                  units={stockUnits}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToStock={() => setActiveSubItem('stock_overview')}
                  onPostImportedStock={handlePostImportedStock}
                />
              </Suspense>
            ) : activeTab === 'products_recipes_mgmt' && activeSubItem === 'prm_products' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ProductsPage
                  isDarkMode={isDarkMode}
                  articles={catalogArticles}
                  categories={productCategories}
                  subCategories={productSubCategories}
                  ingredients={stockProducts}
                  subRecipes={subRecipes}
                  transactions={salesTransactions}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToAddProduct={() => {
                    setEditingProductId(null);
                    setActiveSubItem('prm_add_product');
                  }}
                  onNavigateToEditProduct={(articleId) => {
                    setEditingProductId(articleId);
                    setActiveSubItem('prm_add_product');
                  }}
                  onNavigateToCatalog={() => setActiveSubItem('prm_catalog')}
                  onNavigateToImport={() => setActiveSubItem('prm_import')}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleAvailability={handleToggleProductAvailability}
                />
              </Suspense>
            ) : activeTab === 'products_recipes_mgmt' && activeSubItem === 'prm_add_product' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ProductFormPage
                  isDarkMode={isDarkMode}
                  articles={catalogArticles}
                  categories={productCategories}
                  subCategories={productSubCategories}
                  ingredients={stockProducts}
                  units={stockUnits}
                  subRecipes={subRecipes}
                  editingArticleId={editingProductId}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToProducts={() => {
                    setEditingProductId(null);
                    setActiveSubItem('prm_products');
                  }}
                  onCreateProduct={handleCreateProduct}
                  onUpdateProduct={handleUpdateProduct}
                />
              </Suspense>
            ) : activeTab === 'products_recipes_mgmt' && activeSubItem === 'prm_subrecipes' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <SubRecipesPage
                  isDarkMode={isDarkMode}
                  subRecipes={subRecipes}
                  ingredients={stockProducts}
                  units={stockUnits}
                  articles={catalogArticles}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToProducts={() => setActiveSubItem('prm_products')}
                  onCreateSubRecipe={handleCreateSubRecipe}
                  onUpdateSubRecipe={handleUpdateSubRecipe}
                  onDeleteSubRecipe={handleDeleteSubRecipe}
                />
              </Suspense>
            ) : activeTab === 'products_recipes_mgmt' && activeSubItem === 'prm_catalog' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ProductCatalogPage
                  isDarkMode={isDarkMode}
                  categories={productCategories}
                  subCategories={productSubCategories}
                  articles={catalogArticles}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToProducts={() => setActiveSubItem('prm_products')}
                  onCreateCategory={handleCreateProductCategory}
                  onRenameCategory={handleRenameProductCategory}
                  onDeleteCategory={handleDeleteProductCategory}
                  onCreateSubCategory={handleCreateProductSubCategory}
                  onRenameSubCategory={handleRenameProductSubCategory}
                  onDeleteSubCategory={handleDeleteProductSubCategory}
                />
              </Suspense>
            ) : activeTab === 'products_recipes_mgmt' && activeSubItem === 'prm_import' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ProductsImportPage
                  isDarkMode={isDarkMode}
                  categories={productCategories}
                  subCategories={productSubCategories}
                  ingredients={stockProducts}
                  units={stockUnits}
                  subRecipes={subRecipes}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToProducts={() => setActiveSubItem('prm_products')}
                  onImportProducts={handleImportProducts}
                />
              </Suspense>
            ) : activeTab === 'expenses_mgmt' && activeSubItem === 'expenses' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ExpensesPage
                  isDarkMode={isDarkMode}
                  expenses={expenses}
                  categories={expenseCategories}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToCategories={() => setActiveSubItem('expenses_categories')}
                  onCreateExpense={handleCreateExpense}
                  onUpdateExpense={handleUpdateExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onUpdateExpenseStatus={handleUpdateExpenseStatus}
                />
              </Suspense>
            ) : activeTab === 'expenses_mgmt' && activeSubItem === 'expenses_categories' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ExpenseCategoriesPage
                  isDarkMode={isDarkMode}
                  categories={expenseCategories}
                  expenses={expenses}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToExpenses={() => setActiveSubItem('expenses')}
                  onCreateCategory={handleCreateExpenseCategory}
                  onRenameCategory={handleRenameExpenseCategory}
                  onDeleteCategory={handleDeleteExpenseCategory}
                />
              </Suspense>
            ) : activeTab === 'purchases_mgmt' && activeSubItem === 'purchases_acquisitions' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <PurchasesPage
                  isDarkMode={isDarkMode}
                  orders={purchaseOrders}
                  suppliers={suppliers}
                  receptions={purchaseReceptions}
                  invoices={supplierInvoices}
                  products={stockProducts}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onCreateOrder={handleCreatePurchaseOrder}
                  onUpdateOrder={handleUpdatePurchaseOrder}
                  onDeleteOrder={handleDeletePurchaseOrder}
                  onUpdateOrderStatus={handleUpdatePurchaseOrderStatus}
                  onCreateSupplier={handleCreateSupplier}
                  onReceivePurchaseOrder={handleReceivePurchaseOrder}
                  onCreateInvoice={handleCreateInvoice}
                  onRecordInvoicePayment={handleRecordInvoicePayment}
                />
              </Suspense>
            ) : activeTab === 'purchases_mgmt' && activeSubItem === 'purchases_suppliers' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <SuppliersPage
                  isDarkMode={isDarkMode}
                  suppliers={suppliers}
                  orders={purchaseOrders}
                  products={stockProducts}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToPurchases={() => setActiveSubItem('purchases_acquisitions')}
                  onNavigateToInvoices={() => setActiveSubItem('purchases_invoices')}
                  onCreateSupplier={handleCreateSupplier}
                  onUpdateSupplier={handleUpdateSupplier}
                  onDeleteSupplier={handleDeleteSupplier}
                />
              </Suspense>
            ) : activeTab === 'purchases_mgmt' && activeSubItem === 'purchases_invoices' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <InvoicesPage
                  isDarkMode={isDarkMode}
                  invoices={supplierInvoices}
                  suppliers={suppliers}
                  orders={purchaseOrders}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToPurchases={() => setActiveSubItem('purchases_acquisitions')}
                  onNavigateToSuppliers={() => setActiveSubItem('purchases_suppliers')}
                  onCreateInvoice={handleCreateInvoice}
                  onUpdateInvoice={handleUpdateInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onRecordInvoicePayment={handleRecordInvoicePayment}
                />
              </Suspense>
            ) : activeTab === 'staff_mgmt' && activeSubItem === 'staff_employees' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <EmployeesPage
                  isDarkMode={isDarkMode}
                  employees={hrEmployees}
                  dayRecords={hrDayRecords}
                  financialRecords={hrFinancialRecords}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToPlanning={() => setActiveSubItem('staff_schedule')}
                  onNavigateToFinancials={() => setActiveSubItem('staff_finance')}
                  onCreateEmployee={handleCreateEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                />
              </Suspense>
            ) : activeTab === 'staff_mgmt' && activeSubItem === 'staff_schedule' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <PlanningPage
                  isDarkMode={isDarkMode}
                  employees={hrEmployees}
                  shifts={hrShifts}
                  dayRecords={hrDayRecords}
                  recurringPlans={hrRecurringPlans}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToEmployees={() => setActiveSubItem('staff_employees')}
                  onNavigateToFinancials={() => setActiveSubItem('staff_finance')}
                  onCreateShift={handleCreateShift}
                  onUpdateShift={handleUpdateShift}
                  onDeleteShift={handleDeleteShift}
                  onSavePlanning={handleSavePlanning}
                  onSetAttendance={handleSetAttendance}
                  onDeleteDayRecord={handleDeleteDayRecord}
                />
              </Suspense>
            ) : activeTab === 'staff_mgmt' && activeSubItem === 'staff_finance' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <FinancialsPage
                  isDarkMode={isDarkMode}
                  employees={hrEmployees}
                  financialRecords={hrFinancialRecords}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToEmployees={() => setActiveSubItem('staff_employees')}
                  onNavigateToPlanning={() => setActiveSubItem('staff_schedule')}
                  onCreateFinancialRecord={handleCreateFinancialRecord}
                  onUpdateFinancialRecord={handleUpdateFinancialRecord}
                  onDeleteFinancialRecord={handleDeleteFinancialRecord}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_monthly' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <MonthlyReportPage
                  isDarkMode={isDarkMode}
                  transactions={salesTransactions}
                  articles={catalogArticles}
                  stockProducts={stockProducts}
                  subRecipes={subRecipes}
                  stockLedger={stockLedger}
                  expenses={expenses}
                  expenseCategories={expenseCategories}
                  orders={purchaseOrders}
                  suppliers={suppliers}
                  receptions={purchaseReceptions}
                  invoices={supplierInvoices}
                  employees={hrEmployees}
                  financialRecords={hrFinancialRecords}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_sales' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <SalesReportPage
                  isDarkMode={isDarkMode}
                  transactions={salesTransactions}
                  articles={catalogArticles}
                  stockProducts={stockProducts}
                  subRecipes={subRecipes}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMonthly={() => setActiveSubItem('report_monthly')}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_purchases' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <PurchasesReportPage
                  isDarkMode={isDarkMode}
                  orders={purchaseOrders}
                  suppliers={suppliers}
                  receptions={purchaseReceptions}
                  invoices={supplierInvoices}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMonthly={() => setActiveSubItem('report_monthly')}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_expenses' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ExpensesReportPage
                  isDarkMode={isDarkMode}
                  expenses={expenses}
                  categories={expenseCategories}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMonthly={() => setActiveSubItem('report_monthly')}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_stocks' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <StockReportPage
                  isDarkMode={isDarkMode}
                  stockProducts={stockProducts}
                  stockLedger={stockLedger}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMonthly={() => setActiveSubItem('report_monthly')}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_finance' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <FinancialReportPage
                  isDarkMode={isDarkMode}
                  transactions={salesTransactions}
                  articles={catalogArticles}
                  stockProducts={stockProducts}
                  subRecipes={subRecipes}
                  orders={purchaseOrders}
                  expenses={expenses}
                  financialRecords={hrFinancialRecords}
                  employees={hrEmployees}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMonthly={() => setActiveSubItem('report_monthly')}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_tax' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <TaxReportPage
                  isDarkMode={isDarkMode}
                  transactions={salesTransactions}
                  invoices={supplierInvoices}
                  suppliers={suppliers}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                  onNavigateToMonthly={() => setActiveSubItem('report_monthly')}
                />
              </Suspense>
            ) : activeTab === 'reports_mgmt' && activeSubItem === 'report_export' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ExportDataPage
                  isDarkMode={isDarkMode}
                  transactions={salesTransactions}
                  articles={catalogArticles}
                  subRecipes={subRecipes}
                  stockProducts={stockProducts}
                  stockLedger={stockLedger}
                  stockLots={stockLots}
                  expenses={expenses}
                  expenseCategories={expenseCategories}
                  purchaseOrders={purchaseOrders}
                  suppliers={suppliers}
                  supplierInvoices={supplierInvoices}
                  employees={hrEmployees}
                  shifts={hrShifts}
                  dayRecords={hrDayRecords}
                  financialRecords={hrFinancialRecords}
                  activityLog={activityLog}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                />
              </Suspense>
            ) : activeTab === 'activity_log' ? (
              <Suspense fallback={<StockPageLoadingFallback />}>
                <ActivityLogPage
                  isDarkMode={isDarkMode}
                  entries={activityLog}
                  onNavigateToDashboard={() => {
                    setActiveTab('dashboard');
                    setActiveSubItem('');
                  }}
                />
              </Suspense>
            ) : (
              <>
                {/* Page Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Tableau de bord
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bienvenue dans l'espace de gestion et point de vente Café Noir.
                    </p>
                  </div>

                  {/* Action: Récupérer */}
                  <button
                    id="dashboard-refresh-button"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-70"
                  >
                    <RotateCw
                      size={14}
                      className={`text-gray-500 dark:text-gray-400 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`}
                    />
                    <span>Récupérer</span>
                  </button>
                </div>

                {/* Hero Dark Greeting Banner */}
                <HeroBanner onActionClick={handleQuickAction} />

                {/* Section Analyse de gestion (Placed BEFORE the KPI cards as requested) */}
                <AnalysisFilterBar
                  activePeriod={activePeriod}
                  onPeriodChange={setActivePeriod}
                  compareWithPrevious={compareWithPrevious}
                  onToggleCompare={() => setCompareWithPrevious(!compareWithPrevious)}
                  customStartDate={customRange.start}
                  customEndDate={customRange.end}
                  onCustomDateChange={(start, end) => setCustomRange({ start, end })}
                />

                {/* KPI Cards Section: 5 Classic Cards + "Voir plus d'indicateurs" button for Coût du personnel, Valeur du stock, Nombre de tickets, Marge estimée */}
                <MetricCards
                  activePeriod={activePeriod}
                  compareWithPrevious={compareWithPrevious}
                />

                {/* Heatmap (Ventes par jour - Responsive Calendar Heatmap) & Plan Overview (Objectifs & Répartition) Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  <div className="lg:col-span-8">
                    <ActivityHeatmap />
                  </div>
                  <div className="lg:col-span-4">
                    <PlanOverview activePeriod={activePeriod} />
                  </div>
                </div>

                {/* Sales Chart: Ventes par jours with Jours/Mois/Année filters & period comparison */}
                <SalesChart compareWithPrevious={compareWithPrevious} />

                {/* Purchases Chart: Achats par jours with Jours/Mois/Année filters & period comparison */}
                <PurchasesChart compareWithPrevious={compareWithPrevious} />

                {/* Top/Least Products, Top CA/Margin Products, Low Stock (Top 5) & Primary Alerts */}
                <ProductsAndStock
                  onViewAllProducts={() => setModalType('products')}
                  onRestockClick={() => setModalType('restock')}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Action Modals */}
      <ActionModals type={modalType} onClose={() => setModalType(null)} />

      {/* Toast Notification on Refresh */}
      {showRefreshToast && (
        <div
          id="refresh-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-700 text-xs animate-in slide-in-from-bottom-2"
        >
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>Données actualisées avec succès !</span>
        </div>
      )}
    </div>
  );
}
