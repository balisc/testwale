'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  provider: 'email' | 'google';
  avatarUrl?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastCheckedAtRef = useRef(0);

  const refreshUser = useCallback(() => {
    if (inFlightRef.current) return inFlightRef.current;
    const request = (async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const data = (await response.json()) as { user?: AuthUser | null };
        setUser(data.user ?? null);
      } catch {
        setUser(null);
      } finally {
        lastCheckedAtRef.current = Date.now();
        setLoading(false);
      }
    })();
    inFlightRef.current = request;
    void request.finally(() => {
      if (inFlightRef.current === request) inFlightRef.current = null;
    });
    return request;
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - lastCheckedAtRef.current >= 60_000) void refreshUser();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refreshUser();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    // Update the navbar immediately, then wait for the Set-Cookie deletion before
    // doing a hard navigation so the server renders the guest homepage as well.
    window.dispatchEvent(new Event('questionwale:clear-user-caches'));
    setUser(null);
    setLoading(false);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
      });
    } finally {
      window.location.replace('/');
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout, setUser }),
    [user, loading, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
