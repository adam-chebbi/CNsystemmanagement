import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Calculator, CreditCard, EyeOff, LoaderCircle, Minus, Plus, RotateCcw, Ticket, Trash2 } from 'lucide-react';
import {
  COMPTAGE_MOMENT_LABELS,
  COMPTAGE_TYPE_LABELS,
  DENOMINATIONS,
  computeComptageTotal,
  formatDT,
  type Comptage,
  type ComptageMoment,
  type ComptageType,
  type TicketLine,
  type TpeLine,
} from '../../shared/model';
import { api, errorText, NetworkError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { EntryMeta, useCanTouch } from '../components/entries';
import { Alert, Amount, Badge, cls, EcartBadge, EmptyState, Field, MoneyInput, PageHeader, ReasonModal, Spinner, useToast } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { useDirtyGuard } from '../lib/pwa';
import { useReferentiels } from '../lib/useReferentiels';

interface Draft {
  denominations: Record<string, number>;
  vrac: number | null;
  tickets: TicketLine[];
  tpe: TpeLine[];
}

interface Preview {
  totalCompte: number;
  totalAttendu: number;
  ecart: number;
  justificationRequise: boolean;
  tolerance: number;
}

const TYPES: { id: ComptageType; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'especes', icon: Banknote },
  { id: 'tickets_resto', icon: Ticket },
  { id: 'tpe', icon: CreditCard },
];

const draftKey = (date: string, type: ComptageType) => `historique:comptage:${date}:${type}`;

const Stepper: React.FC<{ value: number; onChange: (n: number) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
  <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden">
    <button type="button" disabled={disabled || value <= 0} onClick={() => onChange(Math.max(0, value - 1))} className="w-9 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer" aria-label="Moins">
      <Minus size={14} />
    </button>
    <input
      inputMode="numeric"
      value={value === 0 ? '' : String(value)}
      placeholder="0"
      disabled={disabled}
      onChange={(e) => onChange(Math.min(100000, Number(e.target.value.replace(/\D/g, '') || 0)))}
      className="w-12 h-10 text-center text-sm font-bold tabular-nums focus:outline-none border-x border-gray-100"
    />
    <button type="button" disabled={disabled} onClick={() => onChange(value + 1)} className="w-9 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 cursor-pointer" aria-label="Plus">
      <Plus size={14} />
    </button>
  </div>
);

