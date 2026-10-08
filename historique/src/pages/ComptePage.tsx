import React, { useState } from 'react';
import { Download, ExternalLink, KeyRound, LoaderCircle, LogOut, RefreshCw, Share, Trash2 } from 'lucide-react';
import { errorText } from '../api/client';
import { flushOutbox, outbox, useOutbox } from '../api/outbox';
import { useAuth } from '../auth/AuthContext';
import { MAIN_APP_URL } from '../components/Layout';
import { Alert, Badge, cls, Field, formatDateTime, PageHeader, useToast } from '../components/ui';
import { useInstallPrompt } from '../lib/pwa';

export const ComptePage: React.FC = () => {
  const { user, logout, changePassword, canSupervise, canConfigure } = useAuth();
  const { canInstall, installed, isIos, promptInstall } = useInstallPrompt();
  const pending = useOutbox();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (next.length < 8) return setError('8 caractères minimum.');
    if (next !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      toast('Mot de passe modifié (aussi pour l’application Café Noir).');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-up max-w-2xl">
      <PageHeader title="Mon compte" />
      <section className={`${cls.card} p-4 flex items-center gap-3`}>
        <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">{(user?.fullName ?? '?').slice(0, 1).toUpperCase()}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{user?.fullName}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge tone="emerald">{user?.isSuperAdmin ? 'Super Admin' : user?.roleName}</Badge>
            {canSupervise && <Badge tone="blue">Superviseur</Badge>}
            {canConfigure && <Badge tone="violet">Paramétrage</Badge>}
          </div>
        </div>
        <button className={cls.secondary} onClick={() => void logout()}>
          <LogOut size={14} /> Déconnexion
        </button>
      </section>

      {pending.length > 0 && (
        <section className={`${cls.card} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900">Saisies en attente d’envoi ({pending.length})</h2>
            <button className={cls.ghost} onClick={() => void flushOutbox()}>
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
          <ul className="divide-y divide-gray-50">
            {pending.map((p) => (
              <li key={p.id} className="py-2 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{p.label}</p>
                  <p className="text-[11px] text-gray-400">Saisie le {formatDateTime(p.createdAt)}</p>
                  {p.error && <p className="text-[11px] text-rose-600 mt-0.5">Refusée : {p.error}</p>}
                </div>
                {p.error && (
                  <button
                    className="p-2 text-gray-300 hover:text-rose-600 cursor-pointer"
                    onClick={() => {
                      if (window.confirm('Supprimer cette saisie non envoyée ? Pensez à la ressaisir correctement.')) outbox.remove(p.id);
                    }}
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${cls.card} p-4`}>
        <h2 className="text-sm font-bold text-gray-900 mb-1">Application sur le téléphone</h2>
        <p className="text-xs text-gray-500 mb-3">Installez « Historique et Comptage Café Noir » sur l’écran d’accueil pour l’ouvrir comme une application.</p>
        {installed ? (
          <Alert tone="success">L’application est installée sur cet appareil.</Alert>
        ) : canInstall ? (
          <button className={cls.primary} onClick={() => void promptInstall()}>
            <Download size={14} /> Installer l’application
          </button>
        ) : isIos ? (
          <Alert>
            Sur iPhone : touchez <Share size={12} className="inline" /> <b>Partager</b> dans Safari, puis <b>Sur l’écran d’accueil</b>.
          </Alert>
        ) : (
          <Alert>Ouvrez le menu du navigateur (⋮) puis « Installer l’application » / « Ajouter à l’écran d’accueil ».</Alert>
        )}
      </section>

      <section className={`${cls.card} p-4 space-y-3`}>
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900">Changer mon mot de passe</h2>
        </div>
        <p className="text-xs text-gray-500">Le même mot de passe sert pour l’application principale Café Noir.</p>
        <Field label="Mot de passe actuel">
          <input type="password" autoComplete="current-password" className={cls.input} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Nouveau mot de passe">
            <input type="password" autoComplete="new-password" className={cls.input} value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field label="Confirmer">
            <input type="password" autoComplete="new-password" className={cls.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end">
          <button className={cls.primary} onClick={submit} disabled={busy || !current || !next}>
            {busy && <LoaderCircle size={14} className="animate-spin" />}
            Modifier
          </button>
        </div>
      </section>

      <a href={MAIN_APP_URL} target="_blank" rel="noopener noreferrer" className={`${cls.secondary} w-full`}>
        <ExternalLink size={14} /> Ouvrir l’application principale Café Noir
      </a>
    </div>
  );
};
