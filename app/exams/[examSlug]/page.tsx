import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ExamSubjectsGrid from '@/app/subjects/ExamSubjectsGrid';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { getLocalizedText } from '@/lib/localizedText';
import { getPublicExamSyllabus } from '@/lib/publicExamExplorer';
import { buildConciseTitle, buildPageMetadata } from '@/lib/seo';
import SyllabusBreadcrumb from './SyllabusBreadcrumb';

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
  const snapshot = await getPublicExamSyllabus(examSlug, stageCode);
  if (!snapshot) return { title: 'Exam syllabus not found', robots: { index: false, follow: true } };
  const examName = snapshot.exam.code.replaceAll('_', ' ');
  return buildPageMetadata({
    title: buildConciseTitle(`${examName} Syllabus, Subjects and Topics`),
    description: `Explore the complete published ${examName} syllabus by subject, topic and subtopic.`,
    path: `/exams/${examSlug}`,
  });
}

export default async function PublicExamPage({ params, searchParams }: PageProps) {
  const { examSlug } = await params;
  const stageCode = selectedStage((await searchParams).stage);
  const snapshot = await getPublicExamSyllabus(examSlug, stageCode);
  if (!snapshot) notFound();
  const examName = getLocalizedText(snapshot.exam.title, 'en') || snapshot.exam.code.replaceAll('_', ' ');
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: `${examName} syllabus` },
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={buildBreadcrumbListSchema([
        { name: 'Home', href: '/' },
        { name: `${examName} syllabus` },
      ])} />
      <div className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 lg:px-8">
        <SyllabusBreadcrumb items={breadcrumbItems} />
      </div>
      <ExamSubjectsGrid snapshot={snapshot} publicExamHref={`/exams/${examSlug}`} stageCode={stageCode} />
    </main>
  );
}
