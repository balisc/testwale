'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getLocalizedText } from '@/lib/localizedText';
import type { InsightsSubjectRow } from '@/lib/profileInsightsTypes';
import type { ProfileInsightsCopy } from '../profileInsightsCopy';
import ProfileProgressBar from './ProfileProgressBar';

type Props = {
  copy: ProfileInsightsCopy;
  subjects: InsightsSubjectRow[];
  language: 'en' | 'hi';
};

export default function ProfileInsightsSubjectProgress({ copy, subjects, language }: Props) {
  return (
    <section
      aria-label={copy.subjectProgress}
      className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6"
    >
      <div>
        <h3 className="text-base font-bold text-[#0F172A] sm:text-lg">{copy.subjectProgress}</h3>
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{copy.subjectProgressHint}</p>
      </div>

      {subjects.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{copy.noAttempts}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {subjects.map((subject) => (
            <li key={subject.subject_id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 break-words font-medium text-slate-800">
                  {getLocalizedText(subject.subject_title, language)}
                </span>
                <span className="shrink-0 font-semibold text-brand">
                  {subject.locked ? '—' : `${subject.accuracy_percent}%`}
                </span>
              </div>
              <ProfileProgressBar
                value={subject.locked ? 0 : subject.accuracy_percent}
                label={`${getLocalizedText(subject.subject_title, language)} ${copy.firstAttemptAccuracy}`}
              />
              {subject.locked ? (
                <p className="mt-1 text-xs text-slate-500">{copy.subjectLocked}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/subjects"
        className="mt-5 inline-flex min-h-[44px] items-center gap-0.5 self-start text-sm font-medium text-brand hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {copy.viewAllSubjects}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
