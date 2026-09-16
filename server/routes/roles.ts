import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { asyncHandler, ApiError, notFound } from '../middleware/errors.js';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { recordActivity } from '../lib/activity.js';
import { groupPermissionsByModule, isKnownPermissionKey, MANAGE_ROLES_PERMISSION } from '../../src/data/rbacModel.js';

const CIN_PATTERN = /^\d{8}$/;

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  is_system: number;
  created_at: string;
}

interface PermissionRow {
  permission_key: string;
}

interface UserCountRow {
  role_id: string;
  count: number;
}

const permissionsArraySchema = z
  .array(z.string())
  .refine((keys) => keys.every(isKnownPermissionKey), { message: 'Clé de permission inconnue.' });

const serializeRole = (row: RoleRow, permissions: string[], userCount: number) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  isSystem: row.is_system === 1,
  permissions,
  userCount,
  createdAt: row.created_at,
});

const listRolesWithDetails = () => {
  const roles = db.prepare('SELECT id, name, description, is_system, created_at FROM roles ORDER BY is_system DESC, created_at ASC').all() as RoleRow[];
  const permissionRows = db.prepare('SELECT role_id, permission_key FROM role_permissions').all() as { role_id: string; permission_key: string }[];
  const userCounts = db.prepare('SELECT role_id, COUNT(*) as count FROM users WHERE role_id IS NOT NULL GROUP BY role_id').all() as UserCountRow[];

  const permissionsByRole = new Map<string, string[]>();
  permissionRows.forEach((r) => {
    const list = permissionsByRole.get(r.role_id) ?? [];
    list.push(r.permission_key);
    permissionsByRole.set(r.role_id, list);
  });
  const countByRole = new Map(userCounts.map((r) => [r.role_id, r.count]));

  return roles.map((r) => serializeRole(r, permissionsByRole.get(r.id) ?? [], countByRole.get(r.id) ?? 0));
};

export const rolesRouter = Router();
rolesRouter.use(requireAuth);

// The permission catalog is fixed, code-defined data (src/data/rbacModel.ts) — this endpoint just
// exposes it to the client so the Roles & Permissions matrix doesn't need to duplicate it, while
// still gating it behind roles:manage since it's only ever useful on that screen.
rolesRouter.get(
  '/permissions',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((_req, res) => {
    res.json({ groups: groupPermissionsByModule() });
  })
);

rolesRouter.get(
  '/roles',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((_req, res) => {
    res.json(listRolesWithDetails());
  })
);

const roleSchema = z.object({
  name: z.string().min(1, 'Le nom du rôle est obligatoire.').max(100),
  description: z.string().max(500).optional().default(''),
  permissions: permissionsArraySchema.optional().default([]),
});

rolesRouter.post(
  '/roles',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((req, res) => {
    const body = roleSchema.parse(req.body);
    const trimmedName = body.name.trim();
    const duplicate = db.prepare('SELECT id FROM roles WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (duplicate) throw new ApiError(409, 'Ce nom de rôle est déjà utilisé.');

    const id = randomUUID();
    const tx = db.transaction(() => {
      db.prepare('INSERT INTO roles (id, name, description, is_system, created_at) VALUES (?, ?, ?, 0, ?)').run(
        id,
        trimmedName,
        body.description,
        new Date().toISOString()
      );
      const insertPermission = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
      body.permissions.forEach((key) => insertPermission.run(id, key));
    });
    tx();

    recordActivity('Rôles & permissions', 'Création', `Rôle "${trimmedName}" créé.`, req.user!.fullName);
    const [role] = listRolesWithDetails().filter((r) => r.id === id);
    res.status(201).json(role);
  })
);

const roleUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom du rôle est obligatoire.').max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: permissionsArraySchema.optional(),
});

rolesRouter.put(
  '/roles/:id',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((req, res) => {
    const row = db.prepare('SELECT id, name, description, is_system, created_at FROM roles WHERE id = ?').get(req.params.id) as RoleRow | undefined;
    if (!row) throw notFound('Rôle');
    if (row.is_system === 1) throw new ApiError(403, 'Le rôle Super Admin ne peut pas être modifié.');

    const body = roleUpdateSchema.parse(req.body);
    const trimmedName = body.name?.trim();
    if (trimmedName) {
      const duplicate = db.prepare('SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND id != ?').get(trimmedName, row.id);
      if (duplicate) throw new ApiError(409, 'Ce nom de rôle est déjà utilisé.');
    }

    const tx = db.transaction(() => {
      if (trimmedName !== undefined || body.description !== undefined) {
        db.prepare('UPDATE roles SET name = ?, description = ? WHERE id = ?').run(
          trimmedName ?? row.name,
          body.description ?? row.description ?? '',
          row.id
        );
      }
      if (body.permissions !== undefined) {
        db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(row.id);
        const insertPermission = db.prepare('INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)');
        body.permissions.forEach((key) => insertPermission.run(row.id, key));
      }
    });
    tx();

    recordActivity('Rôles & permissions', 'Modification', `Rôle "${trimmedName ?? row.name}" mis à jour.`, req.user!.fullName);
    const [role] = listRolesWithDetails().filter((r) => r.id === row.id);
    res.json(role);
  })
);

