import Link from 'next/link';
import HomeHeroSearch from './HomeHeroSearch';

function PracticePreviewCard() {
  return (
    <div className="relative mx-auto w-full max-w-[480px] px-3 pb-5 pt-5 sm:px-5 sm:pb-5 sm:pt-6">
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(24,24,27,0.28)] sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#F5F3FF] px-2.5 py-1 text-xs font-semibold text-[#6D28D9]">
            Indian Polity
          </span>
          <span className="rounded-lg border border-[#E4E7EC] px-2.5 py-1 text-xs font-medium text-[#667085]">
            Easy
          </span>
          <span className="rounded-lg border border-[#E4E7EC] px-2.5 py-1 text-xs font-medium text-[#667085]">
            SSC
          </span>
          <span className="ml-auto text-xs font-semibold text-[#667085]">6 / 10</span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#F5F3FF]">
          <div className="h-full w-[60%] rounded-full bg-[#6D28D9]" />
        </div>

        <p className="mt-5 text-[15px] font-semibold leading-6 text-[#18181B] sm:text-base sm:leading-7">
          Which Part of the Indian Constitution contains the Fundamental Rights?
        </p>
        <p className="mt-1 text-sm leading-6 text-[#667085]">
          भारतीय संविधान का कौन-सा भाग मौलिक अधिकारों से संबंधित है?
        </p>

        <div className="mt-5 space-y-2.5">
          {[
            { key: 'A', text: 'Part II' },
            { key: 'B', text: 'Part III', selected: true },
            { key: 'C', text: 'Part IV' },
            { key: 'D', text: 'Part IVA' },
          ].map((opt) => (
            <div
              key={opt.key}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                opt.selected
                  ? 'border-[#6D28D9] bg-[#F5F3FF] text-[#18181B]'
                  : 'border-[#E4E7EC] bg-white text-[#344054]'
              }`}
            >
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  opt.selected ? 'border-[#6D28D9] bg-[#6D28D9] text-white' : 'border-[#D0D5DD]'
                }`}
              >
                {opt.selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="min-w-0">
                <span className="font-semibold text-[#667085]">{opt.key}.</span> {opt.text}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl bg-[#6D28D9] px-4 text-[15px] font-semibold leading-none text-white [text-size-adjust:100%]"
          >
            Submit Answer
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4E7EC] text-[#667085]"
            aria-label="Bookmark"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 4h10v16l-5-3-5 3V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E4E7EC] text-[#667085]"
            aria-label="Report"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 8v5M12 16h.01M12 3l9 16H3L12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating chips — hide only when they would collide on very narrow phones */}
      <div className="absolute -left-5 -top-4 z-10 rounded-2xl border border-[#E4E7EC] bg-white px-3.5 py-3 shadow-[0_16px_40px_-24px_rgba(24,24,27,0.45)] max-[479px]:hidden lg:-left-7">
        <div className="flex items-center gap-3">
          <div className="relative h-11 w-11">
            <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#F5F3FF" strokeWidth="4" />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#6D28D9"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 18 * 0.82} ${2 * Math.PI * 18}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#6D28D9]">
              82%
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#18181B]">Accuracy</p>
            <p className="text-[11px] text-[#667085]">This week</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-4 z-10 rounded-2xl border border-[#E4E7EC] bg-white px-3.5 py-3 shadow-[0_16px_40px_-24px_rgba(24,24,27,0.45)] max-[479px]:hidden lg:-right-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">Streak</p>
        <p className="mt-0.5 text-lg font-bold text-[#18181B]">6 days</p>
      </div>
    </div>
  );
}

function formatQuestionCount(value: number | null | undefined) {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count) || count <= 0) return 'Verified Questions';
  return `${new Intl.NumberFormat('en-IN').format(Math.trunc(count))}+ Questions`;
}

export default function HomeHero({ totalQuestions }: { totalQuestions: number | null }) {
  return (
    <section className="relative overflow-hidden border-b border-[#E4E7EC] bg-[#FAFAFC]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(245,243,255,0.9),transparent_55%)]" />
      {/* md+ = desktop/tablet 2-col; stack only on phones */}
      <div className="home-container relative grid w-full gap-12 py-16 md:grid-cols-2 md:items-center md:gap-16 md:py-20 max-[767px]:gap-8 max-[767px]:py-12 max-[479px]:gap-8 max-[479px]:py-10">
        <div className="min-w-0">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1.5 text-xs font-semibold text-[#6D28D9] max-[479px]:px-2.5 max-[479px]:text-[10px] max-[479px]:leading-snug">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6D28D9]" />
            <span className="min-w-0">Built for Competitive Exam Aspirants</span>
          </p>

          <h1 className="mt-5 text-[48px] font-bold leading-[1.12] tracking-[-0.02em] text-[#18181B] md:text-[56px] md:leading-[64px] max-[767px]:text-[40px] max-[479px]:mt-4 max-[479px]:text-[28px] max-[479px]:leading-[1.15] [font-display:swap]">
            Master Every Topic.
            <span className="mt-1 block text-[#6D28D9]">One MCQ at a Time.</span>
          </h1>

          <p className="mt-5 max-w-xl text-[17px] leading-7 text-[#667085] max-[767px]:text-base max-[767px]:leading-[26px] max-[479px]:mt-4 max-[479px]:text-sm max-[479px]:leading-6">
            Practice source-verified bilingual MCQs for SSC, Railway, UPSC and State Exams—with clear
            explanations and focused progress tracking.
          </p>

          <div className="mt-8 min-w-0 max-[479px]:mt-6">
            <HomeHeroSearch />
          </div>

          <div className="mt-4 flex flex-row flex-wrap items-center gap-3 max-[479px]:mt-3 max-[479px]:flex-col max-[479px]:gap-2.5">
            <Link
              href="/subjects/indian-polity"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#6D28D9] px-6 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6] max-[479px]:h-11 max-[479px]:w-full max-[479px]:px-4 max-[479px]:text-sm"
            >
              Start Free Practice →
            </Link>
            <Link
              href="/#public-exam-explorer"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-[#E4E7EC] bg-white px-6 text-[15px] font-semibold text-[#18181B] transition hover:border-[#DDD6FE] hover:bg-[#F5F3FF] max-[479px]:h-11 max-[479px]:w-full max-[479px]:px-4 max-[479px]:text-sm"
            >
              Explore SSC Exams
            </Link>
          </div>

          <p className="mt-3 text-sm text-[#98A2B3] max-[479px]:text-xs max-[479px]:leading-5">
            No login required to practise • Sign in anytime to save progress
          </p>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#E4E7EC] pt-6 text-sm font-medium text-[#344054] max-[479px]:mt-6 max-[479px]:flex-col max-[479px]:gap-2.5 max-[479px]:pt-5 max-[479px]:text-xs">
            {[
              { label: formatQuestionCount(totalQuestions), icon: 'Q' },
              { label: 'Hindi + English', icon: '文' },
              { label: 'Clear Explanations', icon: '✓' },
            ].map((item) => (
              <div key={item.label} className="inline-flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F5F3FF] text-xs font-bold text-[#6D28D9]">
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <PracticePreviewCard />
      </div>
    </section>
  );
}
