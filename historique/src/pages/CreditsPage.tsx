import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, HandCoins, Search, Users } from 'lucide-react';
import { formatDateFr } from '../../shared/model';
import { api, errorText } from '../api/client';
import { Alert, Amount, Badge, cls, EmptyState, PageHeader, Spinner } from '../components/ui';
import { navigate } from '../lib/router';

interface CreditClient {
  client: string;
  du: number;
  rembourse: number;
  solde: number;
  derniere: string;
  operations: { date: string; type: 'credit' | 'remboursement'; montant: number; description: string | null; par: string }[];
}

// The customers' tab ("l'ardoise"): built from sales paid "Crédit client" and the
// "Remboursement d'un crédit client" cash movements.
export const CreditsPage: React.FC = () => {
  const [data, setData] = useState<{ items: CreditClient[]; totalDu: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [soldes, setSoldes] = useState(true);

  useEffect(() => {
    api.get<{ items: CreditClient[]; totalDu: number }>('/credits').then(setData, (e) => setError(errorText(e)));
  }, []);

  const items = (data?.items ?? []).filter((c) => (!soldes || c.solde !== 0) && c.client.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="space-y-4 animate-fade-up max-w-3xl">
      <PageHeader
        title="Crédits clients"
        subtitle="Les clients qui ont consommé à crédit et ce qu’ils doivent encore."
        actions={
          <button className={cls.primary} onClick={() => navigate('mouvements', { nouveau: '1' })}>
            <HandCoins size={14} /> Encaisser un remboursement
          </button>
        }
      />
      {error && <Alert tone="error">{error}</Alert>}
      {data && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-amber-800">Total restant dû</span>
          <Amount value={data.totalDu} className="text-lg font-bold text-amber-900" />
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${cls.input} pl-8`} placeholder="Rechercher un client…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input type="checkbox" checked={soldes} onChange={(e) => setSoldes(e.target.checked)} className="accent-emerald-600" /> Masquer les comptes soldés
        </label>
      </div>
      <section className={cls.card}>
        {!data ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Users} title="Aucun crédit en cours" text="Une vente payée « Crédit client » apparaîtra ici avec le nom du client." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((c) => (
              <li key={c.client}>
                <button onClick={() => setOpen(open === c.client ? null : c.client)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/60 cursor-pointer">
                  {open === c.client ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{c.client}</p>
                    <p className="text-[11px] text-gray-400">Dernière opération : {formatDateFr(c.derniere, false)}</p>
                  </div>
                  {c.solde <= 0 ? <Badge tone="emerald">Soldé</Badge> : <Amount value={c.solde} className="text-sm font-bold text-amber-700" />}
                </button>
                {open === c.client && (
                  <div className="px-4 pb-3 pl-10 space-y-1">
                    <p className="text-[11px] text-gray-500">
                      Total consommé <Amount value={c.du} /> · remboursé <Amount value={c.rembourse} />
                    </p>
                    {c.operations.map((o, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                        <span className="text-gray-600">
                          {formatDateFr(o.date, false)} · {o.type === 'credit' ? 'Crédit' : 'Remboursement'} · {o.par}
                          {o.description ? ` · ${o.description}` : ''}
                        </span>
                        <span className={`font-semibold tabular-nums ${o.type === 'credit' ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {o.type === 'credit' ? '+' : '−'}
                          <Amount value={o.montant} />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