rolesRouter.delete(
  '/roles/:id',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((req, res) => {
    const row = db.prepare('SELECT id, name, is_system FROM roles WHERE id = ?').get(req.params.id) as
      | { id: string; name: string; is_system: number }
      | undefined;
    if (!row) throw notFound('Rôle');
    if (row.is_system === 1) throw new ApiError(403, 'Le rôle Super Admin ne peut pas être supprimé.');

    const { count } = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(row.id) as { count: number };
    if (count > 0) throw new ApiError(409, 'Ce rôle est assigné à un ou plusieurs utilisateurs. Réassignez-les avant de le supprimer.');

    db.prepare('DELETE FROM roles WHERE id = ?').run(row.id);
    recordActivity('Rôles & permissions', 'Suppression', `Rôle "${row.name}" supprimé.`, req.user!.fullName);
    res.status(204).end();
  })
);

// --- Utilisateurs (comptes de connexion) ----------------------------------------------------
// A minimal user directory lives here rather than as its own sidebar module, per the same
// header-dropdown-only placement as the rest of Roles & Permissions — creating/assigning users to
// roles is part of the same screen and the same roles:manage permission.

interface UserRow {
  id: string;
  full_name: string;
  cin: string;
  role_id: string | null;
  role_name: string | null;
  created_at: string;
}

const listUsersWithRole = () =>
  (db
    .prepare(
      `SELECT u.id, u.full_name, u.cin, u.role_id, r.name AS role_name, u.created_at
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at ASC`
    )
    .all() as UserRow[])
    .map((u) => ({ id: u.id, fullName: u.full_name, cin: u.cin, roleId: u.role_id, roleName: u.role_name, createdAt: u.created_at }));

rolesRouter.get(
  '/users',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((_req, res) => {
    res.json(listUsersWithRole());
  })
);

const userSchema = z.object({
  fullName: z.string().min(1, 'Le nom complet est obligatoire.').max(150),
  cin: z.string().regex(CIN_PATTERN, 'Le numéro CIN doit comporter 8 chiffres.'),
  roleId: z.string().min(1, 'Le rôle est obligatoire.'),
});

const assertRoleExists = (roleId: string): void => {
  const role = db.prepare('SELECT id FROM roles WHERE id = ?').get(roleId);
  if (!role) throw new ApiError(400, 'Rôle introuvable.');
};

rolesRouter.post(
  '/users',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((req, res) => {
    const body = userSchema.parse(req.body);
    assertRoleExists(body.roleId);
    const duplicate = db.prepare('SELECT id FROM users WHERE cin = ?').get(body.cin);
    if (duplicate) throw new ApiError(409, 'Ce numéro CIN est déjà utilisé par un autre compte.');

    const id = randomUUID();
    db.prepare('INSERT INTO users (id, full_name, cin, role_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
      id,
      body.fullName.trim(),
      body.cin.trim(),
      body.roleId,
      new Date().toISOString()
    );

    recordActivity('Rôles & permissions', 'Création', `Utilisateur "${body.fullName.trim()}" créé.`, req.user!.fullName);
    const [created] = listUsersWithRole().filter((u) => u.id === id);
    res.status(201).json(created);
  })
);

const userUpdateSchema = z.object({
  fullName: z.string().min(1).max(150).optional(),
  roleId: z.string().min(1).optional(),
});

// Guards against ending up with zero Super Admin accounts, which would permanently lock everyone
// out of Roles & Permissions (no one left with roles:manage to fix it) — checked before any role
// reassignment or deletion actually touches the last remaining one.
const assertNotLastSuperAdmin = (userId: string): void => {
  const target = db
    .prepare(`SELECT r.is_system FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?`)
    .get(userId) as { is_system: number | null } | undefined;
  if (!target || target.is_system !== 1) return;

  const { count } = db
    .prepare(`SELECT COUNT(*) as count FROM users u JOIN roles r ON r.id = u.role_id WHERE r.is_system = 1`)
    .get() as { count: number };
  if (count <= 1) throw new ApiError(409, 'Impossible : il doit toujours rester au moins un compte Super Admin.');
};

rolesRouter.put(
  '/users/:id',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((req, res) => {
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!existing) throw notFound('Utilisateur');

    const body = userUpdateSchema.parse(req.body);
    if (body.roleId !== undefined) {
      assertRoleExists(body.roleId);
      assertNotLastSuperAdmin(req.params.id);
    }

    db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), role_id = COALESCE(?, role_id) WHERE id = ?').run(
      body.fullName?.trim() ?? null,
      body.roleId ?? null,
      req.params.id
    );

    recordActivity('Rôles & permissions', 'Modification', `Utilisateur mis à jour.`, req.user!.fullName);
    const [updated] = listUsersWithRole().filter((u) => u.id === req.params.id);
    res.json(updated);
  })
);

rolesRouter.delete(
  '/users/:id',
  requirePermission(MANAGE_ROLES_PERMISSION),
  asyncHandler((req, res) => {
    const existing = db.prepare('SELECT id, full_name FROM users WHERE id = ?').get(req.params.id) as { id: string; full_name: string } | undefined;
    if (!existing) throw notFound('Utilisateur');
    if (existing.id === req.user!.id) throw new ApiError(400, 'Vous ne pouvez pas supprimer votre propre compte.');

    assertNotLastSuperAdmin(req.params.id);

    const tx = db.transaction(() => {
      db.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(new Date().toISOString(), existing.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(existing.id);
    });
    tx();

    recordActivity('Rôles & permissions', 'Suppression', `Utilisateur "${existing.full_name}" supprimé.`, req.user!.fullName);
    res.status(204).end();
  })
);
