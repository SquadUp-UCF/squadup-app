// The logged-in session — distinct from auth-flow-context, which only spans
// the signup wizard and resets once it's done. Persisted with expo-secure-store
// so a login survives an app restart, the mobile equivalent of web's
// localStorage token.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setAuthToken } from '@/lib/auth-token';
import type { UserProfile } from '@/types/user';

const STORAGE_KEY = 'squadup_session';

type StoredSession = { token: string; user: UserProfile };

type SessionState = {
  token: string | null;
  user: UserProfile | null;
  isHydrating: boolean;
  login: (token: string, user: UserProfile) => Promise<void>;
  updateUser: (patch: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const stored: StoredSession = JSON.parse(raw);
        setToken(stored.token);
        setUser(stored.user);
        setAuthToken(stored.token); // keep the API client's token in sync
      })
      .finally(() => setIsHydrating(false));
  }, []);

  async function persist(next: StoredSession | null) {
    if (next) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  }

  const login = useCallback(async (nextToken: string, nextUser: UserProfile) => {
    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);
    await persist({ token: nextToken, user: nextUser });
  }, []);

  const updateUser = useCallback(
    async (patch: Partial<UserProfile>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        if (token) persist({ token, user: next });
        return next;
      });
    },
    [token]
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await persist(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, isHydrating, login, updateUser, logout }),
    [token, user, isHydrating, login, updateUser, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
