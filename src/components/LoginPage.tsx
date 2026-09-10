import React, { useEffect, useMemo, useState } from 'react';
import { Clock as ClockIcon, LoaderCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

const CIN_PATTERN = /^\d{8}$/;
const BRAND_TITLE = 'Café Noir';
const TYPE_INTERVAL_MS = 95;
const BLANK_PAUSE_MS = 450;
const SETTLE_PAUSE_MS = 550;

type Phase = 'blank' | 'typing' | 'settled';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Small live clock — a professional, unobtrusive touch in the corner of the onboarding screen.
const LiveClock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <ClockIcon size={13} className="shrink-0" />
      <div className="leading-tight">
        <p className="text-xs font-semibold text-gray-600 font-mono tracking-wide">{time}</p>
        <p className="text-[10px] text-gray-400 capitalize">{date}</p>
      </div>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [cin, setCin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reduceMotion = useMemo(prefersReducedMotion, []);
  const [phase, setPhase] = useState<Phase>(reduceMotion ? 'settled' : 'blank');
  const [typedLength, setTypedLength] = useState(reduceMotion ? BRAND_TITLE.length : 0);

  // Onboarding sequence: blank -> type out "Café Noir" -> brief pause -> settle to top center.
  useEffect(() => {
    if (reduceMotion) return;
    const t = setTimeout(() => setPhase('typing'), BLANK_PAUSE_MS);
    return () => clearTimeout(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || phase !== 'typing') return;
    if (typedLength >= BRAND_TITLE.length) {
      const t = setTimeout(() => setPhase('settled'), SETTLE_PAUSE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setTypedLength((n) => n + 1), TYPE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [phase, typedLength, reduceMotion]);

  const settled = phase === 'settled';
  const visibleTitle = BRAND_TITLE.slice(0, typedLength);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!CIN_PATTERN.test(cin.trim())) {
      setError('Le numéro CIN doit comporter exactement 8 chiffres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cin.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      {/* Ambient background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 rounded-full bg-emerald-50 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:26px_26px]" />

      {/* Live clock */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-10">
        <LiveClock />
      </div>

      {/* Title: types out centered, then settles at top-center at a smaller scale */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          settled ? 'top-[16%] sm:top-[18%] scale-[0.55]' : 'top-1/2 scale-100'
        }`}
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 whitespace-nowrap">
          {visibleTitle}
          <span className={`inline-block w-[3px] ml-1 -mb-1 h-9 sm:h-11 bg-emerald-600 align-middle ${phase === 'typing' ? 'animate-pulse' : 'opacity-0'}`} />
        </h1>
        <p
          className={`text-xs text-gray-400 mt-2 tracking-wide transition-opacity duration-500 ${
            settled ? 'opacity-100 delay-300' : 'opacity-0'
          }`}
        >
          Gestion & administration
        </p>
      </div>

      {/* Form: fades in beneath the settled title */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 top-[38%] sm:top-[40%] w-full max-w-sm px-4 transition-all duration-700 ease-out ${
          settled ? 'opacity-100 translate-y-0 delay-200' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6">
          <label htmlFor="login-cin" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Numéro CIN
          </label>
          <input
            id="login-cin"
            type="password"
            inputMode="numeric"
            maxLength={8}
            autoFocus={settled}
            value={cin}
            onChange={(e) => setCin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 text-lg text-center rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 tracking-[0.5em]"
          />

          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition cursor-pointer"
          >
            {isSubmitting && <LoaderCircle size={15} className="animate-spin" />}
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};
