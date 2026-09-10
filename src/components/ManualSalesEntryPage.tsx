import React, { useMemo, useState } from 'react';
import {
  Receipt,
  Coffee,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Banknote,
  CreditCard,
  Ticket,
  Utensils,
  ShoppingBag,
  ChevronDown,
  Users,
  ClipboardList,
  RotateCcw,
} from 'lucide-react';
import { SaleTransaction, ServiceType, PaymentMethod } from '../data/salesTransactions';
import {
  CatalogArticle,
  CatalogExtra,
  ARTICLE_CATEGORIES_ORDER,
  getArticleById,
  getExtraById,
  getVariantGroupForCategory,
  getVariantOption,
} from '../data/manualSalesCatalog';
import {
  DraftTicket,
  DraftTicketItem,
  ManualSalesFormState,
  SalesCatalogContext,
  createEmptyItem,
  createEmptyTicket,
  createEmptyForm,
  computeItemLineTotal,
  computeTicketTotal,
  computeGrandTotal,
  validateManualSalesForm,
  buildSaleTransactionsFromForm,
} from '../data/salesEntryModel';

interface ManualSalesEntryPageProps {
  articles: CatalogArticle[];
  extras: CatalogExtra[];
  employees: string[];
  shifts: string[];
  onNavigateToDashboard: () => void;
  onNavigateToSalesList: () => void;
  onSaveTickets: (transactions: SaleTransaction[]) => void;
  isDarkMode?: boolean;
}

type Step = 'form' | 'preview' | 'success';

const inputBaseClass =
  'w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 transition';
const inputValidClass = 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500';
const inputErrorClass = 'border-red-400 dark:border-red-500/70 focus:border-red-500 focus:ring-red-500';
const labelClass = 'text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block';
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition active:scale-98 cursor-pointer';

