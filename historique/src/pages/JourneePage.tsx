import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Circle,
  Coins,
  Lock,
  NotebookPen,
  Receipt,
  ScrollText,
  Wallet,
} from 'lucide-react';
import {
  COMPTAGE_MOMENT_LABELS,
  COMPTAGE_TYPE_LABELS,
  INCIDENT_CATEGORY_LABELS,
  MODE_PAIEMENT_LABELS,
  MOUVEMENT_BY_ID,
  formatDateFr,
  type Note,
} from '../../shared/model';
import { api } from '../api/client';
import type { Alertes } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert, Amount, Badge, cls, EcartBadge, formatTime, PageHeader, Spinner } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { navigate, type PageId } from '../lib/router';

type Accent = 'emerald' | 'rose' | 'blue' | 'amber';
const ACCENTS: Record<Accent, { box: string; icon: string; title: string; value: string }> = {
  emerald: { box: 'border-emerald-200 bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', title: 'text-emerald-700', value: 'text-emerald-900' },
  rose: { box: 'border-rose-200 bg-rose-50', icon: 'bg-rose-100 text-rose-600', title: 'text-rose-700', value: 'text-rose-900' },
  blue: { box: 'border-blue-200 bg-blue-50', icon: 'bg-blue-100 text-blue-600', title: 'text-blue-700', value: 'text-blue-900' },
  amber: { box: 'border-amber-200 bg-amber-50', icon: 'bg-amber-100 text-amber-600', title: 'text-amber-700', value: 'text-amber-900' },
};

const Kpi: React.FC<{ title: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ComponentType<{ size?: number }>; accent: Accent; to: PageId }> = ({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  to,
}) => {
  const a = ACCENTS[accent];
  return (
    <button onClick={() => navigate(to)} className={`group text-left rounded-2xl border p-4 transition hover:shadow-sm active:scale-[0.99] cursor-pointer ${a.box}`}>
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.icon}`}>
          <Icon size={16} />
        </span>
        <span className={`text-xs font-semibold ${a.title}`}>{title}</span>
      </div>
      <div className={`mt-3 text-lg sm:text-xl font-bold ${a.value}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-500">{sub}</div>}
    </button>
  );
};

interface TimelineItem {
  at: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
  title: string;
  detail: string;
  amount?: number;
  sign?: 1 | -1;
  cancelled?: boolean;
  by: string;
}

