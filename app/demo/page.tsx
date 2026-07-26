import type { Metadata } from 'next';
import Link from 'next/link';
import {
  resolveSubtopicPracticeHref,
  SOURCES_REVISION_SUBTOPIC_SLUG,
} from '@/lib/revision/resolveSubtopicPracticeHref';
import SourcesRevisionClient from './SourcesRevisionClient';

export const metadata: Metadata = {
  title: 'Sources of the Indian Constitution — Revision (Demo)',
  description:
    'Interactive demo revision UI. The indexable public revision page lives under /subjects/.../revision.',
  robots: { index: false, follow: true },
};

export default async function DemoRevisionPage() {
  const practice = await resolveSubtopicPracticeHref(SOURCES_REVISION_SUBTOPIC_SLUG);

  if (!practice) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Revision unavailable</h1>
        <p className="mt-3 text-slate-600">
          The subtopic <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">{SOURCES_REVISION_SUBTOPIC_SLUG}</code>{' '}
          could not be resolved from the catalog. Practice navigation is disabled until the catalog includes this
          subtopic.
        </p>
        <Link href="/subjects/indian-polity" className="mt-6 inline-block text-brand underline-offset-2 hover:underline">
          Browse Indian Polity
        </Link>
      </div>
    );
  }

  return (
    <SourcesRevisionClient
      practiceHref={practice.href}
      breadcrumb={{
        subjectSlug: practice.subjectSlug,
        subjectTitle: {
          en: practice.subjectTitle.en || 'Indian Polity',
          hi: practice.subjectTitle.hi || practice.subjectTitle.en || 'भारतीय राजनीति',
        },
        topicSlug: practice.topicSlug,
        topicTitle: {
          en: practice.topicTitle.en || 'Topic 2',
          hi: practice.topicTitle.hi || practice.topicTitle.en || 'विषय 2',
        },
        subtopicTitle: {
          en: practice.subtopicTitle.en || 'Sources of the Indian Constitution',
          hi: practice.subtopicTitle.hi || practice.subtopicTitle.en || 'भारतीय संविधान के स्रोत',
        },
      }}
    />
  );
}
