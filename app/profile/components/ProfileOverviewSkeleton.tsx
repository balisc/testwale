export default function ProfileOverviewSkeleton() {
  return (
    <div className="animate-pulse motion-reduce:animate-none space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading profile">
      <div className="h-48 rounded-2xl border border-[#E2E8F0] bg-white sm:h-52" />
      <div className="h-24 rounded-2xl border border-[#E2E8F0] bg-white" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-56 rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 rounded-2xl border border-[#E2E8F0] bg-white" />
        <div className="h-40 rounded-2xl border border-[#E2E8F0] bg-white" />
      </div>
    </div>
  );
}
