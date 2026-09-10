import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost, ApiError, getStoredToken, setStoredToken } from '../api/client';

export interface AuthUser {
  id: string;
  fullName: string;
  cin: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  login: (cin: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsReady(true);
      return;
    }
    apiGet<{ user: AuthUser }>('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => setStoredToken(null))
      .finally(() => setIsReady(true));
  }, []);

  const login = useCallback(async (cin: string) => {
    const res = await apiPost<{ token: string; user: AuthUser }>('/auth/login', { cin });
    setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    apiPost('/auth/logout').catch(() => undefined);
    setStoredToken(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, isReady, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export { ApiError };
