'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ModalPortal from '@/components/ModalPortal';
import { REPORT_REASONS, type ReportReason } from '@/lib/practice';
import { useLanguage } from '@/lib/LanguageContext';

type ReportQuestionModalProps = {
  open: boolean;
  questionId: string | null;
  onClose: () => void;
};

const COPY = {
  en: {
    title: 'Report Question',
    reason: 'Reason',
    details: 'Additional details (optional)',
    submit: 'Submit Report',
    cancel: 'Cancel',
    success: 'Thank you! Your report has been submitted.',
    duplicate: 'You have already reported this question.',
    error: 'Could not submit report. Please try again.',
    login: 'Sign in to report a question.',
  },
  hi: {
    title: 'प्रश्न रिपोर्ट करें',
    reason: 'कारण',
    details: 'अतिरिक्त विवरण (वैकल्पिक)',
    submit: 'रिपोर्ट भेजें',
    cancel: 'रद्द करें',
    success: 'धन्यवाद! आपकी रिपोर्ट submit हो गई।',
    duplicate: 'आप पहले ही इस प्रश्न की रिपोर्ट कर चुके हैं।',
    error: 'रिपोर्ट submit नहीं हो सकी। कृपया फिर कोशिश करें।',
    login: 'प्रश्न रिपोर्ट करने के लिए साइन इन करें।',
  },
};

export default function ReportQuestionModal({ open, questionId, onClose }: ReportQuestionModalProps) {
  const { language } = useLanguage();
  const c = COPY[language];
  const [reason, setReason] = useState<ReportReason>('Wrong answer');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('Wrong answer');
      setDetails('');
      setMessage(null);
      setIsError(false);
    }
  }, [open, questionId]);

  const handleSubmit = async () => {
    if (submitting || !questionId) return;
    setSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch('/api/practice/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, reason, details }),
      });

      const data = (await response.json()) as {
        message?: string;
        is_new_report?: boolean;
        error?: string;
      };

      if (response.status === 401) {
        setMessage(c.login);
        setIsError(true);
        return;
      }

      if (response.status === 503) {
        setMessage(c.error);
        setIsError(true);
        return;
      }

      if (!response.ok) {
        setMessage(c.error);
        setIsError(true);
        return;
      }

      if (data.message === 'already_reported' || data.is_new_report === false) {
        setMessage(c.duplicate);
        setIsError(false);
        return;
      }

      setMessage(c.success);
      setIsError(false);
    } catch {
      setMessage(c.error);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal
      open={open && Boolean(questionId)}
      onClose={onClose}
      labelledBy="report-question-title"
      panelClassName="max-w-md rounded-3xl border border-[#EDE9FE] bg-white p-6 shadow-2xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 id="report-question-title" className="pr-8 text-lg font-bold text-slate-900">
        {c.title}
      </h2>

      <label className="mt-4 block text-sm font-semibold text-slate-700">{c.reason}</label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as ReportReason)}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
      >
        {REPORT_REASONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <label className="mt-4 block text-sm font-semibold text-slate-700">{c.details}</label>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#EDE9FE]"
      />

      {message && (
        <p className={`mt-4 text-sm ${isError ? 'text-red-600' : 'text-emerald-600'}`}>{message}</p>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:opacity-60"
        >
          {c.submit}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE]"
        >
          {c.cancel}
        </button>
      </div>
    </ModalPortal>
  );
}
