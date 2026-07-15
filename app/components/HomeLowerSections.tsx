'use client';

import { Fragment } from 'react';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Languages,
  LineChart,
  ListChecks,
  Lock,
  Target,
} from 'lucide-react';
import HomeGoogleCtaGraphic from '@/app/components/HomeGoogleCtaGraphic';
import HomeGoogleCtaLink from '@/app/components/HomeGoogleCtaLink';

type Lang = 'en' | 'hi';

type HomeLowerSectionsProps = {
  lang: Lang;
  stepsTitle: string;
  step1t: string;
  step1d: string;
  step2t: string;
  step2d: string;
  step3t: string;
  step3d: string;
  whyTitle: string;
  whySub: string;
  feat1t: string;
  feat1d: string;
  feat2t: string;
  feat2d: string;
  feat3t: string;
  feat3d: string;
  feat4t: string;
  feat4d: string;
  googleTitle: string;
  googleSub: string;
  secureSignIn: string;
  showGoogleCta: boolean;
};

export default function HomeLowerSections({
  lang,
  stepsTitle,
  step1t,
  step1d,
  step2t,
  step2d,
  step3t,
  step3d,
  whyTitle,
  whySub,
  feat1t,
  feat1d,
  feat2t,
  feat2d,
  feat3t,
  feat3d,
  feat4t,
  feat4d,
  googleTitle,
  googleSub,
  secureSignIn,
  showGoogleCta,
}: HomeLowerSectionsProps) {
  return (
    <>
      <section className="border-y border-slate-100 bg-[#F8FAFC] px-2.5 py-8 min-[360px]:px-5 min-[360px]:py-12 md:px-6 md:py-[72px]" aria-labelledby="steps-heading">
        <div className="mx-auto max-w-[1240px]">
          <h2 id="steps-heading" className="break-words text-center text-[clamp(1.125rem,4vw+0.5rem,2rem)] font-bold text-[#0F172A]">
            {stepsTitle}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-3 min-[360px]:mt-8 min-[360px]:gap-4 md:mt-10 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-3 lg:gap-4">
            {[
              { n: '1', icon: BookOpen, title: step1t, desc: step1d },
              { n: '2', icon: Target, title: step2t, desc: step2d },
              { n: '3', icon: ClipboardCheck, title: step3t, desc: step3d },
            ].map((step, index) => (
              <Fragment key={step.n}>
                <div className="relative flex h-full min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-[0_4px_20px_rgba(15,23,42,0.04)] min-[360px]:p-6">
                  <span className="absolute left-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#EDE9FE] text-[10px] font-bold text-brand min-[360px]:left-4 min-[360px]:top-4 min-[360px]:h-7 min-[360px]:w-7 min-[360px]:text-xs">
                    {step.n}
                  </span>
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3E8FF] text-brand min-[360px]:h-16 min-[360px]:w-16">
                    <step.icon className="h-6 w-6 min-[360px]:h-7 min-[360px]:w-7" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 break-words text-sm font-bold text-[#0F172A] min-[360px]:mt-4 min-[360px]:text-lg">{step.title}</h3>
                  <p className="mt-1.5 flex-1 break-words text-xs leading-relaxed text-slate-500 min-[360px]:mt-2 min-[360px]:text-sm">{step.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden items-center justify-center md:flex" aria-hidden="true">
                    <ArrowRight className="h-5 w-5 shrink-0 text-brand" strokeWidth={2.5} />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="px-2.5 py-8 min-[360px]:px-5 min-[360px]:py-12 md:px-6 md:py-[72px]">
        <div className="mx-auto max-w-[1240px] space-y-5 md:space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-[#DDD6FE] bg-[#FAF5FF]/50 px-4 py-8 min-[360px]:px-6 min-[360px]:py-10">
            <div
              className="pointer-events-none absolute left-3 top-3 h-16 w-16 opacity-30 min-[360px]:left-5 min-[360px]:top-5"
              style={{
                backgroundImage: 'radial-gradient(circle, #A78BFA 1.5px, transparent 1.5px)',
                backgroundSize: '10px 10px',
              }}
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute right-3 top-3 h-16 w-16 opacity-30 min-[360px]:right-5 min-[360px]:top-5"
              style={{
                backgroundImage: 'radial-gradient(circle, #A78BFA 1.5px, transparent 1.5px)',
                backgroundSize: '10px 10px',
              }}
              aria-hidden="true"
            />

            <div className="relative text-center">
              <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold text-[#0F172A]">{whyTitle}</h2>
              <p className="mt-3 text-sm text-slate-500 min-[360px]:text-base">{whySub}</p>
            </div>

            <div className="relative mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-10 lg:grid-cols-4 lg:gap-5">
              {[
                { icon: Languages, title: feat1t, desc: feat1d },
                { icon: FileText, title: feat2t, desc: feat2d },
                { icon: ListChecks, title: feat3t, desc: feat3d },
                { icon: LineChart, title: feat4t, desc: feat4d },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm min-[360px]:p-6"
                >
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <feat.icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-[#0F172A]">{feat.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {showGoogleCta && (
            <div className="flex flex-col items-stretch gap-5 rounded-2xl border border-[#DDD6FE] bg-[#F5F3FF] p-5 min-[360px]:gap-6 min-[360px]:p-6 sm:flex-row sm:items-center sm:gap-6 lg:gap-8 lg:p-8">
              <HomeGoogleCtaGraphic />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-[#0F172A] min-[360px]:text-xl">{googleTitle}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{googleSub}</p>
              </div>
              <div className="mx-auto flex w-full min-w-0 max-w-[17.5rem] flex-col sm:mx-0 sm:w-[clamp(10rem,30vw,17.5rem)] sm:flex-shrink-0">
                <HomeGoogleCtaLink />
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {secureSignIn}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
