import Link from 'next/link';
import { ArrowRight, BookOpen, LockKeyhole } from 'lucide-react';

const AVAILABLE_EXAMS = [
  {
    code: 'SSC_CGL',
    label: 'SSC CGL',
    href: '/exams/ssc-cgl',
    description: 'Explore all seven subjects, then continue through topics, subtopics and practice questions.',
  },
  {
    code: 'SSC_CHSL',
    label: 'SSC CHSL',
    href: '/exams/ssc-combined-higher-secondary-level-examination',
    description: 'Explore the complete syllabus and start Reasoning practice with verified bilingual MCQs.',
  },
] as const;

const UPCOMING_EXAMS = [
  {
    code: 'SSC_MTS',
    label: 'SSC MTS',
    description: 'Focused practice for Reasoning, Quant, English and General Awareness.',
  },
  {
    code: 'SSC_GD_CONSTABLE',
    label: 'SSC GD Constable',
    description: 'CBT syllabus, topic-wise practice and question sets are being prepared.',
  },
] as const;

export default function PublicExamExplorer() {
  return (
    <section
      id="public-exam-explorer"
      aria-labelledby="public-exam-explorer-heading"
      className="w-full max-w-full overflow-x-clip border-b border-[#E4E7EC] bg-white py-16 sm:py-20 max-[479px]:py-10"
    >
      <div className="home-container w-full min-w-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#6D28D9] sm:text-sm">
            Available &amp; upcoming exams
          </p>
          <h2
            id="public-exam-explorer-heading"
            className="mt-2 break-words text-[32px] font-bold leading-tight tracking-[-0.02em] text-[#18181B] sm:text-[42px] max-[479px]:text-[27px]"
          >
            Choose Your SSC Exam
          </h2>
          <p className="mt-3 break-words text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            Open SSC CGL or SSC CHSL to explore the published syllabus and available practice questions.
          </p>
        </div>

        <div className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AVAILABLE_EXAMS.map((exam) => (
            <Link
              key={exam.code}
              href={exam.href}
              className="group flex min-h-52 w-full min-w-0 max-w-full flex-col rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_12px_32px_rgba(76,29,149,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 sm:p-6"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white shadow-sm">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Available
                </span>
              </span>
              <h3 className="mt-5 break-words text-lg font-bold text-slate-900">{exam.label}</h3>
              <p className="mt-1.5 break-words text-sm leading-6 text-slate-600">
                {exam.description}
              </p>
              <span className="mt-auto inline-flex min-h-10 items-center gap-2 pt-5 text-sm font-bold text-violet-700">
                View subjects
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}

          {UPCOMING_EXAMS.map((exam) => (
            <div
              key={exam.code}
              aria-disabled="true"
              className="flex min-h-52 w-full min-w-0 max-w-full cursor-not-allowed flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-90 sm:p-6"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  Upcoming Exam
                </span>
              </span>
              <h3 className="mt-5 break-words text-lg font-bold text-slate-800">{exam.label}</h3>
              <p className="mt-1.5 break-words text-sm leading-6 text-slate-600">{exam.description}</p>
              <span className="mt-auto inline-flex min-h-10 items-center gap-2 pt-5 text-sm font-semibold text-slate-500">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Locked · Coming soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
