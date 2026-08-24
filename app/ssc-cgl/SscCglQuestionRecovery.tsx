'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { QUESTION_BATCH_CACHE_VERSION } from '@/lib/questionBatchCache';

export default function SscCglQuestionRecovery({
  title,
  backHref,
}: {
  title: string;
  backHref: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (searchParams.get('qb') === QUESTION_BATCH_CACHE_VERSION) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set('qb', QUESTION_BATCH_CACHE_VERSION);
    setRetrying(true);
    router.replace(`${pathname}?${next.toString()}`);
  }, [pathname, router, searchParams]);

  return (
    <section className="mt-6 rounded-2xl border border-violet-100 bg-white p-8 text-center shadow-sm sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><AlertCircle className="h-7 w-7" aria-hidden="true" /></span>
      <h1 className="mt-5 text-2xl font-extrabold">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
        {retrying ? 'Loading questions…' : 'Questions could not be loaded. Retry the live question bank.'}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => { setRetrying(true); router.refresh(); }} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-violet-700 px-5 font-semibold text-white transition hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2">Retry questions</button>
        <Link href={backHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 font-semibold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to all subtopics</Link>
      </div>
    </section>
  );
}
