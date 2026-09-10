import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { fromJson, toJson } from '../db/json.js';
import { asyncHandler, ApiError, notFound } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../lib/activity.js';
import {
  MAX_SHIFTS,
  buildDayRecordsFromPattern,
  getEmployeeFullName,
  type Employee,
  type Shift,
  type DayRecord,
  type RecurringPlan,
  type FinancialRecord,
  type WeeklyPattern,
} from '../../src/data/hrModel.js';

const nowIso = () => new Date().toISOString();
const CIN_PATTERN = /^\d{8}$/;

// --- Row <-> entity mappers ---------------------------------------------------------------------

interface EmployeeRow { id: string; first_name: string; last_name: string; phone: string; photo_url: string | null; poste: string; entry_date: string; status: string; salary: number; cin_number: string; cin_issue_date: string; cin_document: string | null; created_at: string }
const rowToEmployee = (r: EmployeeRow): Employee => ({
  id: r.id, firstName: r.first_name, lastName: r.last_name, phone: r.phone, photoUrl: r.photo_url ?? undefined,
  poste: r.poste, entryDate: r.entry_date, status: r.status as Employee['status'], salary: r.salary,
  cinNumber: r.cin_number, cinIssueDate: r.cin_issue_date, cinDocument: r.cin_document ? fromJson(r.cin_document, undefined as never) : undefined,
  createdAt: r.created_at,
});

interface ShiftRow { id: string; name: string; start_time: string; end_time: string; description: string | null; created_at: string }
const rowToShift = (r: ShiftRow): Shift => ({ id: r.id, name: r.name, startTime: r.start_time, endTime: r.end_time, description: r.description ?? undefined, createdAt: r.created_at });

interface DayRecordRow { id: string; employee_id: string; date: string; status: string; shift_ids: string; recurring_plan_id: string | null; note: string | null; updated_at: string; updated_by: string }
const rowToDayRecord = (r: DayRecordRow): DayRecord => ({
  id: r.id, employeeId: r.employee_id, date: r.date, status: r.status as DayRecord['status'],
  shiftIds: fromJson<string[]>(r.shift_ids, []), recurringPlanId: r.recurring_plan_id ?? undefined,
  note: r.note ?? undefined, updatedAt: r.updated_at, updatedBy: r.updated_by,
});

interface RecurringPlanRow { id: string; employee_id: string; start_date: string; end_date: string; weekly_pattern: string; created_at: string; created_by: string }
const rowToRecurringPlan = (r: RecurringPlanRow): RecurringPlan => ({
  id: r.id, employeeId: r.employee_id, startDate: r.start_date, endDate: r.end_date,
  weeklyPattern: fromJson<WeeklyPattern>(r.weekly_pattern, {} as WeeklyPattern), createdAt: r.created_at, createdBy: r.created_by,
});

interface FinancialRow { id: string; employee_id: string; period_month_index: number; period_year: number; base_salary: number; advances: number; bonuses: number; deductions: number; amount_paid: number; payment_date: string | null; created_at: string }
const rowToFinancial = (r: FinancialRow): FinancialRecord => ({
  id: r.id, employeeId: r.employee_id, periodMonthIndex: r.period_month_index, periodYear: r.period_year,
  baseSalary: r.base_salary, advances: r.advances, bonuses: r.bonuses, deductions: r.deductions,
  amountPaid: r.amount_paid, paymentDate: r.payment_date ?? undefined, createdAt: r.created_at,
});

const getAllEmployees = (): Employee[] => (db.prepare('SELECT * FROM employees').all() as EmployeeRow[]).map(rowToEmployee);
const getAllShifts = (): Shift[] => (db.prepare('SELECT * FROM shifts').all() as ShiftRow[]).map(rowToShift);
const getAllDayRecords = (): DayRecord[] => (db.prepare('SELECT * FROM day_records').all() as DayRecordRow[]).map(rowToDayRecord);

export const hrRouter = Router();
hrRouter.use(requireAuth);

// --- Employees -----------------------------------------------------------------------------------

const employeeSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().min(1),
  photoUrl: z.string().optional(),
  poste: z.string().trim().min(1),
  entryDate: z.string().min(1),
  status: z.enum(['Actif', 'Inactif']),
  salary: z.number().min(0),
  cinNumber: z.string().regex(CIN_PATTERN, 'Le numéro CIN doit comporter 8 chiffres.'),
  cinIssueDate: z.string().min(1),
  cinDocument: z.object({ name: z.string(), mimeType: z.string(), dataUrl: z.string() }).optional(),
});

hrRouter.get('/employees', asyncHandler((_req, res) => res.json(getAllEmployees())));

hrRouter.post('/employees', asyncHandler((req, res) => {
  const body = employeeSchema.parse(req.body);
  const duplicate = getAllEmployees().find((e) => e.cinNumber === body.cinNumber);
  if (duplicate) throw new ApiError(409, `Ce numéro CIN est déjà utilisé par ${getEmployeeFullName(duplicate)}.`);
  const id = randomUUID();
  const createdAt = nowIso().slice(0, 10);
  db.prepare(
    `INSERT INTO employees (id, first_name, last_name, phone, photo_url, poste, entry_date, status, salary, cin_number, cin_issue_date, cin_document, created_at)
     VALUES (@id, @firstName, @lastName, @phone, @photoUrl, @poste, @entryDate, @status, @salary, @cinNumber, @cinIssueDate, @cinDocument, @createdAt)`
  ).run({ id, createdAt, ...body, photoUrl: body.photoUrl ?? null, cinDocument: toJson(body.cinDocument) });
  recordActivity('Personnel', 'Création', `Employé créé — ${getEmployeeFullName(body)}`, req.user!.fullName);
  res.status(201).json(rowToEmployee({ id, created_at: createdAt, first_name: body.firstName, last_name: body.lastName, phone: body.phone,
    photo_url: body.photoUrl ?? null, poste: body.poste, entry_date: body.entryDate, status: body.status, salary: body.salary,
    cin_number: body.cinNumber, cin_issue_date: body.cinIssueDate, cin_document: toJson(body.cinDocument) }));
}));

hrRouter.put('/employees/:id', asyncHandler((req, res) => {
  const body = employeeSchema.parse(req.body);
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id) as EmployeeRow | undefined;
  if (!existing) throw notFound('Employé');
  const duplicate = getAllEmployees().find((e) => e.cinNumber === body.cinNumber && e.id !== req.params.id);
  if (duplicate) throw new ApiError(409, `Ce numéro CIN est déjà utilisé par ${getEmployeeFullName(duplicate)}.`);
  db.prepare(
    `UPDATE employees SET first_name=@firstName, last_name=@lastName, phone=@phone, photo_url=@photoUrl, poste=@poste,
     entry_date=@entryDate, status=@status, salary=@salary, cin_number=@cinNumber, cin_issue_date=@cinIssueDate, cin_document=@cinDocument
     WHERE id=@id`
  ).run({ id: req.params.id, ...body, photoUrl: body.photoUrl ?? null, cinDocument: toJson(body.cinDocument) });
  recordActivity('Personnel', 'Modification', `Employé modifié — ${getEmployeeFullName(body)}`, req.user!.fullName);
  res.json(rowToEmployee({ ...existing, first_name: body.firstName, last_name: body.lastName, cin_number: body.cinNumber }));
}));

hrRouter.delete('/employees/:id', asyncHandler((req, res) => {
  const existing = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id) as EmployeeRow | undefined;
  if (!existing) throw notFound('Employé');
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM day_records WHERE employee_id = ?').run(req.params.id);
    db.prepare('DELETE FROM recurring_plans WHERE employee_id = ?').run(req.params.id);
    db.prepare('DELETE FROM financial_records WHERE employee_id = ?').run(req.params.id);
    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  });
  tx();
  recordActivity('Personnel', 'Suppression', `Employé supprimé — ${getEmployeeFullName({ firstName: existing.first_name, lastName: existing.last_name })}`, req.user!.fullName);
  res.status(204).end();
}));

// --- Shifts (max 2, enforced) ----------------------------------------------------------------

