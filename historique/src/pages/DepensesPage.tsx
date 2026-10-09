import React, { useEffect, useMemo, useState } from 'react';
import { Camera, LoaderCircle, Plus, Receipt, Wallet, X } from 'lucide-react';
import { JUSTIFICATIF_LABELS, MODE_DEPENSE_LABELS, MODES_DEPENSE, formatDT, formatDateFr, type Depense, type Justificatif, type ModeDepense } from '../../shared/model';
import { api, errorText } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ChipSelect, EntryActions, EntryMeta, ShowCancelledToggle, useCreateParam, useSaveEntry } from '../components/entries';
import { Alert, Amount, Badge, cls, EmptyState, Field, Modal, MoneyInput, nowHHMM, PageHeader, Spinner, useToast } from '../components/ui';
import { useJournee } from '../lib/JourneeContext';
import { photoUrl, uploadPhoto } from '../lib/photo';
import { useDirtyGuard } from '../lib/pwa';
import { navigate, useRoute } from '../lib/router';
import { useReferentiels } from '../lib/useReferentiels';

const PhotoPicker: React.FC<{ value: string | null; onChange: (name: string | null) => void; onError: (msg: string) => void }> = ({ value, onChange, onError }) => {
  const [busy, setBusy] = useState(false);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadPhoto(file));
    } catch (e) {
      onError(e instanceof Error ? errorText(e) : 'Photo impossible à envoyer.');
    } finally {
      setBusy(false);
    }
  };
  if (value)
    return (
      <div className="relative inline-block">
        <img src={photoUrl(value)} alt="Reçu" className="h-24 w-auto rounded-xl border border-gray-200 object-cover" />
        <button type="button" onClick={() => onChange(null)} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center cursor-pointer" aria-label="Retirer la photo">
          <X size={12} />
        </button>
      </div>
    );
  return (
    <label className={`${cls.secondary} w-full cursor-pointer`}>
      {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Camera size={15} />}
      {busy ? 'Envoi de la photo…' : 'Photographier le reçu'}
      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} disabled={busy} />
    </label>
  );
};

