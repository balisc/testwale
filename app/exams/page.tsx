import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpenCheck, FileQuestion, ListTree } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { buildBreadcrumbListSchema } from '@/lib/breadcrumbSchema';
import { getPublicExamDirectory } from '@/lib/publicExamDirectoryServer';
import { buildPageMetadata } from '@/lib/seo';
import SyllabusBreadcrumb from './[examSlug]/SyllabusBreadcrumb';

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: 'SSC Exams, Syllabus & Mock Tests',
  description: 'Explore SSC CGL, SSC CHSL and other competitive exams. Practice bilingual questions, view exam-wise syllabus coverage and attempt full-length mock tests on QuestionWale.',
  path: '/exams',
});

export default async function ExamsIndexPage() {
  const exams = await getPublicExamDirectory();

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <JsonLd data={buildBreadcrumbListSchema([
        { name: 'Home', href: '/' },
        { name: 'Exams', href: '/exams' },
      ])} />
      <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <SyllabusBreadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Exams' },
        ]} />

        <header className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-[#FAF5FF] to-[#F5F3FF] px-6 py-10 shadow-sm sm:px-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9] max-[479px]:text-[10px] max-[479px]:tracking-wide">
            Published exam preparation
          </p>
          <h1 className="mt-3 max-w-4xl text-[32px] font-bold leading-tight tracking-[-0.02em] text-[#18181B] sm:text-[42px] max-[479px]:text-[27px]">
            Competitive Exams and Mock Tests
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            Browse each exam&apos;s current published syllabus, available subjects and practice
            coverage. Full-length mock tests are shown only after their production blueprint and
            verified inventory are ready.
          </p>
        </header>

        <section className="mt-10" aria-labelledby="published-exams-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="published-exams-heading" className="text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
                Published exams
              </h2>
              <p className="mt-2 text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
                Counts reflect QuestionWale&apos;s active exam-scoped catalogue, not an official
                notification total.
              </p>
            </div>
            {exams.length > 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                {exams.length} {exams.length === 1 ? 'exam' : 'exams'} available
              </p>
            ) : null}
          </div>

          {exams.length > 0 ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {exams.map((exam) => (
                <article
                  key={exam.code}
                  className="flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-7"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6D28D9]">
                        {exam.shortName}
                      </p>
                      <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-[#18181B] max-[479px]:text-lg">
                        <Link
                          href={exam.canonicalPath}
                          className="rounded-sm hover:text-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2"
                        >
                          {exam.publicTitle.en}
                        </Link>
                      </h3>
                      {exam.publicTitle.hi ? (
                        <p lang="hi" className="mt-2 break-words text-sm leading-6 text-[#667085]">
                          {exam.publicTitle.hi}
                        </p>
                      ) : null}
                    </div>
                    {exam.mockAvailable ? (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                        Mock Available
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700">
                        Syllabus &amp; Practice
                      </span>
                    )}
                  </div>

                  <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                        <BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Subjects
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-[#18181B]">{exam.subjectCount}</dd>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <dt className="flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                        <ListTree className="h-4 w-4" aria-hidden="true" /> Topics
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-[#18181B]">{exam.topicCount}</dd>
                    </div>
                    <div className="col-span-2 rounded-2xl bg-slate-50 p-3 sm:col-span-1">
                      <dt className="flex items-center gap-1.5 text-xs font-medium text-[#667085]">
                        <FileQuestion className="h-4 w-4" aria-hidden="true" /> Questions
                      </dt>
                      <dd className="mt-1 text-lg font-bold text-[#18181B]">
                        {exam.verifiedQuestionCount.toLocaleString('en-IN')}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-5 text-[14px] leading-[22px] text-[#667085] max-[479px]:text-[13px] max-[479px]:leading-5">
                    Explore {exam.subjectCount} published subjects, {exam.topicCount} topics and{' '}
                    {exam.subtopicCount} subtopics mapped specifically to {exam.shortName}.
                  </p>

                  <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                    <Link
                      href={exam.canonicalPath}
                      aria-label={`Explore ${exam.shortName} syllabus and practice`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#6D28D9] px-5 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2 max-[479px]:text-sm"
                    >
                      Explore Exam <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    {exam.mockAvailable && exam.mockPath ? (
                      <Link
                        href={exam.mockPath}
                        aria-label={`Start ${exam.shortName} full mock test`}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-violet-200 px-5 text-[15px] font-semibold text-[#6D28D9] transition hover:bg-[#F5F3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2 max-[479px]:text-sm"
                      >
                        Start Mock Test
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm leading-6 text-slate-600 shadow-sm">
              The published exam directory is temporarily unavailable. You can still browse the{' '}
              <Link href="/subjects" className="font-semibold text-[#6D28D9] hover:underline">
                subject catalogue
              </Link>
              .
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
