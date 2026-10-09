import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './auth/AuthContext';
import { ChangePasswordPage, LoginPage, NoAccessPage, OfflinePage } from './pages/AuthScreens';
import { Terminal } from './pages/Terminal';

export const App: React.FC = () => {
  const { state, reload } = useAuth();

  if (state.kind === 'loading')
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <LoaderCircle size={22} className="text-emerald-600 animate-spin" />
      </div>
    );
  if (state.kind === 'anonymous') return <LoginPage message={state.message} />;
  if (state.kind === 'no_access') return <NoAccessPage message={state.message} />;
  if (state.kind === 'offline') return <OfflinePage onRetry={() => void reload()} />;
  if (state.user.mustChangePassword) return <ChangePasswordPage />;
  return <Terminal />;
};
