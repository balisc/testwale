import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FileQuestion, Layers3 } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import {
  findPublishedSyllabusSubject,
  findPublishedSyllabusTopic,
} from '@/lib/examSyllabus';
import { withExamStageQuery } from '@/lib/examPreference';
import { getLocalizedText } from '@/lib/localizedText';
import { getPublicExamSyllabus } from '@/lib/publicExamExplorer';
import { buildConciseTitle, buildPageMetadata } from '@/lib/seo';
import SyllabusBreadcrumb from '../../SyllabusBreadcrumb';

type PageProps = {
  params: Promise<{ examSlug: string; subjectSlug: string; topicSlug: string }>;
  searchParams: Promise<{ stage?: string | string[] }>;
};

function selectedStage(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { examSlug, subjectSlug, topicSlug } = await params;
  const snapshot = await getPublicExamSyllabus(examSlug, selectedStage((await searchParams).stage));
  const subject = snapshot ? findPublishedSyllabusSubject(snapshot.subjects, subjectSlug) : null;
  const topic = subject && snapshot
    ? findPublishedSyllabusTopic(snapshot.topics, subject.id, topicSlug)
    : null;
  if (!snapshot || !subject || !topic) return { title: 'Topic not found', robots: { index: false, follow: true } };
  const examName = snapshot.exam.code.replaceAll('_', ' ');
  const subjectName = getLocalizedText(subject.title, 'en') || subject.slug;
  const topicName = getLocalizedText(topic.title, 'en') || topic.slug;
  const scope = getLocalizedText(topic.scope, 'en');
  return buildPageMetadata({
    title: buildConciseTitle(topicName, `${examName} Syllabus`),
    description: scope || `Browse ${topicName} subtopics under ${subjectName} in the published ${examName} syllabus.`,
    path: `/exams/${examSlug}/${subject.slug}/${topic.slug}`,
  });
}

export default async function PublicExamTopicPage({ params, searchParams }: PageProps) {
  const { examSlug, subjectSlug, topicSlug } = await params;
  const stageCode = selectedStage((await searchParams).stage);
  const snapshot = await getPublicExamSyllabus(examSlug, stageCode);
  if (!snapshot) notFound();
  const subject = findPublishedSyllabusSubject(snapshot.subjects, subjectSlug);
  if (!subject) notFound();
  const topic = findPublishedSyllabusTopic(snapshot.topics, subject.id, topicSlug);
  if (!topic) notFound();

  const examHref = withExamStageQuery(`/exams/${examSlug}`, stageCode);
  const subjectHref = withExamStageQuery(`/exams/${examSlug}/${subject.slug}`, stageCode);
  const topicHref = withExamStageQuery(`/exams/${examSlug}/${subject.slug}/${topic.slug}`, stageCode);
  const subtopics = snapshot.subtopics.filter((subtopic) => subtopic.topic_id === topic.id);
  const examName = snapshot.exam.code.replaceAll('_', ' ');
  const subjectName = getLocalizedText(subject.title, 'en') || subject.slug;
  const topicName = getLocalizedText(topic.title, 'en') || topic.slug;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <JsonLd data={buildBreadcrumbListSchema([
        { name: 'Home', href: '/' },
        { name: examName, href: `/exams/${examSlug}` },
        { name: subjectName, href: `/exams/${examSlug}/${subject.slug}` },
        { name: topicName },
      ])} />
      <div className="mx-auto max-w-[1100px]">
        <SyllabusBreadcrumb items={[
          { label: 'Home', href: '/' },
          { label: examName, href: examHref },
          { label: subjectName, href: subjectHref },
          { label: topicName },
        ]} />
        <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-6 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">{subjectName}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{topicName}</h1>
          {topic.scope ? <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base"><strong className="text-slate-800">Scope: </strong>{getLocalizedText(topic.scope, 'en')}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <span className="rounded-xl border border-violet-100 bg-white px-4 py-2">{subtopics.length} subtopics</span>
            <span className="rounded-xl border border-violet-100 bg-white px-4 py-2">{topic.question_count} available questions</span>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="public-subtopics-heading">
          <h2 id="public-subtopics-heading" className="text-2xl font-bold">Subtopics</h2>
          <p className="mt-2 text-sm text-slate-600">Open any subtopic. Questions appear automatically wherever content is mapped.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {subtopics.map((subtopic) => {
              const name = getLocalizedText(subtopic.title, 'en') || subtopic.slug;
              const hasQuestions = Boolean(subtopic.content_id && subtopic.question_count > 0);
              return (
                <Link
                  key={subtopic.id}
                  href={withExamStageQuery(`/exams/${examSlug}/${subject.slug}/${topic.slug}/${subtopic.slug}`, stageCode)}
                  className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Layers3 className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">{name}</span>
                    <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${hasQuestions ? 'text-violet-700' : 'text-slate-500'}`}>
                      <FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />
                      {hasQuestions ? `${subtopic.question_count} questions — start practice` : 'Questions coming soon'}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-700" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
