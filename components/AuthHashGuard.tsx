'use client';

import { useEffect, useRef } from 'react';
import { scrubSensitiveAuthHash } from '@/lib/authSensitiveHash';
import { useLanguage } from '@/lib/LanguageContext';

const SCRUBBED_MESSAGE = {
  en: 'Your previous sign-in link expired. Please sign in again.',
  hi: 'आपका पिछला साइन-इन लिंक समाप्त हो गया। कृपया पुनः साइन इन करें।',
};

type AuthHashGuardProps = {
  onScrubbed?: (message: string) => void;
};

export default function AuthHashGuard({ onScrubbed }: AuthHashGuardProps) {
  const { language } = useLanguage();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (!scrubSensitiveAuthHash()) return;

    handledRef.current = true;
    const lang = language === 'hi' ? 'hi' : 'en';
    onScrubbed?.(SCRUBBED_MESSAGE[lang]);
  }, [language, onScrubbed]);

  return null;
}
