import React, { useMemo } from 'react';
import {
  Coffee,
  Minus,
  Plus,
  Percent,
  ShoppingBag,
  Banknote,
  CreditCard,
  Ticket,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { CatalogArticle, getArticleCategoriesInUse, getArticleById, getArticleTtcPrice } from '../data/manualSalesCatalog';
import {
  DraftQuantityRow,
  QuantitySalesFormState,
  QuantitySalesTotals,
  QuantityValidationIssue,
  RestoTicketCounts,
  RESTO_TICKET_DENOMINATIONS,
  clampInt,
  computeRowDiscountTotal,
  computeRowNetTotal,
  computeRowPaymentAllocated,
  computeRestoTicketsCollected,
} from '../data/quantitySalesEntryModel';

const inputBaseClass =
  'w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 transition';
const inputValidClass = 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500';
const inputErrorClass = 'border-red-400 dark:border-red-500/70 focus:border-red-500 focus:ring-red-500';
const labelClass = 'text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block';
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition active:scale-98 cursor-pointer';

interface QuantitySalesFormStepProps {
  articles: CatalogArticle[];
  employees: string[];
  shifts: string[];
  form: QuantitySalesFormState;
  totals: QuantitySalesTotals;
  issues: QuantityValidationIssue[];
  showErrors: boolean;
  onChangeGeneral: (patch: Partial<Pick<QuantitySalesFormState, 'date' | 'shift' | 'employee'>>) => void;
  onChangeQty: (articleId: string, qty: number) => void;
  onChangeRow: (articleId: string, patch: Partial<DraftQuantityRow>) => void;
  onChangeRestoTickets: (patch: Partial<RestoTicketCounts>) => void;
  onReset: () => void;
  onCancel: () => void;
  onVerify: () => void;
}

const QtyStepper: React.FC<{ value: number; onChange: (next: number) => void; min?: number }> = ({
  value,
  onChange,
  min = 0,
}) => (
  <div className="flex items-center gap-1.5 shrink-0">
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
    >
      <Minus size={12} />
    </button>
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Math.max(min, Math.round(Number(e.target.value)) || 0))}
      className="w-14 text-center text-xs py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
    />
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
    >
      <Plus size={12} />
    </button>
  </div>
);

