import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { UAParser } from 'ua-parser-js';
import { db } from '../db/connection.js';
import { asyncHandler, ApiError, notFound } from '../middleware/errors.js';
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

// No external geolocation service is called — the app never sends a user's IP to a third party.
// "Localisation" is therefore an honest, coarse signal (local network vs. public internet) rather
// than a fabricated city/country; wiring in a real GeoIP database (e.g. a local MaxMind file) here
// is the place to do it if that precision is ever wanted.
const isPrivateOrLoopbackIp = (ip: string): boolean => {
  const v = ip.replace(/^::ffff:/, '');
  if (v === '::1' || v === 'localhost' || v.startsWith('127.')) return true;
  if (/^10\./.test(v)) return true;
  if (/^192\.168\./.test(v)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(v)) return true;
  return false;
};

const describeLocation = (ip: string): string => (isPrivateOrLoopbackIp(ip) ? 'Réseau local' : `IP publique (${ip})`);

const describeDevice = (uaString: string): string => {
  const parser = new UAParser(uaString);
  const browser = parser.getBrowser().name;
  const os = parser.getOS().name;
  if (browser && os) return `${browser} sur ${os}`;
  return browser || os || 'Appareil inconnu';
};

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler((req, res) => {
    const { cin } = loginSchema.parse(req.body);
    const user = db.prepare('SELECT id, full_name, cin FROM users WHERE cin = ?').get(cin) as UserRow | undefined;
    if (!user) throw new ApiError(401, 'Numéro CIN incorrect.');

    const token = randomUUID();
    const publicId = randomUUID();
    const createdAt = new Date().toISOString();
    const ip = req.ip ?? '';
    const userAgent = req.get('user-agent') ?? '';

    db.prepare(
      `INSERT INTO sessions (token, public_id, user_id, created_at, ip_address, user_agent, device_label, location, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(token, publicId, user.id, createdAt, ip, userAgent, describeDevice(userAgent), describeLocation(ip), createdAt);

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
    db.prepare('UPDATE sessions SET revoked_at = ? WHERE token = ?').run(new Date().toISOString(), req.sessionToken);
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

// --- Sessions & appareils --------------------------------------------------------------------

interface SessionMetaRow {
  token: string;
  public_id: string;
  created_at: string;
  ip_address: string | null;
  device_label: string | null;
  location: string | null;
  last_seen_at: string | null;
  revoked_at: string | null;
}

authRouter.get(
  '/sessions',
  requireAuth,
  asyncHandler((req, res) => {
    const rows = db
      .prepare(
        `SELECT token, public_id, created_at, ip_address, device_label, location, last_seen_at, revoked_at
         FROM sessions WHERE user_id = ? ORDER BY created_at DESC`
      )
      .all(req.user!.id) as SessionMetaRow[];

    const active = rows
      .filter((r) => !r.revoked_at)
      .map((r) => ({
        id: r.public_id,
        device: r.device_label ?? 'Appareil inconnu',
        location: r.location ?? 'Inconnue',
        ipAddress: r.ip_address ?? 'Inconnue',
        loginTime: r.created_at,
        lastSeenAt: r.last_seen_at ?? r.created_at,
        isCurrent: r.token === req.sessionToken,
      }));

    interface SessionEvent {
      activity: 'Connexion' | 'Déconnexion';
      date: string;
      device: string;
      location: string;
    }

    const history = rows
      .flatMap((r): SessionEvent[] => {
        const device = r.device_label ?? 'Appareil inconnu';
        const location = r.location ?? 'Inconnue';
        const events: SessionEvent[] = [{ activity: 'Connexion', date: r.created_at, device, location }];
        if (r.revoked_at) events.push({ activity: 'Déconnexion', date: r.revoked_at, device, location });
        return events;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    res.json({ active, history });
  })
);

authRouter.delete(
  '/sessions/:publicId',
  requireAuth,
  asyncHandler((req, res) => {
    const row = db
      .prepare('SELECT token FROM sessions WHERE public_id = ? AND user_id = ? AND revoked_at IS NULL')
      .get(req.params.publicId, req.user!.id) as { token: string } | undefined;
    if (!row) throw notFound('Session');

    db.prepare('UPDATE sessions SET revoked_at = ? WHERE token = ?').run(new Date().toISOString(), row.token);

    const isCurrentSession = row.token === req.sessionToken;
    if (isCurrentSession) res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.json({ revokedCurrentSession: isCurrentSession });
  })
);
