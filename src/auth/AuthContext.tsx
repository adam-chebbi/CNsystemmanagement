import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost, ApiError } from '../api/client';

export interface AuthUser {
  id: string;
  fullName: string;
  cin: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  permissions: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  login: (cin: string) => Promise<void>;
  logout: () => void;
  // Super Admin always passes, regardless of what's actually in permissions — mirrors the same
  // bypass enforced server-side in server/middleware/auth.ts's requirePermission. This is only a
  // UX nicety (hiding/showing buttons and menu items); the real gate is always the server's.
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // The session lives in an httpOnly cookie that JS can't read, so the only way to know
    // whether one exists is to ask the server — it 401s cleanly if there isn't one.
    apiGet<{ user: AuthUser }>('/auth/me')
      .then((res) => setUser(res.user))
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, []);

  const login = useCallback(async (cin: string) => {
    const res = await apiPost<{ user: AuthUser }>('/auth/login', { cin });
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    apiPost('/auth/logout').catch(() => undefined);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (key: string) => Boolean(user) && (user!.isSuperAdmin || user!.permissions.includes(key)),
    [user]
  );

  return <AuthContext.Provider value={{ user, isReady, login, logout, hasPermission }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export { ApiError };
