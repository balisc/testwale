import Link from 'next/link';

const POINTS = [
  'Original question wording',
  'Source-checked factual content',
  'Hindi–English meaning review',
  'Easy question-reporting process',
] as const;

const WORKFLOW = [
  'Question created',
  'Fact checked',
  'Language reviewed',
  'Published',
  'Student feedback',
] as const;

export default function BaliQuality() {
  return (
    <section className="border-y border-[#E4E7EC] bg-[#FAFAFC] py-16 sm:py-20 max-[479px]:py-10">
      <div className="bali-container grid w-full gap-10 md:grid-cols-2 md:items-center md:gap-14 max-[479px]:gap-8">
        <div className="min-w-0">
          <h2 className="text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[32px] sm:leading-[40px] max-[479px]:text-2xl">
            Practice With Better Content Confidence
          </h2>
          <p className="mt-3 text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            QuestionWale is designed to make every practice session useful, understandable and easy to
            review.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-[#344054]">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5F3FF] text-[10px] font-bold text-[#6D28D9] ring-1 ring-[#DDD6FE]">
                  ✓
                </span>
                <span className="min-w-0">{point}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/about_us"
            className="mt-6 inline-flex text-[15px] font-semibold text-[#6D28D9] hover:text-[#5B21B6] max-[479px]:text-sm"
          >
            Read Our Content Standards →
          </Link>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_16px_40px_-28px_rgba(24,24,27,0.35)] sm:p-6 max-[479px]:p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#98A2B3] max-[479px]:text-[10px] max-[479px]:tracking-wide">
            Content quality workflow
          </p>
          <ol className="mt-5 space-y-0">
            {WORKFLOW.map((step, index) => (
              <li key={step} className="relative flex gap-4 pb-5 last:pb-0 max-[479px]:gap-3">
                {index < WORKFLOW.length - 1 ? (
                  <span className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-[#E4E7EC]" aria-hidden />
                ) : null}
                <span className="relative z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#DDD6FE] bg-[#F5F3FF] text-xs font-bold text-[#6D28D9]">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-1.5">
                  <p className="text-sm font-semibold text-[#18181B]">{step}</p>
                  {index < WORKFLOW.length - 1 ? (
                    <p className="mt-0.5 text-xs text-[#98A2B3]">Then reviewed in the next stage</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-[#98A2B3]">Reports help continuous improvement</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
