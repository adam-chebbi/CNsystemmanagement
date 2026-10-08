import React, { useEffect, useState } from 'react';
import { ArrowDownCircle, ArrowLeftRight, ArrowUpCircle, LoaderCircle, Plus } from 'lucide-react';
import { MOUVEMENT_BY_ID, MOUVEMENT_TYPES, type Mouvement, type MouvementType } from '../../shared/model';
import { errorText } from '../api/client';
import { EntryActions, EntryMeta, ShowCancelledToggle, useCreateParam, useSaveEntry } from '../components/entries';
import { Alert, Amount, cls, EmptyState, Field, Modal, MoneyInput, nowHHMM, PageHeader, Spinner } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { useDirtyGuard } from '../lib/pwa';

const MouvementForm: React.FC<{ open: boolean; editing: Mouvement | null; onClose: () => void }> = ({ open, editing, onClose }) => {
  const save = useSaveEntry('mouvements', 'Mouvement', false);
  const [type, setType] = useState<MouvementType>('retrait_proprietaire');
  const [montant, setMontant] = useState<number | null>(null);
  const [personne, setPersonne] = useState('');
  const [description, setDescription] = useState('');
  const [heure, setHeure] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(editing?.type ?? 'retrait_proprietaire');
    setMontant(editing?.montant ?? null);
    setPersonne(editing?.personne ?? '');
    setDescription(editing?.description ?? '');
    setHeure(editing?.heure ?? nowHHMM());
    setError(null);
  }, [open, editing]);
  useDirtyGuard(open && montant !== null);

  const def = MOUVEMENT_BY_ID[type];
  const submit = async () => {
    if (!montant || montant <= 0) return setError('Saisissez un montant.');
    if (def.needsPerson && !personne.trim()) return setError(def.needsPerson === 'client' ? 'Indiquez le client.' : 'Indiquez à qui l’argent a été remis.');
    if ((type === 'autre_entree' || type === 'autre_sortie') && !description.trim()) return setError('Précisez le motif.');
    setBusy(true);
    setError(null);
    try {
      await save(editing?.id ?? null, { type, montant, personne: personne.trim() || null, description: description.trim() || null, heure: heure || null });
      onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const group = (sens: 1 | -1) => MOUVEMENT_TYPES.filter((m) => m.sens === sens);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifier le mouvement' : 'Mouvement de caisse'}
      subtitle="Tout argent qui entre ou sort de la caisse sans être une vente ni une dépense."
      footer={
        <button className={cls.primary} onClick={submit} disabled={busy}>
          {busy && <LoaderCircle size={14} className="animate-spin" />}
          Enregistrer
        </button>
      }
    >
      <div className="space-y-4">
        {([1, -1] as const).map((sens) => (
          <div key={sens}>
            <p className={`text-xs font-bold mb-1.5 flex items-center gap-1 ${sens === 1 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {sens === 1 ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
              {sens === 1 ? 'Entrée dans la caisse' : 'Sortie de la caisse'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {group(sens).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setType(m.id)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold text-left cursor-pointer transition ${
                    type === m.id ? (sens === 1 ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500' : 'border-rose-400 bg-rose-50 text-rose-800 ring-1 ring-rose-400') : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <Field label="Montant" required>
          <MoneyInput value={montant} onChange={setMontant} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={def.needsPerson === 'client' ? 'Client' : 'Personne'} required={Boolean(def.needsPerson)} className="col-span-2">
            <input className={cls.input} value={personne} onChange={(e) => setPersonne(e.target.value)} placeholder={def.needsPerson === 'client' ? 'Nom du client' : 'Qui a pris / remis l’argent'} />
          </Field>
          <Field label="Heure">
            <input type="time" className={cls.input} value={heure} onChange={(e) => setHeure(e.target.value)} />
          </Field>
        </div>
        <Field label="Motif / commentaire" required={type === 'autre_entree' || type === 'autre_sortie'}>
          <input className={cls.input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex. : monnaie pour la caisse, versement BIAT…" />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
};

export const MouvementsPage: React.FC = () => {
  const { day, loading } = useJournee();
  const [createOpen, setCreateOpen] = useCreateParam();
  const [editing, setEditing] = useState<Mouvement | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  if (!day) return <div className="flex justify-center py-20">{loading && <Spinner size={22} />}</div>;
  const items = day.mouvements;
  const visible = items.filter((m) => showCancelled || m.statut === 'active').slice().reverse();

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title="Mouvements de caisse"
        subtitle="Apports de monnaie, retraits du propriétaire, versements en banque, crédits remboursés…"
        actions={
          day.canWrite && (
            <button className={cls.primary} onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Nouveau mouvement
            </button>
          )
        }
      />
      {!day.canWrite && day.reason && <Alert tone="info">{day.reason}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-700">Entrées</p>
          <Amount value={day.summary.mouvementsEntrees} className="text-lg font-bold text-emerald-900" />
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold text-rose-700">Sorties</p>
          <Amount value={day.summary.mouvementsSorties} className="text-lg font-bold text-rose-900" />
        </div>
      </div>
      <section className={cls.card}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Mouvements de la journée</h2>
          <ShowCancelledToggle value={showCancelled} onChange={setShowCancelled} count={items.filter((m) => m.statut === 'annulee').length} />
        </div>
        {visible.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="Aucun mouvement" text="Ex. : le propriétaire prend 200 DT, vous ajoutez de la monnaie, un client règle son ardoise." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {visible.map((m) => {
              const def = MOUVEMENT_BY_ID[m.type];
              return (
                <li key={m.id} className={`flex items-center gap-3 px-4 py-3 ${m.statut === 'annulee' ? 'opacity-50' : ''}`}>
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${def.sens === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {def.sens === 1 ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold text-gray-800 ${m.statut === 'annulee' ? 'line-through' : ''}`}>{def.label}</p>
                    {(m.personne || m.description) && <p className="text-xs text-gray-500">{[m.personne, m.description].filter(Boolean).join(' — ')}</p>}
                    <EntryMeta e={m} />
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${def.sens === 1 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {def.sens === 1 ? '+' : '−'}
                    <Amount value={m.montant} />
                  </span>
                  <EntryActions e={m} path="mouvements" label="Mouvement" onEdit={() => setEditing(m)} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <MouvementForm open={createOpen || editing !== null} editing={editing} onClose={() => (editing ? setEditing(null) : setCreateOpen(false))} />
    </div>
  );
};
