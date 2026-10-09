import fs from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { Db } from './db/connection.js';
import { csrfProtection, ensureCsrfCookie, errorMiddleware } from './lib/http.js';
import { createMainAuth, type MainAuthConfig } from './lib/mainAuth.js';
import { createStore } from './lib/store.js';
import { authRouter } from './routes/auth.js';
import { caisseRouter } from './routes/caisse.js';

export interface AppOptions {
  db: Db;
  auth: MainAuthConfig;
  distDir?: string;
}

// Built as a factory (rather than at import time) so the tests can spin up the whole app against a
// throwaway database and a fake "main app" auth server.
export const createApp = ({ db, auth: authConfig, distDir }: AppOptions) => {
  const store = createStore(db);
  const auth = createMainAuth(authConfig);
  const app = express();

  app.set('trust proxy', 'loopback');
  app.disable('x-powered-by');
  // Set here rather than in nginx: in production the Cloudflare tunnel reaches this process directly.
  app.use((_req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '200kb' }));
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
  app.use('/api', caisseRouter(store));
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