export const ManualSalesEntryPage: React.FC<ManualSalesEntryPageProps> = ({
  articles,
  extras,
  employees,
  shifts,
  onNavigateToDashboard,
  onNavigateToSalesList,
  onSaveTickets,
}) => {
  const catalog: SalesCatalogContext = { articles, extras, employees, shifts };
  const [form, setForm] = useState<ManualSalesFormState>(() => createEmptyForm());
  const [step, setStep] = useState<Step>('form');
  const [hasAttemptedVerify, setHasAttemptedVerify] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [expandedExtras, setExpandedExtras] = useState<Set<string>>(new Set());

  const issues = useMemo(() => validateManualSalesForm(form), [form]);
  const issuesByKey = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach((issue) => {
      if (!map.has(issue.fieldKey)) map.set(issue.fieldKey, issue.message);
    });
    return map;
  }, [issues]);

  const showErrors = hasAttemptedVerify;
  const grandTotal = useMemo(() => computeGrandTotal(form, catalog), [form, catalog]);
  const totalArticlesCount = useMemo(
    () => form.tickets.reduce((sum, t) => sum + t.items.reduce((s, it) => s + (it.articleId ? it.qty : 0), 0), 0),
    [form]
  );

  const hasAnyData =
    Boolean(form.shift) ||
    Boolean(form.employee) ||
    form.tickets.some(
      (t) => t.items.some((it) => it.articleId) || t.tableNumber.trim() || t.counterLabel !== 'Comptoir Express'
    );

  // --- Mutators (all immutable updates against the single `form` state) ---

  const updateGeneral = (patch: Partial<Pick<ManualSalesFormState, 'date' | 'shift' | 'employee'>>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const addTicket = () => {
    setForm((prev) => ({ ...prev, tickets: [...prev.tickets, createEmptyTicket()] }));
  };

  const removeTicket = (ticketId: string) => {
    setForm((prev) => ({ ...prev, tickets: prev.tickets.filter((t) => t.rowId !== ticketId) }));
  };

  const updateTicket = (ticketId: string, patch: Partial<DraftTicket>) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.rowId === ticketId ? { ...t, ...patch } : t)),
    }));
  };

  const addItem = (ticketId: string) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.rowId === ticketId ? { ...t, items: [...t.items, createEmptyItem()] } : t)),
    }));
  };

  const removeItem = (ticketId: string, itemId: string) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) =>
        t.rowId === ticketId ? { ...t, items: t.items.filter((it) => it.rowId !== itemId) } : t
      ),
    }));
  };

  const updateItem = (ticketId: string, itemId: string, patch: Partial<DraftTicketItem>) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => {
        if (t.rowId !== ticketId) return t;
        return {
          ...t,
          items: t.items.map((it) => {
            if (it.rowId !== itemId) return it;
            const next = { ...it, ...patch };
            if (patch.articleId !== undefined && patch.articleId !== it.articleId) {
              next.variantOptionId = '';
            }
            return next;
          }),
        };
      }),
    }));
  };

  const toggleItemExtra = (ticketId: string, itemId: string, extraId: string) => {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => {
        if (t.rowId !== ticketId) return t;
        return {
          ...t,
          items: t.items.map((it) => {
            if (it.rowId !== itemId) return it;
            const has = it.extraIds.includes(extraId);
            return { ...it, extraIds: has ? it.extraIds.filter((id) => id !== extraId) : [...it.extraIds, extraId] };
          }),
        };
      }),
    }));
  };

  const toggleExtrasPanel = (itemId: string) => {
    setExpandedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleVerify = () => {
    setHasAttemptedVerify(true);
    if (issues.length === 0) {
      setStep('preview');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const handleConfirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const newTransactions = buildSaleTransactionsFromForm(form, catalog);
      await onSaveTickets(newTransactions);
      setSavedCount(newTransactions.length);
      setStep('success');
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (hasAnyData && !window.confirm('Voulez-vous réinitialiser la saisie ? Toutes les données non enregistrées seront perdues.')) {
      return;
    }
    setForm(createEmptyForm());
    setHasAttemptedVerify(false);
  };

  const handleCancel = () => {
    if (hasAnyData && !window.confirm('Voulez-vous quitter la saisie manuelle ? Les données non enregistrées seront perdues.')) {
      return;
    }
    onNavigateToSalesList();
  };

  const handleAddMore = () => {
    setForm(createEmptyForm());
    setHasAttemptedVerify(false);
    setSaveError(null);
    setStep('form');
  };

  const getServiceBadgeClass = (type: ServiceType) =>
    type === 'Sur place'
      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
      : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/70';

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'Espèces':
        return <Banknote size={12} className="text-emerald-500" />;
      case 'Carte bancaire':
        return <CreditCard size={12} className="text-blue-500" />;
      case 'Ticket resto':
        return <Ticket size={12} className="text-amber-500" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>Ajout manuel des ventes</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Café & Caisse
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Saisissez un ou plusieurs tickets qui n'ont pas été enregistrés automatiquement.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onNavigateToSalesList}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition active:scale-98 cursor-pointer"
          >
            <Receipt size={14} className="text-gray-500 dark:text-gray-400" />
            <span>Voir les ventes</span>
          </button>
          <button
            onClick={onNavigateToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition active:scale-98 cursor-pointer"
          >
            <span>Tableau de bord</span>
          </button>
        </div>
      </div>

      {step === 'success' ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={30} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ventes enregistrées avec succès</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
            {savedCount} {savedCount > 1 ? 'tickets ont été ajoutés' : 'ticket a été ajouté'} à l'historique des
            ventes Café Noir.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button onClick={handleAddMore} className={secondaryButtonClass}>
              <Plus size={14} />
              <span>Ajouter d'autres ventes</span>
            </button>
            <button onClick={onNavigateToSalesList} className={primaryButtonClass}>
              <Receipt size={14} />
              <span>Voir les ventes</span>
            </button>
          </div>
        </div>
      ) : step === 'preview' ? (
        <>
          {/* Preview banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Vérifiez les informations avant confirmation
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                Aucune vente n'est encore enregistrée. Contrôlez les données ci-dessous, puis confirmez pour les
                enregistrer définitivement.
              </p>
            </div>
          </div>

          {/* General info recap */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-semibold block mb-0.5">Date</span>
                <span className="font-bold text-gray-900 dark:text-white">{form.date}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block mb-0.5">Shift</span>
                <span className="font-bold text-gray-900 dark:text-white">{form.shift}</span>
              </div>
              <div>
                <span className="text-gray-400 font-semibold block mb-0.5">Employé</span>
                <span className="font-bold text-gray-900 dark:text-white">{form.employee}</span>
              </div>
            </div>
          </div>

          {/* Tickets recap */}
          <div className="space-y-3">
            {form.tickets.map((ticket, idx) => (
              <div
                key={ticket.rowId}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Receipt size={14} className="text-emerald-500" />
                    Ticket {idx + 1}
                  </h3>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {computeTicketTotal(ticket, catalog).toFixed(2)} <span className="text-[11px] text-gray-500">DT</span>
                  </span>
                </div>

                <div className="space-y-1.5">
                  {ticket.items.filter((it) => it.articleId).map((it) => {
                    const article = getArticleById(it.articleId, articles);
                    if (!article) return null;
                    const variant = it.variantOptionId ? getVariantOption(article.category, it.variantOptionId) : undefined;
                    const itemExtraNames = it.extraIds.map((id) => getExtraById(id, extras)?.name).filter(Boolean);
                    return (
                      <div key={it.rowId} className="flex justify-between items-start text-xs border-b border-dashed border-gray-100 dark:border-gray-800 pb-1.5 last:border-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">
                            {it.qty}x {article.name}
                          </p>
                          {(variant || itemExtraNames.length > 0) && (
                            <p className="text-[11px] text-gray-400">
                              {[variant?.label, ...itemExtraNames].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {computeItemLineTotal(it, catalog).toFixed(2)} DT
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getServiceBadgeClass(ticket.serviceType)}`}>
                    {ticket.serviceType === 'Sur place' ? <Utensils size={10} /> : <ShoppingBag size={10} />}
                    <span>{ticket.serviceType}</span>
                  </span>
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {ticket.serviceType === 'Sur place' ? `Table ${ticket.tableNumber}` : ticket.counterLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {getPaymentIcon(ticket.paymentMethod)}
                    <span>{ticket.paymentMethod}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {saveError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">Échec de l'enregistrement</p>
                <p className="text-xs text-red-600/90 dark:text-red-400/90">{saveError}</p>
                <p className="text-[11px] text-red-500/80 dark:text-red-400/70 mt-1">
                  Vos données sont conservées, vous pouvez réessayer sans tout ressaisir.
                </p>
              </div>
            </div>
          )}

          {/* Preview actions */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">{form.tickets.length}</span> tickets •{' '}
              <span className="font-bold text-gray-900 dark:text-white">{grandTotal.toFixed(2)} DT</span> au total
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={handleBackToForm} disabled={isSaving} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
                <ArrowLeft size={14} />
                <span>Modifier les ventes</span>
              </button>
              <button onClick={handleConfirmSave} disabled={isSaving} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>{isSaving ? 'Enregistrement…' : 'Confirmer et enregistrer'}</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Validation error summary */}
          {showErrors && issues.length > 0 && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  {issues.length} {issues.length > 1 ? 'erreurs à corriger' : 'erreur à corriger'}
                </p>
              </div>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                {issues.map((issue) => (
                  <li key={issue.fieldKey}>{issue.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: General info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-3.5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList size={16} className="text-emerald-500" />
              Informations générales de la vente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className={labelClass}>Date *</label>
                <div className="relative">
                  <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateGeneral({ date: e.target.value })}
                    className={`${inputBaseClass} pl-8 ${showErrors && issuesByKey.has('general:date') ? inputErrorClass : inputValidClass}`}
                  />
                </div>
                {showErrors && issuesByKey.get('general:date') && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {issuesByKey.get('general:date')}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Shift *</label>
                <div className="relative">
                  <select
                    value={form.shift}
                    onChange={(e) => updateGeneral({ shift: e.target.value })}
                    className={`${inputBaseClass} appearance-none pr-8 cursor-pointer ${showErrors && issuesByKey.has('general:shift') ? inputErrorClass : inputValidClass}`}
                  >
                    <option value="">Sélectionner un shift</option>
                    {shifts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {showErrors && issuesByKey.get('general:shift') && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {issuesByKey.get('general:shift')}
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Employé *</label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={form.employee}
                    onChange={(e) => updateGeneral({ employee: e.target.value })}
                    className={`${inputBaseClass} appearance-none pl-8 pr-8 cursor-pointer ${showErrors && issuesByKey.has('general:employee') ? inputErrorClass : inputValidClass}`}
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {showErrors && issuesByKey.get('general:employee') && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {issuesByKey.get('general:employee')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Tickets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt size={16} className="text-emerald-500" />
                Tickets
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {form.tickets.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className={secondaryButtonClass}>
                  <RotateCcw size={14} />
                  <span>Réinitialiser</span>
                </button>
                <button onClick={addTicket} className={primaryButtonClass}>
                  <Plus size={14} />
                  <span>Ajouter un ticket</span>
                </button>
              </div>
            </div>

            {showErrors && issuesByKey.get('general:tickets') && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={14} />
                {issuesByKey.get('general:tickets')}
              </div>
            )}

            {form.tickets.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-[#151D2A] border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-2">
                <Coffee className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Aucun ticket pour le moment</p>
                <button onClick={addTicket} className={`${primaryButtonClass} mx-auto`}>
                  <Plus size={14} />
                  <span>Ajouter un ticket</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[900px] overflow-y-auto custom-scrollbar pr-0.5">
                {form.tickets.map((ticket, ticketIdx) => {
                  const ticketTotal = computeTicketTotal(ticket, catalog);
                  return (
                    <div
                      key={ticket.rowId}
                      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-4"
                    >
                      {/* Ticket header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-xs font-black">
                            {ticketIdx + 1}
                          </span>
                          Ticket {ticketIdx + 1}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {ticketTotal.toFixed(2)} <span className="text-[11px] text-gray-500">DT</span>
                          </span>
                          <button
                            onClick={() => removeTicket(ticket.rowId)}
                            title="Supprimer ce ticket"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Articles */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Consommations & Articles
                          </span>
                        </div>

                        {showErrors && issuesByKey.get(`ticket:${ticket.rowId}:items`) && (
                          <p className="text-[11px] text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {issuesByKey.get(`ticket:${ticket.rowId}:items`)}
                          </p>
                        )}

                        <div className="space-y-2.5">
                          {ticket.items.map((item) => {
                            const article = getArticleById(item.articleId, articles);
                            const variantGroup = article ? getVariantGroupForCategory(article.category) : undefined;
                            const extrasOpen = expandedExtras.has(item.rowId);
                            const articleErrorKey = `item:${item.rowId}:article`;

                            return (
                              <div
                                key={item.rowId}
                                className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-3 space-y-2"
                              >
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="relative">
                                      <select
                                        value={item.articleId}
                                        onChange={(e) => updateItem(ticket.rowId, item.rowId, { articleId: e.target.value })}
                                        className={`${inputBaseClass} appearance-none pr-8 cursor-pointer ${
                                          showErrors && issuesByKey.has(articleErrorKey) ? inputErrorClass : inputValidClass
                                        }`}
                                      >
                                        <option value="">Choisir une consommation / un article</option>
                                        {ARTICLE_CATEGORIES_ORDER.map((cat) => (
                                          <optgroup key={cat} label={cat}>
                                            {articles.filter((a) => a.category === cat).map((a) => (
                                              <option key={a.id} value={a.id}>
                                                {a.name} — {a.price.toFixed(2)} DT
                                              </option>
                                            ))}
                                          </optgroup>
                                        ))}
                                      </select>
                                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                    {showErrors && issuesByKey.get(articleErrorKey) && (
                                      <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle size={11} /> {issuesByKey.get(articleErrorKey)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => updateItem(ticket.rowId, item.rowId, { qty: Math.max(1, item.qty - 1) })}
                                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                    >
                                      −
                                    </button>
                                    <input
                                      type="number"
                                      min={1}
                                      value={item.qty}
                                      onChange={(e) =>
                                        updateItem(ticket.rowId, item.rowId, { qty: Math.max(1, Number(e.target.value) || 1) })
                                      }
                                      className="w-11 text-center text-xs py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <button
                                      onClick={() => updateItem(ticket.rowId, item.rowId, { qty: item.qty + 1 })}
                                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                                    >
                                      +
                                    </button>

                                    <button
                                      onClick={() => removeItem(ticket.rowId, item.rowId)}
                                      title="Supprimer cet article"
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>

                                {/* Variant (only when relevant to the selected article's category) */}
                                {article && variantGroup && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                                      {variantGroup.label} :
                                    </span>
                                    <div className="relative flex-1 max-w-[220px]">
                                      <select
                                        value={item.variantOptionId}
                                        onChange={(e) => updateItem(ticket.rowId, item.rowId, { variantOptionId: e.target.value })}
                                        className={`${inputBaseClass} ${inputValidClass} appearance-none pr-8 py-1.5 cursor-pointer`}
                                      >
                                        <option value="">Standard (optionnel)</option>
                                        {variantGroup.options.map((opt) => (
                                          <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                            {opt.priceDelta ? ` (+${opt.priceDelta.toFixed(2)} DT)` : ''}
                                          </option>
                                        ))}
                                      </select>
                                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                  </div>
                                )}

                                {/* Extras */}
                                {article && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <button
                                        onClick={() => toggleExtrasPanel(item.rowId)}
                                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus size={11} />
                                        Extras {item.extraIds.length > 0 ? `(${item.extraIds.length})` : '(optionnel)'}
                                      </button>
                                      {item.extraIds.map((exId) => {
                                        const extra = getExtraById(exId, extras);
                                        if (!extra) return null;
                                        return (
                                          <span
                                            key={exId}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                                          >
                                            {extra.name}
                                            <button
                                              onClick={() => toggleItemExtra(ticket.rowId, item.rowId, exId)}
                                              className="hover:text-red-600 cursor-pointer"
                                            >
                                              <X size={10} />
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>

                                    {extrasOpen && (
                                      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                                        {extras.map((extra) => {
                                          const selected = item.extraIds.includes(extra.id);
                                          return (
                                            <button
                                              key={extra.id}
                                              onClick={() => toggleItemExtra(ticket.rowId, item.rowId, extra.id)}
                                              className={`px-2 py-1 rounded-md text-[10px] font-medium border transition cursor-pointer ${
                                                selected
                                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-300'
                                              }`}
                                            >
                                              {extra.name}
                                              {extra.price > 0 ? ` +${extra.price.toFixed(2)} DT` : ''}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => addItem(ticket.rowId)}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} />
                          Ajouter un article
                        </button>
                      </div>

                      {/* Service */}
                      <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 block pt-2">Service</span>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50/50 dark:bg-gray-800/50 w-fit">
                            {(['Sur place', 'À emporter'] as ServiceType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => updateTicket(ticket.rowId, { serviceType: type })}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer inline-flex items-center gap-1.5 ${
                                  ticket.serviceType === type
                                    ? 'bg-[#00A86B] text-white shadow-xs'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                                }`}
                              >
                                {type === 'Sur place' ? <Utensils size={12} /> : <ShoppingBag size={12} />}
                                {type}
                              </button>
                            ))}
                          </div>

                          <div className="flex-1 max-w-xs">
                            {ticket.serviceType === 'Sur place' ? (
                              <>
                                <input
                                  type="text"
                                  value={ticket.tableNumber}
                                  onChange={(e) => updateTicket(ticket.rowId, { tableNumber: e.target.value })}
                                  placeholder="Numéro de table (ex: 04)"
                                  className={`${inputBaseClass} ${
                                    showErrors && issuesByKey.has(`ticket:${ticket.rowId}:table`) ? inputErrorClass : inputValidClass
                                  }`}
                                />
                                {showErrors && issuesByKey.get(`ticket:${ticket.rowId}:table`) && (
                                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={11} /> {issuesByKey.get(`ticket:${ticket.rowId}:table`)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={ticket.counterLabel}
                                  onChange={(e) => updateTicket(ticket.rowId, { counterLabel: e.target.value })}
                                  placeholder="Comptoir (ex: Comptoir Express)"
                                  className={`${inputBaseClass} ${
                                    showErrors && issuesByKey.has(`ticket:${ticket.rowId}:counter`) ? inputErrorClass : inputValidClass
                                  }`}
                                />
                                {showErrors && issuesByKey.get(`ticket:${ticket.rowId}:counter`) && (
                                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={11} /> {issuesByKey.get(`ticket:${ticket.rowId}:counter`)}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {showErrors && issuesByKey.get(`ticket:${ticket.rowId}:service`) && (
                          <p className="text-[11px] text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {issuesByKey.get(`ticket:${ticket.rowId}:service`)}
                          </p>
                        )}
                      </div>

                      {/* Règlement */}
                      <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 block pt-2">Règlement</span>
                        <div className="flex flex-wrap items-center border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50/50 dark:bg-gray-800/50 w-fit gap-0.5">
                          {(['Espèces', 'Carte bancaire', 'Ticket resto'] as PaymentMethod[]).map((method) => (
                            <button
                              key={method}
                              onClick={() => updateTicket(ticket.rowId, { paymentMethod: method })}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer inline-flex items-center gap-1.5 ${
                                ticket.paymentMethod === method
                                  ? 'bg-[#00A86B] text-white shadow-xs'
                                  : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                              }`}
                            >
                              {getPaymentIcon(method)}
                              {method}
                            </button>
                          ))}
                        </div>
                        {showErrors && issuesByKey.get(`ticket:${ticket.rowId}:payment`) && (
                          <p className="text-[11px] text-red-500 flex items-center gap-1">
                            <AlertCircle size={11} /> {issuesByKey.get(`ticket:${ticket.rowId}:payment`)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contextual stats + Verify action */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-gray-800 w-full sm:w-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>
                <strong className="text-gray-800 dark:text-gray-200 font-semibold">{form.tickets.length}</strong> tickets •{' '}
                <strong className="text-gray-800 dark:text-gray-200 font-semibold">{totalArticlesCount}</strong> articles • Total estimé{' '}
                <strong className="text-gray-800 dark:text-gray-200 font-semibold">{grandTotal.toFixed(2)} DT</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={handleCancel} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
                <span>Annuler</span>
              </button>
              <button onClick={handleVerify} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
                <ShieldCheck size={14} />
                <span>Vérifier les ventes</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
