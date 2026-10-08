import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, History, Search, X } from 'lucide-react';
import { ACTIVITY_ACTIONS, ACTIVITY_MODULES, type ActivityEntry } from '../../shared/model';
import { api, errorText } from '../api/client';
import { Alert, Badge, cls, EmptyState, formatDateTime, Modal, PageHeader, Spinner } from '../components/ui';
import { navigate } from '../lib/router';

const PAGE_SIZE = 50;

const ACTION_TONE: Record<string, 'gray' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet'> = {
  creation: 'emerald',
  modification: 'blue',
  annulation: 'rose',
  cloture: 'violet',
  reouverture: 'amber',
  validation: 'blue',
  connexion: 'gray',
  deconnexion: 'gray',
  connexion_refusee: 'rose',
  resolution: 'emerald',
  ouverture: 'gray',
};

export const JournalPage: React.FC = () => {
  const [filters, setFilters] = useState({ from: '', to: '', userId: '', module: '', action: '', q: '' });
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<{ items: ActivityEntry[]; total: number; users: { id: string; name: string }[]; seeAll: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ActivityEntry | null>(null);

  const query = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      Object.entries({ ...filters, ...extra }).forEach(([k, v]) => v && p.set(k, v));
      return p;
    },
    [filters]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setError(null);
      api.get<NonNullable<typeof data>>(`/journal?${query({ limit: String(PAGE_SIZE), offset: String(offset) })}`).then(setData, (e) => setError(errorText(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [query, offset]);

  const set = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setOffset(0);
  };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title="Journal d'activité"
        subtitle={data?.seeAll ? 'Toutes les actions de tous les utilisateurs.' : 'Vos actions dans l’application.'}
        actions={
          <a className={cls.secondary} href={`/api/journal/export.csv?${query()}`}>
            <Download size={14} /> Exporter (CSV)
          </a>
        }
      />
      <div className={`${cls.card} p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2`}>
        <div className="relative col-span-2 md:col-span-3 lg:col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${cls.input} pl-8`} placeholder="Rechercher (montant, nom, motif…)" value={filters.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        <input type="date" className={cls.input} value={filters.from} onChange={(e) => set('from', e.target.value)} aria-label="Du" title="Du" />
        <input type="date" className={cls.input} value={filters.to} onChange={(e) => set('to', e.target.value)} aria-label="Au" title="Au" />
        <select className={cls.input} value={filters.module} onChange={(e) => set('module', e.target.value)}>
          <option value="">Tous les modules</option>
          {Object.entries(ACTIVITY_MODULES).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select className={cls.input} value={filters.action} onChange={(e) => set('action', e.target.value)}>
          <option value="">Toutes les actions</option>
          {Object.entries(ACTIVITY_ACTIONS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        {data?.seeAll && (
          <select className={`${cls.input} col-span-2 md:col-span-1`} value={filters.userId} onChange={(e) => set('userId', e.target.value)}>
            <option value="">Tous les utilisateurs</option>
            {data.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button className={cls.ghost} onClick={() => (setFilters({ from: '', to: '', userId: '', module: '', action: '', q: '' }), setOffset(0))}>
            <X size={13} /> Effacer les filtres
          </button>
        )}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <section className={cls.card}>
        {!data ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={History} title="Aucune action" text="Aucune entrée ne correspond à ces filtres." />
        ) : (
          <>
            <ul className="divide-y divide-gray-50">
              {data.items.map((e) => (
                <li key={e.id}>
                  <button onClick={() => setDetail(e)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50/60 cursor-pointer">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={ACTION_TONE[e.action] ?? 'gray'}>{ACTIVITY_ACTIONS[e.action] ?? e.action}</Badge>
                      <span className="text-[11px] font-semibold text-gray-500">{ACTIVITY_MODULES[e.module] ?? e.module}</span>
                      <span className="ml-auto text-[11px] text-gray-400">{formatDateTime(e.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-800 mt-1">{e.description}</p>
                    <p className="text-[11px] text-gray-400">{e.userName}</p>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs text-gray-500">
              <span>
                {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} sur {data.total}
              </span>
              <div className="flex gap-1">
                <button className={cls.ghost} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                  <ChevronLeft size={14} /> Précédent
                </button>
                <button className={cls.ghost} disabled={offset + PAGE_SIZE >= data.total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                  Suivant <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <Modal open={detail !== null} onClose={() => setDetail(null)} title="Détail de l'action" wide>
        {detail && (
          <div className="space-y-3 text-xs">
            <p className="text-sm text-gray-800">{detail.description}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Utilisateur', detail.userName],
                ['Date', formatDateTime(detail.timestamp)],
                ['Module', ACTIVITY_MODULES[detail.module] ?? detail.module],
                ['Action', ACTIVITY_ACTIONS[detail.action] ?? detail.action],
                ['Journée', detail.journeeDate ?? '—'],
                ['Adresse IP', detail.ip ?? '—'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-gray-50 px-2.5 py-1.5">
                  <p className="text-[10px] text-gray-400">{l}</p>
                  <p className="font-semibold text-gray-800 break-all">{v}</p>
                </div>
              ))}
            </div>
            {detail.journeeDate && (
              <button className={cls.ghost} onClick={() => (setDetail(null), navigate('historique', { jour: detail.journeeDate }, { keepDate: false }))}>
                Voir la fiche de la journée
              </button>
            )}
            {detail.details !== null && (
              <details>
                <summary className="cursor-pointer font-semibold text-gray-600">Données techniques (avant / après)</summary>
                <pre className="mt-2 p-3 rounded-lg bg-gray-900 text-gray-100 overflow-x-auto text-[11px] leading-relaxed">{JSON.stringify(detail.details, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
