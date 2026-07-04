'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getSubjectPageHref } from '@/lib/subjectRoutes';

type HomeSubjectCardProps = {
  subjectKey: string;
  title: string;
  questionCount: string;
  questionsLabel: string;
  imageSrc: string;
  imageAlt: string;
  englishLabel: string;
  hindiLabel: string;
  startLabel: string;
};

const CARD_BASE =
  'group grid h-full min-w-0 grid-cols-1 items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 min-[281px]:grid-cols-[minmax(0,72px)_minmax(0,1fr)] min-[281px]:gap-3 min-[360px]:grid-cols-[minmax(96px,38%)_minmax(0,1fr)] min-[360px]:gap-3.5 min-[360px]:p-4 sm:gap-4 sm:p-5 md:grid-cols-[minmax(108px,40%)_minmax(0,1fr)] md:p-6 lg:grid-cols-[168px_minmax(0,1fr)]';

export default function HomeSubjectCard({
  subjectKey,
  title,
  questionCount,
  questionsLabel,
  imageSrc,
  imageAlt,
  englishLabel,
  hindiLabel,
  startLabel,
}: HomeSubjectCardProps) {
  const href = getSubjectPageHref(subjectKey);

  return (
    <Link
      href={href}
      className="block h-full min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
      aria-label={`${title} — ${startLabel}`}
    >
      <div className={CARD_BASE}>
        <div className="relative mx-auto aspect-square w-full max-w-[88px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-[#F8FAFC] min-[281px]:mx-0 min-[281px]:max-w-[72px] min-[360px]:max-w-[148px] sm:max-w-[156px] md:max-w-[140px] lg:max-w-[168px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={168}
            height={168}
            loading="lazy"
            className="h-full w-full object-contain object-center p-1 min-[360px]:p-2 sm:p-2.5"
            sizes="(max-width: 280px) 88px, (max-width: 640px) 36vw, (max-width: 1024px) 140px, 168px"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center text-center min-[281px]:text-left">
          <h3 className="break-words text-base font-bold leading-tight text-slate-900 min-[360px]:text-lg sm:text-xl lg:text-2xl">
            {title}
          </h3>
          <p className="mt-1 text-xs min-[360px]:mt-1.5 min-[360px]:text-sm sm:text-base">
            <span className="font-bold text-brand">{questionCount}</span>{' '}
            <span className="font-normal text-slate-500">{questionsLabel}</span>
          </p>

          <div className="mt-2 flex flex-wrap justify-center gap-1.5 min-[281px]:justify-start min-[360px]:mt-3 min-[360px]:gap-2">
            <span className="rounded-md border border-brand/35 bg-white px-2 py-0.5 text-[10px] font-semibold text-brand min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-xs sm:px-3.5 sm:py-1.5 sm:text-[13px]">
              {englishLabel}
            </span>
            <span className="rounded-md border border-brand/35 bg-white px-2 py-0.5 text-[10px] font-semibold text-brand min-[360px]:px-3 min-[360px]:py-1 min-[360px]:text-xs sm:px-3.5 sm:py-1.5 sm:text-[13px]">
              {hindiLabel}
            </span>
          </div>

          <span className="mt-2 inline-flex min-h-[44px] w-full max-w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 group-hover:bg-purple-600 group-hover:text-white min-[360px]:mt-3 min-[360px]:gap-2 min-[360px]:px-4 min-[360px]:py-2.5 min-[360px]:text-sm sm:w-fit sm:justify-start sm:px-5">
            {startLabel}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 min-[360px]:h-4 min-[360px]:w-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
