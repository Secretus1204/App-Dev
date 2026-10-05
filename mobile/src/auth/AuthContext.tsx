import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '../api/services';
import { ApiError, setApiToken, setUnauthorizedHandler } from '../api/client';
import { unregisterCurrentDevice } from '../notifications/pushNotifications';
import type { User } from '../types/api';

const TOKEN_KEY = 'library_access_token';

interface RegisterValues {
  name: string;
  member_id: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthContextValue {
  user: User | null;
  isRestoring: boolean;
  login(email: string, password: string): Promise<void>;
  register(values: RegisterValues): Promise<void>;
  updateProfile(name: string): Promise<void>;
  logout(): Promise<void>;
  clearSession(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  const clearSession = useCallback(async () => {
    setApiToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    void (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return;
        setApiToken(token);
        const response = await authApi.me();
        if (response.data.role !== 'user') {
          await clearSession();
          return;
        }
        setUser(response.data);
      } catch {
        await clearSession();
      } finally {
        setIsRestoring(false);
      }
    })();
  }, [clearSession]);

  const saveAuth = useCallback(async (token: string, nextUser: User) => {
    if (nextUser.role !== 'user') {
      // The shared API can authenticate admins for the web panel. Revoke the
      // token just created by that attempt before rejecting the mobile login.
      setApiToken(token);
      try {
        await authApi.logout();
      } finally {
        setApiToken(null);
      }
      throw new ApiError('This Android app is for library members. Use the web panel for admin access.', 403);
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setApiToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email.trim().toLowerCase(), password);
    await saveAuth(response.data.token, response.data.user);
  }, [saveAuth]);

  const register = useCallback(async (values: RegisterValues) => {
    const response = await authApi.register({
      ...values,
      email: values.email.trim().toLowerCase(),
    });
    await saveAuth(response.data.token, response.data.user);
  }, [saveAuth]);

  const logout = useCallback(async () => {
    try {
      // A shared phone must not continue receiving the previous member's
      // loan reminders after they intentionally sign out.
      await unregisterCurrentDevice().catch(() => undefined);
      await authApi.logout();
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const updateProfile = useCallback(async (name: string) => {
    const response = await authApi.updateProfile(name.trim());
    setUser(response.data);
  }, []);

  const value = useMemo(
    () => ({ user, isRestoring, login, register, updateProfile, logout, clearSession }),
    [user, isRestoring, login, register, updateProfile, logout, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
