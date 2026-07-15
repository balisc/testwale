import Link from 'next/link';

export default function HomeProgress() {
  return (
    <section className="bg-[#F5F3FF] py-16 sm:py-20 max-[479px]:py-10">
      <div className="home-container grid w-full gap-10 md:grid-cols-2 md:items-center md:gap-14 max-[479px]:gap-8">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9] max-[479px]:text-[10px] max-[479px]:tracking-wide">
            Smarter practice
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
            Turn Every Attempt Into Progress
          </h2>
          <p className="mt-3 text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            Understand what you have mastered, identify weak areas and continue from where you left.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-[#344054]">
            {[
              'Accuracy by subject and topic',
              'Strong and weak areas',
              'Daily and weekly activity',
              'Streak tracking',
              'Bookmarks and mistake practice',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#6D28D9] ring-1 ring-[#DDD6FE]">
                  ✓
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/#sign-in"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#6D28D9] px-5 text-[15px] font-semibold text-white transition hover:bg-[#5B21B6] max-[479px]:w-full max-[479px]:px-4 max-[479px]:text-sm"
          >
            Explore Progress Features →
          </Link>
        </div>

        <div className="min-w-0 rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_24px_60px_-32px_rgba(24,24,27,0.35)] sm:p-6 max-[479px]:p-3">
          <div className="flex items-center justify-between max-[479px]:flex-col max-[479px]:items-start max-[479px]:gap-1">
            <h3 className="text-sm font-semibold text-[#18181B]">Weekly Activity</h3>
            <span className="text-xs text-[#98A2B3]">Sample preview</span>
          </div>
          <div className="mt-4 h-28 max-[479px]:h-24">
            <svg viewBox="0 0 320 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <path
                d="M0 70 C40 65, 50 40, 80 45 S120 80, 160 55 S220 20, 260 35 S300 55, 320 30"
                fill="none"
                stroke="#6D28D9"
                strokeWidth="2.5"
              />
              <path
                d="M0 70 C40 65, 50 40, 80 45 S120 80, 160 55 S220 20, 260 35 S300 55, 320 30 V100 H0 Z"
                fill="url(#homeWave)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="homeWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D28D9" />
                  <stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 max-[479px]:grid-cols-1 max-[479px]:gap-2">
            {[
              { label: 'Accuracy', value: '78%' },
              { label: 'Attempted', value: '124' },
              { label: 'Streak', value: '6 days' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#E4E7EC] bg-[#FAFAFC] px-3 py-3 max-[479px]:py-2.5"
              >
                <p className="text-[11px] font-medium text-[#98A2B3]">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-[#18181B] max-[479px]:text-base">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-[#E4E7EC] p-3.5 max-[479px]:p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#16A34A]">Strong Topics</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#344054]">
                {['Fundamental Rights', 'Preamble'].map((t) => (
                  <li key={t} className="flex min-w-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                    <span className="min-w-0">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 rounded-xl border border-[#E4E7EC] p-3.5 max-[479px]:p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#F59E0B]">Weak Topics</p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#344054]">
                {['Emergency Provisions', 'Amendments'].map((t) => (
                  <li key={t} className="flex min-w-0 items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F59E0B]" />
                    <span className="min-w-0">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href="/subjects/indian-polity"
            className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] px-4 py-3 text-sm font-semibold text-[#6D28D9] transition hover:bg-[#EDE9FE] max-[479px]:px-3"
          >
            <span className="min-w-0">Continue Practice</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
