'use client';

import { Clock, X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { useLanguage } from '@/lib/LanguageContext';

type ReportComingSoonModalProps = {
  open: boolean;
  onClose: () => void;
};

const COPY = {
  en: {
    title: 'Report Question',
    message: 'This feature will be available soon.',
    sub: 'You will be able to report wrong answers, translation issues, and other problems directly from here.',
    ok: 'Got it',
  },
  hi: {
    title: 'प्रश्न रिपोर्ट करें',
    message: 'यह सुविधा जल्द उपलब्ध होगी।',
    sub: 'जल्द ही आप यहाँ से गलत उत्तर, अनुवाद की समस्या और अन्य issues report कर पाएँगे।',
    ok: 'ठीक है',
  },
};

export default function ReportComingSoonModal({ open, onClose }: ReportComingSoonModalProps) {
  const { language } = useLanguage();
  const c = COPY[language];

  return (
    <ModalPortal
      open={open}
      onClose={onClose}
      labelledBy="report-coming-soon-title"
      panelClassName="max-w-md rounded-3xl border border-[#EDE9FE] bg-white p-6 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3E8FF] text-brand">
        <Clock className="h-6 w-6" aria-hidden="true" />
      </div>

      <h2 id="report-coming-soon-title" className="mt-4 text-lg font-bold text-slate-900">
        {c.title}
      </h2>
      <p className="mt-2 text-sm font-semibold text-brand">{c.message}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.sub}</p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
      >
        {c.ok}
      </button>
    </ModalPortal>
  );
}
