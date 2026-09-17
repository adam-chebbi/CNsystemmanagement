import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Role, DraftRole, RbacUser, DraftUser, PermissionModuleGroup } from '../data/rbacModel';

export const getPermissionCatalog = () => apiGet<{ groups: PermissionModuleGroup[] }>('/permissions');

export const getRoles = () => apiGet<Role[]>('/roles');
export const createRole = (role: Pick<DraftRole, 'name' | 'description' | 'permissions'>) => apiPost<Role>('/roles', role);
export const updateRole = (id: string, role: Partial<Pick<DraftRole, 'name' | 'description' | 'permissions'>>) => apiPut<Role>(`/roles/${id}`, role);
export const deleteRole = (id: string) => apiDelete<void>(`/roles/${id}`);

export const getRbacUsers = () => apiGet<RbacUser[]>('/users');
// No email service exists to deliver a password, so creating an account always returns a
// system-generated temporary password once, in this response only — never persisted in plain text
// and never retrievable again afterwards (see server/routes/roles.ts).
export const createRbacUser = (user: Pick<DraftUser, 'fullName' | 'cin' | 'email' | 'phone' | 'roleId'>) =>
  apiPost<RbacUser & { temporaryPassword: string }>('/users', user);
export const updateRbacUser = (id: string, user: Partial<Pick<DraftUser, 'fullName' | 'email' | 'phone' | 'roleId'>>) =>
  apiPut<RbacUser>(`/users/${id}`, user);
export const deleteRbacUser = (id: string) => apiDelete<void>(`/users/${id}`);
export const resetRbacUserPassword = (id: string) => apiPost<{ temporaryPassword: string }>(`/users/${id}/reset-password`);