const shiftSchema = z.object({ name: z.string().trim().min(1), startTime: z.string().min(1), endTime: z.string().min(1), description: z.string().optional() });

hrRouter.get('/shifts', asyncHandler((_req, res) => res.json(getAllShifts())));

hrRouter.post('/shifts', asyncHandler((req, res) => {
  const body = shiftSchema.parse(req.body);
  const existingShifts = getAllShifts();
  if (existingShifts.length >= MAX_SHIFTS) throw new ApiError(409, `La plateforme ne supporte que ${MAX_SHIFTS} shifts.`);
  if (body.startTime >= body.endTime) throw new ApiError(400, "L'heure de fin doit être après l'heure de début.");
  const id = randomUUID();
  const createdAt = nowIso().slice(0, 10);
  db.prepare('INSERT INTO shifts (id, name, start_time, end_time, description, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, body.name, body.startTime, body.endTime, body.description ?? null, createdAt);
  recordActivity('Personnel', 'Création', `Shift créé — ${body.name}`, req.user!.fullName);
  res.status(201).json(rowToShift({ id, name: body.name, start_time: body.startTime, end_time: body.endTime, description: body.description ?? null, created_at: createdAt }));
}));

hrRouter.put('/shifts/:id', asyncHandler((req, res) => {
  const body = shiftSchema.parse(req.body);
  const existing = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id) as ShiftRow | undefined;
  if (!existing) throw notFound('Shift');
  if (body.startTime >= body.endTime) throw new ApiError(400, "L'heure de fin doit être après l'heure de début.");
  db.prepare('UPDATE shifts SET name=?, start_time=?, end_time=?, description=? WHERE id=?').run(body.name, body.startTime, body.endTime, body.description ?? null, req.params.id);
  recordActivity('Personnel', 'Modification', `Shift modifié — ${body.name}`, req.user!.fullName);
  res.json(rowToShift({ ...existing, name: body.name, start_time: body.startTime, end_time: body.endTime, description: body.description ?? null }));
}));

hrRouter.delete('/shifts/:id', asyncHandler((req, res) => {
  const existing = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id) as ShiftRow | undefined;
  if (!existing) throw notFound('Shift');
  const usage = getAllDayRecords().filter((r) => r.shiftIds.includes(req.params.id)).length;
  if (usage > 0) throw new ApiError(409, 'Ce shift est utilisé dans le planning et ne peut pas être supprimé.');
  db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.id);
  recordActivity('Personnel', 'Suppression', `Shift supprimé — ${existing.name}`, req.user!.fullName);
  res.status(204).end();
}));

// --- Day records (manual attendance edits) ------------------------------------------------------

const dayRecordSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(['Planifié', 'Présent', 'Absent', 'Congé', 'Repos', 'Retard', 'Doublage']),
  shiftIds: z.array(z.string()),
  note: z.string().optional(),
  performedBy: z.string().min(1),
});

hrRouter.get('/day-records', asyncHandler((_req, res) => res.json(getAllDayRecords())));

hrRouter.put('/day-records', asyncHandler((req, res) => {
  const body = dayRecordSchema.parse(req.body);
  const existing = db.prepare('SELECT * FROM day_records WHERE employee_id = ? AND date = ?').get(body.employeeId, body.date) as DayRecordRow | undefined;
  const id = existing?.id ?? randomUUID();
  const updatedAt = nowIso();
  const shiftIds = ['Planifié', 'Présent', 'Retard', 'Doublage'].includes(body.status) ? body.shiftIds : [];
  db.prepare(
    `INSERT INTO day_records (id, employee_id, date, status, shift_ids, recurring_plan_id, note, updated_at, updated_by)
     VALUES (@id, @employeeId, @date, @status, @shiftIds, @recurringPlanId, @note, @updatedAt, @updatedBy)
     ON CONFLICT(id) DO UPDATE SET status=@status, shift_ids=@shiftIds, note=@note, updated_at=@updatedAt, updated_by=@updatedBy`
  ).run({ id, employeeId: body.employeeId, date: body.date, status: body.status, shiftIds: toJson(shiftIds),
    recurringPlanId: existing?.recurring_plan_id ?? null, note: body.note ?? null, updatedAt, updatedBy: body.performedBy });
  recordActivity('Personnel', 'Modification', `Présence modifiée — ${body.date} (${body.status})`, req.user!.fullName);
  res.json(rowToDayRecord({ id, employee_id: body.employeeId, date: body.date, status: body.status, shift_ids: toJson(shiftIds)!,
    recurring_plan_id: existing?.recurring_plan_id ?? null, note: body.note ?? null, updated_at: updatedAt, updated_by: body.performedBy }));
}));

