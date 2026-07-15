export default function HomeSectionSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100 ${className}`}
      aria-hidden="true"
    />
  );
}
