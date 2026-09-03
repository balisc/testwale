import { BarChart3, Bookmark, Check, Clock3, Menu } from 'lucide-react';
import type { PublicMockExamSummary } from '@/lib/mockTests/showcase';

function compactSectionName(label: string) {
  if (/english/i.test(label)) return 'English';
  if (/reasoning|intelligence/i.test(label)) return 'Reasoning';
  if (/quantitative|math/i.test(label)) return 'Maths';
  if (/awareness/i.test(label)) return 'General Awareness';
  return label.replace(/\s*\([^)]*\)\s*/g, '').trim();
}

const OPTIONS = [
  { key: 'A', label: 'To keep a secret', selected: false },
  { key: 'B', label: 'To reveal a secret', selected: true },
  { key: 'C', label: 'To forget something', selected: false },
  { key: 'D', label: 'To delay intentionally', selected: false },
] as const;

const PALETTE = [
  { number: 31, state: 'answered' },
  { number: 32, state: 'answered' },
  { number: 33, state: 'review' },
  { number: 34, state: 'unanswered' },
  { number: 35, state: 'not-visited' },
  { number: 36, state: 'answered' },
  { number: 37, state: 'current' },
  { number: 38, state: 'unanswered' },
  { number: 39, state: 'unanswered' },
  { number: 40, state: 'not-visited' },
  { number: 41, state: 'not-visited' },
  { number: 42, state: 'unanswered' },
] as const;

function paletteTone(state: (typeof PALETTE)[number]['state']) {
  if (state === 'answered') return 'border-emerald-200 bg-emerald-100 text-emerald-800';
  if (state === 'review') return 'border-violet-500 bg-violet-600 text-white';
  if (state === 'current') return 'border-violet-600 bg-white text-violet-700 ring-2 ring-violet-100';
  if (state === 'unanswered') return 'border-slate-200 bg-slate-100 text-slate-800';
  return 'border-slate-300 bg-white text-slate-700';
}

export default function CBTPreviewCard({ exam }: { exam: PublicMockExamSummary }) {
  const sectionNames = exam.sectionNames.map(compactSectionName);
  return (
    <article
      aria-labelledby="mock-cbt-preview-title"
      className="relative mx-auto w-full max-w-[720px] pb-0 pt-2 sm:pb-16 lg:rotate-[0.7deg] lg:pb-12 motion-reduce:rotate-0"
    >
      <h3 id="mock-cbt-preview-title" className="sr-only">
        Promotional computer-based test preview for {exam.publicName} {exam.tier}
      </h3>
      <p className="sr-only">
        This is a visual sample only. It is not a live question, answer key, timer or user result.
      </p>

      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_rgba(49,46,129,0.32)]"
      >
        <div className="flex min-h-14 items-center gap-2 border-b border-slate-200 px-3 py-2.5 sm:px-5">
          <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-950 sm:text-sm">
            {exam.publicName} {exam.tier} <span className="hidden sm:inline">• Full Mock #07</span>
          </p>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">LIVE</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-800 sm:text-xs">
            <Clock3 className="h-3.5 w-3.5" /> 42:18
          </span>
          <span className="hidden text-xs font-bold text-slate-600 sm:inline">37 / {exam.questionCount}</span>
          <Menu className="h-4 w-4 text-slate-600" />
        </div>

        <div className="no-scrollbar flex min-h-11 gap-5 overflow-x-auto border-b border-slate-200 px-4 pt-1 sm:px-5">
          {sectionNames.map((section, index) => (
            <span
              key={section}
              className={`shrink-0 border-b-2 px-0.5 py-3 text-[10px] font-semibold sm:text-xs ${
                index === 0 ? 'border-violet-700 text-violet-700' : 'border-transparent text-slate-500'
              }`}
            >
              {section}
            </span>
          ))}
        </div>

        <div className="grid md:grid-cols-[minmax(0,1.55fr)_minmax(190px,0.75fr)]">
          <div className="min-w-0 border-slate-200 p-3 sm:p-5 md:border-r">
            <p className="text-[10px] font-bold text-violet-700 sm:text-xs">Question 37</p>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-950 sm:text-sm">
              Select the most appropriate meaning of the given idiom.
            </p>
            <p className="mt-1.5 text-xs font-semibold text-slate-800 sm:text-sm">Spill the beans</p>
            <div className="mt-3 space-y-2">
              {OPTIONS.map((option) => (
                <div
                  key={option.key}
                  className={`flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] sm:text-xs ${
                    option.selected
                      ? 'border-violet-600 bg-violet-50 text-slate-950'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    option.selected ? 'border-violet-600 bg-violet-600' : 'border-slate-300'
                  }`}>
                    {option.selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                  </span>
                  <span><strong>{option.key}.</strong> {option.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-[10px] font-bold text-slate-700 sm:px-3 sm:text-xs">
                <Bookmark className="h-3.5 w-3.5" /> Mark for Review
              </span>
              <span className="inline-flex min-h-10 items-center rounded-lg bg-violet-700 px-3 text-[10px] font-bold text-white sm:px-4 sm:text-xs">
                Save &amp; Next <span className="ml-1.5">→</span>
              </span>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/60 p-3 sm:p-4 md:border-t-0">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-semibold text-slate-600 sm:text-[9px]">
              <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-300" />Answered</span>
              <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-violet-500" />Review</span>
              <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-white" />Not visited</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5 md:grid-cols-4">
              {PALETTE.map((item, index) => (
                <span
                  key={item.number}
                  className={`${index >= 6 ? 'hidden sm:flex' : 'flex'} h-8 items-center justify-center rounded-md border text-[10px] font-bold ${paletteTone(item.state)}`}
                >
                  {item.state === 'answered' ? <Check className="mr-0.5 h-2.5 w-2.5" /> : null}
                  {item.number}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="relative ml-auto mt-3 w-[180px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-18px_rgba(49,46,129,0.35)] sm:absolute sm:bottom-0 sm:right-5 sm:mt-0 sm:w-[210px] lg:-right-2"
      >
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Sample Result</p>
        <p className="mt-1 text-3xl font-bold text-violet-700">146.5 <span className="text-sm text-slate-700">/ {exam.maxMarks}</span></p>
        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-600"><span className="h-1 w-1 rounded-full bg-emerald-600" /></span>
          82% Accuracy
        </p>
        <span className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-violet-700 text-xs font-bold text-white">
          <BarChart3 className="h-4 w-4" /> Full Analysis
        </span>
      </div>
    </article>
  );
}