hrRouter.delete('/day-records/:id', asyncHandler((req, res) => {
  const body = z.object({ scope: z.enum(['day', 'recurrence']).default('day') }).parse(req.query);
  const existing = db.prepare('SELECT * FROM day_records WHERE id = ?').get(req.params.id) as DayRecordRow | undefined;
  if (!existing) throw notFound('Jour de planning');
  const tx = db.transaction(() => {
    if (body.scope === 'recurrence' && existing.recurring_plan_id) {
      db.prepare('DELETE FROM day_records WHERE recurring_plan_id = ?').run(existing.recurring_plan_id);
      db.prepare('DELETE FROM recurring_plans WHERE id = ?').run(existing.recurring_plan_id);
    } else {
      db.prepare('DELETE FROM day_records WHERE id = ?').run(req.params.id);
    }
  });
  tx();
  recordActivity('Personnel', 'Suppression', `Jour(s) de planning supprimé(s) — ${existing.date}`, req.user!.fullName);
  res.status(204).end();
}));

// --- Recurring planning (expands a weekly pattern into day records) -----------------------------

const weeklyDayConfigSchema = z.object({ dayType: z.enum(['Travail', 'Repos']), shiftIds: z.array(z.string()) });
const weeklyPatternSchema = z.object({ mon: weeklyDayConfigSchema, tue: weeklyDayConfigSchema, wed: weeklyDayConfigSchema, thu: weeklyDayConfigSchema, fri: weeklyDayConfigSchema, sat: weeklyDayConfigSchema, sun: weeklyDayConfigSchema });

const planningSchema = z.object({
  employeeId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  weeklyPattern: weeklyPatternSchema,
  performedBy: z.string().min(1),
  isRecurring: z.boolean().default(true),
});

hrRouter.get('/recurring-plans', asyncHandler((_req, res) => {
  res.json((db.prepare('SELECT * FROM recurring_plans').all() as RecurringPlanRow[]).map(rowToRecurringPlan));
}));

hrRouter.post('/planning', asyncHandler((req, res) => {
  const body = planningSchema.parse(req.body);
  const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(body.employeeId);
  if (!employee) throw new ApiError(400, 'Employé invalide.');

  const tx = db.transaction(() => {
    let planId: string | undefined;
    let plan: RecurringPlan | null = null;
    if (body.isRecurring) {
      planId = randomUUID();
      const createdAt = nowIso();
      db.prepare('INSERT INTO recurring_plans (id, employee_id, start_date, end_date, weekly_pattern, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        planId, body.employeeId, body.startDate, body.endDate, toJson(body.weeklyPattern), createdAt, body.performedBy
      );
      plan = rowToRecurringPlan({ id: planId, employee_id: body.employeeId, start_date: body.startDate, end_date: body.endDate, weekly_pattern: toJson(body.weeklyPattern)!, created_at: createdAt, created_by: body.performedBy });
    }
    const records = buildDayRecordsFromPattern(body.employeeId, body.weeklyPattern, body.startDate, body.endDate, body.performedBy, planId, getAllDayRecords());
    records.forEach((r) => {
      db.prepare(
        `INSERT INTO day_records (id, employee_id, date, status, shift_ids, recurring_plan_id, note, updated_at, updated_by)
         VALUES (@id, @employeeId, @date, @status, @shiftIds, @recurringPlanId, NULL, @updatedAt, @updatedBy)
         ON CONFLICT(id) DO UPDATE SET status=@status, shift_ids=@shiftIds, recurring_plan_id=@recurringPlanId, updated_at=@updatedAt, updated_by=@updatedBy`
      ).run({ id: r.id, employeeId: r.employeeId, date: r.date, status: r.status, shiftIds: toJson(r.shiftIds), recurringPlanId: planId ?? null, updatedAt: r.updatedAt, updatedBy: r.updatedBy });
    });
    return { plan, dayRecords: getAllDayRecords() };
  });

  const result = tx();
  recordActivity('Personnel', 'Planification', `Planning ${body.isRecurring ? 'récurrent' : 'ponctuel'} créé — employé ${body.employeeId}`, req.user!.fullName);
  res.status(201).json(result);
}));

