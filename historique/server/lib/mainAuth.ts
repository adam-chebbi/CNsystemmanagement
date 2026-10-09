import type { NextFunction, Request, Response } from 'express';
import { PERM_ACCESS, userCan, type SessionUser } from '../../shared/model.js';
import { ApiError } from './http.js';

// Authentication bridge to the main app (system.cafenoir.tn).
//
// Historique has no users table and never sees a password hash: logins, passwords, roles and the
// historique:* permissions all live in the main app (Rôles & permissions / Employés). This module
//   • forwards login / logout / change-password to the main app's /api/auth/* routes, relaying its
//     httpOnly session cookie back to the browser, and
//   • validates that cookie on every Historique API request by calling the main app's
//     GET /api/auth/me (server-to-server, over the loopback in production), with a short cache so a
//     busy screen doesn't hit the main app on every single request.
// Deactivating an account or revoking a session in the main app therefore locks the person out
// of Historique too — within CACHE_TTL_MS at most.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionToken?: string;
    }
  }
}

export interface MainAuthConfig {
  mainAppUrl: string;
  sessionCookie: string;
  cacheTtlMs?: number;
}

interface MainMeUser {
  id: string;
  fullName: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: string[];
  mustChangePassword: boolean;
}

const toSessionUser = (u: MainMeUser): SessionUser => ({
  id: u.id,
  fullName: u.fullName,
  roleName: u.roleName,
  isSuperAdmin: Boolean(u.isSuperAdmin),
  permissions: Array.isArray(u.permissions) ? u.permissions : [],
  mustChangePassword: Boolean(u.mustChangePassword),
});

export const NO_ACCESS_MESSAGE =
  "Votre compte n'a pas accès à l'application Historique & Comptage. Demandez à l'administrateur de vous attribuer le rôle « Gérant ».";

const unavailable = () =>
  new ApiError(503, "Le serveur d'authentification est injoignable pour le moment. Réessayez dans un instant.", 'AUTH_UNAVAILABLE');

export interface ForwardResult {
  status: number;
  body: unknown;
  setCookies: string[];
}

export const createMainAuth = (config: MainAuthConfig) => {
  const base = config.mainAppUrl.replace(/\/+$/, '');
  const ttl = config.cacheTtlMs ?? 15_000;
  const cache = new Map<string, { user: SessionUser; expires: number }>();

  const fetchMe = async (token: string): Promise<SessionUser> => {
    const hit = cache.get(token);
    if (hit && hit.expires > Date.now()) return hit.user;

    let res: globalThis.Response;
    try {
      res = await fetch(`${base}/api/auth/me`, { headers: { cookie: `${config.sessionCookie}=${encodeURIComponent(token)}` } });
    } catch {
      throw unavailable();
    }
    if (res.status === 401 || res.status === 403) {
      cache.delete(token);
      throw new ApiError(401, 'Session invalide ou expirée. Reconnectez-vous.', 'UNAUTHENTICATED');
    }
    if (!res.ok) throw unavailable();
    const data = (await res.json()) as { user: MainMeUser };
    const user = toSessionUser(data.user);
    if (cache.size > 500) cache.clear();
    cache.set(token, { user, expires: Date.now() + ttl });
    return user;
  };

  const tokenOf = (req: Request): string => {
    const raw = req.cookies?.[config.sessionCookie];
    return typeof raw === 'string' ? raw : '';
  };

  // Resolves the visitor. `allowPendingPassword` is only for /auth/me — every other route refuses
  // an account that must still replace its temporary password (same rule as the main app).
  const resolve = async (req: Request, allowPendingPassword: boolean): Promise<SessionUser> => {
    const token = tokenOf(req);
    if (!token) throw new ApiError(401, 'Authentification requise.', 'UNAUTHENTICATED');
    const user = await fetchMe(token);
    if (!userCan(user, PERM_ACCESS)) throw new ApiError(403, NO_ACCESS_MESSAGE, 'NO_ACCESS');
    if (user.mustChangePassword && !allowPendingPassword) {
      throw new ApiError(403, 'Vous devez changer votre mot de passe avant de continuer.', 'PASSWORD_CHANGE_REQUIRED');
    }
    req.user = user;
    req.sessionToken = token;
    return user;
  };

  const middleware =
    (allowPendingPassword: boolean) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      resolve(req, allowPendingPassword).then(() => next(), next);
    };

  // Forwards a POST to the main app's /api/auth/<path>, carrying the browser's cookies and CSRF
  // header untouched (the main app runs the very same double-submit check) plus the real client
  // IP/user-agent so "Sessions & appareils" in the main app shows the right device.
  const forward = async (req: Request, path: string, body?: unknown): Promise<ForwardResult> => {
    let res: globalThis.Response;
    try {
      res = await fetch(`${base}/api/auth${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: req.get('cookie') ?? '',
          'x-csrf-token': req.get('x-csrf-token') ?? '',
          'user-agent': req.get('user-agent') ?? '',
          'x-forwarded-for': req.ip ?? '',
        },
        body: JSON.stringify(body ?? req.body ?? {}),
      });
    } catch {
      throw unavailable();
    }
    const text = res.status === 204 ? '' : await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    return { status: res.status, body: parsed, setCookies: res.headers.getSetCookie?.() ?? [] };
  };

  // Revokes a session the main app just opened for someone who turns out to have no Historique
  // access — they must not walk away with a valid session cookie from this domain.
  const revoke = async (token: string): Promise<void> => {
    const csrf = 'historique-revoke';
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        headers: { cookie: `${config.sessionCookie}=${encodeURIComponent(token)}; csrf_token=${csrf}`, 'x-csrf-token': csrf },
      });
    } catch {
      // best effort — the session simply expires on its own otherwise
    }
  };

  const extractToken = (setCookies: string[]): string | null => {
    const prefix = `${config.sessionCookie}=`;
    const c = setCookies.find((s) => s.startsWith(prefix));
    if (!c) return null;
    return decodeURIComponent(c.slice(prefix.length).split(';')[0]);
  };

  return {
    requireUser: middleware(false),
    requireUserAllowPendingPassword: middleware(true),
    resolve,
    forward,
    revoke,
    extractToken,
    toSessionUser,
    invalidate: (token: string | undefined) => {
      if (token) cache.delete(token);
    },
    tokenOf,
  };
};

export type MainAuth = ReturnType<typeof createMainAuth>;

export const requirePerm =
  (key: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!userCan(req.user, key)) throw new ApiError(403, "Vous n'avez pas la permission d'effectuer cette action.");
    next();
  };
