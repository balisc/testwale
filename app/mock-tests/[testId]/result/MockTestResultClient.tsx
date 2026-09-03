'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, Loader2, Target, XCircle } from 'lucide-react';
import VerifiedSources from '@/components/questions/VerifiedSources';
import { getOptionsForLang, getQuestionLocalizedText } from '@/lib/practice';
import type { MockResult } from '@/lib/mockTests/types';

type Filter = 'all' | 'correct' | 'wrong' | 'unanswered' | 'marked';
const KEYS = ['A', 'B', 'C', 'D'] as const;
const duration = (seconds: number) => `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;

function indiaTime(value: string | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function localizedMetadata(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    const localized = value as Record<string, unknown>;
    if (typeof localized.en === 'string' && localized.en.trim()) return localized.en;
    if (typeof localized.hi === 'string' && localized.hi.trim()) return localized.hi;
  }
  return fallback;
}

export default function MockTestResultClient({ testId }: { testId: string }) {
  const [result, setResult] = useState<MockResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [loadingReview, setLoadingReview] = useState(true);

  useEffect(() => {
    setLoadingReview(true);
    setError(null);
    void fetch(`/api/mock-tests/${testId}/result?page=1&pageSize=10&filter=${filter}`, { cache: 'no-store', credentials: 'include' })
      .then(async (response) => {
        const body = await response.json() as { result?: MockResult; message?: string };
        if (!response.ok || !body.result) throw new Error(body.message ?? 'Could not load the result.');
        setResult(body.result);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Could not load the result.'))
      .finally(() => setLoadingReview(false));
  }, [filter, testId]);

  const review = useMemo(() => result?.review.filter((item) => filter === 'all'
    || (filter === 'correct' && item.isCorrect === true)
    || (filter === 'wrong' && item.isCorrect === false)
    || (filter === 'unanswered' && item.selectedOption == null)
    || (filter === 'marked' && item.response?.markedForReview)) ?? [], [filter, result?.review]);

  const loadMore = async () => {
    if (!result || loadingReview || result.review.length >= result.reviewTotal) return;
    setLoadingReview(true);
    try {
      const page = result.reviewPage + 1;
      const response = await fetch(`/api/mock-tests/${testId}/result?page=${page}&pageSize=${result.reviewPageSize}&filter=${filter}`, { cache: 'no-store', credentials: 'include' });
      const body = await response.json() as { result?: MockResult; message?: string };
      if (!response.ok || !body.result) throw new Error(body.message ?? 'Could not load more review questions.');
      setResult({ ...body.result, review: [...result.review, ...body.result.review] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load more review questions.');
    } finally {
      setLoadingReview(false);
    }
  };

  if (error) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-red-700" role="alert">{error}</p><Link href={`/mock-tests/${testId}`} className="mt-5 inline-flex font-bold text-violet-700">Return to test</Link></main>;
  if (!result) return <main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-700" aria-label="Loading result" /></main>;

  const test = result.test;
  const metrics = [
    { label: 'Score', value: `${test.finalScore ?? 0} / 200`, Icon: Target },
    { label: 'Attempted', value: `${test.attempted} / 100`, Icon: Target },
    { label: 'Correct', value: String(test.correct), Icon: CheckCircle2 },
    { label: 'Wrong', value: String(test.wrong), Icon: XCircle },
    { label: 'Unanswered', value: String(test.unanswered), Icon: Target },
    { label: 'Accuracy', value: `${test.accuracy.toFixed(1)}%`, Icon: Target },
    { label: 'Negative marks', value: `-${test.negativeMarks.toFixed(1)}`, Icon: XCircle },
    { label: 'Wall / active time', value: `${duration(test.wallTimeSeconds)} / ${duration(test.activeTimeSeconds)}`, Icon: Clock3 },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-violet-700">Final | {test.status === 'auto_submitted' ? 'Auto-submitted' : 'Submitted'}</p>
            <h1 className="mt-2 text-3xl font-extrabold">{test.title} Result</h1>
            <p className="mt-2 text-sm text-slate-600">Test #{test.testNumber} | {test.blueprintCode} | {test.timingMode === 'scribe_simulation' ? 'Eligible-scribe simulation' : 'Standard mode'}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">Generated: {indiaTime(test.createdAt)} | Started: {indiaTime(test.startedAt)} | Finalized: {indiaTime(test.submittedAt ?? test.autoSubmittedAt)} (Asia/Kolkata)</p>
          </div>
          <Link href="/profile#mock-tests" className="inline-flex min-h-11 items-center font-bold text-violet-700 hover:underline">Back to mock-test history</Link>
        </div>

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Overall result">
          {metrics.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="h-5 w-5 text-violet-700" aria-hidden="true" />
              <p className="mt-3 text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-extrabold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-extrabold">Section performance</h2>
          <table className="mt-4 min-w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-3">Section</th><th>Score</th><th>Attempted / unanswered</th><th>Correct / wrong</th><th>Accuracy</th><th>Positive / negative</th><th>Active time</th></tr></thead>
            <tbody>{result.sections.map((section) => (
              <tr key={section.sectionKey} className="border-b border-slate-100">
                <th className="py-3 pr-4">{section.sectionKey.replaceAll('_', ' ')}</th>
                <td>{section.score}/50</td><td>{section.attempted} / {section.unanswered}</td><td>{section.correct} / {section.wrong}</td>
                <td>{section.attempted === 0 ? '0.0' : ((section.correct / section.attempted) * 100).toFixed(1)}%</td>
                <td>+{section.positiveMarks} / -{section.negativeMarks}</td><td>{duration(section.activeTimeSeconds)}</td>
              </tr>
            ))}</tbody>
          </table>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-extrabold">Topic insights</h2>
          <p className="mt-1 text-sm text-slate-600">Strength/focus labels require at least three attempted questions in a topic.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">{result.topicInsights.map((topic) => (
            <div key={topic.key} className="rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between gap-4"><strong>{topic.label}</strong><span className="text-sm font-bold">{topic.accuracy == null ? '-' : `${topic.accuracy.toFixed(1)}%`}</span></div>
              <p className="mt-2 text-xs text-slate-600">{topic.correct}/{topic.attempted} correct | {topic.insight === 'more_data_needed' ? 'More data needed' : topic.insight === 'strength' ? 'Current strength' : 'Focus area'}</p>
            </div>
          ))}</div>
          <p className="mt-4 text-xs text-slate-500">Percentile/rank: insufficient comparable same-blueprint standard-mode cohort.</p>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold">Question review</h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Review filters">
              {(['all', 'correct', 'wrong', 'unanswered', 'marked'] as Filter[]).map((value) => (
                <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 rounded-lg px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${filter === value ? 'bg-violet-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{value[0]!.toUpperCase() + value.slice(1)}</button>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {review.map((item) => {
              const options = getOptionsForLang(item.options as never, 'en');
              const source = typeof item.source.source === 'string' ? item.source.source : null;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-violet-700">Question {item.overallOrder} | {item.bucketKey.replaceAll('_', ' ')}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.isCorrect ? 'bg-emerald-50 text-emerald-700' : item.selectedOption ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{item.isCorrect ? 'Correct' : item.selectedOption ? 'Wrong' : 'Unanswered'}</span>
                  </div>
                  {item.passage ? <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm leading-7">{getQuestionLocalizedText(item.passage, 'en')}</div> : null}
                  <p className="mt-4 leading-7">{getQuestionLocalizedText(item.question, 'en')}</p>
                  <div className="mt-4 grid gap-2">{KEYS.map((displayKey, index) => {
                    const originalKey = item.optionOrder[index];
                    const correct = displayKey === item.correctOption;
                    const selected = displayKey === item.selectedOption;
                    return <div key={displayKey} className={`rounded-xl border p-3 text-sm ${correct ? 'border-emerald-300 bg-emerald-50' : selected ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}><strong>{displayKey}.</strong> {options[originalKey]} {correct ? <span className="font-bold text-emerald-700"> | Correct answer</span> : null}{selected ? <span className="font-bold text-slate-700"> | Your answer</span> : null}</div>;
                  })}</div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6"><strong>Explanation:</strong> {getQuestionLocalizedText(item.explanation, 'en') || 'No frozen explanation text available.'}</div>
                  <p className="mt-3 text-xs text-slate-500">Topic: {localizedMetadata(item.taxonomy.topic, item.bucketKey)} | Subtopic: {localizedMetadata(item.taxonomy.subtopic, 'Not classified')} | Estimated active interaction: {duration(item.estimatedActiveTimeSeconds)}</p>
                  <VerifiedSources className="mt-4" source={source} sourceMetadata={item.source.source_metadata} questionId={item.id} isVerified />
                </article>
              );
            })}
            {!loadingReview && review.length === 0 ? <p className="rounded-xl bg-white p-5 text-sm text-slate-600">No questions match this filter.</p> : null}
            {result.review.length < result.reviewTotal ? <button type="button" disabled={loadingReview} onClick={() => void loadMore()} className="min-h-11 rounded-xl border border-violet-200 bg-white px-5 text-sm font-bold text-violet-700 disabled:opacity-50">{loadingReview ? 'Loading...' : `Load more (${result.reviewTotal - result.review.length} remaining)`}</button> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
