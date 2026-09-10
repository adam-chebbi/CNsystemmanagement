import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Employee, Shift, DayRecord, RecurringPlan, FinancialRecord, AttendanceStatus, WeeklyPattern } from '../data/hrModel';

export const getEmployees = () => apiGet<Employee[]>('/hr/employees');
export const createEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => apiPost<Employee>('/hr/employees', employee);
export const updateEmployee = (id: string, employee: Omit<Employee, 'id' | 'createdAt'>) => apiPut<Employee>(`/hr/employees/${id}`, employee);
export const deleteEmployee = (id: string) => apiDelete<void>(`/hr/employees/${id}`);

export const getShifts = () => apiGet<Shift[]>('/hr/shifts');
export const createShift = (shift: Omit<Shift, 'id' | 'createdAt'>) => apiPost<Shift>('/hr/shifts', shift);
export const updateShift = (id: string, shift: Omit<Shift, 'id' | 'createdAt'>) => apiPut<Shift>(`/hr/shifts/${id}`, shift);
export const deleteShift = (id: string) => apiDelete<void>(`/hr/shifts/${id}`);

export const getDayRecords = () => apiGet<DayRecord[]>('/hr/day-records');
export const setDayRecord = (input: { employeeId: string; date: string; status: AttendanceStatus; shiftIds: string[]; note?: string; performedBy: string }) =>
  apiPut<DayRecord>('/hr/day-records', input);
export const deleteDayRecord = (id: string, scope: 'day' | 'recurrence' = 'day') => apiDelete<void>(`/hr/day-records/${id}?scope=${scope}`);

export const getRecurringPlans = () => apiGet<RecurringPlan[]>('/hr/recurring-plans');
export const saveRecurringPlanning = (input: { employeeId: string; startDate: string; endDate: string; weeklyPattern: WeeklyPattern; performedBy: string; isRecurring: boolean }) =>
  apiPost<{ plan: RecurringPlan | null; dayRecords: DayRecord[] }>('/hr/planning', input);

export const getFinancialRecords = () => apiGet<FinancialRecord[]>('/hr/financial-records');
export const createFinancialRecord = (record: Omit<FinancialRecord, 'id' | 'createdAt'>) => apiPost<FinancialRecord>('/hr/financial-records', record);
export const updateFinancialRecord = (id: string, record: Omit<FinancialRecord, 'id' | 'createdAt'>) => apiPut<FinancialRecord>(`/hr/financial-records/${id}`, record);
export const deleteFinancialRecord = (id: string) => apiDelete<void>(`/hr/financial-records/${id}`);
