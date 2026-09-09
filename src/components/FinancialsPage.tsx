import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FilterX,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Users,
  CalendarDays,
  Info,
} from 'lucide-react';
import { MONTHS_LIST } from '../data/salesTransactions';
import { useQueryParam } from '../hooks/useQueryParam';
import {
  Employee,
  FinancialRecord,
  PaymentStatus,
  PAYMENT_STATUSES,
  DraftFinancialRecord,
  createEmptyDraftFinancialRecord,
  createDraftFromFinancialRecord,
  validateDraftFinancialRecord,
  buildFinancialRecordFromDraft,
  computeNetDue,
  computeFinancialStatus,
  getEmployeeFullName,
  formatDisplayDate,
} from '../data/hrModel';

interface FinancialsPageProps {
  employees: Employee[];
  financialRecords: FinancialRecord[];
  onNavigateToDashboard: () => void;
  onNavigateToEmployees: () => void;
  onNavigateToPlanning: () => void;
  onCreateFinancialRecord: (record: FinancialRecord) => void;
  onUpdateFinancialRecord: (record: FinancialRecord) => void;
  onDeleteFinancialRecord: (recordId: string) => void;
  isDarkMode?: boolean;
}

type FormMode = 'create' | 'edit';
type Step = 'form' | 'preview' | 'success';

const inputBaseClass =
  'w-full px-3.5 py-2 text-xs rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 transition';
const inputValidClass = 'border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500';
const inputErrorClass = 'border-red-400 dark:border-red-500/70 focus:border-red-500 focus:ring-red-500';
const labelClass = 'text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5 block';
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-2xs transition active:scale-98 cursor-pointer';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  'Non payé': 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/70',
  'Partiellement payé': 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
  Payé: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70',
};

