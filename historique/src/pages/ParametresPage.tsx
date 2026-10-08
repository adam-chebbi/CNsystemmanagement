import React, { useEffect, useState } from 'react';
import { Check, LoaderCircle, Plus, Settings } from 'lucide-react';
import { REFERENTIEL_TYPE_LABELS, type HistoriqueSettings, type Referentiel, type ReferentielType } from '../../shared/model';
import { api, errorText } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert, cls, EmptyState, Field, MoneyInput, PageHeader, useToast } from '../components/ui';
import { useReferentiels } from '../lib/useReferentiels';

const RefList: React.FC<{ type: ReferentielType }> = ({ type }) => {
  const { list, reload } = useReferentiels();
  const toast = useToast();
  const items = list(type, true);
  const [label, setLabel] = useState('');
  const [valeur, setValeur] = useState<number | null>(5000);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try {
      await api.post('/referentiels', { type, label: label.trim(), ordre: items.length, valeur: type === 'emetteur_ticket' ? valeur : null });
      setLabel('');
      await reload();
      toast('Ajouté.');
    } catch (e) {
      toast(errorText(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const update = async (r: Referentiel, patch: Partial<Referentiel>) => {
    try {
      await api.put(`/referentiels/${r.id}`, { label: r.label, actif: r.actif, ordre: r.ordre, valeur: r.valeur, ...patch });
      await reload();
    } catch (e) {
      toast(errorText(e), 'error');
    }
  };

  return (
    <section className={`${cls.card} p-4`}>
      <h2 className="text-sm font-bold text-gray-900 mb-3">{REFERENTIEL_TYPE_LABELS[type]}</h2>
      <ul className="space-y-1.5 mb-3">
        {items.map((r) => (
          <li key={r.id} className={`flex items-center gap-2 ${r.actif ? '' : 'opacity-50'}`}>
            <input className={`${cls.input} flex-1`} defaultValue={r.label} onBlur={(e) => e.target.value.trim() && e.target.value !== r.label && void update(r, { label: e.target.value.trim() })} />
            {type === 'emetteur_ticket' && (
              <div className="w-32">
                <MoneyInput value={r.valeur} onChange={() => undefined} disabled />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={r.actif} onChange={(e) => void update(r, { actif: e.target.checked })} className="accent-emerald-600" /> Actif
            </label>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input className={`${cls.input} flex-1`} placeholder="Nouveau libellé" value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void add()} />
        {type === 'emetteur_ticket' && (
          <div className="w-32">
            <MoneyInput value={valeur} onChange={setValeur} />
          </div>
        )}
        <button className={cls.secondary} onClick={add} disabled={busy || !label.trim()}>
          <Plus size={14} />
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-2">Décochez « Actif » pour retirer un choix des formulaires sans toucher à l’historique.</p>
    </section>
  );
};

export const ParametresPage: React.FC = () => {
  const { settings, setSettings, canConfigure } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<HistoriqueSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDraft(settings), [settings]);

  if (!canConfigure) return <EmptyState icon={Settings} title="Accès réservé" text="Les paramètres sont gérés par l’administrateur." />;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.put<{ settings: HistoriqueSettings }>('/parametres', draft);
      setSettings(res.settings);
      toast('Paramètres enregistrés.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up max-w-4xl">
      <PageHeader title="Paramètres" subtitle="Règles de caisse et listes de choix de l’application Historique." />
      <section className={`${cls.card} p-4 space-y-4`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tolérance d’écart de caisse" hint="Au-delà, une justification écrite est exigée.">
            <MoneyInput value={draft.toleranceEcart} onChange={(v) => setDraft({ ...draft, toleranceEcart: v ?? 0 })} />
          </Field>
          <Field label="Fond de caisse par défaut" hint="Utilisé quand la veille n’a pas été clôturée.">
            <MoneyInput value={draft.fondCaisseDefaut} onChange={(v) => setDraft({ ...draft, fondCaisseDefaut: v ?? 0 })} />
          </Field>
          <Field label="Dépense sans reçu : description obligatoire au-delà de">
            <MoneyInput value={draft.depenseSeuilJustificatif} onChange={(v) => setDraft({ ...draft, depenseSeuilJustificatif: v ?? 0 })} />
          </Field>
          <Field label="Jours de rattrapage autorisés aux gérants" hint="Nombre de jours passés sur lesquels un gérant peut encore saisir.">
            <input type="number" min={0} max={31} className={cls.input} value={draft.joursRattrapage} onChange={(e) => setDraft({ ...draft, joursRattrapage: Math.max(0, Math.min(31, Number(e.target.value) || 0)) })} />
          </Field>
          <Field label="Heure de bascule de la journée" hint="Avant cette heure, on travaille encore sur la journée de la veille (fermeture tardive).">
            <select className={cls.input} value={draft.heureBascule} onChange={(e) => setDraft({ ...draft, heureBascule: Number(e.target.value) })}>
              {Array.from({ length: 13 }, (_, h) => (
                <option key={h} value={h}>
                  {h === 0 ? 'Minuit' : `${h} h`}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end">
          <button className={cls.primary} onClick={save} disabled={busy}>
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
            Enregistrer
          </button>
        </div>
      </section>
      <Alert>
        Les comptes des gérants (création, mot de passe, désactivation) et leurs droits se gèrent dans l’application principale Café Noir, menu <b>Rôles &amp; permissions</b> — rôle « Gérant » ou permission « Historique &amp; Comptage ».
      </Alert>
      <div className="grid md:grid-cols-2 gap-4">
        {(['categorie_vente', 'categorie_depense', 'tpe', 'emetteur_ticket'] as ReferentielType[]).map((t) => (
          <RefList key={t} type={t} />
        ))}
      </div>
    </div>
  );
};
