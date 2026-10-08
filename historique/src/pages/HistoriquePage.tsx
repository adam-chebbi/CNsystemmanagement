import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Download, ExternalLink, Lock, Printer, ShieldCheck } from 'lucide-react';
import {
  COMPTAGE_MOMENT_LABELS,
  COMPTAGE_TYPE_LABELS,
  JOURNEE_STATUT_LABELS,
  MODE_DEPENSE_LABELS,
  MODE_PAIEMENT_LABELS,
  MOUVEMENT_BY_ID,
  addDays,
  formatDT,
  formatDateFr,
  type Journee,
  type JourneeStatut,
} from '../../shared/model';
import { api, errorText } from '../api/client';
import type { DayResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert, Amount, Badge, cls, EcartBadge, EmptyState, formatDateTime, formatTime, PageHeader, Spinner } from '../components/ui';
import { navigate, setParam, useRoute } from '../lib/router';

interface ListItem {
  journee: Journee;
  recettes: number;
  source: string;
  depenses: number;
  especesAttendues: number;
  ecartCloture: number | null;
  ecartsNonJustifies: number;
  aEcart: boolean;
}

const STATUT_TONE: Record<JourneeStatut, 'emerald' | 'amber' | 'blue'> = { ouverte: 'emerald', cloturee: 'amber', validee: 'blue' };

const firstOfMonth = (iso: string, offset = 0) => {
  const [y, m] = iso.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const csvDownload = (name: string, rows: (string | number)[][]) => {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([`﻿${rows.map((r) => r.map(esc).join(';')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
const dt = (m: number) => (m / 1000).toFixed(3).replace('.', ',');

const DaySheet: React.FC<{ date: string }> = ({ date }) => {
  const { settings } = useAuth();
  const [day, setDay] = useState<DayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDay(null);
    api.get<DayResponse>(`/journees/${date}`).then(setDay, (e) => setError(errorText(e)));
  }, [date]);
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!day) return <div className="flex justify-center py-16"><Spinner /></div>;
  const s = day.summary;
  const j = day.journee;
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="break-inside-avoid">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">{title}</h3>
      {children}
    </section>
  );
  const Row: React.FC<{ l: React.ReactNode; v: React.ReactNode; muted?: boolean }> = ({ l, v, muted }) => (
    <div className={`flex justify-between gap-3 py-1 text-xs border-b border-gray-50 ${muted ? 'opacity-50 line-through' : ''}`}>
      <span className="text-gray-600">{l}</span>
      <span className="font-semibold tabular-nums text-gray-900 text-right">{v}</span>
    </div>
  );
  return (
    <div className={`${cls.card} print-sheet p-5 sm:p-7 space-y-6`}>
      <div className="flex items-start gap-3">
        <img src="/logo.png" alt="" className="h-9 w-auto" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-900 capitalize">Journée du {formatDateFr(date)}</h2>
          <p className="text-[11px] text-gray-500">
            {j ? (
              <>
                {JOURNEE_STATUT_LABELS[j.statut]}
                {j.clotureeParNom && ` · clôturée par ${j.clotureeParNom} le ${formatDateTime(j.clotureeLe!)}`}
                {j.valideeParNom && ` · validée par ${j.valideeParNom}`}
              </>
            ) : (
              'Aucune saisie'
            )}
          </p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        <Section title="Recettes">
          <Row l={`Total (${s.source === 'ca' ? 'ticket Z' : 'ventes saisies'})`} v={formatDT(s.recettes.total)} />
          <Row l="Espèces" v={formatDT(s.recettes.especes)} />
          <Row l="Carte (TPE)" v={formatDT(s.recettes.tpe)} />
          <Row l="Tickets resto" v={formatDT(s.recettes.ticketsResto)} />
          <Row l="Crédit client" v={formatDT(s.recettes.credit)} />
          <Row l="Chèque / autre" v={formatDT(s.recettes.cheque + s.recettes.autre)} />
          {day.ca && (
            <p className="text-[11px] text-gray-400 mt-1">
              Z saisi par {day.ca.saisiParNom}
              {day.ca.nbTickets !== null && ` · ${day.ca.nbTickets} tickets`}
              {day.ca.remises > 0 && ` · remises ${formatDT(day.ca.remises)}`}
              {day.ca.offerts > 0 && ` · offerts ${formatDT(day.ca.offerts)}`}
              {day.ca.note && ` · « ${day.ca.note} »`}
            </p>
          )}
        </Section>
        <Section title="Caisse">
          <Row l="Fond d'ouverture" v={formatDT(s.fondOuverture)} />
          <Row l="+ Espèces encaissées" v={formatDT(s.recettes.especes)} />
          <Row l="+ Entrées d'argent" v={formatDT(s.mouvementsEntrees)} />
          <Row l="− Sorties d'argent" v={formatDT(s.mouvementsSorties)} />
          <Row l="− Dépenses en espèces" v={formatDT(s.depensesEspeces)} />
          <Row l={<b>Espèces attendues</b>} v={formatDT(s.especesAttendues)} />
          {j?.fondLaisse !== null && j?.fondLaisse !== undefined && <Row l="Fond laissé pour le lendemain" v={formatDT(j.fondLaisse)} />}
          {j?.montantRemis ? <Row l={`Remis à ${j.remisA ?? '—'}`} v={formatDT(j.montantRemis)} /> : null}
        </Section>
      </div>
      <Section title={`Comptages (${day.comptages.length})`}>
        {day.comptages.length === 0 ? (
          <p className="text-xs text-gray-400">Aucun comptage.</p>
        ) : (
          day.comptages.map((c) => (
            <div key={c.id} className={`py-1.5 border-b border-gray-50 text-xs ${c.statut === 'annulee' ? 'opacity-50 line-through' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {COMPTAGE_TYPE_LABELS[c.type]} — {COMPTAGE_MOMENT_LABELS[c.moment]}
                </span>
                <span className="text-gray-400">
                  {formatTime(c.creeLe)} · {c.creeParNom}
                </span>
                <span className="ml-auto tabular-nums">
                  {formatDT(c.totalCompte)} / {formatDT(c.totalAttendu)}
                </span>
                <EcartBadge ecart={c.ecart} tolerance={settings.toleranceEcart} />
              </div>
              {c.justification && <p className="text-gray-500 mt-0.5">« {c.justification} »</p>}
            </div>
          ))
        )}
      </Section>
      <div className="grid sm:grid-cols-2 gap-6">
        <Section title={`Ventes (${day.ventes.length})`}>
          {day.ventes.length === 0 && <p className="text-xs text-gray-400">Aucune.</p>}
          {day.ventes.map((v) => (
            <Row key={v.id} muted={v.statut === 'annulee'} l={`${v.heure ?? formatTime(v.creeLe)} · ${v.categorie} · ${MODE_PAIEMENT_LABELS[v.modePaiement]}${v.client ? ` (${v.client})` : ''}`} v={formatDT(v.montant)} />
          ))}
        </Section>
        <Section title={`Dépenses (${day.depenses.length})`}>
          {day.depenses.length === 0 && <p className="text-xs text-gray-400">Aucune.</p>}
          {day.depenses.map((d) => (
            <Row
              key={d.id}
              muted={d.statut === 'annulee'}
              l={`${d.heure ?? formatTime(d.creeLe)} · ${d.categorie}${d.beneficiaire ? ` (${d.beneficiaire})` : ''} · ${MODE_DEPENSE_LABELS[d.modePaiement]}${d.justificatif !== 'oui' ? ' · sans reçu' : ''}`}
              v={formatDT(d.montant)}
            />
          ))}
        </Section>
      </div>
      {day.mouvements.length > 0 && (
        <Section title={`Mouvements de caisse (${day.mouvements.length})`}>
          {day.mouvements.map((m) => (
            <Row
              key={m.id}
              muted={m.statut === 'annulee'}
              l={`${m.heure ?? formatTime(m.creeLe)} · ${MOUVEMENT_BY_ID[m.type].label}${m.personne ? ` (${m.personne})` : ''}`}
              v={`${MOUVEMENT_BY_ID[m.type].sens === 1 ? '+' : '−'}${formatDT(m.montant)}`}
            />
          ))}
        </Section>
      )}
      {j?.noteCloture && (
        <Section title="Message de clôture">
          <p className="text-xs text-gray-700">« {j.noteCloture} »</p>
        </Section>
      )}
      <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">Édité le {formatDateTime(new Date().toISOString())} — Historique & Comptage Café Noir</p>
    </div>
  );
};

