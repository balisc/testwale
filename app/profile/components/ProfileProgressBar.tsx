type ProfileProgressBarProps = {
  value: number;
  max?: number;
  label: string;
  className?: string;
  barClassName?: string;
};

export default function ProfileProgressBar({
  value,
  max = 100,
  label,
  className = '',
  barClassName = 'bg-brand',
}: ProfileProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const pct = Math.min(100, Math.max(0, Math.round((value / safeMax) * 100)));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
      aria-label={label}
      className={`h-1.5 overflow-hidden rounded-full bg-[#EDE9FE] ${className}`}
    >
      <div className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${barClassName}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
