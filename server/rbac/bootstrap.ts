import { randomUUID } from 'node:crypto';
import { db } from '../db/connection.js';
import { PERMISSION_KEYS, SUPER_ADMIN_ROLE_NAME, COMPTE_SAISIE_ROLE_NAME } from '../../src/data/rbacModel.js';

interface RoleRow {
  id: string;
}

// A minimal, deliberately narrow starter set for the seeded "Compte Saisie" role — a Super Admin
// is free to widen or shrink this afterwards via the Roles & Permissions screen; this only decides
// what a brand-new data-entry account can do on day one. Includes products:view and hr:view
// because "Ajout manuel des ventes" needs them just to render (the product picker and the
// employee/shift dropdowns) — without them sales:create is granted but unusable.
const COMPTE_SAISIE_STARTER_PERMISSIONS = ['dashboard:view', 'sales:view', 'sales:create', 'stock:view', 'products:view', 'hr:view'];

// The same two prerequisites, re-applied additively on every boot even to an already-existing
// Compte Saisie role (INSERT OR IGNORE — never revokes anything a Super Admin configured). Without
// this, a role created before these were added to the starter set above stays permanently unable
// to actually use its own sales:create grant, with no obvious link between the two in the UI.
const COMPTE_SAISIE_REQUIRED_FOR_SALES_ENTRY = ['products:view', 'hr:view'];

const getRoleByName = (name: string): RoleRow | undefined =>
  db.prepare('SELECT id FROM roles WHERE name = ?').get(name) as RoleRow | undefined;

const createRole = (name: string, description: string, isSystem: boolean, permissions: string[]): string => {
  const id = randomUUID();
  db.prepare('INSERT INTO roles (id, name, description, is_system, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    name,
    description,
    isSystem ? 1 : 0,
    new Date().toISOString()
  );
  const insertPermission = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
  permissions.forEach((key) => insertPermission.run(id, key));
  return id;
};

// Runs on every boot, before the request server starts accepting traffic — idempotent, so it's
// safe to call on a database that already has roles/users. Guarantees, on every boot:
//   1. The Super Admin role exists and carries every permission the catalog currently knows about
//      (re-synced each boot, so a permission added to the catalog later is automatically granted
//      to Super Admin without a migration — see the is_system bypass in requirePermission, which
//      makes this resync belt-and-braces rather than load-bearing).
//   2. The Compte Saisie role exists (created once, then left alone — a Super Admin may have
//      customized its permissions since).
//   3. No user is ever left with a NULL role_id (would otherwise be locked out of everything, since
//      requirePermission has nothing to check) — any such user is backfilled to Super Admin, which
//      only realistically happens once, right after the role_id column migration adds it to every
//      pre-existing account.
export const bootstrapRbac = (): void => {
  let superAdmin = getRoleByName(SUPER_ADMIN_ROLE_NAME);
  if (!superAdmin) {
    const id = createRole(SUPER_ADMIN_ROLE_NAME, 'Accès complet à toute l’application. Seul rôle autorisé à gérer les rôles et permissions.', true, PERMISSION_KEYS);
    superAdmin = { id };
  } else {
    const insertPermission = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
    PERMISSION_KEYS.forEach((key) => insertPermission.run(superAdmin!.id, key));
  }

  const compteSaisie = getRoleByName(COMPTE_SAISIE_ROLE_NAME);
  if (!compteSaisie) {
    createRole(COMPTE_SAISIE_ROLE_NAME, 'Accès limité à la saisie quotidienne (ventes, consultation du stock).', false, COMPTE_SAISIE_STARTER_PERMISSIONS);
  } else {
    const insertPermission = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
    COMPTE_SAISIE_REQUIRED_FOR_SALES_ENTRY.forEach((key) => insertPermission.run(compteSaisie.id, key));
  }

  db.prepare('UPDATE users SET role_id = ? WHERE role_id IS NULL').run(superAdmin.id);
};
