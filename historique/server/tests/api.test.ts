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
    uploadsDir: path.join(tmpDir, 'uploads'),
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
  const res = await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Café', modePaiement: 'especes', montant: 1000 }, { csrf: false });
  assert.equal(res.status, 403);
});

test('a full day: sales, expenses, movements, Z, blind counts, closing, lock, reopen, validate', async () => {
  // Opening float: the previous day was never closed, so the default float applies.
  const v1 = await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Café & boissons chaudes', modePaiement: 'especes', montant: 45000 });
  assert.equal(v1.status, 201);
  await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Restauration / cuisine', modePaiement: 'tpe', montant: 30000 });
  await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Restauration / cuisine', modePaiement: 'ticket_resto', montant: 10000 });
  const credit = await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Café & boissons chaudes', modePaiement: 'credit', montant: 6000 });
  assert.equal(credit.status, 400, 'credit sale needs a client name');
  await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Café & boissons chaudes', modePaiement: 'credit', montant: 6000, client: 'Hédi' });

  const bigNoReceipt = await gerant.req('POST', '/api/depenses', { date: today, categorie: 'Divers', modePaiement: 'especes_caisse', montant: 80000, justificatif: 'non' });
  assert.equal(bigNoReceipt.status, 400, 'large cash expense without receipt needs a description');
  const dep = await gerant.req('POST', '/api/depenses', { date: today, categorie: 'Fruits & légumes', modePaiement: 'especes_caisse', montant: 12500, justificatif: 'a_fournir', beneficiaire: 'Marché' });
  assert.equal(dep.status, 201);
  await gerant.req('POST', '/api/mouvements', { date: today, type: 'retrait_proprietaire', montant: 20000, personne: 'Patron' });
  await gerant.req('POST', '/api/mouvements', { date: today, type: 'encaissement_credit', montant: 2000, personne: 'hedi' });

  let day = (await gerant.req('GET', `/api/journees/${today}`)).body;
  assert.equal(day.journee.statut, 'ouverte');
  // default float 100 DT + 45 cash sales + 2 credit repaid − 20 withdrawal − 12.5 expense
  assert.equal(day.summary.especesAttendues, 100000 + 45000 + 2000 - 20000 - 12500);

  // Z with a breakdown that doesn't add up and no note → refused.
  const badZ = await gerant.req('PUT', `/api/journees/${today}/ca`, { total: 95000, especes: 45000, tpe: 30000, ticketsResto: 10000 });
  assert.equal(badZ.status, 400);
  const z = await gerant.req('PUT', `/api/journees/${today}/ca`, { total: 91000, especes: 45000, tpe: 30000, ticketsResto: 10000, credit: 6000, nbTickets: 52 });
  assert.equal(z.status, 200);
  assert.equal(z.body.summary.source, 'ca');

  // Closing is blocked until the counts are done.
  const early = await gerant.req('POST', `/api/journees/${today}/cloture`, { fondLaisse: 100000 });
  assert.equal(early.status, 400);
  assert.equal(early.body.error.code, 'CLOTURE_INCOMPLETE');

  // Blind cash count: 5 DT short → preview reveals it, saving needs a justification.
  const count = {
    date: today,
    type: 'especes',
    moment: 'cloture',
    details: {
      denominations: [
        { key: 'b50', quantite: 2 },
        { key: 'b10', quantite: 1 },
      ],
      vrac: 0,
    },
  };
  const preview = await gerant.req('POST', '/api/comptages/preview', count);
  assert.equal(preview.body.totalAttendu, 114500);
  assert.equal(preview.body.ecart, 110000 - 114500);
  assert.equal(preview.body.justificationRequise, true);
  const noJustif = await gerant.req('POST', '/api/comptages', count);
  assert.equal(noJustif.body.error.code, 'JUSTIFICATION_REQUISE');
  assert.equal((await gerant.req('POST', '/api/comptages', { ...count, justification: 'Erreur de rendu monnaie client table 4' })).status, 201);
  assert.equal(
    (await gerant.req('POST', '/api/comptages', { date: today, type: 'tickets_resto', moment: 'cloture', details: { tickets: [{ emetteur: 'Pluxee', valeur: 5000, quantite: 2 }] } })).status,
    201
  );
  assert.equal((await gerant.req('POST', '/api/comptages', { date: today, type: 'tpe', moment: 'cloture', details: { tpe: [{ terminal: 'TPE principal', montant: 30000, nbTransactions: 4 }] } })).status, 201);

  // fond laissé + remis must equal the counted cash.
  const badSplit = await gerant.req('POST', `/api/journees/${today}/cloture`, { fondLaisse: 100000, montantRemis: 5000, remisA: 'Patron' });
  assert.equal(badSplit.body.error.code, 'REPARTITION_ESPECES');
  const closed = await gerant.req('POST', `/api/journees/${today}/cloture`, { fondLaisse: 100000, montantRemis: 10000, remisA: 'Patron', noteCloture: 'RAS' });
  assert.equal(closed.status, 200);
  assert.equal(closed.body.journee.statut, 'cloturee');
  assert.equal(closed.body.canWrite, false);

  // Locked for everyone.
  const late = await gerant.req('POST', '/api/ventes', { date: today, categorie: 'Café', modePaiement: 'especes', montant: 1000 });
  assert.equal(late.status, 423);
  // ...but a receipt can still be attached the next day.
  const upload = await gerant.req('POST', '/api/fichiers', { dataUrl: `data:image/png;base64,${Buffer.from('fakepng').toString('base64')}` });
  assert.equal(upload.status, 201);
  const attach = await gerant.req('POST', `/api/depenses/${dep.body.item.id}/justificatif`, { photo: upload.body.name });
  assert.equal(attach.status, 200);
  assert.equal(attach.body.item.justificatif, 'oui');
  assert.equal((await gerant.req('GET', `/api/fichiers/${upload.body.name}`)).status, 200);

  // Only a supervisor reopens / validates.
  assert.equal((await gerant.req('POST', `/api/journees/${today}/reouvrir`, { motif: 'erreur' })).status, 403);
  assert.equal((await patron.req('POST', `/api/journees/${today}/reouvrir`, { motif: 'Correction du ticket Z' })).body.journee.statut, 'ouverte');
  assert.equal((await gerant.req('POST', `/api/journees/${today}/cloture`, { fondLaisse: 100000, montantRemis: 10000, remisA: 'Patron', noteCloture: 'RAS' })).status, 200);
  assert.equal((await patron.req('POST', `/api/journees/${today}/valider`)).body.journee.statut, 'validee');
  assert.equal((await gerant.req('POST', `/api/depenses/${dep.body.item.id}/justificatif`, { photo: upload.body.name })).status, 423);

  // Customer tab: 6 DT on credit, 2 DT paid back (name matched despite case/accents).
  const credits = (await gerant.req('GET', '/api/credits')).body;
  assert.equal(credits.items[0].solde, 4000);
});

