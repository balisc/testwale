'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock3, FileText, Loader2 } from 'lucide-react';
import type { MockHistoryRow } from '@/lib/mockTests/types';

type HistoryResponse = {
  tests?: MockHistoryRow[];
  total?: number;
  migrationRequired?: boolean;
};

function formatIndiaTime(value: string | null) {
  if (!value) return 'Not yet';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60);
  const remainder = Math.max(0, seconds) % 60;
  return `${minutes}m ${remainder}s`;
}

function statusLabel(status: MockHistoryRow['status']) {
  if (status === 'not_started') return 'Ready to start';
  if (status === 'in_progress') return 'In progress';
  if (status === 'auto_submitted') return 'Auto-submitted';
  return 'Submitted';
}

export default function ProfileMockTests() {
  const [rows, setRows] = useState<MockHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/mock-tests?page=1&pageSize=10', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json() as HistoryResponse;
        if (!response.ok) throw new Error('history_unavailable');
        if (!active) return;
        setRows(body.tests ?? []);
        setTotal(body.total ?? 0);
        setUnavailable(body.migrationRequired === true);
      })
      .catch(() => {
        if (active) setUnavailable(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const loadMore = async () => {
    if (loadingMore || rows.length >= total) return;
    setLoadingMore(true);
    try {
      const page = Math.floor(rows.length / 10) + 1;
      const response = await fetch(`/api/mock-tests?page=${page}&pageSize=10`, { credentials: 'include', cache: 'no-store' });
      const body = await response.json() as HistoryResponse;
      if (!response.ok) throw new Error('history_unavailable');
      setRows((current) => [...current, ...(body.tests ?? []).filter((row) => !current.some((item) => item.id === row.id))]);
      setTotal(body.total ?? total);
    } catch {
      setUnavailable(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section id="mock-tests" aria-labelledby="profile-mock-tests-heading" className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
            <FileText className="h-4 w-4" aria-hidden="true" /> Full Mock Tests
          </p>
          <h2 id="profile-mock-tests-heading" className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">SSC full mock-test history</h2>
          <p className="mt-1 text-sm text-slate-600">Times are shown in Asia/Kolkata. Every generated paper is a frozen snapshot.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mock-tests/ssc-cgl" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">New CGL mock <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/mock-tests/ssc-chsl" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">New CHSL mock <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading mock-test history...</p>
      ) : unavailable ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Mock-test history is unavailable while the production migration is pending.</p>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-bold text-slate-900">No mock tests yet.</p>
          <p className="mt-1">Generate a paper first; starting the timer is a separate, deliberate action.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((row) => {
            const terminal = row.status === 'submitted' || row.status === 'auto_submitted';
            const href = terminal ? `/mock-tests/${row.id}/result` : `/mock-tests/${row.id}`;
            return (
              <article key={row.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-950">{row.examKey === 'ssc-chsl' ? 'SSC CHSL' : 'SSC CGL'} Mock #{row.testNumber} <span className="font-medium text-slate-500">- {statusLabel(row.status)}</span></h3>
                    <p className="mt-1 text-xs text-slate-500">Generated {formatIndiaTime(row.createdAt)}</p>
                  </div>
                  <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600">
                    {terminal ? 'View result' : row.status === 'in_progress' ? 'Resume' : 'Start'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 lg:grid-cols-8">
                  <div><dt className="text-slate-500">Score</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? `${row.finalScore ?? 0}/${row.maxScore}` : '-'}</dd></div>
                  <div><dt className="text-slate-500">Attempted</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? `${row.attempted}/100` : '-'}</dd></div>
                  <div><dt className="text-slate-500">Correct</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? row.correct : '-'}</dd></div>
                  <div><dt className="text-slate-500">Wrong</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? row.wrong : '-'}</dd></div>
                  <div><dt className="text-slate-500">Unanswered</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? row.unanswered : '-'}</dd></div>
                  <div><dt className="text-slate-500">Accuracy</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? `${row.accuracy.toFixed(1)}%` : '-'}</dd></div>
                  <div><dt className="text-slate-500"><Clock3 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />Wall / active</dt><dd className="mt-0.5 font-bold text-slate-900">{terminal ? `${formatDuration(row.wallTimeSeconds)} / ${formatDuration(row.activeTimeSeconds)}` : '-'}</dd></div>
                </dl>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Started: {formatIndiaTime(row.startedAt)} | Mode: {row.timingMode === 'scribe_simulation' ? 'Eligible-scribe simulation' : row.timingMode === 'standard' ? 'Standard' : 'Not chosen'}
                  {terminal ? <> | Finalized: {formatIndiaTime(row.submittedAt ?? row.autoSubmittedAt)} | Negative marks: {row.negativeMarks.toFixed(1)}</> : null}
                </p>
              </article>
            );
          })}
          {total > rows.length ? <button type="button" disabled={loadingMore} onClick={() => void loadMore()} className="min-h-11 rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 disabled:opacity-50">{loadingMore ? 'Loading...' : `Load more (${total - rows.length} remaining)`}</button> : null}
        </div>
      )}
    </section>
  );
}
