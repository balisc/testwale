'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { useLanguage } from '@/lib/LanguageContext';

type LoginRequiredModalProps = {
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
  redirectPath: string;
};

const COPY = {
  en: {
    title: 'Sign in to save your progress',
    body: 'Sign in to save attempts, track accuracy, and sync progress across devices. You can also check the answer without signing in.',
    signIn: 'Sign in with Google',
    skip: 'Skip & check answer',
    cancel: 'Cancel',
  },
  hi: {
    title: 'प्रगति सहेजने के लिए साइन इन करें',
    body: 'साइन इन करें ताकि प्रयास, सटीकता और प्रगति सहेजी जाए। बिना साइन इन के भी उत्तर देख सकते हैं।',
    signIn: 'Google से साइन इन करें',
    skip: 'Skip करें और उत्तर देखें',
    cancel: 'रद्द करें',
  },
};

export default function LoginRequiredModal({
  open,
  onClose,
  onSkip,
  redirectPath,
}: LoginRequiredModalProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      labelledBy="login-required-title"
      panelClassName="max-w-md rounded-3xl border border-[#EDE9FE] bg-white p-6 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 id="login-required-title" className="pr-8 text-lg font-bold text-slate-900">
        {c.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
      <Link
        href={loginHref}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
      >
        {c.signIn}
      </Link>
      <button
        type="button"
        onClick={onSkip}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] px-5 py-3 text-sm font-semibold text-brand transition hover:border-brand hover:bg-[#F3E8FF]"
      >
        {c.skip}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full text-sm font-medium text-slate-500 transition hover:text-brand"
      >
        {c.cancel}
      </button>
    </ModalPortal>
  );
}
