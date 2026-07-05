'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Loader2, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { getLocalizedText } from '@/lib/localizedText';
import type { UserProgressDashboard } from '@/lib/practiceAnalytics';

const COPY = {
  en: {
    title: 'Your Progress',
    subtitle: 'Track attempts, accuracy, and performance across subjects.',
    signInTitle: 'Sign in to view your progress',
    signInBody: 'Login to save attempts and see your dashboard with subject-wise analytics.',
    signInCta: 'Sign In',
    practiceCta: 'Start Practicing',
    emptyTitle: 'No attempts yet',
    emptyBody: 'Start solving questions to see your progress.',
    totalAttempts: 'Total Attempts',
    uniqueQuestions: 'Unique Questions',
    correct: 'Correct',
    wrong: 'Wrong',
    accuracy: 'Accuracy',
    subjectProgress: 'Subject-wise Progress',
    topicProgress: 'Topic-wise Progress',
    subtopicProgress: 'Subtopic-wise Progress',
    recentAttempts: 'Recent Attempts',
    subject: 'Subject',
    topic: 'Topic',
    subtopic: 'Subtopic',
    attempts: 'Attempts',
    selected: 'Selected',
    result: 'Result',
    date: 'Date',
    question: 'Question',
    loadError: 'Could not load progress. Please refresh.',
    unknown: 'Unknown',
    correctBadge: 'Correct',
    wrongBadge: 'Wrong',
  },
  hi: {
    title: 'आपकी प्रगति',
    subtitle: 'प्रयास, सटीकता और विषय-वार प्रदर्शन देखें।',
    signInTitle: 'प्रगति देखने के लिए साइन इन करें',
    signInBody: 'प्रयास save करने और dashboard देखने के लिए login करें।',
    signInCta: 'साइन इन',
    practiceCta: 'अभ्यास शुरू करें',
    emptyTitle: 'अभी कोई प्रयास नहीं',
    emptyBody: 'अपनी प्रगति देखने के लिए प्रश्न हल करना शुरू करें।',
    totalAttempts: 'कुल प्रयास',
    uniqueQuestions: 'अद्वितीय प्रश्न',
    correct: 'सही',
    wrong: 'गलत',
    accuracy: 'सटीकता',
    subjectProgress: 'विषय-वार प्रगति',
    topicProgress: 'टॉपिक-वार प्रगति',
    subtopicProgress: 'उप-विषय-वार प्रगति',
    recentAttempts: 'हाल के प्रयास',
    subject: 'विषय',
    topic: 'टॉपिक',
    subtopic: 'उप-विषय',
    attempts: 'प्रयास',
    selected: 'चुना गया',
    result: 'परिणाम',
    date: 'तारीख',
    question: 'प्रश्न',
    loadError: 'प्रगति लोड नहीं हो सकी। refresh करें।',
    unknown: 'अज्ञात',
    correctBadge: 'सही',
    wrongBadge: 'गलत',
  },
};

