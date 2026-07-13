const EXAMS = ['SSC', 'Railway', 'UPSC', 'State PCS', 'State One-Day Exams'] as const;

export default function BaliExamStrip() {
  return (
    <section className="border-b border-[#E4E7EC] bg-white">
      <div className="bali-container flex w-full flex-col gap-3 py-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <p className="shrink-0 text-sm font-medium text-[#667085]">
          Focused practice for major government exams
        </p>
        <div className="flex min-w-0 flex-wrap gap-2">
          {EXAMS.map((exam) => (
            <span
              key={exam}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E4E7EC] bg-[#FAFAFC] px-3 py-1.5 text-xs font-semibold text-[#344054]"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0 text-[#98A2B3]"
              >
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="whitespace-nowrap">{exam}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
