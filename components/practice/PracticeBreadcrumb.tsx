'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';
import { useCatalogText } from '@/lib/useCatalogText';
import type { LocalizedText } from '@/types/polity';

type PracticeBreadcrumbProps = {
  subjectSlug: string;
  subjectTitle: LocalizedText;
  topicTitle?: LocalizedText;
  topicHref?: string;
  subtopicTitle?: LocalizedText;
  currentLabel: { en: string; hi: string };
};

const COPY = {
  en: { home: 'Home', subjects: 'Subjects' },
  hi: { home: 'होम', subjects: 'विषय' },
};

export default function PracticeBreadcrumb({
  subjectSlug,
  subjectTitle,
  topicTitle,
  topicHref,
  subtopicTitle,
  currentLabel,
}: PracticeBreadcrumbProps) {
  const { language } = useLanguage();
  const subject = useCatalogText(subjectTitle);
  const topic = useCatalogText(topicTitle);
  const subtopic = useCatalogText(subtopicTitle);
  const current = language === 'hi' ? currentLabel.hi : currentLabel.en;

  const c = COPY[language];

  return (
    <nav className="mb-2 text-sm text-slate-500" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-brand">
            {c.home}
          </Link>
        </li>
        <li aria-hidden className="text-slate-300">
          /
        </li>
        <li>
          <Link href="/subjects" className="hover:text-brand">
            {c.subjects}
          </Link>
        </li>
        <li aria-hidden className="text-slate-300">
          /
        </li>
        <li>
          <Link href={`/subjects/${subjectSlug}`} className="hover:text-brand">
            {subject}
          </Link>
        </li>
        {topic && topicHref && (
          <>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li>
              <Link href={topicHref} className="hover:text-brand">
                {topic}
              </Link>
            </li>
          </>
        )}
        {subtopic && (
          <>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li className="font-medium text-slate-700">{subtopic}</li>
          </>
        )}
        {!subtopic && (
          <>
            <li aria-hidden className="text-slate-300">
              /
            </li>
            <li className="font-medium text-slate-700">{current}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
