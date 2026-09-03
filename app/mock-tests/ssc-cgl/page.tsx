import type { Metadata } from 'next';
import SscMockEntry from '@/components/mockTests/SscMockEntry';
import JsonLd from '@/components/JsonLd';
import SyllabusBreadcrumb from '@/app/exams/[examSlug]/SyllabusBreadcrumb';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { getPublicExamDirectory } from '@/lib/publicExamDirectoryServer';
import { buildPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const exam = (await getPublicExamDirectory()).find((entry) => entry.code === 'SSC_CGL');
  return buildPageMetadata({
    title: 'SSC CGL Tier 1 Full Mock Tests',
    description: 'Attempt a full-length SSC CGL Tier 1 mock test built from verified exam-scoped questions, with timed practice and performance analysis.',
    path: '/mock-tests/ssc-cgl',
    noIndex: !exam?.mockAvailable,
  });
}

export default async function SscCglMockLandingPage() {
  const exam = (await getPublicExamDirectory()).find((entry) => entry.code === 'SSC_CGL');
  const examPath = exam?.canonicalPath ?? '/exams/ssc-cgl';
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Exams', href: '/exams' },
    { name: exam?.shortName ?? 'SSC CGL', href: examPath },
    { name: 'Full mock tests', href: '/mock-tests/ssc-cgl' },
  ];
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <JsonLd data={buildBreadcrumbListSchema(breadcrumbs)} />
      <div className="mx-auto max-w-6xl">
        <SyllabusBreadcrumb items={breadcrumbs.map((item, index) => ({
          label: item.name,
          href: index === breadcrumbs.length - 1 ? undefined : item.href,
        }))} />
        <header className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9] max-[479px]:text-[10px] max-[479px]:tracking-wide">Exam simulation</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
            SSC CGL Tier 1 Full Mock Tests
          </h1>
          <p className="mt-3 text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            Review the current test pattern and verified-inventory status before generating a timed SSC CGL practice mock.
          </p>
        </header>
        <SscMockEntry examKey="ssc-cgl" />
      </div>
    </main>
  );
}
