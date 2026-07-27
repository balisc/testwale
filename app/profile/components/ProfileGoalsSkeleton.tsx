export default function ProfileGoalsSkeleton() {
  return (
    <div
      className="animate-pulse motion-reduce:animate-none space-y-4 sm:space-y-6"
      aria-busy="true"
      aria-label="Loading goals"
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <div className="h-72 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-72 rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
        <div className="h-56 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-56 rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
      <div className="h-64 rounded-2xl border border-[#E2E8F0] bg-white" />
    </div>
  );
}
