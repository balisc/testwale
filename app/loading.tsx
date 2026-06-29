export default function Loading() {
  return (
    <div className="min-h-[60vh] bg-slate-50 px-4 py-24 text-slate-900" role="status" aria-live="polite">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-10 w-full max-w-xl animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white" />
          ))}
        </div>
        <span className="sr-only">Loading page content</span>
      </div>
    </div>
  );
}
