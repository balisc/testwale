'use client';

import { Check, FileText, Plus } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import type { PublicMockExamSummary } from '@/lib/mockTests/showcase';

function ExamCard({
  exam,
  selected,
  onSelect,
  onKeyDown,
}: {
  exam: PublicMockExamSummary;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const available = exam.availability === 'available';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${exam.publicName} ${exam.tier}, ${available ? 'available' : 'coming soon'}`}
      data-exam-choice
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`relative flex min-h-[112px] w-full min-w-0 snap-start items-center gap-3 rounded-2xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
        selected
          ? 'border-violet-600 shadow-[0_10px_28px_-18px_rgba(109,40,217,0.65)]'
          : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
        <FileText className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[#18181B] sm:text-base">{exam.publicName}</span>
        <span className="mt-0.5 block text-xs font-medium text-slate-500">{exam.tier}</span>
        <span className="mt-1 block text-xs font-semibold text-slate-600">
          {exam.questionCount} Q <span aria-hidden="true">•</span> {exam.durationMinutes} min
        </span>
        <span className={`mt-1 block text-[10px] font-semibold uppercase tracking-wide ${available ? 'text-emerald-700' : 'text-amber-700'}`}>
          {available ? 'Available' : 'Coming Soon'}
        </span>
      </span>
      {selected ? (
        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-violet-700 text-white">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Selected</span>
        </span>
      ) : null}
    </button>
  );
}

function useRadioNavigation(exams: readonly PublicMockExamSummary[], selectExam: (exam: PublicMockExamSummary) => void) {
  return (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const choices = [...(event.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll<HTMLButtonElement>('[data-exam-choice]') ?? [])];
    const currentIndex = choices.indexOf(event.currentTarget);
    if (currentIndex < 0 || choices.length === 0) return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = choices.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % choices.length;
    else nextIndex = (currentIndex - 1 + choices.length) % choices.length;
    const nextExam = exams[nextIndex];
    if (nextExam) selectExam(nextExam);
    choices[nextIndex]?.focus();
  };
}

export default function ExamMockSelector({
  exams,
  selectedExam,
  onSelect,
}: {
  exams: readonly PublicMockExamSummary[];
  selectedExam: PublicMockExamSummary;
  onSelect: (exam: PublicMockExamSummary) => void;
}) {
  const mobileKeyDown = useRadioNavigation(exams, onSelect);
  const directDesktopExams = exams.length > 3 ? exams.slice(0, 2) : exams.slice(0, 3);
  const moreDesktopExams = exams.length > 3 ? exams.slice(2) : [];
  const desktopKeyDown = useRadioNavigation(directDesktopExams, onSelect);

  return (
    <div>
      <p id="mock-exam-selector-label" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6D28D9]">
        Choose your exam
      </p>
      <div
        role="radiogroup"
        aria-labelledby="mock-exam-selector-label"
        className="no-scrollbar mt-4 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:hidden"
      >
        {exams.map((exam) => (
          <div key={exam.id} className="w-[84%] min-w-[250px] shrink-0 max-[359px]:min-w-[235px]">
            <ExamCard exam={exam} selected={exam.id === selectedExam.id} onSelect={() => onSelect(exam)} onKeyDown={mobileKeyDown} />
          </div>
        ))}
      </div>

      <div className={`mt-4 hidden gap-3 md:grid ${moreDesktopExams.length > 0 ? 'md:grid-cols-3' : directDesktopExams.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        <div role="radiogroup" aria-labelledby="mock-exam-selector-label" className="contents">
          {directDesktopExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} selected={exam.id === selectedExam.id} onSelect={() => onSelect(exam)} onKeyDown={desktopKeyDown} />
          ))}
        </div>
        {moreDesktopExams.length > 0 ? (
          <label className="flex min-h-[112px] cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 focus-within:border-violet-600 focus-within:ring-2 focus-within:ring-violet-100">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Plus className="h-6 w-6" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#18181B]">+ More Exams</span>
              <select
                aria-label="Choose from more mock-test exams"
                value={moreDesktopExams.some((exam) => exam.id === selectedExam.id) ? selectedExam.id : ''}
                onChange={(event) => {
                  const exam = moreDesktopExams.find((candidate) => candidate.id === event.target.value);
                  if (exam) onSelect(exam);
                }}
                className="mt-1 min-h-11 w-full bg-transparent text-xs font-semibold text-slate-600 outline-none"
              >
                <option value="" disabled>Select an exam</option>
                {moreDesktopExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.publicName} · {exam.tier}</option>)}
              </select>
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}
