'use client';

import Link from 'next/link';
import type { Exam } from '@/types/polity';
import { normalizeExamCode } from '@/lib/examCode';
import { useCatalogText } from '@/lib/useCatalogText';

type ExamFilterPillsProps = {
  subjectSlug: string;
  exams: Exam[];
  selectedExam: string | null;
};

function buildHref(subjectSlug: string, examCode?: string | null) {
  if (!examCode || examCode.toUpperCase() === 'ALL') {
    return `/subjects/${subjectSlug}`;
  }
  return `/subjects/${subjectSlug}?exam=${encodeURIComponent(examCode)}`;
}

function ExamPillLabel({ exam }: { exam: Exam }) {
  return <>{useCatalogText(exam.title)}</>;
}

export default function ExamFilterPills({ subjectSlug, exams, selectedExam }: ExamFilterPillsProps) {
  const activeExam = selectedExam?.toUpperCase() === 'ALL' ? null : selectedExam;
  const isAllActive = !activeExam;
  const allExamsLabel = useCatalogText({ en: 'All Exams', hi: 'सभी परीक्षाएँ' });

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Link
        href={buildHref(subjectSlug)}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
          isAllActive
            ? 'bg-brand text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-[#DDD6FE] hover:text-brand'
        }`}
      >
        {allExamsLabel}
      </Link>
      {exams.map((exam) => {
        const isActive = activeExam != null && normalizeExamCode(activeExam) === normalizeExamCode(exam.code);
        return (
          <Link
            key={exam.id}
            href={buildHref(subjectSlug, exam.code)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              isActive
                ? 'bg-brand text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#DDD6FE] hover:text-brand'
            }`}
          >
            <ExamPillLabel exam={exam} />
          </Link>
        );
      })}
    </div>
  );
}
