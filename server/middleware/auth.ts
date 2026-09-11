import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/connection.js';
import { ApiError } from './errors.js';

export interface AuthedUser {
  id: string;
  fullName: string;
  cin: string;
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

interface UserRow {
  id: string;
  full_name: string;
  cin: string;
}

export const SESSION_COOKIE = 'session';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies?.[SESSION_COOKIE] ?? '';
  if (!token) throw new ApiError(401, 'Authentification requise.');

  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ? AND revoked_at IS NULL').get(token) as SessionRow | undefined;
  if (!session) throw new ApiError(401, 'Session invalide ou expirée.');

  const user = db.prepare('SELECT id, full_name, cin FROM users WHERE id = ?').get(session.user_id) as UserRow | undefined;
  if (!user) throw new ApiError(401, 'Session invalide ou expirée.');

  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(new Date().toISOString(), token);

  req.user = { id: user.id, fullName: user.full_name, cin: user.cin };
  req.sessionToken = token;
  next();
};
