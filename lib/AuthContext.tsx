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
  const refreshAbortRef = useRef<AbortController | null>(null);
  const loggingOutRef = useRef(false);

  const refreshUser = useCallback(() => {
    if (loggingOutRef.current) return Promise.resolve();
    if (inFlightRef.current) return inFlightRef.current;
    const controller = new AbortController();
    refreshAbortRef.current = controller;
    const request = (async () => {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          credentials: 'include',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('session_probe_failed');
        const data = (await response.json()) as { user?: AuthUser | null };
        if (!loggingOutRef.current && !controller.signal.aborted) {
          setUser(data.user ?? null);
        }
      } catch {
        if (!loggingOutRef.current && !controller.signal.aborted) setUser(null);
      } finally {
        if (!loggingOutRef.current && !controller.signal.aborted) {
          lastCheckedAtRef.current = Date.now();
          setLoading(false);
        }
      }
    })();
    inFlightRef.current = request;
    void request.finally(() => {
      if (inFlightRef.current === request) inFlightRef.current = null;
      if (refreshAbortRef.current === controller) refreshAbortRef.current = null;
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
    loggingOutRef.current = true;
    refreshAbortRef.current?.abort();
    window.dispatchEvent(new Event('questionwale:clear-user-caches'));
    setUser(null);
    setLoading(false);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        cache: 'no-store',
        credentials: 'include',
        keepalive: true,
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
