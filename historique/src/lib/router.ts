import { useCallback, useEffect, useState } from 'react';

// Tiny path router (the app has a dozen flat pages) — keeps real URLs so the browser back button,
// PWA shortcuts (/depenses?nouveau=1) and deep links (/historique?date=…) all work.

export type PageId = 'journee' | 'ventes' | 'depenses' | 'ca' | 'comptage' | 'mouvements' | 'notes' | 'cloture' | 'historique' | 'credits' | 'journal' | 'parametres' | 'compte';

const PATHS: Record<PageId, string> = {
  journee: '/',
  ventes: '/ventes',
  depenses: '/depenses',
  ca: '/chiffre-affaires',
  comptage: '/comptage',
  mouvements: '/mouvements',
  notes: '/notes',
  cloture: '/cloture',
  historique: '/historique',
  credits: '/credits',
  journal: '/journal',
  parametres: '/parametres',
  compte: '/compte',
};

const pageFromPath = (pathname: string): PageId => {
  const entry = (Object.entries(PATHS) as [PageId, string][]).find(([, p]) => p === pathname.replace(/\/+$/, '') || (p === '/' && pathname === '/'));
  return entry ? entry[0] : 'journee';
};

const readLocation = () => ({ page: pageFromPath(window.location.pathname), params: new URLSearchParams(window.location.search) });

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((cb) => cb());

export const navigate = (page: PageId, params: Record<string, string | null | undefined> = {}, opts: { replace?: boolean; keepDate?: boolean } = {}) => {
  const current = new URLSearchParams(window.location.search);
  const next = new URLSearchParams();
  if (opts.keepDate !== false && current.get('date')) next.set('date', current.get('date')!);
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') next.delete(k);
    else next.set(k, v);
  });
  const qs = next.toString();
  const url = `${PATHS[page]}${qs ? `?${qs}` : ''}`;
  if (opts.replace) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
  notify();
};

export const setParam = (key: string, value: string | null) => {
  const p = new URLSearchParams(window.location.search);
  if (value === null || value === '') p.delete(key);
  else p.set(key, value);
  const qs = p.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  notify();
};

export const useRoute = () => {
  const [loc, setLoc] = useState(readLocation);
  useEffect(() => {
    const update = () => setLoc(readLocation());
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, []);
  const go = useCallback(navigate, []);
  return { ...loc, go };
};
