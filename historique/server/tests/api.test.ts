import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import cookieParser from 'cookie-parser';
import express from 'express';
import { createApp } from '../app.ts';
import { openDatabase } from '../db/connection.ts';
import { addDays } from '../../shared/model.ts';

// End-to-end: the real Historique app on a throwaway database, talking to a fake "main app" that
// implements just the four /api/auth routes Historique relies on.

process.env.TZ = 'Africa/Tunis';

interface FakeUser {
  id: string;
  fullName: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: string[];
  mustChangePassword: boolean;
  password: string;
}

const USERS: Record<string, FakeUser> = {
  gerant: { id: 'u-gerant', fullName: 'Sami Gérant', roleName: 'Gérant', isSuperAdmin: false, permissions: ['historique:access'], mustChangePassword: false, password: 'secret1' },
  gerant2: { id: 'u-gerant2', fullName: 'Ines Gérante', roleName: 'Gérant', isSuperAdmin: false, permissions: ['historique:access'], mustChangePassword: false, password: 'secret2' },
  patron: { id: 'u-patron', fullName: 'Le Patron', roleName: 'Super Admin', isSuperAdmin: true, permissions: [], mustChangePassword: false, password: 'secret3' },
  caissier: { id: 'u-caissier', fullName: 'Caissier', roleName: 'Compte Saisie', isSuperAdmin: false, permissions: ['sales:create'], mustChangePassword: false, password: 'secret4' },
};

const sessions = new Map<string, string>(); // token -> user key
const revoked: string[] = [];
let mainServer: ReturnType<express.Express['listen']>;
let appServer: ReturnType<express.Express['listen']>;
let baseUrl = '';
let tmpDir = '';
let testDb: ReturnType<typeof openDatabase>;

const startFakeMain = () => {
  const main = express();
  main.use(express.json());
  main.use(cookieParser());
  const csrfOk = (req: express.Request) => req.cookies.csrf_token && req.cookies.csrf_token === req.get('x-csrf-token');
  main.post('/api/auth/login', (req, res) => {
    if (!csrfOk(req)) return res.status(403).json({ error: { message: 'CSRF' } });
    const key = Object.keys(USERS).find((k) => k === req.body.identifier);
    if (!key || USERS[key].password !== req.body.password) return res.status(401).json({ error: { message: 'Identifiant ou mot de passe incorrect.' } });
    const token = `tok-${key}-${Math.random().toString(36).slice(2)}`;
    sessions.set(token, key);
    res.cookie('session', token, { httpOnly: true, path: '/' });
    const { password: _p, ...user } = USERS[key];
    res.json({ user });
  });
  main.get('/api/auth/me', (req, res) => {
    const key = sessions.get(req.cookies.session);
    if (!key) return res.status(401).json({ error: { message: 'no' } });
    const { password: _p, ...user } = USERS[key];
    res.json({ user });
  });
  main.post('/api/auth/logout', (req, res) => {
    if (!csrfOk(req)) return res.status(403).json({ error: { message: 'CSRF' } });
    revoked.push(req.cookies.session);
    sessions.delete(req.cookies.session);
    res.clearCookie('session', { path: '/' });
    res.status(204).end();
  });
  main.post('/api/auth/change-password', (_req, res) => res.status(204).end());
  return new Promise<void>((resolve) => {
    mainServer = main.listen(0, () => resolve());
  });
};