const formatAmount = (n: number) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`;
const monthFullName = (monthIndex: number) => MONTHS_LIST.find((m) => m.monthIndex === monthIndex)?.fullName ?? '';
const getInitials = (name: string): string => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '—';

export const FinancialsPage: React.FC<FinancialsPageProps> = ({
  employees,
  financialRecords,
  onNavigateToDashboard,
  onNavigateToEmployees,
  onNavigateToPlanning,
  onCreateFinancialRecord,
  onUpdateFinancialRecord,
  onDeleteFinancialRecord,
}) => {
  const now = new Date();

  const [formOpen, setFormOpen] = useState<FormMode | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [draft, setDraft] = useState<DraftFinancialRecord>(createEmptyDraftFinancialRecord());
  const [hasAttemptedVerify, setHasAttemptedVerify] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // "Consulter" opens ?record=<id> — a shareable deep link into that record's detail modal. An
  // id that doesn't match any record just resolves to no modal open.
  const [recordParam, setRecordParam] = useQueryParam('record');
  const viewingRecordId = recordParam || null;
  const setViewingRecordId = (id: string | null) => setRecordParam(id ?? '');
  const [deleteTarget, setDeleteTarget] = useState<FinancialRecord | null>(null);

  // Filters — the period controls double as the page's primary scope. All synced to the URL
  // (?q=&employee=&status=&month=&year=) so a filtered view is bookmarkable/shareable; every
  // value is validated against its known domain, falling back to a safe default otherwise.
  const [searchQuery, setSearchQuery] = useQueryParam('q');
  const [filterEmployee, setFilterEmployee] = useQueryParam('employee', 'all');
  const [filterStatusRaw, setFilterStatus] = useQueryParam('status', 'all');
  const filterStatus = useMemo<'all' | PaymentStatus>(
    () => (PAYMENT_STATUSES.includes(filterStatusRaw as PaymentStatus) ? (filterStatusRaw as PaymentStatus) : 'all'),
    [filterStatusRaw]
  );
  const [filterMonthRaw, setFilterMonthRaw] = useQueryParam('month', String(now.getMonth()));
  const filterMonth = useMemo<number | 'all'>(() => {
    if (filterMonthRaw === 'all') return 'all';
    const n = Number(filterMonthRaw);
    return Number.isInteger(n) && n >= 0 && n <= 11 ? n : now.getMonth();
  }, [filterMonthRaw]);
  const setFilterMonth = (value: number | 'all') => setFilterMonthRaw(value === 'all' ? 'all' : String(value));
  const [filterYearRaw, setFilterYearRaw] = useQueryParam('year', String(now.getFullYear()));
  const filterYear = useMemo(() => {
    const n = Number(filterYearRaw);
    return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : now.getFullYear();
  }, [filterYearRaw]);
  const setFilterYear = (value: number) => setFilterYearRaw(String(value));
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const employeeName = (employeeId: string) => { const e = employees.find((x) => x.id === employeeId); return e ? getEmployeeFullName(e) : '—'; };
  const employeeById = (employeeId: string) => employees.find((x) => x.id === employeeId);

  const viewingRecord = useMemo(() => financialRecords.find((r) => r.id === viewingRecordId) ?? null, [financialRecords, viewingRecordId]);

  const updateDraft = (patch: Partial<DraftFinancialRecord>) => setDraft((prev) => ({ ...prev, ...patch }));

  const issues = useMemo(() => validateDraftFinancialRecord(draft, employees, financialRecords), [draft, employees, financialRecords]);
  const issuesByField = new Map(issues.map((i) => [i.field, i.message]));
  const showErrors = hasAttemptedVerify;

  // --- Create / edit workflow ---
  const handleOpenCreate = () => {
    setFormOpen('create');
    setDraft(createEmptyDraftFinancialRecord());
    setStep('form');
    setHasAttemptedVerify(false);
    setSaveError(null);
  };
  const handleOpenEdit = (record: FinancialRecord) => {
    setFormOpen('edit');
    setDraft(createDraftFromFinancialRecord(record));
    setStep('form');
    setHasAttemptedVerify(false);
    setSaveError(null);
  };
  const handleCloseForm = () => { setFormOpen(null); setStep('form'); };
  const handleVerify = () => { setHasAttemptedVerify(true); if (issues.length === 0) setStep('preview'); };

  const handleConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const record = buildFinancialRecordFromDraft(draft);
      if (formOpen === 'create') onCreateFinancialRecord(record);
      else onUpdateFinancialRecord(record);
      setStep('success');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartNew = () => {
    setDraft(createEmptyDraftFinancialRecord());
    setHasAttemptedVerify(false);
    setSaveError(null);
    setStep('form');
    setFormOpen('create');
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    onDeleteFinancialRecord(deleteTarget.id);
    setDeleteTarget(null);
    if (viewingRecordId === deleteTarget.id) setViewingRecordId(null);
  };

  // --- Filters / list ---
  const filteredRecords = useMemo(() => {
    return financialRecords.filter((r) => {
      if (filterEmployee !== 'all' && r.employeeId !== filterEmployee) return false;
      if (filterStatus !== 'all' && computeFinancialStatus(r) !== filterStatus) return false;
      if (filterMonth !== 'all' && r.periodMonthIndex !== filterMonth) return false;
      if (r.periodYear !== filterYear) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        if (!employeeName(r.employeeId).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [financialRecords, employees, filterEmployee, filterStatus, filterMonth, filterYear, searchQuery]);

  const sortedRecords = useMemo(() => [...filteredRecords].sort((a, b) => employeeName(a.employeeId).localeCompare(employeeName(b.employeeId))), [filteredRecords, employees]);
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / rowsPerPage));
  const paginatedRecords = useMemo(() => sortedRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [sortedRecords, currentPage]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterEmployee('all');
    setFilterStatus('all');
    setFilterMonth(now.getMonth());
    setFilterYear(now.getFullYear());
    setCurrentPage(1);
  };
  const hasActiveFilters = Boolean(searchQuery.trim() || filterEmployee !== 'all' || filterStatus !== 'all');

  // --- KPIs (reflect the selected period / filters) ---
  const totalBaseSalary = useMemo(() => filteredRecords.reduce((s, r) => s + r.baseSalary, 0), [filteredRecords]);
  const totalAdvances = useMemo(() => filteredRecords.reduce((s, r) => s + r.advances, 0), [filteredRecords]);
  const totalBonuses = useMemo(() => filteredRecords.reduce((s, r) => s + r.bonuses, 0), [filteredRecords]);
  const totalDeductions = useMemo(() => filteredRecords.reduce((s, r) => s + r.deductions, 0), [filteredRecords]);
  const totalPaid = useMemo(() => filteredRecords.reduce((s, r) => s + r.amountPaid, 0), [filteredRecords]);
  const totalCost = totalBaseSalary + totalBonuses - totalDeductions;
  const totalUnpaid = Math.max(0, totalCost - totalPaid);

  const periodLabel = filterMonth === 'all' ? `Année ${filterYear}` : `${monthFullName(filterMonth)} ${filterYear}`;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>Suivi financier</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Gestion du personnel
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Suivi des salaires, avances, primes et retenues — n'est ni un logiciel de paie ni de déclaration sociale.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button onClick={onNavigateToEmployees} className={secondaryButtonClass}>
            <Users size={14} className="text-gray-500 dark:text-gray-400" />
            <span>Employés</span>
          </button>
          <button onClick={onNavigateToPlanning} className={secondaryButtonClass}>
            <CalendarDays size={14} className="text-gray-500 dark:text-gray-400" />
            <span>Planning</span>
          </button>
          <button onClick={handleOpenCreate} className={primaryButtonClass}>
            <Plus size={14} />
            <span>Ajouter un suivi</span>
          </button>
          <button
            onClick={onNavigateToDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition active:scale-98 cursor-pointer"
          >
            <span>Tableau de bord</span>
          </button>
        </div>
      </div>

      {/* Period controls */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Période :</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }} className="appearance-none pl-3.5 pr-8 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
            <option value="all">Toute l'année</option>
            {MONTHS_LIST.map((m) => (<option key={m.id} value={m.monthIndex}>{m.fullName}</option>))}
          </select>
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg p-0.5 bg-gray-50/50 dark:bg-gray-800/50">
            <button onClick={() => { setFilterYear(filterYear - 1); setCurrentPage(1); }} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition cursor-pointer"><ChevronLeft size={15} /></button>
            <span className="px-3 text-xs font-bold text-gray-900 dark:text-white">{filterYear}</span>
            <button onClick={() => { setFilterYear(filterYear + 1); setCurrentPage(1); }} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition cursor-pointer"><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Coût global du personnel</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatAmount(totalCost)}</span>
            <p className="text-[11px] text-gray-400">Salaires + primes − retenues</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 shrink-0"><CircleDollarSign size={22} /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Salaires de base</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatAmount(totalBaseSalary)}</span>
            <p className="text-[11px] text-gray-400">{filteredRecords.length} fiche{filteredRecords.length > 1 ? 's' : ''}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0"><Wallet size={22} /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Montant payé</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatAmount(totalPaid)}</span>
            <p className="text-[11px] text-gray-400">Restant dû : {formatAmount(totalUnpaid)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 shrink-0"><Banknote size={22} /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Avances</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatAmount(totalAdvances)}</span>
            <p className="text-[11px] text-gray-400">Déjà versées aux employés</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 shrink-0"><TrendingDown size={22} /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Primes</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatAmount(totalBonuses)}</span>
            <p className="text-[11px] text-gray-400">Bonus accordés sur la période</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 shrink-0"><TrendingUp size={22} /></div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs flex items-center justify-between hover:border-gray-200 dark:hover:border-gray-700 transition">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Retenues</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formatAmount(totalDeductions)}</span>
            <p className="text-[11px] text-gray-400">Déduites du coût global</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50/80 dark:bg-red-950/40 flex items-center justify-center text-red-500 shrink-0"><TrendingDown size={22} /></div>
        </div>
      </div>

      {/* Personnel cost overview — simple, functional breakdown (no decorative charting) */}
      {totalCost > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs space-y-3">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Vue d'ensemble du coût du personnel — {periodLabel}</p>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>Payé</span><span>{formatAmount(totalPaid)} / {formatAmount(totalCost)}</span></div>
              <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalPaid / totalCost) * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { label: 'Salaires de base', value: totalBaseSalary, color: 'bg-blue-500' },
              { label: 'Primes', value: totalBonuses, color: 'bg-emerald-500' },
              { label: 'Retenues', value: totalDeductions, color: 'bg-red-500' },
            ].map(({ label, value, color }) => {
              const max = Math.max(totalBaseSalary, totalBonuses, totalDeductions, 1);
              return (
                <div key={label}>
                  <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>{label}</span><span>{formatAmount(value)}</span></div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 flex-1">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Nom de l'employé..." className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <select value={filterEmployee} onChange={(e) => { setFilterEmployee(e.target.value); setCurrentPage(1); }} className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
              <option value="all">Tous les employés</option>
              {employees.map((e) => (<option key={e.id} value={e.id}>{getEmployeeFullName(e)}</option>))}
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as 'all' | PaymentStatus); setCurrentPage(1); }} className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer">
              <option value="all">Tous les statuts</option>
              {PAYMENT_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <button onClick={handleResetFilters} className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-2xs transition active:scale-98 shrink-0 cursor-pointer">
            <FilterX size={14} className="text-gray-500" />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-100 dark:border-gray-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="py-3.5 px-4">Employé</th>
                <th className="py-3.5 px-4 text-right">Salaire de base</th>
                <th className="py-3.5 px-4 text-right">Avances</th>
                <th className="py-3.5 px-4 text-right">Primes</th>
                <th className="py-3.5 px-4 text-right">Retenues</th>
                <th className="py-3.5 px-4 text-right">Montant payé</th>
                <th className="py-3.5 px-4">Date de paiement</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
              {financialRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-gray-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <LineChart className="w-9 h-9 mx-auto text-gray-300 dark:text-gray-600" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Aucun suivi financier pour le moment</p>
                      <p className="text-xs text-gray-400">Ajoutez un premier enregistrement pour suivre la rémunération de vos employés.</p>
                      <button onClick={handleOpenCreate} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer">
                        <Plus size={13} /> Ajouter un suivi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-gray-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Search className="w-9 h-9 mx-auto text-gray-300 dark:text-gray-600" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Aucun enregistrement ne correspond à ces filtres</p>
                      <button onClick={handleResetFilters} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer">
                        <FilterX size={13} /> Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const status = computeFinancialStatus(r);
                  const emp = employeeById(r.employeeId);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <button onClick={() => setViewingRecordId(r.id)} className="flex items-center gap-2 text-left cursor-pointer group">
                          {emp?.photoUrl ? (
                            <img src={emp.photoUrl} alt={employeeName(r.employeeId)} className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0" />
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] shrink-0">{getInitials(employeeName(r.employeeId))}</span>
                          )}
                          <span className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition whitespace-nowrap">{employeeName(r.employeeId)}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatAmount(r.baseSalary)}</td>
                      <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatAmount(r.advances)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatAmount(r.bonuses)}</td>
                      <td className="py-3 px-4 text-right text-red-600 dark:text-red-400 whitespace-nowrap">{formatAmount(r.deductions)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap">{formatAmount(r.amountPaid)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.paymentDate ? formatDisplayDate(r.paymentDate) : '—'}</td>
                      <td className="py-3 px-4 text-center"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${STATUS_STYLES[status]}`}>{status}</span></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewingRecordId(r.id)} title="Consulter" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"><Eye size={14} /></button>
                          <button onClick={() => handleOpenEdit(r)} title="Modifier" className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(r)} title="Supprimer" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {financialRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>sur un total de {sortedRecords.length} enregistrement{sortedRecords.length > 1 ? 's' : ''}{hasActiveFilters ? ' (filtrés)' : ''}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"><ChevronLeft size={16} /></button>
              <span className="px-3 py-1 font-semibold text-gray-700 dark:text-gray-300">Page {currentPage} sur {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create / edit — responsive modal dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {step === 'success' ? (
              <div className="p-8 sm:p-12 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-500"><CheckCircle2 size={30} /></div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{formOpen === 'create' ? 'Suivi financier enregistré avec succès' : 'Suivi financier modifié avec succès'}</h2>
                <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                  <button onClick={handleStartNew} className={secondaryButtonClass}><Plus size={14} /><span>Ajouter un autre suivi</span></button>
                  <button onClick={handleCloseForm} className={primaryButtonClass}><LineChart size={14} /><span>Voir la liste</span></button>
                </div>
              </div>
            ) : step === 'preview' ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">Vérification avant enregistrement</h2>
                  <button onClick={handleCloseForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"><X size={16} /></button>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                  <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">Vérifiez ce suivi financier avant confirmation — rien n'est encore enregistré.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Employé :</span><span className="font-bold text-gray-900 dark:text-white">{employeeName(draft.employeeId)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Période :</span><span className="font-bold text-gray-900 dark:text-white">{monthFullName(draft.periodMonthIndex)} {draft.periodYear}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Salaire de base :</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(Number(draft.baseSalary || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Avances :</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(Number(draft.advances || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Primes :</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(Number(draft.bonuses || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Retenues :</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(Number(draft.deductions || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Montant payé :</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(Number(draft.amountPaid || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date de paiement :</span><span className="font-bold text-gray-900 dark:text-white">{draft.paymentDate ? formatDisplayDate(draft.paymentDate) : '—'}</span></div>
                </div>
                {saveError && <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-400 flex items-center gap-2"><AlertCircle size={14} /> {saveError}</div>}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button onClick={() => setStep('form')} disabled={isSaving} className={secondaryButtonClass}><span>Modifier</span></button>
                  <button onClick={handleConfirm} disabled={isSaving} className={primaryButtonClass}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    <span>{isSaving ? 'Enregistrement…' : 'Confirmer'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">{formOpen === 'create' ? 'Nouveau suivi financier' : 'Modifier le suivi financier'}</h2>
                  <button onClick={handleCloseForm} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"><X size={16} /></button>
                </div>

                <div>
                  <label className={labelClass}>Employé *</label>
                  <div className="relative">
                    <select value={draft.employeeId} onChange={(e) => updateDraft({ employeeId: e.target.value })} className={`${inputBaseClass} appearance-none pr-8 cursor-pointer ${showErrors && issuesByField.has('employeeId') ? inputErrorClass : inputValidClass}`}>
                      <option value="">Sélectionner un employé</option>
                      {employees.map((e) => (<option key={e.id} value={e.id}>{getEmployeeFullName(e)} — {e.poste}</option>))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {showErrors && issuesByField.get('employeeId') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('employeeId')}</p>)}
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Mois de la période</label>
                    <select value={draft.periodMonthIndex} onChange={(e) => updateDraft({ periodMonthIndex: Number(e.target.value) })} className={`${inputBaseClass} appearance-none cursor-pointer ${inputValidClass}`}>
                      {MONTHS_LIST.map((m) => (<option key={m.id} value={m.monthIndex}>{m.fullName}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Année</label>
                    <input type="number" value={draft.periodYear} onChange={(e) => updateDraft({ periodYear: Number(e.target.value) })} className={`${inputBaseClass} ${inputValidClass}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className={labelClass}>Salaire de base (DT) *</label>
                    <input type="number" min={0} step="any" value={draft.baseSalary} onChange={(e) => updateDraft({ baseSalary: e.target.value })} className={`${inputBaseClass} ${showErrors && issuesByField.has('baseSalary') ? inputErrorClass : inputValidClass}`} />
                    {showErrors && issuesByField.get('baseSalary') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('baseSalary')}</p>)}
                  </div>
                  <div>
                    <label className={labelClass}>Avances (DT)</label>
                    <input type="number" min={0} step="any" value={draft.advances} onChange={(e) => updateDraft({ advances: e.target.value })} className={`${inputBaseClass} ${showErrors && issuesByField.has('advances') ? inputErrorClass : inputValidClass}`} />
                    {showErrors && issuesByField.get('advances') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('advances')}</p>)}
                  </div>
                  <div>
                    <label className={labelClass}>Primes (DT)</label>
                    <input type="number" min={0} step="any" value={draft.bonuses} onChange={(e) => updateDraft({ bonuses: e.target.value })} className={`${inputBaseClass} ${showErrors && issuesByField.has('bonuses') ? inputErrorClass : inputValidClass}`} />
                    {showErrors && issuesByField.get('bonuses') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('bonuses')}</p>)}
                  </div>
                  <div>
                    <label className={labelClass}>Retenues (DT)</label>
                    <input type="number" min={0} step="any" value={draft.deductions} onChange={(e) => updateDraft({ deductions: e.target.value })} className={`${inputBaseClass} ${showErrors && issuesByField.has('deductions') ? inputErrorClass : inputValidClass}`} />
                    {showErrors && issuesByField.get('deductions') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('deductions')}</p>)}
                  </div>
                  <div>
                    <label className={labelClass}>Montant payé (DT)</label>
                    <input type="number" min={0} step="any" value={draft.amountPaid} onChange={(e) => updateDraft({ amountPaid: e.target.value })} className={`${inputBaseClass} ${showErrors && issuesByField.has('amountPaid') ? inputErrorClass : inputValidClass}`} />
                    {showErrors && issuesByField.get('amountPaid') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('amountPaid')}</p>)}
                  </div>
                  <div>
                    <label className={labelClass}>Date de paiement</label>
                    <input type="date" value={draft.paymentDate} onChange={(e) => updateDraft({ paymentDate: e.target.value })} className={`${inputBaseClass} ${showErrors && issuesByField.has('paymentDate') ? inputErrorClass : inputValidClass}`} />
                    {showErrors && issuesByField.get('paymentDate') && (<p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} /> {issuesByField.get('paymentDate')}</p>)}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button onClick={handleCloseForm} className={secondaryButtonClass}><span>Annuler la saisie</span></button>
                  <button onClick={handleVerify} className={primaryButtonClass}><ShieldCheck size={14} /><span>Vérifier</span></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View financial record modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200" onClick={() => setViewingRecordId(null)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-gray-700 shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#151D2A] z-10">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{employeeName(viewingRecord.employeeId)} — {monthFullName(viewingRecord.periodMonthIndex)} {viewingRecord.periodYear}</h3>
              <button onClick={() => setViewingRecordId(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Employé</p>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center gap-3">
                  {employeeById(viewingRecord.employeeId)?.photoUrl ? (
                    <img src={employeeById(viewingRecord.employeeId)!.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">{getInitials(employeeName(viewingRecord.employeeId))}</span>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{employeeName(viewingRecord.employeeId)}</p>
                    <p className="text-gray-500">{employeeById(viewingRecord.employeeId)?.poste}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rémunération</p>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400 font-semibold block mb-0.5">Salaire de base</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(viewingRecord.baseSalary)}</span></div>
                  <div><span className="text-gray-400 font-semibold block mb-0.5">Avances</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(viewingRecord.advances)}</span></div>
                  <div><span className="text-gray-400 font-semibold block mb-0.5">Primes</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(viewingRecord.bonuses)}</span></div>
                  <div><span className="text-gray-400 font-semibold block mb-0.5">Retenues</span><span className="font-bold text-red-600 dark:text-red-400">{formatAmount(viewingRecord.deductions)}</span></div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Paiement</p>
                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                  <div><span className="text-gray-400 font-semibold block mb-0.5">Montant payé</span><span className="font-bold text-gray-900 dark:text-white">{formatAmount(viewingRecord.amountPaid)}</span></div>
                  <div><span className="text-gray-400 font-semibold block mb-0.5">Date de paiement</span><span className="font-bold text-gray-900 dark:text-white">{viewingRecord.paymentDate ? formatDisplayDate(viewingRecord.paymentDate) : '—'}</span></div>
                  <div className="col-span-2"><span className="text-gray-400 font-semibold block mb-0.5">Statut</span><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${STATUS_STYLES[computeFinancialStatus(viewingRecord)]}`}>{computeFinancialStatus(viewingRecord)}</span></div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info size={13} className="shrink-0 mt-0.5" />
                <span>Net dû pour la période : <strong>{formatAmount(computeNetDue(viewingRecord))}</strong> — restant à payer : <strong>{formatAmount(Math.max(0, computeNetDue(viewingRecord) - viewingRecord.amountPaid))}</strong></span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => setViewingRecordId(null)} className={secondaryButtonClass}><span>Fermer</span></button>
                <button onClick={() => handleOpenEdit(viewingRecord)} className={primaryButtonClass}><Pencil size={14} /><span>Modifier</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#151D2A] border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2"><AlertCircle size={16} className="text-red-500" /> Supprimer ce suivi</h3>
              <button onClick={() => setDeleteTarget(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <p>Voulez-vous vraiment supprimer le suivi financier de <strong className="text-gray-900 dark:text-white">{employeeName(deleteTarget.employeeId)}</strong> pour {monthFullName(deleteTarget.periodMonthIndex)} {deleteTarget.periodYear} ? Cette action est irréversible.</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className={secondaryButtonClass}><span>Annuler</span></button>
              <button onClick={handleConfirmDelete} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs transition active:scale-98 cursor-pointer">
                <Trash2 size={14} /><span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
