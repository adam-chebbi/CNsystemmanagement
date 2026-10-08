import React, { useEffect, useState } from 'react';
import { LoaderCircle, ScrollText } from 'lucide-react';
import { formatDT, sumModeFields } from '../../shared/model';
import { api, errorText } from '../api/client';
import type { DayResponse } from '../api/types';
import { Alert, Amount, cls, Field, formatDateTime, MoneyInput, PageHeader, Spinner, useToast } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { useDirtyGuard } from '../lib/pwa';

type Fields = 'total' | 'especes' | 'tpe' | 'ticketsResto' | 'credit' | 'cheque' | 'autre' | 'remises' | 'annulations' | 'offerts';

const BREAKDOWN: { key: Fields; label: string }[] = [
  { key: 'especes', label: 'Espèces' },
  { key: 'tpe', label: 'Carte (TPE)' },
  { key: 'ticketsResto', label: 'Tickets resto' },
  { key: 'credit', label: 'Crédit client' },
  { key: 'cheque', label: 'Chèque' },
  { key: 'autre', label: 'Autre' },
];

const INFO: { key: Fields; label: string; hint: string }[] = [
  { key: 'remises', label: 'Remises accordées', hint: 'Réductions faites aux clients' },
  { key: 'annulations', label: 'Annulations / retours', hint: 'Tickets annulés sur la caisse' },
  { key: 'offerts', label: 'Offerts / consommations du personnel', hint: 'Ce qui a été servi sans être payé' },
];

const empty = (): Record<Fields, number | null> => ({ total: null, especes: null, tpe: null, ticketsResto: null, credit: null, cheque: null, autre: null, remises: null, annulations: null, offerts: null });

