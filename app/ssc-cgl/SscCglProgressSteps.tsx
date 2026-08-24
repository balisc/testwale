'use client';

export default function SscCglProgressSteps({ active, language }: { active: 1 | 2 | 3 | 4 | 5; language: 'en' | 'hi' }) {
  const steps = language === 'hi'
    ? ['टियर', 'विषय', 'टॉपिक', 'उपविषय', 'प्रश्न']
    : ['Tier', 'Subject', 'Topic', 'Subtopic', 'Questions'];

  return (
    <ol aria-label={language === 'hi' ? 'तैयारी के चरण' : 'Preparation steps'} className="grid w-full min-w-0 max-w-full grid-cols-5">
      {steps.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3 | 4 | 5;
        const current = step === active;
        return (
          <li key={label} aria-current={current ? 'step' : undefined} className="relative flex min-w-0 flex-col items-center px-0.5 text-center">
            {index > 0 ? <span className="absolute right-1/2 top-[18px] h-px w-full bg-slate-200" aria-hidden="true" /> : null}
            <span className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-extrabold sm:h-10 sm:w-10 sm:text-sm ${
              current
                ? 'border-violet-700 bg-violet-700 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-500'
            }`}>
              {step}
            </span>
            <span className={`mt-2 block max-w-full break-words text-[9px] font-bold leading-3 [overflow-wrap:anywhere] min-[390px]:text-[10px] sm:text-xs ${current ? 'text-violet-700' : 'text-slate-500'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
