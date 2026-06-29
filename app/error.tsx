'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application route error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-24 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">Something went wrong</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">We could not load this page.</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
          Please retry the page. If the issue continues, return to subjects and keep practicing.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            Try again
          </button>
          <Link
            href="/subjects"
            className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            Browse Subjects
          </Link>
        </div>
      </section>
    </main>
  );
}