function formatDate(value: string, locale: string) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(locale === 'hi' ? 'hi-IN' : 'en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function truncateText(text: string, max = 80) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export default function DashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const c = COPY[language];

  const [dashboard, setDashboard] = useState<UserProgressDashboard | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setDashboard(null);
      return;
    }

    setFetching(true);
    setError(false);

    fetch('/api/practice/dashboard', { cache: 'no-store' })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace('/login?redirect=/dashboard');
          return null;
        }
        if (!res.ok) throw new Error('fetch failed');
        return (await res.json()) as UserProgressDashboard;
      })
      .then((data) => setDashboard(data))
      .catch(() => {
        setError(true);
        setDashboard(null);
      })
      .finally(() => setFetching(false));
  }, [user, authLoading, router]);

  const isEmpty = useMemo(
    () => dashboard != null && dashboard.overview.total_attempts === 0,
    [dashboard],
  );

  if (authLoading || (user && fetching && !dashboard)) {
    return (
      <section className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-5 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Loading" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center lg:px-10">
        <div className="rounded-3xl border border-[#EDE9FE] bg-white px-6 py-12 shadow-sm">
          <BarChart3 className="mx-auto h-10 w-10 text-brand" />
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">{c.signInTitle}</h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600">{c.signInBody}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login?redirect=/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
            >
              {c.signInCta}
            </Link>
            <Link
              href="/subjects"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#DDD6FE] hover:text-brand"
            >
              {c.practiceCta}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <p className="text-red-600">{c.loadError}</p>
      </section>
    );
  }

  const overview = dashboard?.overview ?? {
    total_attempts: 0,
    unique_questions_attempted: 0,
    correct_count: 0,
    wrong_count: 0,
    accuracy_percent: 0,
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-10 lg:py-14">
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#F3E8FF] p-3 text-brand">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{c.title}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">{c.subtitle}</p>
          </div>
        </div>
      </header>

      {isEmpty ? (
        <div className="rounded-3xl border border-dashed border-[#DDD6FE] bg-[#FAF5FF] px-6 py-14 text-center">
          <Target className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">{c.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-slate-600">{c.emptyBody}</p>
          <Link
            href="/subjects"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9]"
          >
            {c.practiceCta}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label={c.totalAttempts} value={overview.total_attempts} accent="purple" />
            <StatCard label={c.uniqueQuestions} value={overview.unique_questions_attempted} accent="gray" />
            <StatCard label={c.correct} value={overview.correct_count} accent="green" />
            <StatCard label={c.wrong} value={overview.wrong_count} accent="red" />
            <StatCard label={c.accuracy} value={`${overview.accuracy_percent}%`} accent="purple" />
          </div>

          <ProgressTable
            title={c.subjectProgress}
            columns={[c.subject, c.attempts, c.correct, c.wrong, c.accuracy]}
            rows={(dashboard?.by_subject ?? []).map((row) => [
              getLocalizedText(row.subject_title, language) || c.unknown,
              row.attempts_count,
              row.correct_count,
              row.wrong_count,
              `${row.accuracy_percent}%`,
            ])}
          />

          <ProgressTable
            title={c.topicProgress}
            columns={[c.topic, c.subject, c.attempts, c.correct, c.wrong, c.accuracy]}
            rows={(dashboard?.by_topic ?? []).map((row) => [
              getLocalizedText(row.topic_title, language) || c.unknown,
              getLocalizedText(row.subject_title, language) || c.unknown,
              row.attempts_count,
              row.correct_count,
              row.wrong_count,
              `${row.accuracy_percent}%`,
            ])}
          />

          <ProgressTable
            title={c.subtopicProgress}
            columns={[c.subtopic, c.topic, c.subject, c.attempts, c.correct, c.wrong, c.accuracy]}
            rows={(dashboard?.by_subtopic ?? []).map((row) => [
              getLocalizedText(row.subtopic_title, language) || c.unknown,
              getLocalizedText(row.topic_title, language) || c.unknown,
              getLocalizedText(row.subject_title, language) || c.unknown,
              row.attempts_count,
              row.correct_count,
              row.wrong_count,
              `${row.accuracy_percent}%`,
            ])}
          />

          <section className="mt-8 rounded-2xl border border-[#EDE9FE] bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">{c.recentAttempts}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#FAF5FF] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold sm:px-6">{c.question}</th>
                    <th className="px-4 py-3 font-semibold">{c.subject}</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">{c.topic}</th>
                    <th className="px-4 py-3 font-semibold hidden lg:table-cell">{c.subtopic}</th>
                    <th className="px-4 py-3 font-semibold">{c.selected}</th>
                    <th className="px-4 py-3 font-semibold">{c.result}</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">{c.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dashboard?.recent_attempts ?? []).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="max-w-xs px-4 py-3 text-slate-800 sm:px-6">
                        {truncateText(getLocalizedText(row.question_text, language))}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {getLocalizedText(row.subject_title, language) || c.unknown}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                        {getLocalizedText(row.topic_title, language) || '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">
                        {getLocalizedText(row.subtopic_title, language) || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.selected_option}</td>
                      <td className="px-4 py-3">
                        <ResultBadge
                          isCorrect={row.is_correct}
                          correctLabel={c.correctBadge}
                          wrongLabel={c.wrongBadge}
                        />
                      </td>
                      <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                        {formatDate(row.attempted_at, language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: 'purple' | 'green' | 'red' | 'gray';
}) {
  const accentClass =
    accent === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : accent === 'red'
        ? 'bg-red-50 text-red-700'
        : accent === 'gray'
          ? 'bg-slate-100 text-slate-700'
          : 'bg-[#FAF5FF] text-brand';

  return (
    <div className="rounded-2xl border border-[#EDE9FE] bg-white px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-2 py-1 text-xl font-bold ${accentClass}`}>{value}</p>
    </div>
  );
}

function ProgressTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  if (rows.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-[#EDE9FE] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#FAF5FF] text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 font-semibold sm:px-6">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`} className="hover:bg-slate-50/80">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 text-slate-700 sm:px-6">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResultBadge({
  isCorrect,
  correctLabel,
  wrongLabel,
}: {
  isCorrect: boolean;
  correctLabel: string;
  wrongLabel: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isCorrect ? correctLabel : wrongLabel}
    </span>
  );
}
