import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { asyncHandler } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../lib/activity.js';
import { DEFAULT_APP_SETTINGS, type AppSettings } from '../../src/data/settingsModel.js';

interface SettingRow {
  key: string;
  value: string;
}

// Every key is optional in storage — a missing row just means "use the default". Reading always
// returns a fully-populated AppSettings object so the frontend never has to merge in defaults
// itself.
const getAllSettings = (): AppSettings => {
  const rows = db.prepare('SELECT key, value FROM app_settings').all() as SettingRow[];
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULT_APP_SETTINGS };
  (Object.keys(DEFAULT_APP_SETTINGS) as (keyof AppSettings)[]).forEach((key) => {
    const raw = stored.get(key);
    if (raw !== undefined) {
      const n = Number(raw);
      if (!Number.isNaN(n)) result[key] = n;
    }
  });
  return result;
};

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get('/settings', asyncHandler((_req, res) => {
  res.json(getAllSettings());
}));

const settingsSchema = z.object({
  expiryAlertDays: z.number().min(1).max(60),
  discrepancyThreshold: z.number().min(0).max(1000),
  discrepancyLookbackDays: z.number().min(1).max(365),
  restoCommissionRate: z.number().min(0).max(0.3),
  defaultTargetMarginRate: z.number().min(0).max(1),
});

settingsRouter.put('/settings', asyncHandler((req, res) => {
  const body = settingsSchema.parse(req.body);
  const now = new Date().toISOString();
  const upsert = db.prepare(
    `INSERT INTO app_settings (key, value, updated_at, updated_by) VALUES (@key, @value, @updated_at, @updated_by)
     ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = @updated_at, updated_by = @updated_by`
  );
  const tx = db.transaction(() => {
    (Object.keys(body) as (keyof AppSettings)[]).forEach((key) => {
      upsert.run({ key, value: String(body[key]), updated_at: now, updated_by: req.user!.fullName });
    });
  });
  tx();
  recordActivity('Paramètres', 'Modification', 'Réglages généraux mis à jour', req.user!.fullName);
  res.json(getAllSettings());
}));
