import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { ApiError } from './errors.js';

export interface AuthedUser {
  id: string;
  fullName: string;
  cin: string;
  roleId: string;
  roleName: string;
  // Super Admin (the one is_system role) always passes every requirePermission check regardless
  // of what's actually stored in role_permissions — see requirePermission below. That's what lets
  // the permission catalog grow over time without ever re-syncing Super Admin's stored grants.
  isSuperAdmin: boolean;
  permissions: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
      sessionToken?: string;
    }
  }
}

interface SessionRow {
  user_id: string;
}

interface UserWithRoleRow {
  id: string;
  full_name: string;
  cin: string;
  role_id: string | null;
  role_name: string | null;
  is_system: number | null;
}

interface PermissionRow {
  permission_key: string;
}

export const SESSION_COOKIE = 'session';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[SESSION_COOKIE] ?? '';
  if (!token) throw new ApiError(401, 'Authentification requise.');

  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ? AND revoked_at IS NULL').get(token) as SessionRow | undefined;
  if (!session) throw new ApiError(401, 'Session invalide ou expirée.');

  const user = db
    .prepare(
      `SELECT u.id, u.full_name, u.cin, u.role_id, r.name AS role_name, r.is_system
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`
    )
    .get(session.user_id) as UserWithRoleRow | undefined;
  if (!user) throw new ApiError(401, 'Session invalide ou expirée.');

  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(new Date().toISOString(), token);

  const isSuperAdmin = user.is_system === 1;
  const permissions = user.role_id
    ? (db.prepare('SELECT permission_key FROM role_permissions WHERE role_id = ?').all(user.role_id) as PermissionRow[]).map((r) => r.permission_key)
    : [];

  req.user = {
    id: user.id,
    fullName: user.full_name,
    cin: user.cin,
    roleId: user.role_id ?? '',
    roleName: user.role_name ?? '',
    isSuperAdmin,
    permissions,
  };
  req.sessionToken = token;
  next();
};

// Gates a route to users whose role carries `key` (or who are Super Admin, which always bypasses
// this check — see AuthedUser.isSuperAdmin). Enforced here, server-side, on every matching
// request: the frontend hiding a button or menu item is a UX nicety, not the actual gate — this
// middleware is. Must run after requireAuth (needs req.user populated).
export const requirePermission = (key: string) => (req: Request, _res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'Authentification requise.');
  if (user.isSuperAdmin || user.permissions.includes(key)) {
    next();
    return;
  }
  throw new ApiError(403, "Vous n'avez pas la permission d'effectuer cette action.");
};
