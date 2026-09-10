import React, { useState } from 'react';
import { Coffee, LoaderCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

const CIN_PATTERN = /^\d{8}$/;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [cin, setCin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-3">
            <Coffee size={26} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Café Noir</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gestion & administration</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6">
          <label htmlFor="login-cin" className="block text-xs font-semibold text-gray-700 mb-1.5">
            Numéro CIN
          </label>
          <input
            id="login-cin"
            type="text"
            inputMode="numeric"
            maxLength={8}
            autoFocus
            value={cin}
            onChange={(e) => setCin(e.target.value.replace(/\D/g, ''))}
            placeholder="12345678"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 tracking-widest"
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
