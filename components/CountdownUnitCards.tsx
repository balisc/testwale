import { padCountdownUnit } from '@/lib/qualityUpgradeAnnouncement';

export type CountdownUnitLabels = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type CountdownUnitCardsProps = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  labels: CountdownUnitLabels;
  ariaLabel: string;
  id?: string;
  size?: 'sm' | 'md';
  className?: string;
};

function CountdownCard({
  label,
  value,
  size,
}: {
  label: string;
  value: string;
  size: 'sm' | 'md';
}) {
  const valueClass =
    size === 'sm'
      ? 'font-heading text-xl font-bold tabular-nums text-brand sm:text-2xl'
      : 'font-heading text-2xl font-bold tabular-nums text-brand sm:text-3xl';
  const padClass = size === 'sm' ? 'px-2.5 py-2.5 sm:px-3 sm:py-3' : 'px-3 py-3 sm:px-4 sm:py-3.5';

  return (
    <div
      className={`flex min-w-0 flex-col items-center rounded-xl border border-[#DDD6FE] bg-[#FAF5FF] ${padClass}`}
    >
      <span className={valueClass}>{value}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-brand/80 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

export default function CountdownUnitCards({
  days,
  hours,
  minutes,
  seconds,
  labels,
  ariaLabel,
  id,
  size = 'md',
  className = '',
}: CountdownUnitCardsProps) {
  return (
    <div
      id={id}
      role="timer"
      aria-live="off"
      aria-label={ariaLabel}
      className={`grid grid-cols-2 gap-2 min-[480px]:grid-cols-4 sm:gap-3 ${className}`}
    >
      <CountdownCard label={labels.days} value={String(days)} size={size} />
      <CountdownCard label={labels.hours} value={padCountdownUnit(hours)} size={size} />
      <CountdownCard label={labels.minutes} value={padCountdownUnit(minutes)} size={size} />
      <CountdownCard label={labels.seconds} value={padCountdownUnit(seconds)} size={size} />
    </div>
  );
}
