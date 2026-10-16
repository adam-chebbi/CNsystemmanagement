import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/http.js';
import type { LocalAuth } from '../lib/localAuth.js';
import type { Store } from '../lib/store.js';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email requis.').max(160),
  password: z.string().min(1, 'Mot de passe requis.').max(200),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis.').max(200),
  newPassword: z.string().max(200),
});

export const authRouter = (auth: LocalAuth, store: Store): Router => {
  const router = Router();

  router.post(
    '/login',
    asyncHandler((req, res) => {
      const { email, password } = loginSchema.parse(req.body);
      try {
        const user = auth.login(req, res, email, password);
        store.log(req, { module: 'auth', action: 'connexion', description: `Connexion de ${user.fullName}` });
        res.json({ user });
      } catch (e) {
        store.log(req, { module: 'auth', action: 'connexion_refusee', description: `Échec de connexion (« ${email} »)`, userName: email, userId: null });
        throw e;
      }
    })
  );

  router.post(
    '/logout',
    asyncHandler((req, res) => {
      try {
        auth.requireUserAllowPendingPassword(req, res, () => undefined);
      } catch {
        // already signed out — still clear the cookie below
      }
      if (req.user) store.log(req, { module: 'auth', action: 'deconnexion', description: `Déconnexion de ${req.user.fullName}` });
      auth.logout(req, res);
      res.status(204).end();
    })
  );

  router.get(
    '/me',
    auth.requireUserAllowPendingPassword,
    asyncHandler((req, res) => {
      res.json({ user: req.user, businessDate: store.businessToday(), dateDebut: store.dateDebut(), settings: store.getSettings() });
    })
  );

  router.post(
    '/change-password',
    auth.requireUserAllowPendingPassword,
    asyncHandler((req, res) => {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      auth.changePassword(req, currentPassword, newPassword);
      store.log(req, { module: 'auth', action: 'modification', description: 'Changement du mot de passe' });
      res.status(204).end();
    })
  );

  return router;
};
