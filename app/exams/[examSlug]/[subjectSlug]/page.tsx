import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ChevronRight, FileQuestion, ListTree } from 'lucide-react';
import IconByKey from '@/components/IconByKey';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { findPublishedSyllabusSubject } from '@/lib/examSyllabus';
import { withExamStageQuery } from '@/lib/examPreference';
import { getLocalizedText } from '@/lib/localizedText';
import { getPublicExamSyllabusStrict } from '@/lib/publicExamExplorer';
import { buildConciseTitle, buildPageMetadata } from '@/lib/seo';
import SyllabusBreadcrumb from '../SyllabusBreadcrumb';

type PageProps = {
  params: Promise<{ examSlug: string; subjectSlug: string }>;
  searchParams: Promise<{ stage?: string | string[] }>;
};

function selectedStage(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { examSlug, subjectSlug } = await params;
  const snapshot = await getPublicExamSyllabusStrict(examSlug, selectedStage((await searchParams).stage));
  const subject = snapshot
    ? findPublishedSyllabusSubject(snapshot.subjects, subjectSlug)
    : null;
  if (!snapshot || !subject) notFound();
  const subjectName = getLocalizedText(subject.title, 'en') || subject.slug;
  const examName = snapshot.exam.code.replaceAll('_', ' ');
  const storedDescription = getLocalizedText(subject.description, 'en');
  const description = storedDescription
    ? `${subjectName} in the published ${examName} syllabus: ${storedDescription}`
    : `Browse ${subjectName} topics and subtopics in the published ${examName} syllabus.`;
  return buildPageMetadata({
    title: buildConciseTitle(subjectName, `${examName} Syllabus`),
    description,
    path: `/exams/${examSlug}/${subject.slug}`,
  });
}

export default async function PublicExamSubjectPage({ params, searchParams }: PageProps) {
  const { examSlug, subjectSlug } = await params;
  const stageCode = selectedStage((await searchParams).stage);
  const snapshot = await getPublicExamSyllabusStrict(examSlug, stageCode);
  if (!snapshot) notFound();
  const subject = findPublishedSyllabusSubject(snapshot.subjects, subjectSlug);
  if (!subject) notFound();

  const examHref = withExamStageQuery(`/exams/${examSlug}`, stageCode);
  const subjectHref = withExamStageQuery(`/exams/${examSlug}/${subject.slug}`, stageCode);
  const topics = snapshot.topics.filter((topic) => topic.subject_id === subject.id);
  const examName = snapshot.exam.code.replaceAll('_', ' ');
  const subjectName = getLocalizedText(subject.title, 'en') || subject.slug;

  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <JsonLd data={buildBreadcrumbListSchema([
        { name: 'Home', href: '/' },
        { name: 'Exams', href: '/exams' },
        { name: `${examName} syllabus`, href: `/exams/${examSlug}` },
        { name: subjectName },
      ])} />
      <div className="mx-auto max-w-[1240px]">
        <SyllabusBreadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Exams', href: '/exams' },
          { label: `${examName} syllabus`, href: examHref },
          { label: subjectName },
        ]} />

        <section className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-[#FAF5FF] to-[#F5F3FF] p-6 shadow-sm sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <IconByKey iconKey={subject.icon_key} className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-700">{examName} subject</p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{subjectName}</h1>
                {subject.description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{getLocalizedText(subject.description, 'en')}</p> : null}
              </div>
            </div>
            <div className="flex shrink-0 gap-3 text-sm font-semibold text-slate-600">
              <span className="rounded-xl border border-violet-100 bg-white px-4 py-2">{topics.length} topics</span>
              <span className="rounded-xl border border-violet-100 bg-white px-4 py-2">{subject.subtopic_count} subtopics</span>
            </div>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="public-topics-heading">
          <h2 id="public-topics-heading" className="text-2xl font-bold">Topics in {subjectName}</h2>
          <p className="mt-2 text-sm text-slate-600">Choose a topic to see its published subtopics and available questions.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {topics.map((topic) => {
              const topicName = getLocalizedText(topic.title, 'en') || topic.slug;
              return (
                <Link
                  key={topic.id}
                  href={withExamStageQuery(`/exams/${examSlug}/${subject.slug}/${topic.slug}`, stageCode)}
                  className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ListTree className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-900">{topicName}</span>
                    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />{topic.subtopic_count} subtopics</span>
                      {topic.question_count > 0 ? <span className="inline-flex items-center gap-1 text-violet-700"><FileQuestion className="h-3.5 w-3.5" aria-hidden="true" />{topic.question_count} questions</span> : <span>Questions coming soon</span>}
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
