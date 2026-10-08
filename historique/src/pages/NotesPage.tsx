import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, LoaderCircle, MessageSquareText, NotebookPen, Pin, PinOff, Plus, Search } from 'lucide-react';
import {
  INCIDENT_CATEGORIES,
  INCIDENT_CATEGORY_LABELS,
  NOTE_STATUT_LABELS,
  NOTE_TYPE_LABELS,
  PRIORITE_LABELS,
  formatDateFr,
  type Note,
  type NoteStatut,
  type NoteType,
  type Priorite,
} from '../../shared/model';
import { api, errorText } from '../api/client';
import { createOrQueue } from '../api/outbox';
import { useAuth } from '../auth/AuthContext';
import { ChipSelect, useCreateParam } from '../components/entries';
import { Alert, Badge, cls, EmptyState, Field, formatDateTime, Modal, PageHeader, Spinner, useToast } from '../components/ui';
import { useDirtyGuard } from '../lib/pwa';
import { setParam, useRoute } from '../lib/router';

const PRIO_TONE: Record<Priorite, 'gray' | 'blue' | 'amber' | 'rose'> = { basse: 'gray', normale: 'blue', haute: 'amber', urgente: 'rose' };
const STATUT_TONE: Record<NoteStatut, 'amber' | 'blue' | 'emerald'> = { ouvert: 'amber', en_cours: 'blue', resolu: 'emerald' };

