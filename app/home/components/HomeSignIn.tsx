'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, Lock } from 'lucide-react';
import HomeGoogleCtaButton from '@/app/components/HomeGoogleCtaButton';
import HomeGoogleCtaGraphic from '@/app/components/HomeGoogleCtaGraphic';
import CircularGauge from '@/app/profile/CircularGauge';
import { useAuth } from '@/lib/AuthContext';

const BENEFITS = [
  'Save question attempts',
  'Continue from where you stopped',
  'Track accuracy and improvement',
  'Access progress across devices',
] as const;

const DUMMY = {
  rank: 128,
  readiness: 72,
  readinessLabel: 'Good',
  totalAttempts: 124,
  uniqueQuestions: 98,
  correct: 97,
  accuracy: 78,
  studyDays: 18,
  bookmarks: 12,
  mistakes: 8,
  strengths: [
    { title: 'Fundamental Rights', accuracy: 92 },
    { title: 'Preamble', accuracy: 88 },
  ],
  weaknesses: [
    { title: 'Emergency Provisions', accuracy: 45 },
    { title: 'Amendments', accuracy: 52 },
  ],
};

function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red';
}) {
  const subClass =
    accent === 'green' ? 'text-emerald-600' : accent === 'red' ? 'text-red-500' : 'text-slate-400';
  return (
    <div className="min-w-0 rounded-xl border border-[#EDE9FE] bg-white p-2.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900 max-[479px]:text-base">{value}</p>
      {sub ? <p className={`mt-0.5 text-[10px] font-medium ${subClass}`}>{sub}</p> : null}
    </div>
  );
}

export default function HomeSignIn({ googleClientId = '' }: { googleClientId?: string }) {
  const { user } = useAuth();
  const [formError, setFormError] = useState('');

  return (
    <section id="sign-in" className="bg-[#FAFAFC] py-16 sm:py-20 max-[479px]:py-10">
      <div className="home-container w-full">
        <div className="overflow-hidden rounded-2xl border border-[#DDD6FE] bg-white shadow-[0_24px_60px_-36px_rgba(109,40,217,0.45)] md:grid md:grid-cols-2">
          <div className="min-w-0 p-6 sm:p-8 md:p-10 max-[479px]:p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9] max-[479px]:text-[10px] max-[479px]:tracking-wide">
              Free progress tracking
            </p>
            <h2 className="mt-3 text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[32px] sm:leading-[40px] max-[479px]:text-2xl">
              Want to Save Your Progress?
            </h2>
            <p className="mt-3 text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
              Sign in with Google to save your attempts, accuracy, streaks and rankings across all your
              devices.
            </p>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-[#344054]">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-[10px] font-bold text-[#6D28D9] ring-1 ring-[#DDD6FE]">
                    ✓
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 w-full max-w-xs">
              <div className="mb-4">
                <HomeGoogleCtaGraphic />
              </div>
              {user ? (
                <Link
                  href="/dashboard"
                  className="relative flex h-10 w-full min-w-0 items-center justify-center rounded-lg bg-[#6D28D9] px-3 text-[13px] font-semibold text-white transition hover:bg-[#5B21B6] min-[360px]:h-11"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <HomeGoogleCtaButton
                  clientId={googleClientId}
                  redirectTo="/subjects"
                  onError={setFormError}
                />
              )}
              {formError ? (
                <p className="mt-2 break-words rounded-lg bg-[#FEF2F2] px-2.5 py-2 text-[11px] font-medium text-[#DC2626]">
                  {formError}
                </p>
              ) : null}
              <p className="mt-2 flex items-start gap-1.5 text-xs text-[#667085]">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>Secure one-click sign-in • No password required</span>
              </p>
              <p className="mt-3 text-xs leading-5 text-[#98A2B3]">
                By continuing, you agree to the{' '}
                <Link href="/terms" className="underline decoration-[#D0D5DD] hover:text-[#667085]">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline decoration-[#D0D5DD] hover:text-[#667085]">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="min-w-0 border-t border-[#E4E7EC] bg-[#FAF5FF]/50 p-5 sm:p-6 md:border-l md:border-t-0 md:p-7 max-[479px]:p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">Profile preview</p>
              <span className="rounded-full border border-[#EDE9FE] bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                Sample data
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-[479px]:grid-cols-1">
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Overall Rank</p>
                <div className="relative mt-2 flex h-14 w-14 items-center justify-center">
                  <Award className="absolute -left-1 h-4 w-4 text-amber-400 opacity-80 max-[479px]:hidden" />
                  <Award className="absolute -right-1 h-4 w-4 scale-x-[-1] text-amber-400 opacity-80 max-[479px]:hidden" />
                  <span className="text-xl font-bold text-brand">#{DUMMY.rank}</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Readiness</p>
                <div className="mt-1 w-full max-w-[84px]">
                  <CircularGauge
                    value={DUMMY.readiness}
                    size={84}
                    stroke={7}
                    sublabel={DUMMY.readinessLabel}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5 max-[479px]:grid-cols-1">
              <MiniStat label="Total Attempts" value={String(DUMMY.totalAttempts)} />
              <MiniStat label="Unique Questions" value={String(DUMMY.uniqueQuestions)} />
              <MiniStat
                label="Correct Answers"
                value={String(DUMMY.correct)}
                sub={`${DUMMY.accuracy}% Accuracy`}
                accent="green"
              />
              <MiniStat label="Study Days" value={String(DUMMY.studyDays)} sub="Total Days" />
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5 max-[479px]:grid-cols-1">
              <MiniStat label="Bookmarks" value={String(DUMMY.bookmarks)} />
              <MiniStat label="Mistake Questions" value={String(DUMMY.mistakes)} />
            </div>

            <div className="mt-2.5 rounded-xl border border-[#EDE9FE] bg-white p-3 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Strengths & Weaknesses</h3>
              <p className="mt-2.5 text-[10px] font-semibold uppercase text-emerald-600">Strong Areas</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DUMMY.strengths.map((s) => (
                  <span
                    key={s.title}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700"
                  >
                    {s.title}
                    <span className="ml-1 opacity-70">({s.accuracy}%)</span>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase text-red-500">Focus Topics</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DUMMY.weaknesses.map((w) => (
                  <span
                    key={w.title}
                    className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-medium text-red-700"
                  >
                    {w.title}
                    <span className="ml-1 opacity-70">({w.accuracy}%)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
