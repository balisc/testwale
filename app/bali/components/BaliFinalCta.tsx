import Link from 'next/link';

export default function BaliFinalCta() {
  return (
    <section className="bg-[#FAFAFC] py-16 sm:py-20 max-[479px]:py-10">
      <div className="bali-container w-full">
        <div className="relative overflow-hidden rounded-2xl bg-[#6D28D9] px-6 py-12 text-center sm:px-10 sm:py-14 max-[479px]:px-3 max-[479px]:py-8">
          <div className="pointer-events-none absolute -left-8 top-8 opacity-20 max-[479px]:hidden">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden>
              <rect x="20" y="28" width="56" height="72" rx="8" stroke="white" strokeWidth="3" />
              <path d="M34 48h28M34 62h20" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -right-6 bottom-6 opacity-20 max-[479px]:hidden">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" aria-hidden>
              <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="3" />
              <path d="M50 32v18l12 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <h2 className="relative text-[28px] font-bold tracking-tight text-white sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
            Ready to Strengthen Your Preparation?
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-base text-white/85 max-[479px]:text-sm">
            Start practising now—no login required.
          </p>
          <div className="relative mt-8 flex flex-row flex-wrap items-center justify-center gap-3 max-[479px]:mt-6 max-[479px]:flex-col max-[479px]:items-stretch">
            <Link
              href="/subjects/indian-polity"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-[15px] font-semibold text-[#6D28D9] transition hover:bg-[#F5F3FF] max-[479px]:h-11 max-[479px]:w-full max-[479px]:px-4 max-[479px]:text-sm"
            >
              Start Practicing Free →
            </Link>
            <Link
              href="/subjects/indian-polity"
              className="text-[15px] font-semibold text-white/90 hover:text-white max-[479px]:text-center max-[479px]:text-sm"
            >
              Explore Indian Polity
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