export const ComptagePage: React.FC = () => {
  const { day, loading, date, refresh } = useJournee();
  const { settings } = useAuth();
  const { list } = useReferentiels();
  const toast = useToast();
  const canTouch = useCanTouch();
  const emetteurs = list('emetteur_ticket');
  const terminaux = list('tpe');

  const [type, setType] = useState<ComptageType>('especes');
  const [moment, setMoment] = useState<ComptageMoment>('cloture');
  const [draft, setDraft] = useState<Draft>({ denominations: {}, vrac: null, tickets: [], tpe: [] });
  const [preview, setPreview] = useState<Preview | null>(null);
  const [justification, setJustification] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // Sensible default moment: nothing counted yet this morning → opening count.
  useEffect(() => {
    if (!day) return;
    const hasAny = day.comptages.some((c) => c.statut === 'active');
    const h = new Date().getHours();
    setMoment(!hasAny && h >= 5 && h < 13 ? 'ouverture' : h >= 18 || h < 5 ? 'cloture' : 'intermediaire');
  }, [day?.date]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore an unfinished count from this device (the phone locked, a customer interrupted…).
  useEffect(() => {
    const blank: Draft = {
      denominations: {},
      vrac: null,
      tickets: emetteurs.map((e) => ({ emetteur: e.label, valeur: e.valeur ?? 5000, quantite: 0 })),
      tpe: terminaux.map((t) => ({ terminal: t.label, montant: 0, nbTransactions: null })),
    };
    try {
      const saved = localStorage.getItem(draftKey(date, type));
      setDraft(saved ? { ...blank, ...JSON.parse(saved) } : blank);
    } catch {
      setDraft(blank);
    }
    setPreview(null);
    setJustification('');
    setError(null);
  }, [date, type, emetteurs.length, terminaux.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next: Draft) => {
    setDraft(next);
    setPreview(null);
    try {
      localStorage.setItem(draftKey(date, type), JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const details = useMemo(() => {
    if (type === 'especes') return { denominations: Object.entries(draft.denominations).map(([key, quantite]) => ({ key, quantite })).filter((d) => d.quantite > 0), vrac: draft.vrac ?? 0 };
    if (type === 'tickets_resto') return { tickets: draft.tickets.filter((t) => t.quantite > 0) };
    return { tpe: draft.tpe.filter((t) => t.montant > 0 || (t.nbTransactions ?? 0) > 0) };
  }, [draft, type]);
  const total = computeComptageTotal(type, details);
  const touched = total > 0;
  useDirtyGuard(touched);

  if (!day) return <div className="flex justify-center py-20">{loading && <Spinner size={22} />}</div>;
  const readOnly = !day.canWrite;

  const check = async () => {
    setBusy(true);
    setError(null);
    try {
      setPreview(await api.post<Preview>('/comptages/preview', { date, type, moment, details }));
    } catch (e) {
      setError(e instanceof NetworkError ? 'Le comptage nécessite une connexion pour calculer l’écart. Votre saisie est gardée sur l’appareil.' : errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (preview?.justificationRequise && justification.trim().length < 3) return setError('Expliquez l’écart avant d’enregistrer.');
    setBusy(true);
    setError(null);
    try {
      await api.post('/comptages', { id: crypto.randomUUID(), date, type, moment, details, justification: justification.trim() || null });
      localStorage.removeItem(draftKey(date, type));
      toast('Comptage enregistré.');
      setPreview(null);
      setJustification('');
      setDraft({ denominations: {}, vrac: null, tickets: draft.tickets.map((t) => ({ ...t, quantite: 0 })), tpe: draft.tpe.map((t) => ({ ...t, montant: 0, nbTransactions: null })) });
      await refresh();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const resetDraft = () => update({ denominations: {}, vrac: null, tickets: draft.tickets.map((t) => ({ ...t, quantite: 0 })), tpe: draft.tpe.map((t) => ({ ...t, montant: 0, nbTransactions: null })) });
  const comptages = day.comptages.slice().reverse();

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader title="Comptage de caisse" subtitle="Comptez d’abord ce qui est physiquement présent — le montant attendu n’apparaît qu’après." />
      {readOnly && day.reason && <Alert tone="info">{day.reason}</Alert>}

      {!readOnly && (
        <section className={`${cls.card} p-4 sm:p-5`}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                  type === t.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <t.icon size={16} />
                {COMPTAGE_TYPE_LABELS[t.id]}
              </button>
            ))}
          </div>

          <Field label="Moment du comptage" className="mb-4">
            <select className={cls.input} value={moment} onChange={(e) => (setMoment(e.target.value as ComptageMoment), setPreview(null))}>
              {(Object.keys(COMPTAGE_MOMENT_LABELS) as ComptageMoment[])
                .filter((m) => m !== 'ouverture' || type === 'especes')
                .map((m) => (
                  <option key={m} value={m}>
                    {COMPTAGE_MOMENT_LABELS[m]}
                  </option>
                ))}
            </select>
          </Field>
          {moment === 'ouverture' && <Alert className="mb-4">Comptez le fond de caisse trouvé en arrivant. Il sera comparé à ce que l’équipe précédente a déclaré avoir laissé.</Alert>}
          {moment === 'passation' && <Alert className="mb-4">Comptage fait à deux lors d’un changement de gérant : notez le nom de l’autre gérant dans la justification si besoin.</Alert>}

          {type === 'especes' && (
            <div className="space-y-4">
              {(['billet', 'piece'] as const).map((kind) => (
                <div key={kind}>
                  <p className="text-xs font-bold text-gray-800 mb-2">{kind === 'billet' ? 'Billets' : 'Pièces'}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DENOMINATIONS.filter((d) => d.kind === kind).map((d) => {
                      const q = draft.denominations[d.key] ?? 0;
                      return (
                        <div key={d.key} className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 ${q > 0 ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100'}`}>
                          <span className={`w-16 text-sm font-bold ${kind === 'billet' ? 'text-emerald-800' : 'text-amber-800'}`}>{d.label}</span>
                          <Stepper value={q} onChange={(n) => update({ ...draft, denominations: { ...draft.denominations, [d.key]: n } })} />
                          <Amount value={q * d.value} className="ml-auto text-xs font-semibold text-gray-500" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Field label="Monnaie en vrac / rouleaux (montant)" hint="Si vous pesez ou comptez la petite monnaie en bloc.">
                <MoneyInput value={draft.vrac} onChange={(v) => update({ ...draft, vrac: v })} />
              </Field>
            </div>
          )}

          {type === 'tickets_resto' && (
            <div className="space-y-2">
              {draft.tickets.map((t, i) => (
                <div key={i} className="grid grid-cols-[1fr_7.5rem_auto] sm:grid-cols-[1fr_9rem_auto_auto] items-center gap-2 rounded-xl border border-gray-100 px-3 py-2">
                  <input
                    className={`${cls.input} col-span-3 sm:col-span-1`}
                    value={t.emetteur}
                    onChange={(e) => update({ ...draft, tickets: draft.tickets.map((x, j) => (j === i ? { ...x, emetteur: e.target.value } : x)) })}
                    placeholder="Émetteur"
                  />
                  <MoneyInput value={t.valeur} onChange={(v) => update({ ...draft, tickets: draft.tickets.map((x, j) => (j === i ? { ...x, valeur: v ?? 0 } : x)) })} />
                  <Stepper value={t.quantite} onChange={(n) => update({ ...draft, tickets: draft.tickets.map((x, j) => (j === i ? { ...x, quantite: n } : x)) })} />
                  <button className="p-2 text-gray-300 hover:text-rose-600 cursor-pointer" onClick={() => update({ ...draft, tickets: draft.tickets.filter((_, j) => j !== i) })} aria-label="Retirer la ligne">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button className={cls.ghost} onClick={() => update({ ...draft, tickets: [...draft.tickets, { emetteur: emetteurs[0]?.label ?? 'Ticket', valeur: 5000, quantite: 0 }] })}>
                <Plus size={13} /> Ajouter une valeur de ticket
              </button>
              <p className="text-[11px] text-gray-400">Une ligne par émetteur et par valeur faciale (ex. Pluxee 5 DT × 12, Pluxee 10 DT × 3).</p>
            </div>
          )}

          {type === 'tpe' && (
            <div className="space-y-2">
              {draft.tpe.map((t, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_11rem_8rem_auto] items-end gap-2 rounded-xl border border-gray-100 px-3 py-2">
                  <Field label="Terminal">
                    <input className={cls.input} value={t.terminal} onChange={(e) => update({ ...draft, tpe: draft.tpe.map((x, j) => (j === i ? { ...x, terminal: e.target.value } : x)) })} />
                  </Field>
                  <Field label="Total du ticket de clôture">
                    <MoneyInput value={t.montant || null} onChange={(v) => update({ ...draft, tpe: draft.tpe.map((x, j) => (j === i ? { ...x, montant: v ?? 0 } : x)) })} />
                  </Field>
                  <Field label="Nb transactions">
                    <input
                      inputMode="numeric"
                      className={cls.input}
                      value={t.nbTransactions ?? ''}
                      onChange={(e) => update({ ...draft, tpe: draft.tpe.map((x, j) => (j === i ? { ...x, nbTransactions: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null } : x)) })}
                    />
                  </Field>
                  <button className="p-2 mb-1 text-gray-300 hover:text-rose-600 cursor-pointer justify-self-end" onClick={() => update({ ...draft, tpe: draft.tpe.filter((_, j) => j !== i) })} aria-label="Retirer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button className={cls.ghost} onClick={() => update({ ...draft, tpe: [...draft.tpe, { terminal: `TPE ${draft.tpe.length + 1}`, montant: 0, nbTransactions: null }] })}>
                <Plus size={13} /> Ajouter un terminal
              </button>
              <p className="text-[11px] text-gray-400">Lancez la clôture (télécollecte) sur le TPE et recopiez le total imprimé.</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-gray-900 text-white px-4 py-3">
            <div className="flex-1">
              <p className="text-[11px] text-gray-400">Total compté</p>
              <Amount value={total} className="text-xl font-bold" />
            </div>
            <button onClick={resetDraft} className="p-2 rounded-lg text-gray-400 hover:text-white cursor-pointer" title="Tout remettre à zéro" aria-label="Remettre à zéro">
              <RotateCcw size={16} />
            </button>
            {!preview && (
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold cursor-pointer disabled:opacity-50" onClick={check} disabled={busy}>
                {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Calculator size={15} />}
                Vérifier
              </button>
            )}
          </div>

          {preview && (
            <div className="mt-4 rounded-2xl border border-gray-200 p-4 space-y-3 animate-fade-up">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[11px] text-gray-500">Compté</p>
                  <Amount value={preview.totalCompte} className="text-sm font-bold" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Attendu</p>
                  <Amount value={preview.totalAttendu} className="text-sm font-bold" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-500">Écart</p>
                  <EcartBadge ecart={preview.ecart} tolerance={preview.tolerance} />
                </div>
              </div>
              {preview.justificationRequise ? (
                <>
                  <Alert tone="warning">
                    L’écart dépasse la tolérance de {formatDT(preview.tolerance)}. Recomptez si besoin ; sinon expliquez ce qui s’est passé (erreur de rendu, dépense non saisie, billet suspect…).
                  </Alert>
                  <Field label="Justification de l’écart" required>
                    <textarea className={cls.input} rows={3} value={justification} onChange={(e) => setJustification(e.target.value)} />
                  </Field>
                </>
              ) : (
                <Alert tone="success">Caisse juste (écart dans la tolérance de {formatDT(preview.tolerance)}).</Alert>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <button className={cls.secondary} onClick={() => setPreview(null)}>
                  <RotateCcw size={14} /> Recompter
                </button>
                <button className={cls.primary} onClick={save} disabled={busy}>
                  {busy && <LoaderCircle size={14} className="animate-spin" />}
                  Enregistrer le comptage
                </button>
              </div>
            </div>
          )}
          {error && <Alert tone="error" className="mt-3">{error}</Alert>}
          {!preview && touched && (
            <p className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
              <EyeOff size={11} /> Le montant attendu reste masqué jusqu’à la vérification.
            </p>
          )}
        </section>
      )}

      <section className={cls.card}>
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Comptages de la journée</h2>
        </div>
        {comptages.length === 0 ? (
          <EmptyState icon={Calculator} title="Aucun comptage" text="Faites au minimum un comptage à l’ouverture et un à la clôture." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {comptages.map((c: Comptage) => (
              <li key={c.id} className={`px-4 py-3 ${c.statut === 'annulee' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold text-gray-800 ${c.statut === 'annulee' ? 'line-through' : ''}`}>{COMPTAGE_TYPE_LABELS[c.type]}</span>
                  <Badge>{COMPTAGE_MOMENT_LABELS[c.moment]}</Badge>
                  <EcartBadge ecart={c.ecart} tolerance={settings.toleranceEcart} />
                  <span className="ml-auto text-xs text-gray-500">
                    compté <Amount value={c.totalCompte} className="font-bold text-gray-800" /> / attendu <Amount value={c.totalAttendu} />
                  </span>
                  {canTouch(c) && (
                    <button onClick={() => setCancelId(c.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Annuler le comptage">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                {c.justification && <p className="text-xs text-gray-600 mt-1 bg-amber-50/60 rounded-lg px-2 py-1">« {c.justification} »</p>}
                <EntryMeta e={c} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReasonModal
        open={cancelId !== null}
        title="Annuler ce comptage ?"
        description="Il restera visible, barré, avec votre motif. Refaites ensuite le comptage correct."
        confirmLabel="Annuler le comptage"
        danger
        onClose={() => setCancelId(null)}
        onConfirm={async (motif) => {
          try {
            await api.post(`/comptages/${cancelId}/annuler`, { motif });
            toast('Comptage annulé.');
            await refresh();
          } catch (e) {
            throw new Error(errorText(e));
          }
        }}
      />
    </div>
  );
};
