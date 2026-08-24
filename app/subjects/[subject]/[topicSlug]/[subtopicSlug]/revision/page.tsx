import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import RevisionPageView from '@/components/revision/RevisionPageView';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { requireSubtopicByRouteSlugs, loadSubtopicByRouteSlugs, NOT_FOUND_METADATA } from '@/lib/catalogRouteGuards';
import { getLocalizedText } from '@/lib/localizedText';
import {
  getQuestionsBySubtopic,
  getSubtopicsByTopic,
} from '@/lib/polity';
import { mergeOfficialSources } from '@/lib/revision/mergeOfficialSources';
import {
  getPublishedRevision,
  getRevisionDocument,
  isRevisionPublished,
  publishedRevisionPath,
} from '@/lib/revision/registry';
import { isRichRevision, normalizeRichRevisionSlug } from '@/lib/revision/richRevision';
import { loadRichRevisionClient } from '@/lib/revision/richRevisionClients';
import type { RelatedRevisionLink } from '@/lib/revision/types';
import { absoluteUrl, buildCatalogRevisionMetadata, buildPageMetadata } from '@/lib/seo';
import { getSelectedExamLearning } from '@/lib/examLearningServer';
import ExamContentUnavailable from '@/components/ExamContentUnavailable';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import {
  findPublishedSyllabusSubject,
  findPublishedSyllabusSubtopic,
  findPublishedSyllabusTopic,
} from '@/lib/examSyllabus';
import { isSscCglExamCode } from '@/lib/sscCglSyllabus';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ subject: string; topicSlug: string; subtopicSlug: string }>;
  searchParams: Promise<{ exam?: string | string[] }>;
};

function resolveExamParam(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

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
  const row = await loadSubtopicByRouteSlugs(routeSubject, topicSlug, subtopicSlug);
  if (!row) return NOT_FOUND_METADATA;
  const { subjectSlug } = row;
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

export default async function SubtopicRevisionPage({ params, searchParams }: PageProps) {
  const { subject: routeSubject, topicSlug, subtopicSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const examParam = resolveExamParam(resolvedSearchParams.exam);

  const selected = await getSelectedExamLearning();
  if (selected.status === 'incomplete') redirect(`/onboarding?returnTo=${encodeURIComponent(`/subjects/${routeSubject}/${topicSlug}/${subtopicSlug}/revision`)}`);
  if (selected.status === 'inactive') return <ExamContentUnavailable reason="inactive_exam" />;
  if (selected.status === 'error') return <ExamContentUnavailable reason="error" />;
  if (selected.status === 'ready') {
    if (isSscCglExamCode(selected.snapshot.exam.code)) redirect('/ssc-cgl');
    const scopedSubject = findPublishedSyllabusSubject(selected.snapshot.subjects, routeSubject);
    if (!scopedSubject) notFound();
    const scopedTopic = findPublishedSyllabusTopic(selected.snapshot.topics, scopedSubject.id, topicSlug);
    if (!scopedTopic) notFound();
    const scopedSubtopic = findPublishedSyllabusSubtopic(
      selected.snapshot.subtopics,
      scopedTopic.id,
      subtopicSlug,
    );
    if (!scopedSubtopic) notFound();
    const examSuffix = `?exam=${encodeURIComponent(selected.snapshot.exam.code)}`;
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <UnpublishedRevisionNotice
          subjectHref={`/subjects/${scopedSubject.slug}${examSuffix}`}
          topicHref={`/subjects/${scopedSubject.slug}/${scopedTopic.slug}${examSuffix}`}
          practiceHref={`/subjects/${scopedSubject.slug}/${scopedTopic.slug}/practice/${scopedSubtopic.slug}${examSuffix}`}
          subtopicTitle={getLocalizedText(scopedSubtopic.title, 'en') || scopedSubtopic.slug}
        />
      </div>
    );
  }

  const { subject, subjectSlug, topic, subtopic } = await requireSubtopicByRouteSlugs(
    routeSubject,
    topicSlug,
    subtopicSlug,
  );

  const subjectTitle = subject.title;
  const topicTitle = topic.title;
  const subtopicTitle = subtopic.title;
  const subjectTitleEn = getLocalizedText(subject.title, 'en');
  const topicTitleEn = getLocalizedText(topic.title, 'en');
  const subtopicTitleEn = getLocalizedText(subtopic.title, 'en');
  const effectiveExam = examParam;
  const examSuffix = effectiveExam ? `?exam=${encodeURIComponent(effectiveExam)}` : '';
  const subjectHref = `/subjects/${subjectSlug}${examSuffix}`;
  const topicHref = `/subjects/${subjectSlug}/${topicSlug}${examSuffix}`;
  const practiceHref = `/subjects/${subjectSlug}/${topicSlug}/practice/${subtopicSlug}${examSuffix}`;

  const doc = getPublishedRevision(subjectSlug, topicSlug, subtopicSlug);
  if (!doc) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
        <UnpublishedRevisionNotice
          subjectHref={subjectHref}
          topicHref={topicHref}
          practiceHref={practiceHref}
          subtopicTitle={subtopicTitleEn || subtopicSlug}
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
      href: `/subjects/${subjectSlug}/${topicSlug}/${sibling.slug}/revision${examSuffix}`,
      title: `Revise ${getLocalizedText(sibling.title, 'en')}`,
      kind: 'revision',
    });
  }
  related.push({
    href: topicHref,
    title: `All subtopics in ${topicTitleEn}`,
    kind: 'topic',
  });
  related.push({
    href: practiceHref,
    title: `Practice MCQs for ${subtopicTitleEn}`,
    kind: 'practice',
  });

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: subjectTitleEn, href: subjectHref },
    { name: topicTitleEn, href: topicHref },
    { name: `${subtopicTitleEn} revision` },
  ]);

  const learningSchema = buildLearningResourceSchema({
    title: doc.seo.title,
    description: doc.seo.description,
    path,
    topicTitle: subtopicTitleEn,
    dateModified: doc.lastReviewed,
  });

  const useRich = isRichRevision(subtopicSlug);
  const richSlug = normalizeRichRevisionSlug(subtopicSlug);
  const jsonLd: Record<string, unknown>[] = [breadcrumbSchema, learningSchema];

  const RichClient = useRich && richSlug ? await loadRichRevisionClient(richSlug) : null;

  const revisionSiblings = siblings.filter((s) => s.slug !== subtopicSlug);
  const currentIndex = siblings.findIndex((s) => s.slug === subtopicSlug);
  const prevSibling = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextSibling = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
  const siblingNav = {
    prev: prevSibling && isRevisionPublished(subjectSlug, topicSlug, prevSibling.slug)
      ? {
          href: `/subjects/${subjectSlug}/${topicSlug}/${prevSibling.slug}/revision${examSuffix}`,
          title: getLocalizedText(prevSibling.title, 'en'),
        }
      : undefined,
    next: nextSibling && isRevisionPublished(subjectSlug, topicSlug, nextSibling.slug)
      ? {
          href: `/subjects/${subjectSlug}/${topicSlug}/${nextSibling.slug}/revision${examSuffix}`,
          title: getLocalizedText(nextSibling.title, 'en'),
        }
      : undefined,
  };

  // Security: never pass correct_option, explanations, user IDs, or service role data.
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={jsonLd} />
      {RichClient ? (
        <RichClient
          practiceHref={practiceHref}
          examQuery={effectiveExam}
          breadcrumb={{
            subjectHref,
            subjectTitle,
            topicHref,
            topicTitle,
            subtopicTitle,
          }}
          siblingNav={siblingNav}
        />
      ) : (
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
      )}
    </div>
  );
}
