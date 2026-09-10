import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { asyncHandler, ApiError } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';

interface UserRow {
  id: string;
  full_name: string;
  cin: string;
}

const CIN_PATTERN = /^\d{8}$/;
const loginSchema = z.object({ cin: z.string().regex(CIN_PATTERN, 'Le numéro CIN doit comporter 8 chiffres.') });

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler((req, res) => {
    const { cin } = loginSchema.parse(req.body);
    const user = db.prepare('SELECT id, full_name, cin FROM users WHERE cin = ?').get(cin) as UserRow | undefined;
    if (!user) throw new ApiError(401, 'Numéro CIN incorrect.');

    const token = randomUUID();
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, user.id, new Date().toISOString());

    res.json({ token, user: { id: user.id, fullName: user.full_name, cin: user.cin } });
  })
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler((req, res) => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
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
