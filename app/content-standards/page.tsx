import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Content Standards & Review Process',
  description:
    'How QuestionWale publishes, reviews, sources, labels and corrects bilingual government-exam practice content.',
  path: '/content-standards',
});

const SECTIONS = [
  {
    title: 'Publication standard',
    body: 'QuestionWale publishes catalog questions to public practice only when they are active and marked verified in the content system. Draft, inactive and unverified catalog questions are excluded from public question queries and published counts.',
  },
  {
    title: 'Sources and explanations',
    body: 'A question may include a primary source, supporting references and an explanation. Source information is shown when it is stored and suitable for display. A verified status records an internal review state; it does not make QuestionWale an official examination authority.',
  },
  {
    title: 'Previous-year question labels',
    body: 'QuestionWale distinguishes ordinary practice questions from previous-year questions. PYQ exam or year metadata is used only when the repository contains an exact, reviewed previous-year attribution; practice questions are not relabelled as PYQs for search visibility.',
  },
  {
    title: 'Hindi and English content',
    body: 'The catalog supports paired English and Hindi fields. Review aims to preserve the same meaning across languages. If a translation or explanation is unclear, learners can report the question for review.',
  },
  {
    title: 'Syllabus and exam mappings',
    body: 'Exam directories are generated from published syllabus versions and active content mappings. Displayed counts are the questions currently available for that scope; they are not a claim about the official number of questions in an examination.',
  },
  {
    title: 'Corrections and updates',
    body: 'Learner reports are recorded for review. Content can be corrected, deactivated or remapped when evidence changes. Pages without useful published content are excluded from normal indexing rather than presented as complete study material.',
  },
] as const;

export default function ContentStandardsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 md:px-6 md:py-20">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">QuestionWale trust</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
          Content Standards &amp; Review Process
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-600">
          QuestionWale is a bilingual MCQ practice platform for Indian government-exam aspirants.
          This page explains how public questions, sources, exam mappings and corrections are handled.
        </p>
        <p className="mt-3 text-sm text-slate-500">Last reviewed: 29 August 2026</p>
      </header>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-violet-100 bg-violet-50 p-6">
        <h2 className="text-lg font-bold text-slate-950">Report a content issue</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Include the question or page, the issue you found, and a reliable reference where possible.
          Do not send passwords or other sensitive information.
        </p>
        <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand hover:underline">
          Contact the content team
        </Link>
      </section>

      <p className="mt-8 text-sm leading-6 text-slate-500">
        QuestionWale is not a government website and is not affiliated with SSC, UPSC, Railway
        Recruitment Boards or another examination authority unless a page explicitly says otherwise.
        Always confirm notifications and rules with the responsible official body.
      </p>
    </main>
  );
}