const ProductThumb: React.FC<{ article: CatalogArticle }> = ({ article }) =>
  article.imageUrl ? (
    <img src={article.imageUrl} alt={article.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100 dark:border-gray-800" />
  ) : (
    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-600 shrink-0">
      <Coffee size={18} />
    </div>
  );

export const QuantitySalesFormStep: React.FC<QuantitySalesFormStepProps> = ({
  articles,
  employees,
  shifts,
  form,
  totals,
  issues,
  showErrors,
  onChangeGeneral,
  onChangeQty,
  onChangeRow,
  onChangeRestoTickets,
  onReset,
  onCancel,
  onVerify,
}) => {
  const issuesByKey = useMemo(() => {
    const map = new Map<string, string>();
    issues.forEach((issue) => {
      if (!map.has(issue.fieldKey)) map.set(issue.fieldKey, issue.message);
    });
    return map;
  }, [issues]);

  const rowsByArticleId = useMemo(() => {
    const map = new Map<string, DraftQuantityRow>();
    form.rows.forEach((r) => map.set(r.articleId, r));
    return map;
  }, [form.rows]);

  const articleCategories = useMemo(() => getArticleCategoriesInUse(articles), [articles]);

  const restoTicketsCollected = computeRestoTicketsCollected(form.restoTickets);
  const restoMismatch =
    (form.restoTickets.count5 > 0 || form.restoTickets.count7 > 0 || form.restoTickets.count10 > 0 || totals.totalRestoQty > 0) &&
    Math.abs(restoTicketsCollected - totals.totalRestoAmountTheoretical) > 0.01;

  return (
    <>
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

      {/* General info */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-3.5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Informations générales de la journée</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => onChangeGeneral({ date: e.target.value })}
              className={`${inputBaseClass} ${showErrors && issuesByKey.has('qgeneral:date') ? inputErrorClass : inputValidClass}`}
            />
          </div>
          <div>
            <label className={labelClass}>Shift *</label>
            <select
              value={form.shift}
              onChange={(e) => onChangeGeneral({ shift: e.target.value })}
              className={`${inputBaseClass} cursor-pointer ${showErrors && issuesByKey.has('qgeneral:shift') ? inputErrorClass : inputValidClass}`}
            >
              <option value="">Sélectionner un shift</option>
              {shifts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Employé *</label>
            <select
              value={form.employee}
              onChange={(e) => onChangeGeneral({ employee: e.target.value })}
              className={`${inputBaseClass} cursor-pointer ${showErrors && issuesByKey.has('qgeneral:employee') ? inputErrorClass : inputValidClass}`}
            >
              <option value="">Sélectionner un employé</option>
              {employees.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Produits vendus
            {totals.activeProductsCount > 0 && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                {totals.activeProductsCount} produit{totals.activeProductsCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <button onClick={onReset} className={secondaryButtonClass}>
            <RotateCcw size={14} />
            <span>Réinitialiser</span>
          </button>
        </div>

        {showErrors && issuesByKey.get('qgeneral:rows') && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle size={14} />
            {issuesByKey.get('qgeneral:rows')}
          </div>
        )}

        <div className="space-y-5 max-h-[900px] overflow-y-auto custom-scrollbar pr-0.5">
          {articleCategories.map((category) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 px-1">{category}</h3>
              <div className="space-y-2">
                {articles
                  .filter((a) => a.category === category)
                  .map((article) => {
                    const row = rowsByArticleId.get(article.id);
                    if (!row) return null;
                    const isActive = row.qty > 0;
                    const rowTotal = computeRowNetTotal(row, article);
                    const discountTotal = computeRowDiscountTotal(row);
                    const remaining = row.qty - computeRowPaymentAllocated(row);
                    const hasRowError =
                      showErrors &&
                      (issuesByKey.has(`qrow:${article.id}:takeaway`) ||
                        issuesByKey.has(`qrow:${article.id}:discount`) ||
                        issuesByKey.has(`qrow:${article.id}:payment`));

                    if (!isActive) {
                      return (
                        <div
                          key={article.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                        >
                          <ProductThumb article={article} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{article.name}</p>
                            <p className="text-[11px] text-gray-400">{getArticleTtcPrice(article).toFixed(2)} DT / unité</p>
                          </div>
                          <QtyStepper value={row.qty} onChange={(v) => onChangeQty(article.id, v)} />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={article.id}
                        className={`p-3 sm:p-4 rounded-xl border space-y-3 ${
                          hasRowError
                            ? 'border-red-300 dark:border-red-800/70 bg-red-50/40 dark:bg-red-950/10'
                            : 'border-emerald-200/70 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <ProductThumb article={article} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{article.name}</p>
                            <p className="text-[11px] text-gray-400">{getArticleTtcPrice(article).toFixed(2)} DT / unité</p>
                          </div>
                          <QtyStepper value={row.qty} onChange={(v) => onChangeQty(article.id, v)} />
                          <div className="text-right shrink-0 min-w-[72px]">
                            <p className="text-[10px] text-gray-400 font-semibold">Total</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{rowTotal.toFixed(2)} DT</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Réduction */}
                          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 space-y-1.5">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                              <Percent size={11} /> Réduction / unité
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={row.discountPerUnit}
                                onChange={(e) => onChangeRow(article.id, { discountPerUnit: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-full text-xs py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                              <span className="text-[10px] text-gray-400 shrink-0">DT</span>
                            </div>
                            {row.discountPerUnit > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => onChangeRow(article.id, { discountScope: 'all' })}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer ${
                                    row.discountScope === 'all'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  Toutes ({row.qty})
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChangeRow(article.id, { discountScope: 'partial', discountQty: Math.min(row.discountQty || 1, row.qty) })
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer ${
                                    row.discountScope === 'partial'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  Nombre précis
                                </button>
                                {row.discountScope === 'partial' && (
                                  <input
                                    type="number"
                                    min={0}
                                    max={row.qty}
                                    value={row.discountQty}
                                    onChange={(e) =>
                                      onChangeRow(article.id, { discountQty: clampInt(Number(e.target.value), 0, row.qty) })
                                    }
                                    className="w-14 text-center text-[11px] py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                )}
                              </div>
                            )}
                            {discountTotal > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                − {discountTotal.toFixed(2)} DT au total
                              </p>
                            )}
                            {showErrors && issuesByKey.get(`qrow:${article.id}:discount`) && (
                              <p className="text-[10px] text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} /> {issuesByKey.get(`qrow:${article.id}:discount`)}
                              </p>
                            )}
                          </div>

                          {/* À emporter */}
                          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 space-y-1.5">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                              <ShoppingBag size={11} /> Dont à emporter
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={row.qty}
                              value={row.takeawayQty}
                              onChange={(e) => onChangeRow(article.id, { takeawayQty: clampInt(Number(e.target.value), 0, row.qty) })}
                              className={`w-full text-xs py-1.5 px-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                showErrors && issuesByKey.has(`qrow:${article.id}:takeaway`)
                                  ? 'border-red-400 dark:border-red-500/70'
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                            />
                            <p className="text-[10px] text-gray-400">Sur place : {row.qty - Math.min(row.takeawayQty, row.qty)}</p>
                            {showErrors && issuesByKey.get(`qrow:${article.id}:takeaway`) && (
                              <p className="text-[10px] text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} /> {issuesByKey.get(`qrow:${article.id}:takeaway`)}
                              </p>
                            )}
                          </div>

                          {/* Règlement */}
                          <div className="p-2.5 rounded-lg bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 space-y-1.5">
                            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">Règlement</span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Banknote size={12} className="text-emerald-500 shrink-0" />
                                <input
                                  type="number"
                                  min={0}
                                  value={row.paidCash}
                                  onChange={(e) => onChangeRow(article.id, { paidCash: Math.max(0, Math.round(Number(e.target.value)) || 0) })}
                                  className="w-full text-xs py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <CreditCard size={12} className="text-blue-500 shrink-0" />
                                <input
                                  type="number"
                                  min={0}
                                  value={row.paidCard}
                                  onChange={(e) => onChangeRow(article.id, { paidCard: Math.max(0, Math.round(Number(e.target.value)) || 0) })}
                                  className="w-full text-xs py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Ticket size={12} className="text-amber-500 shrink-0" />
                                <input
                                  type="number"
                                  min={0}
                                  value={row.paidRestoTicket}
                                  onChange={(e) =>
                                    onChangeRow(article.id, { paidRestoTicket: Math.max(0, Math.round(Number(e.target.value)) || 0) })
                                  }
                                  className="w-full text-xs py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>
                            <p className={`text-[10px] font-semibold ${remaining !== 0 ? 'text-red-500' : 'text-gray-400'}`}>
                              {remaining === 0 ? 'Réparti en totalité' : `Reste à répartir : ${remaining}`}
                            </p>
                            {showErrors && issuesByKey.get(`qrow:${article.id}:payment`) && (
                              <p className="text-[10px] text-red-500 flex items-center gap-1">
                                <AlertCircle size={10} /> {issuesByKey.get(`qrow:${article.id}:payment`)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tickets Restaurant reconciliation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
          <Ticket size={15} className="text-amber-500" />
          Tickets restaurant encaissés
        </h2>
        <p className="text-[11px] text-gray-400">
          Facultatif — sert uniquement au rapprochement de caisse, sans influencer les totaux par produit.
        </p>
        <div className="grid grid-cols-3 gap-2.5 max-w-md">
          {RESTO_TICKET_DENOMINATIONS.map((d) => (
            <div key={d.id}>
              <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{d.label}</label>
              <input
                type="number"
                min={0}
                value={form.restoTickets[d.id]}
                onChange={(e) => onChangeRestoTickets({ [d.id]: Math.max(0, Math.round(Number(e.target.value)) || 0) })}
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
              />
            </div>
          ))}
        </div>
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            restoMismatch
              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
              : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'
          }`}
        >
          {restoMismatch ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
          <span>
            Valeur des tickets saisis : <strong>{restoTicketsCollected.toFixed(2)} DT</strong> — Montant attribué au règlement
            « Ticket resto » : <strong>{totals.totalRestoAmountTheoretical.toFixed(2)} DT</strong>
          </span>
        </div>
      </div>

      {/* Sticky recap + verify */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-gray-800 w-full sm:w-auto flex-wrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>
            <strong className="text-gray-800 dark:text-gray-200 font-semibold">{totals.activeProductsCount}</strong> produits •{' '}
            <strong className="text-gray-800 dark:text-gray-200 font-semibold">{totals.totalQty}</strong> unités • Total net{' '}
            <strong className="text-gray-800 dark:text-gray-200 font-semibold">{totals.totalNet.toFixed(2)} DT</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={onCancel} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
            <span>Annuler</span>
          </button>
          <button onClick={onVerify} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
            <ShieldCheck size={14} />
            <span>Vérifier les ventes</span>
          </button>
        </div>
      </div>
    </>
  );
};

interface QuantitySalesPreviewStepProps {
  articles: CatalogArticle[];
  form: QuantitySalesFormState;
  totals: QuantitySalesTotals;
  isSaving: boolean;
  saveError: string | null;
  onBackToForm: () => void;
  onConfirmSave: () => void;
}

export const QuantitySalesPreviewStep: React.FC<QuantitySalesPreviewStepProps> = ({
  articles,
  form,
  totals,
  isSaving,
  saveError,
  onBackToForm,
  onConfirmSave,
}) => {
  const activeRows = form.rows.filter((r) => r.qty > 0);

  return (
    <>
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
        <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Vérifiez les informations avant confirmation</p>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
            Aucune vente n'est encore enregistrée. Contrôlez les quantités et totaux ci-dessous, puis confirmez.
          </p>
        </div>
      </div>

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

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Produits ({activeRows.length})</h3>
        {activeRows.map((row) => {
          const article = getArticleById(row.articleId, articles);
          if (!article) return null;
          const net = computeRowNetTotal(row, article);
          const discount = computeRowDiscountTotal(row);
          return (
            <div
              key={row.articleId}
              className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-dashed border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {row.qty}x {article.name}
                </p>
                <p className="text-[11px] text-gray-400">
                  {row.takeawayQty > 0 && `${row.takeawayQty} à emporter • `}
                  Espèces {row.paidCash} • Carte {row.paidCard} • Ticket resto {row.paidRestoTicket}
                  {discount > 0 && ` • − ${discount.toFixed(2)} DT remise`}
                </p>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{net.toFixed(2)} DT</span>
            </div>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-gray-400 font-semibold block mb-0.5">Unités vendues</span>
          <span className="font-bold text-gray-900 dark:text-white">{totals.totalQty}</span>
        </div>
        <div>
          <span className="text-gray-400 font-semibold block mb-0.5">Dont à emporter</span>
          <span className="font-bold text-gray-900 dark:text-white">{totals.totalTakeawayQty}</span>
        </div>
        <div>
          <span className="text-gray-400 font-semibold block mb-0.5">Total remises</span>
          <span className="font-bold text-gray-900 dark:text-white">− {totals.totalDiscount.toFixed(2)} DT</span>
        </div>
        <div>
          <span className="text-gray-400 font-semibold block mb-0.5">Total net</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{totals.totalNet.toFixed(2)} DT</span>
        </div>
      </div>

      {saveError && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700 dark:text-red-300">Échec de l'enregistrement</p>
            <p className="text-xs text-red-600/90 dark:text-red-400/90">{saveError}</p>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-bold text-gray-900 dark:text-white">{activeRows.length}</span> produits •{' '}
          <span className="font-bold text-gray-900 dark:text-white">{totals.totalNet.toFixed(2)} DT</span> au total
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={onBackToForm} disabled={isSaving} className={`${secondaryButtonClass} flex-1 sm:flex-none`}>
            <ArrowLeft size={14} />
            <span>Modifier les ventes</span>
          </button>
          <button onClick={onConfirmSave} disabled={isSaving} className={`${primaryButtonClass} flex-1 sm:flex-none`}>
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            <span>{isSaving ? 'Enregistrement…' : 'Confirmer et enregistrer'}</span>
          </button>
        </div>
      </div>
    </>
  );
};
