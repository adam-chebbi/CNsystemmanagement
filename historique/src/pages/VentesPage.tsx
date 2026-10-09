import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Plus, Receipt } from 'lucide-react';
import { MODE_PAIEMENT_LABELS, MODES_PAIEMENT, sumVentesByMode, type ModePaiement, type Vente } from '../../shared/model';
import { errorText } from '../api/client';
import { ChipSelect, EntryActions, EntryMeta, ShowCancelledToggle, useCreateParam, useSaveEntry } from '../components/entries';
import { Alert, Amount, Badge, cls, EmptyState, Field, Modal, MoneyInput, nowHHMM, PageHeader, Spinner } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { useDirtyGuard } from '../lib/pwa';
import { useReferentiels } from '../lib/useReferentiels';

const VenteForm: React.FC<{ open: boolean; editing: Vente | null; onClose: () => void }> = ({ open, editing, onClose }) => {
  const { list } = useReferentiels();
  const categories = list('categorie_vente');
  const save = useSaveEntry('ventes', 'Vente');
  const [categorie, setCategorie] = useState('');
  const [mode, setMode] = useState<ModePaiement>('especes');
  const [montant, setMontant] = useState<number | null>(null);
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [heure, setHeure] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [again, setAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategorie(editing?.categorie ?? categories[0]?.label ?? '');
    setMode(editing?.modePaiement ?? 'especes');
    setMontant(editing?.montant ?? null);
    setClient(editing?.client ?? '');
    setDescription(editing?.description ?? '');
    setHeure(editing?.heure ?? nowHHMM());
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // The pick-list may arrive after the form opened (quick-add link on a cold start).
  useEffect(() => {
    if (open && !categorie && categories[0]) setCategorie(categories[0].label);
  }, [open, categorie, categories]);

  useDirtyGuard(open && montant !== null);

  const submit = async (keepOpen: boolean) => {
    if (!categorie) return setError('Choisissez une catégorie.');
    if (!montant || montant <= 0) return setError('Saisissez un montant.');
    if (mode === 'credit' && !client.trim()) return setError('Indiquez le nom du client pour une vente à crédit.');
    setBusy(true);
    setError(null);
    try {
      await save(editing?.id ?? null, { categorie, modePaiement: mode, montant, client: client.trim() || null, description: description.trim() || null, heure: heure || null });
      if (keepOpen) {
        setMontant(null);
        setClient('');
        setDescription('');
        setHeure(nowHHMM());
        setAgain(true);
      } else onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Modifier la vente' : 'Nouvelle vente'}
      subtitle="Une ligne par catégorie et mode de paiement suffit (ex. total café en espèces du service du matin)."
      footer={
        <>
          {!editing && (
            <button className={cls.secondary} onClick={() => submit(true)} disabled={busy}>
              Enregistrer et continuer
            </button>
          )}
          <button className={cls.primary} onClick={() => submit(false)} disabled={busy}>
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            Enregistrer
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {again && <Alert tone="success">Vente enregistrée. Vous pouvez saisir la suivante.</Alert>}
        <Field label="Montant" required>
          <MoneyInput value={montant} onChange={setMontant} autoFocus />
        </Field>
        <Field label="Mode de paiement" required>
          <ChipSelect options={MODES_PAIEMENT} value={mode} onChange={(v) => setMode(v as ModePaiement)} />
        </Field>
        {mode === 'credit' && (
          <Field label="Client (crédit)" required hint="Le montant s'ajoute à son ardoise (menu Crédits clients).">
            <input className={cls.input} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client" />
          </Field>
        )}
        <Field label="Catégorie" required>
          <ChipSelect options={categories.map((c) => ({ id: c.label, label: c.label }))} value={categorie} onChange={setCategorie} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Heure">
            <input type="time" className={cls.input} value={heure} onChange={(e) => setHeure(e.target.value)} />
          </Field>
          <Field label="Commentaire" className="col-span-2">
            <input className={cls.input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Facultatif" />
          </Field>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
};

export const VentesPage: React.FC = () => {
  const { day, loading } = useJournee();
  const [createOpen, setCreateOpen] = useCreateParam();
  const [editing, setEditing] = useState<Vente | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [modeFilter, setModeFilter] = useState<string>('');

  const ventes = day?.ventes ?? [];
  const totals = useMemo(() => sumVentesByMode(ventes), [ventes]);
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    ventes.filter((v) => v.statut === 'active').forEach((v) => m.set(v.categorie, (m.get(v.categorie) ?? 0) + v.montant));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [ventes]);
  const visible = ventes.filter((v) => (showCancelled || v.statut === 'active') && (!modeFilter || v.modePaiement === modeFilter)).slice().reverse();

  if (!day) return <div className="flex justify-center py-20">{loading && <Spinner size={22} />}</div>;

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title="Ventes"
        subtitle={
          <>
            Total des ventes saisies : <Amount value={totals.total} className="font-bold text-gray-800" />
            {day.ca && <> · Ticket Z : <Amount value={day.ca.total} className="font-bold text-gray-800" /></>}
          </>
        }
        actions={
          day.canWrite && (
            <button className={cls.primary} onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Nouvelle vente
            </button>
          )
        }
      />
      {!day.canWrite && day.reason && <Alert tone="info">{day.reason}</Alert>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {MODES_PAIEMENT.map((m) => {
          const field = { especes: 'especes', tpe: 'tpe', ticket_resto: 'ticketsResto', credit: 'credit', cheque: 'cheque', autre: 'autre' }[m.id] as keyof typeof totals;
          const active = modeFilter === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setModeFilter(active ? '' : m.id)}
              className={`text-left rounded-xl border px-3 py-2 transition cursor-pointer ${active ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
            >
              <p className="text-[11px] text-gray-500">{m.label}</p>
              <Amount value={totals[field]} className="text-sm font-bold text-gray-800" />
            </button>
          );
        })}
      </div>

      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {byCategory.map(([c, v]) => (
            <Badge key={c} tone="emerald">
              {c} · <Amount value={v} />
            </Badge>
          ))}
        </div>
      )}

      <section className={cls.card}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Saisies {modeFilter && `— ${MODE_PAIEMENT_LABELS[modeFilter as ModePaiement]}`}</h2>
          <ShowCancelledToggle value={showCancelled} onChange={setShowCancelled} count={ventes.filter((v) => v.statut === 'annulee').length} />
        </div>
        {visible.length === 0 ? (
          <EmptyState icon={Receipt} title="Aucune vente" text="Saisissez les ventes au fil de la journée, ou seulement le ticket Z en fin de service." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {visible.map((v) => (
              <li key={v.id} className={`flex items-center gap-3 px-4 py-3 ${v.statut === 'annulee' ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold text-gray-800 ${v.statut === 'annulee' ? 'line-through' : ''}`}>{v.categorie}</span>
                    <Badge tone={v.modePaiement === 'credit' ? 'amber' : v.modePaiement === 'especes' ? 'emerald' : 'blue'}>{MODE_PAIEMENT_LABELS[v.modePaiement]}</Badge>
                    {v.client && <span className="text-xs text-gray-500">{v.client}</span>}
                  </div>
                  {v.description && <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>}
                  <EntryMeta e={v} />
                </div>
                <Amount value={v.montant} className="text-sm font-bold text-gray-900" />
                <EntryActions e={v} path="ventes" label="Vente" onEdit={() => setEditing(v)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <VenteForm open={createOpen || editing !== null} editing={editing} onClose={() => (editing ? setEditing(null) : setCreateOpen(false))} />
    </div>
  );
};
