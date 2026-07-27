import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import type { ContinueLearningItem } from '@/lib/profileOverview';
import type { ProfileCopy } from '../profileCopy';
import ProfileProgressBar from './ProfileProgressBar';

type ProfileContinueLearningProps = {
  copy: ProfileCopy;
  item: ContinueLearningItem;
};

export default function ProfileContinueLearning({ copy, item }: ProfileContinueLearningProps) {
  const isFallback = item.kind === 'fallback';

  return (
    <section
      aria-label={copy.continueLearning}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.continueLearning}</h3>

      {isFallback ? (
        <div className="mt-4 flex flex-1 flex-col">
          <p className="text-sm font-medium text-slate-800">{copy.startFirstPractice}</p>
          <p className="mt-1 text-sm text-slate-500">{copy.startFirstPracticeHint}</p>
          <Link
            href={item.href}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:self-start"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-brand"
              aria-hidden
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="break-words font-semibold text-slate-900">{item.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {item.mistakes > 0 ? (
                  <>
                    {item.mistakes} {copy.mistakesToReview} • {item.accuracy_percent}% {copy.accuracy.toLowerCase()}
                  </>
                ) : (
                  <>
                    {item.accuracy_percent}% {copy.accuracy.toLowerCase()}
                  </>
                )}
              </p>
              <ProfileProgressBar
                value={item.progress_percent}
                label={`${item.title} progress`}
                className="mt-2 max-w-xs"
              />
            </div>
          </div>
          <Link
            href={item.href}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {copy.reviewTopic}
          </Link>
        </div>
      )}
    </section>
  );
}
