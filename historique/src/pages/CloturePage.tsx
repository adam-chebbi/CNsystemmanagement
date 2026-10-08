import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, LoaderCircle, Lock, LockOpen, Printer, ShieldCheck } from 'lucide-react';
import { formatDT, formatDateFr } from '../../shared/model';
import { api, errorText } from '../api/client';
import type { DayResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alert, Amount, Badge, cls, EcartBadge, Field, formatDateTime, MoneyInput, PageHeader, ReasonModal, Spinner, useToast } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { useDirtyGuard } from '../lib/pwa';
import { navigate, type PageId } from '../lib/router';

const CHECK_LINKS: Record<string, PageId> = {
  ca: 'ca',
  ca_coherent: 'ca',
  comptage_especes: 'comptage',
  comptage_tickets: 'comptage',
  comptage_tpe: 'comptage',
  ecarts: 'comptage',
  justificatifs: 'depenses',
  incidents: 'notes',
};

export const CloturePage: React.FC = () => {
  const { day, loading, date, setDay } = useJournee();
  const { settings, canSupervise } = useAuth();
  const toast = useToast();
  const [fondLaisse, setFondLaisse] = useState<number | null>(null);
  const [montantRemis, setMontantRemis] = useState<number | null>(null);
  const [remisA, setRemisA] = useState('');
  const [note, setNote] = useState('');
  const [forcer, setForcer] = useState(false);
  const [motifForcage, setMotifForcage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reopen, setReopen] = useState(false);

  const counted = day?.summary.dernierComptage.especes?.moment === 'cloture' ? day.summary.dernierComptage.especes.totalCompte : null;

  useEffect(() => {
    if (!day) return;
    const f = day.journee?.fondLaisse ?? Math.min(settings.fondCaisseDefaut, counted ?? settings.fondCaisseDefaut);
    setFondLaisse(f);
    setMontantRemis(day.journee?.montantRemis ?? (counted !== null ? Math.max(0, counted - f) : 0));
    setRemisA(day.journee?.remisA ?? '');
    setNote(day.journee?.noteCloture ?? '');
    setError(null);
  }, [day?.date, day?.journee?.statut, counted]); // eslint-disable-line react-hooks/exhaustive-deps

  useDirtyGuard(note.trim().length > 0 && day?.journee?.statut === 'ouverte');

  if (!day) return <div className="flex justify-center py-20">{loading && <Spinner size={22} />}</div>;
  const j = day.journee;
  const closed = j?.statut === 'cloturee' || j?.statut === 'validee';
  const blocking = day.checks.filter((c) => c.bloquant && !c.ok);
  const repartition = (fondLaisse ?? 0) + (montantRemis ?? 0);

  const submit = async () => {
    if (fondLaisse === null) return setError('Indiquez le fond de caisse laissé pour demain.');
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<DayResponse>(`/journees/${date}/cloture`, {
        fondLaisse,
        montantRemis: montantRemis ?? 0,
        remisA: remisA.trim() || null,
        noteCloture: note.trim() || null,
        forcer,
        motifForcage: forcer ? motifForcage.trim() : undefined,
      });
      setDay(res);
      toast('Journée clôturée. Merci !');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const validate = async () => {
    setBusy(true);
    try {
      setDay(await api.post<DayResponse>(`/journees/${date}/valider`));
      toast('Journée validée.');
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const s = day.summary;

  return (
    <div className="space-y-4 animate-fade-up max-w-3xl">
      <PageHeader
        title={closed ? 'Journée clôturée' : 'Clôture de la journée'}
        subtitle={<span className="capitalize">{formatDateFr(date)}</span>}
        actions={
          <button className={cls.secondary} onClick={() => navigate('historique', { jour: date })}>
            <Printer size={14} /> Fiche imprimable
          </button>
        }
      />

      <section className={`${cls.card} p-4`}>
        <h2 className="text-sm font-bold text-gray-900 mb-3">Récapitulatif</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { l: 'Recettes', v: s.recettes.total },
            { l: 'Dépenses', v: s.depensesTotal },
            { l: 'Espèces attendues', v: s.especesAttendues },
            { l: 'Espèces comptées', v: counted },
          ].map((x) => (
            <div key={x.l} className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-500">{x.l}</p>
              {x.v === null ? <span className="text-xs text-gray-400">—</span> : <Amount value={x.v} className="text-sm font-bold text-gray-800" />}
            </div>
          ))}
        </div>
        {s.ecartTotalCloture !== null && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            Écart total de clôture : <EcartBadge ecart={s.ecartTotalCloture} tolerance={settings.toleranceEcart} />
          </div>
        )}
      </section>

      {closed && j ? (
        <section className={`${cls.card} p-4 space-y-3`}>
          <div className="flex items-center gap-2">
            {j.statut === 'validee' ? <ShieldCheck size={18} className="text-blue-600" /> : <Lock size={18} className="text-amber-600" />}
            <p className="text-sm font-bold text-gray-900">
              Clôturée par {j.clotureeParNom} le {j.clotureeLe && formatDateTime(j.clotureeLe)}
            </p>
            {j.statut === 'validee' && <Badge tone="blue">Validée par {j.valideeParNom}</Badge>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-500">Fond laissé en caisse</p>
              <Amount value={j.fondLaisse ?? 0} className="font-bold" />
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-500">Montant remis</p>
              <Amount value={j.montantRemis ?? 0} className="font-bold" />
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <p className="text-[11px] text-gray-500">Remis à</p>
              <p className="font-bold text-gray-800">{j.remisA ?? '—'}</p>
            </div>
          </div>
          {j.noteCloture && <p className="text-sm text-gray-700 bg-amber-50/60 rounded-xl px-3 py-2">« {j.noteCloture} »</p>}
          {j.reouvertureMotif && <p className="text-[11px] text-gray-400">Précédemment rouverte : « {j.reouvertureMotif} »</p>}
          {canSupervise ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <button className={cls.secondary} onClick={() => setReopen(true)}>
                <LockOpen size={14} /> Rouvrir pour correction
              </button>
              {j.statut === 'cloturee' && (
                <button className={cls.primary} onClick={validate} disabled={busy}>
                  <ShieldCheck size={14} /> Valider la journée
                </button>
              )}
            </div>
          ) : (
            <Alert>Une erreur ? Demandez à un superviseur de rouvrir la journée — la correction sera tracée dans le journal.</Alert>
          )}
        </section>
      ) : (
        <>
          <section className={`${cls.card} p-4`}>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Vérifications</h2>
            <ul className="space-y-1">
              {day.checks.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => !c.ok && navigate(CHECK_LINKS[c.id] ?? 'journee')}
                    className={`w-full flex items-start gap-2.5 text-left rounded-xl px-2.5 py-2 ${c.ok ? '' : 'hover:bg-gray-50 cursor-pointer'}`}
                  >
                    {c.ok ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : c.bloquant ? <Circle size={16} className="text-rose-400 shrink-0" /> : <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
                    <span className="flex-1 text-xs">
                      <span className={c.ok ? 'text-gray-500' : 'font-semibold text-gray-800'}>{c.label}</span>
                      {!c.ok && <span className="block text-[11px] text-gray-400">{c.detail ?? (c.bloquant ? 'Obligatoire — touchez pour y aller.' : 'Recommandé.')}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {day.canWrite ? (
            <section className={`${cls.card} p-4 space-y-4`}>
              <h2 className="text-sm font-bold text-gray-900">Répartition des espèces</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Fond de caisse laissé pour demain" required hint="Sera comparé au comptage d’ouverture de demain.">
                  <MoneyInput
                    value={fondLaisse}
                    onChange={(v) => {
                      setFondLaisse(v);
                      if (counted !== null) setMontantRemis(Math.max(0, counted - (v ?? 0)));
                    }}
                  />
                </Field>
                <Field label="Montant remis (coffre, propriétaire, banque)">
                  <MoneyInput value={montantRemis} onChange={setMontantRemis} />
                </Field>
              </div>
              {(montantRemis ?? 0) > 0 && (
                <Field label="Remis à" required>
                  <input className={cls.input} value={remisA} onChange={(e) => setRemisA(e.target.value)} placeholder="Ex. : M. Karim (propriétaire), coffre" />
                </Field>
              )}
              {counted !== null && repartition !== counted && (
                <Alert tone="warning">
                  Fond laissé + montant remis = {formatDT(repartition)} au lieu des {formatDT(counted)} comptés. Corrigez ou expliquez-le dans le message.
                </Alert>
              )}
              <Field label="Message pour l’équipe suivante (passation)" hint="Ex. : plus de lait, le TPE redémarre mal, le fournisseur de pain passe à 7h.">
                <textarea className={cls.input} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>

              {blocking.length > 0 && canSupervise && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 cursor-pointer">
                    <input type="checkbox" checked={forcer} onChange={(e) => setForcer(e.target.checked)} className="accent-amber-600" />
                    Forcer la clôture malgré les vérifications manquantes (superviseur)
                  </label>
                  {forcer && <input className={cls.input} value={motifForcage} onChange={(e) => setMotifForcage(e.target.value)} placeholder="Motif (obligatoire)" />}
                </div>
              )}
              {blocking.length > 0 && !canSupervise && <Alert tone="warning">Complétez les vérifications obligatoires ci-dessus pour pouvoir clôturer.</Alert>}
              {error && <Alert tone="error">{error}</Alert>}
              <div className="flex justify-end">
                <button className={cls.primary} onClick={submit} disabled={busy || !j || (blocking.length > 0 && !forcer)}>
                  {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Lock size={14} />}
                  Clôturer la journée
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-right">Après clôture, la journée passe en lecture seule.</p>
            </section>
          ) : (
            day.reason && <Alert tone="info">{day.reason}</Alert>
          )}
        </>
      )}

      <ReasonModal
        open={reopen}
        title="Rouvrir la journée ?"
        description="Les gérants pourront de nouveau modifier les saisies. Le motif est enregistré dans le journal."
        confirmLabel="Rouvrir"
        onClose={() => setReopen(false)}
        onConfirm={async (motif) => {
          try {
            setDay(await api.post<DayResponse>(`/journees/${date}/reouvrir`, { motif }));
            toast('Journée rouverte.');
          } catch (e) {
            throw new Error(errorText(e));
          }
        }}
      />
    </div>
  );
};
