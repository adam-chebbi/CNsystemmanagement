import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_DATA_DIR, openDatabase } from './db/connection.js';
import { createApp } from './app.js';

// Business dates ("journée du 12 octobre", the 5 a.m. cutoff) are Tunisian local time whatever the
// VM's own timezone is.
process.env.TZ = process.env.TZ || 'Africa/Tunis';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.HISTORIQUE_DB_PATH || path.join(DEFAULT_DATA_DIR, 'historique.sqlite3');
const db = openDatabase(dbPath);

const { app } = createApp({
  db,
  auth: {
    mainAppUrl: process.env.MAIN_APP_URL || 'http://127.0.0.1:4000',
    sessionCookie: process.env.MAIN_SESSION_COOKIE || 'session',
  },
  uploadsDir: path.join(path.dirname(dbPath), 'uploads'),
  distDir: path.join(__dirname, '..', 'dist'),
});

const port = Number(process.env.PORT) || 4100;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Historique & Comptage API on http://localhost:${port} (base : ${dbPath})`);
});