// --- Financial records ---------------------------------------------------------------------------

const financialSchema = z.object({
  employeeId: z.string().min(1),
  periodMonthIndex: z.number().min(0).max(11),
  periodYear: z.number().min(2000),
  baseSalary: z.number().min(0),
  advances: z.number().min(0).default(0),
  bonuses: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  paymentDate: z.string().optional(),
});

hrRouter.get('/financial-records', asyncHandler((_req, res) => {
  res.json((db.prepare('SELECT * FROM financial_records').all() as FinancialRow[]).map(rowToFinancial));
}));

hrRouter.post('/financial-records', asyncHandler((req, res) => {
  const body = financialSchema.parse(req.body);
  const duplicate = db.prepare('SELECT id FROM financial_records WHERE employee_id = ? AND period_month_index = ? AND period_year = ?').get(body.employeeId, body.periodMonthIndex, body.periodYear);
  if (duplicate) throw new ApiError(409, 'Un suivi financier existe déjà pour cet employé sur cette période.');
  const id = randomUUID();
  const createdAt = nowIso();
  db.prepare(
    `INSERT INTO financial_records (id, employee_id, period_month_index, period_year, base_salary, advances, bonuses, deductions, amount_paid, payment_date, created_at)
     VALUES (@id, @employeeId, @periodMonthIndex, @periodYear, @baseSalary, @advances, @bonuses, @deductions, @amountPaid, @paymentDate, @createdAt)`
  ).run({ id, createdAt, ...body, paymentDate: body.paymentDate ?? null });
  recordActivity('Personnel', 'Création', `Suivi financier créé — employé ${body.employeeId}`, req.user!.fullName);
  res.status(201).json(rowToFinancial({ id, employee_id: body.employeeId, period_month_index: body.periodMonthIndex, period_year: body.periodYear,
    base_salary: body.baseSalary, advances: body.advances, bonuses: body.bonuses, deductions: body.deductions, amount_paid: body.amountPaid,
    payment_date: body.paymentDate ?? null, created_at: createdAt }));
}));

hrRouter.put('/financial-records/:id', asyncHandler((req, res) => {
  const body = financialSchema.parse(req.body);
  const existing = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(req.params.id) as FinancialRow | undefined;
  if (!existing) throw notFound('Suivi financier');
  db.prepare(
    `UPDATE financial_records SET base_salary=@baseSalary, advances=@advances, bonuses=@bonuses, deductions=@deductions,
     amount_paid=@amountPaid, payment_date=@paymentDate WHERE id=@id`
  ).run({ id: req.params.id, ...body, paymentDate: body.paymentDate ?? null });
  recordActivity('Personnel', 'Modification', `Suivi financier modifié — employé ${body.employeeId}`, req.user!.fullName);
  res.json(rowToFinancial({ ...existing, base_salary: body.baseSalary, amount_paid: body.amountPaid, payment_date: body.paymentDate ?? null }));
}));

hrRouter.delete('/financial-records/:id', asyncHandler((req, res) => {
  const existing = db.prepare('SELECT * FROM financial_records WHERE id = ?').get(req.params.id) as FinancialRow | undefined;
  if (!existing) throw notFound('Suivi financier');
  db.prepare('DELETE FROM financial_records WHERE id = ?').run(req.params.id);
  recordActivity('Personnel', 'Suppression', `Suivi financier supprimé — employé ${existing.employee_id}`, req.user!.fullName);
  res.status(204).end();
}));