class Client {
  cookies = new Map<string, string>();
  async req(method: string, url: string, body?: unknown, opts: { csrf?: boolean } = {}) {
    const headers: Record<string, string> = {};
    if (this.cookies.size) headers.cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (method !== 'GET' && opts.csrf !== false && this.cookies.get('csrf_token')) headers['x-csrf-token'] = this.cookies.get('csrf_token')!;
    const res = await fetch(`${baseUrl}${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    res.headers.getSetCookie().forEach((c) => {
      const [pair, ...attrs] = c.split(';');
      const [k, v] = pair.split('=');
      if (attrs.some((a) => /expires=thu, 01 jan 1970/i.test(a.trim())) || v === '') this.cookies.delete(k);
      else this.cookies.set(k, v);
    });
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = text;
    }
    return { status: res.status, body: json };
  }
  async login(key: string) {
    await this.req('GET', '/api/health');
    return this.req('POST', '/api/auth/login', { identifier: key, password: USERS[key].password });
  }
}

let today = '';
const gerant = new Client();
const gerant2 = new Client();
const patron = new Client();

before(async () => {
  await startFakeMain();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'historique-test-'));
  testDb = openDatabase(path.join(tmpDir, 'test.sqlite3'));
  const { app } = createApp({
    db: testDb,
    auth: { mainAppUrl: `http://127.0.0.1:${(mainServer.address() as AddressInfo).port}`, sessionCookie: 'session', cacheTtlMs: 0 },
  });
  await new Promise<void>((resolve) => {
    appServer = app.listen(0, () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(appServer.address() as AddressInfo).port}`;
  assert.equal((await gerant.login('gerant')).status, 200);
  assert.equal((await gerant2.login('gerant2')).status, 200);
  assert.equal((await patron.login('patron')).status, 200);
  today = (await gerant.req('GET', '/api/auth/me')).body.businessDate;
});

after(() => {
  appServer?.close();
  mainServer?.close();
  testDb?.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('unauthenticated requests are refused', async () => {
  const anon = new Client();
  assert.equal((await anon.req('GET', `/api/journees/${today}`)).status, 401);
});

test('a valid main-app account WITHOUT historique:access cannot get in, and its session is revoked', async () => {
  const c = new Client();
  const res = await c.login('caissier');
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'NO_ACCESS');
  assert.equal(c.cookies.has('session'), false);
  assert.equal(revoked.some((t) => t.startsWith('tok-caissier')), true);
});

test('wrong password is relayed as 401 and logged', async () => {
  const c = new Client();
  await c.req('GET', '/api/health');
  const res = await c.req('POST', '/api/auth/login', { identifier: 'gerant', password: 'nope' });
  assert.equal(res.status, 401);
});

test('mutations without the CSRF header are refused', async () => {
  const res = await gerant.req('PUT', `/api/caisse/${today}/matin`, { ca: 1000, depenses: [], tpe: 0, ticketsResto: 0 }, { csrf: false });
  assert.equal(res.status, 403);
});

test('the terminal knows its first day and today', async () => {
  const meta = (await gerant.req('GET', '/api/caisse/meta')).body;
  assert.equal(meta.today, today);
  assert.ok(meta.dateDebut <= today);
});

test('a service: CA − dépenses = caisse; TPE and tickets entered, espèces = the rest', async () => {
  const body = {
    ca: 450000,
    depenses: [
      { libelle: 'Lait', montant: 12500 },
      { libelle: 'Pain', montant: 7500 },
    ],
    tpe: 120000,
    ticketsResto: 35000,
  };
  const res = await gerant.req('PUT', `/api/caisse/${today}/matin`, body);
  assert.equal(res.status, 200);
  assert.equal(res.body.item.totalDepenses, 20000);
  assert.equal(res.body.item.attenduCaisse, 430000);
  assert.equal(res.body.item.especes, 430000 - 120000 - 35000);
  assert.equal(res.body.item.creeParNom, 'Sami Gérant');

  // Saving again corrects the same service — never a duplicate — and keeps who corrected it.
  const fix = await gerant2.req('PUT', `/api/caisse/${today}/matin`, { ...body, tpe: 100000 });
  assert.equal(fix.body.item.especes, 430000 - 100000 - 35000);
  assert.equal(fix.body.item.majParNom, 'Ines Gérante');
  const day = (await gerant.req('GET', `/api/caisse/${today}`)).body;
  assert.equal(day.items.length, 1);
  assert.equal(day.canWrite, true);

  // The evening service is separate.
  assert.equal((await gerant.req('PUT', `/api/caisse/${today}/soir`, { ca: 300000, depenses: [], tpe: 0, ticketsResto: 0 })).body.item.especes, 300000);
  assert.equal((await gerant.req('GET', `/api/caisse/${today}`)).body.items.length, 2);
});

test('impossible amounts are refused with a plain message', async () => {
  const bad = async (body: object) => (await gerant.req('PUT', `/api/caisse/${today}/matin`, body)).body.error.message as string;
  assert.match(await bad({ ca: 0, depenses: [], tpe: 0, ticketsResto: 0 }), /chiffre d'affaires/);
  assert.match(await bad({ ca: 10000, depenses: [{ libelle: 'Gaz', montant: 20000 }], tpe: 0, ticketsResto: 0 }), /dépassent le chiffre/);
  assert.match(await bad({ ca: 10000, depenses: [], tpe: 8000, ticketsResto: 5000 }), /TPE et les tickets/);
  assert.match(await bad({ ca: 10000, depenses: [{ libelle: '', montant: 1000 }], tpe: 0, ticketsResto: 0 }), /à quoi correspond/);
  assert.equal((await gerant.req('PUT', `/api/caisse/${today}/nuit`, { ca: 1, depenses: [], tpe: 0, ticketsResto: 0 })).status, 400);
});

test('no entry on a future date nor before the app existed; old days are read-only for a Gérant', async () => {
  const ok = { ca: 1000, depenses: [], tpe: 0, ticketsResto: 0 };
  assert.equal((await gerant.req('PUT', `/api/caisse/${addDays(today, 1)}/matin`, ok)).status, 403);
  const meta = (await gerant.req('GET', '/api/caisse/meta')).body;
  assert.equal((await patron.req('PUT', `/api/caisse/${addDays(meta.dateDebut, -1)}/matin`, ok)).status, 403);
});

test('history lists every saved service with the period totals', async () => {
  const h = (await gerant.req('GET', `/api/caisse?from=${today}&to=${today}`)).body;
  assert.equal(h.items.length, 2);
  assert.equal(h.items[0].shift, 'soir');
  assert.equal(h.totals.ca, 750000);
  assert.equal(h.totals.especes, 295000 + 300000);
  assert.equal(h.totals.tpe, 100000);
});

test('every save is kept in the audit trail with the previous values', async () => {
  const rows = testDb.prepare("SELECT action, details FROM activity_log WHERE module = 'caisse' ORDER BY timestamp").all() as { action: string; details: string }[];
  assert.deepEqual(
    rows.map((r) => r.action),
    ['creation', 'modification', 'creation']
  );
  assert.equal(JSON.parse(rows[1].details).avant.tpe, 120000);
});

test('logout revokes the main-app session', async () => {
  const c = new Client();
  await c.login('gerant2');
  assert.equal((await c.req('POST', '/api/auth/logout')).status, 204);
  assert.equal((await c.req('GET', `/api/journees/${today}`)).status, 401);
});
