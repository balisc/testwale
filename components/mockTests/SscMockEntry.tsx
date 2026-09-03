'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, FileText, Loader2, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getMockBlueprint } from '@/lib/mockTests/blueprints';
import type { MockExamKey } from '@/lib/mockTests/blueprintTypes';
import type { MockReadiness } from '@/lib/mockTests/types';

export default function SscMockEntry({ examKey, compact = false }: { examKey: MockExamKey; compact?: boolean }) {
  const config = getMockBlueprint(examKey);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [readiness, setReadiness] = useState<MockReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setReadiness(null);
    setError(null);
    void fetch(`/api/mock-tests/readiness?exam=${encodeURIComponent(examKey)}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json() as { readiness?: MockReadiness };
        if (!response.ok || !body.readiness) throw new Error('readiness_failed');
        if (active) setReadiness(body.readiness);
      })
      .catch(() => {
        if (active) setError('Readiness could not be checked. Generation remains unavailable.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [examKey]);

  const gaps = useMemo(() => readiness?.buckets.filter((bucket) => !bucket.ready).slice(0, 4) ?? [], [readiness]);
  const generate = async () => {
    if (authLoading || generating) return;
    if (!readiness?.generationEnabled) return;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(config.flowPath)}`);
      return;
    }
    setGenerating(true);
    setError(null);
    pendingKey.current ??= crypto.randomUUID();
    try {
      const response = await fetch('/api/mock-tests/generate', {
        method: 'POST', credentials: 'include', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: pendingKey.current, examKey }),
      });
      const body = await response.json() as { testId?: string; code?: string; message?: string };
      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(config.flowPath)}`);
        return;
      }
      if (!response.ok || !body.testId) throw new Error(body.message ?? body.code ?? 'generation_failed');
      pendingKey.current = null;
      router.push(`/mock-tests/${body.testId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The mock test could not be generated.');
    } finally {
      setGenerating(false);
    }
  };

  const state = readiness?.state ?? 'blocked';
  const blocked = !readiness?.generationEnabled;
  const stateCopy = state === 'ready'
    ? { label: 'Ready', tone: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 }
    : state === 'limited'
      ? { label: 'Limited beta', tone: 'bg-amber-50 text-amber-800', icon: AlertTriangle }
      : { label: 'Content preparation in progress', tone: 'bg-slate-100 text-slate-700', icon: LockKeyhole };
  const StateIcon = stateCopy.icon;
  const timingCopy = config.rules.timingStrategy === 'global' ? 'One global 60-minute timer' : '15 min per section';
  const blockedCopy = readiness?.reason === 'feature_disabled'
    ? {
        title: 'Full mock tests are not open yet.',
        body: 'The test workspace is ready, but generation will open only after the verified-content launch checks are complete.',
        showGaps: false,
      }
    : readiness?.reason === 'migration_required'
      ? {
          title: 'Mock-test setup is in progress.',
          body: 'Generation will become available after the production database setup and verification are complete.',
          showGaps: false,
        }
      : readiness?.reason === 'blueprint_disabled'
        ? {
            title: 'This mock-test version is temporarily unavailable.',
            body: 'A reviewed blueprint must be active before a new test can be generated.',
            showGaps: false,
          }
        : {
            title: 'Verified question preparation is in progress.',
            body: 'Content and passage-group checks must pass before this can be labelled exam-realistic.',
            showGaps: true,
          };

  return (
    <section className={`${compact ? 'mt-8' : 'mt-6'} overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_18px_60px_rgba(76,29,149,0.08)]`} aria-labelledby={`${examKey}-full-mock-tests-heading`}>
      <div className={`grid ${compact ? '' : 'lg:grid-cols-[1.3fr_0.7fr]'}`}>
        <div className="p-5 sm:p-7 lg:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-violet-700"><FileText className="h-4 w-4" aria-hidden="true" /> Full Mock Tests</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${stateCopy.tone}`}><StateIcon className="h-3.5 w-3.5" aria-hidden="true" /> {stateCopy.label}</span>
          </div>
          <h2 id={`${examKey}-full-mock-tests-heading`} className="mt-4 text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[32px] sm:leading-[40px] max-[479px]:text-2xl">{config.title.toLowerCase()}</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            An SSC-style practice simulation with 100 permanently saved questions, four 25-question sections,
            +2/−0.5 marking and authoritative server timing. It is not an official SSC product.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-[#344054]">
            <span className="rounded-full bg-slate-100 px-3 py-1.5">100 questions · 200 marks</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{timingCopy}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5">Saved permanently</span>
          </div>

          {loading ? (
            <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Checking verified inventory…</p>
          ) : blocked ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700" role="status">
              <p className="font-bold text-slate-950">{blockedCopy.title}</p>
              <p className="mt-1">{blockedCopy.body}</p>
              {blockedCopy.showGaps && gaps.length > 0 ? <details className="mt-3"><summary className="cursor-pointer font-semibold text-slate-800">View readiness details</summary><ul className="mt-2 list-disc pl-5">{gaps.map((gap) => <li key={gap.bucketKey}>{gap.label}: {gap.eligibleCount}/{gap.requiredCount} verified</li>)}</ul></details> : null}
            </div>
          ) : state === 'limited' ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
              <p className="font-bold">Limited beta composition</p>
              <p className="mt-1">{config.knownGapCopy} It is excluded from exam-exact comparisons.</p>
            </div>
          ) : null}

          {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" disabled={loading || generating || blocked} onClick={() => void generate()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-[15px] font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 max-[479px]:text-sm">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {generating ? 'Generating and saving…' : blocked ? 'Generation unavailable' : user ? 'Generate New Mock Test' : 'Sign in to generate'}
              {!generating && !blocked ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
            </button>
            {user ? <Link href="/profile#mock-tests" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-violet-700 hover:underline max-[479px]:text-sm">View my mock-test history</Link> : null}
          </div>
        </div>
        {!compact ? (
          <div className="border-t border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 lg:border-l lg:border-t-0 lg:p-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#18181B]">Before you start</h3>
            <ol className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
              <li><strong>1.</strong> Generate once. The clock does not start.</li>
              <li><strong>2.</strong> Read the instructions and choose standard or eligible-scribe simulation.</li>
              <li><strong>3.</strong> Start when ready. The server clock cannot pause.</li>
              <li><strong>4.</strong> Reopen from your profile and review the frozen result after submission.</li>
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
