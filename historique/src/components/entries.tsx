import React, { useEffect, useState } from 'react';
import { Ban, Clock3, Pencil } from 'lucide-react';
import { api, errorText } from '../api/client';
import { createOrQueue } from '../api/outbox';
import { useAuth } from '../auth/AuthContext';
import { useJournee } from '../lib/JourneeContext';
import { setParam, useRoute } from '../lib/router';
import { formatDateTime, formatTime, ReasonModal, useToast } from './ui';

interface EntryLike {
  id: string;
  statut: 'active' | 'annulee';
  creeParId: string;
  creeParNom: string;
  creeLe: string;
  heure?: string | null;
  majParNom: string | null;
  majLe: string | null;
  annulationMotif: string | null;
  annuleParNom: string | null;
  annuleLe: string | null;
}

// Opens the creation form when the page is reached with ?nouveau=1 (quick-add sheet, PWA shortcut).
export const useCreateParam = (): [boolean, (open: boolean) => void] => {
  const { params } = useRoute();
  const [open, setOpen] = useState(params.get('nouveau') === '1');
  useEffect(() => {
    if (params.get('nouveau') === '1') setOpen(true);
  }, [params]);
  const set = (v: boolean) => {
    setOpen(v);
    if (!v) setParam('nouveau', null);
  };
  return [open, set];
};

export const useCanTouch = () => {
  const { user, canSupervise } = useAuth();
  const { day } = useJournee();
  return (e: EntryLike) => Boolean(day?.canWrite) && e.statut === 'active' && (e.creeParId === user?.id || canSupervise);
};

// Create (offline-safe) or update one entry, then refresh the day.
export const useSaveEntry = (path: 'ventes' | 'depenses' | 'mouvements', label: string, feminine = true) => {
  const e = feminine ? 'e' : '';
  const { date, refresh } = useJournee();
  const toast = useToast();
  return async (editingId: string | null, values: Record<string, unknown>) => {
    if (editingId) {
      await api.put(`/${path}/${editingId}`, values);
      toast(`${label} modifié${e}.`);
    } else {
      const id = crypto.randomUUID();
      const res = await createOrQueue(`/${path}`, { id, date, ...values }, `${label} du ${date}`);
      toast(
        res.queued ? `${label} gardé${e} hors ligne — envoi automatique au retour de la connexion.` : `${label} enregistré${e}.`,
        res.queued ? 'info' : 'success'
      );
    }
    await refresh();
  };
};

export const EntryMeta: React.FC<{ e: EntryLike }> = ({ e }) => (
  <p className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-1.5">
    <span className="inline-flex items-center gap-0.5">
      <Clock3 size={10} />
      {e.heure ?? formatTime(e.creeLe)}
    </span>
    <span>· {e.creeParNom}</span>
    {e.majLe && <span>· modifiée par {e.majParNom} le {formatDateTime(e.majLe)}</span>}
    {e.statut === 'annulee' && (
      <span className="text-rose-500 font-medium">
        · annulée par {e.annuleParNom} : « {e.annulationMotif} »
      </span>
    )}
  </p>
);

export const EntryActions: React.FC<{ e: EntryLike; path: string; label: string; onEdit: () => void }> = ({ e, path, label, onEdit }) => {
  const canTouch = useCanTouch();
  const { refresh } = useJournee();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  if (!canTouch(e)) return null;
  return (
    <div className="flex items-center gap-1 no-print">
      <button onClick={onEdit} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" title="Modifier" aria-label="Modifier">
        <Pencil size={14} />
      </button>
      <button onClick={() => setCancelOpen(true)} className="p-2 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Annuler" aria-label="Annuler">
        <Ban size={14} />
      </button>
      <ReasonModal
        open={cancelOpen}
        title={`Annuler cette saisie (${label.toLowerCase()}) ?`}
        description="Elle restera visible, barrée, dans l'historique et le journal avec votre motif."
        confirmLabel="Annuler la saisie"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={async (motif) => {
          try {
            await api.post(`/${path}/${e.id}/annuler`, { motif });
            toast(`Saisie annulée (${label.toLowerCase()}).`);
            await refresh();
          } catch (err) {
            throw new Error(errorText(err));
          }
        }}
      />
    </div>
  );
};

export const ShowCancelledToggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; count: number }> = ({ value, onChange, count }) =>
  count > 0 ? (
    <label className="inline-flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="accent-emerald-600" />
      Afficher les saisies annulées ({count})
    </label>
  ) : null;

export const ChipSelect: React.FC<{ options: { id: string; label: string }[]; value: string; onChange: (v: string) => void; columns?: string }> = ({
  options,
  value,
  onChange,
  columns = 'grid-cols-2 sm:grid-cols-3',
}) => (
  <div className={`grid ${columns} gap-1.5`}>
    {options.map((o) => (
      <button
        type="button"
        key={o.id}
        onClick={() => onChange(o.id)}
        className={`px-2.5 py-2 rounded-xl border text-xs font-semibold text-left transition cursor-pointer ${
          value === o.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);
