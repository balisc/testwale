import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import RevisionPageView from '@/components/revision/RevisionPageView';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { getLocalizedText } from '@/lib/localizedText';
import {
  getQuestionsBySubtopic,
  getSubjectBySlug,
  getSubtopicBySlug,
  getSubtopicsByTopic,
  getTopicBySlug,
} from '@/lib/polity';
import { mergeOfficialSources } from '@/lib/revision/mergeOfficialSources';
import {
  getPublishedRevision,
  getRevisionDocument,
  isRevisionPublished,
  publishedRevisionPath,
} from '@/lib/revision/registry';
import type { RelatedRevisionLink } from '@/lib/revision/types';
import { absoluteUrl, buildCatalogRevisionMetadata, buildPageMetadata } from '@/lib/seo';
import { resolveSubjectSlug } from '@/lib/subjectRoutes';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ subject: string; topicSlug: string; subtopicSlug: string }>;
};

function buildLearningResourceSchema(options: {
  title: string;
  description: string;
  path: string;
  topicTitle: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: options.title,
    description: options.description,
    url: absoluteUrl(options.path),
    learningResourceType: 'Study guide',
    isAccessibleForFree: true,
    inLanguage: 'en',
    about: {
      '@type': 'Thing',
      name: options.topicTitle,
    },
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);
  const published = getPublishedRevision(subjectSlug, topicSlug, subtopicSlug);
  if (published) {
    return buildCatalogRevisionMetadata({
      title: published.seo.title,
      description: published.seo.description,
      path: publishedRevisionPath(published),
    });
  }

  // Unpublished / missing reviewed content: never index (same for all user agents).
  const draft = getRevisionDocument(subjectSlug, topicSlug, subtopicSlug);
  return buildPageMetadata({
    title: draft ? `${draft.title.en} — Coming soon` : 'Revision notes not published',
    description:
      'Reviewed revision notes for this subtopic are not published yet. Practice may still be available from the topic page.',
    path: `/subjects/${subjectSlug}/${topicSlug}/${subtopicSlug}/revision`,
    noIndex: true,
  });
}

function UnpublishedRevisionNotice({
  subjectHref,
  topicHref,
  practiceHref,
  subtopicTitle,
}: {
  subjectHref: string;
  topicHref: string;
  practiceHref: string;
  subtopicTitle: string;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Revision notes not published yet</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        QuestionWale only indexes substantial, reviewed revision pages. Notes for{' '}
        <span className="font-medium text-slate-800">{subtopicTitle}</span> will appear here once that
        content is ready. No thin placeholder content is published for search.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href={practiceHref}
          className="inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white"
        >
          Practice {subtopicTitle}
        </Link>
        <Link
          href={topicHref}
          className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Back to topic
        </Link>
        <Link href={subjectHref} className="inline-flex px-2 py-2.5 text-sm font-semibold text-brand">
          All topics
        </Link>
      </div>
    </div>
  );
}

export default async function SubtopicRevisionPage({ params }: PageProps) {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const subjectSlug = resolveSubjectSlug(routeSubject);

  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) notFound();

  const topic = await getTopicBySlug(subject.id, topicSlug);
  if (!topic) notFound();

  const subtopic = await getSubtopicBySlug(topic.id, subtopicSlug);
  if (!subtopic) notFound();

  const subjectTitle = getLocalizedText(subject.title, 'en');
  const topicTitle = getLocalizedText(topic.title, 'en');
  const subtopicTitle = getLocalizedText(subtopic.title, 'en');
  const subjectHref = `/subjects/${subjectSlug}`;
  const topicHref = `/subjects/${subjectSlug}/${topicSlug}`;
  const practiceHref = `/subjects/${subjectSlug}/${topicSlug}/${subtopicSlug}/practice`;

  const doc = getPublishedRevision(subjectSlug, topicSlug, subtopicSlug);
  if (!doc) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <UnpublishedRevisionNotice
          subjectHref={subjectHref}
          topicHref={topicHref}
          practiceHref={practiceHref}
          subtopicTitle={subtopicTitle || subtopicSlug}
        />
      </div>
    );
  }

  const siblings = await getSubtopicsByTopic({ topicId: topic.id });
  const questionRows = doc.includeQuestionBankSources
    ? await getQuestionsBySubtopic(subtopic.id)
    : [];

  const sources = mergeOfficialSources({
    curated: doc.officialSources,
    questionRows: questionRows.map((q) => ({
      source: q.source,
      source_metadata: q.source_metadata,
    })),
  });

  const path = publishedRevisionPath(doc);

  const related: RelatedRevisionLink[] = [];
  for (const sibling of siblings) {
    if (sibling.slug === subtopicSlug) continue;
    if (!isRevisionPublished(subjectSlug, topicSlug, sibling.slug)) continue;
    related.push({
      href: `/subjects/${subjectSlug}/${topicSlug}/${sibling.slug}/revision`,
      title: `Revise ${getLocalizedText(sibling.title, 'en')}`,
      kind: 'revision',
    });
  }
  related.push({
    href: topicHref,
    title: `All subtopics in ${topicTitle}`,
    kind: 'topic',
  });
  related.push({
    href: practiceHref,
    title: `Practice MCQs for ${subtopicTitle}`,
    kind: 'practice',
  });

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: subjectTitle, href: subjectHref },
    { name: topicTitle, href: topicHref },
    { name: `${subtopicTitle} revision` },
  ]);

  const learningSchema = buildLearningResourceSchema({
    title: doc.seo.title,
    description: doc.seo.description,
    path,
    topicTitle: subtopicTitle,
    dateModified: doc.lastReviewed,
  });

  // Security: never pass correct_option, explanations, user IDs, or service role data.
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={[breadcrumbSchema, learningSchema]} />
      <RevisionPageView
        doc={doc}
        breadcrumb={{
          subjectHref,
          subjectTitle,
          topicHref,
          topicTitle,
          subtopicTitle,
        }}
        practiceHref={practiceHref}
        sources={sources}
        related={related}
      />
    </div>
  );
}
