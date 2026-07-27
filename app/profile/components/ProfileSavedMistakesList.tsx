import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { SavedMistakeRow } from '@/lib/profileSavedTypes';
import type { ProfileSavedCopy } from '../profileSavedCopy';
import { mistakeStatusLabel } from '../profileSavedCopy';

type Props = {
  copy: ProfileSavedCopy;
  mistakes: SavedMistakeRow[];
  caughtUp: boolean;
  allRecovered: boolean;
};

const STATUS_DOT: Record<SavedMistakeRow['status'], string> = {
  recently_missed: 'bg-orange-500',
  incorrect_twice: 'bg-red-500',
  unresolved: 'bg-amber-400',
};

export default function ProfileSavedMistakesList({
  copy,
  mistakes,
  caughtUp,
  allRecovered,
}: Props) {
  return (
    <section
      aria-label={copy.mistakesToReview}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.mistakesToReview}</h3>

      {caughtUp ? (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center">
          <p className="font-medium text-emerald-800">{copy.caughtUp}</p>
          <p className="mt-1 text-sm text-emerald-700">{copy.caughtUpHint}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.practiceMore}
          </Link>
        </div>
      ) : allRecovered ? (
        <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-6 text-center">
          <p className="font-medium text-emerald-800">{copy.allRecovered}</p>
          <p className="mt-1 text-sm text-emerald-700">{copy.allRecoveredHint}</p>
        </div>
      ) : mistakes.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">{copy.noMistakesList}</p>
      ) : (
        <ul className="mt-4 divide-y divide-[#F1F5F9]">
          {mistakes.map((mistake) => {
            const status = mistakeStatusLabel(copy, mistake.status);
            return (
              <li key={mistake.question_id} className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
                <BookOpen className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800">{mistake.title}</p>
                  <p className="text-xs text-slate-500">{mistake.subject_title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[mistake.status]}`}
                      aria-hidden
                    />
                    <span>{status}</span>
                  </p>
                </div>
                {mistake.review_href ? (
                  <Link
                    href={mistake.review_href}
                    className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg border border-brand px-3 py-1.5 text-sm font-medium text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {copy.review}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">—</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