export const JourneePage: React.FC = () => {
  const { day, loading, error, date, isToday } = useJournee();
  const { settings, user } = useAuth();
  const [alertes, setAlertes] = useState<Alertes | null>(null);
  const [incidents, setIncidents] = useState<Note[]>([]);

  useEffect(() => {
    api.get<Alertes>('/alertes').then(setAlertes).catch(() => undefined);
    api
      .get<{ items: Note[] }>('/notes?statut=non_resolu&limit=6')
      .then((r) => setIncidents(r.items))
      .catch(() => undefined);
  }, [date]);

  if (error && !day) return <Alert tone="error">{error}</Alert>;
  if (!day) return <div className="flex justify-center py-20">{loading ? <Spinner size={22} /> : null}</div>;

  const s = day.summary;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const done = day.checks.filter((c) => c.ok).length;
  const lastCash = s.dernierComptage.especes;

  const timeline: TimelineItem[] = [
    ...day.ventes.map((v) => ({
      at: v.creeLe,
      icon: Receipt,
      tone: 'bg-emerald-50 text-emerald-600',
      title: `Vente — ${v.categorie}`,
      detail: `${MODE_PAIEMENT_LABELS[v.modePaiement]}${v.client ? ` · ${v.client}` : ''}`,
      amount: v.montant,
      sign: 1 as const,
      cancelled: v.statut === 'annulee',
      by: v.creeParNom,
    })),
    ...day.depenses.map((d) => ({
      at: d.creeLe,
      icon: Wallet,
      tone: 'bg-rose-50 text-rose-600',
      title: `Dépense — ${d.categorie}`,
      detail: d.beneficiaire ?? d.description ?? '',
      amount: d.montant,
      sign: -1 as const,
      cancelled: d.statut === 'annulee',
      by: d.creeParNom,
    })),
    ...day.mouvements.map((m) => ({
      at: m.creeLe,
      icon: ArrowLeftRight,
      tone: 'bg-blue-50 text-blue-600',
      title: MOUVEMENT_BY_ID[m.type].label,
      detail: m.personne ?? m.description ?? '',
      amount: m.montant,
      sign: MOUVEMENT_BY_ID[m.type].sens,
      cancelled: m.statut === 'annulee',
      by: m.creeParNom,
    })),
    ...day.comptages.map((c) => ({
      at: c.creeLe,
      icon: Calculator,
      tone: 'bg-violet-50 text-violet-600',
      title: `Comptage ${COMPTAGE_TYPE_LABELS[c.type].toLowerCase()} — ${COMPTAGE_MOMENT_LABELS[c.moment].toLowerCase()}`,
      detail: `Écart ${(c.ecart / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT`,
      amount: c.totalCompte,
      cancelled: c.statut === 'annulee',
      by: c.creeParNom,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 12);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title={isToday ? `${greeting}, ${user?.fullName.split(' ')[0] ?? ''}` : `Journée du ${formatDateFr(date)}`}
        subtitle={
          <>
            <span className="capitalize">{formatDateFr(date)}</span>
            {day.journee?.ouverteParNom ? ` · ouverte par ${day.journee.ouverteParNom}` : ' · rien de saisi pour le moment'}
          </>
        }
        actions={
          day.canWrite ? (
            <>
              <button className={cls.secondary} onClick={() => navigate('depenses', { nouveau: '1' })}>
                <Wallet size={14} /> Dépense
              </button>
              <button className={cls.primary} onClick={() => navigate('ventes', { nouveau: '1' })}>
                <Receipt size={14} /> Vente
              </button>
            </>
          ) : undefined
        }
      />

      {!day.canWrite && day.reason && (
        <Alert tone={day.journee?.statut === 'ouverte' || !day.journee ? 'warning' : 'info'}>
          <span className="inline-flex items-center gap-1 font-semibold">
            <Lock size={12} /> Lecture seule.
          </span>{' '}
          {day.reason}
        </Alert>
      )}

      {alertes && alertes.nonCloturees.filter((n) => n.date !== date).length > 0 && (
        <Alert tone="warning">
          <b>Journée(s) non clôturée(s) :</b>{' '}
          {alertes.nonCloturees
            .filter((n) => n.date !== date)
            .slice(0, 4)
            .map((n, i) => (
              <React.Fragment key={n.date}>
                {i > 0 && ', '}
                <button className="underline font-semibold cursor-pointer" onClick={() => navigate('cloture', { date: n.date }, { keepDate: false })}>
                  {formatDateFr(n.date, false)}
                </button>
              </React.Fragment>
            ))}
          . Pensez à les clôturer.
        </Alert>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          title="Recettes du jour"
          value={<Amount value={s.recettes.total} />}
          sub={s.source === 'ca' ? 'Selon le ticket Z' : s.source === 'ventes' ? 'Selon les ventes saisies' : 'Aucune vente saisie'}
          icon={Receipt}
          accent="emerald"
          to={s.source === 'ca' ? 'ca' : 'ventes'}
        />
        <Kpi title="Dépenses" value={<Amount value={s.depensesTotal} />} sub={`dont ${(s.depensesEspeces / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 3 })} DT en espèces`} icon={Wallet} accent="rose" to="depenses" />
        <Kpi title="Espèces attendues" value={<Amount value={s.especesAttendues} />} sub="Ce qui doit être dans la caisse" icon={Coins} accent="blue" to="comptage" />
        <Kpi
          title="Dernier comptage"
          value={lastCash ? <EcartBadge ecart={lastCash.ecart} tolerance={settings.toleranceEcart} /> : <span className="text-sm text-amber-800">Pas encore fait</span>}
          sub={lastCash ? `${COMPTAGE_MOMENT_LABELS[lastCash.moment]} · ${formatTime(lastCash.creeLe)}` : 'Comptez la caisse'}
          icon={Calculator}
          accent="amber"
          to="comptage"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className={`${cls.card} p-4 lg:col-span-2`}>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Caisse théorique</h2>
          <div className="divide-y divide-gray-50 text-sm">
            {[
              { l: `Fond de caisse d'ouverture${day.journee?.fondOuvertureSource === 'comptage' ? ' (compté)' : day.journee?.fondOuvertureSource === 'report' || (!day.journee && day.fondReporte !== null) ? ' (reporté de la veille)' : ' (par défaut)'}`, v: s.fondOuverture, sign: 0 },
              { l: 'Encaissements en espèces', v: s.recettes.especes, sign: 1 },
              { l: 'Entrées d’argent (apports, crédits remboursés…)', v: s.mouvementsEntrees, sign: 1 },
              { l: 'Sorties d’argent (retraits, versements…)', v: s.mouvementsSorties, sign: -1 },
              { l: 'Dépenses payées en espèces', v: s.depensesEspeces, sign: -1 },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between gap-3 py-2">
                <span className="text-gray-600 text-xs sm:text-sm">{r.l}</span>
                <span className={`font-semibold tabular-nums whitespace-nowrap text-xs sm:text-sm ${r.sign === -1 ? 'text-rose-600' : r.sign === 1 ? 'text-emerald-700' : 'text-gray-800'}`}>
                  {r.sign === -1 ? '− ' : r.sign === 1 ? '+ ' : ''}
                  <Amount value={r.v} />
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3">
              <span className="font-bold text-gray-900">Espèces attendues</span>
              <Amount value={s.especesAttendues} className="font-bold text-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {[
              { l: 'Carte (TPE)', v: s.recettes.tpe },
              { l: 'Tickets resto', v: s.recettes.ticketsResto },
              { l: 'Crédit client', v: s.recettes.credit },
              { l: 'Chèque / autre', v: s.recettes.cheque + s.recettes.autre },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] text-gray-500">{x.l}</p>
                <Amount value={x.v} className="text-sm font-bold text-gray-800" />
              </div>
            ))}
          </div>
          {s.ecartCaVentes !== null && s.ecartCaVentes !== 0 && (
            <Alert tone="info" className="mt-3">
              Le ticket Z diffère de la somme des ventes saisies de <Amount value={s.ecartCaVentes} sign />. Le ticket Z sert de référence.
            </Alert>
          )}
        </section>

        <section className={`${cls.card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Avant de clôturer</h2>
            <Badge tone={done === day.checks.length ? 'emerald' : 'gray'}>
              {done}/{day.checks.length}
            </Badge>
          </div>
          <ul className="space-y-2">
            {day.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-xs">
                {c.ok ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-px" /> : c.bloquant ? <Circle size={15} className="text-gray-300 shrink-0 mt-px" /> : <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-px" />}
                <span className={c.ok ? 'text-gray-500' : 'text-gray-800 font-medium'}>
                  {c.label}
                  {c.detail && !c.ok && <span className="block text-[11px] text-gray-400 font-normal">{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
          <button className={`${cls.primary} w-full mt-4`} onClick={() => navigate('cloture')} disabled={day.journee?.statut === 'validee'}>
            <Lock size={14} /> {day.journee?.statut === 'cloturee' || day.journee?.statut === 'validee' ? 'Voir la clôture' : 'Clôturer la journée'}
          </button>
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className={`${cls.card} p-4 lg:col-span-2`}>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Activité de la journée</h2>
          {timeline.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">Aucune saisie pour cette journée.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {timeline.map((t, i) => (
                <li key={i} className={`flex items-center gap-3 py-2.5 ${t.cancelled ? 'opacity-50' : ''}`}>
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${t.tone}`}>
                    <t.icon size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold text-gray-800 truncate ${t.cancelled ? 'line-through' : ''}`}>{t.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {formatTime(t.at)} · {t.by}
                      {t.detail ? ` · ${t.detail}` : ''}
                    </p>
                  </div>
                  {t.amount !== undefined && (
                    <span className={`text-xs font-bold tabular-nums ${t.sign === -1 ? 'text-rose-600' : t.sign === 1 ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {t.sign === -1 ? <ArrowDownRight size={12} className="inline" /> : t.sign === 1 ? <ArrowUpRight size={12} className="inline" /> : null}
                      <Amount value={t.amount} />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`${cls.card} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">Notes & incidents ouverts</h2>
            <button className={cls.ghost} onClick={() => navigate('notes')}>
              Tout voir
            </button>
          </div>
          {incidents.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Rien en attente. 👌</p>
          ) : (
            <ul className="space-y-2">
              {incidents.map((n) => (
                <li key={n.id}>
                  <button onClick={() => navigate('notes', { note: n.id })} className="w-full text-left p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {n.type === 'incident' ? <AlertTriangle size={12} className={n.priorite === 'urgente' ? 'text-rose-600' : 'text-amber-500'} /> : <NotebookPen size={12} className="text-gray-400" />}
                      <span className="text-xs font-semibold text-gray-800 truncate">{n.titre}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {n.categorie ? `${INCIDENT_CATEGORY_LABELS[n.categorie]} · ` : ''}
                      {n.creeParNom}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {alertes && (alertes.recusAFournir > 0 || alertes.ecartsNonJustifies.length > 0) && (
            <div className="mt-3 space-y-1.5">
              {alertes.recusAFournir > 0 && (
                <button onClick={() => navigate('depenses', { filtre: 'a_fournir' })} className="w-full flex items-center gap-2 text-left text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2.5 py-2 cursor-pointer">
                  <ScrollText size={13} /> {alertes.recusAFournir} reçu(s) de dépense à fournir
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
