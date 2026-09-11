import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'cafenoir.sqlite3');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// One-time, idempotent migration: the `sessions` table gained device/location/revocation columns
// after the original minimal schema shipped. CREATE TABLE IF NOT EXISTS above is a no-op on an
// existing database, so any database created before this change needs these columns added here.
const sessionColumns = new Set((db.pragma('table_info(sessions)') as { name: string }[]).map((c) => c.name));
const addSessionColumn = (name: string, ddl: string) => {
  if (!sessionColumns.has(name)) db.exec(`ALTER TABLE sessions ADD COLUMN ${ddl}`);
};
addSessionColumn('public_id', 'public_id TEXT');
addSessionColumn('ip_address', 'ip_address TEXT');
addSessionColumn('user_agent', 'user_agent TEXT');
addSessionColumn('device_label', 'device_label TEXT');
addSessionColumn('location', 'location TEXT');
addSessionColumn('last_seen_at', 'last_seen_at TEXT');
addSessionColumn('revoked_at', 'revoked_at TEXT');
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_public_id ON sessions(public_id)');

// Backfill public_id for any session rows created before that column existed.
const rowsNeedingPublicId = db.prepare('SELECT token FROM sessions WHERE public_id IS NULL').all() as { token: string }[];
if (rowsNeedingPublicId.length > 0) {
  const assignPublicId = db.prepare('UPDATE sessions SET public_id = ? WHERE token = ?');
  rowsNeedingPublicId.forEach((row) => assignPublicId.run(randomUUID(), row.token));
}

// Sessions created before the device/IP/location capture above existed have no way to ever gain
// that data retroactively, and would otherwise sit in "Sessions actives" forever showing
// "Inconnue" for everything. A session only ever has a NULL ip_address if it predates this
// feature (a freshly created one always gets a real value, even '' is never stored as NULL), so
// this one-time, idempotent cleanup revokes exactly those — the next login captures full details.
db.prepare(
  "UPDATE sessions SET revoked_at = ? WHERE ip_address IS NULL AND revoked_at IS NULL"
).run(new Date().toISOString());
