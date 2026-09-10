// Shared domain model for "Achat et dépenses" → Dépenses / Catégories de dépenses.
// Follows the same conventions as productsModel.ts / stockModel.ts: canonical entity resolution
// via normalizeKey, draft/validation helpers for the Saisie → Validation → Confirmation workflow,
// and usage-count guards so a category in use can never be silently deleted.

import { normalizeKey } from './textUtils';

let idCounter = 0;
export const generateExpenseId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
};

// --- Categories -------------------------------------------------------------------------------

export interface ExpenseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export const resolveExpenseCategoryByName = (raw: string, categories: ExpenseCategory[]): ExpenseCategory | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return categories.find((c) => normalizeKey(c.name) === key);
};

export const getExpenseCategoryUsageCount = (category: ExpenseCategory, expenses: Expense[]): number =>
  expenses.filter((e) => e.categoryId === category.id).length;

// --- Expenses -----------------------------------------------------------------------------------

export type ExpenseNature = 'Fixe' | 'Variable';
export const EXPENSE_NATURES: ExpenseNature[] = ['Fixe', 'Variable'];

export type ExpenseRecurrence = 'Ponctuelle' | 'Hebdomadaire' | 'Mensuelle' | 'Trimestrielle' | 'Annuelle';
export const EXPENSE_RECURRENCES: ExpenseRecurrence[] = ['Ponctuelle', 'Hebdomadaire', 'Mensuelle', 'Trimestrielle', 'Annuelle'];

export type ExpensePaymentMethod = 'Espèces' | 'Carte bancaire' | 'Chèque' | 'Virement bancaire';
export const EXPENSE_PAYMENT_METHODS: ExpensePaymentMethod[] = ['Espèces', 'Carte bancaire', 'Chèque', 'Virement bancaire'];

export type ExpenseStatus = 'En attente' | 'Approuvé' | 'Rejeté';
export const EXPENSE_STATUSES: ExpenseStatus[] = ['En attente', 'Approuvé', 'Rejeté'];

export interface ExpenseAttachment {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  categoryId: string;
  nature: ExpenseNature;
  recurrence: ExpenseRecurrence;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  comment?: string;
  attachment?: ExpenseAttachment;
  createdAt: string;
}

const todayIso = (): string => new Date().toISOString().slice(0, 10);

// --- Draft / workflow helpers (Saisie → Validation → Prévisualisation → Confirmation) ----------

export interface DraftExpense {
  id: string;
  title: string;
  amount: string;
  date: string;
  categoryId: string;
  nature: ExpenseNature;
  recurrence: ExpenseRecurrence;
  paymentMethod: ExpensePaymentMethod | '';
  comment: string;
  attachment: ExpenseAttachment | null;
  // Carried through unchanged from the existing record when editing — status is only ever
  // changed via the dedicated status control on the row/detail, never through this form.
  status: ExpenseStatus;
  createdAt: string | null;
}

export const createEmptyDraftExpense = (): DraftExpense => ({
  id: generateExpenseId('exp'),
  title: '',
  amount: '',
  date: todayIso(),
  categoryId: '',
  nature: 'Variable',
  recurrence: 'Ponctuelle',
  paymentMethod: '',
  comment: '',
  attachment: null,
  status: 'En attente',
  createdAt: null,
});

export const createDraftFromExpense = (expense: Expense): DraftExpense => ({
  id: expense.id,
  title: expense.title,
  amount: String(expense.amount),
  date: expense.date,
  categoryId: expense.categoryId,
  nature: expense.nature,
  recurrence: expense.recurrence,
  paymentMethod: expense.paymentMethod,
  comment: expense.comment ?? '',
  attachment: expense.attachment ?? null,
  status: expense.status,
  createdAt: expense.createdAt,
});

export interface ExpenseValidationIssue {
  field: string;
  message: string;
}

export const validateDraftExpense = (draft: DraftExpense, categories: ExpenseCategory[]): ExpenseValidationIssue[] => {
  const issues: ExpenseValidationIssue[] = [];

  if (!draft.title.trim()) issues.push({ field: 'title', message: 'Le titre / objet de la dépense est obligatoire.' });

  const amountNum = Number(draft.amount);
  if (!draft.amount.trim()) issues.push({ field: 'amount', message: 'Le montant est obligatoire.' });
  else if (Number.isNaN(amountNum) || amountNum <= 0) issues.push({ field: 'amount', message: 'Le montant doit être un nombre supérieur à 0.' });

  if (!draft.date) issues.push({ field: 'date', message: 'La date est obligatoire.' });

  if (!draft.categoryId) issues.push({ field: 'categoryId', message: 'La catégorie est obligatoire.' });
  else if (!categories.some((c) => c.id === draft.categoryId)) issues.push({ field: 'categoryId', message: 'Catégorie invalide.' });

  if (!draft.paymentMethod) issues.push({ field: 'paymentMethod', message: 'Le mode de paiement est obligatoire.' });

  return issues;
};

export const buildExpenseFromDraft = (draft: DraftExpense): Expense => ({
  id: draft.id,
  title: draft.title.trim(),
  amount: Number(draft.amount),
  date: draft.date,
  categoryId: draft.categoryId,
  nature: draft.nature,
  recurrence: draft.recurrence,
  paymentMethod: draft.paymentMethod as ExpensePaymentMethod,
  status: draft.status,
  comment: draft.comment.trim() || undefined,
  attachment: draft.attachment ?? undefined,
  createdAt: draft.createdAt ?? new Date().toISOString(),
});
