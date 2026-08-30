const STEPS = [
  {
    n: '01',
    title: 'Choose a Subject',
    body: 'Select the subject you want to strengthen.',
  },
  {
    n: '02',
    title: 'Pick a Topic',
    body: 'Focus on one topic or follow an exam practice path.',
  },
  {
    n: '03',
    title: 'Practice and Learn',
    body: 'Answer MCQs, review available explanations and track improvement.',
  },
] as const;

export default function HomeHowItWorks() {
  return (
    <section className="bg-white py-16 sm:py-20 max-[479px]:py-10">
      <div className="home-container w-full">
        <div className="max-w-2xl min-w-0">
          <h2 className="text-[28px] font-bold tracking-tight text-[#18181B] sm:text-[36px] sm:leading-[44px] max-[479px]:text-2xl">
            Practice in Three Simple Steps
          </h2>
          <p className="mt-3 text-base text-[#667085] max-[479px]:text-sm">
            Start practising in seconds and improve one topic at a time.
          </p>
        </div>

        <div className="relative mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          <div className="pointer-events-none absolute left-[16%] right-[16%] top-5 hidden h-px bg-[#E4E7EC] md:block" />
          {STEPS.map((step) => (
            <div key={step.n} className="relative">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6D28D9] text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(109,40,217,0.9)]">
                {step.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#18181B]">{step.title}</h3>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#667085]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
