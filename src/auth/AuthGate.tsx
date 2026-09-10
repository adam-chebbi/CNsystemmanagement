import React from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { LoginPage } from '../components/LoginPage';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <LoaderCircle size={22} className="text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <>{children}</>;
};
