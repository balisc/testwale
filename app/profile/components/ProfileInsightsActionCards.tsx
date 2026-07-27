import Link from 'next/link';
import { getLocalizedText } from '@/lib/localizedText';
import type { InsightsFocusNext, InsightsStrongArea } from '@/lib/profileInsightsTypes';
import type { ProfileInsightsCopy } from '../profileInsightsCopy';

type StrongProps = {
  copy: ProfileInsightsCopy;
  area: InsightsStrongArea;
  language: 'en' | 'hi';
};

export function ProfileInsightsStrongArea({ copy, area, language }: StrongProps) {
  return (
    <section
      aria-label={copy.strongArea}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
        {copy.strongArea}
      </p>

      {!area ? (
        <div className="mt-3 flex flex-1 flex-col">
          <p className="text-sm font-medium text-slate-800">{copy.noStrongArea}</p>
          <p className="mt-1 text-sm text-slate-500">{copy.noStrongHint}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:self-start"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col">
          <p className="break-words text-lg font-bold text-[#0F172A]">
            {getLocalizedText(area.topic_title, language)}
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">
            {area.accuracy_percent}% {copy.strongMetric}
          </p>
          <p className="mt-1 text-sm text-slate-500">{copy.strongSample(area.unique_questions)}</p>
          <Link
            href={area.practice_href}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand hover:bg-[#FAF5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:self-start"
          >
            {copy.practiceMixedQuiz}
          </Link>
        </div>
      )}
    </section>
  );
}

type FocusProps = {
  copy: ProfileInsightsCopy;
  focus: InsightsFocusNext;
  language: 'en' | 'hi';
};

export function ProfileInsightsFocusNext({ copy, focus, language }: FocusProps) {
  return (
    <section
      aria-label={copy.focusNext}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden />
        {copy.focusNext}
      </p>

      {!focus ? (
        <div className="mt-3 flex flex-1 flex-col">
          <p className="text-sm font-medium text-slate-800">{copy.noFocus}</p>
          <p className="mt-1 text-sm text-slate-500">{copy.noFocusHint}</p>
          <Link
            href="/subjects"
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:self-start"
          >
            {copy.browseSubjects}
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col">
          <p className="break-words text-lg font-bold text-[#0F172A]">
            {getLocalizedText(focus.topic_title, language)}
          </p>
          <p className="mt-1 text-sm font-semibold text-amber-700">
            {focus.accuracy_percent}% {copy.focusMetric}
          </p>
          {focus.mistakes_due > 0 ? (
            <p className="mt-1 text-sm text-slate-500">{copy.mistakesDue(focus.mistakes_due)}</p>
          ) : null}
          <Link
            href={focus.practice_href}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:self-start"
          >
            {copy.practiceFocusTopic}
          </Link>
        </div>
      )}
    </section>
  );
}
