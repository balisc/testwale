export default function ProfileInsightsSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading insights">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] lg:gap-6">
        <div className="h-56 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-56 rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
      <div className="h-64 rounded-2xl border border-[#E2E8F0] bg-white" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-48 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-48 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-48 rounded-2xl border border-[#E2E8F0] bg-white md:col-span-2 xl:col-span-1" />
      </div>
    </div>
  );
}