const NoteForm: React.FC<{ open: boolean; editing: Note | null; onClose: () => void; onSaved: () => void }> = ({ open, editing, onClose, onSaved }) => {
  const { businessDate } = useAuth();
  const toast = useToast();
  const [type, setType] = useState<NoteType>('incident');
  const [categorie, setCategorie] = useState('');
  const [priorite, setPriorite] = useState<Priorite>('normale');
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType(editing?.type ?? 'incident');
    setCategorie(editing?.categorie ?? '');
    setPriorite(editing?.priorite ?? 'normale');
    setTitre(editing?.titre ?? '');
    setContenu(editing?.contenu ?? '');
    setDate(editing?.journeeDate ?? businessDate);
    setError(null);
  }, [open, editing, businessDate]);
  useDirtyGuard(open && titre.trim().length > 0);

  const submit = async () => {
    if (titre.trim().length < 2) return setError('Donnez un titre.');
    if (type === 'incident' && !categorie) return setError("Choisissez le type d'incident.");
    setBusy(true);
    setError(null);
    const body = { type, categorie: type === 'incident' ? categorie : null, priorite, titre: titre.trim(), contenu: contenu.trim() || null, date };
    try {
      if (editing) {
        await api.put(`/notes/${editing.id}`, body);
        toast('Note modifiée.');
      } else {
        const res = await createOrQueue('/notes', { id: crypto.randomUUID(), ...body }, `Note : ${body.titre}`);
        toast(res.queued ? 'Note gardée hors ligne — envoi automatique.' : 'Note enregistrée.', res.queued ? 'info' : 'success');
      }
      onSaved();
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
      title={editing ? 'Modifier la note' : 'Nouvelle note'}
      footer={
        <button className={cls.primary} onClick={submit} disabled={busy}>
          {busy && <LoaderCircle size={14} className="animate-spin" />}
          Enregistrer
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <ChipSelect columns="grid-cols-2 sm:grid-cols-4" options={(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((t) => ({ id: t, label: NOTE_TYPE_LABELS[t] }))} value={type} onChange={(v) => setType(v as NoteType)} />
        </Field>
        {type === 'incident' && (
          <Field label="Quel problème ?" required>
            <select className={cls.input} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
              <option value="">— Choisir —</option>
              {INCIDENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Titre" required>
          <input className={cls.input} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={type === 'incident' ? 'Ex. : le TPE refuse les cartes depuis 15h' : 'Ex. : commander du sucre demain'} autoFocus />
        </Field>
        <Field label="Détails">
          <textarea className={cls.input} rows={4} value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Ce qui s’est passé, qui est concerné, ce qui a été fait…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priorité">
            <select className={cls.input} value={priorite} onChange={(e) => setPriorite(e.target.value as Priorite)}>
              {(Object.keys(PRIORITE_LABELS) as Priorite[]).map((p) => (
                <option key={p} value={p}>
                  {PRIORITE_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Journée concernée">
            <input type="date" className={cls.input} value={date} max={businessDate} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </Modal>
  );
};

const NoteDetail: React.FC<{ note: Note | null; onClose: () => void; onChanged: (n: Note) => void; onEdit: (n: Note) => void }> = ({ note, onClose, onChanged, onEdit }) => {
  const { user, canSupervise } = useAuth();
  const toast = useToast();
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setResolution('');
    setError(null);
  }, [note?.id]);
  if (!note) return null;
  const setStatut = async (statut: NoteStatut) => {
    if (statut === 'resolu' && note.type === 'incident' && resolution.trim().length < 2) return setError('Expliquez comment l’incident a été résolu.');
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ item: Note }>(`/notes/${note.id}/statut`, { statut, resolution: resolution.trim() || undefined });
      onChanged(res.item);
      toast(statut === 'resolu' ? 'Marquée comme résolue.' : 'Statut mis à jour.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={note.titre} subtitle={`${NOTE_TYPE_LABELS[note.type]}${note.categorie ? ` · ${INCIDENT_CATEGORY_LABELS[note.categorie]}` : ''}`}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={STATUT_TONE[note.statut]}>{NOTE_STATUT_LABELS[note.statut]}</Badge>
          <Badge tone={PRIO_TONE[note.priorite]}>Priorité {PRIORITE_LABELS[note.priorite].toLowerCase()}</Badge>
          {note.journeeDate && <Badge>{formatDateFr(note.journeeDate, false)}</Badge>}
        </div>
        {note.contenu && <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.contenu}</p>}
        <p className="text-[11px] text-gray-400">
          Par {note.creeParNom} le {formatDateTime(note.creeLe)}
          {note.majLe && ` · modifiée le ${formatDateTime(note.majLe)}`}
        </p>
        {note.statut === 'resolu' ? (
          <Alert tone="success">
            Résolu par {note.resoluParNom} {note.resoluLe && `le ${formatDateTime(note.resoluLe)}`}
            {note.resolution && <span className="block mt-1">« {note.resolution} »</span>}
          </Alert>
        ) : (
          <Field label={note.type === 'incident' ? 'Comment a-t-il été résolu ?' : 'Commentaire (facultatif)'}>
            <textarea className={cls.input} rows={2} value={resolution} onChange={(e) => setResolution(e.target.value)} />
          </Field>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex flex-wrap gap-2 justify-end pt-1">
          {(note.creeParId === user?.id || canSupervise) && (
            <button className={cls.ghost} onClick={() => onEdit(note)}>
              Modifier
            </button>
          )}
          {note.statut === 'ouvert' && (
            <button className={cls.secondary} onClick={() => setStatut('en_cours')} disabled={busy}>
              En cours de traitement
            </button>
          )}
          {note.statut !== 'resolu' ? (
            <button className={cls.primary} onClick={() => setStatut('resolu')} disabled={busy}>
              <CheckCircle2 size={14} /> {note.type === 'incident' ? 'Marquer résolu' : 'Lu / traité'}
            </button>
          ) : (
            <button className={cls.secondary} onClick={() => setStatut('ouvert')} disabled={busy}>
              Rouvrir
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export const NotesPage: React.FC = () => {
  const { params } = useRoute();
  const [createOpen, setCreateOpen] = useCreateParam();
  const [items, setItems] = useState<Note[] | null>(null);
  const [statut, setStatut] = useState('non_resolu');
  const [type, setType] = useState('');
  const [priorite, setPriorite] = useState('');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Note | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (statut) p.set('statut', statut);
    if (type) p.set('type', type);
    if (priorite) p.set('priorite', priorite);
    if (q.trim()) p.set('q', q.trim());
    try {
      setItems((await api.get<{ items: Note[] }>(`/notes?${p}`)).items);
    } catch {
      setItems((prev) => prev ?? []);
    }
  }, [statut, type, priorite, q]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  // Deep link from the dashboard: /notes?note=<id>
  useEffect(() => {
    const id = params.get('note');
    if (id && items) {
      const n = items.find((x) => x.id === id);
      if (n) setSelected(n);
    }
  }, [params, items]);

  const togglePin = async (n: Note) => {
    await api.post(`/notes/${n.id}/epingle`, { epingle: !n.epingle }).catch(() => undefined);
    void load();
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <PageHeader
        title="Notes & incidents"
        subtitle="Tout ce qui doit être su : pannes, ruptures, litiges, consignes, messages de passation."
        actions={
          <button className={cls.primary} onClick={() => setCreateOpen(true)}>
            <Plus size={15} /> Nouvelle note
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className={`${cls.input} pl-8`} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${cls.input} w-auto`} value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="non_resolu">Non résolus</option>
          <option value="ouvert">Ouverts</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolus</option>
          <option value="">Tous</option>
        </select>
        <select className={`${cls.input} w-auto`} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tous les types</option>
          {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((t) => (
            <option key={t} value={t}>
              {NOTE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select className={`${cls.input} w-auto`} value={priorite} onChange={(e) => setPriorite(e.target.value)}>
          <option value="">Toutes priorités</option>
          {(Object.keys(PRIORITE_LABELS) as Priorite[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <section className={cls.card}>
        {items === null ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={NotebookPen} title="Rien à afficher" text="Aucune note ne correspond à ces filtres." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.type === 'incident' ? (n.priorite === 'urgente' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600') : n.type === 'passation' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {n.type === 'incident' ? <AlertTriangle size={16} /> : <MessageSquareText size={16} />}
                </span>
                <button className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => setSelected(n)}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm font-semibold ${n.statut === 'resolu' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{n.titre}</span>
                    <Badge tone={STATUT_TONE[n.statut]}>{NOTE_STATUT_LABELS[n.statut]}</Badge>
                    {n.priorite !== 'normale' && <Badge tone={PRIO_TONE[n.priorite]}>{PRIORITE_LABELS[n.priorite]}</Badge>}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {NOTE_TYPE_LABELS[n.type]}
                    {n.categorie ? ` · ${INCIDENT_CATEGORY_LABELS[n.categorie]}` : ''} · {n.creeParNom} · {formatDateTime(n.creeLe)}
                  </p>
                  {n.contenu && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.contenu}</p>}
                </button>
                <button onClick={() => void togglePin(n)} className={`p-2 rounded-lg cursor-pointer ${n.epingle ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-500'}`} title={n.epingle ? 'Désépingler' : 'Épingler en haut'}>
                  {n.epingle ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NoteForm open={createOpen || editing !== null} editing={editing} onClose={() => (editing ? setEditing(null) : setCreateOpen(false))} onSaved={() => void load()} />
      <NoteDetail
        note={selected}
        onClose={() => {
          setSelected(null);
          setParam('note', null);
        }}
        onChanged={(n) => {
          setSelected(n);
          void load();
        }}
        onEdit={(n) => {
          setSelected(null);
          setEditing(n);
        }}
      />
    </div>
  );
};
