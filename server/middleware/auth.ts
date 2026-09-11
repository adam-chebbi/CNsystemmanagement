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

  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token) as SessionRow | undefined;
  if (!session) throw new ApiError(401, 'Session invalide ou expirée.');

  const user = db.prepare('SELECT id, full_name, cin FROM users WHERE id = ?').get(session.user_id) as UserRow | undefined;
  if (!user) throw new ApiError(401, 'Session invalide ou expirée.');

  req.user = { id: user.id, fullName: user.full_name, cin: user.cin };
  next();
};
