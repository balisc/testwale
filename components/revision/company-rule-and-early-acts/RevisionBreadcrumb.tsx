'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { LocalizedText } from '@/lib/localizedText';
import { useLanguage } from '@/lib/LanguageContext';
import { useCatalogText } from '@/lib/useCatalogText';
import { uiLabel } from './uiLabel';

type Props = {
  subjectHref: string;
  subjectTitle: LocalizedText;
  topicHref: string;
  topicTitle: LocalizedText;
  subtopicTitle: LocalizedText;
};

export function RevisionBreadcrumb({
  subjectHref,
  subjectTitle,
  topicHref,
  topicTitle,
  subtopicTitle,
}: Props) {
  const { language } = useLanguage();
  const subjectLabel = useCatalogText(subjectTitle);
  const topicLabel = useCatalogText(topicTitle);
  const subtopicLabel = useCatalogText(subtopicTitle);

  return (
    <nav className="cr-breadcrumb-ref print:hidden" aria-label="Breadcrumb">
      <ol className="cr-breadcrumb-ref-list">
        <li>
          <Link href="/" className="cr-breadcrumb-ref-link cr-breadcrumb-ref-link--home">
            <Home className="h-4 w-4" aria-hidden />
            <span>{uiLabel(language, 'Home', 'होम')}</span>
          </Link>
        </li>
        <li aria-hidden className="cr-breadcrumb-ref-sep">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link href={subjectHref} className="cr-breadcrumb-ref-link">
            {subjectLabel}
          </Link>
        </li>
        <li aria-hidden className="cr-breadcrumb-ref-sep">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li>
          <Link href={topicHref} className="cr-breadcrumb-ref-link">
            {topicLabel}
          </Link>
        </li>
        <li aria-hidden className="cr-breadcrumb-ref-sep">
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="cr-breadcrumb-ref-current" aria-current="page">
          {subtopicLabel}
        </li>
      </ol>
    </nav>
  );
}