const DepenseForm: React.FC<{ open: boolean; editing: Depense | null; onClose: () => void }> = ({ open, editing, onClose }) => {
  const { list } = useReferentiels();
  const { settings } = useAuth();
  const categories = list('categorie_depense');
  const save = useSaveEntry('depenses', 'Dépense');
  const [categorie, setCategorie] = useState('');
  const [mode, setMode] = useState<ModeDepense>('especes_caisse');
  const [montant, setMontant] = useState<number | null>(null);
  const [beneficiaire, setBeneficiaire] = useState('');
  const [description, setDescription] = useState('');
  const [justificatif, setJustificatif] = useState<Justificatif>('oui');
  const [photo, setPhoto] = useState<string | null>(null);
  const [heure, setHeure] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategorie(editing?.categorie ?? categories[0]?.label ?? '');
    setMode(editing?.modePaiement ?? 'especes_caisse');
    setMontant(editing?.montant ?? null);
    setBeneficiaire(editing?.beneficiaire ?? '');
    setDescription(editing?.description ?? '');
    setJustificatif(editing?.justificatif ?? 'oui');
    setPhoto(editing?.photo ?? null);
    setHeure(editing?.heure ?? nowHHMM());
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // The pick-list may arrive after the form opened (quick-add link on a cold start).
  useEffect(() => {
    if (open && !categorie && categories[0]) setCategorie(categories[0].label);
  }, [open, categorie, categories]);

  useDirtyGuard(open && montant !== null);
  const needsDescription = (montant ?? 0) > settings.depenseSeuilJustificatif && justificatif !== 'oui';

  const submit = async () => {
    if (!categorie) return setError('Choisissez une catégorie.');
    if (!montant || montant <= 0) return setError('Saisissez un montant.');
    if (needsDescription && !description.trim()) return setError(`Au-delà de ${formatDT(settings.depenseSeuilJustificatif)} sans reçu, décrivez la dépense.`);
    setBusy(true);
    setError(null);
    try {
      await save(editing?.id ?? null, {
        categorie,
        modePaiement: mode,
        montant,
        beneficiaire: beneficiaire.trim() || null,
        description: description.trim() || null,
        justificatif: photo ? 'oui' : justificatif,
        photo,
        heure: heure || null,
      });
      onClose();
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
      title={editing ? 'Modifier la dépense' : 'Nouvelle dépense'}
      footer={
        <button className={cls.primary} onClick={submit} disabled={busy}>
          {busy && <LoaderCircle size={14} className="animate-spin" />}
          Enregistrer
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Montant" required>
          <MoneyInput value={montant} onChange={setMontant} autoFocus />
        </Field>
        <Field label="Payée comment ?" required hint={MODES_DEPENSE.find((m) => m.id === mode)?.hint}>
          <ChipSelect options={MODES_DEPENSE} value={mode} onChange={(v) => setMode(v as ModeDepense)} />
        </Field>
        <Field label="Catégorie" required>
          <select className={cls.input} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
            {editing && !categories.some((c) => c.label === editing.categorie) && <option value={editing.categorie}>{editing.categorie}</option>}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Payé à" className="col-span-2">
            <input className={cls.input} value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} placeholder="Fournisseur, employé, livreur…" />
          </Field>
          <Field label="Heure">
            <input type="time" className={cls.input} value={heure} onChange={(e) => setHeure(e.target.value)} />
          </Field>
        </div>
        <Field label="Description" required={needsDescription}>
          <textarea className={cls.input} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex. : 10 kg de tomates, réparation robinet…" />
        </Field>
        <Field label="Reçu / facture">
          <div className="space-y-2">
            <PhotoPicker value={photo} onChange={setPhoto} onError={setError} />
            {!photo && (
              <ChipSelect
                columns="grid-cols-1 sm:grid-cols-3"
                options={(['oui', 'a_fournir', 'non'] as Justificatif[]).map((j) => ({ id: j, label: JUSTIFICATIF_LABELS[j] }))}
                value={justificatif}
                onChange={(v) => setJustificatif(v as Justificatif)}
              />
            )}
          </div>
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
};

// Receipts promised "for later" — across all days, so they don't get forgotten.
const ReceiptsToProvide: React.FC = () => {
  const [items, setItems] = useState<(Depense & { date: string })[] | null>(null);
  const toast = useToast();
  const load = () =>
    api
      .get<{ items: (Depense & { date: string })[] }>('/depenses/a-fournir')
      .then((r) => setItems(r.items))
      .catch(() => setItems([]));
  useEffect(() => {
    void load();
  }, []);
  if (!items || items.length === 0) return null;
  return (
    <section className={`${cls.card} p-4 border-amber-200`}>
      <h2 className="text-sm font-bold text-gray-900 mb-1">Reçus à fournir ({items.length})</h2>
      <p className="text-xs text-gray-500 mb-3">Photographiez le reçu dès qu’il est disponible — possible même après la clôture de la journée.</p>
      <ul className="divide-y divide-gray-50">
        {items.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {d.categorie}
                {d.beneficiaire ? ` · ${d.beneficiaire}` : ''}
              </p>
              <button className="text-[11px] text-gray-400 hover:underline cursor-pointer" onClick={() => navigate('depenses', { date: d.date, filtre: null })}>
                {formatDateFr(d.date, false)} · {d.creeParNom}
              </button>
            </div>
            <Amount value={d.montant} className="text-xs font-bold" />
            <label className={`${cls.ghost} text-amber-700 hover:bg-amber-50`}>
              <Camera size={13} /> Ajouter
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const name = await uploadPhoto(file);
                    await api.post(`/depenses/${d.id}/justificatif`, { photo: name });
                    toast('Reçu ajouté.');
                    void load();
                  } catch (err) {
                    toast(errorText(err), 'error');
                  }
                }}
              />
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
};

export const DepensesPage: React.FC = () => {
  const { day, loading } = useJournee();
  const { params } = useRoute();
  const [createOpen, setCreateOpen] = useCreateParam();
  const [editing, setEditing] = useState<Depense | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  const depenses = day?.depenses ?? [];
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    depenses.filter((d) => d.statut === 'active').forEach((d) => m.set(d.categorie, (m.get(d.categorie) ?? 0) + d.montant));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [depenses]);
  const visible = depenses.filter((d) => showCancelled || d.statut === 'active').slice().reverse();

  if (!day) return <div className="flex justify-center py-20">{loading && <Spinner size={22} />}</div>;
  const s = day.summary;

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title="Dépenses"
        subtitle={
          <>
            Total : <Amount value={s.depensesTotal} className="font-bold text-gray-800" /> · sorties de caisse : <Amount value={s.depensesEspeces} className="font-bold text-rose-600" />
          </>
        }
        actions={
          day.canWrite && (
            <button className={cls.primary} onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Nouvelle dépense
            </button>
          )
        }
      />
      {!day.canWrite && day.reason && <Alert tone="info">{day.reason}</Alert>}
      {params.get('filtre') === 'a_fournir' || s.depensesSansJustificatif > 0 ? <ReceiptsToProvide /> : null}

      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {byCategory.map(([c, v]) => (
            <Badge key={c} tone="rose">
              {c} · <Amount value={v} />
            </Badge>
          ))}
        </div>
      )}

      <section className={cls.card}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Dépenses de la journée</h2>
          <ShowCancelledToggle value={showCancelled} onChange={setShowCancelled} count={depenses.filter((d) => d.statut === 'annulee').length} />
        </div>
        {visible.length === 0 ? (
          <EmptyState icon={Wallet} title="Aucune dépense" text="Chaque sortie d'argent doit être saisie ici, avec son reçu si possible." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {visible.map((d) => (
              <li key={d.id} className={`flex items-center gap-3 px-4 py-3 ${d.statut === 'annulee' ? 'opacity-50' : ''}`}>
                {d.photo ? (
                  <button onClick={() => setViewPhoto(d.photo)} className="shrink-0 cursor-pointer" aria-label="Voir le reçu">
                    <img src={photoUrl(d.photo)} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                  </button>
                ) : (
                  <span className="w-10 h-10 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center shrink-0">
                    <Receipt size={15} className="text-gray-300" />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold text-gray-800 ${d.statut === 'annulee' ? 'line-through' : ''}`}>{d.categorie}</span>
                    <Badge tone={d.modePaiement === 'especes_caisse' ? 'rose' : d.modePaiement === 'poche' ? 'violet' : 'gray'}>{MODE_DEPENSE_LABELS[d.modePaiement]}</Badge>
                    {d.justificatif !== 'oui' && <Badge tone="amber">{d.justificatif === 'a_fournir' ? 'Reçu à fournir' : 'Sans reçu'}</Badge>}
                  </div>
                  {(d.beneficiaire || d.description) && <p className="text-xs text-gray-500 mt-0.5">{[d.beneficiaire, d.description].filter(Boolean).join(' — ')}</p>}
                  <EntryMeta e={d} />
                </div>
                <Amount value={d.montant} className="text-sm font-bold text-gray-900" />
                <EntryActions e={d} path="depenses" label="Dépense" onEdit={() => setEditing(d)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <DepenseForm open={createOpen || editing !== null} editing={editing} onClose={() => (editing ? setEditing(null) : setCreateOpen(false))} />
      <Modal open={viewPhoto !== null} onClose={() => setViewPhoto(null)} title="Reçu" wide>
        {viewPhoto && (
          <a href={photoUrl(viewPhoto)} target="_blank" rel="noreferrer">
            <img src={photoUrl(viewPhoto)} alt="Reçu" className="w-full rounded-xl" />
          </a>
        )}
      </Modal>
    </div>
  );
};
