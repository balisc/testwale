'use client';

import { ArrowRight, Compass } from 'lucide-react';
import TargetExamSelector from '@/components/TargetExamSelector';
import { useLanguage } from '@/lib/LanguageContext';
import type { Exam } from '@/types/polity';
import type { PolityRankedExamOption } from '@/types/polityExamRankingV2';

type PracticePathBuilderProps = {
  subjectSlug: string;
  exams: Exam[];
  rankedExams?: PolityRankedExamOption[];
  selectedExam: string | null;
};

const COPY = {
  en: {
    title: 'Not sure where to begin?',
    sub: 'Select your exam and get a recommended topic order.',
    build: 'Build Practice Path',
  },
  hi: {
    title: 'कहाँ से शुरू करें, पता नहीं?',
    sub: 'अपनी परीक्षा चुनें और अनुशंसित विषय क्रम पाएँ।',
    build: 'अभ्यास पथ बनाएँ',
  },
};

export default function PracticePathBuilder({
  subjectSlug,
  exams,
  rankedExams,
  selectedExam,
}: PracticePathBuilderProps) {
  const { language } = useLanguage();
  const c = COPY[language];

  const handleBuildPath = () => {
    const target = document.getElementById('subject-topics');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative z-10 mt-10 overflow-visible rounded-3xl border border-[#EDE9FE] bg-gradient-to-r from-[#FAF5FF] to-[#F5F3FF] px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex min-w-0 items-start gap-4 sm:items-center lg:flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]">
            <Compass className="h-7 w-7 text-brand sm:h-8 sm:w-8 lg:h-9 lg:w-9" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 sm:text-lg lg:text-xl">{c.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.sub}</p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 min-[480px]:flex-row min-[480px]:items-end lg:w-auto lg:max-w-[min(100%,28rem)] lg:shrink-0">
          <div className="min-w-0 flex-1">
            <TargetExamSelector
              subjectSlug={subjectSlug}
              exams={exams}
              rankedExams={rankedExams}
              selectedExam={selectedExam}
              className="mt-0 sm:max-w-none"
            />
          </div>
          <button
            type="button"
            onClick={handleBuildPath}
            className="inline-flex h-[3.375rem] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.28)] transition hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 min-[480px]:w-auto sm:whitespace-nowrap"
          >
            {c.build}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
