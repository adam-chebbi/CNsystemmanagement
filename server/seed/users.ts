import { db } from '../db/connection.js';
import { hashPassword, generateTemporaryPassword } from '../lib/password.js';

export const seedUsers = (): void => {
  const tempPassword = generateTemporaryPassword();
  db.prepare(
    'INSERT INTO users (id, full_name, cin, password_hash, must_change_password, created_at) VALUES (?, ?, ?, ?, 1, ?)'
  ).run('user-1', 'Adam CHEBBI', '12345678', hashPassword(tempPassword), new Date().toISOString());
  // Only ever printed once, on the very first boot of a brand-new database (this function only
  // runs when the users table was empty) — there's no admin session or email service to hand this
  // to otherwise. Same "temporary password + forced change" flow as any other new account.
  // eslint-disable-next-line no-console
  console.log(`[auth] Mot de passe temporaire généré pour "Adam CHEBBI" (CIN 12345678) : ${tempPassword} — changement obligatoire à la première connexion.`);
};
