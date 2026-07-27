'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

type AuthFlashLoaderProps = {
  onMessage: (message: string) => void;
};

export default function AuthFlashLoader({ onMessage }: AuthFlashLoaderProps) {
  const { language } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch('/api/auth/flash', {
          cache: 'no-store',
          credentials: 'include',
        });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as { message?: string | null };
        if (data.message) {
          onMessage(data.message);
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, onMessage]);

  return null;
}