export const HistoriquePage: React.FC = () => {
  const { businessDate, settings } = useAuth();
  const { params } = useRoute();
  const jour = params.get('jour');
  const [preset, setPreset] = useState('30');
  const [from, setFrom] = useState(addDays(businessDate, -29));
  const [to, setTo] = useState(businessDate);
  const [statut, setStatut] = useState('');
  const [ecart, setEcart] = useState(false);
  const [data, setData] = useState<{ items: ListItem[]; total: number; totals: { recettes: number; depenses: number; ecarts: number } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (p: string) => {
    setPreset(p);
    if (p === '7') (setFrom(addDays(businessDate, -6)), setTo(businessDate));
    if (p === '30') (setFrom(addDays(businessDate, -29)), setTo(businessDate));
    if (p === 'mois') (setFrom(firstOfMonth(businessDate)), setTo(businessDate));
    if (p === 'mois_prec') (setFrom(firstOfMonth(businessDate, -1)), setTo(addDays(firstOfMonth(businessDate), -1)));
  };

  useEffect(() => {
    if (jour) return;
    const p = new URLSearchParams({ from, to, limit: '366' });
    if (statut) p.set('statut', statut);
    if (ecart) p.set('ecart', '1');
    setData(null);
    api.get<NonNullable<typeof data>>(`/journees?${p}`).then(setData, (e) => setError(errorText(e)));
  }, [from, to, statut, ecart, jour]);

  const exportCsv = useMemo(
    () => () =>
      data &&
      csvDownload(`historique-${from}-au-${to}.csv`, [
        ['Date', 'Statut', 'Recettes (DT)', 'Source', 'Dépenses (DT)', 'Espèces attendues (DT)', 'Écart de clôture (DT)', 'Écarts non justifiés', 'Clôturée par'],
        ...data.items.map((i) => [
          i.journee.date,
          JOURNEE_STATUT_LABELS[i.journee.statut],
          dt(i.recettes),
          i.source === 'ca' ? 'Ticket Z' : 'Ventes',
          dt(i.depenses),
          dt(i.especesAttendues),
          i.ecartCloture === null ? '' : dt(i.ecartCloture),
          i.ecartsNonJustifies,
          i.journee.clotureeParNom ?? '',
        ]),
      ]),
    [data, from, to]
  );

  if (jour)
    return (
      <div className="space-y-4 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button className={cls.secondary} onClick={() => setParam('jour', null)}>
            <ArrowLeft size={14} /> Retour à la liste
          </button>
          <div className="flex-1" />
          <button className={cls.secondary} onClick={() => navigate('journee', { date: jour }, { keepDate: false })}>
            <ExternalLink size={14} /> Ouvrir la journée
          </button>
          <button className={cls.primary} onClick={() => window.print()}>
            <Printer size={14} /> Imprimer / PDF
          </button>
        </div>
        <DaySheet date={jour} />
      </div>
    );

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title="Historique des journées"
        subtitle="Toutes les journées saisies, leurs recettes, dépenses et écarts de caisse."
        actions={
          data && data.items.length > 0 ? (
            <button className={cls.secondary} onClick={exportCsv}>
              <Download size={14} /> Exporter (CSV)
            </button>
          ) : undefined
        }
      />
      <div className={`${cls.card} p-3 flex flex-wrap items-end gap-2`}>
        <div className="flex flex-wrap gap-1">
          {[
            ['7', '7 jours'],
            ['30', '30 jours'],
            ['mois', 'Ce mois'],
            ['mois_prec', 'Mois dernier'],
          ].map(([id, l]) => (
            <button key={id} onClick={() => applyPreset(id)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${preset === id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {l}
            </button>
          ))}
        </div>
        <input type="date" className={`${cls.input} w-auto`} value={from} max={to} onChange={(e) => (setFrom(e.target.value), setPreset(''))} aria-label="Du" />
        <input type="date" className={`${cls.input} w-auto`} value={to} min={from} max={businessDate} onChange={(e) => (setTo(e.target.value), setPreset(''))} aria-label="Au" />
        <select className={`${cls.input} w-auto`} value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="ouverte">Ouvertes</option>
          <option value="cloturee">Clôturées</option>
          <option value="validee">Validées</option>
        </select>
        <label className="inline-flex items-center gap-2 text-xs text-gray-600 px-2 py-2 cursor-pointer">
          <input type="checkbox" checked={ecart} onChange={(e) => setEcart(e.target.checked)} className="accent-emerald-600" /> Avec écart seulement
        </label>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {data && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-[11px] font-semibold text-emerald-700">Recettes</p>
            <Amount value={data.totals.recettes} className="text-sm sm:text-base font-bold text-emerald-900" />
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-[11px] font-semibold text-rose-700">Dépenses</p>
            <Amount value={data.totals.depenses} className="text-sm sm:text-base font-bold text-rose-900" />
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-[11px] font-semibold text-amber-700">Cumul des écarts</p>
            <Amount value={data.totals.ecarts} sign className="text-sm sm:text-base font-bold text-amber-900" />
          </div>
        </div>
      )}
      <section className={cls.card}>
        {!data ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Aucune journée" text="Aucune journée ne correspond à ces filtres." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.items.map((i) => (
              <li key={i.journee.id}>
                <button onClick={() => setParam('jour', i.journee.date)} className="w-full flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-gray-50/60 cursor-pointer">
                  <div className="min-w-[9rem] flex-1">
                    <p className="text-sm font-semibold text-gray-800 capitalize">{formatDateFr(i.journee.date)}</p>
                    <p className="text-[11px] text-gray-400">{i.journee.clotureeParNom ? `Clôturée par ${i.journee.clotureeParNom}` : `Ouverte par ${i.journee.ouverteParNom ?? '—'}`}</p>
                  </div>
                  <Badge tone={STATUT_TONE[i.journee.statut]}>
                    {i.journee.statut === 'validee' ? <ShieldCheck size={10} /> : i.journee.statut === 'cloturee' ? <Lock size={10} /> : null}
                    {JOURNEE_STATUT_LABELS[i.journee.statut]}
                  </Badge>
                  <div className="text-right w-28">
                    <p className="text-[10px] text-gray-400">Recettes</p>
                    <Amount value={i.recettes} className="text-xs font-bold text-gray-800" />
                  </div>
                  <div className="text-right w-28">
                    <p className="text-[10px] text-gray-400">Dépenses</p>
                    <Amount value={i.depenses} className="text-xs font-bold text-rose-600" />
                  </div>
                  <div className="w-36 flex justify-end">{i.ecartCloture === null ? <span className="text-[11px] text-gray-400">Pas de comptage</span> : <EcartBadge ecart={i.ecartCloture} tolerance={settings.toleranceEcart} />}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
