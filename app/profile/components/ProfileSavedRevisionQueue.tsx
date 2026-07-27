import Link from 'next/link';
import type { SavedRevisionQueue } from '@/lib/profileSavedTypes';
import type { ProfileSavedCopy } from '../profileSavedCopy';

type Props = {
  copy: ProfileSavedCopy;
  queue: SavedRevisionQueue;
  language: 'en' | 'hi';
};

export default function ProfileSavedRevisionQueue({ copy, queue, language }: Props) {
  const title = language === 'hi' ? queue.title_hi : queue.title_en;
  const explanation = language === 'hi' ? queue.explanation_hi : queue.explanation_en;
  const startLabel = language === 'hi' ? queue.start_label_hi : queue.start_label_en;
  const total = queue.buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <section
      aria-label={copy.revisionQueue}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{explanation}</p>
        </div>
        {queue.start_href && startLabel ? (
          <Link
            href={queue.start_href}
            className="inline-flex min-h-[44px] shrink-0 items-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {startLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
        {queue.buckets.map((bucket) => {
          const label = language === 'hi' ? bucket.label_hi : bucket.label_en;
          return (
            <div key={bucket.key} className="text-center">
              <p className="text-2xl font-bold text-brand sm:text-3xl">{bucket.count}</p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
            </div>
          );
        })}
      </div>

      {total > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-xs text-slate-500">{copy.queueSummary(total)}</p>
          <div className="flex h-2 overflow-hidden rounded-full bg-[#EDE9FE]" role="group" aria-label={copy.revisionQueue}>
            {queue.buckets.map((bucket) => {
              const label = language === 'hi' ? bucket.label_hi : bucket.label_en;
              const width = total > 0 ? Math.round((bucket.count / total) * 100) : 0;
              return (
                <div
                  key={bucket.key}
                  role="img"
                  aria-label={copy.queueAccessible(label, bucket.count)}
                  className="h-full bg-brand motion-reduce:transition-none"
                  style={{ width: `${Math.max(width, bucket.count > 0 ? 4 : 0)}%` }}
                  title={`${label}: ${bucket.count}`}
                />
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400 sm:text-xs">
            {queue.buckets.map((bucket) => (
              <span key={bucket.key} className="truncate px-0.5">
                {language === 'hi' ? bucket.label_hi : bucket.label_en}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">{copy.caughtUpHint}</p>
      )}

      <p className="sr-only">
        {queue.buckets
          .map((bucket) =>
            copy.queueAccessible(
              language === 'hi' ? bucket.label_hi : bucket.label_en,
              bucket.count,
            ),
          )
          .join(', ')}
      </p>
    </section>
  );
}
