import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';
import { requireAuth, SESSION_COOKIE } from '../middleware/auth.js';

interface UserRow {
  id: string;
  full_name: string;
  cin: string;
}

const CIN_PATTERN = /^\d{8}$/;
const loginSchema = z.object({ cin: z.string().regex(CIN_PATTERN, 'Le numéro CIN doit comporter 8 chiffres.') });

const isProd = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler((req, res) => {
    const { cin } = loginSchema.parse(req.body);
    const user = db.prepare('SELECT id, full_name, cin FROM users WHERE cin = ?').get(cin) as UserRow | undefined;
    if (!user) throw new ApiError(401, 'Numéro CIN incorrect.');

    const token = randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, user.id, new Date().toISOString());

    // The session credential lives only in an httpOnly cookie — never in the JSON body or any
    // JS-readable storage — so it can't be read or exfiltrated by an XSS payload.
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_MS,
    });
    res.json({ user: { id: user.id, fullName: user.full_name, cin: user.cin } });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler((req, res) => {
    const token = req.cookies?.[SESSION_COOKIE] ?? '';
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler((req, res) => {
    res.json({ user: req.user });
  })
);