// "Chiffre d'affaires" = the till's end-of-day report (ticket Z). Once entered it becomes the
// reference for what should be in the till, over the individual ventes lines.
export const CaPage: React.FC = () => {
  const { day, loading, date, setDay } = useJournee();
  const toast = useToast();
  const [v, setV] = useState(empty);
  const [nbTickets, setNbTickets] = useState('');
  const [nbCouverts, setNbCouverts] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!day) return;
    const ca = day.ca;
    setV(
      ca
        ? { total: ca.total, especes: ca.especes, tpe: ca.tpe, ticketsResto: ca.ticketsResto, credit: ca.credit, cheque: ca.cheque, autre: ca.autre, remises: ca.remises, annulations: ca.annulations, offerts: ca.offerts }
        : empty()
    );
    setNbTickets(ca?.nbTickets?.toString() ?? '');
    setNbCouverts(ca?.nbCouverts?.toString() ?? '');
    setNote(ca?.note ?? '');
    setDirty(false);
    setError(null);
  }, [day?.date, day?.ca?.majLe]); // eslint-disable-line react-hooks/exhaustive-deps

  useDirtyGuard(dirty);

  if (!day) return <div className="flex justify-center py-20">{loading && <Spinner size={22} />}</div>;

  const set = (k: Fields, val: number | null) => {
    setV((p) => ({ ...p, [k]: val }));
    setDirty(true);
  };
  const n = (k: Fields) => v[k] ?? 0;
  const breakdown = sumModeFields({ especes: n('especes'), tpe: n('tpe'), ticketsResto: n('ticketsResto'), credit: n('credit'), cheque: n('cheque'), autre: n('autre') });
  const diff = v.total === null ? null : breakdown - v.total;
  const readOnly = !day.canWrite;
  const ventes = day.summary.ventes;

  const submit = async () => {
    if (v.total === null) return setError('Saisissez le total du ticket Z.');
    if (diff !== 0 && !note.trim()) return setError(`La répartition (${formatDT(breakdown)}) ne correspond pas au total (${formatDT(v.total)}). Corrigez ou expliquez dans la note.`);
    setBusy(true);
    setError(null);
    try {
      const res = await api.put<DayResponse>(`/journees/${date}/ca`, {
        total: v.total,
        especes: n('especes'),
        tpe: n('tpe'),
        ticketsResto: n('ticketsResto'),
        credit: n('credit'),
        cheque: n('cheque'),
        autre: n('autre'),
        remises: n('remises'),
        annulations: n('annulations'),
        offerts: n('offerts'),
        nbTickets: nbTickets ? Number(nbTickets) : null,
        nbCouverts: nbCouverts ? Number(nbCouverts) : null,
        note: note.trim() || null,
      });
      setDay(res);
      setDirty(false);
      toast("Chiffre d'affaires enregistré.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const prefillFromVentes = () => {
    setV((p) => ({ ...p, total: ventes.total, especes: ventes.especes, tpe: ventes.tpe, ticketsResto: ventes.ticketsResto, credit: ventes.credit, cheque: ventes.cheque, autre: ventes.autre }));
    setDirty(true);
  };

  return (
    <div className="space-y-4 animate-fade-up max-w-3xl">
      <PageHeader
        title="Chiffre d'affaires (ticket Z)"
        subtitle={day.ca ? `Saisi par ${day.ca.saisiParNom} — dernière mise à jour ${formatDateTime(day.ca.majLe)}` : 'Recopiez le ticket Z imprimé par la caisse en fin de journée.'}
      />
      {readOnly && day.reason && <Alert tone="info">{day.reason}</Alert>}

      <section className={`${cls.card} p-4 sm:p-5 space-y-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Total TTC du ticket Z" required className="flex-1 min-w-[200px]">
            <MoneyInput value={v.total} onChange={(x) => set('total', x)} disabled={readOnly} />
          </Field>
          {!readOnly && ventes.total > 0 && (
            <button className={cls.ghost} onClick={prefillFromVentes} type="button">
              <ScrollText size={13} /> Reprendre les ventes saisies (<Amount value={ventes.total} />)
            </button>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-gray-800 mb-2">Répartition par mode de paiement</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BREAKDOWN.map((b) => (
              <Field key={b.key} label={b.label}>
                <MoneyInput value={v[b.key]} onChange={(x) => set(b.key, x)} disabled={readOnly} />
              </Field>
            ))}
          </div>
          {v.total !== null && (
            <div className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold ${diff === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              <span>Somme de la répartition : {formatDT(breakdown)}</span>
              <span>{diff === 0 ? 'Cohérent ✓' : `Écart ${formatDT(diff!, { sign: true })}`}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-gray-800 mb-2">Informations du ticket (facultatif)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {INFO.map((b) => (
              <Field key={b.key} label={b.label} hint={b.hint}>
                <MoneyInput value={v[b.key]} onChange={(x) => set(b.key, x)} disabled={readOnly} />
              </Field>
            ))}
            <Field label="Nombre de tickets">
              <input inputMode="numeric" className={cls.input} value={nbTickets} onChange={(e) => (setNbTickets(e.target.value.replace(/\D/g, '')), setDirty(true))} disabled={readOnly} />
            </Field>
            <Field label="Nombre de couverts">
              <input inputMode="numeric" className={cls.input} value={nbCouverts} onChange={(e) => (setNbCouverts(e.target.value.replace(/\D/g, '')), setDirty(true))} disabled={readOnly} />
            </Field>
          </div>
        </div>

        <Field label="Note" required={diff !== null && diff !== 0} hint="Ex. : caisse en panne de 14h à 15h, ventes notées à la main.">
          <textarea className={cls.input} rows={2} value={note} onChange={(e) => (setNote(e.target.value), setDirty(true))} disabled={readOnly} />
        </Field>

        {ventes.total > 0 && v.total !== null && v.total !== ventes.total && (
          <Alert tone="info">
            Les ventes saisies au fil de la journée totalisent <Amount value={ventes.total} className="font-bold" /> (écart <Amount value={v.total - ventes.total} sign /> avec le Z). Le ticket Z sert de référence pour le comptage.
          </Alert>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        {!readOnly && (
          <div className="flex justify-end">
            <button className={cls.primary} onClick={submit} disabled={busy || !dirty}>
              {busy && <LoaderCircle size={14} className="animate-spin" />}
              {day.ca ? 'Enregistrer la correction' : 'Enregistrer le ticket Z'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
