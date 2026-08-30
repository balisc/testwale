
import Link from 'next/link';
import type { ReactNode } from 'react';

export type SubjectCardState = 'active' | 'comingSoon' | 'more';

type HomeSubjectCardProps = {
  state: SubjectCardState;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  meta?: string[];
  href?: string;
  ctaLabel: string;
  showProgress?: boolean;
  progressPercent?: number;
  progressLabel?: string;
};

const cardBase =
  'group relative flex h-full min-h-[280px] min-w-0 flex-col rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-[transform,box-shadow,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D28D9] focus-visible:ring-offset-2 hover:-translate-y-0.5 hover:border-[#C4B5FD] hover:shadow-[0_10px_30px_rgba(91,33,182,0.10)] max-[479px]:min-h-[220px] max-[479px]:p-4';

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={`transition-transform duration-200 ease-out group-hover:translate-x-[3px] ${className}`}
    >
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomeSubjectCard({
  state,
  title,
  description,
  icon,
  badge,
  meta = [],
  href,
  ctaLabel,
  showProgress = false,
  progressPercent = 0,
  progressLabel,
}: HomeSubjectCardProps) {
  const muted = state === 'comingSoon' || state === 'more';
  const badgeClass =
    badge === 'Active'
      ? 'border-emerald-200 bg-[#F0FDF4] text-[#15803D]'
      : 'border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]';

  const body = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 max-[479px]:gap-2">
        <div
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 max-[479px]:h-10 max-[479px]:w-10 ${
            muted ? 'bg-[#F5F3FF]/80 text-[#7C3AED]/80' : 'bg-[#F5F3FF] text-[#6D28D9] group-hover:bg-[#EDE9FE]'
          }`}
        >
          {icon}
        </div>
        {badge ? (
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold max-[479px]:px-2 max-[479px]:text-[10px] ${badgeClass}`}>
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-5 text-xl font-bold tracking-tight text-[#18181B] max-[479px]:mt-4 max-[479px]:text-lg">{title}</h3>
      <p className="mt-2 min-h-[44px] text-[14px] leading-[22px] text-[#667085] max-[479px]:min-h-0 max-[479px]:text-[13px] max-[479px]:leading-5">
        {description}
      </p>

      {meta.length > 0 ? (
        <p className="mt-4 text-[13px] leading-5 text-[#667085]">
          {meta.map((item, index) => (
            <span key={item}>
              {index > 0 ? <span className="mx-2 text-[#D0D5DD]">•</span> : null}
              {item}
            </span>
          ))}
        </p>
      ) : null}

      {showProgress ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="font-medium text-[#667085]">Your progress</span>
            <span className="font-semibold text-[#6D28D9]">{progressPercent}%</span>
          </div>
          <div className="h-[5px] overflow-hidden rounded-full bg-[#F2F4F7]">
            <div
              className="h-full rounded-full bg-[#6D28D9] transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          {progressLabel ? <p className="mt-1.5 text-[12px] text-[#667085]">{progressLabel}</p> : null}
        </div>
      ) : null}

      <div className="mt-auto border-t border-[#F2F4F7] pt-4">
        {state === 'comingSoon' ? (
          <span className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[#667085]">
            {ctaLabel}
          </span>
        ) : (
          <span className="inline-flex min-h-[44px] w-full items-center justify-between gap-2 text-left text-[15px] font-semibold text-[#6D28D9] transition group-hover:text-[#5B21B6] max-[479px]:text-sm">
            <span className="min-w-0">{ctaLabel}</span>
            <ArrowIcon className="shrink-0" />
          </span>
        )}
      </div>
    </>
  );

  if (state === 'comingSoon') {
    return (
      <div className={`${cardBase} text-left opacity-[0.96]`} aria-label={`${title}, coming soon`}>
        {body}
      </div>
    );
  }

  if (!href) {
    return <div className={cardBase}>{body}</div>;
  }

  return (
    <Link href={href} className={cardBase} aria-label={`${title}. ${ctaLabel}`}>
      {body}
    </Link>
  );
}

export function PolityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 5.5h8.5A2.5 2.5 0 0 1 17 8v11.5H8.5A2.5 2.5 0 0 1 6 17V5.5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9h5M10 13h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 8.5h1.2A1.8 1.8 0 0 1 20 10.3V19.5h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19V8.5L12 4l7 4.5V19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 19v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MoreSubjectsIcons() {
  const tiles = [
    'M12 4a8 8 0 100 16 8 8 0 000-16zm0 0c2 2.2 3.2 4.8 3.2 8S14 17.8 12 20c-2-2.2-3.2-4.8-3.2-8S10 6.2 12 4z',
    'M8 16V8h2l2 5.5L14 8h2v8h-1.6v-5.2L12.8 16h-1.6L9.6 10.8V16H8z',
    'M9 8.5h3.8a1.7 1.7 0 010 3.4H11v1.2h2.2M9 8.5V16',
    'M8 8h3a1.8 1.8 0 010 3.6H8V8zm0 3.6L11.5 16M14 16l1.2-3.2L16.4 16',
  ];

  return (
    <div className="grid grid-cols-2 gap-1.5" aria-hidden>
      {tiles.map((d) => (
        <span
          key={d}
          className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#F5F3FF] text-[#7C3AED]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ))}
    </div>
  );
}
