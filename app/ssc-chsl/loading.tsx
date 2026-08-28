export default function SscChslLoading() {
  return (
    <main className="min-h-screen w-full bg-[#F8FAFC] px-4 py-6 sm:px-6 sm:py-8 lg:px-8" role="status" aria-live="polite">
      <div className="mx-auto w-full max-w-6xl animate-pulse">
        <div className="h-9 w-full max-w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-lg rounded bg-slate-100" />
        <div className="mt-7 h-9 w-full max-w-64 rounded-lg bg-slate-200" />
        <div className="mt-3 h-5 max-w-lg rounded bg-slate-100" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 rounded-xl border border-slate-200 bg-white" />)}</div>
        <span className="sr-only">Loading SSC CHSL page</span>
      </div>
    </main>
  );
}
