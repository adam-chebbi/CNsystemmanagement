import { Router, type Response } from 'express';
import { z } from 'zod';
import { PERM_ACCESS, userCan } from '../../shared/model.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { NO_ACCESS_MESSAGE, type MainAuth } from '../lib/mainAuth.js';
import type { Store } from '../lib/store.js';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifiant requis.'),
  password: z.string().min(1, 'Mot de passe requis.'),
});

const relayCookies = (res: Response, setCookies: string[]) => {
  setCookies.forEach((c) => res.append('Set-Cookie', c));
};

const errorMessage = (body: unknown, fallback: string): string =>
  (body as { error?: { message?: string } } | null)?.error?.message ?? fallback;

export const authRouter = (auth: MainAuth, store: Store): Router => {
  const router = Router();

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const { identifier } = loginSchema.parse(req.body);
      const result = await auth.forward(req, '/login');

      if (result.status !== 200) {
        store.log(req, {
          module: 'auth',
          action: 'connexion_refusee',
          description: `Échec de connexion (identifiant « ${identifier} »)`,
          userName: identifier,
          userId: null,
          details: { status: result.status },
        });
        throw new ApiError(result.status === 503 ? 503 : result.status, errorMessage(result.body, 'Connexion impossible.'));
      }

      const user = auth.toSessionUser((result.body as { user: Parameters<MainAuth['toSessionUser']>[0] }).user);

      if (!userCan(user, PERM_ACCESS)) {
        // Valid credentials, but this account isn't allowed here: close the session the main app
        // just opened instead of handing its cookie to the browser.
        const token = auth.extractToken(result.setCookies);
        if (token) await auth.revoke(token);
        store.log(req, {
          module: 'auth',
          action: 'connexion_refusee',
          description: `Accès refusé : ${user.fullName} n'a pas la permission Historique`,
          userName: user.fullName,
          userId: user.id,
        });
        throw new ApiError(403, NO_ACCESS_MESSAGE, 'NO_ACCESS');
      }

      relayCookies(res, result.setCookies);
      req.user = user;
      store.log(req, { module: 'auth', action: 'connexion', description: `Connexion de ${user.fullName}` });
      res.json({ user });
    })
  );

  router.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const token = auth.tokenOf(req);
      try {
        const user = token ? await auth.resolve(req, true) : null;
        if (user) store.log(req, { module: 'auth', action: 'deconnexion', description: `Déconnexion de ${user.fullName}` });
      } catch {
        // already logged out / no access — still clear everything below
      }
      try {
        const result = await auth.forward(req, '/logout');
        relayCookies(res, result.setCookies);
      } catch {
        // main app unreachable: the local cookie is still dropped below
      }
      auth.invalidate(token);
      res.status(204).end();
    })
  );

  router.get(
    '/me',
    auth.requireUserAllowPendingPassword,
    asyncHandler((req, res) => {
      res.json({ user: req.user, businessDate: store.businessToday(), settings: store.getSettings() });
    })
  );

  router.post(
    '/change-password',
    auth.requireUserAllowPendingPassword,
    asyncHandler(async (req, res) => {
      const result = await auth.forward(req, '/change-password');
      if (result.status !== 204 && result.status !== 200) {
        throw new ApiError(result.status, errorMessage(result.body, 'Changement de mot de passe impossible.'));
      }
      auth.invalidate(req.sessionToken);
      store.log(req, { module: 'auth', action: 'modification', description: 'Changement du mot de passe' });
      res.status(204).end();
    })
  );

  return router;
};
