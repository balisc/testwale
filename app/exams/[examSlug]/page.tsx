import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ExamSubjectsGrid from '@/app/subjects/ExamSubjectsGrid';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { getLocalizedText } from '@/lib/localizedText';
import { getPublicExamSyllabusStrict } from '@/lib/publicExamExplorer';
import { publicExamCanonicalPath } from '@/lib/publicExamDirectory';
import { absoluteUrl, buildConciseTitle, buildPageMetadata } from '@/lib/seo';
import SyllabusBreadcrumb from './SyllabusBreadcrumb';
import SscMockEntry from '@/components/mockTests/SscMockEntry';

type PageProps = {
  params: Promise<{ examSlug: string }>;
  searchParams: Promise<{ stage?: string | string[] }>;
};

function selectedStage(value: string | string[] | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export const revalidate = 300;

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { examSlug } = await params;
  const stageCode = selectedStage((await searchParams).stage);
  const snapshot = await getPublicExamSyllabusStrict(examSlug, stageCode);
  if (!snapshot || snapshot.subjects.length === 0 || snapshot.topics.length === 0) {
    notFound();
  }
  const examName = getLocalizedText(snapshot.exam.title, 'en') || snapshot.exam.code.replaceAll('_', ' ');
  const canonicalPath = publicExamCanonicalPath(snapshot.exam.code, examSlug) ?? `/exams/${examSlug}`;
  return buildPageMetadata({
    title: buildConciseTitle(`${examName} Syllabus & MCQ Practice`),
    description: `Explore the published ${examName} syllabus by subject, topic and subtopic, with accurate available-question counts and focused MCQ practice.`,
    path: canonicalPath,
  });
}

export default async function PublicExamPage({ params, searchParams }: PageProps) {
  const { examSlug } = await params;
  const stageCode = selectedStage((await searchParams).stage);
  const snapshot = await getPublicExamSyllabusStrict(examSlug, stageCode);
  if (!snapshot || snapshot.subjects.length === 0 || snapshot.topics.length === 0) notFound();
  const examName = getLocalizedText(snapshot.exam.title, 'en') || snapshot.exam.code.replaceAll('_', ' ');
  const canonicalPath = publicExamCanonicalPath(snapshot.exam.code, examSlug) ?? `/exams/${examSlug}`;
  const questionCount = Math.max(0, Number(snapshot.overview.total_questions ?? 0));
  const subjectCount = snapshot.subjects.length;
  const topicCount = snapshot.topics.length;
  const subtopicCount = snapshot.subtopics.length;
  const stageLabel = stageCode ? stageCode.replaceAll('_', ' ') : null;
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Exams', href: '/exams' },
    { label: `${examName} syllabus` },
  ];

  const breadcrumbSchema = buildBreadcrumbListSchema([
    { name: 'Home', href: '/' },
    { name: 'Exams', href: '/exams' },
    { name: `${examName} syllabus`, href: canonicalPath },
  ]);
  const subjectItemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${examName} published subjects`,
    numberOfItems: subjectCount,
    itemListElement: snapshot.subjects.map((subject, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: getLocalizedText(subject.title, 'en') || subject.slug,
      url: absoluteUrl(`${canonicalPath}/${subject.slug}`),
    })),
  };
  const learningResource = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: `${examName} syllabus and MCQ practice`,
    description: `Published ${examName} subjects, topics and subtopics with available MCQ practice.`,
    url: absoluteUrl(canonicalPath),
    inLanguage: ['en', 'hi'],
    educationalUse: 'Practice and exam preparation',
    learningResourceType: 'Syllabus directory and practice questions',
    provider: {
      '@type': 'Organization',
      name: 'QuestionWale',
      url: absoluteUrl('/'),
    },
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={[breadcrumbSchema, subjectItemList, learningResource]} />
      <div className="mx-auto max-w-[1240px] px-4 pb-2 pt-8 sm:px-6 lg:px-8">
        <SyllabusBreadcrumb items={breadcrumbItems} />
        <header className="mt-8 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6D28D9]">
            Published exam coverage
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            {examName} Syllabus &amp; MCQ Practice
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            Explore QuestionWale&apos;s current published {examName} coverage by subject, topic and
            subtopic. Available-question totals below come from the same exam-scoped catalog used
            by the practice experience.
          </p>
          {stageLabel ? (
            <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-slate-700">
              Showing the <strong>{stageLabel}</strong> filter. This view canonically belongs to the
              consolidated exam page.{' '}
              <Link href={canonicalPath} className="font-semibold text-[#6D28D9] hover:underline">
                View all published stages
              </Link>
              .
            </p>
          ) : null}
          <dl className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Published subjects', subjectCount],
              ['Published topics', topicCount],
              ['Published subtopics', subtopicCount],
              ['Available questions', questionCount],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <dt className="text-xs font-medium text-slate-500">{label}</dt>
                <dd className="mt-1 text-2xl font-extrabold text-slate-950">
                  {Number(value).toLocaleString('en-IN')}
                </dd>
              </div>
            ))}
          </dl>
        </header>
      </div>
      {snapshot.exam.code === 'SSC_CGL' ? (
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <SscMockEntry examKey="ssc-cgl" compact />
        </div>
      ) : null}
      {snapshot.exam.code === 'SSC_CHSL' ? (
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <SscMockEntry examKey="ssc-chsl" compact />
        </div>
      ) : null}
      <section aria-labelledby="published-subjects-heading">
        <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6 lg:px-8">
          <h2 id="published-subjects-heading" className="text-2xl font-bold text-slate-950">
            Published subjects and coverage
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Choose a subject to browse its published topic and subtopic hierarchy. Practice links
            appear only where questions are currently available.
          </p>
        </div>
        <ExamSubjectsGrid
          snapshot={snapshot}
          publicExamHref={canonicalPath}
          stageCode={stageCode}
          showHeader={false}
        />
      </section>
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-950">Coverage and review information</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This directory reflects the published syllabus version configured for {examName} in
            QuestionWale. Counts can change as mapped questions are published or reviewed; they do
            not imply an official total for the examination.
          </p>
          <Link href="/content-standards" className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#6D28D9] hover:underline">
            Read our content standards
          </Link>
        </div>
      </section>
    </main>
  );
}