test('no data entry on a future date', async () => {
  const future = await gerant.req('POST', '/api/ventes', { date: addDays(today, 1), categorie: 'Café', modePaiement: 'especes', montant: 1000 });
  assert.equal(future.status, 400);
});

test('catch-up window: a Gérant can enter on recent past days only; a supervisor anywhere', async () => {
  const old = addDays(today, -10);
  const r = await gerant.req('POST', '/api/ventes', { date: old, categorie: 'Café', modePaiement: 'especes', montant: 1000 });
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'RATTRAPAGE_DEPASSE');
  const p = await patron.req('POST', '/api/ventes', { date: old, categorie: 'Café', modePaiement: 'especes', montant: 1000 });
  assert.equal(p.status, 201);

  // The day after `old` opens with a count compared to... the default, since `old` was never closed.
  const yesterday = addDays(today, -1);
  const ok = await gerant.req('POST', '/api/comptages', {
    date: yesterday,
    type: 'especes',
    moment: 'ouverture',
    details: { denominations: [{ key: 'b50', quantite: 2 }] },
  });
  assert.equal(ok.status, 201);
  const day = (await gerant.req('GET', `/api/journees/${yesterday}`)).body;
  assert.equal(day.journee.fondOuverture, 100000);
  assert.equal(day.journee.fondOuvertureSource, 'comptage');
});

