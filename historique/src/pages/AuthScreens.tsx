import React, { useEffect, useState } from 'react';
import { KeyRound, LoaderCircle, LogOut, ShieldAlert, WifiOff } from 'lucide-react';
import { errorText } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { cls } from '../components/ui';

const Backdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-[100dvh] w-full overflow-y-auto bg-gray-50">
    <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl animate-blob-float-1" />
    <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl animate-blob-float-2" />
    <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:26px_26px] animate-grid-pan" />
    <div className="relative flex flex-col items-center px-4 pt-[max(3rem,env(safe-area-inset-top))] pb-10">
      <img src="/logo-text.png" alt="Café Noir" className="h-8 w-auto animate-fade-up" />
      <p className="mt-2 text-xs font-semibold tracking-wide text-emerald-700 uppercase">Historique & Comptage</p>
      <div className="w-full max-w-sm mt-8 animate-fade-up">{children}</div>
    </div>
  </div>
);

const Clock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="mt-6 flex flex-col items-center gap-1">
      <div className="font-mono tabular-nums text-3xl font-bold text-gray-900">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      <p className="text-xs text-gray-500 capitalize">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>
  );
};

export const LoginPage: React.FC<{ message?: string }> = ({ message }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(message ?? null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Identifiant et mot de passe requis.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Backdrop>
      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 space-y-3">
        <div className="mb-1">
          <h1 className="text-base font-bold text-gray-900">Connexion gérant</h1>
          <p className="text-xs text-gray-500 mt-0.5">Utilisez le même compte que sur l’application Café Noir.</p>
        </div>
        <div>
          <label htmlFor="identifier" className={cls.label}>
            Email, téléphone ou CIN
          </label>
          <input id="identifier" autoComplete="username" className={cls.input} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email@exemple.tn ou 12345678" />
        </div>
        <div>
          <label htmlFor="password" className={cls.label}>
            Mot de passe
          </label>
          <input id="password" type="password" autoComplete="current-password" className={cls.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${cls.primary} w-full mt-3`}>
          {busy && <LoaderCircle size={15} className="animate-spin" />}
          Se connecter
        </button>
        <p className="text-[11px] text-gray-400 text-center pt-1">Mot de passe oublié ? Demandez à l’administrateur de le réinitialiser.</p>
      </form>
      <Clock />
    </Backdrop>
  );
};

export const ChangePasswordPage: React.FC = () => {
  const { changePassword, logout } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
    if (next !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Backdrop>
      <form onSubmit={submit} className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={18} className="text-emerald-600" />
          <h1 className="text-base font-bold text-gray-900">Choisissez votre mot de passe</h1>
        </div>
        <p className="text-xs text-gray-500">Vous vous êtes connecté avec un mot de passe temporaire. Choisissez-en un personnel pour continuer.</p>
        <input type="password" autoComplete="current-password" className={cls.input} placeholder="Mot de passe actuel (temporaire)" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <input type="password" autoComplete="new-password" className={cls.input} placeholder="Nouveau mot de passe (8 caractères min.)" value={next} onChange={(e) => setNext(e.target.value)} />
        <input type="password" autoComplete="new-password" className={cls.input} placeholder="Confirmer le nouveau mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button type="submit" disabled={busy} className={`${cls.primary} w-full`}>
          {busy && <LoaderCircle size={15} className="animate-spin" />}
          Enregistrer et continuer
        </button>
        <button type="button" onClick={() => void logout()} className={`${cls.ghost} w-full`}>
          Se déconnecter
        </button>
      </form>
    </Backdrop>
  );
};

export const NoAccessPage: React.FC<{ message: string }> = ({ message }) => {
  const { logout } = useAuth();
  return (
    <Backdrop>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 text-center">
        <span className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
          <ShieldAlert size={22} className="text-amber-600" />
        </span>
        <h1 className="text-base font-bold text-gray-900">Accès non autorisé</h1>
        <p className="text-xs text-gray-500 mt-2">{message}</p>
        <button onClick={() => void logout()} className={`${cls.secondary} w-full mt-5`}>
          <LogOut size={14} /> Changer de compte
        </button>
      </div>
    </Backdrop>
  );
};

export const OfflinePage: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <Backdrop>
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 text-center">
      <span className="mx-auto w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        <WifiOff size={22} className="text-gray-500" />
      </span>
      <h1 className="text-base font-bold text-gray-900">Pas de connexion</h1>
      <p className="text-xs text-gray-500 mt-2">Impossible de joindre le serveur. Vérifiez le Wi-Fi ou les données mobiles, puis réessayez.</p>
      <button onClick={onRetry} className={`${cls.primary} w-full mt-5`}>
        Réessayer
      </button>
    </div>
  </Backdrop>
);
