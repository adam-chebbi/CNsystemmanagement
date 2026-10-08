import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Db } from './db/connection.js';
import { csrfProtection, ensureCsrfCookie, errorMiddleware } from './lib/http.js';
import { createMainAuth, type MainAuthConfig } from './lib/mainAuth.js';
import { createStore } from './lib/store.js';
import { authRouter } from './routes/auth.js';
import { entriesRouter } from './routes/entries.js';
import { journeesRouter } from './routes/journees.js';
import { miscRouter } from './routes/misc.js';
import { notesRouter } from './routes/notes.js';

export interface AppOptions {
  db: Db;
  auth: MainAuthConfig;
  uploadsDir: string;
  distDir?: string;
}

// Built as a factory (rather than at import time) so the tests can spin up the whole app against a
// throwaway database and a fake "main app" auth server.
export const createApp = ({ db, auth: authConfig, uploadsDir, distDir }: AppOptions) => {
  const store = createStore(db);
  const auth = createMainAuth(authConfig);
  const app = express();

  app.set('trust proxy', 'loopback');
  app.disable('x-powered-by');
  // Receipt photos travel as base64 data URLs (resized client-side first), hence the higher limit.
  app.use(express.json({ limit: '8mb' }));
  app.use(cookieParser());
  app.use(ensureCsrfCookie);
  app.use('/api', csrfProtection);
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });
  app.use('/api/auth', authRouter(auth, store));

  // Everything below requires a valid main-app session carrying historique:access.
  app.use('/api', auth.requireUser);
  app.use('/api', journeesRouter(store));
  app.use('/api', entriesRouter(store));
  app.use('/api', notesRouter(store));
  app.use('/api', miscRouter(store, uploadsDir));
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { message: 'Route inconnue.' } });
  });
  app.use(errorMiddleware);

  if (distDir && fs.existsSync(distDir)) {
    app.use(express.static(distDir, { index: false }));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  return { app, store };
};
