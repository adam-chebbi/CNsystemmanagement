import { useCallback, useEffect, useState } from 'react';
import type { HistoriqueSettings, Referentiel, ReferentielType } from '../../shared/model';
import { api } from '../api/client';

// Pick-lists (catégories, TPE, émetteurs de tickets) — loaded once, shared by every form, and kept
// on the device so the forms still work offline.
const KEY = 'historique:referentiels';
let cache: Referentiel[] | null = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
})();
const subs = new Set<(r: Referentiel[]) => void>();
let inflight: Promise<void> | null = null;

export const reloadReferentiels = (): Promise<void> => {
  inflight ??= api
    .get<{ referentiels: Referentiel[]; settings: HistoriqueSettings }>('/parametres')
    .then((res) => {
      cache = res.referentiels;
      try {
        localStorage.setItem(KEY, JSON.stringify(cache));
      } catch {
        // ignore
      }
      subs.forEach((cb) => cb(res.referentiels));
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const useReferentiels = () => {
  const [all, setAll] = useState<Referentiel[]>(cache ?? []);
  useEffect(() => {
    subs.add(setAll);
    if (!cache) void reloadReferentiels();
    return () => {
      subs.delete(setAll);
    };
  }, []);
  const list = useCallback((type: ReferentielType, includeInactive = false) => all.filter((r) => r.type === type && (includeInactive || r.actif)).sort((a, b) => a.ordre - b.ordre || a.label.localeCompare(b.label)), [all]);
  return { all, list, reload: reloadReferentiels };
};