test('offline replay: the same client id never creates a duplicate', async () => {
  const id = crypto.randomUUID();
  const date = addDays(today, -1);
  const a = await gerant.req('POST', '/api/depenses', { id, date, categorie: 'Divers', modePaiement: 'especes_caisse', montant: 3000, justificatif: 'oui' });
  const b = await gerant.req('POST', '/api/depenses', { id, date, categorie: 'Divers', modePaiement: 'especes_caisse', montant: 3000, justificatif: 'oui' });
  assert.equal(a.status, 201);
  assert.equal(b.status, 200);
  assert.equal(b.body.duplicate, true);
  const day = (await gerant.req('GET', `/api/journees/${date}`)).body;
  assert.equal(day.depenses.filter((d: { id: string }) => d.id === id).length, 1);
});

test('a Gérant cannot edit or cancel someone else’s entry; cancelling needs a reason', async () => {
  const date = addDays(today, -1);
  const v = (await gerant.req('POST', '/api/ventes', { date, categorie: 'Café', modePaiement: 'especes', montant: 2000 })).body.item;
  assert.equal((await gerant2.req('PUT', `/api/ventes/${v.id}`, { categorie: 'Café', modePaiement: 'especes', montant: 1 })).status, 403);
  assert.equal((await gerant.req('POST', `/api/ventes/${v.id}/annuler`, { motif: '' })).status, 400);
  const c = await gerant.req('POST', `/api/ventes/${v.id}/annuler`, { motif: 'Saisie en double' });
  assert.equal(c.body.item.statut, 'annulee');
  assert.equal((await gerant.req('POST', `/api/ventes/${v.id}/annuler`, { motif: 'encore' })).status, 409);
});

test('notes & incidents: an incident needs a category and a resolution text', async () => {
  assert.equal((await gerant.req('POST', '/api/notes', { type: 'incident', titre: 'TPE ne répond plus', priorite: 'urgente' })).status, 400);
  const n = (await gerant.req('POST', '/api/notes', { type: 'incident', categorie: 'panne_tpe', titre: 'TPE ne répond plus', priorite: 'urgente' })).body.item;
  assert.equal((await gerant2.req('POST', `/api/notes/${n.id}/statut`, { statut: 'resolu' })).status, 400);
  const r = await gerant2.req('POST', `/api/notes/${n.id}/statut`, { statut: 'resolu', resolution: 'Redémarré, réseau OK' });
  assert.equal(r.body.item.statut, 'resolu');
  assert.equal(r.body.item.resoluParNom, 'Ines Gérante');
  const open = (await gerant.req('GET', '/api/notes?statut=non_resolu')).body.items;
  assert.equal(open.some((x: { id: string }) => x.id === n.id), false);
});

test('activity journal: a Gérant sees only their own actions, the supervisor sees all, filters work', async () => {
  const mine = (await gerant2.req('GET', '/api/journal?limit=200')).body;
  assert.equal(mine.seeAll, false);
  assert.ok(mine.items.length > 0);
  assert.ok(mine.items.every((e: { userId: string }) => e.userId === 'u-gerant2'));
  const all = (await patron.req('GET', '/api/journal?limit=200')).body;
  assert.equal(all.seeAll, true);
  assert.ok(all.users.length >= 3);
  const closings = (await patron.req('GET', '/api/journal?module=journee&action=cloture')).body;
  assert.equal(closings.total, 2);
  const refused = (await patron.req('GET', '/api/journal?action=connexion_refusee')).body;
  assert.ok(refused.total >= 2);
  const csv = await patron.req('GET', '/api/journal/export.csv?module=journee');
  assert.equal(csv.status, 200);
  assert.match(String(csv.body), /Clôture de la journée/);
});

test('settings are restricted to historique:settings', async () => {
  const body = { toleranceEcart: 500, fondCaisseDefaut: 150000, joursRattrapage: 3, heureBascule: 5, depenseSeuilJustificatif: 50000 };
  assert.equal((await gerant.req('PUT', '/api/parametres', body)).status, 403);
  assert.equal((await patron.req('PUT', '/api/parametres', body)).body.settings.toleranceEcart, 500);
  assert.equal((await gerant.req('POST', '/api/referentiels', { type: 'tpe', label: 'TPE terrasse' })).status, 403);
  assert.equal((await patron.req('POST', '/api/referentiels', { type: 'tpe', label: 'TPE terrasse' })).status, 201);
});

test('logout revokes the main-app session', async () => {
  const c = new Client();
  await c.login('gerant2');
  assert.equal((await c.req('POST', '/api/auth/logout')).status, 204);
  assert.equal((await c.req('GET', `/api/journees/${today}`)).status, 401);
});
