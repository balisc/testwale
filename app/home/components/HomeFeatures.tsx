const FEATURES = [
  {
    title: 'Bilingual Questions',
    body: 'Practice comfortably in English, हिंदी or view both languages together.',
    icon: (
      <>
        <circle cx="9" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="15" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
  {
    title: 'Clear Explanations',
    body: 'Understand why an answer is correct with concise explanations and related facts.',
    icon: (
      <path
        d="M8 12.5l2.2 2.2L16 9M12 4l8 4v5c0 4-3.2 7.5-8 9-4.8-1.5-8-5-8-9V8l8-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: 'Topic-wise Practice',
    body: 'Focus on individual topics and strengthen one concept at a time.',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      </>
    ),
  },
  {
    title: 'Progress Tracking',
    body: 'Track attempts, accuracy, streaks and weak areas as you practise.',
    icon: (
      <path
        d="M5 16l4-4 3 3 7-7M14 8h5v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
] as const;

export default function HomeFeatures() {
  return (
    <section className="bg-white py-16 sm:py-20 max-[479px]:py-10">
      <div className="home-container w-full">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6D28D9] max-[479px]:text-[10px] max-[479px]:tracking-wide">
            Built for better preparation
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
            Why Choose QuestionWale?
          </h2>
          <p className="mt-3 text-base leading-7 text-[#667085] max-[479px]:text-sm max-[479px]:leading-6">
            Everything you need for focused, effective and transparent MCQ practice.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4 max-[479px]:mt-8 max-[479px]:gap-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E4E7EC] bg-white p-5 shadow-[0_8px_24px_-18px_rgba(24,24,27,0.35)] transition hover:-translate-y-0.5 hover:border-[#DDD6FE] hover:shadow-[0_16px_36px_-22px_rgba(109,40,217,0.35)] sm:p-6 max-[479px]:p-4"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  {feature.icon}
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-7 text-[#18181B] max-[479px]:text-base max-[479px]:leading-6">
                {feature.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-6 text-[#667085]">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
