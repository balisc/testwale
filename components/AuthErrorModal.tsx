'use client';

import { AlertCircle, X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { useLanguage } from '@/lib/LanguageContext';

type AuthErrorModalProps = {
  open: boolean;
  message: string;
  onClose: () => void;
};

const COPY = {
  en: { title: 'Sign-in issue', action: 'OK' },
  hi: { title: 'साइन-इन समस्या', action: 'ठीक है' },
};

export default function AuthErrorModal({ open, message, onClose }: AuthErrorModalProps) {
  const { language } = useLanguage();
  const lang = language === 'hi' ? 'hi' : 'en';
  const c = COPY[lang];
  const titleId = 'auth-error-modal-title';

  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="max-w-md"
    >
      <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-2xl min-[360px]:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-bold text-slate-900 min-[360px]:text-lg">
              {c.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[96px] items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
          >
            {c.action}
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
