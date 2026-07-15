'use client';

import { useState } from 'react';
import Link from 'next/link';

type LangMode = 'en' | 'hi' | 'both';
type OptionKey = 'A' | 'B' | 'C' | 'D';

const QUESTION = {
  en: 'Which article of the Indian Constitution deals with the Right to Equality?',
  hi: 'भारतीय संविधान का कौन-सा अनुच्छेद समानता के अधिकार से संबंधित है?',
  options: {
    A: { en: 'Article 14-18', hi: 'अनुच्छेद 14-18' },
    B: { en: 'Article 19-22', hi: 'अनुच्छेद 19-22' },
    C: { en: 'Article 23-24', hi: 'अनुच्छेद 23-24' },
    D: { en: 'Article 25-28', hi: 'अनुच्छेद 25-28' },
  },
  correct: 'A' as OptionKey,
  explanation: {
    en: 'Articles 14 to 18 under Part III guarantee equality before the law and prohibit discrimination.',
    hi: 'भाग III के अनुच्छेद 14 से 18 कानून के समक्ष समानता सुनिश्चित करते हैं और भेदभाव को प्रतिबंधित करते हैं।',
  },
  facts: [
    {
      en: 'Article 14 covers equality before law and equal protection of laws.',
      hi: 'अनुच्छेद 14 कानून के समक्ष समानता से जुड़ा है।',
    },
    {
      en: 'Article 17 abolishes untouchability.',
      hi: 'अनुच्छेद 17 अस्पृश्यता को समाप्त करता है।',
    },
  ],
};

const LANG_OPTIONS: { id: LangMode; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'both', label: 'Both' },
];

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D'];

export default function HomeDemo() {
  const [lang, setLang] = useState<LangMode>('both');
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && selected === QUESTION.correct;
  const isWrong = submitted && selected !== null && selected !== QUESTION.correct;

  return (
    <section id="demo" className="border-y border-purple-200 bg-[#F5F3FF]">
      <div className="home-container w-full max-w-6xl py-16 sm:py-20 max-[479px]:py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl max-[479px]:text-2xl">
            Try a Question Now
          </h2>
          <p className="mt-3 text-base text-slate-500 max-[479px]:text-sm">
            Experience bilingual practice with clear, useful explanations.
          </p>
        </div>

        <div className="mt-10 grid min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg md:grid-cols-2 max-[479px]:mt-8">
          <div className="min-w-0 border-b border-slate-200 p-5 sm:p-7 md:border-b-0 md:border-r max-[479px]:p-3">
            <div className="inline-flex max-w-full flex-wrap rounded-full border border-slate-200 bg-zinc-50 p-0.5 text-xs font-semibold max-[479px]:text-[11px]">
              {LANG_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLang(item.id)}
                  className={`rounded-full px-3 py-1.5 transition max-[479px]:px-2.5 ${
                    lang === item.id ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2">
              {lang !== 'hi' ? (
                <p className="break-words text-base font-semibold leading-7 text-zinc-900 max-[479px]:text-sm max-[479px]:leading-6">
                  {QUESTION.en}
                </p>
              ) : null}
              {lang !== 'en' ? (
                <p
                  className={`break-words text-sm leading-6 max-[479px]:text-xs max-[479px]:leading-5 ${
                    lang === 'both' ? 'text-slate-500' : 'font-semibold text-zinc-900'
                  }`}
                >
                  {QUESTION.hi}
                </p>
              ) : null}
            </div>

            <div className="mt-6 space-y-2.5">
              {OPTION_KEYS.map((key) => {
                const opt = QUESTION.options[key];
                const chosen = selected === key;
                let stateClass = 'border-slate-200 hover:border-violet-200 hover:bg-violet-50';
                if (submitted && key === QUESTION.correct) stateClass = 'border-green-600 bg-green-50';
                else if (submitted && chosen && key !== QUESTION.correct) stateClass = 'border-red-600 bg-red-50';
                else if (chosen) stateClass = 'border-violet-700 bg-violet-50';

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={submitted}
                    onClick={() => setSelected(key)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition disabled:cursor-default ${stateClass}`}
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold text-slate-500">
                      {key}
                    </span>
                    <span className="text-zinc-900">
                      {lang !== 'hi' ? <span className="block">{opt.en}</span> : null}
                      {lang !== 'en' ? (
                        <span className={`block ${lang === 'both' ? 'mt-0.5 text-slate-500' : ''}`}>{opt.hi}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2 min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center">
              <button
                type="button"
                disabled={!selected || submitted}
                onClick={() => setSubmitted(true)}
                className="inline-flex h-11 w-full min-w-0 items-center justify-center rounded-xl bg-[#6D28D9] px-4 text-[15px] font-semibold leading-none text-white transition hover:bg-[#5B21B6] disabled:cursor-not-allowed disabled:bg-slate-300 min-[480px]:w-auto min-[480px]:flex-1 [text-size-adjust:100%]"
              >
                Submit Answer
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setSubmitted(false);
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 px-5 text-[15px] font-semibold leading-none text-slate-500 transition hover:bg-zinc-50 min-[480px]:w-auto [text-size-adjust:100%]"
              >
                Skip Question
              </button>
            </div>
          </div>

          <div className="min-w-0 bg-zinc-50 p-5 sm:p-7 max-[479px]:p-3">
            {!submitted ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center max-[479px]:min-h-[200px]">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  ?
                </div>
                <p className="mt-4 text-sm font-semibold text-zinc-900">Select an answer to unlock feedback</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  Explanation, related facts and source checks appear after you submit.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {isWrong ? `Correct option: ${QUESTION.correct}` : 'Well done - keep practising.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-zinc-900">Clear Explanation</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {lang === 'hi' ? QUESTION.explanation.hi : QUESTION.explanation.en}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-zinc-900">Related Facts</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-500">
                    {QUESTION.facts.map((fact) => (
                      <li key={fact.en} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6D28D9]" />
                        {lang === 'hi' ? fact.hi : fact.en}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                      Source Verified
                    </span>
                    <Link href="/about_us" className="text-xs font-semibold text-[#6D28D9] hover:underline">
                      View official source
                    </Link>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                    <button type="button" className="text-slate-500 hover:text-zinc-900">
                      Report an Issue
                    </button>
                    <Link href="/subjects/indian-polity" className="text-[#6D28D9] hover:underline">
                      Practice Similar Question
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
